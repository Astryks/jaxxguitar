// Lessons tab: home (daily review, quests, next lesson), the roadmap,
// and a generic lesson player that renders the page specs in
// lessons-data.js. Song lessons ("Master a song") and the optional
// World songs lessons are generated from the song library.

import { PRE, BEGINNER, INTERMEDIATE, ADVANCED, strumItems } from "./lessons-data.js";
import { chordShape, midiAt, noteName, STRING_NAMES, shapeMidis } from "./guitar-theory.js";
import { chordDiagramSvg, tabSvg } from "./fretboard.js";
import { strum } from "./guitar-audio.js";
import { mountInstrument, createPracticeBox } from "./practice-widget.js";
import { renderStringTuner } from "./tuner.js";
import { songPlan, songsByTier } from "./song-plan.js";
import { WORLD_LANGUAGES } from "./songs-data.js";
import { isLessonComplete, markLessonComplete, markSongStatus, getQuests, getStreak, getDailyGoal, awardXp, getStreakFreezes } from "./storage.js";
import { openDailyReview, reviewDoneToday } from "./daily-review.js";

const DDUUDU = ["down", null, "down", "up", null, "up", "down", "up"];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// --- Generated lessons ---------------------------------------------------
function songLesson(song, { tier, world = false } = {}) {
  const plan = songPlan(song);
  const unique = [...new Set(plan.shapes)];
  const capoLine = plan.capo
    ? `<p>The easy way on guitar: put a <strong>capo on fret ${plan.capo}</strong> and play the shapes <strong>${unique.join(" – ")}</strong>. It sounds exactly like ${esc(song.chords.join(" – "))}.</p>`
    : `<p>No capo needed — play the shapes as written.</p>`;
  const barre = unique.filter((c) => chordShape(c)?.barre);
  return {
    id: `song-${song.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: `${world ? "" : "Master: "}${song.title}`,
    subtitle: song.artist,
    tier,
    song,
    pages: [
      {
        html: `<h3>${esc(song.title)} — ${esc(song.artist)}</h3>
          <p>Key: <strong>${esc(song.key || "?")}</strong>${song.year ? ` · ${song.year}` : ""}. The main loop: <strong>${esc(song.chords.join(" – "))}</strong>${song.degreeSequence ? ` (${esc(song.degreeSequence)})` : ""}.</p>
          ${capoLine}
          ${barre.length ? `<p class="jg-note">${barre.join(", ")} ${barre.length === 1 ? "is a barre chord" : "are barre chords"} — see the Barre chords lesson, or play just the top 4 strings for now.</p>` : ""}
          ${song.confidence === "needs-verification" ? '<p class="jg-note">Sources didn\'t fully agree on this one\'s chords — treat it as a close version, and trust your ears.</p>' : ""}
          <p class="jg-note">This is the song's main repeating loop, not a full chart — no lyrics are included. Play the original alongside to hear how it fits.</p>`,
        diagrams: unique,
      },
      {
        html: `<h3>Play along</h3><p>Four beats per chord with the D · D U · U D U strum. Start at 50–75% speed, then switch on the beat.</p>`,
        diagrams: unique,
        practice: { items: strumItems(plan.shapes.concat(plan.shapes), DDUUDU), bpm: 80, modes: ["listen", "wait"], label: `${song.title}${plan.capo ? ` (capo ${plan.capo})` : ""}`, drums: true, key: `song:${song.title}` },
      },
    ],
  };
}

function worldLessons() {
  return WORLD_LANGUAGES.map((lang) => {
    const songs = songsByTier("Advanced", { world: true }).concat(songsByTier("Intermediate", { world: true }), songsByTier("Beginner", { world: true }))
      .filter((s) => s.genre === `World — ${lang.name}`);
    return {
      id: `world-${lang.slug}`,
      world: true,
      title: `${lang.flag} ${lang.name} songs`,
      subtitle: `${songs.length} popular songs · optional`,
      pages: songs.flatMap((s) => {
        const l = songLesson(s, { world: true });
        return [{ ...l.pages[0] }, { ...l.pages[1] }];
      }),
    };
  }).filter((l) => l.pages.length);
}

