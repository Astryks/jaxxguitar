// How to play a library song on guitar: the easiest capo position and
// the chord shapes to use with it. Songs whose chord data isn't solid
// enough to chart (the library says so in plain words instead of chord
// symbols) come back as not playable.

import { SONGS, getDifficulty } from "./songs-data.js";
import { chordShape, suggestCapo, transposeSymbol } from "./guitar-theory.js";

// Bands that tune down (e.g. half a step) play shapes that sound lower:
// the shape for a song chord is the chord moved UP by that many semitones.
function tuningOffset(song) {
  const t = String(song.tuning || "").toLowerCase();
  if (/half[ -]step down|eb standard|e♭ standard/.test(t)) return 1;
  if (/whole[ -]step down|d standard|full step down/.test(t)) return 2;
  if (/drop c#|c# standard/.test(t)) return 3;
  return 0;
}

const cache = new Map();
function songPlan(song) {
  if (cache.has(song.title)) return cache.get(song.title);
  const plan = planFor(song.chords, tuningOffset(song));
  cache.set(song.title, plan);
  return plan;
}

// The plan for a list of song chords (concert pitch) with the guitar tuned
// `down` half steps (e.g. a song page that uses the bar-by-bar chart's
// tuning, song-detail.js). Not cached.
function planFor(songChords = [], down = 0) {
  const chords = (songChords || []).filter((c) => /^[A-G]/.test(c) && c.length <= 10).map((c) => (down ? transposeSymbol(c, down) : c));
  let plan = { playable: false, capo: 0, chords, shapes: [], map: {} };
  if (chords.length && chords.length === songChords.length) {
    const best = suggestCapo(chords);
    const tryCapo = (capo) => {
      const map = Object.fromEntries([...new Set(chords)].map((c) => [c, transposeSymbol(c, -capo)]));
      const ok = Object.values(map).every((s) => chordShape(s));
      return ok ? { playable: true, capo, chords, map, shapes: chords.map((c) => map[c]) } : null;
    };
    plan = tryCapo(best.capo) || tryCapo(0) || plan;
  }
  return plan;
}

function playableSongs() {
  return SONGS.filter((s) => songPlan(s).playable);
}

function songsByTier(tier, { world = false } = {}) {
  return playableSongs()
    .filter((s) => Boolean(s.genre && s.genre.startsWith("World")) === world && getDifficulty(s) === tier)
    .sort((a, b) => (a.popularityRank || 999) - (b.popularityRank || 999));
}

export { songPlan, planFor, playableSongs, songsByTier, tuningOffset };
