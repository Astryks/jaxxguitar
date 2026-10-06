// Simple cards for the beginner lessons (like Hayden Keys): one message and
// one thing to do per card, Jaxx the kitten talking, the fretboard lighting
// up exactly where to press, and the card moves on by itself when you get it
// right — tapping the fretboard, or playing your real guitar with the
// microphone on ("Wait for me": it listens only for your guitar strings).
//
// A card: { say, more?: [[question, answer], ...], want, tip?, done? }
// want:
//   { tap: "button label" }                    just a button
//   { string: s }                               tap any fret on string s
//   { pos: [{ string, fret }, ...] }            tap these, in order
//   { chord: "G" }                              place each finger, then strum
//   { choice: "right", options: [...] }         quiz
//   { tuner: true }                             the string tuner
//   { practice: {...}, ok: "label" }           a play-along box, then a button
//   { changes: ["C", "Am"] }                     the one-minute change drill
// show: { shape: "C" } | { notes: [...] } | { highlight: "frets" } — what the fretboard shows first.

import { icon } from "./icons.js";
import { kittenSvg, nextTrick } from "./kitten.js";
import { chordShape, shapeMidis, midiAt } from "./guitar-theory.js";
import { strum } from "./guitar-audio.js";
import { mountInstrument, createPracticeBox } from "./practice-widget.js";
import { renderStringTuner } from "./tuner.js";
import { onNoteOn, enableMic, disableMic, micOn } from "./input-hub.js";

const PHONE = `<div class="jg-card-phone">${icon("guitar", 18)}<span>I know it's hard to play a chord on the app! Tap the dots one at a time here. The real practice is on <b>your guitar</b>: press all the strings and strum them together.</span></div>`;
const STRING_NAME = ["6th (thickest, low E)", "5th (A)", "4th (D)", "3rd (G)", "2nd (B)", "1st (thinnest, high e)"];

