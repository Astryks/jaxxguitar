import { flipButtonHtml, wireFlip } from "./settings.js";
import { puppySvg, nextPuppyScene } from "./puppy.js";
import { icon } from "./icons.js";
// Practice tab: build a chord loop, drill a scale, a metronome with tap
// tempo, and "upload a song" - the app works out the chords from your
// own recording and shows the guitar shapes in time with it.

import { chordShape, shapeMidis, scaleBox, SCALES, NOTE_NAMES, suggestCapo, midiAt } from "./guitar-theory.js";
import { chordDiagramSvg } from "./fretboard.js";
import { strum, click, getAudioContext, stopAllSound, playNote } from "./guitar-audio.js";
import { placeMelody, melodyLine } from "./fret-map.js";
import { mountInstrument, createPracticeBox } from "./practice-widget.js";
import { chordTimeline, createGuitarPlayer, timelineEvents, LEAD } from "./guitar-player.js";
import { transcribeFile, estimateBeat, simplifyToChords, guessLastUpload, canGuessSongs } from "./transcribe.js";
import { SONGS } from "./songs-data.js";
import { parseChordSymbol } from "./chord-utils.js";
import { openSongByTitle } from "./songs-ui.js";

// Chord loop: the everyday chords to pick from, three strums, three speeds.
const LOOP_CHORDS = ["G", "C", "D", "Em", "Am", "E", "A", "Dm", "F", "E7", "A7", "D7"];
const PATTERNS = {
  "Downs": ["down", "down", "down", "down"],
  "Down-up": ["down", "up", "down", "up", "down", "up", "down", "up"],
  "Pop": ["down", null, "down", "up", null, "up", "down", "up"],
};
const SPEEDS = [["Slow", 60], ["Medium", 80], ["Fast", 100]];
// All chords: four rows, each a sideways strip of chord names.
const ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const LIB_ROWS = [
  ["Major", ROOTS.map((r) => r)],
  ["Minor", ROOTS.map((r) => r + "m")],
  ["7th", ROOTS.map((r) => r + "7")],
  ["maj7 · m7 · sus", ROOTS.flatMap((r) => ["maj7", "m7", "sus2", "sus4"].map((q) => r + q))],
].map(([label, list]) => [label, list.filter((c) => chordShape(c))]);
const SCALE_OPTS = [
  ["Minor pentatonic", "minorPentatonic"], ["Major pentatonic", "majorPentatonic"], ["Blues", "blues"],
  ["Major", "major"], ["Natural minor", "naturalMinor"], ["Harmonic minor", "harmonicMinor"],
];

let cleanup = [];
function leavePractice() {
  cleanup.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  cleanup = [];
  stopAllSound();
}

