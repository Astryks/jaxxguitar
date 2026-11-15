// Monophonic pitch detection for the tuner and "Wait for me".
// Originally the normalised-autocorrelation detector from the Dawsons
// project (same author/org; see THIRD_PARTY_NOTICES.md). In 2026-10 the
// core was replaced with YIN (see detectPitchInFrame) because the old
// method made octave errors on real guitars. The live wrapper runs the
// detector on the microphone about 30 times a second.
//
// 2026-11 tuner pass: everything above the "Web Audio" line is pure (no
// window, no audio) so node can run it (scripts/test-tuner-pitch.mjs):
//   detectPitchInFrame(frame, sr)   one frame -> Hz or null (YIN)
//   analyzeFrame(frame, sr)         the same, plus loudness and clarity
//   createPitchTracker()            frames in -> smoothed reading out:
//                                   noise gate, median of recent frames,
//                                   octave-glitch folding, pluck onsets
//   tunerReading(midi, targetMidi)  cents from the string being tuned,
//                                   flat / in tune / sharp
// The live microphone code below uses exactly these functions.

const MIN_FREQ = 70; // below the low E string (82 Hz), even tuned down a step
const MAX_FREQ = 1200;
const YIN_THRESHOLD = 0.15; // first dip below this is the fundamental
const YIN_FALLBACK = 0.25; // otherwise accept the deepest dip if it's this clear
const MIN_RMS = 0.0025; // quiet phone mics (no auto gain) still pass a plucked string
const MIN_CLARITY = 0.95; // tracker: weaker periodicity (a dying string in noise) reads 10-20 cents off
const NOISE_GATE = 3; // tracker: a note must be this many times louder than the room
// Analysis window: the analyser hands us 4096 samples (85-93 ms). YIN
// compares the first W samples with copies shifted by up to one low-E
// period (~630 samples), so W is what's left, capped at 40 ms: about 3.3
// periods of a low E, enough for a steady reading.
const WINDOW_SECONDS = 0.07;
const FRAME_SIZE = 4096;

function midiFromFreq(freq) {
  return 69 + 12 * Math.log2(freq / 440);
}

function freqFromMidi(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// One frame -> { freq (Hz or null), rms, clarity (0..1) }.
//
// 2026-10 rewrite for real guitars: the old "first autocorrelation peak
// above 0.35" read a low E as E3 (an octave up) whenever the 2nd harmonic
// was strong, which is normal for a guitar heard through a phone mic (the
// mic hardly hears 82 Hz, so the overtones dominate). This is the YIN
// method (de Cheveigné & Kawahara, 2002): the cumulative-mean-normalised
// difference function only dips near zero at the true period (at half the
// period the odd harmonics don't cancel), with parabolic interpolation for
// sub-sample accuracy. The sample rate always comes from the audio
// context (44.1 or 48 kHz), never assumed.
function analyzeFrame(frame, sampleRate) {
  const minLag = Math.max(2, Math.floor(sampleRate / MAX_FREQ));
  const maxLag = Math.ceil(sampleRate / MIN_FREQ);
  const W = Math.min(frame.length - maxLag - 2, Math.max(512, Math.round(sampleRate * WINDOW_SECONDS)));
  if (W < 256) return { freq: null, rms: 0, clarity: 0 };

  let energy = 0;
  for (let i = 0; i < W + maxLag; i++) energy += frame[i] * frame[i];
  const rms = Math.sqrt(energy / (W + maxLag));
  if (rms < MIN_RMS) return { freq: null, rms, clarity: 0 }; // silence / noise floor

  const d = new Float32Array(maxLag + 2);
  for (let lag = 1; lag <= maxLag + 1; lag++) {
    let sum = 0;
    for (let i = 0; i < W; i++) {
      const diff = frame[i] - frame[i + lag];
      sum += diff * diff;
    }
    d[lag] = sum;
  }
  // Cumulative mean normalised difference.
  const cmnd = new Float32Array(maxLag + 2);
  cmnd[0] = 1;
  let running = 0;
  for (let lag = 1; lag <= maxLag + 1; lag++) {
    running += d[lag];
    cmnd[lag] = running > 0 ? (d[lag] * lag) / running : 1;
  }
  let tau = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (cmnd[lag] < YIN_THRESHOLD) {
      while (lag + 1 <= maxLag && cmnd[lag + 1] < cmnd[lag]) lag++;
      tau = lag;
      break;
    }
  }
  if (tau < 0) {
    let best = minLag;
    for (let lag = minLag; lag <= maxLag; lag++) if (cmnd[lag] < cmnd[best]) best = lag;
    if (cmnd[best] > YIN_FALLBACK) return { freq: null, rms, clarity: 1 - cmnd[best] };
    tau = best;
  }
  // Octave check: if the dip one period further on (twice the lag, an
  // octave lower) is clearly deeper, we caught the 2nd harmonic: the
  // string really sounds an octave lower. (At the true period every
  // harmonic cancels; at half of it the odd ones don't.)
  const tau2 = tau * 2;
  if (tau2 + 1 <= maxLag) {
    let b = tau2;
    for (let lag = Math.max(minLag, tau2 - 3); lag <= Math.min(maxLag, tau2 + 3); lag++) if (cmnd[lag] < cmnd[b]) b = lag;
    if (cmnd[tau] > 0.04 && cmnd[b] < cmnd[tau] * 0.5) tau = b;
  }
  // Parabolic interpolation around the dip.
  let t = tau;
  if (tau > 1 && tau < maxLag + 1) {
    const y0 = cmnd[tau - 1];
    const y1 = cmnd[tau];
    const y2 = cmnd[tau + 1];
    const denom = y0 - 2 * y1 + y2;
    if (Math.abs(denom) > 1e-12) t = tau + (0.5 * (y0 - y2)) / denom;
  }
  return { freq: sampleRate / t, rms, clarity: Math.max(0, 1 - cmnd[tau]) };
}

