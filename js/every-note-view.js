// "Every note" view for an uploaded song (Practice → Upload a song →
// Every note). Shows every note Basic Pitch heard - chords, bass and tune
// - on its string and fret (every-note.js works out where), in the calm
// play-along style: nothing scrolls fast.
//
//   Above the fretboard: the current moment big (its fret number, or the
//   chord it spells), "B string, fret 7", where it falls in the bar
//   ("Bar 5 · beat 2 &"), and a strip of the next 8 moments as fret
//   numbers on their strings (a page that turns over, with bar lines).
//   On the fretboard: the current notes as dots with their fret numbers,
//   their strings glowing while they ring, the next moment faint.
//   Controls: Listen / Wait for me (pauses at every moment until you play
//   one of its notes, or tap it), 50/75/100% speed, loop 4 bars, jump to
//   any bar, the recording or our guitar sound, tuning and capo.
//
//   const v = mountEveryNote(host, { inst, audio, notes, suggestedCapo });
//   v.destroy();

import { STRING_NAMES, noteName } from "./guitar-theory.js";
import { buildEveryNote, barStart, barPosition, TUNINGS, detectTuning, cleanForGuitar } from "./every-note.js";
import { playNote, getAudioContext, stopAllSound } from "./guitar-audio.js";
import { onNoteOn, enableMic, disableMic, micOn } from "./input-hub.js";
import { friendlyMicError } from "./pitch.js";
import { icon } from "./icons.js";
import { detailedNotes } from "./transcribe.js";

