// Practice engine for Jaxx Guitar: drives the fretboard and the calm
// play-along view (play-along-view.js: chord name + shape + strum arrows,
// or the current note's fret with a glowing ring) from a timeline of notes
// and chords, and listens to every input (fretboard taps, the microphone)
// through input-hub.js.
//
//   mode "listen" - the app plays it for you.
//   mode "wait"   - it stops at each new chord and each note until you
//                   play it. Single notes must match exactly (the mic hears
//                   one note at a time well). For a chord, the microphone
//                   can't reliably pick out six strings at once, so wait
//                   mode moves on when it hears any note that belongs to
//                   the chord - a strum of the right shape - and then runs
//                   through that chord's strums in time while you strum.
//   mode "timed"  - single notes only: the notes keep coming in time; each
//                   counts if played within ±0.25s. Scored at the end.
//
// Timeline items: { start, dur } in beats plus either
//   { string, fret }            - a single note (string 0 = low E), or
//   { chord: "G", shape, strum: "down"|"up" } - a strummed chord.

import { onNoteOn } from "./input-hub.js";
import { playNote, strum, mutedStrum } from "./guitar-audio.js";
import { midiAt, shapeMidis } from "./guitar-theory.js";
import { parseChordSymbol } from "./chord-utils.js";
import { buildBlocks } from "./play-along-view.js";

const LEAD = 1.6;
const WINDOW = 0.25;

// The timeline in seconds (after the lead-in), shared with the view's
// "press Start" preview so both draw the same thing.
function timelineEvents(items, { bpm = 80, speed = 1 } = {}) {
  const beat = 60 / bpm / speed;
  return items.map((it, i) => ({
    ...it,
    i,
    t: it.start * beat + LEAD,
    d: Math.max(0.12, it.dur * beat * 0.95),
    span: it.dur * beat,
    midis: it.chord ? (it.shape ? shapeMidis(it.shape) : []) : [midiAt(it.string, it.fret)],
    pcs: it.chord ? new Set((parseChordSymbol(it.chord)?.intervals || []).map((iv) => (parseChordSymbol(it.chord).root + iv) % 12)) : null,
  }));
}