function renderPractice(panel) {
  leavePractice();
  const st = { chords: ["G", "D", "Em", "C"], pattern: "Downs", bpm: 80, root: 9, scale: "minorPentatonic", pos: 5, section: "chords", lib: [0, 7] };
  panel.innerHTML = `
    <div class="jg-row">
      <div class="jg-inline-mascot">${puppySvg("rockout")}</div>
      <button class="jg-pill jg-pill-active" data-sec="chords">${icon("guitar", 16)} Chord loop</button>
      <button class="jg-pill" data-sec="library">${icon("star", 16)} All chords</button>
      <button class="jg-pill" data-sec="scales">${icon("song", 16)} Scales</button>
      <button class="jg-pill" data-sec="metronome">${icon("tuner", 16)} Metronome</button>
      <button class="jg-pill" data-sec="upload">${icon("cassette", 16)} Upload a song</button>
    </div>
    <div class="jg-sec"></div>
    ${flipButtonHtml()}
    <div class="jg-instrument-host"></div>
    <div class="jg-below"></div>`;
  const sec = panel.querySelector(".jg-sec");
  const inst = mountInstrument(panel.querySelector(".jg-instrument-host"), { frets: 15, fit: true });
  wireFlip(panel, () => renderPractice(panel));
  cleanup.push(() => { inst.hw.destroy(); inst.fb.destroy(); });
  let box = null;
  let stopMetro = null;
  let stopUpload = null;
  const clearSec = () => {
    if (box) box.destroy();
    box = null;
    if (stopMetro) stopMetro();
    stopMetro = null;
    if (stopUpload) stopUpload();
    stopUpload = null;
    inst.fb.clear();
    inst.hw.reset();
    panel.querySelector(".jg-below").innerHTML = "";
  };
  cleanup.push(clearSec);

  // Chord loop: pick chords, press Start. The play-along view above the
  // fretboard shows the chord's name, its strum arrows and (on the
  // fretboard) its shape, round and round until Stop.
  function chordsSection() {
    sec.innerHTML = `
      <div class="jg-card jg-loopcard">
        <div class="jg-loop-head"><b>Your loop</b><span class="jg-note">Tap ✕ to take a chord out</span></div>
        <div class="jg-loop-chips"></div>
        <div class="jg-loop-sub">Add a chord</div>
        <div class="jg-loop-add">${LOOP_CHORDS.map((c) => `<button class="jg-pill" data-add="${c}">${c}</button>`).join("")}</div>
        <div class="jg-loop-ctl">
          <span class="jg-label">Strum</span>${Object.keys(PATTERNS).map((k) => `<button class="jg-pill ${k === st.pattern ? "jg-pill-active" : ""}" data-pat="${k}">${k}</button>`).join("")}
        </div>
        <div class="jg-loop-ctl">
          <span class="jg-label">Speed</span>${SPEEDS.map(([n, v]) => `<button class="jg-pill ${v === st.bpm ? "jg-pill-active" : ""}" data-bpm="${v}">${n}</button>`).join("")}
        </div>
        <button class="jg-btn jg-btn-primary jg-loop-go">▶ Start</button>
      </div>`;
    const goBtn = sec.querySelector(".jg-loop-go");
    let player = null;
    // The loop played 4 times over, looping, so there's no pause each time round.
    const items = () => chordTimeline(Array(4).fill(st.chords).flat().map((c) => ({ chord: c, shape: chordShape(c) })), { beatsPerChord: 4, pattern: PATTERNS[st.pattern] });
    const preview = () => {
      if (!st.chords.length) { inst.hw.reset(); inst.fb.clear(); return; }
      inst.hw.preview(timelineEvents(items(), { bpm: st.bpm }), { beatSec: 60 / st.bpm, beatsPerBar: 4, origin: LEAD, hint: "Press Start" });
      inst.fb.showShape(chordShape(st.chords[0]));
    };
    const stop = () => {
      if (player) { player.stop(); stopAllSound(); }
      player = null;
      document.body.classList.remove("jg-playing");
      goBtn.textContent = "▶ Start";
      goBtn.classList.remove("jg-loop-stop");
      preview();
    };
    const start = () => {
      if (!st.chords.length) return;
      getAudioContext().resume?.();
      player = createGuitarPlayer({ fb: inst.fb, highway: inst.hw, items: items(), bpm: st.bpm, mode: "listen", loop: true, beatsPerBar: 4, onFinish: () => stop() });
      player.start();
      document.body.classList.add("jg-playing");
      goBtn.textContent = "■ Stop";
      goBtn.classList.add("jg-loop-stop");
      // Bring the chord name, arrows and fretboard into view.
      const host = panel.querySelector(".jg-instrument-host");
      const r = host.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0) host.scrollIntoView({ behavior: "smooth", block: "end" });
    };
    const drawChips = () => {
      sec.querySelector(".jg-loop-chips").innerHTML = st.chords.length
        ? st.chords.map((c, i) => `<button class="jg-loop-chip" data-del="${i}" aria-label="Remove ${c}">${c}<span aria-hidden="true">✕</span></button>`).join("")
        : '<span class="jg-note">Tap chords below to build your loop.</span>';
      goBtn.disabled = !st.chords.length;
    };
    const changed = () => { const was = Boolean(player); if (player) stop(); drawChips(); preview(); if (was) start(); };
    box = { destroy: () => { if (player) { player.stop(); stopAllSound(); } player = null; document.body.classList.remove("jg-playing"); } };
    sec.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.add) {
        if (st.chords.length >= 8) st.chords.shift();
        st.chords.push(b.dataset.add);
        if (!player) strum(shapeMidis(chordShape(b.dataset.add)));
        changed();
      } else if (b.dataset.del !== undefined) {
        st.chords.splice(Number(b.dataset.del), 1);
        changed();
      } else if (b.dataset.pat) {
        st.pattern = b.dataset.pat;
        sec.querySelectorAll("[data-pat]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
        changed();
      } else if (b.dataset.bpm) {
        st.bpm = Number(b.dataset.bpm);
        sec.querySelectorAll("[data-bpm]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
        changed();
      } else if (b === goBtn) {
        if (player) stop(); else start();
      }
    };
    drawChips();
    preview();
  }

  // Scales: the scale box on a fretboard window that fits the screen; when
  // it plays, the current note's string glows with a ring and its fret
  // number, the view says "A string, fret 5", the next note shows faintly.
  function scalesSection() {
    sec.innerHTML = `
      <div class="jg-card jg-scalecard">
        <div class="jg-scale-ctl">
          <label><span class="jg-label">Scale</span><select class="jg-sel jg-scale-sel">${SCALE_OPTS.map(([n, k]) => `<option value="${k}" ${k === st.scale ? "selected" : ""}>${n}</option>`).join("")}</select></label>
          <label><span class="jg-label">Key</span><select class="jg-sel jg-root-sel">${NOTE_NAMES.map((n, i) => `<option value="${i}" ${i === st.root ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        </div>
        <div class="jg-scale-ctl">
          <label class="jg-scale-pos"><span class="jg-label">Start at <b class="jg-pos-v">fret ${st.pos}</b></span><input type="range" min="0" max="12" value="${st.pos}" class="jg-pos"></label>
          <button class="jg-btn jg-btn-small jg-auto">Root on low E</button>
        </div>
        <p class="jg-note">One finger per fret. Orange dots are the root note. Press Start: the glowing string and ring show each note.</p>
      </div>
      <div class="jg-box"></div>`;
    const mount = () => {
      if (box) box.destroy();
      const notes = scaleBox(st.root, SCALES[st.scale], st.pos);
      const show = () => inst.fb.show(notes.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })));
      show();
      const seq = [...notes, ...[...notes].reverse().slice(1)];
      box = createPracticeBox(sec.querySelector(".jg-box"), inst, {
        items: () => seq.map((n, i) => ({ string: n.string, fret: n.fret, start: i * 0.5, dur: 0.5 })),
        bpm: 70, modes: ["listen", "wait", "timed"], mic: true,
        label: `${NOTE_NAMES[st.root]} ${SCALE_OPTS.find((o) => o[1] === st.scale)[0].toLowerCase()} · fret ${st.pos}`,
        key: `scale:${st.root}:${st.scale}:${st.pos}`, restore: show,
      });
    };
    sec.querySelector(".jg-scale-sel").addEventListener("change", (e) => { st.scale = e.target.value; mount(); });
    sec.querySelector(".jg-root-sel").addEventListener("change", (e) => { st.root = Number(e.target.value); mount(); });
    const r = sec.querySelector(".jg-pos");
    const setPos = (v) => { st.pos = v; r.value = v; sec.querySelector(".jg-pos-v").textContent = `fret ${v}`; mount(); };
    r.addEventListener("input", () => setPos(Number(r.value)));
    // Index finger on the root on the low E string.
    sec.querySelector(".jg-auto").addEventListener("click", () => setPos(((st.root - 4 + 12) % 12) || 12));
    mount();
  }

  function metronomeSection() {
    let beats = 4;
    let running = null;
    const taps = [];
    sec.innerHTML = `
      <div class="jg-card" style="text-align:center">
        <div class="jg-big jg-m-bpm">${st.bpm}</div><div class="jg-label">beats per minute</div>
        <input type="range" min="30" max="220" value="${st.bpm}" class="jg-m-range" style="width:min(420px,90%)">
        <div class="jg-row" style="justify-content:center">
          <button class="jg-btn jg-btn-primary jg-m-go">Start</button>
          <button class="jg-btn jg-m-tap">Tap tempo</button>
          ${[2, 3, 4, 6].map((n) => `<button class="jg-pill ${n === beats ? "jg-pill-active" : ""}" data-beats="${n}">${n}/${n === 6 ? 8 : 4}</button>`).join("")}
        </div>
        <div class="jg-strum jg-m-dots"></div>
        <p class="jg-note">Practise slowly with a click, then nudge it up 5 BPM at a time once it feels easy.</p>
      </div>`;
    const bpmEl = sec.querySelector(".jg-m-bpm");
    const range = sec.querySelector(".jg-m-range");
    const dots = sec.querySelector(".jg-m-dots");
    const go = sec.querySelector(".jg-m-go");
    const stop = () => { if (running) clearInterval(running.id); running = null; go.textContent = "Start"; dots.textContent = ""; };
    stopMetro = stop;
    const start = () => {
      const ctx = getAudioContext();
      ctx.resume?.();
      let next = ctx.currentTime + 0.1;
      let i = 0;
      running = { id: setInterval(() => {
        while (next < ctx.currentTime + 0.15) {
          const n = i % beats;
          click(n === 0, next - ctx.currentTime);
          const at = next;
          setTimeout(() => { if (running) dots.innerHTML = Array.from({ length: beats }, (_, k) => (k === n ? '<span class="jg-now">●</span>' : "○")).join(" "); }, Math.max(0, (at - ctx.currentTime) * 1000));
          next += 60 / st.bpm;
          i++;
        }
      }, 25) };
      go.textContent = "Stop";
    };
    const setBpm = (v) => { st.bpm = Math.max(30, Math.min(220, Math.round(v))); bpmEl.textContent = st.bpm; range.value = st.bpm; if (running) { stop(); start(); } };
    range.addEventListener("input", () => setBpm(Number(range.value)));
    go.addEventListener("click", () => (running ? stop() : start()));
    sec.querySelector(".jg-m-tap").addEventListener("click", () => {
      const now = performance.now();
      if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0;
      taps.push(now);
      if (taps.length > 5) taps.shift();
      if (taps.length >= 2) setBpm(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1)));
    });
    sec.querySelectorAll("[data-beats]").forEach((b) => b.addEventListener("click", () => {
      beats = Number(b.dataset.beats);
      sec.querySelectorAll("[data-beats]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
      if (running) { stop(); start(); }
    }));
  }

  function uploadSection() {
    sec.innerHTML = `
      <div class="jg-card">
        <h3 style="margin:4px 0">${icon("cassette", 26)} Upload any song and we'll find the chords!</h3>
        <p>Pick a song from your phone and we'll show the guitar shapes in time with the music.</p>
        <label class="jg-upload-pick">${icon("cassette", 22)} Choose a song<input type="file" accept="audio/*,video/*" class="jg-file jg-upload-input"></label>
        <p class="jg-upload-fine">(For fun and learning only: learn the songs you love, support the artists who make them, then write your own! It all runs on your device and nothing is stored.)</p>
        <p class="jg-status jg-note"></p>
      </div>
      <div class="jg-up-result"></div>`;
    const status = sec.querySelector(".jg-status");
    sec.querySelector(".jg-file").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = ""; // so picking the same file again still works
      if (!file) return;
      // A new song replaces the last one: stop it first.
      if (stopUpload) stopUpload();
      stopUpload = null;
      sec.querySelector(".jg-up-result").innerHTML = "";
      panel.querySelector(".jg-below").innerHTML = "";
      try {
        const notes = await transcribeFile(file, (t) => { status.textContent = t; });
        const hw = notes.map((n) => ({ midi: n.pitchMidi ?? n.midi, time: n.startTimeSeconds ?? n.time, duration: n.durationSeconds ?? n.duration }));
        const beat = estimateBeat(hw);
        // Slow songs can change chord every beat; faster ones every 2 beats.
        const win = beat ? (beat.beatSec >= 0.75 ? beat.beatSec : beat.beatSec * 2) : 1;
        const chords = [];
        simplifyToChords(hw, { windowSec: win, offsetSec: beat ? beat.offsetSec : 0 }).forEach((n) => {
          if (!chords.length || chords[chords.length - 1].time !== n.time) chords.push({ chord: n.chord, time: n.time, end: n.time + n.duration });
        });
        if (!chords.length) throw new Error("No chords found. Try a clearer recording.");
        const capo = suggestCapo(chords.map((c) => c.chord));
        status.textContent = `Found ${chords.length} chord changes${beat ? ` · about ${beat.bpm} BPM` : ""}.`;
        showUpload(file, chords, capo, beat, hw);
      } catch (err) {
        status.textContent = err.message;
      }
    });
  }

  // Songs in the library whose chord loop (in any key) matches what we heard.
  function loopShape(chs) {
    const parsed = chs.map((c) => parseChordSymbol(c)).filter(Boolean);
    return parsed.map((p, i) => {
      const next = parsed[(i + 1) % parsed.length];
      const minor = p.intervals.includes(3) && !p.intervals.includes(4);
      return `${minor ? "m" : "M"}${(next.root - p.root + 12) % 12}`;
    });
  }
  function sameChordSongs(chords) {
    const seq = [];
    chords.forEach((c) => { if (seq[seq.length - 1] !== c.chord) seq.push(c.chord); });
    if (seq.length < 3) return [];
    const heard = loopShape(seq).join(",");
    return SONGS.filter((song) => {
      const ch = (song.chords || []).filter((c) => /^[A-G]/.test(c)).map((c) => c.replace(/\/.*$/, "").replace(/maj7$/, "").replace(/m7$/, "m").replace(/(7|sus\d|add9|6)$/, ""));
      if (ch.length < 3) return false;
      const loop = loopShape(ch);
      for (let r = 0; r < loop.length; r++) if (heard.includes(loop.slice(r).concat(loop.slice(0, r)).join(","))) return true;
      return false;
    }).sort((a, b) => (b.confidence === "confirmed") - (a.confidence === "confirmed") || (a.popularityRank || 999) - (b.popularityRank || 999));
  }

  function showUpload(file, chords, capo, beat, heard) {
    const res = sec.querySelector(".jg-up-result");
    const below = panel.querySelector(".jg-below");
    const unique = [...new Set(chords.map((c) => c.chord))];
    let useCapo = capo.capo > 0;
    const shapeFor = (c) => (useCapo ? capo.map[c] : c);
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const matches = sameChordSongs(chords);
    // Play first, right above the fretboard...
    res.innerHTML = `
      <button class="jg-upload-bigplay jg-up-play">▶ Play</button>
      <div class="jg-row jg-up-view"><span class="jg-label">Show</span>
        <button class="jg-pill jg-pill-active" data-view="chords">Chords + strums</button>
        <button class="jg-pill" data-view="notes">The tune (single notes)</button></div>
      <audio class="jg-up-audio" preload="auto"></audio>`;
    // ...everything else below the fretboard.
    below.innerHTML = `
      <details class="jg-upload-settings">
        <summary>${icon("gear", 20)} Customise</summary>
        ${capo.capo ? `<div class="jg-row jg-set-row"><span class="jg-label">Capo</span><button class="jg-pill ${useCapo ? "jg-pill-active" : ""}" data-capo="1">Capo ${capo.capo} (easier)</button><button class="jg-pill ${useCapo ? "" : "jg-pill-active"}" data-capo="0">No capo</button></div>` : ""}
        <div class="jg-row jg-set-row"><span class="jg-label">Sound</span>
          <button class="jg-pill jg-pill-active" data-snd="song">Song</button>
          <button class="jg-pill" data-snd="guitar">Guitar</button>
          <button class="jg-pill" data-snd="both">Both</button></div>
        <div class="jg-diagram-row jg-up-dg"></div>
        ${canGuessSongs() ? `<div class="jg-row"><button class="jg-btn jg-up-guess">${icon("search", 18)} Guess the song</button></div><div class="jg-up-rec"></div>` : ""}
        ${matches.length ? `<div class="jg-up-match"><b>${icon("song", 18)} These songs use the same chords:</b><div class="jg-row">${matches.slice(0, 6).map((m) => `<button class="jg-btn jg-btn-small" data-song="${esc(m.title)}">${esc(m.title)} <span class="jg-label">· ${esc(m.artist)}</span></button>`).join("")}</div><small class="jg-note">Many songs share chords, so it's just a hint. Tap one to learn it.</small></div>` : ""}
        <p class="jg-note">These chords are our best guess (simple major and minor). Trust your ears!</p>
      </details>`;
    const audio = res.querySelector(".jg-up-audio");
    const playBtn = res.querySelector(".jg-up-play");
    setTimeout(() => playBtn.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    const url = URL.createObjectURL(file);
    audio.src = url;
    let snd = "song";
    let raf = null;
    let lastIdx = -1;
    const drawDg = () => { below.querySelector(".jg-up-dg").innerHTML = unique.map((c) => chordDiagramSvg(chordShape(shapeFor(c)), shapeFor(c) + (useCapo ? ` (${c})` : ""))).join(""); };
    drawDg();
    // Chords: the classic pop strum (D · D U · U D U) on the song's beat,
    // so each chord shows its arrows; one strum per chord if we couldn't
    // find a beat. The tune: the top note at each moment, placed where
    // it's easy to play (fret-map.js; the tune ignores the capo).
    const POP = ["down", null, "down", "up", null, "up", "down", "up"];
    let view = "chords";
    const chordEvs = () => {
      const out = [];
      const slot = beat ? beat.beatSec / 2 : 0;
      chords.forEach((c) => {
        const sym = shapeFor(c.chord);
        const shape = chordShape(sym);
        const before = out.length;
        if (slot) {
          for (let j = Math.ceil((c.time - beat.offsetSec) / slot - 1e-6); beat.offsetSec + j * slot < c.end - 0.02; j++) {
            const dir = POP[((j % 8) + 8) % 8];
            const t = beat.offsetSec + j * slot;
            if (dir) out.push({ t, d: slot * 0.95, span: slot, chord: sym, shape, strum: dir });
          }
        }
        if (out.length === before) out.push({ t: c.time, d: Math.max(0.2, c.end - c.time - 0.05), span: c.end - c.time, chord: sym, shape, strum: "down" });
      });
      return out;
    };
    const noteEvs = () => {
      const line = melodyLine(heard);
      const pos = placeMelody(line.map((n) => n.midi));
      return line.map((n, i) => ({ t: n.time, d: n.duration, span: n.duration, string: pos[i].string, fret: pos[i].fret }));
    };
    let evs = [];
    const loadView = () => {
      evs = view === "notes" ? noteEvs() : chordEvs();
      if (!evs.length && view === "notes") { view = "chords"; evs = chordEvs(); }
      inst.hw.preview(evs, { beatSec: beat ? beat.beatSec : 0, beatsPerBar: 4, origin: beat ? beat.offsetSec : 0, hint: "Press Play" });
      const first = evs[0];
      if (first && first.chord) inst.fb.showShape(first.shape);
      else if (first) inst.fb.show([{ string: first.string, fret: first.fret, tone: "root", label: String(first.fret) }]);
      res.querySelectorAll("[data-view]").forEach((x) => x.classList.toggle("jg-pill-active", x.dataset.view === view));
      lastIdx = -1;
    };
    loadView();
    res.querySelector(".jg-up-view").addEventListener("click", (e) => {
      const b = e.target.closest("[data-view]");
      if (!b) return;
      view = b.dataset.view;
      loadView();
    });
    const tick = () => {
      const t = audio.currentTime;
      const e = inst.hw.update(t);
      if (e && e.i0 !== lastIdx && t >= e.t - 0.03) {
        lastIdx = e.i0;
        if (snd !== "song" && !audio.paused) {
          if (e.chord && e.shape) { const m = shapeMidis(e.shape); strum(e.strum === "up" ? m.slice(-4) : m, { direction: e.strum, duration: e.d + 0.3 }); }
          else if (!e.chord) playNote(midiAt(e.string, e.fret), { duration: e.d + 0.2 });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    const setVolume = () => { audio.volume = snd === "guitar" ? 0 : snd === "both" ? 0.6 : 1; audio.muted = snd === "guitar"; };
    setVolume();
    audio.addEventListener("ended", () => { playBtn.textContent = "▶ Play"; });
    playBtn.addEventListener("click", () => {
      if (audio.paused) {
        getAudioContext().resume?.();
        audio.play().catch((err) => { playBtn.textContent = "▶ Play"; sec.querySelector(".jg-status").textContent = `This file won't play here (${err.message}).`; });
        playBtn.textContent = "⏸ Pause";
        if (!raf) tick();
      }
      else { audio.pause(); playBtn.textContent = "▶ Play"; }
    });
    below.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.capo !== undefined) { useCapo = b.dataset.capo === "1"; below.querySelectorAll("[data-capo]").forEach((x) => x.classList.toggle("jg-pill-active", x === b)); drawDg(); loadView(); }
      if (b.dataset.snd) { snd = b.dataset.snd; below.querySelectorAll("[data-snd]").forEach((x) => x.classList.toggle("jg-pill-active", x === b)); setVolume(); }
      if (b.dataset.song) openSongByTitle(b.dataset.song);
      if (b.classList.contains("jg-up-guess")) {
        const box = below.querySelector(".jg-up-rec");
        b.disabled = true;
        b.textContent = "🎧 Listening…";
        guessLastUpload().then((r) => {
          b.disabled = false;
          b.innerHTML = `${icon("search", 18)} Guess the song`;
          if (!r || !r.found) { box.innerHTML = '<div class="jg-up-rec-box">Couldn\'t find this song. Try a clearer part of it.</div>'; return; }
          const inLib = SONGS.find((s) => s.title.toLowerCase() === String(r.title).toLowerCase());
          box.innerHTML = `<div class="jg-up-rec-box">${r.artworkURL ? `<img src="${esc(r.artworkURL)}" alt="" class="jg-up-rec-art">` : ""}
            <div><div>We think this is</div><b>${esc(r.title)}</b><div class="jg-label">${esc(r.artist)}</div>
            <div class="jg-row">${inLib ? `<button class="jg-btn jg-btn-small jg-btn-primary" data-song="${esc(inLib.title)}">Learn the whole song</button>` : ""}
            ${r.appleMusicURL ? `<a class="jg-btn jg-btn-small" href="${esc(r.appleMusicURL)}" target="_blank" rel="noopener">Open in Apple Music</a>` : ""}</div></div></div>`;
        });
      }
    };
    stopUpload = () => { audio.pause(); if (raf) cancelAnimationFrame(raf); raf = null; URL.revokeObjectURL(url); stopAllSound(); inst.hw.reset(); };
  }


  // All chords: 4 rows (major, minor, 7th, maj7/m7/sus), each a strip of
  // chord names you scroll sideways. Four diagrams show at a time: the
  // chord you tapped and its neighbours in that row. Tapping one plays it
  // and puts it on the fretboard.
  function librarySection() {
    sec.innerHTML = `
      <div class="jg-card jg-libcard">
        <p class="jg-lib-intro"><strong>Every chord in the app.</strong> Tap a name to see it, hear it and put it on the fretboard. Scroll a row sideways for more.</p>
        ${LIB_ROWS.map(([label, list], ri) => `<div class="jg-lib-row"><div class="jg-lib-rowname">${label}</div>
          <div class="jg-chord-strip" data-row="${ri}">${list.map((c, i) => `<button class="jg-chord-btn" data-r="${ri}" data-i="${i}">${c}</button>`).join("")}</div></div>`).join("")}
        <div class="jg-lib4"></div>
      </div>`;
    const select = (ri, i, { play = true, scroll = true } = {}) => {
      st.lib = [ri, i];
      const list = LIB_ROWS[ri][1];
      const from = Math.max(0, Math.min(i, list.length - 4));
      sec.querySelector(".jg-lib4").innerHTML = list.slice(from, from + 4).map((c, k) =>
        `<button class="jg-dg-btn jg-lib4-dg ${from + k === i ? "jg-lib4-on" : ""}" data-r="${ri}" data-i="${from + k}" aria-label="${c}">${chordDiagramSvg(chordShape(c), c)}</button>`).join("");
      sec.querySelectorAll(".jg-chord-btn").forEach((b) => b.classList.toggle("jg-chord-on", Number(b.dataset.r) === ri && Number(b.dataset.i) === i));
      if (scroll) {
        const strip = sec.querySelector(`.jg-chord-strip[data-row="${ri}"]`);
        const btn = strip.querySelector(`[data-i="${i}"]`);
        strip.scrollTo({ left: Math.max(0, btn.offsetLeft - strip.offsetLeft - 8), behavior: "smooth" });
      }
      const sh = chordShape(list[i]);
      inst.fb.showShape(sh);
      if (play) strum(shapeMidis(sh));
    };
    sec.onclick = (e) => {
      const b = e.target.closest("[data-r]");
      if (!b) return;
      select(Number(b.dataset.r), Number(b.dataset.i), { scroll: !b.classList.contains("jg-chord-btn") });
    };
    select(st.lib[0], st.lib[1], { play: false });
  }
  const SECTIONS = { library: librarySection, chords: chordsSection, scales: scalesSection, metronome: metronomeSection, upload: uploadSection };
  panel.querySelectorAll("[data-sec]").forEach((b) => b.addEventListener("click", () => {
    panel.querySelectorAll("[data-sec]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
    clearSec();
    sec.onclick = null;
    SECTIONS[b.dataset.sec]();
  }));
  chordsSection();
}

export { renderPractice, leavePractice };
