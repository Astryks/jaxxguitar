// Original practice licks for a song's guitar solo: two short phrases in
// the solo's scale, in the first pentatonic box (no copied lead lines).
// Every lick ends on the scale's root so it sounds "finished".

import { PITCH_CLASS } from "./chord-utils.js";
import { midiAt } from "./guitar-theory.js";

// "B minor pentatonic, box 1 at 7th fret" -> { root: 11, minor: true, blues }
function parseScale(text) {
  const m = /\b([A-G])(#|b|♯|♭)?\s*(major|minor|blues|dorian|mixolydian|aeolian|natural minor|harmonic minor)?/i.exec(String(text || ""));
  if (!m) return null;
  const name = m[1] + (m[2] ? (m[2] === "♯" ? "#" : m[2] === "♭" ? "b" : m[2]) : "");
  const root = PITCH_CLASS[name];
  if (root === undefined) return null;
  const kind = (m[3] || "").toLowerCase();
  const minor = /minor|blues|dorian|aeolian/.test(kind) || (!/major|mixolydian/.test(kind) && /\bm(in)?\b/i.test(text));
  return { name, root, minor, blues: /blues/i.test(text) };
}

// Box 1 of the minor pentatonic, as [string, fret offset] (string 0 = low E).
// A major-key scale uses the box of its relative minor (3 frets lower).
function licksFor(scaleText, { tuningDown = 0 } = {}) {
  const sc = parseScale(scaleText);
  if (!sc) return null;
  const minorRoot = (sc.minor ? sc.root : sc.root + 9) % 12;
  // Root on the low E string, kept between frets 3 and 14 so the box sits
  // in a comfortable spot (a tuned-down guitar needs the shape a bit higher).
  let f = (minorRoot + tuningDown - 4 + 24) % 12;
  if (f < 3) f += 12;
  const n = (string, off) => ({ string, fret: f + off });
  // In the box the minor root is on frets f (low E, high e) and f+2 (D
  // string); the relative major's root is on f+3 (high e) and f (G string).
  const climb = [n(3, 0), n(3, 2), n(4, 0), n(4, 3), n(5, 0), n(5, 3), sc.minor ? n(5, 0) : n(5, 3)];
  const fall = [n(5, 3), n(5, 0), n(4, 3), n(4, 0), ...(sc.blues ? [n(3, 3)] : []), n(3, 2), n(3, 0), ...(sc.minor ? [n(2, 2)] : [])];
  const toEvents = (notes) => notes.map((x, i) => ({ ...x, start: i * 0.5, dur: 0.5 }));
  return {
    label: `${sc.name} ${sc.minor ? "minor" : "major"} pentatonic, box 1 at fret ${f}`,
    fret: f,
    licks: [
      { name: "Climb the box", events: toEvents(climb) },
      { name: "Walk back down", events: toEvents(fall) },
    ],
  };
}

// MIDI notes of a lick, for playback.
function lickMidis(events) {
  return events.map((e) => midiAt(e.string, e.fret));
}

export { licksFor, lickMidis, parseScale };
