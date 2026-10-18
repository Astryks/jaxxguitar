// Where to play a melody on the guitar: turns MIDI notes (e.g. from an
// uploaded song, transcribe.js) into { string, fret } you can actually
// play. The whole tune moves by octaves to sit where it's easiest (most
// notes in range, centred on the open-position strings); any note still
// out of range moves by an octave on its own. The hand
// stays in one 4-fret position as long as it can (open strings are always
// free), prefers the lowest reasonable position, frets 0-12, and only
// shifts when a note is out of reach.

import { TUNING } from "./guitar-theory.js";

const LOW = TUNING[0]; // E2
const MAX_FRET = 12;
const HIGH = TUNING[5] + MAX_FRET; // E5

function octaveShift(midis, top) {
  if (!midis.length) return 0;
  const sorted = [...midis].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  let best = { k: 0, inRange: -1, off: Infinity };
  for (let k = -36; k <= 24; k += 12) {
    const inRange = midis.filter((m) => m + k >= LOW && m + k <= top).length;
    const off = Math.abs(median + k - 62);
    if (inRange > best.inRange || (inRange === best.inRange && off < best.off)) best = { k, inRange, off };
  }
  return best.k;
}

function placeMelody(midis, { maxFret = MAX_FRET } = {}) {
  let pos = 1; // index finger's fret; the hand covers pos..pos+3
  const shift = octaveShift(midis, TUNING[5] + maxFret);
  return midis.map((m0) => {
    let m = Math.round(m0) + shift;
    while (m < LOW) m += 12;
    while (m > TUNING[5] + maxFret) m -= 12;
    let best = null;
    for (let s = 0; s < 6; s++) {
      const f = m - TUNING[s];
      if (f < 0 || f > maxFret) continue;
      const reach = f === 0 ? 0.4 : f >= pos && f <= pos + 3 ? 0 : 3 * Math.min(Math.abs(f - pos), Math.abs(f - pos - 3));
      const cost = reach + f * 0.12;
      if (!best || cost < best.cost) best = { string: s, fret: f, cost };
    }
    if (best.fret > 0) {
      if (best.fret < pos) pos = best.fret;
      else if (best.fret > pos + 3) pos = best.fret - 3;
    }
    return { string: best.string, fret: best.fret, midi: m };
  });
}

// The tune of a polyphonic transcription: at each moment the highest note
// (the melody usually sits on top), no blips, at most ~8 notes a second.
// notes: [{ midi, time, duration }] -> [{ midi, time, duration }]
function melodyLine(notes, { minDur = 0.08, minGap = 0.12 } = {}) {
  const sorted = [...notes].filter((n) => n.duration >= minDur).sort((a, b) => a.time - b.time || b.midi - a.midi);
  const out = [];
  for (const n of sorted) {
    const last = out[out.length - 1];
    if (last && n.time - last.time < 0.05) { if (n.midi > last.midi) Object.assign(last, { midi: n.midi, duration: n.duration }); continue; }
    if (last && n.time - last.time < minGap) continue;
    // A lower note starting while the tune's note still rings is the accompaniment.
    if (last && n.midi < last.midi && n.time < last.time + last.duration * 0.8) continue;
    out.push({ midi: n.midi, time: n.time, duration: n.duration });
  }
  out.forEach((n, i) => { const nx = out[i + 1]; if (nx) n.duration = Math.max(0.08, Math.min(n.duration, nx.time - n.time)); });
  return out;
}

export { placeMelody, melodyLine, HIGH };
