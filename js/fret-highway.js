// Falling-notes view for guitar: notes drop onto the fretboard below, in
// the column of the fret to play. Each fret column has six thin lanes, one
// per string, colored like that string on the fretboard, so chords and
// notes on different strings at the same fret never overlap. A note's
// block is as long as the note; it lands on the hit line (the top of the
// fretboard) exactly when it should be played.

function renderFretHighway(container, fb, { lookaheadSec = 2.4 } = {}) {
  container.innerHTML = "";
  container.classList.add("jg-highway");
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  function resize() {
    const r = container.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * (window.devicePixelRatio || 1)));
    canvas.height = Math.max(1, Math.round((r.height || 120) * (window.devicePixelRatio || 1)));
  }
  resize();
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(container);

  // notes: [{ string, fret, time, duration, ghost?, label? }]
  function render(now, notes, { chordLabel } = {}) {
    const w = canvas.width;
    const h = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, w, h);
    const hit = h - 4 * dpr;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(0, hit, w, 2 * dpr);
    for (const n of notes) {
      const end = n.time + n.duration;
      if (end < now - 0.05 || n.time > now + lookaheadSec) continue;
      const yStart = hit - ((n.time - now) / lookaheadSec) * hit;
      const yEnd = hit - ((end - now) / lookaheadSec) * hit;
      const top = Math.max(0, yEnd);
      const bottom = Math.min(hit, yStart);
      if (bottom <= 0) continue;
      const colW = fb.widthFrac(n.fret) * w;
      const laneW = colW / 6;
      const x = fb.xFrac(n.fret) * w - colW / 2 + (5 - n.string) * laneW;
      ctx.globalAlpha = n.ghost ? 0.3 : n.time <= now ? 1 : 0.88;
      ctx.fillStyle = fb.stringColor(n.string);
      ctx.fillRect(x + 1, top, Math.max(3, laneW - 2), Math.max(6 * dpr, bottom - top));
      ctx.globalAlpha = 1;
    }
    if (chordLabel) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = `bold ${16 * dpr}px -apple-system, sans-serif`;
      ctx.fillText(chordLabel, 10 * dpr, 22 * dpr);
    }
  }
  return { render, destroy: () => ro && ro.disconnect() };
}

export { renderFretHighway };
