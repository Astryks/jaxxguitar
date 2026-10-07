// "Get inspired" blocks: a legendary live performance under a song (the
// same song when we have one, otherwise a great one in the same style for
// advanced songs) and on the advanced lessons.
import { INSPIRE_SONGS, INSPIRE_GENERAL } from "./inspire-data.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const styleOf = (genre = "") =>
  /metal/i.test(genre) ? "rock" : /blues|soul|r&b/i.test(genre) ? "blues" : /jazz/i.test(genre) ? "jazz"
  : /flamenco|latin|world/i.test(genre) ? "world" : /classical/i.test(genre) ? "classical"
  : /folk|country|acoustic/i.test(genre) ? "acoustic" : "rock";
const pickStyle = (style, seed = "") => {
  const list = INSPIRE_GENERAL.filter((g) => g.style === style);
  const pool = list.length ? list : INSPIRE_GENERAL;
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
};
const block = (v, heading) => !v ? "" : `<div class="jg-inspire"><div class="jg-inspire-title">🔥 ${heading}</div>
  <div class="jg-video" data-yt="${esc(v.id)}"><button class="jg-btn jg-video-load" type="button">▶ ${esc(v.title)}</button>
  <span class="jg-note">${esc(v.author_name)}${v.views ? ` · ${esc(v.views)} views` : ""}</span></div>
  ${v.blurb ? `<p class="jg-inspire-blurb">${esc(v.blurb)}</p>` : ""}</div>`;

// Under a song: the real thing live when we have it; advanced songs always get one.
function songInspireHtml(song, { advanced = false } = {}) {
  const own = INSPIRE_SONGS[song.title];
  if (own) return block(own, "Get inspired: see it played live");
  return advanced ? block(pickStyle(styleOf(song.genre), song.title), "Get inspired") : "";
}

// Advanced lessons and the style each one gets.
const LESSON_STYLE = {
  "lesson-pentatonic": "blues", "lesson-techniques": "rock", "lesson-hotel": "rock", "lesson-november": "rock",
  "lesson-wmggw": "rock", "lesson-stairway": "rock", "lesson-scale-practice": "blues", "lesson-minor-scales": "rock",
  "lesson-classical": "classical", "lesson-world": "world", "lesson-fingerpicking": "acoustic", "lesson-caged": "jazz",
  "lesson-power": "rock", "lesson-looping": "world", "lesson-genres": "blues",
};
function lessonInspireHtml(lessonId, index = 0) {
  const style = LESSON_STYLE[lessonId];
  return style && index === 0 ? block(pickStyle(style, lessonId), "Get inspired") : "";
}

export { songInspireHtml, lessonInspireHtml };
