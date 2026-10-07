// "3 songs to learn" at the end of every lesson (owner feedback, 2026-10):
// too many chords, not enough songs. Each lesson ends with one card per
// song: the chords (and capo) to play it with what you know, and the
// song's official video (the same verified list the Songs tab uses).
//
// Lessons can name their songs (lesson.songs = ["Title", ...]); the rest
// are picked here from the song library: songs you can already play with
// the chords taught so far, most popular first, preferring ones that use
// the lesson's new chords, and never repeating a song in the course.

import { SONGS } from "./songs-data.js";
import { SONG_VIDEOS, VIDEOS } from "./media-data.js";
import { songPlan } from "./song-plan.js";
import { chordShape } from "./guitar-theory.js";
import { chordDiagramSvg } from "./fretboard.js";
import { videoHtml } from "./media.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function findSong(title) {
  return SONGS.find((s) => s.title === title) || SONGS.find((s) => s.title.toLowerCase() === String(title).toLowerCase()) || null;
}

// Kept in the Songs library, but not suggested in the (kid-friendly)
// lessons: explicit lyrics or grown-up themes.
const NOT_IN_LESSONS = new Set(["Starboy", "Still D.R.E.", "Gin and Juice", "Drop It Like It's Hot", "Young, Wild & Free", "Hot in Herre", "One Dance", "Closer", "Die for You", "Stay", "Lucid Dreams", "Snuff", "Drown", "Sweater Weather", "Bad Guy", "The A Team", "Dilemma"]);
// Videos must be the artist's or label's own upload, not a fan or TV channel.
const NOT_OFFICIAL_CHANNEL = /^(Last\.fm|The Howard Stern Show)$/i;

// A song can go in a lesson if we can chart it and its official video
// can play inside the app.
function teachable(song) {
  if (!song || NOT_IN_LESSONS.has(song.title)) return false;
  const key = SONG_VIDEOS[song.title];
  const v = key && VIDEOS[key];
  return Boolean(v && !v.noEmbed && !NOT_OFFICIAL_CHANNEL.test(v.author_name || "") && songPlan(song).playable);
}

function shapesOf(song) {
  return [...new Set(songPlan(song).shapes)].filter((c) => chordShape(c));
}

// Chords a lesson teaches: its chord cards, diagrams, shapes, comparisons
// and any explicit list.
function lessonChords(lesson) {
  const out = new Set(lesson.chords || []);
  (lesson.cards || []).forEach((c) => {
    const w = c.want || {};
    if (w.chord) out.add(w.chord);
    (w.compare || []).forEach((x) => out.add(x));
    (w.loop?.chords || []).forEach((x) => out.add(x));
  });
  (lesson.pages || []).forEach((p) => {
    (p.diagrams || []).forEach((d) => typeof d === "string" && out.add(d));
    if (p.shape) out.add(p.shape);
  });
  return out;
}

// One song, for a lesson card or page.
function songCardHtml(song, { n, of } = {}) {
  const plan = songPlan(song);
  const shapes = shapesOf(song);
  const loop = plan.shapes.slice(0, 8);
  return `<div class="jg-songcard">
      <div class="jg-songcard-head"><span class="jg-songcard-n">${n ? `Song ${n}${of ? ` of ${of}` : ""}` : "Song"}</span>
        <b>${esc(song.title)}</b><span>${esc(song.artist)}${song.year ? ` · ${song.year}` : ""}</span></div>
      <p class="jg-songcard-how">${plan.capo ? `Put a <b>capo on fret ${plan.capo}</b>, then play` : "Play"} <b>${esc(loop.join(" · "))}</b>.${plan.capo ? ` <span class="jg-note">No capo? Same shapes, just a little lower.</span>` : ""}</p>
      <div class="jg-diagram-row jg-songcard-dg">${shapes.map((c) => `<button class="jg-btn jg-dg-btn" data-dgc="${esc(c)}" title="Show ${esc(c)} on the fretboard">${chordDiagramSvg(chordShape(c), c)}</button>`).join("")}</div>
      ${videoHtml(SONG_VIDEOS[song.title])}
      <p class="jg-note">Watch the video, then strum along. Sing the words if you know them!</p>
      <button class="jg-btn jg-songcard-open" data-open-song="${esc(song.title)}" type="button">Play along in Songs ›</button>
    </div>`;
}

function wireSongCards(root) {
  root.querySelectorAll("[data-open-song]").forEach((b) => b.addEventListener("click", async () => {
    const m = await import("./songs-ui.js");
    m.openSongByTitle(b.dataset.openSong);
  }));
}

// Adds 3 song cards (card lessons) or 3 song pages (page lessons) to the
// end of each lesson. `lessons` are in course order. Returns new lesson
// objects (the originals in lessons-data.js are left alone).
function withSongs(lessons, { count = 3, skip = () => false } = {}) {
  const used = new Set();
  const known = new Set();
  // Songs a lesson names itself are reserved for it.
  lessons.forEach((l) => (l.songs || []).forEach((t) => used.add(t)));
  (lessons.flatMap((l) => (l.cards || []).map((c) => c.want?.song).concat((l.pages || []).map((p) => p.song)))).filter(Boolean).forEach((t) => used.add(t));
  const pool = SONGS.filter(teachable).sort((a, b) => (a.popularityRank || 999) - (b.popularityRank || 999));
  return lessons.map((lesson) => {
    const fresh = lessonChords(lesson);
    fresh.forEach((c) => known.add(c));
    if (skip(lesson)) return lesson;
    let picks = (lesson.songs || []).map(findSong).filter(teachable);
    if (picks.length < count) {
      const fits = (s) => shapesOf(s).every((c) => known.has(c));
      const usesNew = (s) => shapesOf(s).some((c) => fresh.has(c));
      const notWorld = (s) => !(s.genre || "").startsWith("World");
      const tiers = [
        (s) => fits(s) && usesNew(s) && notWorld(s),
        (s) => fits(s) && notWorld(s),
        (s) => fits(s),
        (s) => notWorld(s),
        () => true,
      ];
      for (const ok of tiers) {
        for (const s of pool) {
          if (picks.length >= count) break;
          if (used.has(s.title) || picks.includes(s) || !ok(s)) continue;
          picks.push(s);
        }
        if (picks.length >= count) break;
      }
    }
    picks = picks.slice(0, count);
    picks.forEach((s) => used.add(s.title));
    if (!picks.length) return lesson;
    if (lesson.cards) {
      const cards = picks.map((s, i) => ({
        say: i === 0 ? `Now let's <b>play some songs</b>! 🎶<br>Here are <b>${picks.length} songs</b> you can learn with what you know. First: <b>${esc(s.title)}</b>.` : `Song ${i + 1}: <b>${esc(s.title)}</b> by ${esc(s.artist)} 🎵`,
        want: { song: s.title, tap: i === picks.length - 1 ? "I'll learn these! 🎸" : "Next song →" },
        done: i === picks.length - 1 ? "Three new songs to play! 🏆" : "Nice one! 🎵",
      }));
      return { ...lesson, cards: [...lesson.cards, ...cards] };
    }
    const pages = picks.map((s, i) => ({ html: i === 0 ? `<h3>3 songs to learn 🎶</h3><p>Time to use it! Here's a song you can play with what you know.</p>` : `<h3>Song ${i + 1} of ${picks.length}</h3>`, song: s.title, songN: i + 1, songOf: picks.length }));
    return { ...lesson, pages: [...lesson.pages, ...pages] };
  });
}

export { withSongs, songCardHtml, wireSongCards, findSong, teachable };
