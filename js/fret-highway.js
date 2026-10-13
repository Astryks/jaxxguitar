// The play-along view for guitar (owner's reference: a lit-up guitar video).
// Above the fretboard, a dark tab panel scrolls right to left past a glowing
// playhead: chords as chips with their strum arrow, single notes as fret
// numbers on their string (high e on top, like tab). On the fretboard below,
// every string that's ringing glows from where it's pressed to the body, with
// a glowing ring on the fret (fb.glow). Same API as before: render(now, notes).

const STR = ["E", "A", "D", "G", "B", "e"];

function renderFretHighway(container, fb, { lookaheadSec = 3.2 } = {}) {
  container.innerHTML = "";
  container.classList.add("jg-highway", "jg-tabhw");
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  function resize() {
    const r = container.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * (window.devicePixelRatio || 1)));
    canvas.height = Math.max(1, Math.round((r.height || 110) * (window.devicePixelRatio || 1)));
  }
  resize();
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(container);

  // notes: [{ string, fret, time, duration, ghost?, ev? }]
  function render(now, notes, { chordLabel } = {}) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const labelW = 22 * dpr, playX = labelW + (w - labelW) * 0.22;
    const pps = (w - playX) / lookaheadSec; // pixels per second
    const xAt = (t) => playX + (t - now) * pps;
    const chipH = Math.min(26 * dpr, h * 0.3);
    const tabTop = chipH + 8 * dpr, tabBot = h - 6 * dpr;
    const rowY = (s) => tabTop + ((5 - s) * (tabBot - tabTop)) / 5; // high e on top, like tab

    // Tab lines and string names.
    ctx.lineWidth = 1 * dpr;
    for (let s = 0; s < 6; s++) {
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath(); ctx.moveTo(labelW, rowY(s)); ctx.lineTo(w, rowY(s)); ctx.stroke();
      ctx.fillStyle = fb.stringColor(s);
      ctx.font = `bold ${Math.max(8, Math.min(11, (tabBot - tabTop) / 6)) * dpr}px -apple-system, sans-serif`;
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(STR[s], 4 * dpr, rowY(s));
    }

    // Group notes by event: chords become one chip, single notes are numbers.
    const evs = new Map();
    for (const n of notes) {
      const k = n.ev || n;
      if (!evs.has(k)) evs.set(k, { t: n.time, d: n.duration, chord: n.ev && n.ev.chord, strum: n.ev && n.ev.strum, ghost: n.ghost, notes: [] });
      evs.get(k).notes.push(n);
    }
    const ringing = [];
    for (const e of evs.values()) {
      const x0 = xAt(e.t), x1 = xAt(e.t + e.d);
      if (x1 < labelW - 20 || x0 > w + 40) continue;
      const on = e.t <= now && now < e.t + e.d;
      if (on && !e.ghost) ringing.push(...e.notes);
      ctx.globalAlpha = e.ghost ? 0.3 : 1;
      if (e.chord) {
        ctx.fillStyle = on ? "rgba(255,170,64,0.95)" : "rgba(255,255,255,0.12)";
        ctx.strokeStyle = on ? "#ffcf8a" : "rgba(255,255,255,0.35)";
        const cw = Math.max(34 * dpr, x1 - x0 - 4 * dpr);
        roundRect(x0, 3 * dpr, cw, chipH, 7 * dpr); ctx.fill(); ctx.stroke();
        ctx.fillStyle = on ? "#2a1608" : "#fff";
        ctx.font = `800 ${Math.min(15, chipH / dpr * 0.55) * dpr}px -apple-system, sans-serif`;
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        const arrow = e.strum === "up" ? " ↑" : " ↓";
        ctx.fillText(e.chord + arrow, x0 + 7 * dpr, 3 * dpr + chipH / 2);
        // A soft tick on the tab where the strum happens.
        ctx.strokeStyle = on ? "rgba(255,190,100,0.9)" : "rgba(255,255,255,0.25)";
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath(); ctx.moveTo(x0, rowY(5) - 4 * dpr); ctx.lineTo(x0, rowY(0) + 4 * dpr); ctx.stroke();
        ctx.lineWidth = 1 * dpr;
      } else {
        for (const n of e.notes) {
          const y = rowY(n.string);
          ctx.fillStyle = "#14121a";
          ctx.beginPath(); ctx.arc(x0, y, 7 * dpr, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = on ? "#ffb45c" : "#fff";
          ctx.font = `800 ${10 * dpr}px -apple-system, sans-serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(String(n.fret), x0, y);
        }
      }
      ctx.globalAlpha = 1;
    }

    // The glowing playhead.
    ctx.save();
    ctx.shadowColor = "#7dff7a"; ctx.shadowBlur = 10 * dpr;
    ctx.strokeStyle = "#9dff8f"; ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath(); ctx.moveTo(playX, 2 * dpr); ctx.lineTo(playX, h - 2 * dpr); ctx.stroke();
    ctx.restore();

    if (fb.glow) fb.glow(ringing.map((n) => ({ string: n.string, fret: n.fret })));
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  return { render, destroy: () => { if (ro) ro.disconnect(); if (fb.glow) fb.glow([]); } };
}

export { renderFretHighway };