function createGuitarPlayer({ fb, highway, items, bpm = 80, mode = "listen", speed = 1, loop = false, beatsPerBar = 4, onStep, onFinish }) {
  const beat = 60 / bpm / speed;
  const evs = timelineEvents(items, { bpm, speed });
  const endT = Math.max(...evs.map((e) => e.t + e.d)) + 0.4;
  highway.load(evs, { beatSec: beat, beatsPerBar, origin: LEAD });
  // Wait mode stops at each new chord (its first strum) and at every note.
  buildBlocks(evs, { beatSec: beat, beatsPerBar, origin: LEAD });
  // (A rest - "N.C.", or a section where the guitar sits out - never waits.)
  const gates = evs.filter((e) => !e.rest && (!e.chord || e.k === 0));
  const stats = { right: 0, wrong: 0, hits: 0, misses: 0, combo: 0, maxCombo: 0, total: mode === "wait" ? gates.length : evs.length, timing: [] };
  let clock = 0;
  let last = null;
  let raf = null;
  let running = false;
  let gi = 0; // wait mode: the next gate
  let nextSound = 0;
  const hit = new Set();
  let shown = -1;

  const unsub = onNoteOn((midi) => {
    if (!running || mode === "listen") return;
    if (mode === "wait") {
      const e = gates[gi];
      if (!e) return;
      const ok = e.chord ? e.pcs.has(((midi % 12) + 12) % 12) : midi === e.midis[0];
      if (ok) {
        stats.right++;
        stats.combo++;
        stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
        // Played it before it landed: that's fine in wait mode - jump the
        // music forward to it rather than ignoring the note.
        if (clock < e.t) clock = e.t;
        gi++;
      } else {
        stats.wrong++;
        stats.combo = 0;
      }
    } else {
      const cand = evs.find((e) => !e.chord && !hit.has(e) && e.midis[0] === midi && Math.abs(clock - e.t) <= WINDOW);
      if (cand) {
        hit.add(cand);
        stats.hits++;
        stats.combo++;
        stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
        stats.timing.push(clock - cand.t);
      } else {
        stats.wrong++;
        stats.combo = 0;
      }
    }
  });

  let curPtr = 0;
  function frame(now) {
    if (!running) return;
    const dt = last === null ? 0 : Math.min(0.1, (now - last) / 1000);
    last = now;
    let next = clock + dt;
    const gate = mode === "wait" ? gates[gi] : null;
    if (gate && next > gate.t) next = gate.t;
    clock = next;

    if (mode === "listen") {
      while (nextSound < evs.length && evs[nextSound].t < clock + 0.2) {
        const e = evs[nextSound++];
        const delay = Math.max(0, e.t - clock);
        if (e.rest) continue;
        if (e.strum === "mute") mutedStrum(e.midis, { delay });
        else if (e.chord) strum(e.strum === "up" ? e.midis.slice(-4) : e.midis, { direction: e.strum === "up" ? "up" : "down", delay, spread: e.roll ? 0.07 : 0.018, duration: e.palm ? 0.12 : e.ring ? e.d + 1.2 : e.d + 0.4, gain: e.palm ? 0.2 : e.strum === "up" ? 0.2 : 0.26 });
        else playNote(e.midis[0], { delay, duration: e.d + 0.3 });
      }
    }
    if (mode === "timed") {
      evs.forEach((e) => {
        if (!e.chord && !hit.has(e) && !e.missed && clock > e.t + WINDOW) {
          e.missed = true;
          stats.misses++;
          stats.combo = 0;
        }
      });
    }

    if (clock < evs[curPtr].t - 0.03) curPtr = 0;
    while (curPtr + 1 < evs.length && evs[curPtr + 1].t <= clock + 0.03) curPtr++;
    const cur = evs[curPtr];
    if (cur.i !== shown) {
      shown = cur.i;
      if (onStep) onStep({ item: items[cur.i], index: cur.i, stats });
    }
    highway.update(clock, { waiting: Boolean(gate && clock >= gate.t - 1e-6) });

    if (clock >= endT || (mode === "wait" && gi >= gates.length && clock >= evs[evs.length - 1].t + evs[evs.length - 1].d)) {
      if (loop && mode === "listen") {
        clock = 0;
        nextSound = 0;
      } else return finish();
    }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    running = false;
    unsub();
    if (raf) cancelAnimationFrame(raf);
    const single = evs.filter((e) => !e.chord).length;
    const accuracy = mode === "timed"
      ? Math.round((100 * stats.hits) / Math.max(1, single))
      : Math.round((100 * stats.right) / Math.max(1, stats.right + stats.wrong));
    if (onFinish) onFinish({ ...stats, accuracy, mode });
  }

  return {
    start() {
      running = true;
      last = null;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      unsub();
      if (raf) cancelAnimationFrame(raf);
      fb.clear();
      highway.reset();
    },
    // Where the music is now (seconds, including the lead-in).
    get clock() { return clock; },
  };
}

// Helpers to build timelines
function chordTimeline(chordShapes, { beatsPerChord = 4, pattern = ["down"] } = {}) {
  // pattern: strum directions over one bar, e.g. D D U U D U. Each item
  // may carry its own length in beats (`beats`, e.g. 2 for half a bar);
  // the pattern keeps running bar after bar while the chord is held.
  const items = [];
  const step = 4 / pattern.length;
  let at = 0;
  chordShapes.forEach(({ chord, shape, beats = beatsPerChord }) => {
    for (let k = 0; k * step < beats - 1e-9; k++) {
      const dir = pattern[k % pattern.length];
      if (dir) items.push({ chord, shape, strum: dir, start: at + k * step, dur: step });
    }
    at += beats;
  });
  return items;
}

export { createGuitarPlayer, chordTimeline, timelineEvents, LEAD };
