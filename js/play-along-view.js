// The calm play-along view (owner request 2026-10-18; replaces the dark
// scrolling tab panel, which raced past too fast to follow). Nothing
// scrolls. Above the fretboard:
//
//   Chords - the chord's name (big), "next: C" (small), and one row of
//            strum arrows for that chord (↓ ↑ ↓ ↑ ...), the current arrow
//            lighting up in time. When the chord changes, the shape on the
//            fretboard, the name and the arrows all change together. A
//            chord held for more than a bar shows one bar of its pattern
//            and counts "bar 2 of 3"; a pattern with more than 4 strums
//            shows all of them.
//   Notes  - (solos, riffs, melodies, uploads) the fret number (big) and
//            its string, then a short strip of the next notes as fret
//            numbers on their strings (a page of 8 that turns over, it
//            never scrolls). On the fretboard the current note has a dot
//            with its fret number and a glowing ring, its string glows to
//            the body while it rings, and the next note shows faintly.
//
// The view owns the fretboard while it plays (shape, dots, glow).
//
//   const v = createPlayAlongView(container, fb, root);
//   v.load(evs, { beatSec, beatsPerBar, origin })   // evs in seconds:
//     { t, d, span, chord?, shape?, strum?, string?, fret? }
//   v.update(now, { waiting })   // every frame
//   v.preview(evs, opts)         // show the first chord/notes, no fretboard changes
//   v.reset()                    // hide, clear the glow
//   v.destroy()

import { STRING_NAMES, midiAt, noteName } from "./guitar-theory.js";

const PAGE = 8;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const near = (a, b, tol = 0.06) => Math.abs(a - b) <= tol * Math.max(a, b);

// Group the timeline into blocks: a run of strums of one chord, or a run
// of single notes. Each event learns its block and its place in it.
function buildBlocks(evs, { beatSec = 0, beatsPerBar = 4, origin = null } = {}) {
  const blocks = [];
  const t0 = origin ?? (evs.length ? evs[0].t : 0);
  // Strums of one chord belong together across the pattern's gaps (and
  // across bars when the chord is held); a longer silence starts afresh.
  const maxGap = beatSec ? beatSec * beatsPerBar : 1.5;
  evs.forEach((e, k) => {
    const prev = evs[k - 1];
    const last = blocks[blocks.length - 1];
    const joins = prev && last && (e.chord
      ? last.kind === "chord" && prev.chord === e.chord && e.t - (prev.t + (prev.span || prev.d)) < maxGap - 0.01
      : last.kind === "notes");
    if (!joins) blocks.push({ kind: e.chord ? "chord" : "notes", chord: e.chord || null, shape: e.shape || null, evs: [] });
    const b = blocks[blocks.length - 1];
    e.block = blocks.length - 1;
    e.k = b.evs.length;
    b.evs.push(e);
  });
  blocks.forEach((b, bi) => {
    const lastEv = b.evs[b.evs.length - 1];
    b.end = lastEv.t + Math.max(lastEv.span || 0, lastEv.d || 0);
    // A pattern that ends on a rest (e.g. ↓ · ↓ · ↓ · ↓ ·) lasts until the next chord.
    const nextT = blocks[bi + 1]?.evs[0].t;
    if (nextT !== undefined && nextT > b.end && nextT - b.end < maxGap) b.end = nextT;
    if (b.kind !== "chord") return;
    const first = b.evs[0];
    const step = Math.max(0.05, Math.min(...b.evs.map((e) => e.span || e.d)));
    const n = Math.max(1, Math.round((b.end - first.t) / step));
    const dirs = Array(n).fill(null);
    b.evs.forEach((e) => {
      e.slot = Math.min(n - 1, Math.round((e.t - first.t) / step));
      dirs[e.slot] = e.strum === "up" ? "up" : "down";
    });
    let barSlots = beatSec ? Math.max(1, Math.round((beatsPerBar * beatSec) / step)) : n;
    if (n <= barSlots) barSlots = n;
    b.dirs = dirs;
    b.barSlots = barSlots;
    b.pages = Math.ceil(n / barSlots);
    // Counting under the arrows: "1 & 2 &" for eighths, "1 2 3 4" for beats.
    const per = beatSec ? (near(step, beatSec / 2) ? 2 : near(step, beatSec) ? 1 : 0) : 0;
    b.counts = dirs.map((_, j) => {
      if (!per) return "";
      const beats = (first.t - t0) / beatSec + (j * step) / beatSec;
      const whole = Math.round(beats * per) / per;
      const inBar = ((Math.floor(whole + 1e-6) % beatsPerBar) + beatsPerBar) % beatsPerBar;
      return Math.abs(whole - Math.round(whole)) < 1e-3 ? String(inBar + 1) : "&";
    });
  });
  return blocks;
}

