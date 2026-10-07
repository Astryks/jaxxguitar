import { icon } from "./icons.js";
// Lessons tab: home (daily review, quests, next lesson), the roadmap,
// and a generic lesson player that renders the page specs in
// lessons-data.js. Song lessons ("Master a song") and the optional
// World songs lessons are generated from the song library.

import { PRE, BEGINNER, INTERMEDIATE, ADVANCED, strumItems } from "./lessons-data.js";
import { chordShape, midiAt, noteName, STRING_NAMES, shapeMidis } from "./guitar-theory.js";
import { chordDiagramSvg, tabSvg } from "./fretboard.js";
import { strum, playNote, stopAllSound } from "./guitar-audio.js";
import { mountInstrument, createPracticeBox } from "./practice-widget.js";
import { renderStringTuner } from "./tuner.js";
import { songPlan, songsByTier } from "./song-plan.js";
import { WORLD_LANGUAGES } from "./songs-data.js";
import { isLessonComplete, markLessonComplete, markSongStatus, getQuests, getStreak, getDailyGoal, awardXp, getStreakFreezes } from "./storage.js";
import { openDailyReview, reviewDoneToday } from "./daily-review.js";
import { peopleHtml, videoHtml, wireVideos } from "./media.js";
import { teachHtml } from "./teach-videos.js";
import { lessonInspireHtml } from "./inspire.js";
import { runCards } from "./cards.js";
import { withSongs, songCardHtml, wireSongCards, findSong } from "./lesson-songs.js";
import { startChordListening } from "./chord-detect.js";
import { friendlyMicError } from "./pitch.js";
import { puppySvg, nextTrick, nextPuppyScene } from "./puppy.js";
import { homeGuitar, nextHomeGuitar, LEGENDS, sceneSvg } from "./scenes.js";
import { leftyToggleHtml, wireLeftyToggle } from "./settings.js";
import { tipJarHtml, wireTipJar } from "./tipjar.js";
// One guitar per visit on the home screen.
let homeGuitarThisVisit = null;

// Jaxx the puppy - a different pose for each kind of moment.
const MASCOT_BY_LESSON = {
  "p-guitar": "keyhole", "p-parts": "map-glasses", "p-howitworks": "wrenches", "p-strings": "tangled-strings",
  "p-fretboard": "top-hat-shelf", "p-press": "strumming", "lesson-1": "happy-guitar", "lesson-strum": "strumming",
  "lesson-changes": "running-guitar", "lesson-songs-quiz": "sheet-music-jump", "lesson-open-chords": "playing-guitar", "lesson-creep": "singing-stage", "lesson-genres": "juggling-picks", "lesson-minor": "playing-guitar", "lesson-more": "playing-guitar", "lesson-open-barre": "strumming",
  "lesson-lespaul": "singing-stage", "lesson-capo": "strumming", "lesson-tab": "quill-scroll", "lesson-power": "running-guitar",
  "lesson-redspecial": "wrenches", "lesson-barre": "strumming", "lesson-sevenths": "singing-mic",
  "lesson-pentatonic": "sheet-music-jump", "lesson-major-scale": "music-scrolls", "lesson-techniques": "tangled-strings",
  "lesson-minor-scales": "music-scrolls", "lesson-hotel": "singing-stage", "lesson-november": "singing-stage",
  "lesson-fingerpicking": "playing-guitar", "lesson-stairway": "playing-guitar", "lesson-caged": "map-glasses",
  "lesson-greensleeves": "cello", "lesson-modes": "big-pen", "lesson-wmggw": "singing-stage",
};
const POSE_OF = {"happy-guitar": "idle", "strumming": "play", "playing-guitar": "play", "running-guitar": "rockout", "juggling-picks": "cheer", "singing-mic": "sing", "singing-stage": "sing", "tangled-strings": "tangled", "quill-scroll": "think", "map-glasses": "think", "music-scrolls": "think", "sheet-music-jump": "jump", "keyhole": "think", "wrenches": "think", "top-hat-shelf": "idle", "cello": "play", "big-pen": "think", "painter": "idle", "sleeping-guitar": "sleep", "sleep-in-hat": "sleep", "teacup-books": "idle", "trumpet": "sing", "chef": "fish"};
// Jaxx is drawn live (js/puppy.js); the old picture names pick a pose.
function mascot(name, alt = "Jaxx the puppy", extra = "") {
  return `<div class="jg-avatar ${extra}">${puppySvg(POSE_OF[name] || "idle", { label: alt })}</div>`;
}

