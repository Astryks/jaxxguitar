// Chord-recognition test with synthesized strummed guitar chords.
// Run: node scripts/test-chords.mjs
// Each strum is six Karplus-Strong strings (only the strings the shape
// plays), strummed down or up with 8-25 ms between strings, random
// loudness per string, sometimes a string missed, a phone-mic tilt (weak
// lows, so overtones dominate), background noise, and the previous chord
// still ringing underneath. It is judged at 0.2 s, 0.5 s and 1.0 s after
// the strum (a decaying chord), against two-chord drills and against all
// eight open chords at once.
const base = new URL("../js/", import.meta.url);
const { chromaFromFrame, matchChord, createStrumJudge } = await import(new URL("chord-detect.js", base));
const { chordShape, shapeMidis } = await import(new URL("guitar-theory.js", base));

let seed = 11;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const SR = 48000;

function pluck(out, at, freq, gain) {
  const period = SR / freq;
  const N = Math.max(2, Math.round(period));
  const line = Float32Array.from({ length: N }, () => rnd() * 2 - 1);
  const decay = 0.9965 - Math.max(0, freq - 150) * 0.000004;
  let idx = 0;
  for (let i = at; i < out.length; i++) {
    const nxt = (idx + 1) % N;
    const y = line[idx];
    line[idx] = decay * 0.5 * (y + line[nxt]);
    idx = nxt;
    out[i] += y * gain;
  }
}
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function strumChord(sym, { prev = null, seconds = 1.6 } = {}) {
  const out = new Float32Array(Math.floor(SR * seconds));
  const pre = Math.floor(SR * 0.3);
  if (prev) shapeMidis(chordShape(prev)).forEach((m, i) => pluck(out, i * 600, hz(m), 0.05)); // old chord, still ringing
  const shape = chordShape(sym);
  const strings = shape.frets.map((f, s) => (f >= 0 ? s : -1)).filter((s) => s >= 0);
  const up = rnd() < 0.3;
  const order = up ? [...strings].reverse() : strings;
  const gap = Math.floor(SR * (0.008 + rnd() * 0.017));
  const missIdx = rnd() < 0.4 ? Math.floor(rnd() * order.length) : -1; // sometimes one string isn't hit
  order.forEach((s, i) => {
    if (i === missIdx) return;
    const midi = 40 + [0, 5, 10, 15, 19, 24][s] + shape.frets[s];
    pluck(out, pre + i * gap, hz(midi), 0.12 + rnd() * 0.18);
  });
  // Phone mic: first-order high-pass around 200 Hz (weak lows) + noise.
  const a = Math.exp((-2 * Math.PI * 200) / SR);
  let px = 0, py = 0;
  for (let i = 0; i < out.length; i++) {
    const x = out[i];
    py = a * (py + x - px);
    px = x;
    out[i] = py * 2 + (rnd() * 2 - 1) * 0.004;
  }
  return { out, start: pre };
}

const DRILLS = [["G", "C"], ["G", "D"], ["Em", "C"], ["C", "Am"], ["D", "Em"], ["A", "D"], ["E", "Am"], ["Am", "Dm"], ["C", "G"], ["E", "A"]];
const ALL = ["G", "D", "Em", "C", "Am", "E", "A", "Dm"];
let ok2 = 0, n2 = 0, ok8 = 0, n8 = 0, wrong2 = 0;
const per = {};
for (let trial = 0; trial < 12; trial++) {
  for (const pair of DRILLS) {
    for (const [i, sym] of pair.entries()) {
      const { out, start } = strumChord(sym, { prev: pair[1 - i] });
      for (const t of [0.2, 0.5, 1.0]) {
        const at = start + Math.floor(SR * t) - 8192;
        const frame = out.subarray(at, at + 8192);
        const { chroma } = chromaFromFrame(frame, SR);
        const m2 = matchChord(chroma, pair);
        n2++;
        if (m2 && m2.chord === sym) ok2++;
        else if (m2 && m2.chord) wrong2++;
        const m8 = matchChord(chroma, ALL);
        n8++;
        per[sym] = per[sym] || [0, 0];
        per[sym][1]++;
        if (m8 && m8.chord === sym) { ok8++; per[sym][0]++; }
      }
    }
  }
}
console.log(`Two-chord drills (e.g. G vs C): ${ok2}/${n2} right (${((100 * ok2) / n2).toFixed(1)}%), ${wrong2} heard as the other chord, the rest "not sure"`);
console.log(`Any of 8 open chords:           ${ok8}/${n8} right (${((100 * ok8) / n8).toFixed(1)}%)`);
console.log("Per chord (8-way):", Object.entries(per).map(([c, [a, b]]) => `${c} ${Math.round((100 * a) / b)}%`).join(", "));

// The one-minute challenge end to end: a 30-second recording of someone
// switching G → C → G … every 1.2 s (each strum rings into the next),
// fed through the live strum judge in 60 ms steps like the microphone.
let changesOk = 0, changesTotal = 0;
// Also a player who strums each chord twice before switching (G G C C …):
// repeated strums of the same chord must not count as changes.
for (const [pair, per] of [[["G", "C"], 1], [["Em", "C"], 1], [["D", "G"], 1], [["C", "Am"], 1], [["G", "C"], 2], [["A", "D"], 2]]) {
  const strums = 24, gapS = per === 1 ? 1.2 : 0.8;
  const rec = new Float32Array(Math.floor(SR * (strums * gapS + 1.5)));
  for (let k = 0; k < strums; k++) {
    const { out, start } = strumChord(pair[Math.floor(k / per) % 2], { seconds: 2.0 });
    const at = Math.floor(SR * (0.5 + k * gapS)) - start;
    for (let i = start; i < out.length && at + i < rec.length; i++) rec[at + i] += out[i];
  }
  const N = 8192;
  let last = null, counted = 0;
  const feed = createStrumJudge({ candidates: pair, sampleRate: SR, N, onChord: (c) => { if (c && last && c !== last) counted++; if (c) last = c; } });
  const hop = Math.floor(SR * 0.06);
  for (let end = N; end < rec.length; end += hop) feed(rec.subarray(end - N, end), (1000 * end) / SR);
  const real = strums / per - 1;
  changesTotal += real;
  changesOk += Math.max(0, real - Math.abs(counted - real));
  console.log(`One-minute challenge ${pair.join("↔")}${per > 1 ? " (2 strums each)" : ""}: counted ${counted} of ${real} changes`);
}
process.exit(ok2 / n2 >= 0.9 && changesOk / changesTotal >= 0.85 ? 0 : 1);
