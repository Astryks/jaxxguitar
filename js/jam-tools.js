// Jam Tools: five guitar-only practice tools.
//
//   mountChordLibrary(el)   every common chord, open + E-shape / A-shape barre
//   mountCapoCalculator(el) where to put the capo for a song or a key
//   mountStrumCheck(el)     strum your real guitar: which strings rang?
//   mountStrumTrainer(el)   strum patterns with a metronome and moving arrows
//   mountRiffOfTheDay(el)   a short riff in tab, a new one every day
//
// Each mount function is (el, opts?) => destroy(). JAM_TOOLS lists them for
// a menu. Everything reuses the app's guitar modules: shapes are checked
// by guitar-theory.js validateShape(), drawn by fretboard.js, and played by
// guitar-audio.js. Styles: css/jam-tools.css (classes start with "jt-").

import { STRING_NAMES, NOTE_NAMES, OPEN_SHAPES, midiAt, noteName, shapeMidis, chordShape, validateShape, transposeSymbol } from "./guitar-theory.js";
import { strum, playNote, mutedStrum, click, stopAllSound, getAudioContext } from "./guitar-audio.js";
import { renderFretboard, chordDiagramSvg, tabSvg } from "./fretboard.js";
import { onNoteOn } from "./input-hub.js";
import { chromaFromFrame, spectrum } from "./chord-detect.js";
import { openMicStream, releaseMicSession, friendlyMicError, ignoreMicFor, micIgnored } from "./pitch.js";
import { icon } from "./icons.js";
import { SONGS } from "./songs-data.js";
import { songPlan } from "./song-plan.js";
import { RIFFS, riffEvents } from "./riffs-data.js";

// --- small helpers -----------------------------------------------------------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ROOTS = [
  { pc: 0, name: "C" }, { pc: 1, name: "C#", alt: "Db" }, { pc: 2, name: "D" }, { pc: 3, name: "Eb", alt: "D#" },
  { pc: 4, name: "E" }, { pc: 5, name: "F" }, { pc: 6, name: "F#", alt: "Gb" }, { pc: 7, name: "G" },
  { pc: 8, name: "Ab", alt: "G#" }, { pc: 9, name: "A" }, { pc: 10, name: "Bb", alt: "A#" }, { pc: 11, name: "B" },
];
const rootLabel = (r) => (r.alt ? `${r.name}/${r.alt}` : r.name);
const STRING_LONG = ["low E", "A", "D", "G", "B", "high e"];
const FINGER = { 1: "index", 2: "middle", 3: "ring", 4: "pinky" };
const hear = (shape, capo = 0, opts = {}) => {
  if (!shape) return;
  ignoreMicFor(2600); // the mic (if any screen is listening) shouldn't judge the app's own strum
  strum(shapeMidis(shape, capo), { gain: 0.28, ...opts });
};
const arpeggio = (shape, capo = 0) => {
  if (!shape) return;
  ignoreMicFor(3200);
  shapeMidis(shape, capo).forEach((m, i) => playNote(m, { delay: i * 0.32, duration: 1.6, gain: 0.3 }));
};

// ============================================================================
// 1. Chord library
// ============================================================================
const TYPES = [
  { id: "", label: "Major", suffix: "" },
  { id: "m", label: "Minor", suffix: "m" },
  { id: "7", label: "7", suffix: "7" },
  { id: "maj7", label: "maj7", suffix: "maj7" },
  { id: "m7", label: "m7", suffix: "m7" },
  { id: "sus2", label: "sus2", suffix: "sus2" },
  { id: "sus4", label: "sus4", suffix: "sus4" },
  { id: "add9", label: "add9", suffix: "add9" },
  { id: "5", label: "Power (5)", suffix: "5" },
];
const TYPE_WORDS = { "": "major", m: "minor", 7: "seventh dominant 7", maj7: "major seventh maj7", m7: "minor seventh m7", sus2: "suspended sus2", sus4: "suspended sus4", add9: "add9 added ninth", 5: "power chord 5" };

// Movable barre shapes, relative to the barre fret r. null = don't play.
// E-shape: root on the 6th string; A-shape: root on the 5th string.
const BARRE = {
  E: {
    "": { rel: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], barre: true },
    m: { rel: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1], barre: true },
    7: { rel: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1], barre: true },
    maj7: { rel: [0, null, 1, 1, 0, null], fingers: [2, 0, 3, 4, 1, 0] },
    m7: { rel: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1], barre: true },
    sus4: { rel: [0, 2, 2, 2, 0, 0], fingers: [1, 2, 3, 4, 1, 1], barre: true },
    add9: { rel: [0, null, 2, 1, 0, 2], fingers: [1, 0, 3, 2, 1, 4] },
    5: { rel: [0, 2, 2, null, null, null], fingers: [1, 3, 4, 0, 0, 0] },
  },
  A: {
    "": { rel: [null, 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1], barre: true },
    m: { rel: [null, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1], barre: true },
    7: { rel: [null, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1], barre: true },
    maj7: { rel: [null, 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1], barre: true },
    m7: { rel: [null, 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1], barre: true },
    sus2: { rel: [null, 0, 2, 2, 0, 0], fingers: [0, 1, 3, 4, 1, 1], barre: true },
    sus4: { rel: [null, 0, 2, 2, 3, 0], fingers: [0, 1, 2, 3, 4, 1], barre: true },
    add9: { rel: [null, 0, 2, 4, 2, 0], fingers: [0, 1, 2, 4, 3, 1], barre: true },
    5: { rel: [null, 0, 2, 2, null, null], fingers: [0, 1, 3, 4, 0, 0] },
  },
};
// Easy open voicings the shared shape table doesn't have (each one is
// still checked by validateShape before it's shown).
const EXTRA_OPEN = {
  F: { frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], barre: 1, label: "Easy F (4 strings)" },
  Bm7: { frets: [-1, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3] },
  Csus2: { frets: [-1, 3, 0, 0, 1, 3], fingers: [0, 3, 0, 0, 1, 4] },
  Csus4: { frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1] },
  Gsus2: { frets: [3, 0, 0, 0, 3, 3], fingers: [2, 0, 0, 0, 3, 4] },
  Gsus4: { frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4] },
  Aadd9: { frets: [-1, 0, 2, 4, 2, 0], fingers: [0, 0, 1, 4, 2, 0] },
};

function barreShape(kind, rootPc, type) {
  const tpl = BARRE[kind][type];
  if (!tpl) return null;
  const r = (rootPc - (kind === "E" ? 4 : 9) + 12) % 12;
  if (r === 0) return null; // that's the open chord
  const frets = tpl.rel.map((d) => (d === null ? -1 : r + d));
  return { frets, fingers: tpl.fingers, barre: tpl.barre ? r : undefined, fret: r, kind };
}

