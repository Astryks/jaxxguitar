// Guitar theory for Jaxx Guitar: standard tuning, fret ↔ note maths,
// chord shapes, and capo suggestions.
//
// Every chord shape the app shows is CHECKED, not just typed in:
// validateShape() works out the notes a shape actually sounds (string +
// fret → MIDI) and compares them with the chord's real notes from
// chord-utils.js (the same parser Hayden Keys uses). A shape only passes
// if it plays the chord's root and third, nothing outside the chord, and
// (for slash chords) the requested bass note lowest. The test script
// (scripts/check-shapes.mjs) runs this over every chord in the song
// library.

import { parseChordSymbol, PITCH_CLASS } from "./chord-utils.js";

// Strings are numbered the guitarist's way: 6 = low E (thickest) … 1 =
// high E. Arrays below are ordered low → high: index 0 = 6th string.
const TUNING = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = { 1: "Db", 3: "Eb", 6: "Gb", 8: "Ab", 10: "Bb" };

function midiAt(stringIndex, fret, capo = 0) {
  return TUNING[stringIndex] + capo + fret;
}
function noteName(midi, { octave = false } = {}) {
  const pc = ((midi % 12) + 12) % 12;
  return NOTE_NAMES[pc] + (octave ? Math.floor(midi / 12) - 1 : "");
}

