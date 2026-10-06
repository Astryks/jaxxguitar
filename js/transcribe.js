// Shared "upload your own recording → notes" pipeline — used by both
// the Practice tab and the Discover tab's upload entry point, so there
// is exactly one real implementation, not two parallel copies.
//
// Item 44: renderTranscribedPlayback() below replaces the old bare
// "Play it + one highlighted key" view in both callers with the same
// falling-notes highway the curated lesson/song-mastery flow uses
// (note-highway.js), plus a real speed control — not a second
// visualizer built just for uploads.

import { getAudioContext } from "./guitar-audio.js";



// Item 44: a short cleanup pass on basic-pitch's raw note output.
//
// Item 56, re-tuned after testing against recordings with KNOWN notes
// (a melody, a chord progression, and both together). basic-pitch's
// pitches and onsets were right for every real note (within ~10ms) —
// the problems were all in this cleanup step:
//  - It merged any same-pitch notes that touched. But two presses of
//    the same key always touch, so "E E F G G" came back as one long E
//    and one long G. Same-pitch fragments are now only joined when the
//    later one is a tiny sliver (a pitch wobble), never a full note.
//  - Faint overtones came through as notes: a quiet copy an octave,
//    a 12th, two octaves or a 17th above a louder note starting at the
//    same moment (the piano's own harmonics). Those are dropped when
//    they're well under half as loud as the note they shadow — a real
//    played octave is about as loud as its partner, so it stays.
//  - Very short, quiet blips (under ~0.12s and quiet) are dropped.
const OVERTONE_INTERVALS = new Set([12, 19, 24, 28]);
function cleanupNotes(rawNotes) {
  const MIN_DURATION_SEC = 0.06;
  const SLIVER_SEC = 0.08;
  const MERGE_GAP_SEC = 0.03;
  const sorted = [...rawNotes].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
  const amp = (n) => n.amplitude ?? 0.5;

  // 1. Re-join pitch-wobble slivers onto the note they broke off from.
  const lastByPitch = new Map();
  const joined = [];
  for (const note of sorted) {
    const prev = lastByPitch.get(note.pitchMidi);
    const gap = prev ? note.startTimeSeconds - (prev.startTimeSeconds + prev.durationSeconds) : Infinity;
    if (prev && gap <= MERGE_GAP_SEC && note.durationSeconds < SLIVER_SEC) {
      prev.durationSeconds = Math.max(prev.durationSeconds, note.startTimeSeconds + note.durationSeconds - prev.startTimeSeconds);
      continue;
    }
    const copy = { ...note };
    joined.push(copy);
    lastByPitch.set(copy.pitchMidi, copy);
  }

  // 2. Drop overtones of a louder note that starts at (about) the same time.
  const withoutOvertones = joined.filter((n) =>
    !joined.some((other) =>
      other !== n &&
      OVERTONE_INTERVALS.has(n.pitchMidi - other.pitchMidi) &&
      Math.abs(other.startTimeSeconds - n.startTimeSeconds) <= 0.06 &&
      amp(n) < 0.6 * amp(other)
    )
  );

  // 3. Drop short, quiet blips and anything too short to be a played note.
  return withoutOvertones.filter((n) =>
    n.durationSeconds >= MIN_DURATION_SEC && !(n.durationSeconds < 0.12 && amp(n) < 0.45)
  );
}

// basic-pitch requires mono audio at exactly 22050 Hz. decodeAudioData
// gives back whatever sample rate the source file/container actually
// used (commonly 44100/48000 Hz, and stereo) — e.g. a real bug caught
// in testing: uploading a real mp4 decoded fine (decodeAudioData
// already pulls the audio track out of a video container on its own)
// but then failed inside basic-pitch with "Input audio buffer is not
// at correct sample rate! Is 48000. Should be 22050." This resamples
// AND downmixes to mono via an OfflineAudioContext rendered at the
// target rate — a standard technique, no new dependency. Connecting a
// multi-channel source to a 1-channel destination downmixes
// automatically per the Web Audio spec's channel-interpretation rules
// (equal-power sum of channels), which is the normal mono-summing
// approach.
async function resampleToMono22050(audioBuffer) {
  const targetRate = 22050;
  if (audioBuffer.sampleRate === targetRate && audioBuffer.numberOfChannels === 1) {
    return audioBuffer; // already in the right format, nothing to do
  }
  const length = Math.ceil(audioBuffer.duration * targetRate);
  const offlineCtx = new OfflineAudioContext(1, length, targetRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  return offlineCtx.startRendering();
}


// Transcribes a user-provided audio/video File to a note list using the
// locally-vendored basic-pitch (no CDN). `onStatus(text)` is called with
// human-readable progress messages throughout — callers render it
// however fits their UI. Returns the note array, or throws with a
// message already distinguishing decode/model-load/transcription
// failures (callers should catch and display `err.message` as-is).
// Reads a File into an ArrayBuffer (File.arrayBuffer is missing on
// older iOS; FileReader works everywhere).
function readFileBuffer(file) {
  if (file.arrayBuffer) return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error("couldn't read the file"));
    r.readAsArrayBuffer(file);
  });
}