// All voicings of one chord, open ones first, each one validated.
const voicingCache = new Map();
function chordVoicings(rootPc, type) {
  const key = `${rootPc}|${type}`;
  if (voicingCache.has(key)) return voicingCache.get(key);
  const root = ROOTS[rootPc];
  const names = [root.name + type, ...(root.alt ? [root.alt + type] : [])];
  const sym = names[0];
  const out = [];
  const seen = new Set();
  const add = (shape, label, kind) => {
    if (!shape) return;
    const k = shape.frets.join(",");
    if (seen.has(k)) return;
    if (!validateShape(sym, shape).ok) return;
    seen.add(k);
    out.push({ ...shape, symbol: sym, label, kind });
  };
  for (const n of names) {
    const o = OPEN_SHAPES[n];
    if (o && !o.barre && o.frets.includes(0)) add(o, "Open chord", "open");
    const x = EXTRA_OPEN[n];
    if (x) add(x, x.label || "Open chord", x.frets.includes(0) ? "open" : "easy");
  }
  const bar = ["E", "A"].map((k) => barreShape(k, rootPc, type)).filter(Boolean).sort((a, b) => a.fret - b.fret);
  bar.forEach((b) => add(b, `${b.kind}-shape${b.barre ? " barre" : ""}, fret ${b.fret}`, b.kind));
  voicingCache.set(key, out);
  return out;
}

const ALL_CHORDS = [];
ROOTS.forEach((r) => TYPES.forEach((t) => {
  const names = [r.name + t.suffix, ...(r.alt ? [r.alt + t.suffix] : [])];
  ALL_CHORDS.push({ rootPc: r.pc, type: t.id, name: names[0], names, hay: `${names.join(" ")} ${TYPE_WORDS[t.id]}`.toLowerCase() });
}));

function chordNotesText(shape) {
  const pcs = [];
  shapeMidis(shape).forEach((m) => { const n = noteName(m); if (!pcs.includes(n)) pcs.push(n); });
  return pcs.join(" · ");
}

function mountChordLibrary(el, opts = {}) {
  let root = opts.root ?? "all";
  let type = opts.type ?? "";
  let query = "";
  let current = null; // { chord, vi }
  let fb = null;
  el.innerHTML = `
    <section class="jt jt-lib" aria-label="Chord library">
      <div class="jt-head"><h2 class="jt-title">${icon("guitar", 22)} Chord library</h2>
        <p class="jt-sub">Every common chord: the open shape and the barre shapes you can slide anywhere.</p></div>
      <label class="jt-search"><span class="jt-sr">Search chords</span>${icon("search", 18)}
        <input type="search" class="jt-input jt-lib-q" placeholder="Search: F#m, Bb7, sus4…" autocomplete="off" spellcheck="false"></label>
      <div class="jt-filter" role="group" aria-label="Root note">
        <span class="jt-flabel">Root</span>
        <div class="jt-chips jt-lib-roots">
          <button type="button" class="jg-pill" data-root="all">All</button>
          ${ROOTS.map((r) => `<button type="button" class="jg-pill" data-root="${r.pc}">${rootLabel(r)}</button>`).join("")}
        </div>
      </div>
      <div class="jt-filter" role="group" aria-label="Chord type">
        <span class="jt-flabel">Type</span>
        <div class="jt-chips jt-lib-types">
          <button type="button" class="jg-pill" data-type="all">All</button>
          ${TYPES.map((t) => `<button type="button" class="jg-pill" data-type="${t.id}">${t.label}</button>`).join("")}
        </div>
      </div>
      <div class="jt-lib-detail" hidden></div>
      <p class="jt-count jg-note" aria-live="polite"></p>
      <div class="jt-grid jt-lib-grid"></div>
    </section>`;
  const $ = (s) => el.querySelector(s);
  const grid = $(".jt-lib-grid");
  const detail = $(".jt-lib-detail");

  function filtered() {
    const q = query.trim().toLowerCase().replace(/\s+/g, "");
    return ALL_CHORDS.filter((c) => {
      if (q) return c.names.some((n) => n.toLowerCase().startsWith(q)) || c.hay.includes(query.trim().toLowerCase());
      return (root === "all" || c.rootPc === Number(root)) && (type === "all" || c.type === type);
    });
  }
  function renderGrid() {
    el.querySelectorAll("[data-root]").forEach((b) => { const on = !query && String(root) === b.dataset.root; b.classList.toggle("jg-pill-active", on); b.setAttribute("aria-pressed", on); });
    el.querySelectorAll("[data-type]").forEach((b) => { const on = !query && String(type) === b.dataset.type; b.classList.toggle("jg-pill-active", on); b.setAttribute("aria-pressed", on); });
    const list = filtered();
    $(".jt-count").textContent = list.length ? `${list.length} chord${list.length === 1 ? "" : "s"}${query ? ` matching “${query.trim()}”` : ""}. Tap one to see it big.` : "No chords match. Try a root like “F#” or a type like “sus4”.";
    grid.innerHTML = list.map((c) => {
      const v = chordVoicings(c.rootPc, c.type);
      const main = v[0];
      const tag = !main ? "" : main.kind === "open" ? "Open" : main.kind === "easy" ? "Easy" : `Barre ${main.fret}`;
      return `<button type="button" class="jt-chord-card ${current && current.chord === c ? "jt-on" : ""}" data-chord="${esc(c.name)}" aria-label="${esc(c.names.join(" or "))} chord${tag ? ", " + tag : ""}">
        ${main ? chordDiagramSvg(main, c.name) : `<span class="jt-nodiag">${esc(c.name)}</span>`}
        <span class="jt-chord-tag">${tag}${v.length > 1 ? ` · ${v.length} shapes` : ""}</span></button>`;
    }).join("");
  }
  function renderDetail() {
    if (!current) { detail.hidden = true; return; }
    const { chord, vi } = current;
    const v = chordVoicings(chord.rootPc, chord.type);
    const shape = v[vi];
    const typeLabel = TYPES.find((t) => t.id === chord.type).label;
    detail.hidden = false;
    detail.innerHTML = `
      <div class="jg-card jt-detail">
        <div class="jt-detail-top">
          <div><div class="jt-big-name">${esc(chord.names.join(" / "))}</div>
          <div class="jt-sub">${esc(typeLabel === "Power (5)" ? "Power chord (root + 5th)" : typeLabel + " chord")} · notes ${esc(chordNotesText(shape))}</div></div>
          <button type="button" class="jg-btn jg-btn-small jt-close" aria-label="Close chord">✕</button>
        </div>
        <div class="jt-chips jt-voicings" role="group" aria-label="Ways to play it">
          ${v.map((s, i) => `<button type="button" class="jg-pill ${i === vi ? "jg-pill-active" : ""}" aria-pressed="${i === vi}" data-vi="${i}">${esc(s.label)}</button>`).join("")}
        </div>
        <div class="jt-detail-body">
          <div class="jt-bigdiag">${chordDiagramSvg(shape, chord.name)}</div>
          <p class="jt-howto">${esc(howToPlay(shape))}</p>
        </div>
        <div class="jt-fb"></div>
        <div class="jg-row jt-actions">
          <button type="button" class="jg-btn jg-btn-primary jt-hear">${icon("speaker", 18)} Hear it</button>
          <button type="button" class="jg-btn jt-arp">${icon("play", 18)} One string at a time</button>
        </div>
      </div>`;
    fb?.destroy();
    fb = renderFretboard(detail.querySelector(".jt-fb"), { frets: 15, fit: true });
    fb.showShape(shape);
  }
  function howToPlay(s) {
    const muted = s.frets.map((f, i) => (f < 0 ? STRING_LONG[i] : null)).filter(Boolean);
    const parts = [];
    if (s.kind === "E" || s.kind === "A") {
      parts.push(`${s.barre ? `Lay your index finger flat across fret ${s.fret}` : `Index finger on fret ${s.fret}`}; the root is on the ${s.kind === "E" ? "6th (low E)" : "5th (A)"} string.`);
      parts.push(`Slide this same shape up or down to play any ${s.symbol.replace(/^[A-G][#b]?/, "") || "major"} chord.`);
    } else if (s.kind === "open") parts.push("Uses open strings, so it rings out bright and full.");
    if (muted.length) parts.push(`Don't play the ${muted.join(" and ")} string${muted.length > 1 ? "s" : ""}.`);
    return parts.join(" ");
  }
  function openChord(name) {
    const chord = ALL_CHORDS.find((c) => c.name === name);
    if (!chord) return;
    current = { chord, vi: 0 };
    renderDetail();
    renderGrid();
    detail.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    hear(chordVoicings(chord.rootPc, chord.type)[0]);
  }

  const onClick = (e) => {
    const b = e.target.closest("button");
    if (!b || !el.contains(b)) return;
    if (b.dataset.root !== undefined) { root = b.dataset.root; query = ""; $(".jt-lib-q").value = ""; renderGrid(); }
    else if (b.dataset.type !== undefined) { type = b.dataset.type; query = ""; $(".jt-lib-q").value = ""; renderGrid(); }
    else if (b.dataset.chord) openChord(b.dataset.chord);
    else if (b.dataset.vi !== undefined) { current.vi = Number(b.dataset.vi); renderDetail(); hear(chordVoicings(current.chord.rootPc, current.chord.type)[current.vi]); }
    else if (b.classList.contains("jt-hear")) hear(chordVoicings(current.chord.rootPc, current.chord.type)[current.vi]);
    else if (b.classList.contains("jt-arp")) arpeggio(chordVoicings(current.chord.rootPc, current.chord.type)[current.vi]);
    else if (b.classList.contains("jt-close")) { current = null; fb?.destroy(); fb = null; renderDetail(); renderGrid(); }
  };
  const onInput = (e) => { if (e.target.classList.contains("jt-lib-q")) { query = e.target.value; renderGrid(); } };
  el.addEventListener("click", onClick);
  el.addEventListener("input", onInput);
  renderGrid();
  if (opts.chord) openChord(opts.chord);
  return () => {
    el.removeEventListener("click", onClick);
    el.removeEventListener("input", onInput);
    fb?.destroy();
    el.innerHTML = "";
  };
}