// One frame's fundamental frequency, or null if no confident pitch.
function detectPitchInFrame(frame, sampleRate) {
  return analyzeFrame(frame, sampleRate).freq;
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};

// Frames in, steady readings out. push(frame, sampleRate) returns null
// (nothing clear to report) or { freq, midi, noteMidi, cents, rms,
// clarity, onset }:
//   - noise gate: the frame must be louder than the room (a slowly
//     learned noise floor, x3) as well as MIN_RMS, and clearly periodic
//     (YIN clarity >= 0.95: a dying string buried in noise reads wobbly);
//   - a reading is the median of the last `smoothing` frames, so a single
//     pick-noise or overtone frame can't flick it;
//   - a frame that jumps exactly an octave UP from the recent readings is
//     the 2nd harmonic winning for a moment: it's folded back down;
//   - two silent frames in a row clear the history (a new note starts
//     fresh instead of being dragged by the last one);
//   - onset: true on the first reading after a new pluck (the sound got
//     at least twice as loud), so "the same note again" can be told apart
//     from "still ringing".
// `cents` is from the nearest note (-50..50); tuners use tunerReading().
function createPitchTracker({ smoothing = 5 } = {}) {
  const recent = [];
  const levels = [];
  let misses = 0;
  let noise = MIN_RMS / NOISE_GATE; // the room's level, learned from frames with no pitch
  let pendingOnset = false;
  let sinceOnset = 99; // frames; one pluck's attack spans a few frames
  return {
    reset() {
      recent.length = 0;
      levels.length = 0;
      misses = 0;
      pendingOnset = false;
      sinceOnset = 99;
    },
    push(frame, sampleRate) {
      const a = analyzeFrame(frame, sampleRate);
      const gate = Math.max(MIN_RMS, noise * NOISE_GATE);
      const prevMin = levels.length ? Math.min(...levels) : Infinity;
      levels.push(a.rms);
      if (levels.length > 6) levels.shift();
      sinceOnset++;
      if (a.rms > gate && a.rms > 2 * prevMin && sinceOnset > 8) {
        pendingOnset = true;
        sinceOnset = 0;
      }
      if (!a.freq || a.rms < gate || a.clarity < MIN_CLARITY) {
        // Learn the room's noise from frames with no pitch: down quickly,
        // up gently. Loud frames with no pitch (a strum, a knock: over 10x
        // the room) are music, not the room, and are ignored, or one of
        // them would gate out the next note.
        if (!a.freq && a.rms > 0) {
          if (a.rms < noise) noise = 0.7 * noise + 0.3 * a.rms;
          else if (a.rms < 10 * noise) noise = 0.85 * noise + 0.15 * a.rms;
        }
        if (++misses >= 2) recent.length = 0;
        return null;
      }
      misses = 0;
      let m = midiFromFreq(a.freq);
      if (recent.length >= 2) {
        const med = median(recent);
        if (Math.abs(m - med - 12) < 0.7) m -= 12;
      }
      recent.push(m);
      if (recent.length > smoothing) recent.shift();
      const midi = median(recent);
      const noteMidi = Math.round(midi);
      const onset = pendingOnset;
      pendingOnset = false;
      return { freq: freqFromMidi(midi), midi, noteMidi, cents: Math.round((midi - noteMidi) * 100), rms: a.rms, clarity: a.clarity, onset };
    },
  };
}