const SONGS_PER_TIER = 8;
function tierSongLessons(tier) {
  return songsByTier(tier).slice(0, SONGS_PER_TIER).map((s) => songLesson(s, { tier }));
}

let SECTIONS = null;
function sections() {
  if (SECTIONS) return SECTIONS;
  SECTIONS = [
    { name: "Before you start", note: "Optional — skip ahead if you've played before", lessons: PRE },
    { name: "Beginner", lessons: [...BEGINNER, ...tierSongLessons("Beginner")] },
    { name: "Intermediate", lessons: [...INTERMEDIATE, ...tierSongLessons("Intermediate")] },
    { name: "Advanced", lessons: [...ADVANCED, ...tierSongLessons("Advanced")] },
    { name: "World songs", note: "Optional — popular songs in 10 languages. Skip any you like.", lessons: worldLessons(), optional: true },
  ];
  return SECTIONS;
}
function allLessons() {
  return sections().flatMap((s) => s.lessons);
}
function nextLesson() {
  return allLessons().find((l) => !l.pre && !l.world && !isLessonComplete(l.id)) || null;
}

// --- Tab render ------------------------------------------------------------
let panelEl = null;
let cleanup = [];
function runCleanup() {
  cleanup.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  cleanup = [];
}

function renderLessons(panel) {
  panelEl = panel;
  showHome();
}

function roadmapHtml(currentId) {
  const nxt = nextLesson();
  let n = 0;
  return sections().map((sec) => `
    <div class="jg-section-head">${sec.name}</div>
    ${sec.note ? `<div class="jg-note" style="margin-bottom:4px">${sec.note}</div>` : ""}
    ${sec.optional ? `<details><summary class="jg-btn jg-btn-small">Show ${sec.lessons.length} optional lessons</summary>` : ""}
    ${sec.lessons.map((l) => {
      const done = isLessonComplete(l.id);
      const num = l.pre || l.world ? (done ? "✓" : "•") : (done ? "✓" : ++n);
      const cls = ["jg-node", done ? "jg-node-done" : "", (currentId ? l.id === currentId : nxt && l.id === nxt.id) ? "jg-node-current" : ""].join(" ");
      return `<button class="${cls}" data-lesson="${l.id}"><span class="jg-node-num">${num}</span><span>${esc(l.title)}${l.fun ? '<span class="jg-tag">fun</span>' : ""}<span class="jg-sub">${esc(l.subtitle || "")}</span></span></button>`;
    }).join("")}
    ${sec.optional ? "</details>" : ""}`).join("");
}

function showHome() {
  runCleanup();
  const nxt = nextLesson();
  const streak = getStreak();
  const goal = getDailyGoal();
  const quests = getQuests();
  const done = allLessons().filter((l) => isLessonComplete(l.id)).length;
  const freezes = getStreakFreezes();
  panelEl.innerHTML = `
    <div class="jg-lessons-layout">
      <div class="jg-lesson-main">
        ${reviewDoneToday() ? "" : '<button class="jg-review-banner jg-open-review">🧠 Your 2-minute daily review is ready — tap to start</button>'}
        <div class="jg-say"><div class="jg-avatar">🎸</div><div class="jg-bubble">
          ${nxt ? `<h3>${done ? "Welcome back!" : "Welcome to Jaxx Guitar!"}</h3>
            <p>${done ? "Up next:" : "Start here — in your first lesson you'll learn the four chords behind hundreds of songs."}</p>
            <p><strong>${esc(nxt.title)}</strong><span class="jg-sub">${esc(nxt.subtitle || "")}</span></p>
            <button class="jg-btn jg-btn-primary" data-lesson="${nxt.id}">${done ? "Continue" : "Start Lesson 1"}</button>
            ${done ? "" : '<button class="jg-btn" data-lesson="p-guitar">New to guitar? Start with the basics</button>'}`
            : "<h3>You've finished every lesson! 🎉</h3><p>Keep your streak going with the daily review, the song library, and the World songs.</p>"}
        </div></div>
        <div class="jg-quests">
          <div class="jg-row"><strong>Today</strong>
            <span class="jg-label">🔥 ${streak.count}-day streak${freezes ? ` · ❄️ ${freezes}` : ""} · daily goal ${goal.metToday ? "✓ met" : "— finish 1 lesson or song"}</span></div>
          ${quests.map((q) => `<div class="jg-quest ${q.done ? "jg-quest-done" : ""}">${q.done ? "✅" : "⬜"} ${q.text} <span class="jg-label">+10 XP</span></div>`).join("")}
        </div>
        <p class="jg-note">${done} of ${allLessons().filter((l) => !l.world).length} lessons done. Lessons are a guide, not a gate — open any of them from the roadmap.</p>
      </div>
      <aside class="jg-lesson-sidebar"><div class="jg-roadmap"><h3>Roadmap</h3><div class="jg-roadmap-list">${roadmapHtml()}</div></div></aside>
    </div>`;
  wireCommon();
}