// ============================================================================
// 2. Capo calculator
// ============================================================================
// Same "easy open shape" list the app's suggestCapo() scores with.
const EASY = new Set(["G", "C", "D", "Em", "Am", "E", "A", "Dm", "E7", "A7", "D7", "G7", "C7", "B7", "Cmaj7", "Fmaj7", "Am7", "Em7", "Dm7", "Asus2", "Asus4", "Dsus2", "Dsus4", "Cadd9", "Esus4"]);
const FAMILIES = { G: "G family (G, C, D, Em)", C: "C family (C, F, G, Am)", D: "D family (D, G, A, Bm)", A: "A family (A, D, E, F#m)", E: "E family (E, A, B, C#m)", Em: "Em family (Em, Am, C, D, G)", Am: "Am family (Am, Dm, Em, F, G)", Dm: "Dm family (Dm, Gm, Am, Bb, C)" };

function capoOptions(chords) {
  const unique = [...new Set(chords)];
  const out = [];
  for (let capo = 0; capo <= 7; capo++) {
    const map = unique.map((c) => [c, transposeSymbol(c, -capo)]);
    if (!map.every(([, s]) => chordShape(s))) continue;
    const easy = map.filter(([, s]) => EASY.has(s.replace(/\/.*/, ""))).length;
    out.push({ capo, map, easy, total: unique.length, score: easy - capo * 0.15 });
  }
  return out;
}
function keyChords(rootPc, minor) {
  const n = (iv) => NOTE_NAMES[(rootPc + iv) % 12];
  return minor ? [n(0) + "m", n(5) + "m", n(7) + "m", n(8), n(10)] : [n(0), n(5), n(7), n(9) + "m"];
}

