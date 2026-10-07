// Real teachers' hands on video, shown on the first card or page of the
// lessons they match (official channels only: JustinGuitar, Andy Guitar,
// Guitar Center, Fender; IDs checked with YouTube oEmbed, 2026-10-07).
import { videoHtml } from "./media.js";

const TEACH = {
  "p-press": ["teach-hold"],
  "p-tune": ["teach-tuning"],
  "lesson-1": ["teach-first-chords", "teach-first-chords-em"],
  "lesson-strum": ["teach-finger-strum", "teach-strum-patterns"],
  "lesson-changes": ["teach-changing"],
  "lesson-open-barre": ["teach-barre"],
  "lesson-barre": ["teach-barre"],
  "lesson-capo": ["teach-capo"],
};

// "Watch a teacher" block for a lesson's first card/page, or "".
function teachHtml(lessonId, index = 0) {
  const keys = index === 0 ? TEACH[lessonId] : null;
  if (!keys) return "";
  return `<div class="jg-teach"><div class="jg-teach-title">👀 Watch a real teacher's hands</div>${keys.map((k) => videoHtml(k)).join("")}</div>`;
}

export { teachHtml, TEACH };