function wireCommon() {
  panelEl.querySelectorAll("[data-lesson]").forEach((b) => b.addEventListener("click", () => openLesson(b.dataset.lesson)));
  panelEl.querySelector(".jg-open-review")?.addEventListener("click", () => {
    runCleanup();
    openDailyReview(panelEl, { onClose: showHome });
  });
}

// --- Lesson player -------------------------------------------------------------
function openLesson(id, pageIndex = 0) {
  const lesson = allLessons().find((l) => l.id === id);
  if (!lesson) return showHome();
  runCleanup();
  const page = lesson.pages[pageIndex];
  const last = pageIndex === lesson.pages.length - 1;
  const needsBoard = page.shape || page.notes || page.practice || page.fretQuiz || page.caged || page.diagrams || page.changes;
  panelEl.innerHTML = `
    <div class="jg-lessons-layout">
      <div class="jg-lesson-main jg-lesson-player">
        <div class="jg-lesson-content">
          <button class="jg-exit">← All lessons</button>
          <div class="jg-step">${esc(lesson.title)} · ${pageIndex + 1} of ${lesson.pages.length}</div>
          <div class="jg-say"><div class="jg-avatar">${lesson.fun ? "🤩" : "🎸"}</div><div class="jg-bubble">${page.html || ""}</div></div>
          ${page.diagrams ? `<div class="jg-diagram-row">${page.diagrams.map((c) => `<button class="jg-btn jg-dg-btn" data-chord="${esc(c)}" title="Show ${esc(c)} on the fretboard">${chordDiagramSvg(chordShape(c), c)}</button>`).join("")}</div><p class="jg-note">Tap a chord box to see it on the fretboard and hear it.</p>` : ""}
          ${page.tab ? `<div class="jg-tab-wrap">${tabSvg(page.tab.items, { beatsPerBar: page.tab.beatsPerBar, bars: page.tab.bars })}</div>` : ""}
          <div class="jg-extra"></div>
          <div class="jg-instrument-host"></div>
          <div class="jg-practice-host"></div>
        </div>
        <div class="jg-controls">
          ${pageIndex > 0 ? '<button class="jg-btn jg-prev">← Back</button>' : ""}
          <button class="jg-btn jg-btn-primary jg-next">${last ? "Finish lesson ✓" : "Next →"}</button>
        </div>
      </div>
      <aside class="jg-lesson-sidebar"><div class="jg-roadmap"><h3>Roadmap</h3><div class="jg-roadmap-list">${roadmapHtml(lesson.id)}</div></div></aside>
    </div>`;
  panelEl.scrollIntoView?.({ block: "start" });
  wireCommon();
  panelEl.querySelector(".jg-exit").addEventListener("click", showHome);
  panelEl.querySelector(".jg-prev")?.addEventListener("click", () => openLesson(id, pageIndex - 1));
  panelEl.querySelector(".jg-next").addEventListener("click", () => {
    if (!last) return openLesson(id, pageIndex + 1);
    markLessonComplete(lesson.id);
    if (lesson.song) markSongStatus(lesson.song.title, "completed");
    const nxt = nextLesson();
    runCleanup();
    finishScreen(lesson, nxt);
  });

  let inst = null;
  const restore = () => {
    if (!inst) return;
    if (page.shape) inst.fb.showShape(chordShape(page.shape));
    else if (page.notes) inst.fb.show(page.notes);
    else inst.fb.clear();
  };
  if (needsBoard) {
    inst = mountInstrument(panelEl.querySelector(".jg-instrument-host"), { frets: page.caged ? 15 : 12, highway: Boolean(page.practice) });
    cleanup.push(() => inst.hw.destroy());
    restore();
  }
  panelEl.querySelectorAll(".jg-dg-btn").forEach((b) => b.addEventListener("click", () => {
    const sh = chordShape(b.dataset.chord);
    inst.fb.showShape(sh);
    strum(shapeMidis(sh), { direction: "down" });
  }));
  if (page.practice) {
    const box = createPracticeBox(panelEl.querySelector(".jg-practice-host"), inst, { ...page.practice, key: page.practice.key || `${lesson.id}:${pageIndex}`, restore });
    cleanup.push(() => box.destroy());
  }
  const extra = panelEl.querySelector(".jg-extra");
  if (page.tuner) {
    const t = renderStringTuner(extra);
    cleanup.push(() => t.destroy());
  }
  if (page.fretQuiz) fretQuiz(extra, inst, page.fretQuiz.count || 6, restore);
  if (page.changes) changeDrill(extra, inst, page.changes);
  if (page.caged) cagedPicker(extra, inst);
}

