// "Every note" for uploaded songs (owner request 2026-10-18: "when users
// upload an mp3 it should be super detailed"). Pure functions, no DOM, so
// they run in Node tests too:
//
//   groupNotes      - Basic Pitch's notes -> moments ("groups") of notes
//                     that start together (a strum, a chord, bass + tune)
//   detectTuning    - standard, half step down, drop D or whole step down
//   assignTab       - which string and fret for every note (the tablature
//                     problem), by dynamic programming (Viterbi) over every
//                     playable fingering of each group
//   trackBeats      - tempo, beat times and downbeats (bar lines)
//   quantizeGroups  - nudge each group gently onto the 16th-note grid
//   chordOf         - the chord a group spells, if it spells one
//   buildEveryNote  - all of the above, in order
//
// The tablature algorithm follows the "optimum path" idea for string
// fingering (Sayegh 1989, Computer Music Journal 13(3)), which is dynamic
// programming / Viterbi over candidate positions with a cost for each
// position (how hard it is to hold) and for each move between positions
// (how far the hand travels, and how fast). The costs are hand-set from
// the rules guitarists and the literature use: Radisavljevic & Driessen
// 2004 ("Path difference learning for guitar fingering problem", ICMC;
// same DP, learned weights), Tuohy & Potter 2005 (genetic-algorithm tab
// with the same playability rules: one note per string, a 4-5 fret span,
// low positions and open strings preferred, little hand movement), and
// Barbancho et al. 2012 / Yazawa et al. 2013 (audio-to-tab with
// playability constraints and an HMM over fingerings). Modern learned
// models (TabCNN, Wiggins & Kim 2019; MIDI-to-Tab, Edwards et al. 2024)
// are better at style but need much larger models; this runs in a few
// milliseconds per minute of music.

import { TUNING } from "./guitar-theory.js";

const TUNINGS = {
  standard: { label: "Standard (E A D G B e)", strings: [...TUNING] },
  halfDown: { label: "Half step down (E♭ A♭ D♭ G♭ B♭ e♭)", strings: TUNING.map((m) => m - 1) },
  dropD: { label: "Drop D (D A D G B e)", strings: [38, 45, 50, 55, 59, 64] },
  wholeDown: { label: "Whole step down (D G C F A d)", strings: TUNING.map((m) => m - 2) },
};

const PC_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

// Basic Pitch note {pitchMidi,startTimeSeconds,durationSeconds,amplitude}
// or our {midi,time,duration,velocity} -> {midi,time,duration,velocity}.
function normNote(n) {
  return {
    midi: Math.round(n.pitchMidi ?? n.midi),
    time: n.startTimeSeconds ?? n.time,
    duration: n.durationSeconds ?? n.duration,
    velocity: Math.max(0.05, Math.min(1, n.amplitude ?? n.velocity ?? 0.6)),
  };
}

// --- 0. Cleaning Basic Pitch's raw notes for a guitar -----------------------
// Basic Pitch is instrument-agnostic, so a plucked string's strong
// harmonics come back as extra quiet notes (an octave, a 12th, two
// octaves above a louder note that's ringing), plus a ghost an octave
// below some low notes, and pitches no guitar has. Tested against
// recordings with known notes (see STATUS.md, 2026-10-19).
const UP = [12, 19, 24, 28, 31, 36];
// The ratios were tuned on three synthesized recordings with known notes
// (two tunes, chords, bass runs, one tuned down a half step).
function cleanForGuitar(rawNotes, { highest = 86, together: rT = 0.45, later: rL = 0.5, sub: rS = 0.85, blip = 0.3 } = {}) {
  const ns = rawNotes.map(normNote).sort((a, b) => a.time - b.time);
  // Re-join pitch-wobble slivers onto the note they broke off from.
  const last = new Map();
  const joined = [];
  for (const n of ns) {
    const p = last.get(n.midi);
    if (p && n.time - (p.time + p.duration) <= 0.03 && n.duration < 0.08) { p.duration = Math.max(p.duration, n.time + n.duration - p.time); continue; }
    const c = { ...n };
    joined.push(c);
    last.set(c.midi, c);
  }
  const ringing = (y, x) => y !== x && y.time <= x.time + 0.06 && y.time + y.duration >= x.time - 0.01;
  return joined.filter((x) => {
    if (x.midi > highest || x.midi < 28) return false;
    if (x.duration < 0.1 && x.velocity < blip) return false;
    for (const y of joined) {
      if (!ringing(y, x)) continue;
      const iv = x.midi - y.midi;
      const together = Math.abs(y.time - x.time) <= 0.06;
      if (UP.includes(iv) && x.velocity < (together ? rT : rL) * y.velocity) return false; // a harmonic
      if ((iv === -12 || iv === -24) && x.velocity < rS * y.velocity) return false;        // a sub-octave ghost
    }
    return true;
  });
}