function runCards(panel, lesson, { start = 0, onExit, onFinish, changeDrill }) {
  const cards = lesson.cards;
  document.body.classList.add("jg-lesson-open");
  let cleanups = [];
  const clean = () => { cleanups.forEach((f) => { try { f(); } catch (e) { /* ignore */ } }); cleanups = []; };
  let micByUs = false;

  function show(i) {
    clean();
    if (i >= cards.length) { if (micByUs) disableMic(); document.body.classList.remove("jg-lesson-open"); return onFinish(); }
    const card = cards[i];
    const w = card.want || { tap: "Got it!" };
    const needsBoard = w.string !== undefined || w.pos || w.chord || w.practice || w.changes || card.show;
    panel.innerHTML = `
      <div class="jg-cards">
        <div class="jg-cards-top">
          <button class="jg-cards-x" aria-label="Close lesson">✕</button>
          ${i > 0 ? '<button class="jg-cards-back">← Back</button>' : "<span></span>"}
          <b class="jg-cards-title">${lesson.title}</b>
          <span class="jg-cards-count">${i + 1}/${cards.length}</span>
        </div>
        <div class="jg-cards-thread">
          <div class="jg-cmsg"><div class="jg-cavatar">${kittenSvg(w.chord || w.pos ? "play" : w.choice ? "think" : "idle")}</div><div class="jg-cbubble">${card.say}</div></div>
          <div class="jg-cmore"></div>
        </div>
        ${w.chord ? PHONE : ""}
        <div class="jg-card-extra"></div>
        <div class="jg-card-board"></div>
        <div class="jg-card-controls"></div>
      </div>`;
    window.scrollTo(0, 0);
    const thread = panel.querySelector(".jg-cards-thread");
    const controls = panel.querySelector(".jg-card-controls");
    const extra = panel.querySelector(".jg-card-extra");
    panel.querySelector(".jg-cards-x").addEventListener("click", () => { clean(); if (micByUs) disableMic(); document.body.classList.remove("jg-lesson-open"); onExit(); });
    panel.querySelector(".jg-cards-back")?.addEventListener("click", () => show(i - 1));
    const reply = (html, pose) => {
      thread.querySelector(".jg-cmsg-oops")?.remove();
      thread.insertAdjacentHTML("beforeend", `<div class="jg-cmsg ${pose === "oops" || pose === "tangled" ? "jg-cmsg-oops" : ""}"><div class="jg-cavatar">${kittenSvg(pose)}</div><div class="jg-cbubble">${html}</div></div>`);
      thread.lastElementChild.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    };

    // "Tell me more" questions, one tap at a time; the task waits until they're read.
    const more = [...(card.more || [])];
    const moreEl = panel.querySelector(".jg-cmore");
    const holdTask = () => more.length > 0;
    function nextMore() {
      moreEl.innerHTML = "";
      if (!more.length) return setupTask();
      const [q, a] = more.shift();
      moreEl.innerHTML = `<div class="jg-chip-hint">Tap the orange bubble to keep going 👇</div><button class="jg-chip">${q} <span>›</span></button>`;
      moreEl.querySelector(".jg-chip").addEventListener("click", () => {
        moreEl.innerHTML = "";
        thread.insertAdjacentHTML("beforeend", `<div class="jg-cmsg jg-cme"><div class="jg-cbubble">${q}</div></div>`);
        reply(a, "idle");
        nextMore();
      });
    }

    let inst = null;
    if (needsBoard && !w.practice) {
      inst = mountInstrument(panel.querySelector(".jg-card-board"), { frets: 12, highway: false });
      cleanups.push(() => inst.hw.destroy());
      if (card.show?.shape) inst.fb.showShape(chordShape(card.show.shape));
      if (card.show?.notes) inst.fb.show(card.show.notes);
    }

    let finished = false;
    function success() {
      if (finished) return;
      finished = true;
      if (card.tip) reply(card.tip, "idle");
      reply(`<b>${card.done || "Yes! 🎉"}</b>`, nextTrick("yay"));
      controls.innerHTML = `<button class="jg-btn jg-btn-primary jg-card-next jg-card-next-auto">${i === cards.length - 1 ? "Finish lesson ✓" : "Next →"}</button>`;
      const go = () => show(i + 1);
      controls.querySelector(".jg-card-next").addEventListener("click", go);
      const t = setTimeout(() => { if (panel.contains(controls)) go(); }, card.tip ? 3400 : 2200);
      cleanups.push(() => clearTimeout(t));
    }
    const oops = (html) => reply(html, nextTrick("try"));

    // Microphone toggle for tasks you can play on your real guitar.
    function micButton() {
      return `<button class="jg-btn jg-card-mic">${icon("mic", 18)} ${micOn() ? "Listening to your guitar" : "Use my guitar (microphone)"}</button>`;
    }
    function wireMic() {
      controls.querySelector(".jg-card-mic")?.addEventListener("click", async (e) => {
        if (micOn()) return;
        try {
          await enableMic(); micByUs = true;
          e.currentTarget.innerHTML = `${icon("mic", 18)} Listening to your guitar`;
          reply("I'm listening to your guitar strings (only them, nothing else). Play it on your guitar! 👂", "idle");
        } catch (err) { reply("The microphone isn't available. You can tap the fretboard instead.", "oops"); }
      });
    }

    function setupTask() {
      if (w.tap) {
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.tap}</button>`;
        controls.firstElementChild.addEventListener("click", success);
      } else if (w.tuner) {
        const t = renderStringTuner(extra);
        cleanups.push(() => t.destroy());
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.ok || "My guitar is in tune ✓"}</button>`;
        controls.firstElementChild.addEventListener("click", success);
      } else if (w.choice) {
        controls.innerHTML = w.options.map((o) => `<button class="jg-btn jg-card-choice" data-v="${o}">${o}</button>`).join("");
        controls.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => {
          if (b.dataset.v === w.choice) return success();
          b.classList.add("jg-card-wrong");
          oops("Not quite! Have another look 🙈");
        }));
      } else if (w.string !== undefined) {
        inst.fb.show([0, 1, 2, 3, 4, 5].filter((s) => s === w.string).map((s) => ({ string: s, fret: 0, tone: "root" })));
        controls.innerHTML = micButton(); wireMic();
        inst.fb.onTap(({ string }) => string === w.string ? success() : oops(`That's the ${STRING_NAME[string]} string. Find the ${STRING_NAME[w.string]} one!`));
        const off = onNoteOn((midi, src) => { if (src === "mic" && midi % 12 === midiAt(w.string, 0) % 12) success(); });
        cleanups.push(off);
      } else if (w.pos || w.chord) {
        // Place each finger in turn; for a chord, then strum.
        const shape = w.chord ? chordShape(w.chord) : null;
        const steps = w.pos || shape.frets.map((f, s) => ({ string: s, fret: f, finger: shape.fingers[s] })).filter((q) => q.fret > 0).sort((a, b) => a.finger - b.finger);
        let k = 0;
        const placed = [];
        const draw = () => {
          const pts = placed.map((q) => ({ ...q, tone: "good", label: q.finger ? String(q.finger) : "" }));
          if (k < steps.length) pts.push({ ...steps[k], label: steps[k].finger ? String(steps[k].finger) : "", tone: undefined });
          inst.fb.show(pts, { muted: shape ? shape.frets.map((f, s) => (f < 0 ? s : -1)).filter((s) => s >= 0) : [] });
        };
        const strumNow = () => { inst.fb.showShape(shape); strum(shapeMidis(shape), { direction: "down" }); success(); };
        const prompt = () => {
          if (k < steps.length) {
            const q = steps[k];
            controls.innerHTML = `<span class="jg-card-step">${q.finger ? `Finger <b>${q.finger}</b>: ` : ""}${STRING_NAME[q.string]} string, fret <b>${q.fret}</b>${steps.length > 1 ? ` (${k + 1} of ${steps.length})` : ""}</span>` + micButton();
          } else {
            controls.innerHTML = `<button class="jg-btn jg-btn-primary jg-card-strum">${icon("guitar", 20)} Strum it!</button>` + micButton();
            controls.querySelector(".jg-card-strum").addEventListener("click", strumNow);
          }
          wireMic();
          draw();
        };
        inst.fb.onTap(({ string, fret }) => {
          if (k >= steps.length) return;
          const q = steps[k];
          if (string === q.string && fret === q.fret) { placed.push(q); k++; if (!shape && k >= steps.length) return success(); prompt(); }
          else oops(`Almost! Look for the glowing dot: ${STRING_NAME[q.string]} string, fret ${q.fret}.`);
        });
        // On your real guitar: the right note (or, for a chord, its notes) counts.
        const heard = [];
        const off = onNoteOn((midi, src) => {
          if (src !== "mic" || finished) return;
          if (shape && k >= steps.length) {
            const pcs = new Set(shapeMidis(shape).map((m) => m % 12));
            if (pcs.has(midi % 12)) heard.push(midi % 12);
            if (new Set(heard).size >= 2) strumNow();
          } else if (k < steps.length && midi % 12 === midiAt(steps[k].string, steps[k].fret) % 12) {
            placed.push(steps[k]); k++;
            if (!shape && k >= steps.length) return success();
            prompt();
          }
        });
        cleanups.push(off);
        prompt();
      } else if (w.practice) {
        inst = mountInstrument(panel.querySelector(".jg-card-board"), { frets: 12, highway: true });
        cleanups.push(() => inst.hw.destroy());
        const box = createPracticeBox(extra, inst, { ...w.practice, key: `${lesson.id}:card${i}`, preferWait: true });
        cleanups.push(() => box.destroy());
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.ok || "I played it! ✓"}</button>`;
        controls.firstElementChild.addEventListener("click", success);
      } else if (w.changes) {
        changeDrill(extra, inst, w.changes);
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.ok || "Done ✓"}</button>`;
        controls.firstElementChild.addEventListener("click", success);
      }
    }
    if (holdTask()) nextMore(); else setupTask();
  }
  show(start);
  return () => { clean(); if (micByUs) disableMic(); document.body.classList.remove("jg-lesson-open"); };
}

export { runCards };