function finishScreen(lesson, nxt) {
  panelEl.innerHTML = `
    <div class="jg-say"><div class="jg-avatar">🏆</div><div class="jg-bubble">
      <h3>Lesson complete: ${esc(lesson.title)}</h3>
      <p>Nice work! ${lesson.song ? "Song added to your learned list." : ""}</p>
      <div class="jg-row">
        ${nxt ? `<button class="jg-btn jg-btn-primary" data-lesson="${nxt.id}">Next: ${esc(nxt.title)} →</button>` : ""}
        <button class="jg-btn jg-home">Back to lessons</button>
      </div>
    </div></div>`;
  wireCommon();
  panelEl.querySelector(".jg-home").addEventListener("click", showHome);
}

// --- Page widgets ---------------------------------------------------------------
const NATURALS = new Set([0, 2, 4, 5, 7, 9, 11]);
function fretQuiz(host, inst, count, restore) {
  let asked = 0;
  let right = 0;
  let target = null;
  host.innerHTML = `<div class="jg-card"><div class="jg-big jg-q"></div><p class="jg-q-msg" style="text-align:center"></p></div>`;
  const q = host.querySelector(".jg-q");
  const msg = host.querySelector(".jg-q-msg");
  function ask() {
    if (asked >= count) {
      q.textContent = `${right} / ${count}`;
      msg.innerHTML = right >= count - 1 ? '<span class="jg-quiz-ok">Great — you can find notes on the fretboard!</span>' : "Good practice — try again any time.";
      awardXp(5, "Fretboard quiz");
      inst.fb.onTap(null);
      return restore();
    }
    const s = [0, 1, 0, 5, 1, 0][asked % 6];
    let f;
    do f = Math.floor(Math.random() * 13); while (!NATURALS.has(midiAt(s, f) % 12) || f === 0);
    target = { s, pc: midiAt(s, f) % 12 };
    q.textContent = `Tap ${noteName(midiAt(s, f))} on the ${s === 0 ? "low E" : s === 5 ? "high e" : STRING_NAMES[s]} string`;
    msg.textContent = `Question ${asked + 1} of ${count}`;
    inst.fb.show([]);
  }
  let missed = false;
  inst.fb.onTap(({ string, fret, midi }) => {
    if (!target) return;
    if (string === target.s && midi % 12 === target.pc) {
      if (!missed) right++;
      msg.innerHTML = '<span class="jg-quiz-ok">✓ Yes!</span>';
      inst.fb.show([{ string, fret, tone: "good", label: noteName(midi) }]);
      asked++;
      missed = false;
      target = null;
      setTimeout(ask, 700);
    } else {
      missed = true;
      msg.innerHTML = `<span class="jg-quiz-bad">That's ${noteName(midi)}${string !== target.s ? " — and check the string" : ""}.</span> Count up from the open string: E F · G · A · B C · D · E (· = a fret with a sharp/flat).`;
    }
  });
  ask();
}