// --- 1. Moments: notes that start together ---------------------------------
// A strum spreads its strings over ~10-70 ms, and Basic Pitch's onsets
// are ~12 ms frames, so notes starting within `window` of the group's
// first note are one moment. The same pitch twice in one moment is one note.
function groupNotes(notes, { window = 0.075 } = {}) {
  const sorted = notes.map(normNote).filter((n) => n.duration > 0).sort((a, b) => a.time - b.time || a.midi - b.midi);
  const groups = [];
  for (const n of sorted) {
    const g = groups[groups.length - 1];
    if (g && n.time - g.t <= window) {
      const same = g.notes.find((x) => x.midi === n.midi);
      if (same) { same.duration = Math.max(same.duration, n.duration); same.velocity = Math.max(same.velocity, n.velocity); }
      else g.notes.push(n);
    } else groups.push({ t: n.time, notes: [n] });
  }
  groups.forEach((g) => {
    g.notes.sort((a, b) => a.midi - b.midi);
    g.t0 = g.t; // the recording's own time (before any quantizing)
    g.d = Math.max(...g.notes.map((n) => n.duration));
  });
  return groups;
}

// --- 2. Tuning --------------------------------------------------------------
// A guitar can't sound below its lowest open string, so notes just under
// E2 tell us it's tuned down: Eb2 (and nothing lower) = half step down;
// D2 = drop D, or whole step down if the song also lacks E/A open-string
// pitches and has their lowered versions. Notes far below (under C2) mean
// a bass guitar is in the mix; then we can't tell and say standard.
function detectTuning(notes) {
  const ns = notes.map(normNote);
  const total = ns.reduce((a, n) => a + n.duration, 0) || 1;
  const w = (pred) => ns.filter(pred).reduce((a, n) => a + n.duration, 0) / total;
  if (w((n) => n.midi < 36) > 0.01) return "standard";
  const at = (m) => w((n) => n.midi === m);
  if (at(38) + at(39) < 0.004) return "standard";
  if (at(38) >= at(39) * 0.5 && at(38) > 0.004) {
    // Whole step down: the D-standard open strings (D2 G2 C3) show up,
    // the E-standard ones (E2 A2) hardly ever.
    return at(43) + at(48) > 2 * (at(40) + at(45)) ? "wholeDown" : "dropD";
  }
  return "halfDown";
}

// --- 3. Tablature: Viterbi over fingerings ----------------------------------
const MAX_FRET = 15; // the app's fretboard shows 15 frets

// Bring every note into the guitar's range (an octave at a time) and keep
// at most 6 notes (the loudest, always keeping the lowest and the highest).
function fitGroup(g, open, capo, maxFret) {
  const lo = Math.min(...open) + capo;
  const hi = Math.max(...open) + maxFret;
  const seen = new Map();
  const lost = [];
  for (const n of g.notes) {
    let m = n.midi;
    let moved = 0;
    while (m < lo) { m += 12; moved++; }
    while (m > hi) { m -= 12; moved--; }
    const prev = seen.get(m);
    const c = { ...n, play: m, octaveMoved: moved };
    // Moved onto a pitch that's already there: one note plays both.
    if (prev) { lost.push(prev.velocity < c.velocity ? prev : c); if (prev.velocity >= c.velocity) continue; }
    seen.set(m, c);
  }
  let list = [...seen.values()].sort((a, b) => a.play - b.play);
  if (list.length > 6) {
    const keep = new Set([list[0], list[list.length - 1]]);
    [...list].sort((a, b) => b.velocity - a.velocity).forEach((n) => { if (keep.size < 6) keep.add(n); });
    list.forEach((n) => { if (!keep.has(n)) lost.push(n); });
    list = list.filter((n) => keep.has(n));
  }
  return { list, lost };
}