function mountCapoCalculator(el, opts = {}) {
  let mode = opts.mode || "song";
  let result = null; // { title, sub, chords, options, pick, family? }
  el.innerHTML = `
    <section class="jt jt-capo" aria-label="Capo calculator">
      <div class="jt-head"><h2 class="jt-title">${icon("song", 22)} Capo calculator</h2>
        <p class="jt-sub">Play any song with easy open shapes: clip the capo on and use G, C, D, E or A family chords.</p></div>
      <div class="jt-seg" role="tablist" aria-label="Find a capo for">
        <button type="button" role="tab" class="jt-seg-btn" data-mode="song">A song</button>
        <button type="button" role="tab" class="jt-seg-btn" data-mode="key">A key</button>
      </div>
      <div class="jt-capo-song">
        <label class="jt-search"><span class="jt-sr">Search songs</span>${icon("search", 18)}
          <input type="search" class="jt-input jt-capo-q" placeholder="Song or artist…" autocomplete="off" spellcheck="false"></label>
        <ul class="jt-songlist" aria-label="Songs"></ul>
      </div>
      <div class="jt-capo-key" hidden>
        <div class="jt-filter"><span class="jt-flabel">Key</span><div class="jt-chips">${ROOTS.map((r) => `<button type="button" class="jg-pill" data-kroot="${r.pc}">${rootLabel(r)}</button>`).join("")}</div></div>
        <div class="jt-filter"><span class="jt-flabel">Mode</span><div class="jt-chips"><button type="button" class="jg-pill" data-kmin="0">Major</button><button type="button" class="jg-pill" data-kmin="1">Minor</button></div></div>
      </div>
      <div class="jt-capo-result" aria-live="polite"></div>
    </section>`;
  const $ = (s) => el.querySelector(s);
  let kRoot = 0;
  let kMin = false;

  const playable = SONGS.filter((s) => s.title && Array.isArray(s.chords));
  function renderSongs() {
    const q = $(".jt-capo-q").value.trim().toLowerCase();
    let list = q ? playable.filter((s) => `${s.title} ${s.artist || ""}`.toLowerCase().includes(q)) : [...playable].sort((a, b) => (a.popularityRank || 999) - (b.popularityRank || 999));
    const total = list.length;
    list = list.slice(0, q ? 30 : 8);
    $(".jt-songlist").innerHTML = list.length
      ? list.map((s) => `<li><button type="button" class="jt-song" data-song="${esc(s.title)}"><b>${esc(s.title)}</b><span>${esc(s.artist || "")}${s.key ? ` · ${esc(s.key)}` : ""}</span></button></li>`).join("") + (total > list.length ? `<li class="jg-note jt-more">${q ? `${total - list.length} more: keep typing to narrow it down.` : "Type to search the whole song list."}</li>` : "")
      : `<li class="jg-note">No songs found. Try the “A key” tab instead.</li>`;
  }
  function pickSong(title) {
    const song = playable.find((s) => s.title === title);
    if (!song) return;
    const plan = songPlan(song);
    if (!plan.playable) {
      result = { title: song.title, sub: song.artist, none: true };
    } else {
      const options = capoOptions(plan.chords).filter((o) => o.capo === plan.capo || o.easy * 2 >= o.total);
      const pick = Math.max(0, options.findIndex((o) => o.capo === plan.capo));
      result = { title: song.title, sub: `${song.artist || ""}${song.key ? ` · ${song.key}` : ""}`, chords: plan.chords, options, pick, best: pick };
    }
    renderResult();
    $(".jt-capo-result").scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }
  function pickKey() {
    const name = NOTE_NAMES[kRoot] + (kMin ? "m" : "");
    const chords = keyChords(kRoot, kMin);
    const all = capoOptions(chords);
    const top = all.reduce((b, o) => (o.score > b.score ? o : b), all[0]);
    const options = all.filter((o) => o === top || o.easy * 2 >= o.total);
    const best = options.indexOf(top);
    result = { title: `Key of ${ROOTS[kRoot].alt ? `${ROOTS[kRoot].name} (${ROOTS[kRoot].alt})` : ROOTS[kRoot].name} ${kMin ? "minor" : "major"}`, sub: `Main chords: ${chords.join(", ")}`, chords, options, pick: best, best, keyName: name };
    renderResult();
  }
  function renderResult() {
    const box = $(".jt-capo-result");
    if (!result) { box.innerHTML = `<p class="jg-note">${mode === "song" ? "Pick a song to see where the capo goes." : "Pick a key."}</p>`; return; }
    if (result.none) {
      box.innerHTML = `<div class="jg-card"><div class="jt-big-name">${esc(result.title)}</div><p class="jt-sub">${esc(result.sub)}</p><p>This song's chords are too unusual for a simple capo trick. Open it in Songs to see the full chart.</p></div>`;
      return;
    }
    const o = result.options[result.pick];
    if (!o) { box.innerHTML = `<div class="jg-card"><p>No capo position makes this easier; play it with barre chords.</p></div>`; return; }
    const fam = result.keyName ? transposeSymbol(result.keyName, -o.capo) : null;
    box.innerHTML = `
      <div class="jg-card jt-capo-card">
        <div class="jt-big-name">${esc(result.title)}</div>
        <p class="jt-sub">${esc(result.sub)}</p>
        <div class="jt-capo-hero">
          ${capoSvg(o.capo)}
          <div><div class="jt-capo-fret">${o.capo ? `Capo on fret ${o.capo}` : "No capo needed"}</div>
          <div class="jt-sub">${fam && FAMILIES[fam] ? `Play ${esc(FAMILIES[fam])} shapes. ` : ""}${o.easy} of ${o.total} chords are easy open shapes${result.pick === result.best ? " · our pick" : ""}</div></div>
        </div>
        <div class="jt-capo-map">${o.map.map(([real, shp], i) => `
          <button type="button" class="jt-capo-chord" data-ci="${i}" aria-label="Sounds like ${esc(real)}: play the ${esc(shp)} shape${o.capo ? ` with capo ${o.capo}` : ""}. Tap to hear.">
            ${chordDiagramSvg(chordShape(shp), shp)}
            <span class="jt-capo-real">${o.capo ? `sounds as <b>${esc(real)}</b>` : `<b>${esc(real)}</b>`}</span></button>`).join("")}</div>
        <div class="jg-row jt-actions"><button type="button" class="jg-btn jg-btn-primary jt-capo-prog">${icon("play", 18)} Hear the chords</button></div>
        ${result.options.length > 1 ? `<div class="jt-flabel">Other capo spots</div><div class="jt-chips jt-capo-opts">${result.options.map((x, i) => `<button type="button" class="jg-pill ${i === result.pick ? "jg-pill-active" : ""}" aria-pressed="${i === result.pick}" data-opt="${i}">${x.capo ? `Capo ${x.capo}` : "No capo"}: ${x.map.map(([, s]) => esc(s)).join(" ")}${i === result.best ? " ★" : ""}</button>`).join("")}</div>` : ""}
      </div>`;
  }
  function capoSvg(capo) {
    // A little neck with the capo clamped on the right fret (nut on the left).
    const xs = (f) => 12 + f * 15;
    const frets = Array.from({ length: 8 }, (_, i) => `<line x1="${xs(i + 1)}" x2="${xs(i + 1)}" y1="8" y2="52" class="jt-capo-frt"/>`).join("");
    const strings = Array.from({ length: 6 }, (_, i) => `<line x1="12" x2="132" y1="${12 + i * 7.2}" y2="${12 + i * 7.2}" class="jt-capo-str"/>`).join("");
    const clamp = capo ? `<rect x="${xs(capo) - 9}" y="3" width="8" height="54" rx="3" class="jt-capo-clamp"/>` : "";
    const num = capo ? `<text x="${xs(capo) - 5}" y="70" class="jt-capo-num">${capo}</text>` : "";
    return `<svg viewBox="0 0 140 74" class="jt-capo-svg" role="img" aria-label="${capo ? `Capo on fret ${capo}` : "No capo"}"><rect x="12" y="8" width="120" height="44" rx="3" class="jt-capo-wood"/><rect x="9" y="7" width="4" height="46" class="jt-capo-nut"/>${frets}${strings}${clamp}${num}</svg>`;
  }
  let progTimer = [];
  function playProgression() {
    const o = result?.options[result.pick];
    if (!o) return;
    progTimer.forEach(clearTimeout); progTimer = [];
    const seq = result.chords.length > 1 ? result.chords : o.map.map(([c]) => c);
    const shapeOf = Object.fromEntries(o.map);
    const btns = [...el.querySelectorAll(".jt-capo-chord")];
    ignoreMicFor(seq.length * 1100 + 2000);
    seq.forEach((c, i) => {
      const sh = chordShape(shapeOf[c]);
      if (sh) strum(shapeMidis(sh, o.capo), { delay: i * 1.1, gain: 0.26 });
      progTimer.push(setTimeout(() => btns.forEach((b) => b.classList.toggle("jt-on", o.map[Number(b.dataset.ci)][0] === c)), i * 1100));
    });
    progTimer.push(setTimeout(() => btns.forEach((b) => b.classList.remove("jt-on")), seq.length * 1100 + 600));
  }
  function setMode(m) {
    mode = m;
    el.querySelectorAll("[data-mode]").forEach((b) => { b.setAttribute("aria-selected", b.dataset.mode === m); b.classList.toggle("jt-seg-on", b.dataset.mode === m); });
    $(".jt-capo-song").hidden = m !== "song";
    $(".jt-capo-key").hidden = m !== "key";
    result = null;
    if (m === "key") { markKey(); pickKey(); } else renderResult();
  }
  function markKey() {
    el.querySelectorAll("[data-kroot]").forEach((b) => { const on = Number(b.dataset.kroot) === kRoot; b.classList.toggle("jg-pill-active", on); b.setAttribute("aria-pressed", on); });
    el.querySelectorAll("[data-kmin]").forEach((b) => { const on = (b.dataset.kmin === "1") === kMin; b.classList.toggle("jg-pill-active", on); b.setAttribute("aria-pressed", on); });
  }
  const onClick = (e) => {
    const b = e.target.closest("button");
    if (!b || !el.contains(b)) return;
    if (b.dataset.mode) setMode(b.dataset.mode);
    else if (b.dataset.song) pickSong(b.dataset.song);
    else if (b.dataset.kroot !== undefined) { kRoot = Number(b.dataset.kroot); markKey(); pickKey(); }
    else if (b.dataset.kmin !== undefined) { kMin = b.dataset.kmin === "1"; markKey(); pickKey(); }
    else if (b.dataset.opt !== undefined) { result.pick = Number(b.dataset.opt); renderResult(); }
    else if (b.dataset.ci !== undefined) { const o = result.options[result.pick]; hear(chordShape(o.map[Number(b.dataset.ci)][1]), o.capo); }
    else if (b.classList.contains("jt-capo-prog")) playProgression();
  };
  const onInput = (e) => { if (e.target.classList.contains("jt-capo-q")) renderSongs(); };
  el.addEventListener("click", onClick);
  el.addEventListener("input", onInput);
  renderSongs();
  setMode(mode);
  if (opts.song) pickSong(opts.song);
  return () => {
    progTimer.forEach(clearTimeout);
    el.removeEventListener("click", onClick);
    el.removeEventListener("input", onInput);
    el.innerHTML = "";
  };
}

