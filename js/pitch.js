// Monophonic pitch detection for the tuner and "Wait for me".
// Originally the normalised-autocorrelation detector from the Dawsons
// project (same author/org; see THIRD_PARTY_NOTICES.md). In 2026-10 the
// core was replaced with YIN (see detectPitchInFrame) because the old
// method made octave errors on real guitars. The live wrapper runs the
// detector on the microphone about 30 times a second.

const MIN_FREQ = 70; // below the low E string (82 Hz), even tuned down a step
const MAX_FREQ = 1200;
const YIN_THRESHOLD = 0.15; // first dip below this is the fundamental
const YIN_FALLBACK = 0.25; // otherwise accept the deepest dip if it's this clear
const MIN_RMS = 0.0025; // quiet phone mics (no auto gain) still pass a plucked string

function midiFromFreq(freq) {
  return 69 + 12 * Math.log2(freq / 440);
}

function freqFromMidi(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// One frame's fundamental frequency, or null if no confident pitch.
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
function detectPitchInFrame(frame, sampleRate) {
  const minLag = Math.max(2, Math.floor(sampleRate / MAX_FREQ));
  const maxLag = Math.ceil(sampleRate / MIN_FREQ);
  const W = Math.min(frame.length - maxLag - 2, Math.max(512, Math.round(sampleRate * 0.024)));
  if (W < 256) return null;

  let energy = 0;
  for (let i = 0; i < W + maxLag; i++) energy += frame[i] * frame[i];
  const rms = Math.sqrt(energy / (W + maxLag));
  if (rms < MIN_RMS) return null; // silence / noise floor

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
    if (cmnd[best] > YIN_FALLBACK) return null;
    tau = best;
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
  return sampleRate / t;
}

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
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* older Safari */ }
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
  try { if (navigator.audioSession) navigator.audioSession.type = "play-and-record"; } catch (e) { /* older Safari */ }
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