// Is this set of {string, fret} positions one hand can hold? (fret is
// relative to the capo; 0 = open/capo.) One note per string; the fretted
// notes span at most `maxSpan` frets; at most 4 fingers, where a barre
// (index flat across the lowest fret) counts as one finger.
function isPlayable(pos, { maxSpan = 4 } = {}) {
  const strings = new Set(pos.map((p) => p.string));
  if (strings.size !== pos.length) return false;
  const fretted = pos.filter((p) => p.fret > 0).map((p) => p.fret);
  if (!fretted.length) return true;
  const lo = Math.min(...fretted);
  const hi = Math.max(...fretted);
  if (hi - lo > maxSpan) return false;
  if (fretted.length <= 4) return true;
  return 1 + fretted.filter((f) => f > lo).length <= 4;
}

// Every way to put the group's notes on different strings that a hand can
// hold, with its cost to hold ("vertical" cost).
function candidates(list, open, capo, maxFret, maxSpan, keep = 48) {
  const out = [];
  const n = list.length;
  const strings = new Array(n);
  const frets = new Array(n);
  const used = new Array(6).fill(false);
  (function rec(i, lo, hi) {
    if (i === n) {
      const pos = list.map((x, k) => ({ string: strings[k], fret: frets[k] }));
      if (!isPlayable(pos, { maxSpan })) return;
      out.push({ pos, cost: holdCost(pos, list) });
      return;
    }
    for (let s = 0; s < 6; s++) {
      if (used[s]) continue;
      const f = list[i].play - open[s] - capo;
      if (f < 0 || f > maxFret - capo) continue;
      let nlo = lo, nhi = hi;
      if (f > 0) { nlo = Math.min(lo, f); nhi = Math.max(hi, f); if (nhi - nlo > maxSpan) continue; }
      used[s] = true; strings[i] = s; frets[i] = f;
      rec(i + 1, nlo, nhi);
      used[s] = false;
    }
  })(0, Infinity, -Infinity);
  out.sort((a, b) => a.cost - b.cost);
  return out.slice(0, keep).map((c) => {
    const fr = c.pos.filter((p) => p.fret > 0).map((p) => p.fret);
    return { ...c, lo: fr.length ? Math.min(...fr) : null, hi: fr.length ? Math.max(...fr) : null };
  });
}

function holdCost(pos, list) {
  const fr = pos.filter((p) => p.fret > 0).map((p) => p.fret);
  let c = 0;
  if (fr.length) {
    const lo = Math.min(...fr);
    const hi = Math.max(...fr);
    c += 0.22 * lo;                         // lower positions are easier
    c += 0.35 * Math.max(0, hi - 9);        // up past the 9th fret is harder still
    c += 0.3 * (hi - lo) + (hi - lo >= 4 ? 0.8 : 0); // stretches
    c += 0.22 * fr.length;                  // each fretted note is a finger
    if (fr.length > 4) c += 0.7;            // needs a barre
  }
  if (pos.length > 1) {
    const ss = pos.map((p) => p.string);
    const span = Math.max(...ss) - Math.min(...ss) + 1;
    c += 0.12 * (span - pos.length);        // skipped strings inside a chord
    // Lower notes normally sit on lower strings; crossing costs a stretch.
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
      if (list[i].play < list[j].play && pos[i].string > pos[j].string) c += 0.45;
    }
  } else {
    // A single note: a little preference for the middle strings' feel
    // (no cost for open strings, which ring and need no finger).
    c += pos[0].fret === 0 ? -0.1 : 0;
  }
  return c;
}

// The hand sits with the index finger at fret `hand` and covers
// hand..hand+3 (a stretch reaches +4). Moving costs more the faster it
// has to happen. Returns { cost, hand } for arriving at candidate b.
function moveCost(hand, b, gap) {
  if (b.lo === null) return { cost: 0, hand }; // only open strings: the hand stays
  let next = hand;
  if (b.lo < hand) next = b.lo;
  else if (b.hi > hand + 3) next = Math.max(b.lo, b.hi - 3);
  const shift = Math.abs(next - hand);
  // A jump in a gap of half a second or more is easy; in a fast run it isn't.
  const hurry = 0.2 + 0.16 / Math.max(0.08, gap);
  return { cost: shift ? 0.5 + shift * hurry : 0, hand: next };
}

