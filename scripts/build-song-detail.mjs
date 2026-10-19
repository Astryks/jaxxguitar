// Builds js/song-detail-data.js: every library song bar by bar (chords and
// how many beats each gets, the strum for each section, tempo and time
// signature, tuning and capo, and the tune for public-domain pieces) from
// the research files (found-*.json, one object per song:
//   { title, artist, key, tuning, capo, bpm, timeSignature, beatUnit?,
//     bpmUnit?, sections: [{ name, bars: ["G:4", "C:2 D:2", ...], strum,
//     piano, bpm? , melody? }], melody?: [[midi, startBeat, durBeats]],
//     sources, confidence: "verified" | "close" }).
//
//   node scripts/build-song-detail.mjs [dir-with-found-json]
//
// Everything is checked before it is written, and the script stops on any
// problem: each song is matched to the library, every bar adds up to its
// time signature, every chord has a checked guitar shape at the capo the
// song page uses (js/song-plan.js), tempos are sane, strums parse, and the
// tune fits inside the song. Section names are cleaned of lyric snippets
// (we never print lyrics). The piano field is for Hayden Keys and is not
// used here.

import fs from "node:fs";
import path from "node:path";

const base = new URL("../js/", import.meta.url);
const { SONGS } = await import(new URL("songs-data.js", base));
const { songPlan, planFor, tuningOffset } = await import(new URL("song-plan.js", base));
const { chordShape, transposeSymbol } = await import(new URL("guitar-theory.js", base));
const { parseChordSymbol } = await import(new URL("chord-utils.js", base));

const DIR = process.argv[2] || "/private/tmp/claude-501/scratch/detail";
const OUT = new URL("song-detail-data.js", base);

const problems = [];
const warn = [];
const bad = (song, msg) => problems.push(`${song}: ${msg}`);

// --- Load ---------------------------------------------------------------
const files = fs.readdirSync(DIR).filter((f) => /^found-\d+\.json$/.test(f)).sort();
const found = [];
const skipped = [];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  found.push(...d.songs);
  skipped.push(...(d.skipped || []));
}

// --- Match to the library ------------------------------------------------
const libKey = (s) => `${s.title}|${s.artist}`;
const byKey = new Map(SONGS.map((s) => [libKey(s), s]));
// Same song, artist written a little differently in the research.
const BY_HAND = {
  "Take the A Train|Billy Strayhorn (Duke Ellington Orchestra, 1941)": "Take the A Train|Billy Strayhorn (jazz standard)",
  "Amazing Grace|Traditional hymn (John Newton, 1779; tune 'New Britain')": "Amazing Grace|Traditional hymn (John Newton, 1779)",
};
const notInLibrary = [];

