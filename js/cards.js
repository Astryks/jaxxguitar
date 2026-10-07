// Simple cards for the beginner lessons (like Hayden Keys): one message and
// one thing to do per card, Jaxx the puppy talking, the fretboard lighting
// up exactly where to press, and the card moves on when you get it right:
// tapping the fretboard, or playing your real guitar with the microphone
// on ("Wait for me": it listens only for your guitar strings).
//
// A card: { say, more?: [[question, answer], ...], want, tip?, done? }
// want:
//   { tap: "button label" }                    just a button
//   { string: s }                               tap any fret on string s
//   { pos: [{ string, fret }, ...] }            tap these, in order
//   { chord: "G" }                              watch the fingers land, place
//                                               each one, strum; the chord
//                                               stays on screen until "Next chord"
//   { choice: "right", options: [...] }         quiz
//   { allCorrect: "message", options: [...] }   quiz where every answer is right
//   { tuner: true }                             the string tuner
//   { compare: ["E", "Em"] }                    chords side by side, tap to hear
//   { morph: [["C", "Am"], ...] }               how to switch: fingers sliding
//   { strum: { chords, pattern, bpm } }         strum arrows over lit frets
//   { loop: { chords, pattern, bpm } }          the same, looping a chord loop
//   { song: "Title" }                           a song to learn, with its video
//   { practice: {...}, ok: "label" }            a play-along box, then a button
//   { changes: ["C", "Am"] }                    the one-minute change drill
// show: { shape: "C" } | { notes: [...] } | { frets: [1, 2, 3] } |
//       { guitar: true } | { fingerStrum: true } — what to show first.

import { icon } from "./icons.js";
import { puppySvg, nextTrick } from "./puppy.js";
import { sceneSvg, pickScene, LEGENDS } from "./scenes.js";
import { chordShape, shapeMidis, midiAt } from "./guitar-theory.js";
import { strum } from "./guitar-audio.js";
import { chordDiagramSvg, FINGER_NAMES } from "./fretboard.js";
import { mountInstrument, createPracticeBox } from "./practice-widget.js";
import { renderStringTuner } from "./tuner.js";
import { onNoteOn, enableMic, disableMic, micOn } from "./input-hub.js";
import { createStrumLoop } from "./strum-loop.js";
import { guitarSvg, fingerStrumSvg } from "./guitar-art.js";
import { songCardHtml, wireSongCards, findSong } from "./lesson-songs.js";
import { wireVideos } from "./media.js";
import { friendlyMicError } from "./pitch.js";

const PHONE = `<div class="jg-card-phone">${icon("guitar", 18)}<span>I know it's hard to play a chord on the app! Tap the dots one at a time here. The real practice is on <b>your guitar</b>: press all the strings and strum them together.</span></div>`;
const STRING_NAME = ["low E (6th, thickest)", "A (5th)", "D (4th)", "G (3rd)", "B (2nd)", "high e (1st, thinnest)"];
const SWITCH_TIPS = `<ul class="jg-switch-tips">
  <li><b>⚓ Anchor:</b> a finger that's in both chords stays pressed down.</li>
  <li><b>🔄 Pivot:</b> a finger that stays on the same string just slides along it, without lifting.</li>
  <li><b>🙌 Lift together:</b> the other fingers lift a tiny bit, move as one shape, and land at the same time.</li>
  <li><b>👀 Look ahead:</b> look at where your fingers are going, not where they've been.</li>
</ul>`;