// groups: from groupNotes (sorted by time). Adds to each group:
//   notes[k].string / .fret (fret relative to the capo; 0 = open)
//   g.hand (the index finger's fret), g.dropped (notes it couldn't fit).
function assignTab(groups, { tuning = "standard", capo = 0, maxFret = MAX_FRET, maxSpan = 4 } = {}) {
  const open = (TUNINGS[tuning] || TUNINGS.standard).strings;
  const layers = groups.map((g) => {
    const fit = fitGroup(g, open, capo, maxFret);
    let list = fit.list;
    let cands = candidates(list, open, capo, maxFret, maxSpan);
    const dropped = fit.lost; // (shown as "left out", with the reason in the summary)
    // Nothing fits (e.g. 3 notes that only one string can reach): leave
    // out the quietest inner note until it does.
    while (!cands.length && list.length > 1) {
      // Octave doublings go first (the chord still sounds the same), then
      // the quietest inner note.
      const inner = list.length > 2 ? list.slice(1, -1) : list;
      const dup = inner.filter((x) => list.some((y) => y !== x && (y.play - x.play) % 12 === 0));
      const pool = dup.length ? dup : inner;
      const q = pool.reduce((a, b) => (b.velocity < a.velocity ? b : a));
      dropped.push(q);
      list = list.filter((x) => x !== q);
      cands = candidates(list, open, capo, maxFret, maxSpan);
    }
    return { g, list, cands, dropped };
  });
  // Viterbi. State = a candidate fingering; it carries where the hand
  // ended up (open strings leave the hand where it was).
  let prev = null;
  const back = [];
  layers.forEach((L, i) => {
    const gap = i ? L.g.t - layers[i - 1].g.t : 1;
    const cur = L.cands.map((b) => {
      if (!prev) {
        const m = moveCost(b.lo ?? 1, b, 1);
        return { total: b.cost + 0.08 * (b.lo ?? 0), hand: m.hand, from: -1 };
      }
      let best = null;
      prev.forEach((a, ai) => {
        const m = moveCost(a.hand, b, gap);
        let c = a.total + b.cost + m.cost;
        // The same pitch again sounds and feels right on the same string.
        const pa = layers[i - 1];
        b.pos.forEach((p, k) => {
          const j = pa.list.findIndex((x) => x.play === L.list[k].play);
          if (j >= 0 && pa.cands[ai].pos[j].string !== p.string) c += 0.35;
        });
        if (!best || c < best.total) best = { total: c, hand: m.hand, from: ai };
      });
      return best;
    });
    back.push(cur);
    prev = cur.length ? cur : prev; // an empty layer (shouldn't happen) is skipped
  });
  // Backtrace.
  let k = -1;
  for (let i = layers.length - 1; i >= 0; i--) {
    const cur = back[i];
    if (!cur.length) continue;
    if (k < 0 || i === layers.length - 1) k = cur.reduce((bi, s, si) => (s.total < cur[bi].total ? si : bi), 0);
    const L = layers[i];
    const c = L.cands[k];
    const g = L.g;
    g.notes = L.list.map((x, j) => ({ ...x, string: c.pos[j].string, fret: c.pos[j].fret }));
    g.hand = cur[k].hand;
    g.dropped = L.dropped;
    k = cur[k].from;
  }
  return groups;
}

