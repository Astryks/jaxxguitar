// The 2-minute daily review: a quick mix of what you've already learned,
// spaced so the things you miss come back sooner (a simple Leitner
// system: right answers move an item up a box and push it further into
// the future; a miss sends it back to box 1).
//   - Name that chord: a chord box, pick its name
//   - Major or minor? hear a chord, pick which
//   - Find the note: tap a note on a given string

import { chordShape, shapeMidis, midiAt, noteName, STRING_NAMES } from "./guitar-theory.js";
import { chordDiagramSvg } from "./fretboard.js";
import { strum } from "./guitar-audio.js";
import { mountInstrument } from "./practice-widget.js";
import { isLessonComplete, completeQuest, awardXp, recordDailyProgress } from "./storage.js";

const KEY = "jg_review";
const DONE_KEY = "jg_review_done";
const BOX_DAYS = [0, 1, 2, 4, 7, 14];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const dayNum = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; }
}
function save(v) {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ignore */ }
}
function reviewDoneToday() {
  try { return localStorage.getItem(DONE_KEY) === today(); } catch (e) { return false; }
}

// Chords you've met, by lesson
const CHORDS_BY_LESSON = [
  ["lesson-1", ["G", "D", "Em", "C"]],
  ["lesson-minor", ["E", "Em", "A", "Am"]],
  ["lesson-more", ["Dm"]],
  ["lesson-power", ["E5", "A5"]],
  ["lesson-barre", ["F", "Bm"]],
  ["lesson-sevenths", ["A7", "D7", "E7"]],
];
function knownChords() {
  const set = new Set(["G", "D", "Em", "C"]);
  CHORDS_BY_LESSON.forEach(([id, cs]) => { if (isLessonComplete(id)) cs.forEach((c) => set.add(c)); });
  return [...set];
}

function buildPool() {
  const pool = knownChords().map((c) => ({ id: `name:${c}`, kind: "name", chord: c }));
  const mm = [["E", "Em"], ["A", "Am"], ["D", "Dm"], ["C", "Cm"], ["G", "Gm"]];
  mm.forEach(([maj, min]) => {
    pool.push({ id: `ear:${maj}`, kind: "ear", chord: maj, answer: "Major" });
    pool.push({ id: `ear:${min}`, kind: "ear", chord: min, answer: "Minor" });
  });
  [0, 1, 5].forEach((s) => [1, 3, 5, 7, 8, 10, 12].forEach((f) => {
    const m = midiAt(s, f);
    if ([0, 2, 4, 5, 7, 9, 11].includes(m % 12)) pool.push({ id: `note:${s}:${m % 12}`, kind: "note", string: s, pc: m % 12, name: noteName(m) });
  }));
  return pool;
}

function pickItems(n) {
  const state = load();
  const now = dayNum();
  const pool = buildPool().map((it) => {
    const st = state[it.id] || { box: 0, due: 0 };
    return { ...it, st, score: (st.due <= now ? 0 : 10) + st.box + Math.random() * 2 };
  });
  pool.sort((a, b) => a.score - b.score);
  return pool.slice(0, n).sort(() => Math.random() - 0.5);
}

function grade(item, ok) {
  const state = load();
  const st = state[item.id] || { box: 0, due: 0 };
  const box = ok ? Math.min(5, st.box + 1) : 1;
  state[item.id] = { box, due: dayNum() + BOX_DAYS[box] };
  save(state);
}