// --- Chord shapes ---------------------------------------------------------
// frets: low E → high e; -1 = don't play (x), 0 = open string.
// fingers: 0 = open/none, 1 index, 2 middle, 3 ring, 4 pinky; barre = fret
// the index finger lays across.
const OPEN_SHAPES = {
  // The famous four (Lesson 1)
  G: { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  D: { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  Em: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  C: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  // More open chords
  Am: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  E: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  A: { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  Dm: { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  // Open power chords (root + 5th + octave)
  E5: { frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0] },
  A5: { frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0] },
  D5: { frets: [-1, -1, 0, 2, 3, -1], fingers: [0, 0, 0, 1, 3, 0] },
  // 7ths
  E7: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  A7: { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  D7: { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  C7: { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  B7: { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  Cmaj7: { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  Emaj7: { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
  Fmaj7: { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  Gmaj7: { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] },
  Dmaj7: { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1] },
  Amaj7: { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  Am7: { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  Em7: { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  Dm7: { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  // Sus / add
  Asus2: { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  Asus4: { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  Dsus2: { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] },
  Dsus4: { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4] },
  Esus4: { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
  Cadd9: { frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0] },
  // The first barre chords (Lesson: barre chords)
  F: { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: 1 },
  Bm: { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: 2 },
  // Common slash chords
  "D/F#": { frets: [2, -1, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3] },
  "G/B": { frets: [-1, 2, 0, 0, 0, 3], fingers: [0, 1, 0, 0, 0, 3] },
  "C/E": { frets: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  "Am/G#": { frets: [4, -1, 2, 2, 1, 0], fingers: [4, 0, 2, 3, 1, 0] },
  "Am/F#": { frets: [2, -1, 2, 2, 1, 0], fingers: [4, 0, 2, 3, 1, 0] },
  "Am/G": { frets: [3, -1, 2, 2, 1, 0], fingers: [4, 0, 2, 3, 1, 0] },
  "C/G": { frets: [3, 3, 2, 0, 1, 0], fingers: [3, 4, 2, 0, 1, 0] },
  "F/A": { frets: [-1, 0, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1] },
  "Am/C": { frets: [-1, 3, 2, 2, 1, 0], fingers: [0, 4, 2, 3, 1, 0] },
  // Jazz / altered voicings used by the song library (all validated)
  A7sus4: { frets: [-1, 0, 2, 0, 3, 0], fingers: [0, 0, 2, 0, 3, 0] },
  C7b9: { frets: [-1, 3, 2, 3, 2, 3], fingers: [0, 2, 1, 3, 1, 4] },
  Caug: { frets: [-1, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
  CmMaj7: { frets: [-1, 3, 1, 0, 0, -1], fingers: [0, 3, 1, 0, 0, 0] },
  "D6/9": { frets: [-1, 5, 4, 4, 5, 5], fingers: [0, 2, 1, 1, 3, 4] },
  D7b5: { frets: [-1, -1, 0, 1, 1, 2], fingers: [0, 0, 0, 1, 1, 2] },
  Dbadd9: { frets: [-1, 4, 3, 1, 4, 1], fingers: [0, 3, 2, 1, 4, 1] },
  Dm9: { frets: [-1, 5, 3, 5, 5, -1], fingers: [0, 2, 1, 3, 4, 0] },
  G7b9: { frets: [3, -1, 3, 4, 3, 4], fingers: [1, 0, 1, 3, 1, 4] },
  Gm9: { frets: [3, -1, 3, 3, 3, 5], fingers: [1, 0, 1, 1, 1, 4] },
  "A/F#": { frets: [2, -1, 2, 2, 2, 0], fingers: [1, 0, 2, 3, 4, 0] },
  "B/D#": { frets: [-1, 6, 4, 4, 4, -1], fingers: [0, 3, 1, 1, 1, 0] },
  "Cmaj7/B": { frets: [-1, 2, 2, 0, 1, 0], fingers: [0, 2, 3, 0, 1, 0] },
  "D7/C": { frets: [-1, 3, 0, 2, 1, 2], fingers: [0, 3, 0, 2, 1, 4] },
  "Dm7/C": { frets: [-1, 3, 0, 2, 1, 1], fingers: [0, 3, 0, 2, 1, 1] },
  "G#m/F#": { frets: [2, -1, 1, 1, 0, 4], fingers: [2, 0, 1, 1, 0, 4] },
  "G7/B": { frets: [-1, 2, 0, 0, 0, 1], fingers: [0, 2, 0, 0, 0, 1] },
};

// Movable shapes, relative to the root fret r on the 6th (E-shape) or
// 5th (A-shape) string. null = don't play that string.
const MOVABLE = {
  E: {
    "": [0, 2, 2, 1, 0, 0],
    m: [0, 2, 2, 0, 0, 0],
    "7": [0, 2, 0, 1, 0, 0],
    m7: [0, 2, 0, 0, 0, 0],
    maj7: [0, null, 1, 1, 0, null],
    sus4: [0, 2, 2, 2, 0, 0],
    "5": [0, 2, 2, null, null, null],
  },
  A: {
    "": [null, 0, 2, 2, 2, 0],
    m: [null, 0, 2, 2, 1, 0],
    "7": [null, 0, 2, 0, 2, 0],
    m7: [null, 0, 2, 0, 1, 0],
    maj7: [null, 0, 2, 1, 2, 0],
    m7b5: [null, 0, 1, 0, 1, null],
    sus2: [null, 0, 2, 2, 0, 0],
    sus4: [null, 0, 2, 2, 3, 0],
    "6": [null, 0, 2, 2, 2, 2],
    m6: [null, 0, 2, -1, 1, 2],
    "9": [null, 0, -1, 0, 0, 0],
    dim: [null, 0, 1, 2, 1, null],
    dim7: [null, 0, 1, -1, 1, null],
    "5": [null, 0, 2, 2, null, null],
  },
};

const QUALITY_KEYS = [
  "mmaj7", "maj9", "m9", "7b9", "7#9", "7b5", "7#5", "7sus4", "m7b5", "m7", "m6", "dim7", "dim",
  "maj7", "add9", "sus2", "sus4", "aug", "6/9", "6", "9", "7", "5", "m", "",
];
function splitSymbol(symbol) {
  const m = /^([A-G](#|b)?)(.*)$/.exec(symbol.trim());
  if (!m) return null;
  let rest = m[3];
  let bass = null;
  const slash = /^(.*)\/([A-G](#|b)?)$/.exec(rest);
  if (slash && rest !== "6/9") {
    rest = slash[1];
    bass = slash[2];
  }
  const quality = QUALITY_KEYS.find((q) => rest.toLowerCase().startsWith(q.toLowerCase())) ?? "";
  return { root: m[1], quality, bass };
}

function chordPitchClasses(symbol) {
  const p = parseChordSymbol(symbol);
  if (!p) return null;
  return { root: p.root, pcs: p.intervals.map((iv) => (p.root + iv) % 12), third: p.intervals.find((iv) => iv === 3 || iv === 4 || iv === 2 || iv === 5), bass: p.bass };
}

// Does `shape` really play `symbol`?
function validateShape(symbol, shape) {
  const want = chordPitchClasses(symbol);
  if (!want) return { ok: false, why: "unparseable" };
  const sounding = shape.frets.map((f, i) => (f >= 0 ? midiAt(i, f) : null)).filter((m) => m !== null);
  if (sounding.length < 3 && !/5$/.test(symbol)) return { ok: false, why: "fewer than 3 strings" };
  const pcs = new Set(sounding.map((m) => m % 12));
  const allowed = new Set(want.pcs);
  // A slash chord's bass note may be outside the chord (A/F# = A over F#).
  if (want.bass !== null && want.bass !== undefined) allowed.add(want.bass);
  for (const pc of pcs) if (!allowed.has(pc)) return { ok: false, why: `plays ${NOTE_NAMES[pc]}, not in ${symbol}` };
  if (!pcs.has(want.root)) return { ok: false, why: "root missing" };
  if (want.third !== undefined && !pcs.has((want.root + want.third) % 12) && !/5$/.test(symbol)) return { ok: false, why: "third missing" };
  const lowest = Math.min(...sounding) % 12;
  const bassPc = want.bass !== null && want.bass !== undefined ? want.bass : null;
  if (bassPc !== null && lowest !== bassPc) return { ok: false, why: "wrong bass note" };
  if (bassPc === null && lowest !== want.root) {
    // Root-position names: the lowest note should be the root, except the
    // well-known open shapes that are standard as-is.
    return { ok: false, why: "lowest note isn't the root" };
  }
  return { ok: true };
}

function movableShape(rootPc, quality, kind) {
  const rel = MOVABLE[kind][quality];
  if (!rel) return null;
  const openPc = kind === "E" ? 4 : 9;
  let r = (rootPc - openPc + 12) % 12;
  if (r === 0) r = 12; // open position is covered by OPEN_SHAPES
  const frets = rel.map((d) => (d === null ? -1 : r + d));
  if (frets.some((f) => f < -1 || f > 17) || frets.some((f, i) => rel[i] !== null && f < 0)) return null;
  const minF = Math.min(...frets.filter((f) => f > 0));
  const fingers = frets.map((f) => (f < 0 ? 0 : f === minF ? 1 : Math.min(4, f - minF + 1)));
  return { frets, fingers, barre: minF, movable: kind };
}

// Best playable shape for a chord symbol, or null. Prefers an open shape,
// then the lower-fret barre shape. Every candidate is validated.
const shapeCache = new Map();
function chordShape(symbol) {
  if (shapeCache.has(symbol)) return shapeCache.get(symbol);
  let result = null;
  const open = OPEN_SHAPES[symbol];
  if (open && validateShape(symbol, open).ok) result = { ...open, symbol };
  if (!result) {
    const s = splitSymbol(symbol);
    const parsed = parseChordSymbol(symbol);
    if (s && parsed) {
      const plain = s.root + s.quality;
      const cands = [];
      if (OPEN_SHAPES[plain]) cands.push(OPEN_SHAPES[plain]);
      for (const kind of ["E", "A"]) {
        const m = movableShape(parsed.root, s.quality, kind);
        if (m) cands.push(m);
      }
      // A slash chord with no valid inversion falls back to the plain chord
      // (the lesson then says which bass note the song has).
      const valid = cands
        .filter((c) => validateShape(s.bass ? symbol : plain, c).ok)
        .sort((a, b) => Math.max(0, ...a.frets) - Math.max(0, ...b.frets));
      if (valid.length) result = { ...valid[0], symbol: s.bass ? symbol : plain, ...(s.bass ? {} : {}) };
      else if (s.bass) {
        const fallback = chordShape(plain);
        if (fallback) result = { ...fallback, symbol: plain, bassNote: s.bass, simplified: true };
      }
    }
  }
  shapeCache.set(symbol, result);
  return result;
}

// MIDI notes a shape sounds (low → high), optionally with a capo.
function shapeMidis(shape, capo = 0) {
  return shape.frets.map((f, i) => (f >= 0 ? midiAt(i, f, capo) : null)).filter((m) => m !== null);
}

// --- Capo suggestions ----------------------------------------------------
const OPEN_FRIENDLY = new Set(["G", "C", "D", "Em", "Am", "E", "A", "Dm", "E7", "A7", "D7", "G7", "C7", "B7", "Cmaj7", "Fmaj7", "Am7", "Em7", "Dm7", "Asus2", "Asus4", "Dsus2", "Dsus4", "Cadd9", "Esus4"]);
function transposeSymbol(symbol, semis) {
  const s = splitSymbol(symbol);
  if (!s) return symbol;
  const sh = (name) => {
    const pc = (PITCH_CLASS[name] + semis + 120) % 12;
    return NOTE_NAMES[pc];
  };
  const root = sh(s.root);
  const rest = symbol.trim().slice(s.root.length).replace(/\/([A-G](#|b)?)$/, "");
  return root + rest + (s.bass ? "/" + sh(s.bass) : "");
}
// For each capo position 0-7: the chord shapes you'd play (transposed
// DOWN by the capo) and how many are easy open shapes. Returns the best.
function suggestCapo(chords) {
  const unique = [...new Set(chords)];
  let best = null;
  for (let capo = 0; capo <= 7; capo++) {
    const shapes = unique.map((c) => transposeSymbol(c, -capo));
    const easy = shapes.filter((s) => OPEN_FRIENDLY.has(s.replace(/\/.*/, ""))).length;
    // Each capo fret costs a little: a high capo changes the sound, so
    // one barre chord with no capo usually beats capo 7.
    const score = easy - capo * 0.15;
    if (!best || score > best.score) best = { capo, shapes, easy, total: unique.length, score, map: Object.fromEntries(unique.map((c, i) => [c, shapes[i]])) };
  }
  return best;
}

// Display name with the usual flat spellings for black-key roots.
function displayName(pc) {
  return FLAT_NAMES[pc] && [1, 3, 8, 10].includes(pc) ? `${NOTE_NAMES[pc]}/${FLAT_NAMES[pc]}` : NOTE_NAMES[pc];
}

// --- Scales -----------------------------------------------------------------
const SCALES = {
  minorPentatonic: [0, 3, 5, 7, 10],
  majorPentatonic: [0, 2, 4, 7, 9],
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  blues: [0, 3, 5, 6, 7, 10],
};
// Every note of the scale inside a 4-fret window starting at lowFret,
// low E → high e, each note higher than the last (one pass up the neck in
// position) - the standard "box" a guitarist learns.
function scaleBox(rootPc, intervals, lowFret, width = 4) {
  const pcs = new Set(intervals.map((iv) => (rootPc + iv) % 12));
  const out = [];
  let last = -1;
  for (let s = 0; s < 6; s++) {
    for (let f = lowFret; f < lowFret + width; f++) {
      const m = midiAt(s, f);
      if (pcs.has(m % 12) && m > last) {
        out.push({ string: s, fret: f, midi: m, root: m % 12 === rootPc });
        last = m;
      }
    }
  }
  return out;
}

export {
  SCALES,
  scaleBox,
  TUNING, STRING_NAMES, NOTE_NAMES, midiAt, noteName, OPEN_SHAPES, chordShape, validateShape,
  shapeMidis, suggestCapo, transposeSymbol, splitSymbol, displayName,
};