// ============================================================================
// 3. Strum check (microphone)
// ============================================================================
// The app's single-note mic (input-hub enableMic) hears one pitch at a time,
// so it can't tell which of six strings rang. This listens to the whole
// spectrum instead, with chord-detect.js's chroma analysis: after each
// strum (a jump in loudness) it folds the sound into 12 pitch-class bins
// and checks each string's note. Notes from input-hub (a MIDI guitar, or
// the mic if another screen already has it on) count too.
const CHECK_CHORDS = ["G", "C", "D", "Em", "Am", "E", "A", "Dm", "F", "Bm"];
const HEARD_MS = 2000;

function mountStrumCheck(el, opts = {}) {
  let chordName = opts.chord && chordShape(opts.chord) ? opts.chord : "G";
  let shape = chordShape(chordName);
  let listening = null; // { stop }
  let strumAt = 0;
  let heard = new Map(); // pc -> time heard
  let evaluated = false;
  let verdictTimer = null;
  el.innerHTML = `
    <section class="jt jt-check" aria-label="Strum check">
      <div class="jt-head"><h2 class="jt-title">${icon("mic", 22)} Strum check</h2>
        <p class="jt-sub">Hold a chord on your real guitar, strum once, and see which strings rang out clearly.</p></div>
      <div class="jt-chips jt-check-chords" role="group" aria-label="Chord">${CHECK_CHORDS.map((c) => `<button type="button" class="jg-pill" data-c="${c}">${c}</button>`).join("")}</div>
      <div class="jg-card jt-check-card">
        <div class="jt-check-top">
          <div class="jt-check-diag"></div>
          <ol class="jt-strings" aria-label="Strings"></ol>
        </div>
        <div class="jt-level" aria-hidden="true"><span></span></div>
        <p class="jt-verdict" role="status" aria-live="polite"></p>
        <div class="jg-row jt-actions">
          <button type="button" class="jg-btn jg-btn-primary jt-mic">${icon("mic", 18)} Start listening</button>
          <button type="button" class="jg-btn jt-hear">${icon("speaker", 18)} Hear it</button>
        </div>
        <p class="jg-note jt-check-help">No microphone? Tap a string above to hear what it should sound like, then pick each string on your guitar one at a time and listen for buzzes or thuds.</p>
      </div>
    </section>`;
  const $ = (s) => el.querySelector(s);

  function stringsHtml() {
    return shape.frets.map((f, s) => {
      const midi = f >= 0 ? midiAt(s, f) : null;
      const st = f < 0 ? "mute" : evaluated ? (heard.has(midi % 12) ? "ok" : "miss") : heard.has(midi % 12) ? "ok" : "wait";
      const what = f < 0 ? "don't play" : `${f === 0 ? "open" : `fret ${f}`} · ${noteName(midi)}`;
      const lab = st === "ok" ? "rang" : st === "miss" ? "not heard" : st === "mute" ? "muted on purpose" : "waiting";
      return `<li class="jt-str jt-str-${st}"><button type="button" class="jt-str-btn" data-s="${s}" ${f < 0 ? "disabled" : ""} aria-label="${STRING_LONG[s]} string, ${what}: ${lab}${f < 0 ? "" : ". Tap to hear it"}">
        <span class="jt-dot" aria-hidden="true">${f < 0 ? "×" : ""}</span><span class="jt-str-name">${STRING_NAMES[s]}</span><span class="jt-str-what">${what}</span></button></li>`;
    }).reverse().join(""); // high e on top, like the diagrams
  }
  function render() {
    el.querySelectorAll("[data-c]").forEach((b) => { const on = b.dataset.c === chordName; b.classList.toggle("jg-pill-active", on); b.setAttribute("aria-pressed", on); });
    $(".jt-check-diag").innerHTML = chordDiagramSvg(shape, chordName);
    $(".jt-strings").innerHTML = stringsHtml();
  }
  function setVerdict(text, tone = "") {
    const v = $(".jt-verdict");
    v.textContent = text;
    v.className = `jt-verdict ${tone ? "jt-" + tone : ""}`;
  }
  function idleVerdict() {
    setVerdict(listening ? `Listening… hold ${chordName} and strum all the strings once.` : `Tap “Start listening”, hold ${chordName}, and strum once.`);
  }

  // Which string probably caused a missing note, and what to fix.
  function verdict() {
    const played = shape.frets.map((f, s) => ({ f, s, midi: f >= 0 ? midiAt(s, f) : null })).filter((x) => x.f >= 0);
    const missing = played.filter((x) => !heard.has(x.midi % 12));
    if (!missing.length) return [`All ${played.length} strings rang! That ${chordName} sounds clean.`, "good"];
    if (missing.length === played.length) return ["I couldn't hear the chord clearly. Get closer to the phone and strum again.", "bad"];
    // Strings that play the same note can't be told apart by ear (or mic):
    // group them by note and give one tip per missing note, about the string
    // most likely to blame (an open string is the one that usually gets muted).
    const groups = new Map();
    missing.forEach((m) => { const pc = m.midi % 12; if (!groups.has(pc)) groups.set(pc, []); groups.get(pc).push(m); });
    const tips = [...groups.values()].slice(0, 2).map((g) => {
      const m = g.find((x) => x.f === 0) || g[0];
      const pre = g.length > 1 ? `No ${noteName(m.midi)} was heard (your ${g.map((x) => STRING_LONG[x.s]).join(" and ")} strings). ` : "";
      return pre + tipFor(m);
    });
    return [`${played.length - missing.length} of ${played.length} strings rang. ${tips.join(" ")}`, "close"];
  }
  function tipFor(m) {
    if (m.f === 0) {
      // An open string is usually muted by the finger on the next-thicker string leaning on it.
      const nb = [m.s - 1, m.s + 1].find((n) => shape.frets[n] > 0 && shape.fingers?.[n]);
      const fg = nb !== undefined ? FINGER[shape.fingers[nb]] : null;
      return `Your ${STRING_LONG[m.s]} string is muted${fg ? ` — arch your ${fg} finger so it doesn't touch it` : " — curl your fingers so they only touch their own strings"}.`;
    }
    const fg = FINGER[shape.fingers?.[m.s]] || "finger";
    return `Your ${STRING_LONG[m.s]} string is quiet — press harder with your ${fg}${fg === "finger" ? "" : " finger"}, right behind fret ${m.f}.`;
  }
  function evaluate() {
    evaluated = true;
    render();
    const [t, tone] = verdict();
    setVerdict(t, tone);
  }
  function startAttempt() {
    strumAt = performance.now();
    heard = new Map();
    evaluated = false;
    render();
    setVerdict("Heard a strum… checking each string.");
    clearTimeout(verdictTimer);
    verdictTimer = setTimeout(evaluate, HEARD_MS);
  }
  function markHeard(pcs) {
    const now = performance.now();
    pcs.forEach((pc) => heard.set(pc, now));
    if (!evaluated) render();
  }

  // Notes from the hub (MIDI guitar, or a mic another screen turned on).
  const offNote = onNoteOn((midi, src) => {
    if (src === "screen") return;
    if (!strumAt || performance.now() - strumAt > HEARD_MS) startAttempt();
    markHeard([midi % 12]);
  });

  async function startMic() {
    const btn = $(".jt-mic");
    btn.disabled = true;
    try {
      const stream = await openMicStream();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      const N = ctx.sampleRate > 60000 ? 16384 : 8192;
      analyser.fftSize = N;
      source.connect(analyser);
      const buf = new Float32Array(N);
      const windowMs = (1000 * N) / ctx.sampleRate;
      let floor = 0.003, last = 0, lastOnset = -1e9, pending = null;
      const bar = $(".jt-level span");
      const timer = setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        let e = 0;
        for (let i = N - 1024; i < N; i++) e += buf[i] * buf[i];
        const level = Math.sqrt(e / 1024);
        if (bar) bar.style.width = `${Math.min(100, level * 600)}%`;
        if (micIgnored()) { pending = null; last = level; return; }
        const now = performance.now();
        floor = Math.min(Math.max(0.002, floor * 1.02), Math.max(0.002, level));
        // Same strum test as chord-detect.js: a sudden jump in loudness.
        if (level > Math.max(0.01, floor * 3) && level > last * 1.6 && now - lastOnset > 400) {
          lastOnset = now;
          pending = { at: now, frames: [], before: spectrum(buf) };
          startAttempt();
        }
        last = level;
        if (pending && now - pending.at > windowMs + 10) {
          pending.frames.push(chromaFromFrame(buf, ctx.sampleRate, { before: pending.before }).chroma);
          if (pending.frames.length >= 3 || now - pending.at > windowMs + 500) {
            const sum = new Float64Array(12);
            pending.frames.forEach((c) => c.forEach((v, i) => { sum[i] += v; }));
            pending = null;
            const max = Math.max(...sum);
            if (max > 0) markHeard([...sum.keys()].filter((pc) => sum[pc] >= max * 0.3));
          }
        }
      }, 60);
      listening = {
        stop() {
          clearInterval(timer);
          stream.getTracks().forEach((t) => t.stop());
          releaseMicSession();
          try { source.disconnect(); } catch (e) { /* ignore */ }
          ctx.close?.().catch?.(() => {});
          if (bar) bar.style.width = "0";
        },
      };
      btn.innerHTML = `${icon("mic", 18)} Stop listening`;
      btn.classList.add("jt-live");
      idleVerdict();
    } catch (err) {
      listening = null;
      setVerdict(`The microphone isn't available: ${friendlyMicError(err)}. You can still tap “Hear it” and each string to compare by ear.`, "bad");
    } finally {
      btn.disabled = false;
    }
  }
  function stopMic() {
    listening?.stop();
    listening = null;
    const btn = $(".jt-mic");
    if (btn) { btn.innerHTML = `${icon("mic", 18)} Start listening`; btn.classList.remove("jt-live"); }
  }

  const onClick = (e) => {
    const b = e.target.closest("button");
    if (!b || !el.contains(b)) return;
    if (b.dataset.c) {
      chordName = b.dataset.c; shape = chordShape(chordName);
      heard = new Map(); evaluated = false; strumAt = 0; clearTimeout(verdictTimer);
      render(); idleVerdict();
    } else if (b.dataset.s !== undefined) {
      const s = Number(b.dataset.s);
      ignoreMicFor(1800);
      playNote(midiAt(s, shape.frets[s]), { duration: 1.4 });
    } else if (b.classList.contains("jt-hear")) hear(shape);
    else if (b.classList.contains("jt-mic")) (listening ? stopMic() : startMic());
  };
  el.addEventListener("click", onClick);
  render();
  idleVerdict();
  return () => {
    clearTimeout(verdictTimer);
    offNote();
    stopMic();
    el.removeEventListener("click", onClick);
    el.innerHTML = "";
  };
}

