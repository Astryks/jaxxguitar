// Tuner accuracy test: synthesized guitar-like notes through the exact
// functions the live tuner uses (createPitchTracker + tunerReading from
// js/pitch.js). Run: node scripts/test-tuner-pitch.mjs
//
// Each open string (E2 A2 D3 G3 B3 E4), in tune and at -30/-10/+10/+30
// cents, at 44.1 and 48 kHz, as a "phone mic" pluck: a weak fundamental,
// a 2nd harmonic stronger than it (the case that gives octave errors),
// more overtones, a decaying envelope, slight inharmonicity and noise.
// Frames of 4096 samples every 33 ms (as the live analyser) go through
// the tracker. Checks:
//   1. the reading names the right string (no octave errors before
//      folding, so "Use my guitar" gets the right note too),
//   2. while the string rings (first 1.4 s) tunerReading's cents are
//      within 3 cents of the true detune (98% of frames), no reading at
//      all (even in the dying tail) is more than 12 cents off, and
//      flat/sharp always points the right way,
//   3. a string 30 cents off is never called "in tune",
//   4. room noise alone gives (almost) no readings (noise gate).
//   5. lesson cards' "Use my guitar" (input-hub's onNoteOn): one pluck
//      is one note-on with the right note, the same note plucked again
//      while still ringing counts again, and a strummed chord is reported.
const { createPitchTracker, tunerReading } = await import(new URL("../js/pitch.js", import.meta.url));
const { createMicNoteGate } = await import(new URL("../js/input-hub.js", import.meta.url));

const STRINGS = [["low E", 40], ["A", 45], ["D", 50], ["G", 55], ["B", 59], ["high e", 64]];
const OPEN = STRINGS.map(([, m]) => m);
const DETUNES = [0, -10, 10, -30, 30];
const FRAME = 4096;
const TOL = 7; // the Tuner tab's in-tune window (cents)

let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;
const f0 = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// 0.3 s of room noise, then the pluck (the tuner hears the room first).
const LEAD = 0.3;
function pluck(freq, sr, { seconds = 2.4, fund = 0.3, noise = 0.006 } = {}) {
  const lead = Math.floor(sr * LEAD);
  const n = Math.floor(sr * seconds);
  const out = new Float32Array(n + lead);
  for (let i = 0; i < lead; i++) out[i] = noise * rnd();
  //            1     2    3     4     5     6     7     8
  const amps = [fund, 1.0, 0.55, 0.45, 0.28, 0.2, 0.12, 0.08];
  const phases = amps.map(() => (rnd() + 1) * Math.PI);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let v = 0;
    for (let k = 0; k < amps.length; k++) {
      const h = k + 1;
      const f = freq * h * Math.sqrt(1 + 0.00003 * h * h); // string stiffness
      if (f < sr / 2) v += amps[k] * Math.exp(-t * (0.9 + 0.5 * h)) * Math.sin(2 * Math.PI * f * t + phases[k]);
    }
    out[i + lead] = 0.35 * v * Math.min(1, t / 0.005) + noise * rnd();
  }
  return out;
}

let failures = 0;
const fail = (msg) => { failures++; console.log("  FAIL " + msg); };
const nearestString = (midi) => {
  let best = 0;
  OPEN.forEach((m, i) => { if (Math.abs(midi - m) < Math.abs(midi - OPEN[best])) best = i; });
  return best;
};

let frames = 0, rightString = 0, centsOk = 0, dirOk = 0, dirN = 0, falseInTune = 0;
for (const sr of [44100, 48000]) {
  const hop = Math.round(sr * 0.033);
  for (const [si, [name, midi]] of STRINGS.entries()) {
    for (const det of DETUNES) {
      for (const fund of [0.3, 0.08]) {
        const sig = pluck(f0(midi) * Math.pow(2, det / 1200), sr, { fund });
        const tracker = createPitchTracker();
        let str = 0, ok = 0, worst = 0, readings = 0, early = 0, earlyN = 0, ring = 0, ringOk = 0;
        for (let start = 0; start + FRAME <= sig.length; start += hop) {
          const r = tracker.push(sig.subarray(start, start + FRAME), sr);
          const t = (start + FRAME) / sr - LEAD; // time since the pluck, at the frame's end
          // While it's clearly ringing (first second) there must be a
          // reading nearly every frame; later, as it dies into the noise,
          // no reading is fine but any reading must still be right.
          if (t >= 0.12 && t <= 1.0) { earlyN++; if (r) early++; }
          if (!r) continue;
          readings++;
          if (nearestString(r.midi) === si && Math.abs(r.midi - midi) < 1) str++;
          const tr = tunerReading(r.midi, midi, TOL);
          const err = Math.abs(tr.cents - det);
          worst = Math.max(worst, err);
          if (err <= 3) ok++;
          if (t <= 1.4) { ring++; if (err <= 3) ringOk++; }
          if (err > 3 && process.env.DEBUG) console.log(`    ${sr} ${name} ${det}c fund=${fund}: t=${t.toFixed(2)}s err ${err}c rms ${r.rms.toFixed(4)} clarity ${r.clarity.toFixed(3)}`);
          if (det !== 0) { dirN++; if ((det < 0 && tr.cents < 0) || (det > 0 && tr.cents > 0)) dirOk++; }
          if (Math.abs(det) === 30 && tr.direction === "in") falseInTune++;
        }
        frames += readings; rightString += str; centsOk += ok;
        const label = `${sr} ${name.padEnd(6)} ${String(det).padStart(3)}c fund=${fund}`;
        const line = `${label}: readings in 1st second ${early}/${earlyN}; while ringing (<1.4 s) ${ringOk}/${ring} within 3c; all ${readings} readings: right string ${str}, worst ${worst}c`;
        if (early < 0.9 * earlyN) fail(`${line} (too few readings)`);
        else if (str < readings) fail(`${line} (wrong string / octave)`);
        else if (ringOk < 0.98 * ring) fail(`${line} (cents off while ringing)`);
        else if (worst > 12) fail(`${line} (a reading more than 12 cents off)`);
        else console.log("  ok   " + line);
      }
    }
  }
}

