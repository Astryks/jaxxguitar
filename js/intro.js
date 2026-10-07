// The splash shown each time the app opens (like Hayden Keys): just Jaxx
// the puppy with his guitar, then one big button. Tapping
// anywhere goes to the home screen too.

import { guitarLogo } from "./scenes.js";

function showIntro({ started = false } = {}) {
  const el = document.createElement("div");
  el.className = "jg-intro";
  el.innerHTML = `
    <div class="jg-intro-notes" aria-hidden="true"><span>♪</span><span>♫</span><span>♩</span><span>♬</span><span>♪</span></div>
    <div class="jg-intro-logo">${guitarLogo({ label: "Jaxx Guitar" })}</div>
    <h1 class="jg-intro-title">Jaxx Guitar</h1>
    <button class="jg-intro-go" type="button">${started ? "Let's play ▶" : "Start now ▶"}</button>`;
  document.body.appendChild(el);
  document.body.classList.add("jg-intro-open");
  const close = () => {
    if (el.classList.contains("jg-intro-out")) return;
    el.classList.add("jg-intro-out");
    document.body.classList.remove("jg-intro-open");
    setTimeout(() => el.remove(), 350);
  };
  el.addEventListener("click", close);
  return close;
}

export { showIntro };