// ============================================================================
// 4. Strum trainer
// ============================================================================
// 8 eighth-note slots per 4/4 bar (6 for 3/4): "D" down, "U" up, "X" muted
// chuck, "C" short offbeat chop, null = hand swings but misses.
const PATTERNS = [
  { id: "downs", name: "Steady downs", code: "D D D D", slots: ["D", null, "D", null, "D", null, "D", null], songs: "first songs, punk and metal chugs (try Paranoid)", tip: "One down-strum per beat. Count 1, 2, 3, 4 out loud." },
  { id: "eighths", name: "Down-up eighths", code: "DU DU DU DU", slots: ["D", "U", "D", "U", "D", "U", "D", "U"], songs: "driving pop-rock like Save Your Tears", tip: "Your hand never stops: down on the numbers, up on the “&”s." },
  { id: "old-faithful", name: "The campfire strum", code: "D DU UDU", slots: ["D", null, "D", "U", null, "U", "D", "U"], songs: "Brown Eyed Girl, Take Me Home, Country Roads, Hey Jude", tip: "The famous one. On beat 3 your hand swings down but misses: that's the gap." },
  { id: "pop", name: "Pop push", code: "D D U D U", slots: ["D", null, "D", "U", null, null, "D", "U"], songs: "pop ballads like Let Her Go and Someone You Loved", tip: "Leave beat 3 empty, then push into beat 4." },
  { id: "dudu", name: "Busy strummer", code: "D DU DU DU", slots: ["D", null, "D", "U", "D", "U", "D", "U"], songs: "upbeat folk and pop", tip: "Like the eighths, but beat 1 rings long." },
  { id: "reggae", name: "Reggae offbeat", code: "- D - D - D - D", slots: [null, "C", null, "C", null, "C", null, "C"], songs: "Three Little Birds and other island grooves", tip: "Only on the “&”s. Short and choppy: release the chord right after each strum." },
  { id: "chuck", name: "Chucka funk", code: "D - X U - U X U", slots: ["D", null, "X", "U", null, "U", "X", "U"], songs: "funky pop like Valerie and Happy", tip: "X = chuck: relax your fretting hand so the strings go dead, and strum for a click." },
  { id: "waltz", name: "Waltz (3/4)", code: "D DU DU", beats: 3, slots: ["D", null, "D", "U", "D", "U"], songs: "Can't Help Falling in Love, Hallelujah, The Blue Danube", tip: "Three beats per bar: ONE two three, ONE two three." },
];
const TRAIN_CHORDS = ["G", "C", "D", "Em", "Am", "E", "A", "Dm"];