// decodeAudioData, in the callback form older WebKit needs as well as
// the promise form.
function decodeWith(ctx, buf) {
  return new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(buf, resolve, (e) => reject(e || new Error("unsupported format")));
    if (p && p.then) p.then(resolve, reject);
  });
}

// Last resort for files the decoder can't open directly (common on
// iPhone for videos from the photo library: Safari plays them fine but
// decodeAudioData rejects the container). Plays the file silently
// through a media element and records the audio as it plays — so it
// takes as long as the clip itself.
function captureViaMediaElement(file, ctx, onStatus) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement(file.type.startsWith("video") ? "video" : "audio");
    el.src = url;
    el.playsInline = true;
    el.setAttribute("playsinline", "");
    el.preload = "auto";
    const chunks = [];
    let node = null;
    let src = null;
    const cleanup = () => {
      try { node && node.disconnect(); src && src.disconnect(); } catch (e) { /* ignore */ }
      el.pause();
      URL.revokeObjectURL(url);
    };
    el.onerror = () => { cleanup(); reject(new Error("this file type can't be played here")); };
    el.onloadedmetadata = async () => {
      try {
        src = ctx.createMediaElementSource(el);
        node = ctx.createScriptProcessor(4096, 1, 1);
        const mute = ctx.createGain();
        mute.gain.value = 0; // record it without playing it out loud
        node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
        src.connect(node);
        node.connect(mute).connect(ctx.destination);
        const total = el.duration;
        const tick = setInterval(() => onStatus(`Listening to your file… ${Math.round(el.currentTime)}s of ${Math.round(total)}s`), 500);
        el.onended = () => {
          clearInterval(tick);
          cleanup();
          const len = chunks.reduce((a, c) => a + c.length, 0);
          if (!len) return reject(new Error("no audio was heard in this file"));
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const out = buf.getChannelData(0);
          let o = 0;
          chunks.forEach((c) => { out.set(c, o); o += c.length; });
          resolve(buf);
        };
        await ctx.resume?.();
        await el.play();
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
  });
}