// --- Chords --------------------------------------------------------------
// Spellings the theory code doesn't read (Cb, E#, F##...) become their
// everyday names; a few chart-only colours play as the nearest chord we
// have a checked shape for (the chart name is still shown).
const ENHARMONIC = { Cb: "B", Fb: "E", "E#": "F", "B#": "C", "F##": "G", "C##": "D", "G##": "A", "D##": "E", "A##": "B" };
function respell(sym) {
  return sym.replace(/^([A-G](?:##|#|b)?)/, (r) => ENHARMONIC[r] || r).replace(/\/([A-G](?:##|#|b)?)$/, (m, r) => `/${ENHARMONIC[r] || r}`);
}
const ALIAS = {
  A6sus2: "Asus2", "Bbm(add9)": "Bbm", "Fm(add9)": "Fm", "Eb(add9)": "Ebadd9", "D6add9/F#": "D/F#",
  E9sus4: "E7sus4", E13: "E7", "D7#11": "D7", "F7#11": "F7", G7alt: "G7#5", "AmM7/G#": "Am/G#",
  "Dm(maj7)": "DmMaj7", "Cm(maj7)": "CmMaj7", "Cm(maj7)/B": "Cm/B", D7sus2: "Dsus2", F7sus2: "Fsus2", Ebadd11: "Eb",
  "C7/C": "C7",
};
const isNC = (c) => /^(N\.?C\.?|NC|rest|-)$/i.test(c);

// --- Lyric snippets out of section names ----------------------------------
const LYRIC_BITS = [
  "Ooh it makes me wonder", "Where do we go", "na na na", "Har ghadi...", "Kal ho naa ho", "Everything's gonna be alright",
  "Tell me more", "take me home", "Take that money", "Lamma bada", "Accha chalta hoon", "Channa mereya", "Bailando",
  "Des yeux...", "Hava nagila", "Hava neranena", "Uru, uru achim", "Uru achim", "Sha la la", "la la la", "Oariá raiô",
  "oh-oh", "humming",
];
function cleanName(name) {
  let n = String(name);
  n = n.replace(/["“”][^"“”]*["“”]/g, "").replace(/(^|[\s(,])'[^']+'(?=[\s),]|$)/g, "$1");
  for (const bit of LYRIC_BITS) {
    if (bit === "humming") continue;
    n = n.split(bit).join("");
  }
  n = n.replace(/la-la /gi, "").replace(/\(\s*[,;]?\s*/g, "(").replace(/\s*[,;]?\s*\)/g, ")").replace(/\(\s*\)/g, "")
    .replace(/\(\s*(chant|held|section|answer|call and response)\s*\)/gi, (m, w) => `(${w})`).replace(/\s{2,}/g, " ").trim();
  n = n.replace(/\(\s*,\s*/g, "(").replace(/,\s*\)/g, ")").replace(/\(\)/g, "").trim();
  return n || "Section";
}

// --- Time ----------------------------------------------------------------
const UNIT_Q = { eighth: 0.5, quarter: 1, "dotted quarter": 1.5, half: 2, "dotted half": 3 };
const unitName = (q) => Object.keys(UNIT_Q).find((k) => UNIT_Q[k] === q) || `${q} quarters`;
const parseTs = (ts) => { const m = /^(\d+)\/(\d+)$/.exec(String(ts).trim()); return m ? { num: +m[1], den: +m[2] } : null; };
// What the song's bpm counts: x/8 compound meters count the dotted quarter
// when the number is slow (46 = 6/8 at a dotted-quarter pulse) and the
// eighth when it's fast (138 eighths); 2/2 counts half notes.
function bpmUnitQ(s, ts, bpm) {
  if (s.bpmUnit) return UNIT_Q[s.bpmUnit];
  if (ts.den === 8 && ts.num % 3 === 0) return bpm < 90 ? 1.5 : 0.5;
  if (ts.den === 8) return 0.5;
  if (ts.den === 2) return 2;
  return 1;
}

// --- Strums --------------------------------------------------------------
// A strum pattern becomes one even grid per bar: slot length in quarter
// notes plus a string of D (down), U (up), X (muted chuck) and - (gap).
const NICE = [4, 3, 2, 1.5, 1, 0.5, 1 / 3, 0.25, 1 / 6, 0.125];
const isNice = (q) => NICE.some((n) => Math.abs(n - q) < 1e-6);
const near = (a, b) => Math.abs(a - b) < 1e-6;
function parseBarPattern(raw, barQ, grid) {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  const chars = tokens.join("").toUpperCase().replace(/[^DUX-]/g, "");
  const N = chars.length;
  if (!N) return null;
  const fill = (pat, slotQ) => {
    // A pattern shorter than the bar repeats (e.g. 8 sixteenths = half a bar).
    const n = Math.round(barQ / slotQ);
    let out = pat;
    while (out.length < n) out += pat;
    return { slotQ, pat: out.slice(0, n) };
  };
  // Charts that say their slots are sixteenths or triplet eighths.
  if (grid) {
    const n = Math.round(barQ / grid);
    if (near(n * grid, barQ) && n % N === 0) return fill(chars, grid);
  }
  const multi = tokens.length > 1 && tokens.some((t) => t.replace(/[^DUXdux-]/g, "").length > 1);
  // 1. Beat groups ("D DU D DU" = eighth + two sixteenths, the gallop).
  if (multi) {
    const sizes = tokens.map((t) => t.replace(/[^DUXdux-]/g, "").length);
    const gq = barQ / tokens.length;
    if (isNice(gq) && sizes.every((n) => n >= 1 && n <= 2)) {
      const lcm = sizes.includes(2) ? 2 : 1;
      const pat = tokens.map((t) => { const cs = t.toUpperCase().replace(/[^DUX-]/g, ""); return cs.length === lcm ? cs : cs + "-"; }).join("");
      return { slotQ: gq / lcm, pat };
    }
  }
  // 2. An even grid across the bar, when it's a real note value.
  if (!multi && isNice(barQ / N)) return { slotQ: barQ / N, pat: chars };
  // 3. Downs on the beat, ups on the "&" (how strums are counted).
  const c = cursorFits(chars, barQ);
  if (c) return c;
  if (multi && isNice(barQ / N)) return { slotQ: barQ / N, pat: chars };
  // 4. Spread evenly (reported).
  return { slotQ: barQ / N, pat: chars, odd: true };
}
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function cursorFits(chars, barQ) {
  const n = Math.round(barQ * 2);
  if (!near(n, barQ * 2)) return null;
  const out = Array(n).fill("-");
  let cur = 0;
  for (const ch of chars) {
    if (ch === "-") { cur++; continue; }
    let k = cur;
    if (ch === "D") while (k % 2) k++;
    if (ch === "U") while (k % 2 === 0) k++;
    if (k >= n) return null;
    out[k] = ch;
    cur = k + 1;
  }
  let pat = out.join("");
  // Fits in the first half: it's a half-bar pattern that repeats.
  const used = pat.replace(/-+$/, "").length;
  if (used <= n / 2 && n % 2 === 0) pat = pat.slice(0, n / 2) + pat.slice(0, n / 2);
  return { slotQ: 0.5, pat };
}
// kinds: "strum" (the grid), "pick" (fingerpicked: one roll a beat),
// "riff" (single-note riff: the chord on each beat), "ring" (one strum
// when the chord changes, let it ring), "rest" (guitar silent), "palm"
// (palm-muted eighths).
function parseStrum(s, sec, barQ, songName) {
  const raw = String(sec.strum || "").trim();
  const label = (raw.match(/\(([^)]*)\)/g) || []).map((x) => x.slice(1, -1)).join("; ");
  const body = raw.replace(/\([^)]*\)/g, " ").trim();
  const grid = /16th/.test(s.strumGrid || "") ? 0.25 : /triplet/.test(s.strumGrid || "") ? 1 / 3 : null;
  if (/^fingerpick|^p i m a|arpeggio/i.test(body) || (/^fingerpick/i.test(raw) && !/[DU]/.test(body))) return { kind: "pick", label: label || "fingerpicked" };
  if (/^riff/i.test(body)) return { kind: "riff", label: label || "riff" };
  if (/^let ring/i.test(body)) return { kind: "ring", label: "let ring" };
  if (/^palm-muted 8ths/i.test(body)) return { kind: "palm", slotQ: 0.5, bars: ["D".repeat(Math.round(barQ * 2))], label: "palm-muted eighths" };
  const parts = body.split("|").map((x) => x.trim()).filter((x) => x.length);
  if (!parts.length) { bad(songName, `section "${sec.name}": strum "${raw}" doesn't parse`); return { kind: "ring" }; }
  const parsed = parts.map((p) => parseBarPattern(p, barQ, grid));
  if (parsed.some((p) => !p)) {
    // All gaps: the guitar sits out (a cappella, a break).
    if (parts.every((p) => /^[-\s]+$/.test(p))) return { kind: "rest", label: label || "guitar rests" };
    bad(songName, `section "${sec.name}": strum "${raw}" doesn't parse`);
    return { kind: "ring" };
  }
  // One grid for the section (the finest), every bar's pattern on it.
  const slotQ = Math.min(...parsed.map((p) => p.slotQ));
  const bars = parsed.map((p) => {
    const k = Math.round(p.slotQ / slotQ);
    if (!near(k * slotQ, p.slotQ)) bad(songName, `section "${sec.name}": strum grids don't line up`);
    return p.pat.split("").map((c) => c + "-".repeat(k - 1)).join("");
  });
  if (parsed.some((p) => p.odd)) warn.push(`${songName} / ${sec.name}: strum "${raw}" spread evenly (${parsed[0].pat.length} slots in ${barQ} beats)`);
  const allGap = bars.every((b) => !/[DUX]/.test(b));
  if (allGap) return { kind: "rest", label: label || "guitar rests" };
  return { kind: "strum", slotQ, bars, label };
}

// --- Sources ---------------------------------------------------------------
const SITE = [[/ultimate-guitar/, "Ultimate Guitar"], [/hooktheory/, "Hooktheory"], [/musicnotes/, "Musicnotes"], [/songbpm/, "SongBPM"], [/wikipedia/, "Wikipedia"], [/imslp/, "IMSLP"], [/jazzstandards/, "JazzStandards.com"], [/songsterr/, "Songsterr"], [/musescore/, "MuseScore"], [/chordify/, "Chordify"], [/ufret/, "U-FRET"], [/cifraclub/, "Cifra Club"], [/kern|humdrum|ccarh/, "KernScores"], [/mutopia/, "Mutopia"], [/8notes/, "8notes"], [/tunebat/, "Tunebat"], [/musicgateway/, "Music Gateway"], [/spotify/, "Spotify"], [/genius/, "Genius"], [/apple/, "Apple Music"], [/youtube/, "YouTube"], [/cpdl/, "CPDL"], [/hymnary/, "Hymnary"]];
function siteNames(sources) {
  const out = [];
  for (const s of sources || []) {
    const str = String(typeof s === "string" ? s : s.url || s.name || "");
    const hit = SITE.find(([re]) => re.test(str));
    let name = hit ? hit[1] : null;
    if (!name) { try { name = new URL(str).hostname.replace(/^www\./, ""); } catch (e) { name = str.slice(0, 40); } }
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

// --- Build each song -------------------------------------------------------
const round = (x) => Math.round(x * 1000) / 1000;
const DETAIL = {};
const usedAliases = {};
const nameChanges = [];
const counts = { verified: 0, close: 0, melody: 0, bars: 0, sections: 0, tempoChanges: 0 };
for (const s of found) {
  const name = `${s.title}|${s.artist}`;
  let lib = byKey.get(name) || byKey.get(BY_HAND[name]);
  if (!lib) {
    const t = SONGS.filter((x) => x.title === s.title);
    if (t.length === 1) { lib = t[0]; warn.push(`matched by title: "${name}" -> "${libKey(lib)}"`); }
  }
  if (!lib) { notInLibrary.push(name); continue; }
  const key = libKey(lib);
  if (DETAIL[key]) { bad(name, "two research entries for one song"); continue; }

  const ts = parseTs(s.timeSignature);
  if (!ts) { bad(name, `time signature "${s.timeSignature}"`); continue; }
  const barQ = (ts.num * 4) / ts.den;

  // Bars: "Am:1 Am/G#:1 ..." -> [[chord, beats]], checked.
  const sumOf = (bar) => bar.reduce((n, [, b]) => n + b, 0);
  const secs = s.sections.map((sec) => ({
    ...sec,
    parsed: sec.bars.map((b) => String(b).trim().split(/\s+/).map((tok) => {
      const m = /^(.+?):(\d+(?:\.\d+)?)(?::\d+(?:\.\d+)?)?$/.exec(tok);
      if (!m) { bad(name, `bar "${b}" in "${sec.name}": can't read "${tok}"`); return ["N.C.", 0]; }
      if (/:\d+(\.\d+)?:\d/.test(tok)) warn.push(`${name}: fixed doubled beat count "${tok}"`);
      return [m[1], Number(m[2])];
    })),
  }));
  // The bars' beat unit: from the research, or what makes a full bar.
  const sums = secs.flatMap((x) => x.parsed.map(sumOf));
  const mode = [...sums.reduce((m, v) => m.set(v, (m.get(v) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1])[0][0];
  const unitQ = s.beatUnit ? UNIT_Q[s.beatUnit] : barQ / mode;
  if (!unitQ || ![0.5, 1, 1.5, 2].some((u) => near(u, unitQ))) { bad(name, `bar unit ${unitQ} (bars add up to ${mode} in ${s.timeSignature})`); continue; }
  const barUnits = barQ / unitQ;
  secs.forEach((sec) => sec.parsed.forEach((bar, i) => {
    if (!near(sumOf(bar), barUnits)) bad(name, `"${sec.name}" bar ${i + 1} "${sec.bars[i]}" adds up to ${sumOf(bar)}, not ${barUnits} (${s.timeSignature})`);
    if (bar.some(([, b]) => !(b > 0))) bad(name, `"${sec.name}" bar ${i + 1} has a chord with no beats`);
  }));

  // Tempo, in quarter notes a minute.
  const bpm = Number(s.bpm);
  const tq = bpmUnitQ(s, ts, bpm);
  const qbpm = bpm * tq;
  const barSec = (q) => (barQ * 60) / q;
  if (!(bpm > 0) || barSec(qbpm) < 0.5 || barSec(qbpm) > 9 || qbpm < 30 || qbpm > 400) bad(name, `tempo ${bpm} (${unitName(tq)}) = ${round(barSec(qbpm))} s a bar`);

  // Tuning and the capo the song page uses (song-plan.js).
  const down = tuningOffset({ tuning: s.tuning });
  if (/drop/i.test(s.tuning || "")) warn.push(`${name}: drop tuning "${s.tuning}" shown as text only`);
  const plan = tuningOffset(lib) === down ? songPlan(lib) : planFor(lib.chords, down);
  if (!plan.playable) bad(name, "library chords have no playable plan in this tuning");
  const capo = plan.capo || 0;

  // Every chord: a checked shape at that capo.
  const chordsOut = new Set();
  secs.forEach((sec) => sec.parsed.forEach((bar) => bar.forEach((cb) => {
    let c = cb[0];
    if (isNC(c)) { cb[0] = "N.C."; return; }
    const r = respell(c);
    if (r !== c) { nameChanges.push(`${c} -> ${r}`); c = r; }
    cb[0] = c;
    const play = ALIAS[c] || c;
    if (ALIAS[c]) usedAliases[c] = play;
    if (!parseChordSymbol(play)) { bad(name, `chord "${c}" doesn't parse`); return; }
    const shapeName = transposeSymbol(play, down - capo);
    const sh = chordShape(shapeName);
    if (!sh) bad(name, `chord "${c}" -> shape "${shapeName}" (capo ${capo}${down ? `, tuned down ${down}` : ""}) has no guitar shape`);
    chordsOut.add(c);
  })));

  // Sections: name (no lyrics), bars, strum, own tempo.
  const barsTable = [];
  const strumTable = [];
  const secOut = secs.map((sec) => {
    const nm = cleanName(sec.name);
    const barsStr = sec.parsed.map((bar) => bar.map(([c, b]) => `${c}:${round(b)}`).join(" ")).join("|");
    let bi = barsTable.indexOf(barsStr);
    if (bi < 0) { barsTable.push(barsStr); bi = barsTable.length - 1; }
    const st = parseStrum(s, sec, barQ, name);
    const stArr = st.kind === "strum" || st.kind === "palm" ? [round(st.slotQ), st.bars.join(","), st.label || "", st.kind === "palm" ? "palm" : ""] : [0, "", st.label || "", st.kind];
    const sk = JSON.stringify(stArr);
    let si = strumTable.findIndex((x) => JSON.stringify(x) === sk);
    if (si < 0) { strumTable.push(stArr); si = strumTable.length - 1; }
    const row = [nm, bi, si];
    if (sec.bpm) {
      const sq = Number(sec.bpm) * tq;
      if (barSec(sq) < 0.5 || barSec(sq) > 9) bad(name, `section "${sec.name}" tempo ${sec.bpm}`);
      if (!near(sq, qbpm)) { row.push(round(sq)); counts.tempoChanges++; }
    }
    counts.bars += sec.parsed.length;
    counts.sections++;
    return row;
  });

  // The tune (public-domain pieces): quarter notes from the song's start.
  const secStartQ = [];
  let q0 = 0;
  secs.forEach((sec) => { secStartQ.push(q0); q0 += sec.parsed.length * barQ; });
  const totalQ = q0;
  const mel = [];
  const addMel = (list, offQ, where) => (list || []).forEach((n, i) => {
    if (!Array.isArray(n) || n.length < 3 || !(n[0] >= 21 && n[0] <= 108) || !(n[2] > 0) || !(n[1] >= 0)) { bad(name, `${where} note ${i} ${JSON.stringify(n)}`); return; }
    mel.push([n[0], round(offQ + n[1] * unitQ), round(n[2] * unitQ)]);
  });
  addMel(s.melody, 0, "melody");
  secs.forEach((sec, i) => addMel(sec.melody, secStartQ[i], `melody in "${sec.name}"`));
  mel.sort((a, b) => a[1] - b[1] || b[0] - a[0]);
  // One note at a time: a chord in the tune keeps its top note.
  const tune = mel.filter((n, i) => !(mel[i - 1] && near(mel[i - 1][1], n[1])));
  if (tune.length && tune[tune.length - 1][1] > totalQ + 1e-6) bad(name, `the tune runs past the end (${tune[tune.length - 1][1]} > ${totalQ} beats)`);
  if (tune.length) counts.melody++;

  const conf = s.confidence === "verified" ? 1 : 0;
  counts[conf ? "verified" : "close"]++;
  DETAIL[key] = {
    v: conf,
    key: s.key,
    ...(s.tuning && s.tuning !== "standard" ? { tun: s.tuning } : {}),
    ...(s.capo ? { cc: s.capo } : {}),
    ts: s.timeSignature,
    u: unitQ,
    bpm,
    ...(tq !== 1 ? { bu: unitName(tq) } : {}),
    qb: round(qbpm),
    b: barsTable,
    st: strumTable,
    sec: secOut,
    ...(tune.length ? { mel: tune } : {}),
    src: siteNames(s.sources),
  };
}

// --- Report ----------------------------------------------------------------
const libCovered = new Set(Object.keys(DETAIL));
const noDetail = SONGS.filter((s) => !libCovered.has(libKey(s))).map(libKey);
console.log(`research entries: ${found.length}, skipped by research: ${skipped.length}`);
console.log(`library songs: ${SONGS.length}, with bar-by-bar data: ${libCovered.size} (verified ${counts.verified}, our best guide ${counts.close}), with the tune: ${counts.melody}`);
console.log(`sections: ${counts.sections}, bars: ${counts.bars}, section tempo changes: ${counts.tempoChanges}`);
if (notInLibrary.length) console.log(`not in the library (left out): ${notInLibrary.join("; ")}`);
console.log(`library songs keeping their old data: ${noDetail.join("; ")}`);
if (Object.keys(usedAliases).length) console.log("chart chords played as:", Object.entries(usedAliases).map(([a, b]) => `${a}=${b}`).join(", "));
if (nameChanges.length) console.log("respelled:", [...new Set(nameChanges)].join(", "));
warn.forEach((w) => console.log("note:", w));
if (problems.length) {
  problems.forEach((p) => console.log("PROBLEM:", p));
  console.log(`${problems.length} problems: nothing written.`);
  process.exit(1);
}

const header = `// GENERATED by scripts/build-song-detail.mjs from the research files. Do not edit by hand.
// Every library song bar by bar, researched 2026-10 from published chord
// charts (Ultimate Guitar, Hooktheory, Musicnotes, SongBPM...) and, for
// public-domain pieces, scores. No lyrics. Read through js/song-detail.js.
//
// Per song ("Title|Artist"):
//   v    1 = checked against the recording's charts, 0 = our best guide
//   key  concert key; tun tuning (standard if absent); cc the capo most charts use
//   ts   time signature; u quarter notes per beat in the bars below
//   bpm  tempo as usually quoted, bu what it counts (quarter if absent); qb quarter notes a minute
//   b    bar lists: "G:4|C:2 D:2" (chord:beats per bar, bars split by |), shared by sections
//   st   strums: [slot length in quarter notes, "D-DU-UDU,..." one pattern per bar (cycled),
//        label, kind ("" strum, palm, pick, riff, ring, rest)]
//   sec  [name, bars index, strum index, own tempo in quarter notes a minute?]
//   mel  the tune: [midi, start, length] in quarter notes from the start
//   src  where it was checked
`;
const body = `const SONG_DETAIL = {\n${Object.entries(DETAIL).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(",\n")}\n};\n\n// Chart chords with no shape of their own play as these (the chart name is shown).\nconst CHORD_ALIAS = ${JSON.stringify(ALIAS)};\n\nexport { SONG_DETAIL, CHORD_ALIAS };\n`;
fs.writeFileSync(OUT, header + body);
console.log(`wrote ${OUT.pathname} (${Math.round((header + body).length / 1024)} KB)`);
