// Chord recognition from the microphone, made for a real strummed guitar.
//
// The single-note pitch tracker can't hear six strings at once, so this
// listens to the whole spectrum instead:
//   1. Take ~170 ms of sound, window it and run an FFT.
//   2. Fold every spectral peak between 70 Hz and 2 kHz into 12 "pitch
//      class" bins (a chroma vector): C, C#, D ... B. Octaves land in the
//      same bin, so doubled notes (a G chord has three Gs) just add up.
//   3. Compare it with what each candidate chord should sound like on the
//      guitar: the notes of its real shape, each with its first overtones
//      (a guitar string's 2nd and 3rd harmonics are loud). Cosine
//      similarity is forgiving: a muted string, a missing note, or a strum
//      that's dying away still points the same way.
//   4. A strum is a jump in loudness. The chord is judged from the frames
//      just after each strum, while it rings.
//
// Pure functions (chromaFromFrame, matchChord) are tested in Node by
// scripts/test-chords.mjs with synthesized strums.

import { chordShape, shapeMidis } from "./guitar-theory.js";
import { parseChordSymbol } from "./chord-utils.js";
import { openMicStream, releaseMicSession } from "./pitch.js";

// --- FFT (radix-2, in place) ------------------------------------------------
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

const hannCache = new Map();
function hann(n) {
  if (!hannCache.has(n)) hannCache.set(n, Float32Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))));
  return hannCache.get(n);
}

// Magnitude spectrum of one frame (power-of-two length), Hann-windowed.
function spectrum(frame) {
  const n = frame.length;
  const w = hann(n);
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[i] = frame[i] * w[i];
  fft(re, im);
  const mag = new Float64Array(n / 2);
  for (let k = 0; k < n / 2; k++) mag[k] = Math.hypot(re[k], im[k]);
  return mag;
}

// 12-bin chroma (index 0 = C) of one frame. `before` (optional) is the
// spectrum from just before the strum: the old chord that's still ringing
// is subtracted, so only what the new strum added is judged.
function chromaFromFrame(frame, sampleRate, { fmin = 70, fmax = 2100, before = null, keep = 0.75 } = {}) {
  const n = frame.length;
  let energy = 0;
  for (let i = 0; i < n; i++) energy += frame[i] * frame[i];
  const rms = Math.sqrt(energy / n);
  const raw = spectrum(frame);
  const mag = before ? raw.map((m, k) => Math.max(0, m - keep * before[k])) : raw;
  const half = n / 2;
  const k0 = Math.max(2, Math.floor((fmin * n) / sampleRate));
  const k1 = Math.min(half - 2, Math.ceil((fmax * n) / sampleRate));
  // Peaks only (the tops of the partials), compressed so one loud string
  // can't drown the others; ignore peaks far below the loudest one.
  let maxMag = 0;
  for (let k = k0; k <= k1; k++) maxMag = Math.max(maxMag, mag[k]);
  const chroma = new Float64Array(12);
  if (maxMag <= 0) return { chroma, rms, mag: raw };
  for (let k = k0; k <= k1; k++) {
    const m = mag[k];
    if (m < maxMag * 0.02 || m < mag[k - 1] || m < mag[k + 1]) continue;
    // Parabolic peak position for a sharper frequency.
    const a = mag[k - 1], b = m, c = mag[k + 1];
    const den = a - 2 * b + c;
    const off = den ? (0.5 * (a - c)) / den : 0;
    const f = ((k + off) * sampleRate) / n;
    const midi = 69 + 12 * Math.log2(f / 440);
    const pc = ((Math.round(midi) % 12) + 12) % 12;
    const detune = Math.abs(midi - Math.round(midi)); // 0..0.5 semitone
    chroma[pc] += Math.sqrt(m / maxMag) * (1 - detune);
  }
  return { chroma, rms, mag: raw };
}