// Noise gate: half a second of quiet room noise, then a louder burst.
{
  const sr = 48000, hop = 1584;
  const tracker = createPitchTracker();
  let readings = 0, n = 0;
  for (const amp of [0.004, 0.004, 0.02]) {
    const noise = Float32Array.from({ length: sr }, () => amp * rnd());
    for (let s = 0; s + FRAME <= noise.length; s += hop) { n++; if (tracker.push(noise.subarray(s, s + FRAME), sr)) readings++; }
  }
  const line = `noise only: ${readings}/${n} frames gave a reading`;
  if (readings > n * 0.03) fail(line); else console.log("  ok   " + line);
}

// Lesson cards: input-hub's note-on gate fed by the same tracker.
function noteOns(sig, sr) {
  const tracker = createPitchTracker();
  const got = [];
  const gate = createMicNoteGate((m) => got.push(m));
  const hop = Math.round(sr * 0.033);
  for (let s = 0; s + FRAME <= sig.length; s += hop) gate(tracker.push(sig.subarray(s, s + FRAME), sr));
  return got;
}
const mix = (...parts) => {
  const out = new Float32Array(Math.max(...parts.map(([sig, at]) => sig.length + at)));
  parts.forEach(([sig, at]) => sig.forEach((v, i) => { out[i + at] += v; }));
  return out;
};
{
  const sr = 48000;
  const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const nm = (ms) => ms.map((m) => NAMES[m % 12] + (Math.floor(m / 12) - 1)).join(" ") || "nothing";
  for (const [label, midi] of [["low E open", 40], ["A string fret 2 (B2)", 47], ["G string fret 2 (A3)", 57], ["high e fret 3 (G4)", 67]]) {
    const ons = noteOns(pluck(f0(midi) * Math.pow(2, 15 / 1200), sr), sr); // 15 cents sharp
    const line = `note-on, one pluck of ${label}: heard ${nm(ons)}`;
    if (ons.length !== 1 || ons[0] % 12 !== midi % 12) fail(line); else console.log("  ok   " + line);
  }
  {
    const one = pluck(f0(45), sr, { seconds: 1.6, noise: 0 });
    const ons = noteOns(mix([one, 0], [one.map((v) => v * 1.4), Math.floor(sr * 0.8)], [Float32Array.from({ length: sr * 3 }, () => 0.006 * rnd()), 0]), sr);
    const line = `note-on, A plucked twice (2nd while the 1st still rings): heard ${nm(ons)}`;
    if (ons.length !== 2 || ons.some((m) => m % 12 !== 45 % 12)) fail(line); else console.log("  ok   " + line);
  }
  {
    // A loud knock / scrape with no pitch, then a pluck: the knock must
    // not raise the noise gate and hide the note.
    const knock = Float32Array.from({ length: Math.floor(sr * 0.4) }, () => 0.25 * rnd());
    const ons = noteOns(mix([knock, 0], [pluck(f0(50), sr, { noise: 0 }), Math.floor(sr * 0.5)], [Float32Array.from({ length: sr * 3 }, () => 0.006 * rnd()), 0]), sr);
    const line = `note-on after a loud unpitched knock, D string: heard ${nm(ons)}`;
    if (ons.length !== 1 || ons[0] % 12 !== 50 % 12) fail(line); else console.log("  ok   " + line);
  }
  {
    // E major strummed: E2 B2 E3 G#3 B3 E4, 15 ms apart (no single pitch:
    // informational, not a pass/fail).
    const ch = [40, 47, 52, 56, 59, 64].map((m, k) => [pluck(f0(m), sr, { seconds: 2, noise: 0, fund: 0.5 }).map((v) => v * 0.5), Math.floor(sr * (0.3 + k * 0.015))]);
    const ons = noteOns(mix(...ch, [Float32Array.from({ length: sr * 3 }, () => 0.006 * rnd()), 0]), sr);
    console.log(`  info strummed E major chord: note-ons ${nm(ons)} (chords are polyphonic; the tracker reads one pitch at best)`);
  }
}

console.log(`\nTOTAL ${frames} judged frames: right string ${((100 * rightString) / frames).toFixed(1)}%, cents within 3: ${((100 * centsOk) / frames).toFixed(1)}%, flat/sharp right: ${dirOk}/${dirN}, 30-cent-off strings called in tune: ${falseInTune}`);
if (dirOk !== dirN) fail("flat/sharp direction wrong on some frames");
if (falseInTune) fail("a string 30 cents off was called in tune");
console.log(failures ? `${failures} FAILED` : "ALL PASSED");
process.exit(failures ? 1 : 0);
