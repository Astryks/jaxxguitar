// Fretboard, chord diagrams and tab for Jaxx Guitar.
//
// renderFretboard(): a horizontal fretboard the way you look down at
// your own guitar in a lesson video — high e string on TOP (the same
// order as tab), low E at the bottom, the nut on the left. Fret spacing
// follows a real guitar's (each fret ~5.6% narrower than the last, the
// 12th fret halfway to the bridge), squeezed a little so the first frets
// aren't huge. Tapping a string at a fret plays it and reports the note
// (input-hub), so every input path — screen, mic — works the same.

import { TUNING, STRING_NAMES, midiAt, noteName } from "./guitar-theory.js";
import { playNote } from "./guitar-audio.js";
import { emitNoteOn } from "./input-hub.js";

const STRING_COLORS = ["#e0625b", "#f0a24b", "#e8d24b", "#5bbf72", "#4fa3e0", "#9b78e0"]; // 6th → 1st
const INLAYS = [3, 5, 7, 9, 15, 17];

function fretX(n, frets) {
  // Real spacing 1 - 2^(-n/12), blended with linear so low frets aren't oversized.
  const real = (k) => 1 - Math.pow(2, -k / 12);
  const r = real(n) / real(frets);
  return 0.55 * r + 0.45 * (n / frets);
}