function mountStrumTrainer(el, opts = {}) {
  let pat = PATTERNS.find((p) => p.id === opts.pattern) || PATTERNS[2];
  let chordName = TRAIN_CHORDS.includes(opts.chord) ? opts.chord : "G";
  let bpm = opts.bpm || 76;
  let sound = true;
  let metro = true;
  let playing = false;
  let timer = null, raf = null, nextTime = 0, slot = 0, vis = [];
  el.innerHTML = `
    <section class="jt jt-trainer" aria-label="Strum trainer">
      <div class="jt-head"><h2 class="jt-title">${icon("hand", 22)} Strum trainer</h2>
        <p class="jt-sub">Pick a pattern, set the speed, and strum along with the moving arrows.</p></div>
      <div class="jt-chips jt-pats" role="group" aria-label="Strum pattern">${PATTERNS.map((p) => `<button type="button" class="jg-pill" data-p="${p.id}">${esc(p.name)}</button>`).join("")}</div>
      <div class="jg-card jt-train-card">
        <div class="jt-pat-name"></div>
        <div class="jt-arrows" aria-hidden="true"></div>
        <p class="jt-sub jt-pat-info"></p>
        <div class="jt-train-row">
          <div class="jt-train-diag"></div>
          <div class="jt-train-controls">
            <div class="jt-chips jt-train-chords" role="group" aria-label="Chord">${TRAIN_CHORDS.map((c) => `<button type="button" class="jg-pill" data-c="${c}">${c}</button>`).join("")}</div>
            <label class="jt-tempo"><span>Tempo <b class="jt-bpm">${bpm}</b> BPM</span>
              <input type="range" class="jt-range" min="40" max="150" step="2" value="${bpm}" aria-label="Tempo in beats per minute"></label>
            <div class="jt-chips">
              <button type="button" class="jg-pill jt-tog-metro" aria-pressed="true">${icon("tuner", 16)} Click</button>
              <button type="button" class="jg-pill jt-tog-sound" aria-pressed="true">${icon("speaker", 16)} Guitar</button>
            </div>
          </div>
        </div>
        <div class="jg-row jt-actions"><button type="button" class="jg-btn jg-btn-primary jt-play">${icon("play", 18)} Play</button></div>
      </div>
    </section>`;
  const $ = (s) => el.querySelector(s);
  const COUNTS = ["1", "&", "2", "&", "3", "&", "4", "&"];
  const glyph = (d, i) => (d === "D" || d === "C" ? "↓" : d === "U" ? "↑" : d === "X" ? "×" : i % 2 ? "↑" : "↓");

  function renderPattern() {
    el.querySelectorAll("[data-p]").forEach((b) => { const on = b.dataset.p === pat.id; b.classList.toggle("jg-pill-active", on); b.setAttribute("aria-pressed", on); });
    $(".jt-pat-name").innerHTML = `<b>${esc(pat.name)}</b> <code class="jt-code">${esc(pat.code)}</code>`;
    const arrows = $(".jt-arrows");
    arrows.style.setProperty("--jt-slots", pat.slots.length);
    arrows.innerHTML = pat.slots.map((d, i) => `<div class="jt-slot ${d ? "jt-slot-" + d : "jt-slot-miss"}" data-i="${i}"><span class="jt-arrow">${glyph(d, i)}</span><span class="jt-cnt">${COUNTS[i]}</span></div>`).join("");
    $(".jt-pat-info").innerHTML = `${esc(pat.tip)} <br><span class="jt-songs">Try it with: ${esc(pat.songs)}.</span>`;
    $(".jt-arrows").setAttribute("aria-label", `Pattern ${pat.code}`);
  }
  function renderChord() {
    el.querySelectorAll(".jt-train-chords [data-c]").forEach((b) => { const on = b.dataset.c === chordName; b.classList.toggle("jg-pill-active", on); b.setAttribute("aria-pressed", on); });
    $(".jt-train-diag").innerHTML = chordDiagramSvg(chordShape(chordName), chordName);
  }

  const slotSec = () => 60 / bpm / 2;
  function schedule() {
    const ctx = getAudioContext();
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05; // woke up late (tab hidden): don't burst
    while (nextTime < ctx.currentTime + 0.15) {
      const delay = Math.max(0, nextTime - ctx.currentTime);
      const d = pat.slots[slot];
      if (metro && slot % 2 === 0) click(slot === 0, delay);
      if (sound && d) {
        const midis = shapeMidis(chordShape(chordName));
        if (d === "X") mutedStrum(midis, { delay });
        else if (d === "C") strum(midis.slice(-4), { direction: "down", delay, duration: 0.14, gain: 0.22, spread: 0.008 });
        else strum(d === "U" ? midis.slice(-4) : midis, { direction: d === "U" ? "up" : "down", delay, duration: slotSec() * 2.2, gain: d === "U" ? 0.18 : 0.24 });
      }
      vis.push({ t: nextTime, i: slot });
      nextTime += slotSec();
      slot = (slot + 1) % pat.slots.length;
    }
  }
  let shown = -1;
  function draw() {
    const now = getAudioContext().currentTime;
    let cur = null;
    while (vis.length && vis[0].t <= now) cur = vis.shift();
    if (cur && cur.i !== shown) {
      shown = cur.i;
      el.querySelectorAll(".jt-slot").forEach((s) => s.classList.toggle("jt-slot-on", Number(s.dataset.i) === shown));
    }
    raf = requestAnimationFrame(draw);
  }
  function start() {
    const ctx = getAudioContext();
    nextTime = ctx.currentTime + 0.12;
    slot = 0; vis = []; shown = -1;
    ignoreMicFor(1e7);
    schedule();
    timer = setInterval(schedule, 40);
    raf = requestAnimationFrame(draw);
    playing = true;
    $(".jt-play").innerHTML = `■ Stop`;
    $(".jt-play").setAttribute("aria-pressed", "true");
  }
  function stop() {
    if (playing) stopAllSound();
    clearInterval(timer); cancelAnimationFrame(raf);
    timer = null; raf = null; playing = false;
    ignoreMicFor(0);
    el.querySelectorAll(".jt-slot").forEach((s) => s.classList.remove("jt-slot-on"));
    const b = $(".jt-play");
    if (b) { b.innerHTML = `${icon("play", 18)} Play`; b.setAttribute("aria-pressed", "false"); }
  }
  const onClick = (e) => {
    const b = e.target.closest("button");
    if (!b || !el.contains(b)) return;
    if (b.dataset.p) { pat = PATTERNS.find((p) => p.id === b.dataset.p); const was = playing; stop(); renderPattern(); if (was) start(); }
    else if (b.dataset.c) { chordName = b.dataset.c; renderChord(); }
    else if (b.classList.contains("jt-play")) (playing ? stop() : start());
    else if (b.classList.contains("jt-tog-metro")) { metro = !metro; b.setAttribute("aria-pressed", metro); b.classList.toggle("jg-pill-active", metro); }
    else if (b.classList.contains("jt-tog-sound")) { sound = !sound; b.setAttribute("aria-pressed", sound); b.classList.toggle("jg-pill-active", sound); }
  };
  const onInput = (e) => { if (e.target.classList.contains("jt-range")) { bpm = Number(e.target.value); $(".jt-bpm").textContent = bpm; } };
  el.addEventListener("click", onClick);
  el.addEventListener("input", onInput);
  renderPattern();
  renderChord();
  el.querySelectorAll(".jt-tog-metro, .jt-tog-sound").forEach((b) => b.classList.add("jg-pill-active"));
  return () => {
    stop();
    el.removeEventListener("click", onClick);
    el.removeEventListener("input", onInput);
    el.innerHTML = "";
  };
}