function changeDrill(host, inst, [a, b]) {
  const key = `jg_changes_${a}_${b}`;
  let best = 0;
  try { best = Number(localStorage.getItem(key)) || 0; } catch (e) { /* ignore */ }
  host.innerHTML = `<div class="jg-card">
    <div class="jg-diagram-row">${chordDiagramSvg(chordShape(a), a)}${chordDiagramSvg(chordShape(b), b)}</div>
    <div class="jg-big jg-cd-count">0</div><p style="text-align:center" class="jg-cd-time">60 seconds · best ${best}</p>
    <div class="jg-row" style="justify-content:center"><button class="jg-btn jg-btn-primary jg-cd-start">Start 1 minute</button><button class="jg-btn jg-cd-tap" disabled>I changed! (+1)</button></div>
    <p class="jg-note">Each time you strum a clean ${a} → ${b} (or back), tap "I changed!" (or press the space bar).</p></div>`;
  let count = 0;
  let timer = null;
  let cur = a;
  const countEl = host.querySelector(".jg-cd-count");
  const timeEl = host.querySelector(".jg-cd-time");
  const tapBtn = host.querySelector(".jg-cd-tap");
  inst.fb.showShape(chordShape(a));
  const tap = () => {
    if (!timer) return;
    count++;
    countEl.textContent = count;
    cur = cur === a ? b : a;
    inst.fb.showShape(chordShape(cur));
  };
  const onKey = (e) => { if (e.code === "Space" && timer) { e.preventDefault(); tap(); } };
  window.addEventListener("keydown", onKey);
  cleanup.push(() => { window.removeEventListener("keydown", onKey); if (timer) clearInterval(timer); });
  tapBtn.addEventListener("click", tap);
  host.querySelector(".jg-cd-start").addEventListener("click", () => {
    if (timer) return;
    count = 0;
    countEl.textContent = "0";
    let left = 60;
    tapBtn.disabled = false;
    timer = setInterval(() => {
      left--;
      timeEl.textContent = `${left} seconds left`;
      if (left <= 0) {
        clearInterval(timer);
        timer = null;
        tapBtn.disabled = true;
        const record = count > best;
        if (record) {
          best = count;
          try { localStorage.setItem(key, String(best)); } catch (e) { /* ignore */ }
          awardXp(10, "New chord-change record");
        }
        timeEl.textContent = record ? `🎉 New record: ${count} changes!` : `${count} changes · best ${best}`;
      }
    }, 1000);
  });
}

const CAGED_C = [
  { name: "C shape (open)", frets: [-1, 3, 2, 0, 1, 0] },
  { name: "A shape · 3rd fret", frets: [-1, 3, 5, 5, 5, 3], barre: 3 },
  { name: "G shape · 5th fret", frets: [8, 7, 5, 5, 5, 8] },
  { name: "E shape · 8th fret", frets: [8, 10, 10, 9, 8, 8], barre: 8 },
  { name: "D shape · 10th fret", frets: [-1, -1, 10, 12, 13, 12] },
];
function cagedPicker(host, inst) {
  host.innerHTML = `<div class="jg-row">${CAGED_C.map((c, i) => `<button class="jg-pill" data-cg="${i}">${c.name}</button>`).join("")}</div>`;
  const pick = (i) => {
    host.querySelectorAll("[data-cg]").forEach((b) => b.classList.toggle("jg-pill-active", Number(b.dataset.cg) === i));
    const c = CAGED_C[i];
    const positions = c.frets.map((f, s) => (f >= 0 ? { string: s, fret: f, tone: midiAt(s, f) % 12 === 0 ? "root" : undefined, label: noteName(midiAt(s, f)) } : null)).filter(Boolean);
    inst.fb.show(positions, { muted: c.frets.map((f, s) => (f < 0 ? s : null)).filter((s) => s !== null), barre: c.barre ? { fret: c.barre } : null });
    strum(c.frets.map((f, s) => (f >= 0 ? midiAt(s, f) : null)).filter((m) => m !== null));
  };
  host.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cg]");
    if (b) pick(Number(b.dataset.cg));
  });
  pick(0);
}

export { renderLessons, allLessons, songLesson, openLesson, showHome };
