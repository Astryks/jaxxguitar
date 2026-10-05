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
process.exit(bad ? 1 : 0);