function createPlayAlongView(container, fb, root = null) {
  container.classList.add("jg-pav", "jg-pav-empty");
  container.setAttribute("aria-live", "polite");
  container.innerHTML = `
    <div class="jg-pav-head">
      <div class="jg-pav-name"></div>
      <div class="jg-pav-sub"></div>
      <div class="jg-pav-next"></div>
    </div>
    <div class="jg-pav-main"></div>`;
  const nameEl = container.querySelector(".jg-pav-name");
  const subEl = container.querySelector(".jg-pav-sub");
  const nextEl = container.querySelector(".jg-pav-next");
  const mainEl = container.querySelector(".jg-pav-main");
  const glowG = () => (root || document).querySelector(".jg-glow");

  let evs = [];
  let blocks = [];
  let ptr = 0;
  let lastNow = -Infinity;
  let shownBlock = -1;
  let shownPage = -1;
  let shownEv = -1;
  let shownReady = null;
  let fbBlock = -1;
  let fbEv = -1;
  let ringKey = "";
  let drawFb = true;

  function load(list, opts = {}) {
    evs = [...list].sort((a, b) => a.t - b.t);
    evs.forEach((e, i) => { e.i0 = i; });
    blocks = buildBlocks(evs, opts);
    ptr = 0;
    lastNow = -Infinity;
    shownBlock = shownPage = shownEv = fbBlock = fbEv = -1;
    shownReady = null;
    ringKey = "";
    container.classList.toggle("jg-pav-empty", !evs.length);
  }

  const nextChordBlock = (bi) => blocks[bi + 1] || null;
  const noteText = (e) => (e.fret === 0 ? `open ${STRING_NAMES[e.string]} string` : `${STRING_NAMES[e.string]} string, fret ${e.fret}`);

  // --- chords -------------------------------------------------------------
  function drawChordBlock(b, bi, page) {
    nameEl.textContent = b.chord;
    nameEl.className = "jg-pav-name";
    const nb = nextChordBlock(bi);
    nextEl.innerHTML = nb ? `next: <b>${esc(nb.kind === "chord" ? nb.chord : "single notes")}</b>` : "last one";
    const from = page * b.barSlots;
    const slots = b.dirs.slice(from, from + b.barSlots);
    const counts = b.counts.slice(from, from + b.barSlots);
    subEl.textContent = b.pages > 1 ? `bar ${page + 1} of ${b.pages}` : "";
    mainEl.innerHTML = `<div class="jg-pav-arrows" style="--n:${slots.length}">${slots.map((d, j) =>
      `<div class="jg-pav-slot ${d ? "jg-pav-" + d : "jg-pav-miss"}" data-j="${from + j}"><b>${d === "up" ? "↑" : d === "down" ? "↓" : "·"}</b><small>${counts[j] || ""}</small></div>`).join("")}</div>`;
  }

  // --- single notes -------------------------------------------------------
  function drawNotesPage(b, page, curK) {
    const list = b.evs.slice(page * PAGE, page * PAGE + PAGE);
    const W = 36 + PAGE * 40;
    const y = (s) => 9 + (5 - s) * 12.4;
    const parts = [];
    for (let s = 0; s < 6; s++) {
      parts.push(`<line x1="26" x2="${W - 4}" y1="${y(s)}" y2="${y(s)}" stroke="${fb.stringColor(s)}" class="jg-pav-tabline"/>`);
      parts.push(`<text x="12" y="${y(s) + 3.5}" class="jg-pav-tabname">${STRING_NAMES[s]}</text>`);
    }
    list.forEach((e, j) => {
      const k = page * PAGE + j;
      const x = 46 + j * 40;
      const cls = k === curK ? "jg-pav-now" : k < curK ? "jg-pav-done" : k === curK + 1 ? "jg-pav-soon" : "";
      parts.push(`<g class="jg-pav-tn ${cls}" data-k="${k}"><circle cx="${x}" cy="${y(e.string)}" r="8"/><text x="${x}" y="${y(e.string) + 3.6}">${e.fret}</text></g>`);
    });
    mainEl.innerHTML = `<svg class="jg-pav-tab" viewBox="0 0 ${W} 80" role="img" aria-label="The next notes, as fret numbers on their strings (high e on top)">${parts.join("")}</svg>`;
  }
  function drawNoteHead(b, bi, e) {
    nameEl.textContent = String(e.fret);
    nameEl.className = "jg-pav-name jg-pav-fretno";
    subEl.innerHTML = `<span class="jg-pav-chip" style="background:${fb.stringColor(e.string)}">${STRING_NAMES[e.string]}</span> string, ${e.fret === 0 ? "open" : `fret ${e.fret}`} · note ${esc(noteName(midiAt(e.string, e.fret)))}`;
    const nx = b.evs[e.k + 1];
    const nb = nx ? null : nextChordBlock(bi);
    nextEl.innerHTML = nx ? `next: <b>${esc(noteText(nx))}</b>` : nb ? `next: <b>${esc(nb.kind === "chord" ? nb.chord : "notes")}</b>` : "last note";
  }

  // --- the fretboard --------------------------------------------------------
  function fbFor(e, b) {
    if (!drawFb || !fb) return;
    if (b.kind === "chord") {
      if (fbBlock !== e.block) { fb.showShape(b.shape); fbBlock = e.block; fbEv = -1; }
      return;
    }
    if (fbEv === e.i0) return;
    fbEv = e.i0;
    fbBlock = -1;
    const nx = b.evs[e.k + 1];
    const pos = [];
    if (nx && !(nx.string === e.string && nx.fret === e.fret)) pos.push({ string: nx.string, fret: nx.fret, tone: "ghost", label: String(nx.fret) });
    pos.push({ string: e.string, fret: e.fret, tone: "root", label: String(e.fret), pop: true });
    fb.show(pos);
  }
  function ring(notes, strumKey) {
    if (!drawFb || !fb || !fb.glow) return;
    const key = strumKey + "|" + notes.map((n) => `${n.string}:${n.fret}`).join(",");
    if (key === ringKey) return;
    const changed = strumKey !== ringKey.split("|")[0];
    ringKey = key;
    fb.glow(notes);
    // A fresh strum (same strings again) still flashes.
    const g = glowG();
    if (g && changed && notes.length) { g.classList.remove("jg-glow-hit"); void g.getBoundingClientRect(); g.classList.add("jg-glow-hit"); }
  }

  function current(now) {
    if (now < lastNow) ptr = 0;
    lastNow = now;
    while (ptr + 1 < evs.length && evs[ptr + 1].t <= now + 0.03) ptr++;
    return evs[ptr];
  }

  function update(now, { waiting = false } = {}) {
    if (!evs.length) return;
    const e = current(now);
    const ready = now < evs[0].t - 0.03;
    const b = blocks[e.block];
    const page = b.kind === "chord" ? Math.floor(e.slot / b.barSlots) : Math.floor(e.k / PAGE);
    container.classList.toggle("jg-pav-waiting", Boolean(waiting));
    container.classList.toggle("jg-pav-ready", ready);
    if (e.block !== shownBlock || page !== shownPage || ready !== shownReady) {
      shownBlock = e.block;
      shownPage = page;
      shownReady = ready;
      shownEv = -1;
      container.classList.toggle("jg-pav-notes", b.kind === "notes");
      if (b.kind === "chord") drawChordBlock(b, e.block, page);
      else { drawNotesPage(b, page, ready ? -1 : e.k); drawNoteHead(b, e.block, e); }
      if (ready) subEl.textContent = "Get ready…";
    }
    fbFor(e, b);
    if (e.i0 !== shownEv && !ready) {
      shownEv = e.i0;
      if (b.kind === "chord") {
        mainEl.querySelectorAll(".jg-pav-on").forEach((x) => x.classList.remove("jg-pav-on"));
        const el = mainEl.querySelector(`[data-j="${e.slot}"]`);
        if (el) { void el.offsetWidth; el.classList.add("jg-pav-on"); }
      } else {
        drawNoteHead(b, e.block, e);
        mainEl.querySelectorAll(".jg-pav-tn").forEach((g) => {
          const k = Number(g.dataset.k);
          g.setAttribute("class", `jg-pav-tn ${k === e.k ? "jg-pav-now" : k < e.k ? "jg-pav-done" : k === e.k + 1 ? "jg-pav-soon" : ""}`);
        });
      }
    }
    // A chord keeps ringing through its gaps until the chord changes; a
    // note rings for its length.
    const ringing = !ready && !waiting && now >= e.t - 0.03 && now < (b.kind === "chord" ? b.end : e.t + e.d);
    if (!ringing) ring([], "");
    else if (b.kind === "chord") ring((b.shape?.frets || []).map((f, s) => (f >= 0 ? { string: s, fret: f } : null)).filter(Boolean), `c${e.i0}`);
    else ring([{ string: e.string, fret: e.fret }], `n${e.i0}`);
    return e;
  }

  // Before Start: the first chord (or the first notes), nothing lit, the
  // fretboard left as the page set it.
  function preview(list, opts) {
    load(list, opts);
    if (!evs.length) return;
    drawFb = false;
    update(-1e9);
    subEl.textContent = opts?.hint || "Press Start";
    drawFb = true;
    fbBlock = fbEv = -1;
  }

  function reset() {
    load([]);
    if (fb && fb.glow) fb.glow([]);
    mainEl.innerHTML = "";
    nameEl.textContent = subEl.textContent = nextEl.textContent = "";
  }

  return { load, update, preview, reset, destroy: reset };
}

export { createPlayAlongView, buildBlocks };
