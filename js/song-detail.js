// A library song bar by bar (song-detail-data.js, built by
// scripts/build-song-detail.mjs): the chords with the beat each one lands
// on, each section's strum, the tempo (and where it changes), the time
// signature, tuning and capo, and for public-domain pieces the tune.
//
//   songDetail(song)          -> the chart, or null (8 songs keep the older map)
//   detailPlan(song, d)       -> capo and shapes for the song page (song-plan.js)
//   wholeSongItems(d, opts)   -> practice timeline for "Whole song"
//   tuneItems(d, opts)        -> practice timeline for "The tune"
//
// Timeline times are in "reference beats": quarter notes at the song's main
// tempo (d.qb), so a section with its own tempo simply takes more or fewer
// of them. Each item also carries `where` ("Chorus · bar 3 of 8"), `count`
// ("1", "&", "e"...), `barBeats` (its bar's length) for the play-along view.

import { SONG_DETAIL, CHORD_ALIAS } from "./song-detail-data.js";
import { songPlan, planFor, tuningOffset } from "./song-plan.js";
import { chordShape, transposeSymbol } from "./guitar-theory.js";
import { placeMelody } from "./fret-map.js";

const cache = new Map();
const EPS = 1e-6;

function songDetail(song) {
  if (!song) return null;
  const id = `${song.title}|${song.artist}`;
  if (cache.has(id)) return cache.get(id);
  const raw = SONG_DETAIL[id];
  let d = null;
  if (raw) {
    const [num, den] = raw.ts.split("/").map(Number);
    const barQ = (num * 4) / den;
    const bars = raw.b.map((s) => s.split("|").map((bar) => bar.split(" ").map((tok) => {
      const k = tok.lastIndexOf(":");
      return { chord: tok.slice(0, k), q: Number(tok.slice(k + 1)) * raw.u };
    })));
    const strums = raw.st.map(([slotQ, pats, label, kind]) => ({ slotQ, bars: pats ? pats.split(",") : [], label, kind: kind || "strum" }));
    const sections = raw.sec.map(([name, bi, si, qb]) => ({ name, bars: bars[bi], strum: strums[si], qb: qb || raw.qb }));
    d = {
      id, verified: raw.v === 1, key: raw.key, tuning: raw.tun || "standard", chartCapo: raw.cc || 0,
      ts: raw.ts, num, den, barQ, unitQ: raw.u, bpm: raw.bpm, bpmUnit: raw.bu || "", qb: raw.qb,
      sections, melody: raw.mel || null, sources: raw.src || [],
      tempoChanges: sections.some((s) => Math.abs(s.qb - raw.qb) > EPS),
      totalBars: sections.reduce((n, s) => n + s.bars.length, 0),
    };
  }
  cache.set(id, d);
  return d;
}

const playName = (c) => CHORD_ALIAS[c] || c;
const isRest = (c) => c === "N.C.";
// Every chord in the chart, in order of first appearance.
function detailChords(d) {
  const out = [];
  d.sections.forEach((s) => s.bars.forEach((bar) => bar.forEach(({ chord }) => { if (!isRest(chord) && !out.includes(chord)) out.push(chord); })));
  return out;
}

// The capo and shapes the song page uses: the library's own plan
// (song-plan.js), in the chart's tuning when that differs.
function detailPlan(song, d) {
  const down = tuningOffset({ tuning: d.tuning });
  const plan = tuningOffset(song) === down ? songPlan(song) : planFor(song.chords, down);
  return { ...plan, down };
}

// "1", "&", "e", "a" under each strum. Compound meters counted in eighths
// ("1 2 3 4 5 6"), the rest in the bar's own beat.
function countLabel(d, posQ) {
  const unit = d.den === 8 ? 0.5 : d.unitQ === 1.5 ? 0.5 : d.unitQ;
  const x = posQ / unit;
  const whole = Math.floor(x + EPS);
  const frac = x - whole;
  if (frac < EPS || frac > 1 - EPS) return String(Math.round(x) + 1);
  if (Math.abs(frac - 0.5) < EPS) return "&";
  if (Math.abs(frac - 0.25) < EPS) return "e";
  if (Math.abs(frac - 0.75) < EPS) return "a";
  return "";
}

