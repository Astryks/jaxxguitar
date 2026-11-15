import { isLefty } from "./settings.js";
import { icon } from "./icons.js";
// Per-string guitar tuner: pick a string, hear a reference tone, and
// watch the needle. It turns green once the string stays within ±7 cents
// for a second, about what a clip-on tuner shows as "in".
// The Tuner tab can also tune to Drop D, DADGAD and Open G.
//
// 2026-11 owner feedback: it used to jump to the next string by itself,
// often before the player had finished. Now it stays on the string you
// picked; while the microphone listens, that string's note is played again
// every 4 seconds (the microphone ignores it while it sounds, so the
// app's own note can't count as yours); once you're in tune a "Next
// string: A →" button appears and you move on when you're ready.

import { createTunerWidget, ignoreMicFor } from "./pitch.js";
import { TUNING } from "./guitar-theory.js";
import { playNote } from "./guitar-audio.js";
import { headstockSvg, viewerSvg } from "./guitar-art.js";

const REPEAT_MS = 4000; // reference tone repeats this often while listening
const REF_SECONDS = 1.0; // how long the reference note sounds while listening
const REF_IGNORE_MS = 1500; // mic ignored this long after it starts (it fades out by ~1.4 s)

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
  let repeatOn = true;
  let repeatTimer = null;
  const done = new Set();
  container.innerHTML = `
    ${tunings ? `<div class="jg-row jg-set-row jg-tn-tunings" style="justify-content:center"><span class="jg-label">Tuning</span>${Object.entries(TUNINGS).map(([id, x]) => `<button class="jg-pill" data-tuning="${id}" type="button">${x.label}</button>`).join("")}</div><p class="jg-note jg-tn-tnote" style="text-align:center"></p>` : ""}
    <div class="jg-hs-wrap"></div>
    <div class="jg-viewer-wrap">${viewerSvg()}</div>
    <p class="jg-note" style="text-align:center;margin-top:0">Tap a peg or a string below to pick it and hear it.</p>
    <div class="jg-tuner-strings"></div>
    <p class="jg-tuner-msg jg-tn-which"></p>
    <div class="jg-row" style="justify-content:center;flex-wrap:wrap;gap:8px">
      <button class="jg-btn jg-btn-small jg-tn-ref" type="button">${icon("speaker", 18)} Hear this string</button>
      <button class="jg-btn jg-btn-small jg-tn-repeat" type="button" style="display:none"></button>
    </div>
    <div class="jg-tn-widget" style="display:flex;justify-content:center"></div>
    <div class="jg-tn-next-row" style="display:none;justify-content:center;margin:8px 0">
      <button class="jg-btn jg-btn-primary jg-tn-next" type="button" style="font-size:1.1rem;padding:12px 22px;box-shadow:0 0 0 4px #c9ecd3,0 4px 14px rgba(63,163,95,0.35)"></button>
    </div>
    <p class="jg-note" style="text-align:center">Tip: tune <em>up</em> to the note. Too high? Go a little below, then come back up.</p>`;
  const which = container.querySelector(".jg-tn-which");
  const host = container.querySelector(".jg-tn-widget");
  const hs = container.querySelector(".jg-hs-wrap");
  const stringsEl = container.querySelector(".jg-tuner-strings");
  const repeatBtn = container.querySelector(".jg-tn-repeat");
  const nextRow = container.querySelector(".jg-tn-next-row");
  const nextBtn = container.querySelector(".jg-tn-next");
  const drawHead = (ok = false) => { hs.innerHTML = headstockSvg({ active: current, done, ok, names: t.names }); hs.classList.toggle("jg-flipped", isLefty()); };
  const label = (i) => t.names[i] + (done.has(i) ? " ✓" : "");

  // The reference note. While listening it's short and the microphone
  // ignores it (it would otherwise "hear" the phone's own speaker).
  function playRef() {
    if (widget.isListening()) {
      ignoreMicFor(REF_IGNORE_MS);
      playNote(t.midi[current], { duration: REF_SECONDS, gain: 0.4 });
    } else {
      playNote(t.midi[current], { duration: 2.5, gain: 0.4 });
    }
  }
  // Repeats while listening, until the string is in tune or the player
  // turns it off.
  function scheduleRepeat() {
    clearTimeout(repeatTimer);
    repeatTimer = null;
    const go = repeatOn && widget.isListening() && !widget.isMatched() && container.isConnected;
    if (go) {
      repeatTimer = setTimeout(() => {
        if (!container.isConnected) return;
        if (repeatOn && widget.isListening() && !widget.isMatched()) playRef();
        scheduleRepeat();
      }, REPEAT_MS);
    }
    drawRepeat();
  }
  function drawRepeat() {
    const show = widget.isListening() && !widget.isMatched();
    repeatBtn.style.display = show ? "" : "none";
    repeatBtn.innerHTML = repeatOn
      ? `■ Stop repeating the ${shortName(t, current)} note`
      : `🔁 Repeat the ${shortName(t, current)} note every 4 s`;
  }

  function drawTuning() {
    container.querySelectorAll("[data-tuning]").forEach((b) => b.classList.toggle("jg-pill-active", b.dataset.tuning === tuningId));
    const tn = container.querySelector(".jg-tn-tnote");
    if (tn) tn.textContent = t.note || "Thickest to thinnest: E A D G B E.";
    stringsEl.innerHTML = t.names.map((n, i) => `<button class="jg-btn jg-tuner-string" data-s="${i}" type="button">${label(i)}</button>`).join("");
  }

  function drawNext() {
    const ok = widget.isMatched() || done.has(current);
    if (!ok) { nextRow.style.display = "none"; return; }
    const next = [1, 2, 3, 4, 5, 0].map((k) => (current + k) % 6).find((k) => !done.has(k));
    if (next === undefined) {
      which.textContent = "All six strings in tune. You're ready to play! 🎸";
      nextRow.style.display = "none";
      return;
    }
    nextBtn.dataset.next = String(next);
    nextBtn.textContent = `Next string: ${shortName(t, next)} →`;
    nextRow.style.display = "flex";
  }

  function select(i) {
    current = i;
    stringsEl.querySelectorAll(".jg-tuner-string").forEach((b) => {
      const n = Number(b.dataset.s);
      b.classList.toggle("jg-btn-primary", n === i);
      b.textContent = label(n);
    });
    which.textContent = `Tuning the ${longName(t, i)}`;
    drawHead();
    widget.setTarget(t.midi[i], shortName(t, i));
    drawNext();
    scheduleRepeat();
  }

  const widget = createTunerWidget(host, t.midi[0], {
    label: "Start listening",
    targetName: shortName(t, 0),
    tolerance: 7,
    holdMs: 1000,
    onListening: (on) => {
      if (on && container.isConnected) playRef(); // hear the note, then match it
      scheduleRepeat();
    },
    onMatch: () => {
      done.add(current);
      drawHead(true);
      const b = stringsEl.querySelector(`[data-s="${current}"]`);
      if (b) b.textContent = label(current);
      which.textContent = `The ${longName(t, current)} is in tune ✓`;
      scheduleRepeat(); // stops the repeating note
      drawNext();
    },
  });

  container.addEventListener("click", (e) => {
    const b = e.target.closest("button, .jg-hs-peg");
    if (!b) return;
    if (b.dataset.tuning) {
      tuningId = b.dataset.tuning;
      t = TUNINGS[tuningId];
      try { localStorage.setItem(TUNING_KEY, tuningId); } catch (err) { /* storage unavailable */ }
      done.clear();
      drawTuning();
      select(0);
      return;
    }
    if (b.classList.contains("jg-tn-next")) {
      if (b.dataset.next === undefined) return;
      select(Number(b.dataset.next));
      playRef();
      scheduleRepeat();
      return;
    }
    if (b.dataset.s !== undefined) {
      select(Number(b.dataset.s));
      if (!b.classList.contains("jg-btn")) stringsEl.scrollIntoView?.({ block: "nearest" });
      playRef(); // hear the string you picked
      scheduleRepeat();
      return;
    }
    if (b.classList.contains("jg-tn-ref")) { playRef(); scheduleRepeat(); }
    if (b.classList.contains("jg-tn-repeat")) {
      repeatOn = !repeatOn;
      scheduleRepeat();
    }
  });
  drawTuning();
  select(0);
  return {
    destroy: () => {
      clearTimeout(repeatTimer);
      repeatTimer = null;
      widget.destroy();
    },
  };
}

export { renderStringTuner, TUNINGS };
