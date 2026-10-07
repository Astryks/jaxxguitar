// Fretboard, chord diagrams and tab for Jaxx Guitar.
//
// renderFretboard(): a horizontal fretboard the way a right-handed
// player sees it looking down at their own guitar: the thickest low E
// string (the one nearest your chin) on TOP, the thin high e at the
// bottom, the nut on the left and the fret numbers along the bottom.
// Fret spacing follows a real guitar's (each fret ~5.6% narrower than
// the last, the 12th fret halfway to the bridge), squeezed a little so
// the first frets aren't huge. Tapping a string at a fret plays it and
// reports the note (input-hub), so every input path (screen, mic) works
// the same. With the left-handed setting on, the whole board is mirrored
// (nut on the right) and its text is flipped back so it still reads
// normally (css: .jg-lefty text).

import { TUNING, STRING_NAMES, midiAt, noteName } from "./guitar-theory.js";
import { playNote } from "./guitar-audio.js";
import { emitNoteOn } from "./input-hub.js";
import { isLefty } from "./settings.js";

const STRING_COLORS = ["#e0625b", "#f0a24b", "#e8d24b", "#5bbf72", "#4fa3e0", "#9b78e0"]; // 6th → 1st
const INLAYS = [3, 5, 7, 9, 15, 17];
const FINGER_NAMES = { 1: "index", 2: "middle", 3: "ring", 4: "pinky" };
const SVGNS = "http://www.w3.org/2000/svg";

function fretX(n, frets) {
  // Real spacing 1 - 2^(-n/12), blended with linear so low frets aren't oversized.
  const real = (k) => 1 - Math.pow(2, -k / 12);
  const r = real(n) / real(frets);
  return 0.55 * r + 0.45 * (n / frets);
}