const DDUUDU = ["down", null, "down", "up", null, "up", "down", "up"];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// --- Generated lessons ---------------------------------------------------
function songLesson(song, { tier, world = false } = {}) {
  const plan = songPlan(song);
  const unique = [...new Set(plan.shapes)];
  const capoLine = plan.capo
    ? `<p>The easy way on guitar: put a <strong>capo on fret ${plan.capo}</strong> and play the shapes <strong>${unique.join(" – ")}</strong>. It sounds exactly like ${esc(song.chords.join(" – "))}.</p>`
    : `<p>No capo needed - play the shapes as written.</p>`;
  const barre = unique.filter((c) => chordShape(c)?.barre);
  return {
    id: `song-${song.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: `${world ? "" : "Master: "}${song.title}`,
    subtitle: song.artist,
    tier,
    song,
    pages: [
      {
        html: `<h3>${esc(song.title)} - ${esc(song.artist)}</h3>
          <p>Key: <strong>${esc(song.key || "?")}</strong>${song.year ? ` · ${song.year}` : ""}. The main loop: <strong>${esc(song.chords.join(" – "))}</strong>.</p>
          ${capoLine}
          ${barre.length ? `<p class="jg-note">${barre.join(", ")} ${barre.length === 1 ? "is a barre chord" : "are barre chords"} - see the Barre chords lesson, or play just the top 4 strings for now${barre.includes("F") ? " (for F, use the baby F from the Open chords, barre chords lesson)" : ""}.</p>` : ""}
          ${song.confidence === "needs-verification" ? '<p class="jg-note">This is a close version of the chords. Trust your ears!</p>' : ""}
          <p class="jg-note">This is the song's main loop. Play the record alongside to hear how it fits.</p>`,
        diagrams: unique,
      },
      {
        html: `<h3>Play along</h3><p>Four beats per chord with the D · D U · U D U strum. Start slow (50% or 75%).</p>`,
        diagrams: unique,
        practice: { items: strumItems(plan.shapes.concat(plan.shapes), DDUUDU), bpm: 80, modes: ["listen", "wait"], label: `${song.title}${plan.capo ? ` (capo ${plan.capo})` : ""}`, drums: true, key: `song:${song.title}` },
      },
    ],
  };
}

