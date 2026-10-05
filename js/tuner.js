// Per-string guitar tuner: pick a string (or let it follow whichever
// string you play), hear a reference tone, and watch the needle — it
// turns green within ±8 cents, about what a clip-on tuner shows as "in".

import { createTunerWidget } from "./pitch.js";
import { TUNING } from "./guitar-theory.js";
import { playNote } from "./guitar-audio.js";

const STRINGS = [
  { name: "E", long: "low E (6th string, thickest)" },
  { name: "A", long: "A (5th string)" },
  { name: "D", long: "D (4th string)" },
  { name: "G", long: "G (3rd string)" },
  { name: "B", long: "B (2nd string)" },
  { name: "e", long: "high e (1st string, thinnest)" },
];

function renderStringTuner(container) {
  let current = 0;
  let widget = null;
  const done = new Set();
  container.innerHTML = `
    <div class="jg-tuner-strings">${STRINGS.map((s, i) => `<button class="jg-btn jg-tuner-string" data-s="${i}">${s.name}</button>`).join("")}</div>
    <p class="jg-tuner-msg jg-tn-which"></p>
    <div class="jg-row" style="justify-content:center"><button class="jg-btn jg-btn-small jg-tn-ref">🔊 Hear the note</button></div>
    <div class="jg-tn-widget" style="display:flex;justify-content:center"></div>
    <p class="jg-note" style="text-align:center">Tip: tune <em>up</em> to the note — if you're sharp, go a little below and come back up. It holds its tuning better.</p>`;
  const which = container.querySelector(".jg-tn-which");
  const host = container.querySelector(".jg-tn-widget");

  function select(i, autoStart = false) {
    current = i;
    container.querySelectorAll(".jg-tuner-string").forEach((b) => {
      const n = Number(b.dataset.s);
      b.classList.toggle("jg-btn-primary", n === i);
      b.textContent = STRINGS[n].name + (done.has(n) ? " ✓" : "");
    });
    which.textContent = `Tuning the ${STRINGS[i].long}`;
    if (widget) widget.destroy();
    widget = createTunerWidget(host, TUNING[i], {
      label: "Start listening",
      targetName: STRINGS[i].name === "e" ? "high e" : STRINGS[i].name === "E" ? "low E" : STRINGS[i].name,
      tolerance: 8,
      autoStart,
      onMatch: () => {
        done.add(i);
        const b = container.querySelector(`[data-s="${i}"]`);
        if (b) b.textContent = STRINGS[i].name + " ✓";
        if (done.size === 6) which.textContent = "All six strings in tune — you're ready to play! 🎸";
        else if (i < 5) setTimeout(() => { if (container.isConnected && current === i) select(i + 1, true); }, 1200);
      },
    });
  }
  container.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.s !== undefined) select(Number(b.dataset.s), Boolean(container.querySelector(".hk-tuner-display[style*='flex']")));
    if (b.classList.contains("jg-tn-ref")) playNote(TUNING[current], { duration: 2.5, gain: 0.4 });
  });
  select(0);
  return { destroy: () => widget && widget.destroy() };
}

export { renderStringTuner };
