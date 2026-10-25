// Checks that every chord in the song library has a valid, playable guitar
// shape (the notes it sounds really are that chord). Run: node scripts/check-shapes.mjs
const base = new URL("../js/", import.meta.url);
const { SONGS } = await import(new URL("songs-data.js", base));
const { chordShape, validateShape, OPEN_SHAPES } = await import(new URL("guitar-theory.js", base));
const { parseChordSymbol } = await import(new URL("chord-utils.js", base));
let bad = 0, simplified = 0, total = 0;
for (const [sym, shape] of Object.entries(OPEN_SHAPES)) {
  const v = validateShape(sym, shape);
  if (!v.ok) { bad++; console.log("OPEN SHAPE WRONG", sym, shape.frets.join(""), v.why); }
}
const all = new Set();
SONGS.forEach((s) => s.chords.forEach((c) => { if (parseChordSymbol(c)) all.add(c); }));
for (const c of [...all].sort()) {
  total++;
  const sh = chordShape(c);
  if (!sh) { bad++; console.log("NO SHAPE", c); continue; }
  if (sh.simplified) { simplified++; console.log("simplified (bass dropped)", c, "->", sh.symbol, sh.frets.map((f) => (f < 0 ? "x" : f)).join(" ")); }
}
console.log(`${total} distinct chords, ${bad} problems, ${simplified} simplified`);
// The bar-by-bar charts (song-detail-data.js): every chord in every bar has a
// shape at the capo the song page uses, and the whole song adds up.
const { songDetail, detailPlan, wholeSongItems, tuneItems } = await import(new URL("song-detail.js", base));
let charts = 0, chartBad = 0;
for (const song of SONGS) {
  const d = songDetail(song);
  if (!d) continue;
  charts++;
  const p = detailPlan(song, d);
  const { items, total } = wholeSongItems(d, { capo: p.capo || 0, down: p.down || 0 });
  const missing = [...new Set(items.filter((i) => i.chord && !i.rest && !i.shape).map((i) => i.chord))];
  if (missing.length) { chartBad++; console.log("CHART CHORD WITH NO SHAPE", song.title, missing.join(" ")); }
  if (!(total > 0) || items.some((i) => !(i.start >= 0) || !(i.dur > 0) || i.start > total + 1e-6)) { chartBad++; console.log("CHART TIMING", song.title); }
  const tune = tuneItems(d, { capo: p.capo || 0, down: p.down || 0 });
  if (tune.some((n) => !(n.fret >= 0 && n.fret <= 12) || !(n.string >= 0 && n.string <= 5))) { chartBad++; console.log("TUNE OFF THE NECK", song.title); }
}
console.log(`${charts} bar-by-bar charts, ${chartBad} problems`);
bad += chartBad;
process.exit(bad ? 1 : 0);