function worldLessons() {
  return WORLD_LANGUAGES.map((lang) => {
    const songs = songsByTier("Advanced", { world: true }).concat(songsByTier("Intermediate", { world: true }), songsByTier("Beginner", { world: true }))
      .filter((s) => s.genre === `World - ${lang.name}`);
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
let COURSE = null; // { total, start: Map(lessonId -> first card number) }
function sections() {
  if (SECTIONS) return SECTIONS;
  // The main course, in order. Every lesson ends with 3 songs to learn
  // (lesson-songs.js), except the "Master: <song>" lessons, which already
  // are a song.
  const main = withSongs([...BEGINNER, ...tierSongLessons("Beginner"), ...INTERMEDIATE, ...tierSongLessons("Intermediate"), ...ADVANCED, ...tierSongLessons("Advanced")], { skip: (l) => Boolean(l.song) });
  const byId = new Map(main.map((l) => [l.id, l]));
  const pick = (list) => list.map((l) => byId.get(l.id) || l);
  SECTIONS = [
    { name: "Before you start", note: "Optional. Skip ahead if you've played before", lessons: PRE },
    { name: "Beginner", lessons: pick([...BEGINNER, ...tierSongLessons("Beginner")]) },
    { name: "Intermediate", lessons: pick([...INTERMEDIATE, ...tierSongLessons("Intermediate")]) },
    { name: "Advanced", lessons: pick([...ADVANCED, ...tierSongLessons("Advanced")]) },
    { name: "World songs", note: "Optional: popular songs in 10 languages. Skip any you like.", lessons: worldLessons(), optional: true },
  ];
  // One card counter for the whole course (like a game: 4/185), starting
  // at Lesson 1. Optional lessons count on their own.
  let n = 1;
  const start = new Map();
  SECTIONS.slice(1, 4).forEach((sec) => sec.lessons.forEach((l) => { start.set(l.id, n); n += unitCount(l); }));
  COURSE = { total: n - 1, start };
  return SECTIONS;
}
const unitCount = (l) => (l.cards ? l.cards.length : l.pages.length);
// "Card 17/185" for a lesson's card/page i, or null for optional lessons.
function courseCard(lesson, i = 0) {
  sections();
  const s = COURSE.start.get(lesson.id);
  return s ? { n: s + i, total: COURSE.total } : null;
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
  stopAllSound();
}
// Another tab was opened: stop this lesson's loops, timers and sound.
function leaveLessons() {
  runCleanup();
  document.body.classList.remove("jg-lesson-open", "jg-playing");
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
      const cc = courseCard(l);
      return `<button class="${cls}" data-lesson="${l.id}"><span class="jg-node-num">${num}</span><span class="jg-node-text">${esc(l.title)}${l.fun ? '<span class="jg-tag">fun</span>' : ""}<span class="jg-sub">${esc(l.subtitle || "")}</span></span>${cc ? `<span class="jg-node-card" title="This lesson starts at card ${cc.n} of ${cc.total}">${cc.n}/${cc.total}</span>` : ""}</button>`;
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
  // The hero art: a guitar solo on a desert cliff at sunset (a November Rain homage).
  const heroArt = `<span class="jg-hero-art">${sceneSvg("cliff", { label: "A guitarist in a top hat plays a solo on a desert cliff at sunset" })}</span>`;
  const hero = nxt ? `
    <button class="jg-hero-card" data-lesson="${nxt.id}">
      ${heroArt}
      <span class="jg-hero-body">
        <span class="jg-hero-kicker">${done ? `Lesson ${number} of ${total}${courseCard(nxt) ? ` · card ${courseCard(nxt).n}/${courseCard(nxt).total}` : ""}` : "Start here"}</span>
        <span class="jg-hero-title">${esc(done ? nxt.title : "4 chords, 100+ songs")}</span>
        <span class="jg-hero-bar"><span style="width:${Math.max(3, pct)}%"></span></span>
        ${streak.count ? `<span class="jg-hero-meta">${icon("flame", 16)} ${streak.count}-day streak</span>` : ""}
        <span class="jg-hero-cta">${done ? "Continue ▶" : "Start now ▶"}</span>
      </span>
    </button>` : `<div class="jg-hero-card">${heroArt}<span class="jg-hero-body"><span class="jg-hero-title">You've finished every lesson! 🎉</span></span></div>`;
  panelEl.innerHTML = `
    <div class="jg-home-clean">
      <div class="jg-home-stage">${homeGuitar(homeGuitarThisVisit = homeGuitarThisVisit || nextHomeGuitar())}
        <p class="jg-home-stage-cap">🎸 <b>${esc(LEGENDS[homeGuitarThisVisit].name)}</b> · ${esc(LEGENDS[homeGuitarThisVisit].who)}<br>${esc(LEGENDS[homeGuitarThisVisit].fact)}</p></div>
      ${hero}
      <button class="jg-home-upload" data-home-upload type="button">
        ${icon("cassette", 44)}
        <span><b>Upload any song</b><span>and we'll find the chords for you</span></span>
        <span class="jg-home-upload-go">Upload</span>
      </button>
      <details class="jg-all-lessons"><summary class="jg-btn">${icon("guitar", 18)} All lessons <span class="jg-sub">${COURSE.total} cards in the course</span></summary>
        <p class="jg-note">The number on the right is the card where each lesson starts.</p>
        <div class="jg-roadmap-list">${roadmapHtml()}</div></details>
      ${isLessonComplete("lesson-1") ? `<button class="jg-home-how jg-open-review" type="button">${icon("flame", 18)} 2-minute review${reviewDoneToday() ? " ✓" : ""}</button>` : ""}
      <button class="jg-home-how" data-home-how type="button">${icon("star", 18)} How it works</button>
      ${tipJarHtml()}
      <p class="jg-home-credit">Supported by the Astryks Group (<a href="https://astryks.com" target="_blank" rel="noopener">astryks.com</a>)</p>
    </div>`;
  panelEl.querySelector("[data-home-how]")?.addEventListener("click", () => window.dispatchEvent(new CustomEvent("jg-show", { detail: "how" })));
  wireTipJar(panelEl);
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
    cleanup.push(openDailyReview(panelEl, { onClose: showHome }));
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
  // Beginner lessons are simple cards (js/cards.js).
  if (lesson.cards) {
    const cc = courseCard(lesson);
    const stop = runCards(panelEl, lesson, {
      start: pageIndex,
      courseStart: cc ? cc.n : null,
      courseTotal: cc ? cc.total : null,
      onExit: showHome,
      changeDrill,
      onFinish: () => {
        markLessonComplete(lesson.id);
        runCleanup();
        finishScreen(lesson, nextLesson());
      },
    });
    cleanup.push(stop);
    return;
  }
  const page = lesson.pages[pageIndex];
  const last = pageIndex === lesson.pages.length - 1;
  const needsBoard = page.shape || page.notes || page.practice || page.fretQuiz || page.caged || page.diagrams || page.changes || page.earGym || page.barreMover || page.song;
  panelEl.innerHTML = `
    <div class="jg-lessons-layout">
      <div class="jg-lesson-main jg-lesson-player">
        <div class="jg-lesson-content">
          <button class="jg-exit">← All lessons</button>
          <div class="jg-step">${esc(lesson.title)} · <span class="jg-cards-count" title="Card number in the whole course">${courseCard(lesson, pageIndex) ? `${courseCard(lesson, pageIndex).n}/${courseCard(lesson, pageIndex).total}` : `${pageIndex + 1}/${lesson.pages.length}`}</span></div>
          <div class="jg-say">${mascot(MASCOT_BY_LESSON[lesson.id] || (lesson.world ? "singing-mic" : lesson.song ? "playing-guitar" : "happy-guitar"))}<div class="jg-bubble">${page.html || ""}${teachHtml(lesson.id, pageIndex)}${lessonInspireHtml(lesson.id, pageIndex)}${page.shape ? PHONE_NOTE : ""}${peopleHtml(page.people)}${videoHtml(page.video)}${page.song && findSong(page.song) ? songCardHtml(findSong(page.song), { n: page.songN, of: page.songOf }) : ""}</div></div>
          ${page.diagrams ? `<div class="jg-diagram-row">${page.diagrams.map((c, i) => { const d = diagramOf(c); return `<button class="jg-btn jg-dg-btn" data-dg="${i}" title="Show ${esc(d.name)} on the fretboard">${chordDiagramSvg(d.shape, d.name)}</button>`; }).join("")}</div><p class="jg-note">Tap a chord box to see it on the fretboard and hear it.</p>` : ""}
          ${page.tab ? `<div class="jg-tab-wrap">${tabSvg(page.tab.items, { beatsPerBar: page.tab.beatsPerBar, bars: page.tab.bars })}</div><div class="jg-row"><button class="jg-btn jg-tab-play" type="button">${icon("speaker", 18)} Hear it</button></div>` : ""}
          <div class="jg-extra"></div>
          <div class="jg-instrument-host"></div>
          <div class="jg-practice-host"></div>
        </div>
        <div class="jg-controls">
          ${pageIndex > 0 ? '<button class="jg-btn jg-prev">← Back</button>' : ""}
          <button class="jg-btn jg-btn-primary jg-next">${last ? "Finish lesson ✓" : "Next →"}</button>
        </div>
      </div>
    </div>`;
  panelEl.scrollIntoView?.({ block: "start" });
  wireVideos(panelEl);
  wireSongCards(panelEl);
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
    inst = mountInstrument(panelEl.querySelector(".jg-instrument-host"), { frets: page.caged || page.barreMover ? 15 : 12, highway: Boolean(page.practice) });
    cleanup.push(() => inst.hw.destroy());
    restore();
  }
  // Tab pages: play the tab's notes, one beat each at 80 BPM.
  panelEl.querySelector(".jg-tab-play")?.addEventListener("click", () => {
    stopAllSound();
    page.tab.items.forEach((n) => playNote(midiAt(n.string, n.fret), { delay: n.start * 0.75, duration: Math.max(0.4, n.dur * 0.75) }));
  });
  panelEl.querySelectorAll("[data-dgc]").forEach((b) => b.addEventListener("click", () => {
    const sh = chordShape(b.dataset.dgc);
    inst.fb.showShape(sh);
    strum(shapeMidis(sh), { direction: "down" });
  }));
  if (page.song && !page.shape) { const f = findSong(page.song); const b0 = panelEl.querySelector("[data-dgc]"); if (f && b0) inst.fb.showShape(chordShape(b0.dataset.dgc)); }
  panelEl.querySelectorAll("[data-dg]").forEach((b) => b.addEventListener("click", () => {
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
  if (page.lefty) {
    extra.innerHTML = `<div class="jg-card">${leftyToggleHtml()}</div>`;
    wireLeftyToggle(extra, () => openLesson(id, pageIndex));
  }
  if (page.fretQuiz) fretQuiz(extra, inst, page.fretQuiz.count || 6, restore);
  if (page.earGym) earGym(extra, inst);
  if (page.changes) changeDrill(extra, inst, page.changes);
  if (page.caged) cagedPicker(extra, inst);
  if (page.barreMover) barreMover(extra, inst);
}

function finishScreen(lesson, nxt) {
  panelEl.innerHTML = `
    <div class="jg-say"><div class="jg-avatar jg-mascot-celebrate">${puppySvg(nextTrick("yay"), { label: "Jaxx celebrating" })}</div><div class="jg-bubble">
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
    if (!host.isConnected) return;
    const midis = shapeMidis(chordShape(c));
    if (how === "high") return strum(midis.map((m) => m + 12));
    // Picked one string at a time, scheduled on the audio clock.
    if (how === "pick") return midis.forEach((m, i) => strum([m], { delay: i * 0.22 }));
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
      msg.innerHTML = right >= count - 1 ? '<span class="jg-quiz-ok">Great - you can find notes on the fretboard!</span>' : "Good practice - try again any time.";
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
      msg.innerHTML = `<span class="jg-quiz-bad">That's ${noteName(midi)}${string !== target.s ? " - and check the string" : ""}.</span> Count up from the open string: E F · G · A · B C · D · E (· = a fret with a sharp/flat).`;
    }
  });
  ask();
}

// The one-minute chord-change challenge. Count by tapping "I changed!",
// or turn on the microphone: Jaxx listens to each strum (chroma-based
// chord recognition, js/chord-detect.js) and counts every switch between
// the two chords by itself.
function changeDrill(host, inst, [a, b]) {
  const key = `jg_changes_${a}_${b}`;
  let best = 0;
  try { best = Number(localStorage.getItem(key)) || 0; } catch (e) { /* ignore */ }
  host.innerHTML = `<div class="jg-card">
    <div class="jg-diagram-row">${[a, b].map((c) => `<button class="jg-btn jg-dg-btn" data-cdc="${esc(c)}" type="button" title="Hear ${esc(c)}">${chordDiagramSvg(chordShape(c), c)}</button>`).join("")}</div>
    <div class="jg-big jg-cd-count">0</div><p style="text-align:center" class="jg-cd-time">60 seconds · best ${best}</p>
    <div class="jg-row" style="justify-content:center"><button class="jg-btn jg-btn-primary jg-cd-start">Start 1 minute</button><button class="jg-btn jg-cd-tap" disabled>I changed! (+1)</button></div>
    <div class="jg-row" style="justify-content:center"><button class="jg-btn jg-cd-mic">${icon("mic", 18)} Count my strums (microphone)</button></div>
    <p class="jg-cd-heard" aria-live="polite"></p>
    <p class="jg-note">Each clean switch counts one. Turn on the microphone and Jaxx counts for you (it only listens to your guitar), or tap "I changed!".</p></div>`;
  let count = 0;
  let timer = null;
  let cur = a;
  let lastHeard = null;
  let stopMic = null;
  const countEl = host.querySelector(".jg-cd-count");
  const timeEl = host.querySelector(".jg-cd-time");
  const tapBtn = host.querySelector(".jg-cd-tap");
  const micBtn = host.querySelector(".jg-cd-mic");
  const heardEl = host.querySelector(".jg-cd-heard");
  inst.fb.showShape(chordShape(a));
  host.querySelectorAll("[data-cdc]").forEach((btn) => btn.addEventListener("click", () => {
    const sh = chordShape(btn.dataset.cdc);
    inst.fb.showShape(sh);
    strum(shapeMidis(sh));
  }));
  const tap = () => {
    if (!timer) return;
    count++;
    countEl.textContent = count;
    cur = cur === a ? b : a;
    inst.fb.showShape(chordShape(cur));
  };
  const onKey = (e) => { if (e.code === "Space" && timer) { e.preventDefault(); tap(); } };
  window.addEventListener("keydown", onKey);
  const stopAll = () => { window.removeEventListener("keydown", onKey); if (timer) clearInterval(timer); timer = null; if (stopMic) stopMic(); stopMic = null; };
  cleanup.push(stopAll);
  tapBtn.addEventListener("click", tap);
  micBtn.addEventListener("click", async () => {
    if (stopMic) { stopMic(); stopMic = null; micBtn.innerHTML = `${icon("mic", 18)} Count my strums (microphone)`; heardEl.textContent = ""; return; }
    micBtn.disabled = true;
    try {
      stopMic = await startChordListening({
        candidates: [a, b],
        onChord: (chord) => {
          if (!host.isConnected) { stopMic?.(); stopMic = null; return; }
          if (!chord) { heardEl.innerHTML = "I heard a strum, but not clearly. Let it ring!"; return; }
          heardEl.innerHTML = `I heard <b>${chord}</b> ${chord === lastHeard ? "" : "✓"}`;
          inst.fb.showShape(chordShape(chord));
          if (timer && lastHeard && chord !== lastHeard) { count++; countEl.textContent = count; }
          lastHeard = chord;
        },
      });
      micBtn.innerHTML = `${icon("mic", 18)} Listening… (tap to stop)`;
      heardEl.textContent = `Strum ${a} to begin.`;
    } catch (err) {
      heardEl.textContent = `The microphone didn't start: ${friendlyMicError(err)}. Tap "I changed!" instead.`;
    }
    micBtn.disabled = false;
  });
  host.querySelector(".jg-cd-start").addEventListener("click", () => {
    if (timer) return;
    count = 0;
    lastHeard = null;
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
  return stopAll;
}

// Barre chords: one shape (the E shape with a barre) slid up and down the
// neck plays A B C D E F G. The letter is the note under the barre on the
// thickest string.
const BARRE_ROOTS = { F: 1, G: 3, A: 5, B: 7, C: 8, D: 10, E: 12 };
function barreMover(host, inst) {
  let minor = false;
  let root = "F";
  host.innerHTML = `<div class="jg-card jg-barre-mover">
    <div class="jg-row jg-bm-roots">${Object.keys(BARRE_ROOTS).sort().map((r) => `<button class="jg-pill" data-r="${r}" type="button">${r}</button>`).join("")}</div>
    <div class="jg-row"><button class="jg-pill jg-bm-mode" type="button">Major (happy)</button></div>
    <div class="jg-bm-dg"></div><p class="jg-bm-say"></p></div>`;
  const draw = () => {
    const r = BARRE_ROOTS[root];
    const name = root + (minor ? "m" : "");
    const shape = { frets: minor ? [r, r + 2, r + 2, r, r, r] : [r, r + 2, r + 2, r + 1, r, r], fingers: minor ? [1, 3, 4, 1, 1, 1] : [1, 3, 4, 2, 1, 1], barre: r };
    host.querySelectorAll("[data-r]").forEach((b) => b.classList.toggle("jg-pill-active", b.dataset.r === root));
    host.querySelector(".jg-bm-mode").textContent = minor ? "Minor (sad)" : "Major (happy)";
    host.querySelector(".jg-bm-mode").classList.toggle("jg-pill-active", minor);
    host.querySelector(".jg-bm-dg").innerHTML = chordDiagramSvg(shape, name);
    host.querySelector(".jg-bm-say").innerHTML = `<b>${name}</b>: barre at fret <b>${r}</b>. The low E string at fret ${r} is the note <b>${root}</b>, so the chord is ${name}.${root === "E" ? " (At fret 12 it's an octave above the open E chord.)" : ""}`;
    inst.fb.showShape(shape);
    strum(shapeMidis(shape));
  };
  host.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.r) root = b.dataset.r;
    if (b.classList.contains("jg-bm-mode")) minor = !minor;
    draw();
  });
  draw();
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

export { renderLessons, leaveLessons, allLessons, songLesson, openLesson, showHome };