async function transcribeFile(file, onStatus = () => {}) {
  let audioBuffer;
  const audioCtx = getAudioContext();
  try {
    onStatus("Decoding audio...");
    let decoded;
    try {
      decoded = await decodeWith(audioCtx, await readFileBuffer(file));
    } catch (firstErr) {
      onStatus("This file needs to be played through once to read its audio — listening now (it stays silent)...");
      decoded = await captureViaMediaElement(file, audioCtx, onStatus);
    }
    onStatus(`Resampling from ${decoded.sampleRate} Hz / ${decoded.numberOfChannels}ch to 22050 Hz mono...`);
    audioBuffer = await resampleToMono22050(decoded);
  } catch (err) {
    throw new Error(`Couldn't read the audio in this file (${err && err.message ? err.message : "unsupported format"}). Try an mp3, m4a or wav file, or a video saved to Files.`);
  }

  // basic-pitch (code + model weights) is vendored locally in
  // js/vendor/basic-pitch/ — no runtime CDN dependency. See
  // THIRD_PARTY_NOTICES.md for exact version/provenance. A failure here
  // means a genuinely different problem than "no internet" (nothing is
  // fetched remotely anymore) — most likely the browser lacking
  // WebGL/WASM support that TensorFlow.js needs.
  let BasicPitch, outputToNotesPoly, addPitchBendsToNoteEvents, noteFramesToTime, basicPitch;
  try {
    onStatus("Loading transcription model (vendored locally, no network needed)...");
    ({ BasicPitch, outputToNotesPoly, addPitchBendsToNoteEvents, noteFramesToTime } =
      await import("./vendor/basic-pitch/basic-pitch.bundle.js"));
    basicPitch = new BasicPitch(new URL("./vendor/basic-pitch/model/model.json", import.meta.url).href);
  } catch (err) {
    throw new Error(`Couldn't load the local transcription model (${err.message}). This usually means your browser lacks WebGL/WASM support for TensorFlow.js.`);
  }

  try {
    const frames = [];
    const onsets = [];
    const contours = [];
    onStatus("Transcribing in your browser (this can take a while for longer clips)...");
    await basicPitch.evaluateModel(
      audioBuffer,
      (f, o, c) => {
        frames.push(...f);
        onsets.push(...o);
        contours.push(...c);
      },
      (progress) => onStatus(`Transcribing... ${Math.round(progress * 100)}%`)
    );
    // Item 44: this used to call outputToNotesPoly with onsetThresh/
    // frameThresh loosened to 0.25/0.25 — the library's own real
    // defaults, visible in its source, are 0.5/0.3. That's a real cause
    // of the reported "6233 notes for one song" explosion: a much more
    // sensitive-than-default detector picks up far more noise/harmonic
    // blips as if they were genuine note onsets. Using the library's
    // own defaults instead, plus a short post-filter pass below,
    // meaningfully cuts that down without a different model/algorithm.
    const rawNotes = noteFramesToTime(
      addPitchBendsToNoteEvents(contours, outputToNotesPoly(frames, onsets))
    );
    const notes = cleanupNotes(rawNotes);
    console.log(`Jaxx Guitar: basic-pitch transcription result — ${rawNotes.length} raw notes, ${notes.length} after cleanup`, notes);
    return notes;
  } catch (err) {
    throw new Error(`Transcription failed: ${err.message}.`);
  }
}

// Item 57: "Easy mode" = the song's CHORDS, as simple shapes you can
// actually play. (Item 56's version only thinned the raw notes out,
// which still left awkward 4-note clusters spread over the keyboard.)
// For each time window, every detected note adds its overlap time to
// its pitch class (bass notes count extra — they usually spell the
// root); each of the 24 major/minor triads is scored by how much of
// that weight its 3 notes cover minus a penalty for weight outside it,
// with a small bonus when the bass note is the chord's root. The
// winner is drawn as a beginner shape: left hand = the root below
// Middle C, right hand = the root-position triad in the octave around
// Middle C. Back-to-back windows with the same chord merge into one
// held block. A best guess from the recording — labelled as such.
// Spellings as most chord charts write them (Eb/Ab/Bb majors, C#m/F#m/G#m minors).
const MAJOR_NAMES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const MINOR_NAMES = ["Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "Bbm", "Bm"];
function chordName(pc, minor) {
  return (minor ? MINOR_NAMES : MAJOR_NAMES)[pc];
}

// `keyProfile` = the whole song's pitch-class weights (0-1). When a
// moment only has a root and fifth (no third — common in bass + power
// chords), major and minor tie; the song's own key decides which third
// it most likely is, instead of always picking major (which put
// non-key chords like Ab major into a B-major song).
function recognizeChord(weights, bassPc, keyProfile) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total < 0.05) return null;
  let best = null;
  for (let root = 0; root < 12; root++) {
    for (const minor of [false, true]) {
      const pcs = [root, (root + (minor ? 3 : 4)) % 12, (root + 7) % 12];
      const inside = pcs.reduce((a, pc) => a + weights[pc], 0);
      const third = (root + (minor ? 3 : 4)) % 12;
      let score = inside - 0.5 * (total - inside) + (bassPc === root ? 0.15 * total : 0);
      if (keyProfile) score += 0.1 * total * keyProfile[third];
      // The chord must actually contain its root and third or fifth.
      if (weights[root] < 0.05 * total) score -= total;
      if (!best || score > best.score) best = { root, minor, score };
    }
  }
  return best;
}

