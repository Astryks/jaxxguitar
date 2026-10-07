// Practice engine for Jaxx Guitar: drives the fretboard + falling-notes
// view from a timeline of notes and chords, and listens to every input
// (fretboard taps, the microphone) through input-hub.js.
//
//   mode "listen" - the app plays it for you (sound + falling notes).
//   mode "wait"   - the notes stop at the fretboard until you play them.
//                   Single notes must match exactly (the mic hears one note
//                   at a time well). For a chord, the microphone can't
//                   reliably pick out six strings at once, so wait mode
//                   moves on when it hears any note that belongs to the
//                   chord - a strum of the right shape - and says so.
//   mode "timed"  - single notes only: the notes keep falling; each counts
//                   if played within ±0.25s. Scored at the end.
//
// Timeline items: { start, dur } in beats plus either
//   { string, fret }            - a single note (string 0 = low E), or
//   { chord: "G", shape, strum: "down"|"up" } - a strummed chord.

import { onNoteOn } from "./input-hub.js";
import { playNote, strum } from "./guitar-audio.js";
import { midiAt, shapeMidis } from "./guitar-theory.js";
import { parseChordSymbol } from "./chord-utils.js";

const LEAD = 1.6;
const WINDOW = 0.25;

function createGuitarPlayer({ fb, highway, items, bpm = 80, mode = "listen", speed = 1, loop = false, onStep, onFinish }) {
  const beat = 60 / bpm / speed;
  const evs = items.map((it, i) => ({
    ...it,
    i,
    t: it.start * beat + LEAD,
    d: Math.max(0.12, it.dur * beat * 0.95),
    midis: it.chord ? shapeMidis(it.shape) : [midiAt(it.string, it.fret)],
    pcs: it.chord ? new Set((parseChordSymbol(it.chord)?.intervals || []).map((iv) => (parseChordSymbol(it.chord).root + iv) % 12)) : null,
  }));
  const endT = Math.max(...evs.map((e) => e.t + e.d)) + 0.4;
  const blocks = evs.flatMap((e) =>
    e.chord
      ? e.shape.frets.map((f, s) => (f >= 0 ? { string: s, fret: f, time: e.t, duration: e.d, ev: e } : null)).filter(Boolean)
      : [{ string: e.string, fret: e.fret, time: e.t, duration: e.d, ev: e }]
  );
  const stats = { right: 0, wrong: 0, hits: 0, misses: 0, combo: 0, maxCombo: 0, total: evs.length, timing: [] };
  let clock = 0;
  let last = null;
  let raf = null;
  let running = false;
  let idx = 0; // wait mode: current item
  let nextSound = 0;
  const hit = new Set();
  let shown = -1;

  function showCurrent(e) {
    if (!e) return fb.clear();
    if (e.chord) fb.showShape(e.shape);
    else fb.show([{ string: e.string, fret: e.fret, tone: "root", label: String(e.fret) }]);
  }

  const unsub = onNoteOn((midi) => {
    if (!running || mode === "listen") return;
    if (mode === "wait") {
      const e = evs[idx];
      if (!e) return;
      const ok = e.chord ? e.pcs.has(((midi % 12) + 12) % 12) : midi === e.midis[0];
      if (ok) {
        stats.right++;
        stats.combo++;
        stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
        // Played it before it landed: that's fine in wait mode - jump the
        // music forward to it rather than ignoring the note.
        if (clock < e.t) clock = e.t;
        idx++;
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

  function frame(now) {
    if (!running) return;
    const dt = last === null ? 0 : Math.min(0.1, (now - last) / 1000);
    last = now;
    let next = clock + dt;
    if (mode === "wait" && evs[idx] && next > evs[idx].t) next = evs[idx].t;
    clock = next;

    if (mode === "listen") {
      while (nextSound < evs.length && evs[nextSound].t < clock + 0.2) {
        const e = evs[nextSound++];
        const delay = Math.max(0, e.t - clock);
        if (e.chord) strum(e.midis, { direction: e.strum || "down", delay, duration: e.d + 0.4 });
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

    const cur = mode === "wait" ? evs[idx] : evs.filter((e) => clock >= e.t - 0.05 && clock < e.t + e.d).pop() || evs.find((e) => e.t > clock);
    const curI = cur ? cur.i : -1;
    if (curI !== shown) {
      shown = curI;
      showCurrent(cur);
      if (onStep) onStep({ item: cur, index: curI, stats });
    }
    highway.render(clock, blocks.map((b) => ({ ...b, ghost: mode === "wait" && b.ev.i < idx })), { chordLabel: cur && cur.chord ? cur.chord : "" });

    if (clock >= endT || (mode === "wait" && idx >= evs.length && clock >= evs[evs.length - 1].t)) {
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
      highway.render(0, []);
    },
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

export { createGuitarPlayer, chordTimeline };