// Wraps getUserMedia + an AnalyserNode and calls `onPitch({freq, midi,
// noteMidi, cents})` about 30 times a second while listening, or
// `onPitch(null)` when no confident pitch is present. Readings are
// smoothed with a median of the last 5 frames (one stray octave or
// pick-noise frame can't flick the result). Returns `stop()`.
async function startLivePitchDetection(onPitch, { fftSize = 4096 } = {}) {
  const stream = await openMicStream();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Created after the permission prompt, i.e. outside the tap that started
  // this: WebKit can hand back a suspended context that only reads silence.
  if (audioCtx.state === "suspended") await audioCtx.resume().catch(() => {});
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = fftSize;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  let running = true;
  const recent = [];
  let misses = 0;

  function tick() {
    if (!running) return;
    analyser.getFloatTimeDomainData(buffer);
    const freq = detectPitchInFrame(buffer, audioCtx.sampleRate);
    if (freq) {
      misses = 0;
      recent.push(midiFromFreq(freq));
      if (recent.length > 5) recent.shift();
      const sorted = [...recent].sort((x, y) => x - y);
      const midi = sorted[Math.floor(sorted.length / 2)];
      const rounded = Math.round(midi);
      const cents = Math.round((midi - rounded) * 100);
      onPitch({ freq: freqFromMidi(midi), midi, noteMidi: rounded, cents });
    } else {
      if (++misses >= 2) recent.length = 0;
      onPitch(null);
    }
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

// --- Shared tuner-style "match this note" widget (item 41) ----------
//
// A real guitar-tuner-style UI (needle + flat/in-tune/sharp readout)
// built on the exact same startLivePitchDetection() used by Get Started
// calibration (item 29) and Practice's Ear Check (item 4/27) - not a
// second pitch-detection implementation. Both calibration.js and
// lessons-ui.js call this one function so there's a single place that
// owns "what does tuning feedback look like."
//
// Renders a small, self-contained widget into `container`:
//   [Tune this note button] -> on click: mic starts, needle + label
//   appear and update live as the user plays, button becomes "Stop".
// Calls onMatch() once when the target is heard in tune (not
// repeatedly), but keeps listening so the user can see the needle
// settle - they close it themselves via the Stop button.
//
// A tuner: the whole widget turns GREEN once the target note is heard
// steadily within `tolerance` cents for about a third of a second (so a
// passing blip can't trigger it). The needle shows flat/sharp, and the
// readout says whether to tighten or loosen. `onMatch` fires once on the
// first green. `autoStart` starts listening immediately (the caller's
// own button tap counts as the user gesture).
const NOTE_LABELS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function tunerNoteName(midi) {
  return `${NOTE_LABELS[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

function createTunerWidget(container, targetMidi, { label = "Tune this note", onMatch, autoStart = false, targetName, tolerance = 40 } = {}) {
  let stopListening = null;
  let matched = false;
  let inTuneSince = null;
  const HOLD_MS = 350;
  const RIGHT_KEY_CENTS = tolerance; // a guitar tuner passes ~8; "is this the right note" checks use 40
  const name = targetName || tunerNoteName(targetMidi);

  container.innerHTML = `
    <div class="hk-tuner">
      <button class="hk-btn jg-btn-primary hk-tuner-toggle" type="button">${label}</button>
      <div class="hk-tuner-display" style="display:none">
        <div class="hk-tuner-target">Play <strong>${name}</strong></div>
        <div class="hk-tuner-dial">
          <div class="hk-tuner-needle"></div>
          <div class="hk-tuner-center-mark"></div>
        </div>
        <div class="hk-tuner-scale"><span>flat</span><span>in tune</span><span>sharp</span></div>
        <p class="hk-tuner-heard">&nbsp;</p>
        <p class="hk-tuner-readout">Listening...</p>
      </div>
    </div>`;

  const root = container.querySelector(".hk-tuner");
  const toggleBtn = container.querySelector(".hk-tuner-toggle");
  const display = container.querySelector(".hk-tuner-display");
  const needle = container.querySelector(".hk-tuner-needle");
  const readout = container.querySelector(".hk-tuner-readout");
  const heard = container.querySelector(".hk-tuner-heard");

  let starting = false;
  async function start() {
    if (starting) return; // a second tap while the microphone is opening
    starting = true;
    matched = false;
    inTuneSince = null;
    root.classList.remove("hk-tuner-matched");
    display.style.display = "flex";
    toggleBtn.textContent = "Stop listening";
    readout.textContent = `Listening - play ${name} on your guitar.`;
    needle.style.transform = "translateX(-50%) rotate(0deg)";
    needle.className = "hk-tuner-needle";
    try {
      const stop = await startLivePitchDetection((result) => {
        // The step this tuner lived on was replaced (Next, Back, or
        // leaving the lesson) while it was still listening - release
        // the mic instead of keeping it open off-screen.
        if (!container.isConnected) {
          stopNow();
          return;
        }
        if (!result) {
          inTuneSince = null;
          if (!matched) {
            heard.innerHTML = "&nbsp;";
            readout.textContent = `Listening - play ${name} on your guitar.`;
          }
          return;
        }
        // A guitar string can't be an octave out of tune: a reading 1 or 2
        // octaves off (the mic catching an overtone) is the right string.
        let midiHeard = result.midi;
        const oct = Math.round((midiHeard - targetMidi) / 12);
        if (oct !== 0 && Math.abs(midiHeard - targetMidi - 12 * oct) < 1.5) midiHeard -= 12 * oct;
        result = { ...result, midi: midiHeard, noteMidi: Math.round(midiHeard), cents: Math.round((midiHeard - Math.round(midiHeard)) * 100) };
        const diffSemitones = result.midi - targetMidi;
        // Needle swings ±1 semitone (100 cents) either side, like a tuner.
        const clampedCents = Math.max(-100, Math.min(100, diffSemitones * 100));
        needle.style.transform = `translateX(-50%) rotate(${(clampedCents / 100) * 45}deg)`;
        heard.textContent = `Hearing: ${tunerNoteName(result.noteMidi)}`;

        const rightKey = result.noteMidi === targetMidi && Math.abs(result.cents) < RIGHT_KEY_CENTS;
        const keysAway = result.noteMidi - targetMidi;
        if (rightKey) {
          needle.className = "hk-tuner-needle hk-tuner-in-tune";
          if (inTuneSince === null) inTuneSince = performance.now();
          if (performance.now() - inTuneSince >= HOLD_MS && !matched) {
            matched = true;
            root.classList.add("hk-tuner-matched");
            readout.textContent = `✓ That's ${name}! (${result.freq.toFixed(1)} Hz)`;
            if (onMatch) onMatch(result);
          } else if (!matched) {
            readout.textContent = "That's it - hold it…";
          }
          return;
        }
        inTuneSince = null;
        if (matched) return; // stay green; the needle keeps moving for info
        needle.className = "hk-tuner-needle hk-tuner-off";
        if (Math.abs(keysAway) === 12 || Math.abs(keysAway) === 24) {
          readout.textContent = `Right note name, wrong octave (${Math.abs(keysAway) / 12} octave${Math.abs(keysAway) === 24 ? "s" : ""} too ${keysAway > 0 ? "high" : "low"}) - check you're playing the right string.`;
        } else if (keysAway !== 0) {
          const n = Math.abs(keysAway);
          readout.textContent = `${n} half-step${n === 1 ? "" : "s"} too ${keysAway > 0 ? "high - loosen the string a little" : "low - tighten the string a little"}.`;
        } else {
          readout.textContent = `Almost - a little ${result.cents > 0 ? "sharp: loosen very slightly" : "flat: tighten very slightly"}.`;
        }
      });
      if (!toggleBtn.isConnected || !display.isConnected) stop();
      else stopListening = stop;
    } catch (err) {
      readout.textContent = `The microphone didn't start: ${friendlyMicError(err)}.`;
      toggleBtn.textContent = label;
    }
    starting = false;
  }

  function stopNow() {
    if (stopListening) {
      stopListening();
      stopListening = null;
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
    stop,
    destroy() {
      stop();
      container.innerHTML = "";
    },
  };
}

export {
  detectPitchInFrame,
  openMicStream,
  releaseMicSession,
  friendlyMicError,
  startLivePitchDetection,
  midiFromFreq,
  freqFromMidi,
  createTunerWidget,
};