// How far a heard pitch (fractional MIDI) is from the string being tuned.
// A guitar string can't be an octave out of tune, so a reading 1 or 2
// octaves off (the mic catching an overtone) that lands within 3
// half-steps of the target is taken as that string. Returns { cents
// (vs the target, rounded), direction: "flat" | "in" | "sharp",
// farOff (more than 3 half-steps away: probably another string) }.
function tunerReading(midi, targetMidi, tolerance = 7) {
  let diff = midi - targetMidi;
  const oct = Math.round(diff / 12);
  if (oct !== 0 && Math.abs(diff - 12 * oct) <= 3) diff -= 12 * oct;
  const cents = Math.round(diff * 100);
  const direction = Math.abs(cents) <= tolerance ? "in" : cents < 0 ? "flat" : "sharp";
  return { cents, direction, farOff: Math.abs(diff) > 3 };
}

// --- Web Audio / microphone (browser only) ----------------------------
// Microphone with the phone's voice processing switched OFF: echo
// cancellation, noise suppression and auto gain are made for speech and
// treat a held guitar note as "noise" to remove, which is a big reason
// the tuner never settled on a real guitar.
const MIC_CONSTRAINTS = { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } };

function micUnavailableReason() {
  if (typeof window !== "undefined" && window.isSecureContext === false) return "the page isn't secure (it needs https)";
  if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return "this browser can't use the microphone";
  return null;
}

// Asks for the microphone. In the iOS app the sound plays in "playback"
// mode (so it's heard with the ringer switch on silent), and iOS refuses
// the microphone in that mode; listening needs "play and record", which
// still plays out loud. Switch first, give WebKit a moment to apply it,
// and retry once (the first request can fail while the switch happens).
// How many microphone streams are open. iOS goes back to "playback" audio
// (loudspeaker, ringer switch ignored) only when the last one closes, so
// closing the tuner doesn't cut off another screen that's still listening.
let openMics = 0;
function releaseMicSession() {
  openMics = Math.max(0, openMics - 1);
  if (openMics === 0) {
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; window.__audioDirty = true; } catch (e) { /* older Safari */ }
  }
}

async function openMicStream() {
  const stream = await openMicStreamRaw();
  openMics++;
  return stream;
}

async function openMicStreamRaw() {
  const reason = micUnavailableReason();
  if (reason) throw new Error(reason);
  try { if (navigator.audioSession) navigator.audioSession.type = "play-and-record"; window.__audioDirty = true; } catch (e) { /* older Safari */ }
  const ask = async (c) => {
    try { return await navigator.mediaDevices.getUserMedia(c); } catch (e) {
      // Some devices reject the processing switches; plain audio still works.
      if (e && (e.name === "OverconstrainedError" || e.name === "TypeError")) return navigator.mediaDevices.getUserMedia({ audio: true });
      throw e;
    }
  };
  try {
    return await ask(MIC_CONSTRAINTS);
  } catch (e) {
    if (e && (e.name === "NotAllowedError" || e.name === "SecurityError")) throw e;
    await new Promise((r) => setTimeout(r, 250));
    return ask(MIC_CONSTRAINTS);
  }
}