function renderFretboard(container, { frets = 12, height = 168 } = {}) {
  container.innerHTML = "";
  container.classList.add("jg-fretboard");
  const W = 1000;
  const H = height;
  const openW = 62; // string names, then the open/mute markers, left of the nut
  const top = 14;
  const bottom = H - 22;
  const stringY = (s) => top + ((5 - s) * (bottom - top)) / 5; // s: 0 = low E (bottom)
  const xOf = (f) => openW + fretX(f, frets) * (W - openW - 8);
  const center = (f) => (f === 0 ? openW - 20 : (xOf(f - 1) + xOf(f)) / 2);

  const parts = [];
  parts.push(`<rect x="${openW}" y="${top - 8}" width="${W - openW - 8}" height="${bottom - top + 16}" rx="4" class="jg-wood"/>`);
  for (let f = 1; f <= frets; f++) parts.push(`<line x1="${xOf(f)}" x2="${xOf(f)}" y1="${top - 8}" y2="${bottom + 8}" class="jg-fret"/>`);
  parts.push(`<rect x="${openW - 5}" y="${top - 9}" width="7" height="${bottom - top + 18}" class="jg-nut"/>`);
  INLAYS.filter((f) => f <= frets).forEach((f) => parts.push(`<circle cx="${center(f)}" cy="${(top + bottom) / 2}" r="6" class="jg-inlay"/>`));
  if (frets >= 12) {
    parts.push(`<circle cx="${center(12)}" cy="${(top + bottom) / 2 - 22}" r="6" class="jg-inlay"/>`);
    parts.push(`<circle cx="${center(12)}" cy="${(top + bottom) / 2 + 22}" r="6" class="jg-inlay"/>`);
  }
  for (let s = 0; s < 6; s++) {
    parts.push(`<line x1="${openW}" x2="${W - 8}" y1="${stringY(s)}" y2="${stringY(s)}" class="jg-string" style="stroke-width:${3.2 - s * 0.4}"/>`);
    parts.push(`<text x="4" y="${stringY(s) + 4}" class="jg-string-name">${STRING_NAMES[s]}</text>`);
  }
  for (let f = 1; f <= frets; f++) parts.push(`<text x="${center(f)}" y="${H - 4}" class="jg-fret-num">${f}</text>`);
  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="jg-fretboard-svg" role="img" aria-label="Guitar fretboard"><g>${parts.join("")}</g><g class="jg-marks"></g><g class="jg-hits"></g></svg>`;
  const svg = container.querySelector("svg");
  const marks = svg.querySelector(".jg-marks");
  const hits = svg.querySelector(".jg-hits");

  // Invisible tap targets: one per string × fret (0 = open string)
  const hitParts = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= frets; f++) {
      const x0 = f === 0 ? 0 : xOf(f - 1);
      const x1 = f === 0 ? openW : xOf(f);
      const yh = (bottom - top) / 5;
      hitParts.push(`<rect x="${x0}" y="${stringY(s) - yh / 2}" width="${x1 - x0}" height="${yh}" data-s="${s}" data-f="${f}" class="jg-hit"/>`);
    }
  }
  hits.innerHTML = hitParts.join("");
  let tapHandler = null;
  svg.addEventListener("pointerdown", (e) => {
    const t = e.target.closest(".jg-hit");
    if (!t) return;
    const s = Number(t.dataset.s);
    const f = Number(t.dataset.f);
    const midi = midiAt(s, f);
    playNote(midi, { duration: 1.2 });
    flash(s, f);
    emitNoteOn(midi, "screen");
    if (tapHandler) tapHandler({ string: s, fret: f, midi });
  });

  function flash(s, f) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", center(f));
    c.setAttribute("cy", stringY(s));
    c.setAttribute("r", 11);
    c.setAttribute("class", "jg-tap-flash");
    marks.appendChild(c);
    setTimeout(() => c.remove(), 350);
  }

  // positions: [{ string, fret, finger?, label?, tone? }]; tone:
  // "root" | "note" | "ghost" | "good" | "bad". muted: string indexes (x).
  function show(positions = [], { muted = [], barre = null } = {}) {
    const p = [];
    if (barre) {
      const strs = positions.filter((q) => q.fret === barre.fret).map((q) => q.string);
      const lo = Math.min(...strs);
      const hi = Math.max(...strs);
      p.push(`<rect x="${center(barre.fret) - 9}" y="${stringY(hi) - 9}" width="18" height="${stringY(lo) - stringY(hi) + 18}" rx="9" class="jg-barre"/>`);
    }
    muted.forEach((s) => p.push(`<text x="${openW - 20}" y="${stringY(s) + 5}" class="jg-mute">×</text>`));
    positions.forEach((q) => {
      const x = center(q.fret);
      const y = stringY(q.string);
      if (q.fret === 0) {
        p.push(`<circle cx="${x}" cy="${y}" r="8" class="jg-open ${q.tone ? "jg-" + q.tone : ""}"/>`);
        if (q.label) p.push(`<text x="${x}" y="${y + 4}" class="jg-dot-label jg-dot-label-dark">${q.label}</text>`);
        return;
      }
      p.push(`<circle cx="${x}" cy="${y}" r="11" class="jg-dot ${q.tone ? "jg-" + q.tone : ""}" style="${q.tone ? "" : `fill:${STRING_COLORS[q.string]}`}"/>`);
      const lab = q.label ?? (q.finger ? String(q.finger) : "");
      if (lab) p.push(`<text x="${x}" y="${y + 4}" class="jg-dot-label">${lab}</text>`);
    });
    marks.innerHTML = p.join("");
  }

  // Show a chord shape ({frets, fingers, barre}) with finger numbers.
  function showShape(shape, { labels = "fingers" } = {}) {
    if (!shape) return show([]);
    const positions = [];
    const muted = [];
    shape.frets.forEach((f, s) => {
      if (f < 0) muted.push(s);
      else positions.push({ string: s, fret: f, finger: labels === "fingers" ? shape.fingers?.[s] : null, label: labels === "notes" ? noteName(midiAt(s, f)) : undefined });
    });
    show(positions, { muted, barre: shape.barre ? { fret: shape.barre } : null });
  }

  return {
    show, showShape, clear: () => show([]), onTap: (cb) => { tapHandler = cb; },
    xFrac: (f) => center(f) / W, widthFrac: (f) => (f === 0 ? openW : xOf(f) - xOf(f - 1)) / W,
    stringColor: (s) => STRING_COLORS[s], frets,
  };
}

// Classic vertical chord box (as in songbooks): strings left (low E) →
// right (high e), nut at top, x/o above, dots with finger numbers.
function chordDiagramSvg(shape, name = "") {
  if (!shape) return `<div class="jg-diagram jg-diagram-empty">${name}</div>`;
  const used = shape.frets.filter((f) => f > 0);
  const minF = used.length ? Math.min(...used) : 1;
  const maxF = used.length ? Math.max(...used) : 1;
  const start = maxF <= 4 ? 1 : minF;
  const rows = 4;
  const w = 120;
  const h = 150;
  const x0 = 20;
  const y0 = 36;
  const dx = (w - 2 * x0) / 5;
  const dy = (h - y0 - 14) / rows;
  const p = [`<text x="${w / 2}" y="14" class="jg-dg-name">${name || shape.symbol || ""}</text>`];
  for (let i = 0; i < 6; i++) p.push(`<line x1="${x0 + i * dx}" x2="${x0 + i * dx}" y1="${y0}" y2="${y0 + rows * dy}" class="jg-dg-line"/>`);
  for (let r = 0; r <= rows; r++) p.push(`<line x1="${x0}" x2="${x0 + 5 * dx}" y1="${y0 + r * dy}" y2="${y0 + r * dy}" class="jg-dg-line ${r === 0 && start === 1 ? "jg-dg-nut" : ""}"/>`);
  if (start > 1) p.push(`<text x="${x0 - 6}" y="${y0 + dy * 0.65}" class="jg-dg-fretno">${start}</text>`);
  if (shape.barre && shape.barre >= start) {
    const strs = shape.frets.map((f, i) => (f === shape.barre ? i : null)).filter((v) => v !== null);
    const lo = Math.min(...strs);
    const hi = Math.max(...strs);
    const y = y0 + (shape.barre - start + 0.5) * dy;
    p.push(`<rect x="${x0 + lo * dx - 6}" y="${y - 6}" width="${(hi - lo) * dx + 12}" height="12" rx="6" class="jg-dg-barre"/>`);
  }
  shape.frets.forEach((f, i) => {
    const x = x0 + i * dx;
    if (f < 0) p.push(`<text x="${x}" y="${y0 - 8}" class="jg-dg-top">×</text>`);
    else if (f === 0) p.push(`<circle cx="${x}" cy="${y0 - 12}" r="4.5" class="jg-dg-open"/>`);
    else {
      const y = y0 + (f - start + 0.5) * dy;
      p.push(`<circle cx="${x}" cy="${y}" r="8" class="jg-dg-dot"/>`);
      if (shape.fingers?.[i]) p.push(`<text x="${x}" y="${y + 3.5}" class="jg-dg-finger">${shape.fingers[i]}</text>`);
    }
  });
  return `<svg viewBox="0 0 ${w} ${h}" class="jg-diagram" role="img" aria-label="${name} chord diagram">${p.join("")}</svg>`;
}

// Tab: six lines (high e on top), fret numbers at their beat positions.
// events: [{ string (0 = low E), fret, start (beats), dur }]
function tabSvg(events, { beatsPerBar = 4, bars = 1, current = new Set(), done = new Set(), labels = null } = {}) {
  const barW = Math.max(220, Math.max(1, ...Array.from({ length: bars }, (_, b) => new Set(events.filter((e) => Math.floor(e.start / beatsPerBar) === b).map((e) => e.start)).size)) * 30 + 30);
  const W = 40 + bars * barW + 10;
  const H = 120;
  const y = (s) => 18 + (5 - s) * 16;
  const p = [];
  for (let s = 0; s < 6; s++) {
    p.push(`<line x1="34" x2="${W - 8}" y1="${y(s)}" y2="${y(s)}" class="jg-tab-line"/>`);
    p.push(`<text x="10" y="${y(s) + 4}" class="jg-tab-sname">${STRING_NAMES[s]}</text>`);
  }
  p.push(`<text x="22" y="${y(3) + 2}" class="jg-tab-clef">T</text><text x="22" y="${y(2) + 3}" class="jg-tab-clef">A</text><text x="22" y="${y(1) + 4}" class="jg-tab-clef">B</text>`);
  for (let b = 0; b <= bars; b++) {
    const x = 40 + b * barW;
    p.push(`<line x1="${x}" x2="${x}" y1="${y(5)}" y2="${y(0)}" class="jg-tab-bar"/>`);
  }
  events.forEach((e, i) => {
    const bar = Math.floor(e.start / beatsPerBar);
    const x = 40 + bar * barW + 18 + ((e.start - bar * beatsPerBar) / beatsPerBar) * (barW - 30);
    const cls = current.has(i) ? "jg-tab-now" : done.has(i) ? "jg-tab-done" : "";
    p.push(`<rect x="${x - 8}" y="${y(e.string) - 7}" width="16" height="14" class="jg-tab-bg"/>`);
    p.push(`<text x="${x}" y="${y(e.string) + 4}" class="jg-tab-num ${cls}">${e.fret}</text>`);
    if (labels && labels[i]) p.push(`<text x="${x}" y="${H - 4}" class="jg-tab-label">${labels[i]}</text>`);
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="jg-tabsvg">${p.join("")}</svg>`;
}

export { renderFretboard, chordDiagramSvg, tabSvg, STRING_COLORS, TUNING };