// ============================================================================
// 5. Riff of the day
// ============================================================================
function dayIndex(date = new Date()) {
  // Local calendar day, so the riff changes at the player's midnight.
  const d = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return ((d % RIFFS.length) + RIFFS.length) % RIFFS.length;
}
function riffOfTheDay(date = new Date()) {
  const riff = RIFFS[dayIndex(date)];
  return { ...riff, events: riffEvents(riff) };
}

function mountRiffOfTheDay(el, opts = {}) {
  let idx = dayIndex(opts.date || new Date());
  const today = idx;
  let slow = false;
  let raf = null;
  let playing = false;
  el.innerHTML = `
    <section class="jt jt-riff" aria-label="Riff of the day">
      <div class="jt-head"><h2 class="jt-title">${icon("star", 22)} <span class="jt-riff-label">Riff of the day</span></h2></div>
      <div class="jg-card jt-riff-card">
        <div class="jt-big-name jt-riff-title"></div>
        <p class="jt-sub jt-riff-meta"></p>
        <div class="jt-tabscroll" tabindex="0" role="region" aria-label="Tab, scrolls sideways"></div>
        <p class="jg-note jt-swipe" hidden>Swipe the tab sideways to see the rest.</p>
        <p class="jt-riff-tip"></p>
        <div class="jg-row jt-actions">
          <button type="button" class="jg-btn jg-btn-primary jt-riff-play">${icon("speaker", 18)} Hear it</button>
          <button type="button" class="jg-pill jt-riff-slow" aria-pressed="false">Slow</button>
          <button type="button" class="jg-btn jt-riff-next">Next riff →</button>
        </div>
        <p class="jg-note">How to read tab: each line is a string (high e on top), the numbers are the frets to press, read left to right.</p>
      </div>
    </section>`;
  const $ = (s) => el.querySelector(s);
  const riff = () => RIFFS[idx];
  const events = () => riffEvents(riff());
  const barsOf = (r, ev) => Math.max(1, Math.ceil((Math.max(...ev.map((e) => e.start + Math.min(e.dur, 1))) - 1e-6) / r.beatsPerBar));

  function renderTab(current = new Set()) {
    const r = riff();
    const ev = events();
    $(".jt-tabscroll").innerHTML = tabSvg(ev, { beatsPerBar: r.beatsPerBar, bars: barsOf(r, ev), current });
  }
  function render() {
    const r = riff();
    $(".jt-riff-label").textContent = idx === today ? "Riff of the day" : "Bonus riff";
    $(".jt-riff-title").textContent = r.title;
    $(".jt-riff-meta").textContent = `${r.level} · ${r.bpm} BPM · ${r.source}`;
    $(".jt-riff-tip").textContent = r.tip;
    renderTab();
    const wrap = $(".jt-tabscroll");
    wrap.scrollLeft = 0;
    $(".jt-swipe").hidden = !(wrap.scrollWidth > wrap.clientWidth + 4);
  }
  function stop() {
    if (playing) stopAllSound();
    playing = false;
    cancelAnimationFrame(raf);
    raf = null;
    const b = $(".jt-riff-play");
    if (b) b.innerHTML = `${icon("speaker", 18)} Hear it`;
    if ($(".jt-tabscroll")) renderTab();
  }
  function play() {
    const r = riff();
    const ev = events();
    const spb = (60 / r.bpm) * (slow ? 1.6 : 1);
    // Swing: the off-beat eighth lands two-thirds through the beat.
    const at = (t) => (r.swing && Math.abs((t % 1) - 0.5) < 1e-6 ? Math.floor(t) + 2 / 3 : t);
    const ctx = getAudioContext();
    const t0 = ctx.currentTime + 0.12;
    const end = Math.max(...ev.map((e) => at(e.start) + e.dur));
    ignoreMicFor((end * spb + 2) * 1000);
    ev.forEach((e) => playNote(midiAt(e.string, e.fret), { delay: 0.12 + at(e.start) * spb, duration: Math.max(0.25, e.dur * spb * 1.1), gain: 0.3 }));
    playing = true;
    $(".jt-riff-play").innerHTML = `■ Stop`;
    let lastKey = "";
    const wrap = $(".jt-tabscroll");
    const tick = () => {
      const beat = (getAudioContext().currentTime - t0) / spb;
      if (beat > end + 0.3) { stop(); return; }
      const cur = new Set();
      ev.forEach((e, i) => { if (beat >= at(e.start) && beat < at(e.start) + Math.max(0.2, Math.min(e.dur, 1))) cur.add(i); });
      const key = [...cur].join(",");
      if (key !== lastKey) {
        lastKey = key;
        renderTab(cur);
        const now = wrap.querySelector(".jg-tab-now");
        if (now && wrap.scrollWidth > wrap.clientWidth) {
          const x = now.getBoundingClientRect().left - wrap.getBoundingClientRect().left;
          if (x > wrap.clientWidth * 0.75 || x < 0) wrap.scrollLeft += x - wrap.clientWidth * 0.25;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  const onClick = (e) => {
    const b = e.target.closest("button");
    if (!b || !el.contains(b)) return;
    if (b.classList.contains("jt-riff-play")) (playing ? stop() : play());
    else if (b.classList.contains("jt-riff-slow")) { slow = !slow; b.setAttribute("aria-pressed", slow); b.classList.toggle("jg-pill-active", slow); if (playing) { stop(); play(); } }
    else if (b.classList.contains("jt-riff-next")) { stop(); idx = (idx + 1) % RIFFS.length; render(); }
  };
  el.addEventListener("click", onClick);
  render();
  return () => {
    stop();
    el.removeEventListener("click", onClick);
    el.innerHTML = "";
  };
}

// --- menu -------------------------------------------------------------------
// icon: a name for icons.js icon(name, size).
const JAM_TOOLS = [
  { id: "chords", title: "Chord library", blurb: "Every chord: open shapes and barre shapes anywhere on the neck.", icon: "guitar", mount: mountChordLibrary },
  { id: "capo", title: "Capo calculator", blurb: "Where to put the capo so a song uses easy open shapes.", icon: "song", mount: mountCapoCalculator },
  { id: "strum-check", title: "Strum check", blurb: "Strum your guitar and see which strings rang out.", icon: "mic", mount: mountStrumCheck },
  { id: "strum-trainer", title: "Strum trainer", blurb: "Strum patterns with a click and moving arrows.", icon: "hand", mount: mountStrumTrainer },
  { id: "riff", title: "Riff of the day", blurb: "A new short riff in tab every day.", icon: "star", mount: mountRiffOfTheDay },
];

export {
  JAM_TOOLS, mountChordLibrary, mountCapoCalculator, mountStrumCheck, mountStrumTrainer, mountRiffOfTheDay, riffOfTheDay,
  chordVoicings, capoOptions, PATTERNS,
};
