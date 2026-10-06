// "How Jaxx Guitar works": a short, visual tour of the technology, and the
// tip jar (iPhone/iPad app only; tips unlock nothing).
import { icon } from "./icons.js";
import { renderTipJar } from "./tipjar.js";

const TECH = [
  ["song", "Upload any song", "A music AI from Spotify, called Basic Pitch, runs right on your phone. It listens to your recording and writes down every note it hears. Then we turn those notes into chords and the easiest shapes to play on guitar."],
  ["search", "Guess the song", "Apple's ShazamKit turns a few seconds of the song into a tiny audio fingerprint and finds its name. Only the fingerprint is sent, never the recording."],
  ["hand", "Wait for me", "The microphone listens only for your guitar strings. Many times a second it works out which note you played, and the falling notes wait for you."],
  ["guitar", "A string made of maths", "The guitar sound is built note by note with a famous 1983 trick (Karplus–Strong): a tiny burst of noise bounces around a loop and turns into a ringing string."],
  ["star", "All on your phone", "No servers and no account. Your progress, your uploads and the AI all stay on your device."],
];

function renderHow(el) {
  el.innerHTML = `
    <div class="jg-tech">
      <h2>How Jaxx Guitar works</h2>
      <p class="jg-note">Some amazing technology, packed into a free app.</p>
      <div class="jg-tech-grid">${TECH.map(([ic, t, d]) => `<div class="jg-tech-card">${icon(ic, 40)}<b>${t}</b><p>${d}</p></div>`).join("")}</div>
      <div class="jg-tipjar-slot"></div>
    </div>`;
  renderTipJar(el.querySelector(".jg-tipjar-slot"));
}

export { renderHow };