function simplifyToChords(highwayNotes, { windowSec = 1, offsetSec = 0 } = {}) {
  if (!highwayNotes.length) return [];
  const end = Math.max(...highwayNotes.map((n) => n.time + n.duration));
  const keyProfile = new Array(12).fill(0);
  highwayNotes.forEach((n) => { keyProfile[n.midi % 12] += n.duration; });
  const maxPc = Math.max(...keyProfile) || 1;
  for (let i = 0; i < 12; i++) keyProfile[i] /= maxPc;
  const blocks = [];
  for (let t = Math.max(0, offsetSec % windowSec); t < end; t += windowSec) {
    const w = new Array(12).fill(0);
    let bass = null;
    highwayNotes.forEach((n) => {
      const ov = Math.min(t + windowSec, n.time + n.duration) - Math.max(t, n.time);
      if (ov <= 0) return;
      w[n.midi % 12] += ov * (n.midi < 52 ? 1.5 : 1);
      if (n.midi < 55 && (!bass || n.midi < bass.midi || (n.midi === bass.midi && ov > bass.ov))) bass = { midi: n.midi, ov };
    });
    const chord = recognizeChord(w, bass ? bass.midi % 12 : null, keyProfile);
    const prev = blocks[blocks.length - 1];
    if (!chord) continue;
    if (prev && prev.root === chord.root && prev.minor === chord.minor && Math.abs(prev.end - t) < 1e-6) {
      prev.end = t + windowSec;
      continue;
    }
    blocks.push({ root: chord.root, minor: chord.minor, start: t, end: t + windowSec });
  }
  const out = [];
  blocks.forEach((b) => {
    const label = chordName(b.root, b.minor);
    let rh = 60 + b.root;
    if (rh > 66) rh -= 12; // keep the right hand's root within F#3..F#4, around Middle C
    const triad = [rh, rh + (b.minor ? 3 : 4), rh + 7];
    const duration = Math.max(0.2, b.end - b.start - 0.05);
    out.push({ midi: rh - 12, time: b.start, duration, hand: "left", chord: label });
    triad.forEach((midi) => out.push({ midi, time: b.start, duration, hand: "right", chord: label }));
  });
  return out;
}

// Item 56: a beat for uploaded songs (which come with no tempo data).
// Estimates the beat from the detected note onsets: autocorrelate an
// onset-strength signal (10ms bins) over 60-180 BPM, gently preferring
// the 80-140 BPM range most songs sit in (so it doesn't lock onto half
// or double time as easily), then pick the phase that lines up with the
// most onsets. Returns null when there's too little to go on. An
// estimate, labelled as one in the UI — not real drum transcription.
function estimateBeat(notes) {
  if (notes.length < 8) return null;
  const BIN = 0.01;
  const end = Math.max(...notes.map((n) => n.time));
  const env = new Float32Array(Math.ceil(end / BIN) + 2);
  notes.forEach((n) => { env[Math.round(n.time / BIN)] += 1; });
  let best = null;
  for (let lag = Math.round(60 / 180 / BIN); lag <= Math.round(60 / 60 / BIN); lag++) {
    let score = 0;
    for (let i = 0; i + lag < env.length; i++) {
      if (!env[i]) continue;
      // ±1 bin tolerance for slightly uneven playing
      score += env[i] * (env[i + lag] + 0.5 * ((env[i + lag - 1] || 0) + (env[i + lag + 1] || 0)));
      // Also credit onsets two beats later, so a song whose chords only
      // change every other beat (or every bar) still finds its beat.
      score += 0.5 * env[i] * (env[i + 2 * lag] || 0);
    }
    const bpm = 60 / (lag * BIN);
    score *= Math.exp(-Math.pow(Math.log2(bpm / 110), 2) / (2 * 0.6 * 0.6));
    if (!best || score > best.score) best = { lag, score };
  }
  if (!best || best.score <= 0) return null;
  let bestOffset = 0;
  let bestHits = -1;
  for (let off = 0; off < best.lag; off++) {
    let hits = 0;
    for (let i = off; i < env.length; i += best.lag) hits += env[i] + 0.5 * ((env[i - 1] || 0) + (env[i + 1] || 0));
    if (hits > bestHits) { bestHits = hits; bestOffset = off; }
  }
  return { beatSec: best.lag * BIN, offsetSec: bestOffset * BIN, bpm: Math.round(60 / (best.lag * BIN)) };
}

function formatClock(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export { transcribeFile, estimateBeat, simplifyToChords };
