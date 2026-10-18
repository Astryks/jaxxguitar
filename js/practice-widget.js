// The one practice box every part of Jaxx Guitar uses (lessons, songs,
// the Practice tab): the calm play-along view over a fretboard (chord name,
// shape and strum arrows; or the current note's fret with a glowing ring,
// play-along-view.js), with
//   Listen         - the app plays it, you watch the shapes
//   Wait for me    - it waits at each note/chord until it hears you
//                    (microphone, or tap the fretboard)
//   Play in time   - single notes only; scored, ±0.25s window
// plus speed, loop, a drum beat, tab (for single-note pieces) and stars.

import { renderFretboard, tabSvg } from "./fretboard.js";
import { createPlayAlongView } from "./play-along-view.js";
import { createGuitarPlayer, timelineEvents } from "./guitar-player.js";
import { enableMic, disableMic, micOn } from "./input-hub.js";
import { friendlyMicError } from "./pitch.js";
import { getAudioContext, stopAllSound } from "./guitar-audio.js";
import { playBeat } from "./drums.js";
import { icon } from "./icons.js";
import { starsFor, recordStars, awardXp, completeQuest } from "./storage.js";

const MODE_LABELS = { listen: ["play", "Listen"], wait: ["hand", "Wait for me"], timed: ["tuner", "Play in time"] };

// An instrument: the play-along view on top of a fretboard. Returns
// { fb, hw, el } (hw = the view; the name is kept from the old highway).
const NO_VIEW = { load() {}, update() {}, preview() {}, reset() {}, destroy() {} };
// fit: on a phone held upright, show a window of frets that fits the
// screen (follows the shape / notes) instead of a sideways-scrolling neck.
function mountInstrument(container, { frets = 12, highway = true, fit = false } = {}) {
  container.innerHTML = `<div class="jg-instrument">${highway ? '<div class="jg-pav-host"></div>' : ""}<div class="jg-fb"></div></div>`;
  const fb = renderFretboard(container.querySelector(".jg-fb"), { frets, fit });
  const hw = highway ? createPlayAlongView(container.querySelector(".jg-pav-host"), fb, container) : NO_VIEW;
  return { fb, hw, el: container.firstElementChild };
}

