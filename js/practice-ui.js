import { icon } from "./icons.js";
// Practice tab: build a chord loop, drill a scale, a metronome with tap
// tempo, and "upload a song" — the app works out the chords from your
// own recording and shows the guitar shapes in time with it.

import { chordShape, shapeMidis, scaleBox, SCALES, NOTE_NAMES, suggestCapo } from "./guitar-theory.js";
import { chordDiagramSvg } from "./fretboard.js";
import { strum, click, getAudioContext } from "./guitar-audio.js";
import { mountInstrument, createPracticeBox } from "./practice-widget.js";
import { chordTimeline } from "./guitar-player.js";
import { transcribeFile, estimateBeat, simplifyToChords, guessLastUpload, canGuessSongs } from "./transcribe.js";
import { SONGS } from "./songs-data.js";
import { parseChordSymbol } from "./chord-utils.js";
import { openSongByTitle } from "./songs-ui.js";

const CHORDS = ["G", "C", "D", "Em", "Am", "E", "A", "Dm", "F", "Bm", "E7", "A7", "D7", "G7", "B7", "Cmaj7", "Am7", "Em7", "Dsus4", "Asus2", "E5", "A5"];
const PATTERNS = {
  "D·DU·UDU": ["down", null, "down", "up", null, "up", "down", "up"],
  "Down ×4": ["down", "down", "down", "down"],
  "Down-up ×4": ["down", "up", "down", "up", "down", "up", "down", "up"],
  "Waltz (3/4)": ["down", "down", "down"],
};
const SCALE_OPTS = [
  ["Minor pentatonic", "minorPentatonic"], ["Major pentatonic", "majorPentatonic"], ["Blues", "blues"],
  ["Major", "major"], ["Natural minor", "naturalMinor"], ["Harmonic minor", "harmonicMinor"],
];

let cleanup = [];
function leavePractice() {
  cleanup.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  cleanup = [];
}