// --- 4. Beats and bars ------------------------------------------------------
// Onset strength from the notes (louder and more notes = stronger), tempo
// by autocorrelation with a gentle preference for 80-140 BPM, then beat
// times by dynamic programming (Ellis 2007, "Beat tracking by dynamic
// programming", J. New Music Research 36(1)): each beat is placed where
// there's a strong onset AND about one beat after the previous beat, so
// it follows small tempo drift. Downbeats: of the 4 ways to group the
// beats into bars of 4, the one whose first beats have the most new bass
// notes and chord changes (bars usually start with a change; Goto 2001).
function trackBeats(groups, { beatsPerBar = 4 } = {}) {
  if (groups.length < 8) return null;
  const BIN = 0.01;
  const end = groups[groups.length - 1].t + 1;
  const N = Math.ceil(end / BIN) + 1;
  const env = new Float32Array(N);
  groups.forEach((g) => {
    const s = g.notes.reduce((a, n) => a + n.velocity, 0);
    const i = Math.round(g.t / BIN);
    for (let d = -2; d <= 2; d++) if (i + d >= 0 && i + d < N) env[i + d] += s * Math.exp(-(d * d) / 2);
  });
  // Tempo.
  let best = null;
  for (let lag = Math.round(60 / 200 / BIN); lag <= Math.round(60 / 50 / BIN); lag++) {
    let s = 0;
    for (let i = 0; i + 2 * lag < N; i++) if (env[i]) s += env[i] * (env[i + lag] + 0.5 * env[i + 2 * lag]);
    const bpm = 60 / (lag * BIN);
    s *= Math.exp(-Math.pow(Math.log2(bpm / 110), 2) / (2 * 0.55 * 0.55));
    if (!best || s > best.s) best = { lag, s };
  }
  if (!best || best.s <= 0) return null;
  const P = best.lag;
  // Beat DP.
  const score = new Float32Array(N);
  const from = new Int32Array(N).fill(-1);
  const mean = env.reduce((a, b) => a + b, 0) / N || 1;
  const alpha = 60 * mean; // how strongly beats keep to one tempo (tested 6-600; 60+ stops it doubling up on 8th-note runs)
  for (let t = 0; t < N; t++) {
    let bs = 0, bf = -1;
    for (let tau = t - 2 * P; tau <= t - Math.round(P / 2); tau++) {
      if (tau < 0) continue;
      const v = score[tau] - alpha * Math.pow(Math.log((t - tau) / P), 2);
      if (bf < 0 || v > bs) { bs = v; bf = tau; }
    }
    score[t] = env[t] + (bf >= 0 ? Math.max(0, bs) : 0);
    from[t] = bf >= 0 && bs > 0 ? bf : -1;
  }
  let t = N - 1;
  for (let i = Math.max(0, N - 1 - P); i < N; i++) if (score[i] > score[t]) t = i;
  const beats = [];
  while (t >= 0) { beats.push(t * BIN); t = from[t]; }
  beats.reverse();
  // Extend the beat grid back to the first note and on past the last one.
  const beatSec = P * BIN;
  while (beats[0] - beatSec > groups[0].t - beatSec * 0.5) beats.unshift(beats[0] - beatSec);
  while (beats[beats.length - 1] < end) beats.push(beats[beats.length - 1] + beatSec);
  // Downbeat phase: compare the harmony (how long each pitch class rings,
  // low notes counting more) in the bar before and the bar after each beat.
  // At a real bar line the two bars hold different chords; one beat off,
  // both windows straddle the change and look alike.
  const all = groups.flatMap((g) => g.notes);
  const harmony = (t0, t1) => {
    const w = new Array(12).fill(0);
    all.forEach((n) => {
      const ov = Math.min(t1, n.time + n.duration) - Math.max(t0, n.time);
      if (ov > 0) w[n.midi % 12] += ov * n.velocity * (n.midi < 52 ? 2 : n.midi < 60 ? 1.3 : 1);
    });
    const s = w.reduce((x, y) => x + y, 0) || 1;
    return w.map((x) => x / s);
  };
  const barSec = beatSec * beatsPerBar;
  const strength = beats.map((b) => {
    const before = harmony(b - barSec, b - 0.03);
    const after = harmony(b + 0.03, b + barSec);
    const change = after.reduce((x, v, i) => x + Math.abs(v - before[i]), 0);
    const lowest = groups.filter((g) => Math.abs(g.t - b) < beatSec * 0.2).map((g) => g.notes[0].midi);
    const bass = lowest.length ? Math.max(0, (60 - Math.min(...lowest)) / 40) : 0;
    return change + bass;
  });
  let phase = 0, ps = -Infinity;
  for (let ph = 0; ph < beatsPerBar; ph++) {
    let s = 0, c = 0;
    for (let k = ph; k < beats.length; k += beatsPerBar) { s += strength[k]; c++; }
    if (c && s / c > ps) { ps = s / c; phase = ph; }
  }
  const grid = { beats, beatSec, bpm: Math.round(60 / beatSec), beatsPerBar, downbeat: phase, barBase: 0 };
  grid.barBase = 1 - barPosition(grid, groups[0].t).bar; // the first note's bar is bar 1
  return grid;
}

// Where a time falls: { bar (1-based), beat (1-based), sub (0-3 = 1 e & a) }.
function barPosition(grid, t) {
  if (!grid) return null;
  const { beats, beatsPerBar, downbeat } = grid;
  let k = 0;
  let lo = 0, hi = beats.length - 1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (beats[m] <= t + 1e-6) { k = m; lo = m + 1; } else hi = m - 1; }
  if (t < beats[0]) k = 0;
  const len = (beats[k + 1] ?? beats[k] + grid.beatSec) - beats[k];
  let sub = Math.round(Math.max(0, (t - beats[k]) / len) * 4);
  if (sub >= 4) { sub = 0; k++; } // just before a beat counts as that beat
  const rel = k - downbeat;
  const bar = Math.floor(rel / beatsPerBar) + 2 + (grid.barBase || 0);
  return { bar, beat: ((rel % beatsPerBar) + beatsPerBar) % beatsPerBar + 1, sub, beatIndex: k };
}
// The time where bar `bar` (1-based, as barPosition counts) starts.
function barStart(grid, bar) {
  const k = grid.downbeat + (bar - 2 - (grid.barBase || 0)) * grid.beatsPerBar;
  if (k < 0) return Math.max(0, grid.beats[0] + k * grid.beatSec);
  return grid.beats[k] ?? grid.beats[grid.beats.length - 1] + (k - grid.beats.length + 1) * grid.beatSec;
}

