import { icon } from "./icons.js";
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
import { peopleHtml, videoHtml, wireVideos } from "./media.js";

// Jaxx the kitten — a different pose for each kind of moment.
const MASCOT_BY_LESSON = {
  "p-guitar": "keyhole", "p-parts": "map-glasses", "p-howitworks": "wrenches", "p-strings": "tangled-strings",
  "p-fretboard": "top-hat-shelf", "p-press": "strumming", "lesson-1": "happy-guitar", "lesson-strum": "strumming",
  "lesson-changes": "running-guitar", "lesson-minor": "playing-guitar", "lesson-more": "playing-guitar", "lesson-open-barre": "strumming",
  "lesson-lespaul": "singing-stage", "lesson-capo": "strumming", "lesson-tab": "quill-scroll", "lesson-power": "running-guitar",
  "lesson-redspecial": "wrenches", "lesson-barre": "strumming", "lesson-sevenths": "singing-mic",
  "lesson-pentatonic": "sheet-music-jump", "lesson-major-scale": "music-scrolls", "lesson-techniques": "tangled-strings",
  "lesson-minor-scales": "music-scrolls", "lesson-hotel": "singing-stage", "lesson-november": "singing-stage",
  "lesson-fingerpicking": "playing-guitar", "lesson-stairway": "playing-guitar", "lesson-caged": "map-glasses",
  "lesson-greensleeves": "cello", "lesson-modes": "big-pen", "lesson-wmggw": "singing-stage",
};
function mascot(name, alt = "Jaxx the kitten", extra = "") {
  return `<div class="jg-avatar ${extra}"><img src="assets/mascot/${name}.webp" alt="${alt}" loading="lazy"></div>`;
}

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
          <p>Key: <strong>${esc(song.key || "?")}</strong>${song.year ? ` · ${song.year}` : ""}. The main loop: <strong>${esc(song.chords.join(" – "))}</strong>.</p>
          ${capoLine}
          ${barre.length ? `<p class="jg-note">${barre.join(", ")} ${barre.length === 1 ? "is a barre chord" : "are barre chords"} — see the Barre chords lesson, or play just the top 4 strings for now${barre.includes("F") ? " (for F, use the baby F from the Open chords, barre chords lesson)" : ""}.</p>` : ""}
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
// Chord pages: the app can't strum for you; the real practice is on your guitar.
const PHONE_NOTE = `<p class="jg-phone-note">${icon("guitar", 18)}<span>I know it's hard to play a chord on the app! On your phone you can tap the notes one at a time. The real practice is on <strong>your guitar</strong>: there, press all the strings and strum them together.</span></p>`;

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
  ensureLessonsTab();
  runCleanup();
  const nxt = nextLesson();
  const streak = getStreak();
  const goal = getDailyGoal();
  const quests = getQuests();
  const done = allLessons().filter((l) => isLessonComplete(l.id)).length;
  const freezes = getStreakFreezes();
  const total = allLessons().filter((l) => !l.world).length;
  const say = (pose, inner, extra = "") => `<div class="jg-say ${extra}">${mascot(pose)}<div class="jg-bubble">${inner}</div></div>`;
  // Home: one big card to start or continue, and "Upload any song". The
  // roadmap, review and quests live in the lessons themselves.
  const number = done + 1;
  const pct = Math.round((100 * done) / Math.max(1, total));
  const hero = nxt ? `
    <button class="jg-hero-card" data-lesson="${nxt.id}">
      ${mascot(done ? "happy-guitar" : "strumming")}
      <span class="jg-hero-body">
        <span class="jg-hero-kicker">${done ? `Lesson ${number} of ${total}` : "Start here"}</span>
        <span class="jg-hero-title">${esc(done ? nxt.title : "4 chords, 100+ songs")}</span>
        <span class="jg-hero-bar"><span style="width:${Math.max(3, pct)}%"></span></span>
        ${streak.count ? `<span class="jg-hero-meta">${icon("flame", 16)} ${streak.count}-day streak</span>` : ""}
        <span class="jg-hero-cta">${done ? "Continue ▶" : "Start now ▶"}</span>
      </span>
    </button>` : `<div class="jg-hero-card">${mascot("juggling-picks")}<span class="jg-hero-body"><span class="jg-hero-title">You've finished every lesson! 🎉</span></span></div>`;
  panelEl.innerHTML = `
    <div class="jg-home-clean">
      ${hero}
      <button class="jg-home-upload" data-home-upload type="button">
        ${icon("cassette", 44)}
        <span><b>Upload any song</b><span>and we'll find the chords for you</span></span>
        <span class="jg-home-upload-go">Upload</span>
      </button>
      <button class="jg-home-how" data-home-how type="button">${icon("star", 18)} How it works &amp; support us</button>
      <p class="jg-home-credit">Supported by the Astryks Group (<a href="https://astryks.com" target="_blank" rel="noopener">astryks.com</a>)</p>
    </div>`;
  panelEl.querySelector("[data-home-how]")?.addEventListener("click", () => window.dispatchEvent(new CustomEvent("jg-show", { detail: "how" })));
  panelEl.querySelector("[data-home-upload]")?.addEventListener("click", () => {
    document.querySelector('.jg-tab[data-tab="practice"]')?.click();
    setTimeout(() => {
      const pill = [...document.querySelectorAll("#panel-practice button")].find((x) => /upload/i.test(x.textContent));
      pill?.click();
      setTimeout(() => document.querySelector('#panel-practice input[type="file"]')?.click(), 50);
    }, 50);
  });
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
// A diagram is a chord symbol ("G") or a custom shape { name, frets, fingers, barre } (e.g. the baby F).
const diagramOf = (c) => (typeof c === "string" ? { name: c, shape: chordShape(c) } : { name: c.name, shape: c });
// Called from outside the Lessons tab too (e.g. a song's lesson): make
// sure the Lessons tab is the one showing first.
function ensureLessonsTab() {
  const panel = document.getElementById("panel-lessons");
  if (!panelEl || panel.classList.contains("jg-hidden")) document.querySelector('.jg-tab[data-tab="lessons"]')?.click();
}

