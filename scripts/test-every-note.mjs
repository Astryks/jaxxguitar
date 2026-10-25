// Checks the "Every note" pipeline (js/every-note.js) on known notes:
// every position it picks is playable (one note per string, span <= 4
// frets, <= 4 fingers with a barre), sounds the right pitch in the chosen
// tuning, and the tempo / bar lines / tuning come out right.
// Run: node scripts/test-every-note.mjs
const M = await import(new URL("../js/every-note.js", import.meta.url));

let seed = 3;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function song(shift = 0, bpm = 100) {
  const beat = 60 / bpm, t0 = 0.5, notes = [];
  const add = (midi, b, d, v, k = 0) => notes.push({ midi: midi + shift, time: t0 + b * beat + k * 0.012 + (rnd() - 0.5) * 0.02, duration: d * beat * 0.95, velocity: v });
  // Ode to Joy (public domain) over C / G strums, then 8th-note runs.
  const mel = [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62, 62];
  mel.forEach((m, i) => add(m, i, 1, 0.6));
  ["C", "G", "C", "G"].forEach((c, bar) => [0, 2].forEach((b) => ({ C: [48, 52, 55], G: [43, 47, 50] })[c].forEach((m, k) => add(m, bar * 4 + b, 2, 0.45, k))));
  [40, 44, 45, 47, 52, 56, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72].forEach((m, i) => add(m, 16 + i * 0.5, 0.5, 0.6));
  [40, 47, 52, 56, 59, 64].forEach((m, k) => add(m, 24, 2, 0.5, k));
  return { notes, beat, t0 };
}

let fail = 0;
const check = (ok, msg) => { if (!ok) { fail++; console.log("FAIL", msg); } };
for (const [shift, bpm, tuning] of [[0, 100, "standard"], [-1, 84, "halfDown"], [0, 72, "standard"]]) {
  for (const capo of [0, 2]) {
    const { notes, beat, t0 } = song(shift, bpm);
    const out = M.buildEveryNote(notes, { capo });
    const open = M.TUNINGS[out.tuning].strings;
    check(out.tuning === tuning, `tuning ${out.tuning} != ${tuning}`);
    let n = 0;
    out.groups.forEach((g) => {
      check(M.isPlayable(g.notes), `unplayable at ${g.t.toFixed(2)}: ${JSON.stringify(g.notes.map((x) => [x.string, x.fret]))}`);
      g.notes.forEach((x) => { n++; check(open[x.string] + capo + x.fret === x.play && (x.play - x.midi) % 12 === 0, `wrong pitch ${x.midi} at string ${x.string} fret ${x.fret}`); });
      n += g.dropped.length;
    });
    check(n === notes.length, `notes kept ${n} of ${notes.length}`);
    check(Math.abs(out.grid.bpm - bpm) <= 2, `tempo ${out.grid.bpm} != ${bpm}`);
    const wrongBar = notes.filter((x) => {
      const tb = (x.time - t0) / beat;
      const p = M.barPosition(out.grid, x.time);
      return p.bar !== Math.floor(tb / 4 + 0.03) + 1 || p.beat !== (Math.floor(tb + 0.13) % 4) + 1;
    }).length;
    check(wrongBar === 0, `${wrongBar} notes in the wrong bar/beat (${bpm} BPM)`);
    console.log(`${bpm} BPM shift ${shift} capo ${capo}: ${out.groups.length} moments, tuning ${out.tuning}, ${out.grid.bpm} BPM, max fret ${Math.max(...out.groups.flatMap((g) => g.notes.map((x) => x.fret)))}`);
  }
}
check(M.chordOf([43, 47, 50, 55, 59, 67]) === "G", "chordOf G");
check(M.chordOf([45, 52, 57, 60, 64]) === "Am", "chordOf Am");
check(M.chordOf([42, 50, 57, 62]) === "D/F#", "chordOf D/F#");
check(M.chordOf([40, 47]) === "E5", "chordOf E5");
check(M.chordOf([60]) === null, "chordOf single");
console.log(fail ? `${fail} problems` : "every-note: all good");
process.exit(fail ? 1 : 0);