function openDailyReview(panel, { onClose }) {
  const items = pickItems(14);
  let i = 0;
  let right = 0;
  let left = 120;
  panel.innerHTML = `
    <div class="jg-lesson-player">
      <button class="jg-exit">← Back</button>
      <div class="jg-row"><strong>🧠 2-minute daily review</strong><span class="jg-label jg-dr-time">2:00</span><span class="jg-label jg-dr-score"></span></div>
      <div class="jg-card jg-dr-body"></div>
      <div class="jg-instrument-host"></div>
    </div>`;
  const body = panel.querySelector(".jg-dr-body");
  const inst = mountInstrument(panel.querySelector(".jg-instrument-host"), { highway: false });
  const timeEl = panel.querySelector(".jg-dr-time");
  const scoreEl = panel.querySelector(".jg-dr-score");
  let finished = false;
  const timer = setInterval(() => {
    if (!panel.isConnected) return clearInterval(timer);
    left--;
    timeEl.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    if (left <= 0) finish();
  }, 1000);
  panel.querySelector(".jg-exit").addEventListener("click", () => { clearInterval(timer); inst.fb.onTap(null); onClose(); });

  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    inst.fb.onTap(null);
    try { localStorage.setItem(DONE_KEY, today()); } catch (e) { /* ignore */ }
    completeQuest("review");
    awardXp(right * 2, "Daily review");
    recordDailyProgress();
    body.innerHTML = `<div class="jg-big">${right} / ${i}</div><p style="text-align:center">Review done for today — the ones you missed will come back sooner.</p>
      <div class="jg-row" style="justify-content:center"><button class="jg-btn jg-btn-primary jg-dr-close">Back to lessons</button></div>`;
    body.querySelector(".jg-dr-close").addEventListener("click", onClose);
  }

  function next(ok, item) {
    grade(item, ok);
    if (ok) right++;
    i++;
    scoreEl.textContent = `${right} right`;
    setTimeout(() => (i >= items.length ? finish() : ask()), ok ? 600 : 1400);
  }

  function choices(item, opts, answer) {
    body.querySelector(".jg-dr-choices").innerHTML = opts.map((o) => `<button class="jg-btn" data-a="${o}">${o}</button>`).join("");
    body.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => {
      if (body.dataset.answered) return;
      body.dataset.answered = "1";
      const ok = b.dataset.a === answer;
      b.classList.add(ok ? "jg-btn-primary" : "jg-quiz-bad");
      if (!ok) body.querySelector(`[data-a="${answer}"]`).classList.add("jg-btn-primary");
      next(ok, item);
    }));
  }

  function ask() {
    if (finished) return;
    const item = items[i];
    delete body.dataset.answered;
    inst.fb.onTap(null);
    inst.fb.clear();
    if (item.kind === "name") {
      const others = knownChords().filter((c) => c !== item.chord).sort(() => Math.random() - 0.5).slice(0, 3);
      body.innerHTML = `<p><strong>Which chord is this?</strong></p><div class="jg-diagram-row">${chordDiagramSvg(chordShape(item.chord), " ")}</div><div class="jg-row jg-dr-choices"></div>`;
      choices(item, [item.chord, ...others].sort(), item.chord);
    } else if (item.kind === "ear") {
      body.innerHTML = `<p><strong>Listen: major (bright) or minor (sad)?</strong></p><div class="jg-row"><button class="jg-btn jg-dr-play">🔊 Play again</button></div><div class="jg-row jg-dr-choices"></div>`;
      const play = () => strum(shapeMidis(chordShape(item.chord)));
      body.querySelector(".jg-dr-play").addEventListener("click", play);
      play();
      choices(item, ["Major", "Minor"], item.answer);
    } else {
      const sName = item.string === 0 ? "low E" : item.string === 5 ? "high e" : STRING_NAMES[item.string];
      body.innerHTML = `<p><strong>Tap ${item.name} on the ${sName} string</strong> (on the fretboard below)</p><p class="jg-dr-msg"></p>`;
      inst.fb.onTap(({ string, fret, midi }) => {
        if (body.dataset.answered) return;
        body.dataset.answered = "1";
        const ok = string === item.string && midi % 12 === item.pc;
        if (!ok) {
          const f = [...Array(13).keys()].find((k) => k > 0 && midiAt(item.string, k) % 12 === item.pc);
          inst.fb.show([{ string: item.string, fret: f, tone: "good", label: item.name }]);
          body.querySelector(".jg-dr-msg").innerHTML = `<span class="jg-quiz-bad">It's at fret ${f}.</span>`;
        } else {
          inst.fb.show([{ string, fret, tone: "good", label: item.name }]);
        }
        next(ok, item);
      });
    }
  }
  ask();
}

export { openDailyReview, reviewDoneToday };