const countQ = (d) => (d.den === 8 || d.unitQ === 1.5 ? 0.5 : d.unitQ);

// Drum pulses in a bar: dotted quarters in 6/8, 9/8, 12/8; eighths in other
// x/8; quarters otherwise.
function pulseQ(d) {
  if (d.den === 8) return d.num % 3 === 0 && d.num > 3 ? 1.5 : 0.5;
  return 1;
}

// opts: { capo, down, simple (one down-strum a beat), soloFor(sectionName) -> { licks } }
function wholeSongItems(d, { capo = 0, down = 0, simple = false, soloFor = null } = {}) {
  const shapeCache = new Map();
  const shapeFor = (c) => {
    if (!shapeCache.has(c)) shapeCache.set(c, chordShape(transposeSymbol(playName(c), down - capo)) || chordShape(playName(c)));
    return shapeCache.get(c);
  };
  const items = [];
  const drums = [];
  const marks = [];
  let ref = 0;
  const pq = pulseQ(d);
  const nPulse = Math.max(1, Math.round(d.barQ / pq));
  d.sections.forEach((sec, si) => {
    const f = d.qb / sec.qb; // reference beats per quarter note here
    const barRef = d.barQ * f;
    const st = sec.strum;
    marks.push({ at: ref, name: sec.name, index: si });
    // A solo section: our practice licks as single notes (one a beat), then
    // the chords for whatever bars are left.
    let skipBars = 0;
    const lk = soloFor ? soloFor(sec.name) : null;
    if (lk && lk.licks?.length) {
      let pos = 0;
      for (let k = 0; ; k++) {
        const lick = lk.licks[k % lk.licks.length];
        const lenQ = Math.ceil(lick.events.length / d.barQ) * d.barQ;
        if (pos + lenQ > sec.bars.length * d.barQ + EPS) break;
        lick.events.forEach((e, j) => {
          const q = pos + j;
          const bi = Math.floor(q / d.barQ + EPS);
          items.push({ string: e.string, fret: e.fret, start: ref + q * f, dur: f, where: `${sec.name} · bar ${bi + 1} of ${sec.bars.length} · practice lick`, barBeats: barRef });
        });
        pos += lenQ;
      }
      skipBars = Math.round(pos / d.barQ);
    }
    sec.bars.forEach((bar, bi) => {
      const at = ref + bi * barRef;
      for (let k = 0; k < nPulse; k++) drums.push({ at: at + k * pq * f, k, n: nPulse });
      if (bi < skipBars) return;
      const where = `${sec.name} · bar ${bi + 1} of ${sec.bars.length}`;
      // The chord segments of this bar, in quarter notes.
      let q0 = 0;
      const segs = bar.map(({ chord, q }) => { const s = { chord, from: q0, to: q0 + q }; q0 += q; return s; });
      const segAt = (q) => segs.find((s) => q >= s.from - EPS && q < s.to - EPS) || segs[segs.length - 1];
      const strums = [];
      // What the hand does in this bar.
      let kind = simple ? "beats" : st.kind;
      let slotQ = st.slotQ;
      let pat = "";
      if (kind === "strum" || kind === "palm") {
        pat = st.bars[bi % st.bars.length] || "";
        const n = Math.round(d.barQ / slotQ);
        while (pat.length < n) pat += pat || "-";
        pat = pat.slice(0, n);
      } else if (kind === "pick" || kind === "riff" || kind === "beats") {
        // "Downs": one strum a beat (a dotted quarter in 6/8). Fingerpicked
        // and riff sections: the chord on every counted beat.
        slotQ = kind === "beats" ? pq : d.den === 8 ? 0.5 : 1;
        pat = "D".repeat(Math.max(1, Math.round(d.barQ / slotQ)));
      } else if (kind === "ring" || kind === "rest") {
        pat = "";
        slotQ = d.barQ;
      }
      for (let i = 0; i < pat.length; i++) {
        const c = pat[i];
        if (c === "-") continue;
        const q = i * slotQ;
        strums.push({ q, dir: c === "U" ? "up" : c === "X" ? "mute" : "down", len: slotQ });
      }
      segs.forEach((s) => {
        const mine = strums.filter((x) => x.q >= s.from - EPS && x.q < s.to - EPS);
        // The name of the shape you play (capo / tuning), as the page shows it.
        const base = { chord: isRest(s.chord) || !(down - capo) ? s.chord : transposeSymbol(s.chord, down - capo), concert: s.chord, where, barBeats: barRef, barStart: at, countBeats: countQ(d) * f };
        if (isRest(s.chord) || kind === "rest") {
          // No chord (or the guitar sits out): shown, not played.
          items.push({ ...base, shape: isRest(s.chord) ? null : shapeFor(s.chord), strum: "rest", rest: true, start: at + s.from * f, dur: (s.to - s.from) * f, count: countLabel(d, s.from) });
          return;
        }
        const shape = shapeFor(s.chord);
        // A chord with no strum of its own in the pattern is still played
        // when it arrives.
        if (!mine.length) mine.push({ q: s.from, dir: "down", len: kind === "ring" ? s.to - s.from : Math.min(slotQ || 1, s.to - s.from) });
        mine.forEach((x) => {
          const len = Math.min(x.len, s.to - x.q);
          items.push({ ...base, shape, strum: x.dir, start: at + x.q * f, dur: len * f, count: countLabel(d, x.q),
            ...(kind === "pick" ? { roll: true } : {}), ...(kind === "palm" ? { palm: true } : {}), ...(kind === "ring" ? { ring: true } : {}) });
        });
      });
    });
    ref += sec.bars.length * barRef;
  });
  items.sort((a, b) => a.start - b.start);
  return { items, drums, marks, total: ref };
}