function renderFretboard(container, { frets = 12, height = 196 } = {}) {
  container.innerHTML = "";
  container.classList.add("jg-fretboard");
  const W = 1000;
  const H = height;
  const openW = 62; // string names, then the open/mute markers, left of the nut
  const top = 26;
  const bottom = H - 40; // room for the fret numbers along the bottom
  const stringY = (s) => top + (s * (bottom - top)) / 5; // s: 0 = low E (TOP)
  const xOf = (f) => openW + fretX(f, frets) * (W - openW - 8);
  const center = (f) => (f === 0 ? openW - 20 : (xOf(f - 1) + xOf(f)) / 2);

  const parts = [];
  parts.push(`<g class="jg-fret-hl"></g>`);
  parts.push(`<rect x="${openW}" y="${top - 16}" width="${W - openW - 8}" height="${bottom - top + 32}" rx="4" class="jg-wood"/>`);
  for (let f = 1; f <= frets; f++) parts.push(`<line x1="${xOf(f)}" x2="${xOf(f)}" y1="${top - 16}" y2="${bottom + 16}" class="jg-fret"/>`);
  parts.push(`<rect x="${openW - 5}" y="${top - 17}" width="7" height="${bottom - top + 34}" class="jg-nut"/>`);
  INLAYS.filter((f) => f <= frets).forEach((f) => parts.push(`<circle cx="${center(f)}" cy="${(top + bottom) / 2}" r="6" class="jg-inlay"/>`));
  if (frets >= 12) {
    parts.push(`<circle cx="${center(12)}" cy="${(top + bottom) / 2 - 22}" r="6" class="jg-inlay"/>`);
    parts.push(`<circle cx="${center(12)}" cy="${(top + bottom) / 2 + 22}" r="6" class="jg-inlay"/>`);
  }
  for (let s = 0; s < 6; s++) {
    parts.push(`<line x1="${openW}" x2="${W - 8}" y1="${stringY(s)}" y2="${stringY(s)}" class="jg-string" style="stroke-width:${3.4 - s * 0.45}"/>`);
    parts.push(`<text x="4" y="${stringY(s) + 6}" class="jg-string-name">${STRING_NAMES[s]}</text>`);
  }
  for (let f = 1; f <= frets; f++) parts.push(`<text x="${center(f)}" y="${H - 8}" class="jg-fret-num" data-fn="${f}">${f}</text>`);
  const lefty = isLefty();
  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="jg-fretboard-svg ${lefty ? "jg-lefty" : ""}" role="img" aria-label="Guitar fretboard, low E string on top${lefty ? ", mirrored for left-handed players" : ""}"><g${lefty ? ` transform="translate(${W} 0) scale(-1 1)"` : ""}><g>${parts.join("")}</g><g class="jg-marks"></g><g class="jg-hits"></g></g></svg>`;
  const svg = container.querySelector("svg");
  const marks = svg.querySelector(".jg-marks");
  const hits = svg.querySelector(".jg-hits");
  const hl = svg.querySelector(".jg-fret-hl");

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
    const c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("cx", center(f));
    c.setAttribute("cy", stringY(s));
    c.setAttribute("r", 11);
    c.setAttribute("class", "jg-tap-flash");
    marks.appendChild(c);
    setTimeout(() => c.remove(), 350);
  }

  // Shade whole fret spaces (e.g. "today we only need frets 1 to 3") and
  // make their numbers along the bottom stand out.
  function highlightFrets(list = []) {
    hl.innerHTML = list.map((f) => `<rect x="${xOf(f - 1)}" y="${top - 20}" width="${xOf(f) - xOf(f - 1)}" height="${H - top + 20}" rx="6" class="jg-fret-hl-box"/>`).join("");
    svg.querySelectorAll(".jg-fret-num").forEach((t) => t.classList.toggle("jg-fret-num-hl", list.includes(Number(t.dataset.fn))));
  }

  let anim = [];
  const stopAnim = () => { anim.forEach((t) => clearTimeout(t)); anim = []; };

  function barreRect(fret, strs, cls = "jg-barre") {
    const ys = strs.map(stringY);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    return `<rect x="${center(fret) - 10}" y="${y0 - 10}" width="20" height="${y1 - y0 + 20}" rx="10" class="${cls}"/>`;
  }

  // positions: [{ string, fret, finger?, label?, tone? }]; tone:
  // "root" | "note" | "ghost" | "good" | "bad" | "lit". muted: string indexes (x).
  function show(positions = [], { muted = [], barre = null, keep = false } = {}) {
    if (!keep) stopAnim();
    const p = [];
    if (barre) {
      const strs = positions.filter((q) => q.fret === barre.fret).map((q) => q.string);
      if (strs.length) p.push(barreRect(barre.fret, strs, barre.lit ? "jg-barre jg-barre-lit" : "jg-barre"));
    }
    muted.forEach((s) => p.push(`<text x="${openW - 20}" y="${stringY(s) + 6}" class="jg-mute">×</text>`));
    positions.forEach((q) => {
      const x = center(q.fret);
      const y = stringY(q.string);
      if (q.fret === 0) {
        p.push(`<circle cx="${x}" cy="${y}" r="8" class="jg-open ${q.tone ? "jg-" + q.tone : ""}"/>`);
        if (q.label) p.push(`<text x="${x}" y="${y + 4}" class="jg-dot-label jg-dot-label-dark">${q.label}</text>`);
        return;
      }
      p.push(`<circle cx="${x}" cy="${y}" r="12" class="jg-dot ${q.tone ? "jg-" + q.tone : ""} ${q.pop ? "jg-pop" : ""}" style="${q.tone ? "" : `fill:${STRING_COLORS[q.string]}`}"/>`);
      const lab = q.label ?? (q.finger ? String(q.finger) : "");
      if (lab) p.push(`<text x="${x}" y="${y + 4.5}" class="jg-dot-label ${q.pop ? "jg-pop" : ""}">${lab}</text>`);
    });
    marks.innerHTML = p.join("");
  }

  // Show a chord shape ({frets, fingers, barre}) with finger numbers, all
  // pressed frets lit in one colour (the app's).
  function shapeParts(shape, labels = "fingers") {
    const positions = [];
    const muted = [];
    shape.frets.forEach((f, s) => {
      if (f < 0) muted.push(s);
      else positions.push({ string: s, fret: f, tone: f > 0 ? "lit" : undefined, finger: labels === "fingers" ? shape.fingers?.[s] : null, label: labels === "notes" ? noteName(midiAt(s, f)) : undefined });
    });
    return { positions, muted };
  }
  function showShape(shape, { labels = "fingers" } = {}) {
    if (!shape) return show([]);
    const { positions, muted } = shapeParts(shape, labels);
    show(positions, { muted, barre: shape.barre ? { fret: shape.barre, lit: true } : null });
  }

  // Our own "how to place your fingers" animation: the fingers land one
  // at a time (index first), each with its finger name, then the open
  // strings light up. Calls onStep(finger, i) as each lands.
  function placeFingers(shape, { stepMs = 900, loop = false, onStep } = {}) {
    stopAnim();
    if (!shape) return show([]);
    const { positions, muted } = shapeParts(shape);
    const pressed = positions.filter((q) => q.fret > 0);
    const order = [...new Set(pressed.map((q) => q.finger || 1))].sort();
    const run = () => {
      show([], { muted, keep: true });
      order.forEach((fg, i) => anim.push(setTimeout(() => {
        const now = pressed.filter((q) => order.indexOf(q.finger || 1) <= i).map((q) => ({ ...q, pop: (q.finger || 1) === fg, label: q.finger ? String(q.finger) : "" }));
        const isBarre = shape.barre && fg === 1;
        show(now, { muted, keep: true, barre: shape.barre && order.indexOf(1) <= i ? { fret: shape.barre, lit: true } : null });
        const q = pressed.find((x) => (x.finger || 1) === fg);
        if (q) {
          const t = document.createElementNS(SVGNS, "text");
          t.setAttribute("x", center(q.fret) + 20);
          t.setAttribute("y", stringY(q.string) - 14);
          t.setAttribute("class", "jg-finger-tag");
          t.textContent = `${fg} = ${FINGER_NAMES[fg] || "finger"}${isBarre ? " (flat across)" : ""}`;
          marks.appendChild(t);
        }
        onStep?.(fg, i);
      }, 300 + i * stepMs)));
      anim.push(setTimeout(() => { show(positions, { muted, keep: true, barre: shape.barre ? { fret: shape.barre, lit: true } : null }); }, 300 + order.length * stepMs));
      if (loop) anim.push(setTimeout(run, 300 + order.length * stepMs + 2200));
    };
    run();
  }

  // Our own "how to switch" animation: each finger slides from chord A to
  // chord B. Fingers that don't move get an anchor ring; the others lift
  // together, move as one shape, and land together. Loops until stopped.
  function morph(a, b, { holdMs = 1300, moveMs = 700, onPhase } = {}) {
    stopAnim();
    const fingerPos = (shape) => {
      const m = new Map();
      shape.frets.forEach((f, s) => { const fg = shape.fingers?.[s]; if (f > 0 && fg && !m.has(fg)) m.set(fg, { string: s, fret: f }); });
      return m;
    };
    const A = fingerPos(a);
    const B = fingerPos(b);
    const all = [...new Set([...A.keys(), ...B.keys()])].sort();
    const same = (p, q) => p && q && p.string === q.string && p.fret === q.fret;
    const mutes = (shape) => shape.frets.map((f, s) => (f < 0 ? `<text x="${openW - 20}" y="${stringY(s) + 6}" class="jg-mute">×</text>` : "")).join("");
    marks.innerHTML = `<g class="jg-morph-mutes">${mutes(a)}</g>` + all.map((fg) => {
      const p = A.get(fg) || B.get(fg);
      const anchor = same(A.get(fg), B.get(fg));
      return `<g class="jg-morph-f ${anchor ? "jg-morph-anchor" : ""}" data-fg="${fg}" style="transform:translate(${center(p.fret)}px,${stringY(p.string)}px);opacity:${A.get(fg) ? 1 : 0}">
        ${anchor ? '<circle r="18" class="jg-anchor-ring"/>' : ""}<circle r="12" class="jg-dot jg-lit"/><text y="4.5" class="jg-dot-label">${fg}</text></g>`;
    }).join("");
    const groups = [...marks.querySelectorAll(".jg-morph-f")];
    const go = (toB) => {
      const src = toB ? A : B;
      const dst = toB ? B : A;
      marks.querySelector(".jg-morph-mutes").innerHTML = mutes(toB ? b : a);
      groups.forEach((g) => {
        const fg = Number(g.dataset.fg);
        const p = dst.get(fg) || src.get(fg);
        g.style.transition = `transform ${moveMs}ms ease-in-out, opacity ${moveMs}ms`;
        g.classList.toggle("jg-morph-lift", !same(src.get(fg), dst.get(fg)));
        g.style.transform = `translate(${center(p.fret)}px,${stringY(p.string)}px)`;
        g.style.opacity = dst.get(fg) ? 1 : 0;
      });
      onPhase?.(toB ? "toB" : "toA");
      anim.push(setTimeout(() => groups.forEach((g) => g.classList.remove("jg-morph-lift")), moveMs));
      anim.push(setTimeout(() => go(!toB), moveMs + holdMs));
    };
    anim.push(setTimeout(() => go(true), holdMs));
  }

  return {
    show, showShape, placeFingers, morph, highlightFrets, stopAnim, clear: () => show([]), onTap: (cb) => { tapHandler = cb; },
    xFrac: (f) => (lefty ? 1 - center(f) / W : center(f) / W), widthFrac: (f) => (f === 0 ? openW : xOf(f) - xOf(f - 1)) / W,
    stringColor: (s) => STRING_COLORS[s], frets,
  };
}

// Chord diagram, drawn the same way round as the fretboard (and as you see
// your own guitar looking down): low E on top, high e at the bottom, the
// nut on the left, fret numbers along the bottom, × / ○ before the nut,
// pressed frets in the app's colour with finger numbers.
function chordDiagramSvg(shape, name = "") {
  if (!shape) return `<div class="jg-diagram jg-diagram-empty">${name}</div>`;
  const used = shape.frets.filter((f) => f > 0);
  const minF = used.length ? Math.min(...used) : 1;
  const maxF = used.length ? Math.max(...used) : 1;
  const start = maxF <= 4 ? 1 : minF;
  const cols = Math.max(4, maxF - start + 1);
  const w = 168;
  const h = 128;
  const x0 = 40; // nut
  const x1 = w - 8;
  const y0 = 26;
  const dy = 14;
  const dx = (x1 - x0) / cols;
  const sy = (s) => y0 + s * dy;
  const p = [`<text x="${(x0 + x1) / 2}" y="16" class="jg-dg-name">${name || shape.symbol || ""}</text>`];
  p.push(`<rect x="${x0}" y="${sy(0) - 4}" width="${x1 - x0}" height="${5 * dy + 8}" rx="3" class="jg-dg-wood"/>`);
  for (let c = 0; c <= cols; c++) p.push(`<line x1="${x0 + c * dx}" x2="${x0 + c * dx}" y1="${sy(0) - 4}" y2="${sy(5) + 4}" class="jg-dg-line ${c === 0 && start === 1 ? "jg-dg-nut" : ""}"/>`);
  for (let s = 0; s < 6; s++) {
    p.push(`<line x1="${x0}" x2="${x1}" y1="${sy(s)}" y2="${sy(s)}" class="jg-dg-string" style="stroke-width:${1.9 - s * 0.2}"/>`);
    p.push(`<text x="6" y="${sy(s) + 4}" class="jg-dg-sname">${STRING_NAMES[s]}</text>`);
  }
  for (let c = 0; c < cols; c++) p.push(`<text x="${x0 + (c + 0.5) * dx}" y="${h - 4}" class="jg-dg-fretno">${start + c}</text>`);
  if (shape.barre && shape.barre >= start) {
    const strs = shape.frets.map((f, i) => (f === shape.barre ? i : null)).filter((v) => v !== null);
    const lo = Math.min(...strs);
    const hi = Math.max(...strs);
    const x = x0 + (shape.barre - start + 0.5) * dx;
    p.push(`<rect x="${x - 7}" y="${sy(lo) - 7}" width="14" height="${sy(hi) - sy(lo) + 14}" rx="7" class="jg-dg-barre"/>`);
  }
  shape.frets.forEach((f, i) => {
    const y = sy(i);
    if (f < 0) p.push(`<text x="${x0 - 12}" y="${y + 4}" class="jg-dg-top">×</text>`);
    else if (f === 0) p.push(`<circle cx="${x0 - 12}" cy="${y}" r="4.2" class="jg-dg-open"/>`);
    else {
      const x = x0 + (f - start + 0.5) * dx;
      p.push(`<circle cx="${x}" cy="${y}" r="6.6" class="jg-dg-dot"/>`);
      if (shape.fingers?.[i]) p.push(`<text x="${x}" y="${y + 3.4}" class="jg-dg-finger">${shape.fingers[i]}</text>`);
    }
  });
  const lefty = isLefty();
  return `<svg viewBox="0 0 ${w} ${h}" class="jg-diagram ${lefty ? "jg-lefty" : ""}" role="img" aria-label="${name} chord diagram, low E string on top"><g${lefty ? ` transform="translate(${w} 0) scale(-1 1)"` : ""}>${p.join("")}</g></svg>`;
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

export { renderFretboard, chordDiagramSvg, tabSvg, STRING_COLORS, TUNING, FINGER_NAMES };
