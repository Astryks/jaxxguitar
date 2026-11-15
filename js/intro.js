// The splash shown each time the app opens: Jaxx the puppy strumming in
// front of six vibrating strings (thick low E at the bottom, like looking
// down at your own guitar), then "Let's jam" or "Tune first". Tapping
// anywhere else goes to the home screen too.

import { puppySvg } from "./puppy.js";

const STRINGS = ["e", "B", "G", "D", "A", "E"];

function showIntro({ started = false } = {}) {
  const el = document.createElement("div");
  el.className = "jg-intro";
  el.innerHTML = `
    <div class="jg-intro-strings" aria-hidden="true">${STRINGS.map((n, k) => `<i style="--k:${k}"><b>${n}</b></i>`).join("")}</div>
    <div class="jg-intro-pup">${puppySvg("play", { label: "Jaxx the puppy playing guitar" })}</div>
    <h1 class="jg-intro-title">Jaxx <span>Guitar</span></h1>
    <p class="jg-intro-tag">Tune up · Strum along · Play real songs</p>
    <button class="jg-intro-go" type="button">${started ? "Let's jam ▶" : "Start playing ▶"}</button>
    <button class="jg-intro-tune" type="button">🎵 Tune my guitar first</button>`;
  document.body.appendChild(el);
  document.body.classList.add("jg-intro-open");
  const close = () => {
    if (el.classList.contains("jg-intro-out")) return;
    el.classList.add("jg-intro-out");
    document.body.classList.remove("jg-intro-open");
    setTimeout(() => el.remove(), 350);
  };
  el.querySelector(".jg-intro-tune").addEventListener("click", (e) => {
    e.stopPropagation();
    close();
    document.querySelector('.jg-tab[data-tab="tuner"]')?.click();
  });
  el.addEventListener("click", close);
  return close;
}

export { showIntro };