const PAGE = 8;
const SUBS = ["", " e", " &", " a"];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function mountEveryNote(host, { inst, audio, notes, suggestedCapo = 0 }) {
  const fb = inst.fb;
  // Basic Pitch's full output for this song if we have it (better for
  // every note); otherwise the notes the caller passed.
  const rawNotes = detailedNotes();
  const autoTuning = detectTuning(rawNotes ? cleanForGuitar(rawNotes) : notes);
  const st = { mode: "listen", speed: 1, snd: "song", tuning: autoTuning, capo: 0, loop: null };
  let data = null;
  let groups = [];
  let ptr = -1;
  let lastNow = -Infinity;
  let gate = -1; // wait mode: the moment we're waiting at
  let passed = -1; // wait mode: the last moment you played
  let waiting = false;
  let raf = null;
  let shown = { page: -1, cur: -2 };
  let micByUs = false;
  let lastSounded = -1;

  host.innerHTML = `
    <div class="jg-card jg-en-ctl">
      <div class="jg-row jg-en-modes">
        <button class="jg-pill jg-pill-active" data-mode="listen">${icon("play", 16)} Listen</button>
        <button class="jg-pill" data-mode="wait">${icon("hand", 16)} Wait for me</button>
        <button class="jg-btn jg-btn-primary jg-en-go">▶ Play</button>
      </div>
      <div class="jg-row">
        <span class="jg-label">Speed</span>
        ${[0.5, 0.75, 1].map((s) => `<button class="jg-pill ${s === 1 ? "jg-pill-active" : ""}" data-speed="${s}">${s * 100}%</button>`).join("")}
        <button class="jg-pill jg-en-loop">${icon("loop", 16)} Loop 4 bars</button>
        <button class="jg-pill jg-en-mic">${icon("mic", 16)} Microphone</button>
      </div>
      <div class="jg-row jg-en-seekrow"><span class="jg-label jg-en-barlbl">Bar 1</span><input type="range" class="jg-en-seek" min="1" max="1" value="1" aria-label="Jump to a bar"></div>
      <div class="jg-row"><span class="jg-label">Sound</span>
        <button class="jg-pill jg-pill-active" data-snd="song">Song</button>
        <button class="jg-pill" data-snd="guitar">Guitar</button>
        <button class="jg-pill" data-snd="both">Both</button></div>
      <details class="jg-en-more"><summary>${icon("gear", 18)} Tuning and capo</summary>
        <div class="jg-row"><span class="jg-label">Tuning</span>${Object.entries(TUNINGS).map(([k, t]) => `<button class="jg-pill" data-tuning="${k}">${esc(t.label)}${k === autoTuning ? " · heard" : ""}</button>`).join("")}</div>
        <div class="jg-row"><span class="jg-label">Capo</span>${[...new Set([0, suggestedCapo, 2, 3, 4, 5].filter((c) => c >= 0 && c <= 7))].sort((a, b) => a - b).map((c) => `<button class="jg-pill" data-capo="${c}">${c ? `Capo ${c}` : "No capo"}${c && c === suggestedCapo ? " (fits the chords)" : ""}</button>`).join("")}</div>
      </details>
      <p class="jg-note jg-en-sum"></p>
      <p class="jg-note jg-en-hint"></p>
    </div>`;
  const $ = (s) => host.querySelector(s);
  const goBtn = $(".jg-en-go");
  const seek = $(".jg-en-seek");

  // The view sits on top of the fretboard, like the play-along view.
  const view = document.createElement("div");
  view.className = "jg-pav jg-pav-notes jg-en-view";
  view.setAttribute("aria-live", "polite");
  view.innerHTML = `<div class="jg-pav-head"><div class="jg-pav-name"></div><div class="jg-pav-sub"></div><div class="jg-en-bar"></div><div class="jg-pav-next"></div></div><div class="jg-pav-main"></div>`;
  const fbEl = inst.el.querySelector(".jg-fb");
  inst.el.insertBefore(view, fbEl);
  const nameEl = view.querySelector(".jg-pav-name");
  const subEl = view.querySelector(".jg-pav-sub");
  const barEl = view.querySelector(".jg-en-bar");
  const nextEl = view.querySelector(".jg-pav-next");
  const mainEl = view.querySelector(".jg-pav-main");

  const posText = (n) => (n.fret === 0 ? `open ${STRING_NAMES[n.string]}` : `${STRING_NAMES[n.string]} ${n.fret}`);
  const noteText = (n) => (n.fret === 0 ? `open ${STRING_NAMES[n.string]} string` : `${STRING_NAMES[n.string]} string, fret ${n.fret}`);
  const groupText = (g) => (g.notes.length === 1 ? noteText(g.notes[0]) : g.chord ? `${g.chord} (${g.notes.length} notes)` : `${g.notes.length} notes`);
  const barText = (p) => (p ? `Bar ${p.bar} · beat ${p.beat}${SUBS[p.sub]}` : "");
  // Where a note goes on the neck: with a capo, tab frets count from the capo.
  const neck = (n) => ({ string: n.string, fret: n.fret + st.capo });

  function rebuild() {
    data = rawNotes ? buildEveryNote(rawNotes, { raw: true, tuning: st.tuning, capo: st.capo }) : buildEveryNote(notes, { tuning: st.tuning, capo: st.capo });
    console.log(`Jaxx Guitar: every note - ${data.groups.length} moments, tuning ${data.tuning}, capo ${data.capo}`, data.groups.map((g) => ({ t: g.t, t0: g.t0, pos: g.pos, chord: g.chord, notes: g.notes.map((n) => ({ midi: n.midi, play: n.play, string: n.string, fret: n.fret, duration: n.duration, velocity: n.velocity })) })));
    groups = data.groups;
    const total = groups.reduce((a, g) => a + g.notes.length, 0);
    const dropped = groups.reduce((a, g) => a + (g.dropped?.length || 0), 0);
    const bars = data.grid ? barPosition(data.grid, groups[groups.length - 1].t).bar : 1;
    seek.max = String(Math.max(1, bars));
    seek.closest(".jg-en-seekrow").style.display = data.grid ? "" : "none";
    $(".jg-en-sum").textContent = `${total} notes in ${groups.length} moments` +
      (data.grid ? ` · about ${data.grid.bpm} BPM, ${bars} bars` : "") +
      ` · ${TUNINGS[data.tuning].label}${st.capo ? ` · capo ${st.capo}` : ""}` +
      (dropped ? ` · ${dropped} note${dropped > 1 ? "s" : ""} left out where one hand can't reach them all` : "") +
      ". Our best guess from the recording: trust your ears!";
    host.querySelectorAll("[data-tuning]").forEach((b) => b.classList.toggle("jg-pill-active", b.dataset.tuning === st.tuning));
    host.querySelectorAll("[data-capo]").forEach((b) => b.classList.toggle("jg-pill-active", Number(b.dataset.capo) === st.capo));
    ptr = -1;
    lastNow = -Infinity;
    shown = { page: -1, cur: -2 };
    gate = -1;
    render(audio.currentTime || 0, true);
  }

  function current(now) {
    if (now < lastNow - 1e-3) ptr = -1;
    lastNow = now;
    while (ptr + 1 < groups.length && groups[ptr + 1].t <= now + 0.03) ptr++;
    return ptr;
  }

  // The strip: 8 moments as fret numbers on their strings, bar lines
  // between bars, the chord name over a moment that spells one. Louder
  // notes are bolder; a short tail shows how long each one rings.
  function drawStrip(page, cur) {
    const list = groups.slice(page * PAGE, page * PAGE + PAGE);
    const W = 40 + PAGE * 44;
    const y = (s) => 20 + (5 - s) * 12.4;
    const parts = [];
    for (let s = 0; s < 6; s++) {
      parts.push(`<line x1="26" x2="${W - 4}" y1="${y(s)}" y2="${y(s)}" stroke="${fb.stringColor(s)}" class="jg-pav-tabline"/>`);
      parts.push(`<text x="12" y="${y(s) + 3.5}" class="jg-pav-tabname">${STRING_NAMES[s]}</text>`);
    }
    const beat = data.grid ? data.grid.beatSec : 0.5;
    list.forEach((g, j) => {
      const k = page * PAGE + j;
      const x = 50 + j * 44;
      const prev = groups[k - 1];
      if (g.pos && (!prev || !prev.pos || prev.pos.bar !== g.pos.bar)) {
        parts.push(`<line x1="${x - 20}" x2="${x - 20}" y1="${y(5) - 4}" y2="${y(0) + 4}" class="jg-en-barline"/><text x="${x - 20}" y="${y(0) + 14}" class="jg-en-barno">${g.pos.bar}</text>`);
      }
      const cls = k === cur ? "jg-pav-now" : k < cur ? "jg-pav-done" : k === cur + 1 ? "jg-pav-soon" : "";
      if (g.chord) parts.push(`<text x="${x}" y="9" class="jg-en-chord ${cls}">${esc(g.chord)}</text>`);
      g.notes.forEach((n) => {
        const tail = Math.min(18, (n.duration / beat) * 8);
        parts.push(`<g class="jg-pav-tn ${cls}" style="opacity:${(0.5 + 0.5 * n.velocity).toFixed(2)}"><line x1="${x + 7}" x2="${x + 7 + tail}" y1="${y(n.string)}" y2="${y(n.string)}" class="jg-en-tail"/><circle cx="${x}" cy="${y(n.string)}" r="7.5"/><text x="${x}" y="${y(n.string) + 3.4}">${n.fret}</text></g>`);
      });
    });
    mainEl.innerHTML = `<svg class="jg-pav-tab jg-en-tab" viewBox="0 0 ${W} 100" role="img" aria-label="The next notes as fret numbers on their strings, high e on top">${parts.join("")}</svg>`;
  }

  function drawHead(g, nx) {
    if (!g) {
      nameEl.textContent = "";
      subEl.textContent = "Press Play";
      barEl.textContent = "";
      nextEl.innerHTML = groups[0] ? `first: <b>${esc(groupText(groups[0]))}</b>` : "";
      return;
    }
    const capoNote = st.capo ? " (from the capo)" : "";
    if (g.notes.length === 1 && !g.chord) {
      const n = g.notes[0];
      nameEl.textContent = String(n.fret);
      nameEl.className = "jg-pav-name jg-pav-fretno";
      subEl.innerHTML = `<span class="jg-pav-chip" style="background:${fb.stringColor(n.string)}">${STRING_NAMES[n.string]}</span> string, ${n.fret === 0 ? "open" : `fret ${n.fret}`}${capoNote} · ${esc(noteName(n.midi))}`;
    } else {
      nameEl.textContent = g.chord || `${g.notes.length} notes`;
      nameEl.className = "jg-pav-name";
      subEl.innerHTML = g.notes.map((n) => `<span class="jg-en-pos"><span class="jg-pav-chip" style="background:${fb.stringColor(n.string)}">${STRING_NAMES[n.string]}</span> ${n.fret === 0 ? "open" : n.fret}</span>`).join(" ") + capoNote;
    }
    barEl.textContent = barText(g.pos);
    nextEl.innerHTML = nx ? `next: <b>${esc(nx.notes.length === 1 && !nx.chord ? posText(nx.notes[0]) : groupText(nx))}</b>` : "last one";
  }

  function render(now, force = false) {
    if (!groups.length) return;
    const cur = current(now);
    const page = Math.max(0, Math.floor(Math.max(0, cur) / PAGE));
    view.classList.toggle("jg-pav-waiting", waiting);
    if (force || page !== shown.page || cur !== shown.cur) {
      drawStrip(page, cur);
      shown = { page, cur };
      const g = groups[cur];
      const nx = groups[cur + 1];
      drawHead(g, nx);
      // The fretboard: this moment's notes with their fret numbers, the
      // next moment's faintly (where it doesn't sit on the same string).
      const pos = [];
      const show = g || nx;
      const ahead = g ? nx : groups[1];
      if (ahead) ahead.notes.forEach((n) => { if (!show.notes.some((m) => m.string === n.string)) pos.push({ ...neck(n), tone: "ghost", label: String(n.fret) }); });
      if (show) show.notes.forEach((n) => pos.push({ ...neck(n), tone: g ? "root" : "ghost", label: String(n.fret), pop: Boolean(g) }));
      fb.show(pos);
    }
    // Glow: this moment's notes, while they ring (only where its dots are,
    // so a ring never shows without its fret number).
    if (waiting && gate >= 0) { fb.glow(groups[gate].notes.map(neck)); return; } // what to play now
    if (cur < 0) { fb.glow([]); return; }
    const g = groups[cur];
    fb.glow(g.notes.filter((n) => now < g.t + Math.max(0.15, n.duration)).map(neck));
  }

  // --- playback ---------------------------------------------------------------
  const setVolume = () => { audio.muted = st.snd === "guitar"; audio.volume = st.snd === "both" ? 0.6 : 1; };
  const setSpeed = () => {
    audio.playbackRate = st.speed;
    audio.preservesPitch = true;
    audio.webkitPreservesPitch = true;
  };
  function soundGroup(k) {
    if (st.snd === "song" || k === lastSounded || k < 0) return;
    lastSounded = k;
    const g = groups[k];
    g.notes.forEach((n, i) => playNote(n.midi, { delay: i * 0.012, duration: Math.max(0.2, n.duration / st.speed), gain: 0.12 + 0.2 * n.velocity }));
  }
  function frame() {
    raf = null;
    let now = audio.currentTime;
    if (st.loop && now >= st.loop.b) { audio.currentTime = st.loop.a; now = st.loop.a; lastSounded = -1; gate = passed = -1; }
    if (st.mode === "wait" && !audio.paused) {
      if (gate < 0 || groups[gate].t < now - 0.08) gate = groups.findIndex((g, i) => i > passed && g.t >= now - 0.02);
      if (gate >= 0 && now >= groups[gate].t) { audio.pause(); waiting = true; audio.currentTime = groups[gate].t; now = groups[gate].t; }
    }
    render(now);
    if (!waiting && !audio.paused) soundGroup(ptr);
    if (data.grid && ptr >= 0 && groups[ptr].pos) {
      const bar = groups[ptr].pos.bar;
      if (Number(seek.value) !== bar && document.activeElement !== seek) seek.value = String(bar);
      $(".jg-en-barlbl").textContent = `Bar ${bar} of ${seek.max}`;
    }
    if (!audio.paused || waiting) raf = requestAnimationFrame(frame);
    else goBtn.textContent = "▶ Play";
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  function play() {
    getAudioContext().resume?.();
    setSpeed();
    setVolume();
    waiting = false;
    audio.play().catch((err) => { goBtn.textContent = "▶ Play"; $(".jg-en-hint").textContent = `This file won't play here (${err.message}).`; });
    goBtn.textContent = "⏸ Pause";
    kick();
  }
  function pause() {
    audio.pause();
    waiting = false;
    goBtn.textContent = "▶ Play";
    stopAllSound();
    kick();
  }
  function seekTo(t) {
    audio.currentTime = Math.max(0, t);
    lastSounded = -1;
    gate = passed = -1;
    waiting = false;
    render(audio.currentTime, true);
    if (!audio.paused) kick();
  }

  // Wait for me: any note of the moment counts (the microphone hears one
  // note at a time; any octave is fine), or tapping one of its notes.
  const unsub = onNoteOn((midi, src) => {
    if (!waiting || gate < 0) return;
    const g = groups[gate];
    const ok = g.notes.some((n) => (src === "screen" ? midi === fbMidi(n) : ((midi - n.midi) % 12 + 12) % 12 === 0));
    if (!ok) return;
    waiting = false;
    lastSounded = gate;
    passed = gate;
    audio.currentTime = groups[gate].t + 0.005;
    gate = gate + 1 < groups.length ? gate + 1 : -1;
    audio.play().catch(() => {});
    kick();
  });
  // The on-screen fretboard plays standard-tuning pitches at real neck frets.
  const STD = [40, 45, 50, 55, 59, 64];
  const fbMidi = (n) => STD[n.string] + n.fret + st.capo;

  function hint() {
    $(".jg-en-hint").textContent = st.mode === "wait"
      ? `It stops at every note (or chord) until you play it.${micOn() ? "" : " Tap Microphone to use your guitar, or tap the lit note."}`
      : "The glowing ring is the string and fret to play; the faint dots are what's next. Every note we heard is here: the chords, the bass and the tune.";
  }

  host.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b === goBtn) { if (audio.paused && !waiting) play(); else pause(); return; }
    if (b.dataset.mode) {
      st.mode = b.dataset.mode;
      host.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
      gate = -1;
      if (waiting) { waiting = false; }
    }
    if (b.dataset.speed) {
      st.speed = Number(b.dataset.speed);
      host.querySelectorAll("[data-speed]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
      setSpeed();
    }
    if (b.dataset.snd) {
      st.snd = b.dataset.snd;
      host.querySelectorAll("[data-snd]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
      setVolume();
    }
    if (b.classList.contains("jg-en-loop")) {
      if (st.loop) st.loop = null;
      else if (data.grid) {
        const bar = groups[Math.max(0, ptr)]?.pos?.bar || 1;
        st.loop = { a: barStart(data.grid, bar), b: barStart(data.grid, bar + 4), bar };
      } else {
        const a = groups[Math.max(0, ptr)].t;
        st.loop = { a, b: a + 8, bar: 0 };
      }
      b.classList.toggle("jg-pill-active", Boolean(st.loop));
      b.innerHTML = `${icon("loop", 16)} ${st.loop ? (st.loop.bar ? `Looping bars ${st.loop.bar}-${st.loop.bar + 3}` : "Looping") : "Loop 4 bars"}`;
      if (st.loop && (audio.currentTime < st.loop.a || audio.currentTime >= st.loop.b)) seekTo(st.loop.a);
    }
    if (b.classList.contains("jg-en-mic")) {
      if (micOn()) { disableMic(); micByUs = false; }
      else {
        try { await enableMic(); micByUs = true; } catch (err) { $(".jg-en-hint").textContent = `The microphone didn't start: ${friendlyMicError(err)}. You can still tap the fretboard.`; return; }
      }
      b.classList.toggle("jg-pill-active", micOn());
    }
    if (b.dataset.tuning) { st.tuning = b.dataset.tuning; rebuild(); }
    if (b.dataset.capo !== undefined) { st.capo = Number(b.dataset.capo); rebuild(); }
    hint();
  });
  seek.addEventListener("input", () => {
    if (!data.grid) return;
    const bar = Number(seek.value);
    $(".jg-en-barlbl").textContent = `Bar ${bar} of ${seek.max}`;
    seekTo(barStart(data.grid, bar));
  });
  audio.addEventListener("ended", onEnded);
  function onEnded() { goBtn.textContent = "▶ Play"; }

  rebuild();
  hint();

  return {
    get data() { return data; },
    destroy() {
      audio.pause();
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      unsub();
      if (micByUs) disableMic();
      audio.removeEventListener("ended", onEnded);
      audio.playbackRate = 1;
      audio.muted = false;
      view.remove();
      fb.glow?.([]);
      fb.clear();
      host.innerHTML = "";
    },
  };
}

export { mountEveryNote };
