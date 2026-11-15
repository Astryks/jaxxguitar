// One place every "a note was played" signal flows through, so wait mode
// and the daily review listen to all input sources the same way:
//   - tapping the on-screen fretboard (fretboard.js)
//   - the microphone, for single notes (monophonic pitch tracking - it
//     can't reliably pick out six strings of a chord at once)
//   - a MIDI guitar/controller (Web MIDI - Chromium browsers only)
// Listeners get (midi, source).

import { startLivePitchDetection } from "./pitch.js";

const listeners = new Set();

function onNoteOn(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emitNoteOn(midi, source = "screen") {
  listeners.forEach((cb) => {
    try {
      cb(midi, source);
    } catch (e) {
      console.error(e);
    }
  });
}

// --- Web MIDI ------------------------------------------------------------
let midiAccess = null;
let midiStatus = "off"; // off | unsupported | denied | ready
const midiStatusListeners = new Set();

function midiSupported() {
  return typeof navigator !== "undefined" && typeof navigator.requestMIDIAccess === "function";
}

function attachInput(input) {
  input.onmidimessage = (msg) => {
    const [status, note, velocity] = msg.data;
    const kind = status & 0xf0;
    if (kind === 0x90 && velocity > 0) emitNoteOn(note, "midi");
  };
}

function connectedMidiNames() {
  if (!midiAccess) return [];
  return [...midiAccess.inputs.values()].filter((i) => i.state === "connected").map((i) => i.name || "MIDI keyboard");
}

async function enableMidi() {
  if (!midiSupported()) {
    midiStatus = "unsupported";
    midiStatusListeners.forEach((cb) => cb(midiStatus));
    return midiStatus;
  }
  if (midiAccess) return midiStatus;
  try {
    midiAccess = await navigator.requestMIDIAccess();
    midiAccess.inputs.forEach(attachInput);
    midiAccess.onstatechange = (e) => {
      if (e.port.type === "input" && e.port.state === "connected") attachInput(e.port);
      midiStatusListeners.forEach((cb) => cb(midiStatus));
    };
    midiStatus = "ready";
  } catch (e) {
    midiStatus = "denied";
  }
  midiStatusListeners.forEach((cb) => cb(midiStatus));
  return midiStatus;
}

function onMidiStatus(cb) {
  midiStatusListeners.add(cb);
  return () => midiStatusListeners.delete(cb);
}

// --- Microphone (single notes) --------------------------------------------
// The live reading (pitch.js: noise gate + median of recent frames) is
// already steady, so a note counts once the same note is read on 3
// frames in a row (~0.1 s). It can't fire again while that note keeps
// ringing (or drops out for a frame or two), but a fresh pluck of the
// same note (the tracker's `onset`: the sound got suddenly louder) or a
// gap re-arms it, so playing the same note twice counts twice. No "within N cents" check: a slightly
// out-of-tune guitar still plays the right note.
// Pure (no microphone) so node can test it: feed it tracker readings.
function createMicNoteGate(emit, { frames: need = 3 } = {}) {
  let candidate = null;
  let frames = 0;
  let lastEmitted = null;
  let gap = 0;
  return (r) => {
    if (!r) {
      candidate = null;
      frames = 0;
      // A real gap (~0.15 s of nothing) ends the note; one dropped frame
      // in a ringing note doesn't.
      if (++gap >= 4) lastEmitted = null;
      return;
    }
    gap = 0;
    if (r.onset) lastEmitted = null;
    if (r.noteMidi === candidate) frames++;
    else {
      candidate = r.noteMidi;
      frames = 1;
    }
    if (frames >= need && candidate !== lastEmitted) {
      lastEmitted = candidate;
      emit(candidate);
    }
  };
}

let stopMic = null;
async function enableMic() {
  if (stopMic) return true;
  try {
    stopMic = await startLivePitchDetection(createMicNoteGate((midi) => emitNoteOn(midi, "mic")));
    return true;
  } catch (e) {
    stopMic = null;
    throw e;
  }
}

function disableMic() {
  if (stopMic) stopMic();
  stopMic = null;
}

function micOn() {
  return Boolean(stopMic);
}

export {
  onNoteOn,
  emitNoteOn,
  midiSupported,
  enableMidi,
  onMidiStatus,
  connectedMidiNames,
  enableMic,
  disableMic,
  micOn,
  createMicNoteGate,
};