function friendlyMicError(err) {
  const n = err && err.name;
  if (n === "NotAllowedError" || n === "SecurityError") return "the microphone permission is turned off (allow it in Settings, then try again)";
  if (n === "NotFoundError") return "no microphone was found";
  if (n === "NotReadableError") return "another app is using the microphone";
  return (err && err.message) || "unknown error";
}


// --- Live wrapper for live listening -----

// While the app itself is playing a note (the tuner's reference tone),
// the microphone hears the phone's speaker. ignoreMicFor(ms) makes every
// live listener (tuner and "Use my guitar") ignore the mic for that long,
// and forget what it heard, so the app's own note never counts as the
// player's.
let ignoreUntil = 0;
const nowMs = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
function ignoreMicFor(ms) {
  ignoreUntil = Math.max(ignoreUntil, nowMs() + ms);
}
function micIgnored() {
  return nowMs() < ignoreUntil;
}

// Wraps getUserMedia + an AnalyserNode and calls `onPitch({freq, midi,
// noteMidi, cents, rms, clarity, onset})` about 30 times a second while
// listening, or `onPitch(null)` when no confident pitch is present (or
// the mic is being ignored, see ignoreMicFor). All the smoothing is
// createPitchTracker(). Returns `stop()`.
async function startLivePitchDetection(onPitch, { fftSize = FRAME_SIZE } = {}) {
  const stream = await openMicStream();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Created after the permission prompt, i.e. outside the tap that started
  // this: WebKit can hand back a suspended context that only reads silence.
  if (audioCtx.state === "suspended") await audioCtx.resume().catch(() => {});
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  const tracker = createPitchTracker();
  let running = true;

  function tick() {
    if (!running) return;
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    analyser.getFloatTimeDomainData(buffer);
    if (micIgnored()) {
      tracker.reset();
      onPitch(null);
      return;
    }
    onPitch(tracker.push(buffer, audioCtx.sampleRate));
  }
  const timer = setInterval(tick, 33);
  tick();

  return function stop() {
    running = false;
    clearInterval(timer);
    stream.getTracks().forEach((t) => t.stop());
    releaseMicSession();
    source.disconnect();
    audioCtx.close();
  };
}

// --- The tuner widget ----------------------------------------------------
//
// [Start listening] -> the mic starts and a meter appears: a needle that
// swings flat (left) / sharp (right) of the string being tuned, the cents,
// and a big "↑ Tune up" / "↓ Tune down" / "In tune ✓". It goes green once
// the string has stayed within `tolerance` cents for `holdMs` (a passing
// blip can't do it); onMatch(result) fires then, once per target. It keeps
// listening (and the needle keeps moving) until Stop.
// setTarget(midi, name) switches string without closing the microphone.
// onListening(on) tells the caller when listening starts / stops.
const NOTE_LABELS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function tunerNoteName(midi) {
  return `${NOTE_LABELS[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

const METER_RANGE = 50; // cents either side
const METER_ANGLE = 58; // degrees the needle swings at the ends
function meterSvg(tolerance) {
  const cx = 120, cy = 118, r = 86;
  const pt = (cents, rad) => {
    const a = ((cents / METER_RANGE) * METER_ANGLE * Math.PI) / 180;
    return [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];
  };
  const arc = (c0, c1, rad) => {
    const [x0, y0] = pt(c0, rad), [x1, y1] = pt(c1, rad);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${rad} ${rad} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  const ticks = [];
  for (let c = -50; c <= 50; c += 10) {
    const [x0, y0] = pt(c, r - (c % 50 === 0 || c === 0 ? 14 : 8)), [x1, y1] = pt(c, r);
    ticks.push(`<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#8a7a68" stroke-width="${c === 0 ? 3 : 1.5}"/>`);
  }
  const T = (x, y, txt, fill, size = 12, anchor = "middle") => `<text x="${x}" y="${y}" style="font:700 ${size}px system-ui,-apple-system,sans-serif;fill:${fill};text-anchor:${anchor}">${txt}</text>`;
  return `<svg viewBox="0 0 240 132" class="hk-tuner-meter" role="img" aria-label="Tuning meter: needle left means flat, right means sharp" style="width:min(280px,100%);height:auto;display:block">
    <path d="${arc(-50, 50, r)}" fill="none" stroke="#efe3d2" stroke-width="18" stroke-linecap="round"/>
    <path d="${arc(-50, -tolerance, r)}" fill="none" stroke="#f6d9b5" stroke-width="18"/>
    <path d="${arc(tolerance, 50, r)}" fill="none" stroke="#f6d9b5" stroke-width="18"/>
    <path d="${arc(-tolerance, tolerance, r)}" fill="none" stroke="#3fa35f" stroke-width="18"/>
    ${ticks.join("")}
    ${T(26, 128, "♭ flat", "#b5532a", 12, "start")}${T(214, 128, "sharp ♯", "#b5532a", 12, "end")}${T(cx, 13, "in tune", "#2b8a4b", 11)}
    <g class="hk-tuner-needle-g" transform="rotate(0 ${cx} ${cy})" style="transition:transform 0.12s ease-out;opacity:0.35">
      <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r + 4}" stroke="#3b2410" stroke-width="3.5" stroke-linecap="round"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="7" fill="#3b2410"/>
  </svg>`;
}