// opts: { items: () => timeline, bpm, modes, mic, label, showTab, key, onDone, restore, drums }
function createPracticeBox(host, inst, opts) {
  const modes = opts.modes || ["listen"];
  const hasChords = () => opts.items().some((i) => i.chord);
  let mode = modes.includes("wait") && opts.preferWait ? "wait" : modes[0];
  let speed = 1;
  let loop = false;
  let drums = Boolean(opts.drums);
  let player = null;
  let drumTimer = null;
  let micByUs = false;

  host.innerHTML = `
    <div class="jg-card jg-practice">
      <div class="jg-row"><strong>${opts.label || "Practice"}</strong> <span class="jg-stars jg-pb-stars"></span></div>
      <div class="jg-row jg-pb-modes">${modes.map((m) => `<button class="jg-pill" data-mode="${m}">${icon(MODE_LABELS[m][0], 16)} ${MODE_LABELS[m][1]}</button>`).join("")}</div>
      <div class="jg-row">
        <span class="jg-label">Speed</span>
        ${[0.5, 0.75, 1].map((s) => `<button class="jg-pill" data-speed="${s}">${Math.round(s * 100)}%</button>`).join("")}
        <span class="jg-label" style="margin-left:8px">${opts.bpm || 80} BPM</span>
        <button class="jg-pill jg-pb-loop">${icon("loop", 16)} Loop</button>
        <button class="jg-pill jg-pb-drums">${icon("drum", 16)} Beat</button>
        ${opts.mic || modes.includes("wait") ? `<button class="jg-pill jg-pb-mic">${icon("mic", 16)} Microphone</button>` : ""}
      </div>
      <p class="jg-note jg-pb-hint"></p>
      ${opts.showTab ? '<div class="jg-tab-wrap jg-pb-tab"></div>' : ""}
      <div class="jg-row">
        <button class="jg-btn jg-btn-primary jg-pb-go">Start</button>
        <span class="jg-score jg-pb-result"></span>
      </div>
    </div>`;
  const $ = (s) => host.querySelector(s);
  const goBtn = $(".jg-pb-go");
  const result = $(".jg-pb-result");
  const hint = $(".jg-pb-hint");

  function refresh() {
    host.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("jg-pill-active", b.dataset.mode === mode));
    host.querySelectorAll("[data-speed]").forEach((b) => b.classList.toggle("jg-pill-active", Number(b.dataset.speed) === speed));
    $(".jg-pb-loop").classList.toggle("jg-pill-active", loop);
    $(".jg-pb-loop").style.display = mode === "listen" ? "" : "none";
    $(".jg-pb-drums").classList.toggle("jg-pill-active", drums);
    const mic = $(".jg-pb-mic");
    if (mic) {
      mic.classList.toggle("jg-pill-active", micOn());
      mic.innerHTML = `${icon("mic", 16)} ${micOn() ? "Listening" : "Microphone"}`;
    }
    hint.textContent =
      mode === "listen" ? (hasChords()
        ? "Watch and listen: the chord's shape is on the fretboard (numbers = fingers, 1 = index, 4 = pinky) and the arrows show the strum, lighting up in time."
        : "Watch and listen: the glowing ring shows the string and fret to play; the faint dot is the next note.")
      : mode === "wait" ? (hasChords()
        ? "It waits at each new chord: strum it and it moves on (it hears any note from that chord, or tap a lit note). Then strum along with the arrows."
        : "Play the note in the ring. It waits until it hears it (or tap the lit note).")
      : "Play each note as its ring lights up. You have a quarter of a second either way.";
    if (mode !== "listen" && !micOn()) hint.textContent += " Tap Microphone to use your real guitar (it only listens to your strings).";
  }

  function drawTab(current = -1) {
    const wrap = $(".jg-pb-tab");
    if (!wrap) return;
    const items = opts.items().filter((i) => !i.chord);
    const total = Math.max(...items.map((i) => i.start + i.dur));
    const bars = Math.max(1, Math.ceil(total / 4 - 1e-6));
    const cur = new Set(current >= 0 ? [current] : []);
    const done = new Set(items.map((_, i) => i).filter((i) => i < current));
    wrap.innerHTML = tabSvg(items, { beatsPerBar: 4, bars, current: cur, done });
  }

  function stopDrums() {
    if (drumTimer) clearInterval(drumTimer);
    drumTimer = null;
  }
  function startDrums(bpm) {
    const ctx = getAudioContext();
    const beat = 60 / bpm;
    // The player has a 1.6s lead-in; line beat 0 up with the first note
    // and count in during the lead-in.
    let next = ctx.currentTime + 1.6 - Math.floor(1.6 / beat) * beat;
    let i = -Math.floor(1.6 / beat);
    drumTimer = setInterval(() => {
      while (next < ctx.currentTime + 0.2) {
        playBeat(ctx, i, next);
        next += beat;
        i++;
      }
    }, 50);
  }

  // Before Start: the view shows the first chord and its arrows (or the
  // first notes), nothing lit.
  function preview() {
    try { inst.hw.preview(timelineEvents(opts.items(), { bpm: opts.bpm || 80, speed }), { beatSec: 60 / (opts.bpm || 80) / speed, beatsPerBar: opts.beatsPerBar || 4, origin: 1.6 }); } catch (e) { console.error(e); }
  }

  function stop({ again = true } = {}) {
    document.body.classList.remove("jg-playing");
    if (player) { player.stop(); stopAllSound(); }
    player = null;
    stopDrums();
    goBtn.textContent = "Start";
    if (opts.restore) opts.restore();
    if (again) preview();
    else inst.hw.reset();
  }

  function start() {
    result.textContent = "";
    const items = opts.items();
    const bpm = opts.bpm || 80;
    getAudioContext().resume?.();
    player = createGuitarPlayer({
      fb: inst.fb, highway: inst.hw, items, bpm, mode, speed, loop: loop && mode === "listen", beatsPerBar: opts.beatsPerBar || 4,
      onStep: ({ item }) => {
        if (item && !item.chord && opts.showTab) drawTab(items.filter((i) => !i.chord).indexOf(item));
      },
      onFinish: (r) => {
        player = null;
        document.body.classList.remove("jg-playing");
        stopDrums();
        goBtn.textContent = "Start again";
        if (opts.showTab) drawTab(-1);
        if (r.mode === "listen") {
          result.textContent = "Now try it yourself with Wait for me.";
          if (!modes.includes("wait")) result.textContent = "";
        } else {
          const stars = starsFor(r.accuracy);
          const key = opts.key ? `${opts.key}:${r.mode}` : null;
          if (key) {
            const { best, improved } = recordStars(key, stars);
            if (improved) awardXp(5 * stars, "New best");
            showStars(best);
          }
          if (r.accuracy >= 80) completeQuest("practice");
          result.innerHTML = r.mode === "timed"
            ? `${r.hits}/${r.total} on time · ${r.accuracy}% · best combo ${r.maxCombo} <span class="jg-stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span>`
            : `${r.accuracy}% right first time · best combo ${r.maxCombo} <span class="jg-stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span>`;
        }
        if (opts.onDone) opts.onDone(r);
        inst.hw.reset();
        if (opts.restore) opts.restore();
        preview();
      },
    });
    player.start();
    document.body.classList.add("jg-playing");
    if (drums) startDrums(bpm * speed);
    goBtn.textContent = "Stop";
  }

  function showStars(best) {
    $(".jg-pb-stars").textContent = best ? "★".repeat(best) + "☆".repeat(3 - best) : "";
  }
  if (opts.key) {
    try {
      const all = JSON.parse(localStorage.getItem("jg_stars") || "{}");
      showStars(Math.max(0, ...modes.map((m) => all[`${opts.key}:${m}`] || 0)));
    } catch (e) { /* storage unavailable */ }
  }

  host.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.mode) { stop(); mode = b.dataset.mode; }
    else if (b.dataset.speed) { stop(); speed = Number(b.dataset.speed); }
    else if (b.classList.contains("jg-pb-loop")) loop = !loop;
    else if (b.classList.contains("jg-pb-drums")) { drums = !drums; if (!drums) stopDrums(); }
    else if (b.classList.contains("jg-pb-mic")) {
      if (micOn()) { disableMic(); micByUs = false; }
      else {
        try { await enableMic(); micByUs = true; } catch (err) { hint.textContent = `The microphone didn't start: ${friendlyMicError(err)}. You can still tap the fretboard.`; return; }
      }
    } else if (b === goBtn) {
      if (player) stop();
      else start();
    }
    refresh();
  });

  // Play-in-time scoring is for single notes (the mic can't time a strum).
  if (hasChords()) host.querySelector('[data-mode="timed"]')?.remove();
  if (mode === "timed" && hasChords()) mode = "listen";
  refresh();
  drawTab(-1);
  preview();

  return {
    stop: () => stop(),
    destroy() {
      stop({ again: false });
      if (micByUs) disableMic();
    },
  };
}

export { mountInstrument, createPracticeBox };