function openLesson(id, pageIndex = 0) {
  ensureLessonsTab();
  const lesson = allLessons().find((l) => l.id === id);
  if (!lesson) return showHome();
  runCleanup();
  const page = lesson.pages[pageIndex];
  const last = pageIndex === lesson.pages.length - 1;
  const needsBoard = page.shape || page.notes || page.practice || page.fretQuiz || page.caged || page.diagrams || page.changes || page.earGym;
  panelEl.innerHTML = `
    <div class="jg-lessons-layout">
      <div class="jg-lesson-main jg-lesson-player">
        <div class="jg-lesson-content">
          <button class="jg-exit">← All lessons</button>
          <div class="jg-step">${esc(lesson.title)} · ${pageIndex + 1} of ${lesson.pages.length}</div>
          <div class="jg-say">${mascot(MASCOT_BY_LESSON[lesson.id] || (lesson.world ? "singing-mic" : lesson.song ? "playing-guitar" : "happy-guitar"))}<div class="jg-bubble">${page.html || ""}${page.shape ? PHONE_NOTE : ""}${peopleHtml(page.people)}${videoHtml(page.video)}</div></div>
          ${page.diagrams ? `<div class="jg-diagram-row">${page.diagrams.map((c, i) => { const d = diagramOf(c); return `<button class="jg-btn jg-dg-btn" data-dg="${i}" title="Show ${esc(d.name)} on the fretboard">${chordDiagramSvg(d.shape, d.name)}</button>`; }).join("")}</div><p class="jg-note">Tap a chord box to see it on the fretboard and hear it.</p>` : ""}
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
  wireVideos(panelEl);
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
    const sh = diagramOf(page.diagrams[Number(b.dataset.dg)]).shape;
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
  if (page.earGym) earGym(extra, inst);
  if (page.changes) changeDrill(extra, inst, page.changes);
  if (page.caged) cagedPicker(extra, inst);
}

function finishScreen(lesson, nxt) {
  panelEl.innerHTML = `
    <div class="jg-say">${mascot("juggling-picks", "Jaxx celebrating", "jg-mascot-celebrate")}<div class="jg-bubble">
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
// Chord Ear Gym: listen and name the chord. Round 1 happy or sad, round 2
// all 24 chords with 4 choices (one is always the same letter, other mood),
// round 3 the chords played different ways: strummed, picked one string at
// a time, or higher up. A wrong answer plays both chords to compare.
function earGym(host, inst) {
  const ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  const ALL = [...ROOTS, ...ROOTS.map((r) => r + "m")];
  const nice = (c) => c.replace("#", "♯").replace(/^([A-G])b/, "$1♭");
  const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const STAGES = [
    { id: "mood", title: "Round 1: Happy or sad?", chords: shuffle(ALL).slice(0, 8) },
    { id: "name", title: "Round 2: Which chord?", chords: shuffle(ALL) },
    { id: "ways", title: "Round 3: Played different ways", chords: shuffle(ALL).slice(0, 12) },
  ];
  let stage = 0, round = 0, streak = 0, best = 0, cur = null;
  const scores = STAGES.map(() => 0);
  const play = (c, how = "strum") => {
    const midis = shapeMidis(chordShape(c));
    if (how === "high") return strum(midis.map((m) => m + 12));
    if (how === "pick") return midis.forEach((m, i) => setTimeout(() => strum([m]), i * 220));
    strum(midis);
  };
  function options(c) {
    const minor = c.endsWith("m");
    const twin = minor ? c.slice(0, -1) : c + "m";
    return shuffle([c, twin, ...shuffle(ALL.filter((x) => x !== c && x !== twin)).slice(0, 2)]);
  }
  function startStage() {
    round = 0;
    host.innerHTML = `<div class="jg-card jg-gym"><h3>${STAGES[stage].title}</h3><p>${STAGES[stage].chords.length} chords. Ready?</p><button class="jg-btn jg-btn-primary jg-gym-go">Start</button></div>`;
    host.querySelector(".jg-gym-go").addEventListener("click", ask);
  }
  function ask() {
    const st = STAGES[stage];
    const c = st.chords[round];
    cur = { c, how: st.id === "ways" ? ["strum", "pick", "high"][Math.floor(Math.random() * 3)] : "strum" };
    const choices = st.id === "mood" ? [["major", "Happy (major)"], ["minor", "Sad (minor)"]] : options(c).map((x) => [x, nice(x)]);
    inst.fb.show([]);
    host.innerHTML = `<div class="jg-card jg-gym">
      <div class="jg-gym-head"><b>${st.title}</b><span>${round + 1} / ${st.chords.length}</span><span>${icon("flame", 16)} ${streak}</span></div>
      <p class="jg-gym-ask">${st.id === "mood" ? "Happy or sad?" : "Which chord is this?"}${st.id === "ways" ? `<br><small>(${({ strum: "strummed", pick: "picked one string at a time", high: "played higher up" })[cur.how]})</small>` : ""}</p>
      <div class="jg-gym-choices">${choices.map(([v, l]) => `<button class="jg-gym-choice" data-v="${v}">${l}</button>`).join("")}</div>
      <div class="jg-gym-reply"></div>
      <div class="jg-row"><button class="jg-btn jg-gym-again">${icon("speaker", 18)} Play it again</button></div></div>`;
    host.querySelector(".jg-gym-again").addEventListener("click", () => play(cur.c, cur.how));
    host.querySelectorAll(".jg-gym-choice").forEach((b) => b.addEventListener("click", () => answer(b)));
    setTimeout(() => play(cur.c, cur.how), 250);
  }
  function answer(btn) {
    const st = STAGES[stage];
    const right = st.id === "mood" ? (cur.c.endsWith("m") ? "minor" : "major") : cur.c;
    host.querySelectorAll(".jg-gym-choice").forEach((b) => { b.disabled = true; if (b.dataset.v === right) b.classList.add("jg-gym-right"); });
    inst.fb.showShape(chordShape(cur.c));
    const reply = host.querySelector(".jg-gym-reply");
    const last = round + 1 >= st.chords.length;
    const nextBtn = `<button class="jg-btn jg-btn-primary jg-gym-next">${last ? "Finish round →" : "Next chord →"}</button>`;
    if (btn.dataset.v === right) {
      scores[stage]++; streak++; best = Math.max(best, streak);
      reply.innerHTML = `<p class="jg-quiz-ok">Yes! ${nice(cur.c)}${streak >= 3 ? ` · ${icon("flame", 16)} ${streak} in a row!` : ""}</p>${nextBtn}`;
      const t = setTimeout(next, 1400);
      reply.querySelector(".jg-gym-next").addEventListener("click", () => { clearTimeout(t); next(); });
    } else {
      streak = 0;
      btn.classList.add("jg-gym-wrong");
      const picked = btn.dataset.v;
      reply.innerHTML = `<p class="jg-quiz-bad">It was <b>${nice(cur.c)}</b> (${cur.c.endsWith("m") ? "sad, minor" : "happy, major"}).</p>
        ${st.id === "mood" ? "" : `<div class="jg-row"><button class="jg-btn jg-gym-h1">${icon("speaker", 16)} ${nice(cur.c)}</button><button class="jg-btn jg-gym-h2">${icon("speaker", 16)} ${nice(picked)}</button></div>`}${nextBtn}`;
      reply.querySelector(".jg-gym-h1")?.addEventListener("click", () => { inst.fb.showShape(chordShape(cur.c)); play(cur.c); });
      reply.querySelector(".jg-gym-h2")?.addEventListener("click", () => { inst.fb.showShape(chordShape(picked)); play(picked); });
      reply.querySelector(".jg-gym-next").addEventListener("click", next);
      play(cur.c, cur.how);
    }
  }
  function next() {
    if (!host.isConnected) return;
    round++;
    if (round < STAGES[stage].chords.length) return ask();
    const st = STAGES[stage];
    const got = scores[stage];
    stage++;
    const done = stage >= STAGES.length;
    host.innerHTML = `<div class="jg-card jg-gym"><h3>${st.title.split(":")[0]} done!</h3>
      <p>You got <b>${got} of ${st.chords.length}</b> right. ${got / st.chords.length >= 0.8 ? "Amazing ears!" : got / st.chords.length >= 0.5 ? "Your ears are getting sharp!" : "Ears get better with practice!"}</p>
      ${done ? `<p>Best streak: <b>${best}</b> in a row. Come back any time: a few minutes a day makes a big difference.</p>` : ""}
      <div class="jg-row">${done ? `<button class="jg-btn jg-gym-replay">Play again</button>` : `<button class="jg-btn jg-gym-redo">Try that round again</button><button class="jg-btn jg-btn-primary jg-gym-on">Next round →</button>`}</div></div>`;
    host.querySelector(".jg-gym-replay")?.addEventListener("click", () => { stage = 0; scores.fill(0); best = 0; streak = 0; startStage(); });
    host.querySelector(".jg-gym-redo")?.addEventListener("click", () => { stage--; scores[stage] = 0; startStage(); });
    host.querySelector(".jg-gym-on")?.addEventListener("click", startStage);
    if (done) awardXp(10, "Chord Ear Gym");
  }
  startStage();
}

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