function createTunerWidget(container, targetMidi, { label = "Tune this note", onMatch, onListening, autoStart = false, targetName, tolerance = 7, holdMs = 1000 } = {}) {
  let stopListening = null;
  let starting = false;
  let matched = false;
  let inTuneSince = null;
  let lastGood = 0; // last time a reading was within tolerance
  let lastOff = 0; // since when readings are clearly out of tune
  let lastHeard = 0;
  let name = targetName || tunerNoteName(targetMidi);
  const cx = 120, cy = 118;

  container.innerHTML = `
    <div class="hk-tuner" style="width:100%;max-width:360px">
      <div style="display:flex;justify-content:center"><button class="hk-btn jg-btn jg-btn-primary hk-tuner-toggle" type="button">${label}</button></div>
      <div class="hk-tuner-display" style="display:none;flex-direction:column;align-items:center">
        <div class="hk-tuner-target">Play <strong></strong></div>
        ${meterSvg(tolerance)}
        <div class="hk-tuner-status" aria-live="polite" style="font:800 1.35rem/1.2 system-ui,-apple-system,sans-serif;margin:2px 0;min-height:1.6rem;text-align:center"></div>
        <p class="hk-tuner-heard" style="margin:0;min-height:1.2em">&nbsp;</p>
        <p class="hk-tuner-readout">Listening...</p>
      </div>
    </div>`;

  const root = container.querySelector(".hk-tuner");
  const toggleBtn = container.querySelector(".hk-tuner-toggle");
  const display = container.querySelector(".hk-tuner-display");
  const needle = container.querySelector(".hk-tuner-needle-g");
  const status = container.querySelector(".hk-tuner-status");
  const readout = container.querySelector(".hk-tuner-readout");
  const heard = container.querySelector(".hk-tuner-heard");
  const targetEl = container.querySelector(".hk-tuner-target strong");

  const setNeedle = (cents, color, opacity = 1) => {
    const c = Math.max(-METER_RANGE, Math.min(METER_RANGE, cents));
    needle.setAttribute("transform", `rotate(${((c / METER_RANGE) * METER_ANGLE).toFixed(1)} ${cx} ${cy})`);
    needle.style.opacity = String(opacity);
    needle.querySelector("line").setAttribute("stroke", color);
  };
  const setStatus = (html, color) => { status.innerHTML = html; status.style.color = color; };
  const setMatched = (on) => { matched = on; root.classList.toggle("hk-tuner-matched", on); };

  function resetState() {
    setMatched(false);
    inTuneSince = null;
    lastGood = 0;
    lastOff = 0;
    targetEl.textContent = name;
    setNeedle(0, "#3b2410", 0.35);
    setStatus("", "");
    heard.innerHTML = "&nbsp;";
    readout.textContent = `Listening - play the ${name} string.`;
  }

  function onResult(result) {
    // The step this tuner lived on was replaced (Next, Back, or leaving
    // the lesson) while it was still listening: release the mic.
    if (!container.isConnected) { stopNow(); return; }
    const now = nowMs();
    if (!result) {
      // A short gap (between frames, or while the reference tone plays)
      // doesn't break "held in tune"; a long one does.
      if (inTuneSince !== null && now - lastGood > 300) inTuneSince = null;
      if (now - lastHeard > 600) {
        needle.style.opacity = "0.35";
        if (micIgnored()) { heard.innerHTML = "&nbsp;"; readout.textContent = `🔊 That's the ${name} note. Now play your string to match it.`; }
        else if (!matched) readout.textContent = `Listening - play the ${name} string.`;
        if (!matched) setStatus("", "");
      }
      return;
    }
    lastHeard = now;
    const r = tunerReading(result.midi, targetMidi, tolerance);
    heard.textContent = `Hearing ${tunerNoteName(result.noteMidi)} · ${Math.abs(r.cents) <= 1 ? "spot on" : `${Math.min(999, Math.abs(r.cents))} cents ${r.cents < 0 ? "flat (too low)" : "sharp (too high)"}`}`;
    if (r.direction === "in") {
      lastGood = now;
      lastOff = 0;
      setNeedle(r.cents, "#2b8a4b");
      if (inTuneSince === null) inTuneSince = now;
      if (!matched && now - inTuneSince >= holdMs) {
        setMatched(true);
        if (onMatch) onMatch(result);
      }
      if (matched) {
        setStatus("In tune ✓", "#2b8a4b");
        readout.textContent = `The ${name} string is in tune (${result.freq.toFixed(1)} Hz).`;
      } else {
        setStatus("Hold it… ✓", "#2b8a4b");
        readout.textContent = "Right there - let it ring.";
      }
      return;
    }
    // Out of tolerance: a little past it (hysteresis) still counts as
    // "held" so the last few cents of a ringing string don't reset it.
    if (Math.abs(r.cents) > tolerance + 5) inTuneSince = null;
    if (!lastOff) lastOff = now;
    if (matched && now - lastOff > 700) setMatched(false);
    setNeedle(r.cents, "#c46a1f");
    if (matched) return;
    const up = r.direction === "flat";
    setStatus(up ? "↑ Tune up" : "↓ Tune down", "#b5532a");
    if (r.farOff) {
      readout.textContent = `That's ${tunerNoteName(result.noteMidi)}, a long way from ${name}. Check it's the right string; if it is, ${up ? "tighten" : "loosen"} the peg slowly.`;
    } else if (Math.abs(r.cents) > 25) {
      readout.textContent = up ? "Too low: tighten the string (turn the peg a little)." : "Too high: loosen the string a little, then come back up to it.";
    } else {
      readout.textContent = up ? "Nearly: tighten very slightly." : "Nearly: loosen very slightly.";
    }
  }

  async function start() {
    if (starting || stopListening) return; // a second tap while the microphone is opening
    starting = true;
    resetState();
    display.style.display = "flex";
    toggleBtn.textContent = "Stop listening";
    try {
      const stop = await startLivePitchDetection(onResult);
      if (!toggleBtn.isConnected || !display.isConnected) stop();
      else {
        stopListening = stop;
        if (onListening) onListening(true);
      }
    } catch (err) {
      display.style.display = "flex";
      readout.textContent = `The microphone didn't start: ${friendlyMicError(err)}.`;
      toggleBtn.textContent = label;
    }
    starting = false;
  }

  function stopNow() {
    if (stopListening) {
      stopListening();
      stopListening = null;
      if (onListening) onListening(false);
    }
  }

  function stop() {
    stopNow();
    display.style.display = "none";
    toggleBtn.textContent = label;
  }

  toggleBtn.addEventListener("click", () => {
    if (stopListening) stop();
    else start();
  });
  if (autoStart) start();

  return {
    start,
    stop,
    isListening: () => Boolean(stopListening) || starting,
    isMatched: () => matched,
    setTarget(midi, newName) {
      targetMidi = midi;
      name = newName || tunerNoteName(midi);
      resetState();
    },
    destroy() {
      stop();
      container.innerHTML = "";
    },
  };
}

export {
  detectPitchInFrame,
  analyzeFrame,
  createPitchTracker,
  tunerReading,
  tunerNoteName,
  openMicStream,
  releaseMicSession,
  friendlyMicError,
  startLivePitchDetection,
  ignoreMicFor,
  micIgnored,
  midiFromFreq,
  freqFromMidi,
  createTunerWidget,
};
