// The strum loop for guitar (replaces the falling "tetris" blocks, which
// are a piano idea): the chord's frets light up on the fretboard in one
// colour, and a row of strum arrows (↓ down, ↑ up) lights up in time with
// the beat, "1 & 2 & 3 & 4 &". Gaps show where the hand still swings but
// misses the strings. One button: Play, and it keeps looping until Stop.
//
// createStrumLoop(host, inst, { chords, pattern, bpm, beatsPerChord })
//   pattern: 8 slots per bar (eighth notes): "down" | "up" | null

import { getAudioContext, strum, stopAllSound } from "./guitar-audio.js";
import { chordShape, shapeMidis } from "./guitar-theory.js";
import { icon } from "./icons.js";

const COUNT = ["1", "&", "2", "&", "3", "&", "4", "&"];
const DOWNS = ["down", null, "down", null, "down", null, "down", null];

function createStrumLoop(host, inst, { chords = ["G"], pattern = DOWNS, bpm = 70, beatsPerChord = 4, label } = {}) {
  const slotsPerChord = Math.round(beatsPerChord * 2);
  const slots = Array.from({ length: slotsPerChord }, (_, i) => pattern[i % pattern.length]);
  host.innerHTML = `
    <div class="jg-strumloop">
      <div class="jg-sl-top"><span class="jg-sl-chord">${chords[0]}</span>${chords.length > 1 ? `<span class="jg-sl-seq">${chords.map((c, i) => `<i data-ci="${i}">${c}</i>`).join("")}</span>` : ""}</div>
      <div class="jg-sl-row">${slots.map((d, i) => `<div class="jg-sl-slot ${d ? "jg-sl-" + d : "jg-sl-miss"}" data-i="${i}"><span class="jg-sl-arrow">${d === "down" ? "↓" : d === "up" ? "↑" : (i % 2 ? "↑" : "↓")}</span><span class="jg-sl-count">${COUNT[i % 8]}</span></div>`).join("")}</div>
      <p class="jg-note jg-sl-legend">${label ? `<b>${label}</b> · ` : ""}Big arrow = strum. Faded arrow = your hand still swings but <b>misses</b> the strings.</p>
      <div class="jg-row" style="justify-content:center"><button class="jg-btn jg-btn-primary jg-sl-go" type="button">${icon("play", 18)} Play</button></div>
    </div>`;
  const go = host.querySelector(".jg-sl-go");
  const slotEls = [...host.querySelectorAll(".jg-sl-slot")];
  const chordEl = host.querySelector(".jg-sl-chord");
  const seqEls = [...host.querySelectorAll("[data-ci]")];
  let timer = null;
  let raf = null;
  let t0 = 0;
  let nextIdx = 0;
  const slotSec = 60 / bpm / 2;
  const showChord = (ci) => {
    const c = chords[ci % chords.length];
    chordEl.textContent = c;
    seqEls.forEach((e) => e.classList.toggle("jg-sl-now", Number(e.dataset.ci) === ci % chords.length));
    inst?.fb.showShape(chordShape(c));
  };
  showChord(0);

  function schedule() {
    const ctx = getAudioContext();
    while (t0 + nextIdx * slotSec < ctx.currentTime + 0.25) {
      const i = nextIdx;
      const dir = slots[i % slotsPerChord];
      const ci = Math.floor(i / slotsPerChord);
      if (dir) {
        const midis = shapeMidis(chordShape(chords[ci % chords.length]));
        const delay = Math.max(0, t0 + i * slotSec - ctx.currentTime);
        // Up-strums catch only the thinner strings, and are a bit softer.
        strum(dir === "up" ? midis.slice(-4) : midis, { direction: dir, delay, duration: slotSec * 2.2, gain: dir === "up" ? 0.18 : 0.24 });
      }
      nextIdx++;
    }
  }
  let lastShown = -1;
  function draw() {
    const ctx = getAudioContext();
    const i = Math.floor((ctx.currentTime - t0) / slotSec);
    if (i >= 0 && i !== lastShown) {
      lastShown = i;
      const s = i % slotsPerChord;
      slotEls.forEach((el, k) => el.classList.toggle("jg-sl-on", k === s));
      if (s === 0) showChord(Math.floor(i / slotsPerChord));
    }
    raf = requestAnimationFrame(draw);
  }
  function start() {
    const ctx = getAudioContext();
    t0 = ctx.currentTime + 0.15;
    nextIdx = 0;
    lastShown = -1;
    schedule();
    timer = setInterval(schedule, 60);
    raf = requestAnimationFrame(draw);
    go.innerHTML = `${icon("stop", 18) || "■"} Stop`;
    host.querySelector(".jg-strumloop").classList.add("jg-sl-playing");
  }
  function stop() {
    if (timer) stopAllSound();
    if (timer) clearInterval(timer);
    if (raf) cancelAnimationFrame(raf);
    timer = null; raf = null;
    slotEls.forEach((el) => el.classList.remove("jg-sl-on"));
    go.innerHTML = `${icon("play", 18)} Play`;
    host.querySelector(".jg-strumloop")?.classList.remove("jg-sl-playing");
    showChord(0);
  }
  go.addEventListener("click", () => (timer ? stop() : start()));
  return { stop, destroy: stop };
}

export { createStrumLoop, DOWNS };