// --- 5. Gentle quantizing -----------------------------------------------------
// Each moment moves part of the way (`strength`) toward the nearest 16th
// note, by at most `maxShift` seconds, never past its neighbours, so the
// number of presses in each bar stays exactly what the recording has.
function quantizeGroups(groups, grid, { strength = 0.6, maxShift = 0.04 } = {}) {
  if (!grid) return groups;
  const { beats, beatSec } = grid;
  groups.forEach((g) => {
    const p = barPosition(grid, g.t0);
    const k = p.beatIndex;
    const b0 = beats[k];
    const len = (beats[k + 1] ?? b0 + beatSec) - b0;
    const step = len / 4;
    const q = b0 + Math.round((g.t0 - b0) / step) * step;
    const shift = Math.max(-maxShift, Math.min(maxShift, (q - g.t0) * strength));
    g.t = g.t0 + shift;
  });
  for (let i = 1; i < groups.length; i++) if (groups[i].t <= groups[i - 1].t + 0.015) groups[i].t = groups[i].t0;
  groups.forEach((g) => { g.pos = barPosition(grid, g.t); });
  return groups;
}

// --- 6. Chord names -----------------------------------------------------------
const QUALITIES = [
  ["", [0, 4, 7]], ["m", [0, 3, 7]], ["7", [0, 4, 7, 10]], ["maj7", [0, 4, 7, 11]], ["m7", [0, 3, 7, 10]],
  ["sus4", [0, 5, 7]], ["sus2", [0, 2, 7]], ["dim", [0, 3, 6]], ["aug", [0, 4, 8]], ["6", [0, 4, 7, 9]],
  ["m6", [0, 3, 7, 9]], ["add9", [0, 2, 4, 7]], ["madd9", [0, 2, 3, 7]], ["7", [0, 4, 10]], ["m7", [0, 3, 10]],
  ["maj7", [0, 4, 11]], ["9", [0, 2, 4, 7, 10]], ["5", [0, 7]],
];
// midis -> "G", "Am7", "D/F#", "E5" or null (single notes and clusters).
function chordOf(midis) {
  const pcs = [...new Set(midis.map((m) => ((m % 12) + 12) % 12))];
  if (pcs.length < 2) return null;
  const bass = ((Math.min(...midis) % 12) + 12) % 12;
  let best = null;
  for (const root of pcs) {
    const rel = pcs.map((p) => (p - root + 12) % 12).sort((a, b) => a - b).join(",");
    QUALITIES.forEach(([q, iv], qi) => {
      if (iv.join(",") !== rel) return;
      if (q === "5" && midis.length < 2) return;
      const score = (root === bass ? 10 : 0) - qi * 0.1;
      if (!best || score > best.score) best = { score, name: PC_NAMES[root] + q + (root === bass ? "" : "/" + PC_NAMES[bass]) };
    });
  }
  // A two-note "chord" is only named when it's a power chord on the bass.
  if (best && pcs.length === 2 && !best.name.match(/5$/)) return null;
  return best ? best.name : null;
}

// --- All together ---------------------------------------------------------------
// notes: Basic Pitch notes. Returns { groups, grid, tuning, capo }.
// raw: true when `notes` are Basic Pitch's notes before any cleanup.
function buildEveryNote(input, { tuning = "auto", capo = 0, quantize = true, raw = false } = {}) {
  const notes = raw ? cleanForGuitar(input) : input;
  const tun = tuning === "auto" ? detectTuning(notes) : tuning;
  const groups = groupNotes(notes);
  const grid = trackBeats(groups);
  if (quantize) quantizeGroups(groups, grid);
  else groups.forEach((g) => { g.pos = barPosition(grid, g.t); });
  assignTab(groups, { tuning: tun, capo });
  groups.forEach((g) => { g.chord = g.notes.length >= 2 ? chordOf(g.notes.map((n) => n.midi)) : null; });
  return { groups, grid, tuning: tun, capo };
}

export { cleanForGuitar, TUNINGS, MAX_FRET, groupNotes, detectTuning, assignTab, isPlayable, trackBeats, barPosition, barStart, quantizeGroups, chordOf, buildEveryNote };