// What a chord should look like in chroma when strummed on a guitar: the
// notes of its real shape, plus their loud overtones.
const HARMONICS = [[1, 1], [2, 0.7], [3, 0.45], [4, 0.3], [5, 0.2], [6, 0.15]];
const templateCache = new Map();
function chordTemplate(symbol) {
  if (templateCache.has(symbol)) return templateCache.get(symbol);
  const t = new Float64Array(12);
  const shape = chordShape(symbol);
  let midis = shape ? shapeMidis(shape) : null;
  if (!midis || !midis.length) {
    const p = parseChordSymbol(symbol);
    if (!p) return null;
    midis = p.intervals.map((iv) => 48 + p.root + iv);
  }
  midis.forEach((m) => HARMONICS.forEach(([h, wgt]) => {
    const pc = (((Math.round(m + 12 * Math.log2(h))) % 12) + 12) % 12;
    t[pc] += wgt;
  }));
  // Same compression as the measured chroma.
  for (let i = 0; i < 12; i++) t[i] = Math.sqrt(t[i]);
  templateCache.set(symbol, t);
  return t;
}

function cosine(a, b) {
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < 12; i++) { ab += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
}

// Best candidate for a chroma vector: { chord, score, margin } or null
// when nothing fits well enough (talking, noise, the wrong chord).
function matchChord(chroma, candidates, { minScore = 0.72, minMargin = 0.02 } = {}) {
  const scored = candidates.map((c) => ({ chord: c, score: chordTemplate(c) ? cosine(chroma, chordTemplate(c)) : 0 })).sort((x, y) => y.score - x.score);
  if (!scored.length) return null;
  const [best, second] = scored;
  const margin = best.score - (second ? second.score : 0);
  if (best.score < minScore || (second && margin < minMargin)) return { chord: null, score: best.score, margin, guess: best.chord };
  return { chord: best.chord, score: best.score, margin };
}

// --- Strum judge -------------------------------------------------------------
// Fed the newest N samples every ~60 ms (live: from an AnalyserNode; in
// tests: from a synthesized recording). Finds strums (a jump in loudness)
// and, once a whole window of sound after the strum is in, names the
// chord from up to 3 windows. Calls onChord(chord|null, match).
function createStrumJudge({ candidates, sampleRate, N, onChord, onLevel }) {
  const short = 1024;
  let floor = 0.003;
  let lastLevel = 0;
  let pending = null;
  let lastOnset = -1e9;
  const windowMs = (1000 * N) / sampleRate;
  return function feed(buf, now) {
    let e = 0;
    for (let i = N - short; i < N; i++) e += buf[i] * buf[i];
    const level = Math.sqrt(e / short);
    onLevel?.(level);
    floor = Math.min(Math.max(0.002, floor * 1.02), Math.max(0.002, level)); // slowly rising noise floor
    const onset = level > Math.max(0.01, floor * 3) && level > lastLevel * 1.6 && now - lastOnset > 180;
    lastLevel = level;
    if (onset) {
      lastOnset = now;
      // This window is still nearly all the sound from before the strum.
      pending = { at: now, frames: [], before: spectrum(buf) };
    }
    if (pending && now - pending.at > windowMs + 10) {
      pending.frames.push(chromaFromFrame(buf, sampleRate, { before: pending.before }).chroma);
      if (pending.frames.length >= 3 || now - pending.at > windowMs + 400) {
        const sum = new Float64Array(12);
        pending.frames.forEach((c) => c.forEach((v, i) => { sum[i] += v; }));
        const m = matchChord(sum, candidates);
        pending = null;
        onChord(m && m.chord, m);
      }
    }
  };
}

// --- Live listening -----------------------------------------------------------
// startChordListening({ candidates, onChord(chord, info), onLevel(rms) })
// fires onChord once per strum with the chord it heard (or null), judged
// from the ringing just after the strum. Returns stop().
async function startChordListening({ candidates, onChord, onLevel }) {
  const stream = await openMicStream();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  const N = ctx.sampleRate > 60000 ? 16384 : 8192;
  analyser.fftSize = N;
  source.connect(analyser);
  const buf = new Float32Array(N);
  const feed = createStrumJudge({ candidates, sampleRate: ctx.sampleRate, N, onChord, onLevel });
  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    feed(buf, performance.now());
  }, 60);
  return function stop() {
    clearInterval(timer);
    stream.getTracks().forEach((t) => t.stop());
    releaseMicSession();
    source.disconnect();
    ctx.close();
  };
}

export { spectrum, chromaFromFrame, chordTemplate, matchChord, createStrumJudge, startChordListening, fft };