function renderPractice(panel) {
  leavePractice();
  const st = { chords: ["G", "D", "Em", "C"], pattern: "D·DU·UDU", bpm: 80, root: 9, scale: "minorPentatonic", pos: 5, section: "chords" };
  panel.innerHTML = `
    <div class="jg-row">
      <img class="jg-inline-mascot" src="assets/mascot/running-guitar.webp" alt="">
      <button class="jg-pill jg-pill-active" data-sec="chords">${icon("guitar", 16)} Chord loop</button>
      <button class="jg-pill" data-sec="scales">${icon("song", 16)} Scales</button>
      <button class="jg-pill" data-sec="library">${icon("star", 16)} All chords</button>
      <button class="jg-pill" data-sec="metronome">${icon("tuner", 16)} Metronome</button>
      <button class="jg-pill" data-sec="upload">${icon("folder", 16)} Upload a song</button>
    </div>
    <div class="jg-sec"></div>
    <div class="jg-instrument-host"></div>
    <div class="jg-below"></div>`;
  const sec = panel.querySelector(".jg-sec");
  const inst = mountInstrument(panel.querySelector(".jg-instrument-host"), { frets: 15 });
  cleanup.push(() => inst.hw.destroy());
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
    inst.hw.render(0, []);
    panel.querySelector(".jg-below").innerHTML = "";
  };
  cleanup.push(clearSec);

  function chordsSection() {
    sec.innerHTML = `
      <div class="jg-card">
        <p><strong>Your loop:</strong> <span class="jg-loop"></span> <button class="jg-btn jg-btn-small jg-clear">Clear</button></p>
        <div class="jg-row">${CHORDS.map((c) => `<button class="jg-pill" data-add="${c}">${c}</button>`).join("")}</div>
        <div class="jg-row"><span class="jg-label">Strum</span>${Object.keys(PATTERNS).map((k) => `<button class="jg-pill ${k === st.pattern ? "jg-pill-active" : ""}" data-pat="${k}">${k}</button>`).join("")}</div>
        <div class="jg-row"><span class="jg-label">Tempo</span><input type="range" min="40" max="160" value="${st.bpm}" class="jg-bpm"><span class="jg-bpm-v">${st.bpm} BPM</span></div>
        <div class="jg-diagram-row jg-loop-dg"></div>
      </div>
      <div class="jg-box"></div>`;
    const mount = () => {
      if (box) box.destroy();
      sec.querySelector(".jg-loop").textContent = st.chords.join(" – ") || "(tap chords below)";
      sec.querySelector(".jg-loop-dg").innerHTML = [...new Set(st.chords)].map((c) => chordDiagramSvg(chordShape(c), c)).join("");
      if (!st.chords.length) { sec.querySelector(".jg-box").innerHTML = ""; return; }
      const pat = PATTERNS[st.pattern];
      const items = () => chordTimeline(st.chords.map((c) => ({ chord: c, shape: chordShape(c) })), { beatsPerChord: pat.length === 3 ? 3 : 4, pattern: pat });
      box = createPracticeBox(sec.querySelector(".jg-box"), inst, { items, bpm: st.bpm, modes: ["listen", "wait"], label: "Chord loop", drums: pat.length !== 3, key: null, restore: () => inst.fb.showShape(chordShape(st.chords[0])) });
      inst.fb.showShape(chordShape(st.chords[0]));
    };
    sec.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.add) {
        if (st.chords.length >= 8) st.chords.shift();
        st.chords.push(b.dataset.add);
        strum(shapeMidis(chordShape(b.dataset.add)));
        mount();
      } else if (b.classList.contains("jg-clear")) { st.chords = []; mount(); }
      else if (b.dataset.pat) {
        st.pattern = b.dataset.pat;
        sec.querySelectorAll("[data-pat]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
        mount();
      }
    };
    const r = sec.querySelector(".jg-bpm");
    r.addEventListener("input", () => { sec.querySelector(".jg-bpm-v").textContent = `${r.value} BPM`; });
    r.addEventListener("change", () => { st.bpm = Number(r.value); mount(); });
    mount();
  }

  function scalesSection() {
    sec.innerHTML = `
      <div class="jg-card">
        <div class="jg-row"><span class="jg-label">Scale</span>${SCALE_OPTS.map(([n, k]) => `<button class="jg-pill ${k === st.scale ? "jg-pill-active" : ""}" data-scale="${k}">${n}</button>`).join("")}</div>
        <div class="jg-row"><span class="jg-label">Key</span>${NOTE_NAMES.map((n, i) => `<button class="jg-pill ${i === st.root ? "jg-pill-active" : ""}" data-root="${i}">${n}</button>`).join("")}</div>
        <div class="jg-row"><span class="jg-label">Position (lowest fret)</span><input type="range" min="0" max="12" value="${st.pos}" class="jg-pos"><span class="jg-pos-v">fret ${st.pos}</span>
          <button class="jg-btn jg-btn-small jg-auto">Find the root position</button></div>
        <p class="jg-note">One finger per fret across a 4-fret box. Roots are orange. Go slowly with Wait for me and the microphone — clean first, then speed.</p>
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
        bpm: 70, modes: ["listen", "wait", "timed"], mic: true, showTab: true,
        label: `${NOTE_NAMES[st.root]} ${SCALE_OPTS.find((o) => o[1] === st.scale)[0].toLowerCase()} · fret ${st.pos}`,
        key: `scale:${st.root}:${st.scale}:${st.pos}`, restore: show,
      });
    };
    sec.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.scale) st.scale = b.dataset.scale;
      else if (b.dataset.root) st.root = Number(b.dataset.root);
      else if (b.classList.contains("jg-auto")) {
        // Index finger on the root on the low E string
        st.pos = ((st.root - 4 + 12) % 12) || 12;
        if (st.pos > 12) st.pos -= 12;
      } else return;
      scalesSection();
    };
    const r = sec.querySelector(".jg-pos");
    r.addEventListener("input", () => { st.pos = Number(r.value); sec.querySelector(".jg-pos-v").textContent = `fret ${st.pos}`; mount(); });
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
        <h3 style="margin:4px 0">${icon("folder", 26)} Upload any song and we'll find the chords for you!</h3>
        <p>Pick a song from your phone (a few seconds is enough). We'll show the guitar shapes in time with the music.</p>
        <label class="jg-upload-pick">${icon("folder", 22)} Choose a song<input type="file" accept="audio/*,video/*" class="jg-file jg-upload-input"></label>
        <p class="jg-upload-fine">(Jaxx Guitar is for entertainment and learning only. We've added this feature for you to record any song from your phone and upload it, only for the purpose of learning the songs you love and support the artists who create beautiful things in this world. The real fun begins when you get inspired and create your own original music! Our model runs on your device only, we don't store any data.)</p>
        <p class="jg-status jg-note"></p>
      </div>
      <div class="jg-up-result"></div>`;
    const status = sec.querySelector(".jg-status");
    sec.querySelector(".jg-file").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
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
        if (!chords.length) throw new Error("No chords found — try a clearer recording.");
        const capo = suggestCapo(chords.map((c) => c.chord));
        status.textContent = `Found ${chords.length} chord changes${beat ? ` · about ${beat.bpm} BPM (an estimate)` : ""}.`;
        showUpload(file, chords, capo, beat);
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

  function showUpload(file, chords, capo, beat) {
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
      <div class="jg-big jg-up-now"></div>
      <audio class="jg-up-audio" preload="auto"></audio>`;
    // ...everything else below the fretboard.
    below.innerHTML = `
      <details class="jg-upload-settings">
        <summary>${icon("gear", 20)} Customise: capo, sound, chord shapes, guess the song</summary>
        <div class="jg-row">
          ${capo.capo ? `<button class="jg-pill ${useCapo ? "jg-pill-active" : ""}" data-capo="1">Capo ${capo.capo} (easier shapes)</button><button class="jg-pill ${useCapo ? "" : "jg-pill-active"}" data-capo="0">No capo</button>` : ""}
        </div>
        <div class="jg-row"><span class="jg-label">Sound</span>
          <button class="jg-pill jg-pill-active" data-snd="song">Original song</button>
          <button class="jg-pill" data-snd="guitar">Guitar only</button>
          <button class="jg-pill" data-snd="both">Guitar + song</button></div>
        <div class="jg-diagram-row jg-up-dg"></div>
        ${canGuessSongs() ? '<div class="jg-row"><button class="jg-btn jg-up-guess">${icon("search", 18)} Guess the song</button></div><div class="jg-up-rec"></div>' : ""}
        ${matches.length ? `<div class="jg-up-match"><b>${icon("song", 18)} These songs use the same chords:</b><div class="jg-row">${matches.slice(0, 6).map((m) => `<button class="jg-btn jg-btn-small" data-song="${esc(m.title)}">${esc(m.title)} <span class="jg-label">· ${esc(m.artist)}</span></button>`).join("")}</div><small class="jg-note">Lots of songs share chords, so this is a hint. Tap one to learn the whole song.</small></div>` : ""}
        <p class="jg-note">These chords are a best guess from the recording: simple major/minor versions. Trust your ears where they disagree.</p>
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
    const notesFor = () => chords.flatMap((c) => {
      const sh = chordShape(shapeFor(c.chord));
      return sh ? sh.frets.map((f, s) => (f >= 0 ? { string: s, fret: f, time: c.time, duration: Math.max(0.2, c.end - c.time - 0.05) } : null)).filter(Boolean) : [];
    });
    let notes = notesFor();
    const tick = () => {
      const t = audio.currentTime;
      const idx = chords.findIndex((c) => t >= c.time && t < c.end);
      if (idx !== lastIdx) {
        lastIdx = idx;
        const c = chords[idx];
        if (c) {
          const sh = chordShape(shapeFor(c.chord));
          inst.fb.showShape(sh);
          res.querySelector(".jg-up-now").textContent = shapeFor(c.chord);
          if (snd !== "song" && sh && !audio.paused) strum(shapeMidis(sh), { duration: Math.min(3, c.end - c.time) });
        }
      }
      inst.hw.render(t, notes, { chordLabel: "" });
      raf = requestAnimationFrame(tick);
    };
    const setVolume = () => { audio.volume = snd === "guitar" ? 0 : snd === "both" ? 0.6 : 1; audio.muted = snd === "guitar"; };
    setVolume();
    audio.addEventListener("ended", () => { playBtn.textContent = "▶ Play"; });
    playBtn.addEventListener("click", () => {
      if (audio.paused) { getAudioContext().resume?.(); audio.play(); playBtn.textContent = "⏸ Pause"; if (!raf) tick(); }
      else { audio.pause(); playBtn.textContent = "▶ Play"; }
    });
    below.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.capo !== undefined) { useCapo = b.dataset.capo === "1"; below.querySelectorAll("[data-capo]").forEach((x) => x.classList.toggle("jg-pill-active", x === b)); drawDg(); notes = notesFor(); lastIdx = -1; }
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
    stopUpload = () => { audio.pause(); if (raf) cancelAnimationFrame(raf); raf = null; URL.revokeObjectURL(url); };
  }


  function librarySection() {
    const QUALITIES = [["", "major"], ["m", "minor"], ["7", "7"], ["maj7", "maj7"], ["m7", "m7"], ["sus2", "sus2"], ["sus4", "sus4"], ["5", "power"], ["dim", "dim"], ["6", "6"]];
    const ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
    let root = "C";
    sec.innerHTML = `
      <div class="jg-card">
        <p><strong>Every common chord, in every key.</strong> Pick a root note, then tap any chord to see it on the fretboard and hear it. Open shapes are shown when there's an easy one; otherwise the movable barre shape.</p>
        <div class="jg-row">${ROOTS.map((r) => `<button class="jg-pill ${r === root ? "jg-pill-active" : ""}" data-root="${r}">${r}</button>`).join("")}</div>
        <div class="jg-diagram-row jg-lib"></div>
      </div>`;
    const draw = () => {
      sec.querySelector(".jg-lib").innerHTML = QUALITIES.map(([q, label]) => {
        const sym = root + q;
        const sh = chordShape(sym);
        return sh ? `<button class="jg-btn jg-dg-btn" data-chord="${sym}" title="${sym} (${label})">${chordDiagramSvg(sh, sym)}</button>` : "";
      }).join("");
    };
    sec.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.root) {
        root = b.dataset.root;
        sec.querySelectorAll("[data-root]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
        draw();
      } else if (b.dataset.chord) {
        const sh = chordShape(b.dataset.chord);
        inst.fb.showShape(sh);
        strum(shapeMidis(sh));
      }
    };
    draw();
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
