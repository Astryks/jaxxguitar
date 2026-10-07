import { icon } from "./icons.js";
// Per-string guitar tuner: pick a string, hear a reference tone, and
// watch the needle. It turns green within ±8 cents, about what a clip-on
// tuner shows as "in", then moves on to the next string by itself.
// The Tuner tab can also tune to Drop D, DADGAD and Open G.

import { createTunerWidget } from "./pitch.js";
import { TUNING } from "./guitar-theory.js";
import { playNote } from "./guitar-audio.js";
import { headstockSvg } from "./guitar-art.js";

// Strings low (6th) to high (1st). midi: E2 = 40.
const TUNINGS = {
  standard: { label: "Standard", names: ["E", "A", "D", "G", "B", "e"], midi: TUNING },
  dropD: { label: "Drop D", names: ["D", "A", "D", "G", "B", "e"], midi: [38, 45, 50, 55, 59, 64], note: "Only the thickest string changes: down from E to D." },
  dadgad: { label: "DADGAD", names: ["D", "A", "D", "G", "A", "d"], midi: [38, 45, 50, 55, 57, 62], note: "Three strings go down: low E to D, B to A, high e to d." },
  openG: { label: "Open G", names: ["D", "G", "D", "G", "B", "d"], midi: [38, 43, 50, 55, 59, 62], note: "Hawaiian slack key's \"taro patch\": strum the open strings and it's a G chord." },
};
const ORDINAL = ["6th", "5th", "4th", "3rd", "2nd", "1st"];
const TUNING_KEY = "jg_tuning";

function longName(t, i) {
  const n = t.names[i];
  if (i === 0) return `low ${n} (6th string, thickest)`;
  if (i === 5) return `high ${n.toLowerCase()} (1st string, thinnest)`;
  return `${n} (${ORDINAL[i]} string)`;
}
function shortName(t, i) {
  if (i === 0) return `low ${t.names[0]}`;
  if (i === 5) return `high ${t.names[5].toLowerCase()}`;
  return t.names[i];
}

// opts.tunings: show the alternate-tuning picker (the Tuner tab). Lessons
// always use standard tuning.
function renderStringTuner(container, { tunings = false } = {}) {
  let tuningId = "standard";
  if (tunings) {
    try { tuningId = TUNINGS[localStorage.getItem(TUNING_KEY)] ? localStorage.getItem(TUNING_KEY) : "standard"; } catch (e) { /* storage unavailable */ }
  }
  let t = TUNINGS[tuningId];
  let current = 0;
  let widget = null;
  const done = new Set();
  container.innerHTML = `
    ${tunings ? `<div class="jg-row jg-set-row jg-tn-tunings" style="justify-content:center"><span class="jg-label">Tuning</span>${Object.entries(TUNINGS).map(([id, x]) => `<button class="jg-pill" data-tuning="${id}" type="button">${x.label}</button>`).join("")}</div><p class="jg-note jg-tn-tnote" style="text-align:center"></p>` : ""}
    <div class="jg-hs-wrap"></div>
    <p class="jg-note" style="text-align:center;margin-top:0">Tap a peg to pick a string and hear it.</p>
    <div class="jg-tuner-strings"></div>
    <p class="jg-tuner-msg jg-tn-which"></p>
    <div class="jg-row" style="justify-content:center"><button class="jg-btn jg-btn-small jg-tn-ref">${icon("speaker", 18)} Hear this string</button></div>
    <div class="jg-tn-widget" style="display:flex;justify-content:center"></div>
    <p class="jg-note" style="text-align:center">Tip: tune <em>up</em> to the note. Too high? Go a little below, then come back up.</p>`;
  const which = container.querySelector(".jg-tn-which");
  const host = container.querySelector(".jg-tn-widget");
  const hs = container.querySelector(".jg-hs-wrap");
  const stringsEl = container.querySelector(".jg-tuner-strings");
  const drawHead = (ok = false) => { hs.innerHTML = headstockSvg({ active: current, done, ok, names: t.names }); };
  const label = (i) => t.names[i] + (done.has(i) ? " ✓" : "");
  const listening = () => Boolean(container.querySelector(".hk-tuner-display[style*='flex']"));

  function drawTuning() {
    container.querySelectorAll("[data-tuning]").forEach((b) => b.classList.toggle("jg-pill-active", b.dataset.tuning === tuningId));
    const tn = container.querySelector(".jg-tn-tnote");
    if (tn) tn.textContent = t.note || "Thickest to thinnest: E A D G B E.";
    stringsEl.innerHTML = t.names.map((n, i) => `<button class="jg-btn jg-tuner-string" data-s="${i}" type="button">${label(i)}</button>`).join("");
  }

  function select(i, autoStart = false) {
    current = i;
    stringsEl.querySelectorAll(".jg-tuner-string").forEach((b) => {
      const n = Number(b.dataset.s);
      b.classList.toggle("jg-btn-primary", n === i);
      b.textContent = label(n);
    });
    which.textContent = `Tuning the ${longName(t, i)}`;
    drawHead();
    if (widget) widget.destroy();
    widget = createTunerWidget(host, t.midi[i], {
      label: "Start listening",
      targetName: shortName(t, i),
      tolerance: 8,
      autoStart,
      onMatch: () => {
        done.add(i);
        drawHead(true);
        const b = stringsEl.querySelector(`[data-s="${i}"]`);
        if (b) b.textContent = label(i);
        if (done.size === 6) which.textContent = "All six strings in tune. You're ready to play! 🎸";
        else if (i < 5) setTimeout(() => { if (container.isConnected && current === i) select(i + 1, true); }, 1200);
      },
    });
  }
  container.addEventListener("click", (e) => {
    const b = e.target.closest("button, .jg-hs-peg");
    if (!b) return;
    if (b.dataset.tuning) {
      tuningId = b.dataset.tuning;
      t = TUNINGS[tuningId];
      try { localStorage.setItem(TUNING_KEY, tuningId); } catch (err) { /* storage unavailable */ }
      done.clear();
      drawTuning();
      select(0, listening());
      return;
    }
    if (b.dataset.s !== undefined) {
      select(Number(b.dataset.s), listening());
      if (!b.classList.contains("jg-btn")) stringsEl.scrollIntoView?.({ block: "nearest" });
      playNote(t.midi[current], { duration: 2.5, gain: 0.4 }); // hear the string you picked
    }
    if (b.classList && b.classList.contains("jg-tn-ref")) playNote(t.midi[current], { duration: 2.5, gain: 0.4 });
  });
  drawTuning();
  select(0);
  return { destroy: () => widget && widget.destroy() };
}

export { renderStringTuner, TUNINGS };