// Song position in quarter notes (as the chart counts them) -> reference
// beats, following the sections' tempos.
function quarterToRef(d) {
  const spans = [];
  let q = 0;
  let ref = 0;
  d.sections.forEach((s) => {
    const len = s.bars.length * d.barQ;
    spans.push({ q, len, ref, f: d.qb / s.qb });
    q += len;
    ref += len * (d.qb / s.qb);
  });
  return (x) => {
    const s = spans.find((sp) => x < sp.q + sp.len - EPS) || spans[spans.length - 1];
    return s.ref + (x - s.q) * s.f;
  };
}

// The tune, every note, where to play it (fret-map.js), frets counted from
// the capo the page uses.
function tuneItems(d, { capo = 0, down = 0 } = {}) {
  if (!d.melody) return [];
  const toRef = quarterToRef(d);
  const places = placeMelody(d.melody.map(([m]) => m - capo + down));
  const sectionAt = (() => {
    const bounds = [];
    let q = 0;
    d.sections.forEach((s) => { bounds.push({ q, s }); q += s.bars.length * d.barQ; });
    return (x) => { let hit = bounds[0]; bounds.forEach((b) => { if (x >= b.q - EPS) hit = b; }); return hit; };
  })();
  return d.melody.map(([, startQ, durQ], i) => {
    const sec = sectionAt(startQ);
    const bar = Math.floor((startQ - sec.q) / d.barQ + EPS);
    const start = toRef(startQ);
    const end = toRef(startQ + durQ);
    return { string: places[i].string, fret: places[i].fret, start, dur: Math.max(0.05, end - start), where: `${sec.s.name} · bar ${bar + 1} of ${sec.s.bars.length}`, count: countLabel(d, (startQ - sec.q) % d.barQ) };
  });
}

// "46 BPM (dotted quarter) · 6/8"
function tempoText(d) {
  return `${d.bpm} BPM${d.bpmUnit ? ` (${d.bpmUnit})` : ""}`;
}

export { songDetail, detailPlan, detailChords, wholeSongItems, tuneItems, tempoText, playName, quarterToRef };
