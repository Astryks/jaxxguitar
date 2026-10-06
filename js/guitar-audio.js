// Guitar sound for Jaxx Guitar, synthesized live — no sample files.
// Karplus-Strong plucked-string synthesis (Karplus & Strong, 1983): a
// short burst of noise is fed through a delay line one period long with
// gentle low-pass averaging, which turns it into a decaying, string-like
// tone at that pitch. Each note's buffer is computed once and cached.
// Strums play the strings of a chord shape a few milliseconds apart,
// low-to-high for a downstroke and high-to-low for an upstroke, the way a
// real strum sounds.

let ctx = null;
function getAudioContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  // iOS also has an "interrupted" state (after a call, Siri, or switching
  // apps) — resume from anything that isn't running.
  if (ctx.state !== "running") ctx.resume?.().catch?.(() => {});
  return ctx;
}

// iOS: Web Audio stays silent until it's resumed inside a real tap, and
// in Safari/the app it follows the ringer switch unless the page asks for
// "playback" audio (like a music app). Unlock on the first touch, with a
// one-sample silent buffer, so the very first key/strum is heard.
if (typeof navigator !== "undefined" && navigator.audioSession) {
  try { navigator.audioSession.type = "playback"; } catch (e) { /* older Safari */ }
}
function unlockAudio() {
  const c = getAudioContext();
  try {
    const b = c.createBuffer(1, 1, c.sampleRate);
    const s = c.createBufferSource();
    s.buffer = b;
    s.connect(c.destination);
    s.start(0);
  } catch (e) { /* ignore */ }
  if (c.state !== "running") c.resume?.();
  else ["touchend", "pointerdown", "keydown"].forEach((t) => window.removeEventListener(t, unlockAudio, true));
}
if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => { if (!document.hidden) getAudioContext(); });
if (typeof window !== "undefined") ["touchend", "pointerdown", "keydown"].forEach((t) => window.addEventListener(t, unlockAudio, true));

const cache = new Map();
function pluckBuffer(midi, seconds = 2.6) {
  const c = getAudioContext();
  const key = `${midi}|${c.sampleRate}`;
  if (cache.has(key)) return cache.get(key);
  const rate = c.sampleRate;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const period = Math.max(2, Math.round(rate / freq));
  const len = Math.floor(rate * seconds);
  const buf = c.createBuffer(1, len, rate);
  const out = buf.getChannelData(0);
  const line = new Float32Array(period);
  // Pluck: noise, lightly low-passed so it's less harsh
  let prev = 0;
  for (let i = 0; i < period; i++) {
    const n = Math.random() * 2 - 1;
    prev = 0.6 * n + 0.4 * prev;
    line[i] = prev;
  }
  // Higher notes ring a little shorter, like real strings
  const decay = 0.996 - Math.max(0, midi - 52) * 0.00012;
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const next = (idx + 1) % period;
    const v = decay * 0.5 * (line[idx] + line[next]);
    out[i] = line[idx];
    line[idx] = v;
    idx = next;
  }
  // Small fade-in/out to avoid clicks
  for (let i = 0; i < 64 && i < len; i++) out[i] *= i / 64;
  for (let i = 0; i < 2048 && i < len; i++) out[len - 1 - i] *= i / 2048;
  cache.set(key, buf);
  return buf;
}

function playNote(midi, { delay = 0, duration = 2.4, gain = 0.32 } = {}) {
  const c = getAudioContext();
  const src = c.createBufferSource();
  src.buffer = pluckBuffer(midi);
  const g = c.createGain();
  const t = c.currentTime + delay;
  g.gain.setValueAtTime(gain, t);
  g.gain.setTargetAtTime(0, t + Math.max(0.05, duration), 0.08);
  src.connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + duration + 0.6);
  return src;
}

// Strum MIDI notes (given low → high). direction: "down" | "up".
function strum(midis, { direction = "down", delay = 0, spread = 0.018, duration = 2.2, gain = 0.26 } = {}) {
  const order = direction === "up" ? [...midis].reverse() : midis;
  order.forEach((m, i) => playNote(m, { delay: delay + i * spread, duration, gain }));
}

// A short metronome tick (accent on the first beat).
function click(accent = false, delay = 0) {
  const c = getAudioContext();
  const o = c.createOscillator();
  const g = c.createGain();
  const t = c.currentTime + delay;
  o.frequency.value = accent ? 1600 : 1100;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(accent ? 0.25 : 0.15, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.06);
}

export { getAudioContext, playNote, strum, click };
