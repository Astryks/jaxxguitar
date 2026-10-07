// Pitch-detection accuracy test with synthesized plucked guitar strings.
// Run: node scripts/test-pitch.mjs
// Each open string (E2 A2 D3 G3 B3 E4) is synthesized two ways, at 44.1
// and 48 kHz, slightly out of tune (-20..+20 cents), with noise:
//   1. Karplus-Strong pluck (the classic plucked-string model), and
//   2. "phone mic" version: a strong 2nd harmonic and a weak fundamental
//      (small phone mics hardly hear 82 Hz), the case that used to give
//      octave errors.
// Frames are taken from the attack to the tail; a frame passes if the
// detected pitch is within 10 cents of the true one.
const { detectPitchInFrame } = await import(new URL("../js/pitch.js", import.meta.url));

const STRINGS = [["E2", 82.41], ["A2", 110.0], ["D3", 146.83], ["G3", 196.0], ["B3", 246.94], ["E4", 329.63]];
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;

function karplus(freq, sr, seconds = 2.5, gain = 0.5) {
  const n = Math.floor(sr * seconds);
  const out = new Float32Array(n);
  const period = sr / freq;
  // Averaging this sample with the next-older one gives a delay of N - 0.5;
  // a first-order allpass adds the rest so the loop is exactly one period.
  const N = Math.floor(period + 0.5);
  const want = period + 0.5 - N;
  const w = (2 * Math.PI * freq) / sr;
  const pd = (c) => {
    // H(e^jw) = (c + e^-jw) / (1 + c e^-jw); phase delay = -arg(H) / w
    const nr = c + Math.cos(w), ni = -Math.sin(w), dr = 1 + c * Math.cos(w), di = -c * Math.sin(w);
    return -(Math.atan2(ni, nr) - Math.atan2(di, dr)) / w;
  };
  let lo = -0.999, hi = 0.999; // pd falls as c rises
  for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (pd(mid) > want) lo = mid; else hi = mid; }
  const C = (lo + hi) / 2;
  const line = new Float32Array(N + 2);
  for (let i = 0; i < line.length; i++) line[i] = rnd();
  let idx = 0, apPrev = 0, apIn = 0, lp = 0;
  for (let i = 0; i < n; i++) {
    const y = line[idx];
    const next = line[(idx + 1) % N];
    lp = 0.996 * 0.5 * (y + next);
    const ap = C * lp + apIn - C * apPrev;
    apIn = lp; apPrev = ap;
    line[idx] = ap;
    idx = (idx + 1) % N;
    out[i] = y * gain;
  }
  return out;
}

function phoneMic(freq, sr, seconds = 2.5, gain = 0.4) {
  const n = Math.floor(sr * seconds);
  const out = new Float32Array(n);
  const amps = [0.12, 1.0, 0.55, 0.45, 0.3, 0.2, 0.12, 0.08];
  const phases = amps.map(() => Math.random() * Math.PI * 2);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let v = 0;
    amps.forEach((a, k) => {
      const h = k + 1;
      const f = freq * h * Math.sqrt(1 + 0.00004 * h * h); // slight string inharmonicity
      if (f < sr / 2) v += a * Math.exp(-t * (1.2 + 0.6 * h)) * Math.sin(2 * Math.PI * f * t + phases[k]);
    });
    out[i] = gain * v * Math.min(1, t / 0.004) + 0.004 * rnd();
  }
  return out;
}

const cents = (f, ref) => 1200 * Math.log2(f / ref);
let pass = 0, total = 0, octave = 0, tailWrong = 0;
const rows = [];
for (const sr of [44100, 48000]) {
  for (const [name, f0] of STRINGS) {
    for (const [kind, gen] of [["karplus", karplus], ["phone-mic", phoneMic]]) {
      const detune = Math.round(rnd() * 20);
      const f = f0 * Math.pow(2, detune / 1200);
      const clean = gen(f, sr);
      const sig = clean.map((v) => v + 0.002 * rnd());
      let ok = 0, n = 0, worst = 0;
      for (let t = 0.05; t < 2.2; t += 0.1) {
        const start = Math.floor(t * sr);
        const frame = sig.subarray(start, start + 4096);
        // Only judge frames where the string is still clearly ringing
        // (louder than about -40 dB); quieter tails may give no reading.
        let e = 0; for (let k = start; k < start + 4096; k++) e += clean[k] * clean[k];
        const got = detectPitchInFrame(frame, sr);
        if (Math.sqrt(e / 4096) < 0.01) { if (got && Math.abs(cents(got, f)) > 50) tailWrong++; continue; }
        n++; total++;
        if (!got) continue;
        const c = cents(got, f);
        if (Math.abs(Math.abs(c) - 1200) < 60) octave++;
        if (Math.abs(c) <= 10) { ok++; pass++; }
        worst = Math.max(worst, Math.abs(c));
      }
      rows.push(`${String(sr).padEnd(6)} ${name} ${kind.padEnd(9)} detune ${String(detune).padStart(3)}c: ${ok}/${n} frames within 10 cents`);
    }
  }
}
console.log(rows.join("\n"));
console.log(`\nTOTAL ${pass}/${total} ringing frames within 10 cents (${((100 * pass) / total).toFixed(1)}%), octave errors: ${octave}; wrong readings in the quiet tails: ${tailWrong}`);
process.exit(pass / total >= 0.95 ? 0 : 1);