function runCards(panel, lesson, { start = 0, onExit, onFinish, changeDrill, courseStart = null, courseTotal = null }) {
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
    const needsBoard = w.string !== undefined || w.pos || w.chord || w.practice || w.changes || w.compare || w.morph || w.strum || w.loop || card.show?.shape || card.show?.notes || card.show?.frets || (card.show && !card.show.guitar && !card.show.fingerStrum && Object.keys(card.show).length === 0);
    // One animation per card, never the same as the last few (scenes.js).
    const scene = pickScene(`${lesson.title} ${card.say || ""}`);
    const legend = scene.startsWith("legend-") ? LEGENDS[scene.slice(7)] : null;
    const count = courseTotal ? `${courseStart + i}/${courseTotal}` : `${i + 1}/${cards.length}`;
    panel.innerHTML = `
      <div class="jg-cards">
        <div class="jg-cards-top">
          <button class="jg-cards-x" aria-label="Close lesson">✕</button>
          ${i > 0 ? '<button class="jg-cards-back">← Back</button>' : "<span></span>"}
          <b class="jg-cards-title">${lesson.title}</b>
          <span class="jg-cards-count" title="Card ${count} of the whole course">${count}</span>
        </div>
        <div class="jg-cards-thread">
          <div class="jg-cmsg"><div class="jg-cavatar jg-avatar-scene">${sceneSvg(scene, { label: "Jaxx Guitar" })}</div><div class="jg-cbubble">${card.say}${legend ? `<div class="jg-legend-fact">🎸 <b>${legend.name}</b> (${legend.who}): ${legend.fact}</div>` : ""}</div></div>
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
      thread.insertAdjacentHTML("beforeend", `<div class="jg-cmsg ${pose === "oops" || pose === "tangled" ? "jg-cmsg-oops" : ""}"><div class="jg-cbubble">${html}</div></div>`);
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
      cleanups.push(() => { inst.fb.stopAnim(); inst.hw.destroy(); });
      if (card.show?.shape) inst.fb.showShape(chordShape(card.show.shape));
      if (card.show?.notes) inst.fb.show(card.show.notes);
      if (card.show?.frets) inst.fb.highlightFrets(card.show.frets);
    }
    if (card.show?.guitar) extra.innerHTML = `<div class="jg-guitar-wrap">${guitarSvg()}</div>`;
    if (card.show?.fingerStrum) extra.innerHTML = `<div class="jg-fingerstrum-wrap">${fingerStrumSvg()}</div>`;

    let finished = false;
    // stay: no auto-advance (e.g. a chord stays on screen until "Next chord").
    function success({ stay = false, next = null } = {}) {
      if (finished) return;
      finished = true;
      if (card.tip) reply(card.tip, "idle");
      reply(`<b>${card.done || "Yes! 🎉"}</b>`, nextTrick("yay"));
      const label = next || (i === cards.length - 1 ? "Finish lesson ✓" : "Next →");
      controls.innerHTML = (w.chord ? `<button class="jg-btn jg-card-again">${icon("speaker", 18)} Strum it again</button>` : "") + `<button class="jg-btn jg-btn-primary jg-card-next ${stay ? "" : "jg-card-next-auto"}">${label}</button>`;
      const go = () => show(i + 1);
      controls.querySelector(".jg-card-next").addEventListener("click", go);
      controls.querySelector(".jg-card-again")?.addEventListener("click", () => { const sh = chordShape(w.chord); inst.fb.showShape(sh); strum(shapeMidis(sh), { direction: "down" }); });
      if (!stay) {
        const t = setTimeout(() => { if (panel.contains(controls)) go(); }, card.tip ? 3400 : 2200);
        cleanups.push(() => clearTimeout(t));
      }
    }
    const oops = (html) => reply(html, nextTrick("try"));

    // Microphone toggle for tasks you can play on your real guitar.
    function micButton() {
      return `<button class="jg-btn jg-card-mic">${icon("mic", 18)} ${micOn() ? "Listening to your guitar" : "Use my guitar (microphone)"}</button>`;
    }
    function wireMic() {
      const btn = controls.querySelector(".jg-card-mic");
      btn?.addEventListener("click", async () => {
        if (micOn()) return;
        // Keep our own reference: after an await the click event's
        // currentTarget is null (that crash used to show "The microphone
        // isn't available" even though the microphone had started).
        btn.disabled = true;
        try {
          await enableMic(); micByUs = true;
        } catch (err) {
          btn.disabled = false;
          reply(`The microphone didn't start: ${friendlyMicError(err)}. You can tap the fretboard instead.`, "oops");
          return;
        }
        btn.disabled = false;
        const live = controls.querySelector(".jg-card-mic");
        if (live) live.innerHTML = `${icon("mic", 18)} Listening to your guitar`;
        reply("I'm listening to your guitar strings (only them, nothing else). Play it on your guitar! 👂", "idle");
      });
    }

    function chordTask() {
      const shape = chordShape(w.chord);
      // 1. Watch: the fingers land one at a time (our own animation).
      const watch = () => {
        controls.innerHTML = `<span class="jg-card-step jg-card-watch">Watch where each finger goes 👀</span>
          <button class="jg-btn jg-card-replay">${icon("play", 18)} Show me again</button>
          <button class="jg-btn jg-btn-primary jg-card-try">Now you try →</button>`;
        const step = controls.querySelector(".jg-card-watch");
        inst.fb.placeFingers(shape, { stepMs: 1100, onStep: (fg) => { step.innerHTML = `Finger <b>${fg}</b> (${FINGER_NAMES[fg] || "finger"}) goes here 👇`; } });
        controls.querySelector(".jg-card-replay").addEventListener("click", watch);
        controls.querySelector(".jg-card-try").addEventListener("click", () => { inst.fb.stopAnim(); placeTask(); });
      };
      watch();
      // 2. Place each finger in turn, then strum.
      function placeTask() {
        const steps = shape.frets.map((f, s) => ({ string: s, fret: f, finger: shape.fingers[s] })).filter((q) => q.fret > 0).sort((a, b) => a.finger - b.finger);
        let k = 0;
        const placed = [];
        const muted = shape.frets.map((f, s) => (f < 0 ? s : -1)).filter((s) => s >= 0);
        const draw = () => {
          const pts = placed.map((q) => ({ ...q, tone: "good", label: q.finger ? String(q.finger) : "" }));
          if (k < steps.length) pts.push({ ...steps[k], label: steps[k].finger ? String(steps[k].finger) : "", tone: "lit", pop: true });
          inst.fb.show(pts, { muted });
        };
        // 3. It stays on screen: "That's the G chord", then Next chord.
        const strumNow = () => {
          inst.fb.showShape(shape);
          strum(shapeMidis(shape), { direction: "down" });
          success({ stay: true, next: card.next || "Next chord →" });
        };
        const prompt = () => {
          if (k < steps.length) {
            const q = steps[k];
            controls.innerHTML = `<span class="jg-card-step">${q.finger ? `Finger <b>${q.finger}</b> (${FINGER_NAMES[q.finger]}): ` : ""}${STRING_NAME[q.string]} string, fret <b>${q.fret}</b>${steps.length > 1 ? ` (${k + 1} of ${steps.length})` : ""}</span>` + micButton();
          } else {
            controls.innerHTML = `<button class="jg-btn jg-btn-primary jg-card-strum">${icon("guitar", 20)} Strum it!</button>` + micButton();
            controls.querySelector(".jg-card-strum").addEventListener("click", strumNow);
          }
          wireMic();
          draw();
        };
        inst.fb.onTap(({ string, fret }) => {
          if (k >= steps.length || finished) return;
          const q = steps[k];
          if (string === q.string && fret === q.fret) { placed.push(q); k++; prompt(); }
          else oops(`Almost! Look for the glowing dot: ${STRING_NAME[q.string]} string, fret ${q.fret}.`);
        });
        // On your real guitar: the right note (or, once placed, notes of the chord) counts.
        const heard = [];
        const off = onNoteOn((midi, src) => {
          if (src !== "mic" || finished) return;
          if (k >= steps.length) {
            const pcs = new Set(shapeMidis(shape).map((m) => m % 12));
            if (pcs.has(midi % 12)) heard.push(midi % 12);
            if (new Set(heard).size >= 2) strumNow();
          } else if (midi % 12 === midiAt(steps[k].string, steps[k].fret) % 12) {
            placed.push(steps[k]); k++;
            prompt();
          }
        });
        cleanups.push(off);
        prompt();
      }
      cleanups.push(() => inst.fb.onTap(null));
    }

    function setupTask() {
      if (w.song) {
        const song = findSong(w.song);
        extra.innerHTML = song ? songCardHtml(song) : "";
        wireVideos(extra);
        wireSongCards(extra);
        extra.querySelectorAll("[data-dgc]").forEach((b) => b.addEventListener("click", () => strum(shapeMidis(chordShape(b.dataset.dgc)))));
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.tap || "Next song →"}</button>`;
        controls.firstElementChild.addEventListener("click", () => success());
      } else if (w.compare) {
        extra.innerHTML = `<div class="jg-compare">${w.compare.map((c) => `<button class="jg-compare-item" data-c="${c}" type="button">${chordDiagramSvg(chordShape(c), c)}<span>${icon("speaker", 14)} Hear it</span></button>`).join("")}</div>${w.note ? `<p class="jg-compare-note">${w.note}</p>` : ""}`;
        const pick = (c) => {
          extra.querySelectorAll("[data-c]").forEach((b) => b.classList.toggle("jg-compare-on", b.dataset.c === c));
          inst.fb.showShape(chordShape(c));
        };
        extra.querySelectorAll("[data-c]").forEach((b) => b.addEventListener("click", () => { pick(b.dataset.c); strum(shapeMidis(chordShape(b.dataset.c))); }));
        pick(w.compare[0]);
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.tap || "Got it 👍"}</button>`;
        controls.firstElementChild.addEventListener("click", () => success());
      } else if (w.morph) {
        const pairs = w.morph;
        extra.innerHTML = `<div class="jg-row jg-morph-pills">${pairs.map(([a, b], k) => `<button class="jg-pill" data-m="${k}" type="button">${a} → ${b}</button>`).join("")}</div>
          <p class="jg-morph-phase"></p>${SWITCH_TIPS}`;
        const phase = extra.querySelector(".jg-morph-phase");
        const pick = (k) => {
          const [a, b] = pairs[k];
          extra.querySelectorAll("[data-m]").forEach((x) => x.classList.toggle("jg-pill-active", Number(x.dataset.m) === k));
          inst.fb.morph(chordShape(a), chordShape(b), { onPhase: (p) => {
            phase.innerHTML = p === "toB" ? `<b>${a} → ${b}</b>: the ringed fingers stay put ⚓, the others move together` : `and back: <b>${b} → ${a}</b>`;
            strum(shapeMidis(chordShape(p === "toB" ? b : a)), { delay: 0.75 });
          } });
          phase.innerHTML = `Starting on <b>${a}</b>…`;
        };
        extra.querySelectorAll("[data-m]").forEach((x) => x.addEventListener("click", () => pick(Number(x.dataset.m))));
        pick(0);
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.tap || "Got it 👍"}</button>`;
        controls.firstElementChild.addEventListener("click", () => { inst.fb.stopAnim(); success(); });
      } else if (w.strum || w.loop) {
        const o = w.strum || w.loop;
        const sl = createStrumLoop(extra, inst, o);
        cleanups.push(() => sl.destroy());
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.ok || "I played along! ✓"}</button>`;
        controls.firstElementChild.addEventListener("click", () => { sl.stop(); success(); });
      } else if (w.tap) {
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.tap}</button>`;
        controls.firstElementChild.addEventListener("click", () => success());
      } else if (w.tuner) {
        const t = renderStringTuner(extra);
        cleanups.push(() => t.destroy());
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.ok || "My guitar is in tune ✓"}</button>`;
        controls.firstElementChild.addEventListener("click", () => success());
      } else if (w.allCorrect) {
        // Every answer is right: keep all the options on screen, all green.
        extra.innerHTML = `<div class="jg-allcorrect">${w.options.map((o) => `<button class="jg-btn jg-card-choice" data-v="${o}" type="button">${o}</button>`).join("")}</div>`;
        extra.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => {
          if (finished) return;
          extra.querySelectorAll("[data-v]").forEach((x) => { x.classList.add("jg-card-right"); x.insertAdjacentText("afterbegin", "✓ "); });
          reply(w.allCorrect, "cheer");
          success({ stay: true });
        }));
      } else if (w.choice) {
        controls.innerHTML = w.options.map((o) => `<button class="jg-btn jg-card-choice" data-v="${o}">${o}</button>`).join("");
        controls.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => {
          if (b.dataset.v === w.choice) return success();
          b.classList.add("jg-card-wrong");
          oops(w.wrong || "Not quite! Have another look 🙈");
        }));
      } else if (w.string !== undefined) {
        inst.fb.show([{ string: w.string, fret: 0, tone: "root" }]);
        controls.innerHTML = micButton(); wireMic();
        inst.fb.onTap(({ string }) => string === w.string ? success() : oops(`That's the ${STRING_NAME[string]} string. Find the ${STRING_NAME[w.string]} one!`));
        const off = onNoteOn((midi, src) => { if (src === "mic" && midi % 12 === midiAt(w.string, 0) % 12) success(); });
        cleanups.push(off);
      } else if (w.chord) {
        chordTask();
      } else if (w.pos) {
        const steps = w.pos;
        let k = 0;
        const placed = [];
        const draw = () => {
          const pts = placed.map((q) => ({ ...q, tone: "good" }));
          if (k < steps.length) pts.push({ ...steps[k], tone: "lit", pop: true });
          inst.fb.show(pts);
        };
        const prompt = () => {
          const q = steps[k];
          controls.innerHTML = `<span class="jg-card-step">${STRING_NAME[q.string]} string, fret <b>${q.fret}</b></span>` + micButton();
          wireMic();
          draw();
        };
        const advance = () => { placed.push(steps[k]); k++; if (k >= steps.length) { draw(); success(); } else prompt(); };
        inst.fb.onTap(({ string, fret }) => {
          if (k >= steps.length) return;
          const q = steps[k];
          if (string === q.string && fret === q.fret) advance();
          else oops(`Almost! Look for the glowing dot: ${STRING_NAME[q.string]} string, fret ${q.fret}.`);
        });
        const off = onNoteOn((midi, src) => { if (src === "mic" && !finished && k < steps.length && midi % 12 === midiAt(steps[k].string, steps[k].fret) % 12) advance(); });
        cleanups.push(off);
        prompt();
      } else if (w.practice) {
        inst = mountInstrument(panel.querySelector(".jg-card-board"), { frets: 12, highway: true });
        cleanups.push(() => inst.hw.destroy());
        const box = createPracticeBox(extra, inst, { ...w.practice, key: `${lesson.id}:card${i}`, preferWait: true });
        cleanups.push(() => box.destroy());
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.ok || "I played it! ✓"}</button>`;
        controls.firstElementChild.addEventListener("click", () => success());
      } else if (w.changes) {
        const stopDrill = changeDrill(extra, inst, w.changes);
        cleanups.push(() => stopDrill?.());
        controls.innerHTML = `<button class="jg-btn jg-btn-primary">${w.ok || "Done ✓"}</button>`;
        controls.firstElementChild.addEventListener("click", () => success());
      }
    }
    if (holdTask()) nextMore(); else setupTask();
  }
  show(start);
  return () => { clean(); if (micByUs) disableMic(); document.body.classList.remove("jg-lesson-open"); };
}

export { runCards };
