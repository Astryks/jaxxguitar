// Jaxx Guitar entry point: tabs, the level chip, toasts and confetti.

import { renderLessons } from "./lessons-ui.js";
import { renderSongs, leaveSongs } from "./songs-ui.js";
import { renderPractice, leavePractice } from "./practice-ui.js";
import { renderStringTuner } from "./tuner.js";
import { renderAbout } from "./about.js";
import { getLevel } from "./storage.js";
import { disableMic } from "./input-hub.js";
import { maybeShowFunFact, showFunFact } from "./fun-facts.js";

const panels = {
  lessons: document.getElementById("panel-lessons"),
  songs: document.getElementById("panel-songs"),
  practice: document.getElementById("panel-practice"),
  tuner: document.getElementById("panel-tuner"),
  about: document.getElementById("panel-about"),
};
let tunerWidget = null;

function leave() {
  leaveSongs();
  leavePractice();
  if (tunerWidget) tunerWidget.destroy();
  tunerWidget = null;
  disableMic();
}

function show(tab) {
  leave();
  document.querySelectorAll(".jg-tab").forEach((b) => b.classList.toggle("jg-tab-active", b.dataset.tab === tab));
  Object.entries(panels).forEach(([k, el]) => el.classList.toggle("jg-hidden", k !== tab));
  const el = panels[tab];
  if (tab === "lessons") renderLessons(el);
  if (tab === "songs") renderSongs(el);
  if (tab === "practice") renderPractice(el);
  if (tab === "tuner") {
    el.innerHTML = `<div class="jg-card"><img class="jg-hero-mascot" src="assets/mascot/tangled-strings.webp" alt="A kitten tangled in guitar strings"><h2 style="margin:4px 0">Tune your guitar</h2>
      <p>Standard tuning, thickest to thinnest: <strong>E A D G B E</strong>. Pick a string, tap <em>Start listening</em> and play it — turn the peg until the meter goes green. It moves on to the next string by itself.</p>
      <div class="jg-tuner-host"></div></div>`;
    tunerWidget = renderStringTuner(el.querySelector(".jg-tuner-host"));
  }
  if (tab === "about") renderAbout(el);
  try { localStorage.setItem("jg_tab", tab); } catch (e) { /* ignore */ }
}

document.querySelectorAll(".jg-tab").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));

function drawLevel() {
  const l = getLevel();
  const pct = Math.round((100 * (l.xp - l.floor)) / Math.max(1, l.next - l.floor));
  document.getElementById("jg-level-chip").innerHTML = `⭐ Lv ${l.level} · ${l.title} <span class="jg-level-bar"><span style="width:${pct}%"></span></span> ${l.xp} XP`;
}

function toast(text, { big = false } = {}) {
  let host = document.getElementById("jg-toasts");
  if (!host) {
    host = document.createElement("div");
    host.id = "jg-toasts";
    document.body.appendChild(host);
  }
  const t = document.createElement("div");
  t.className = `jg-toast ${big ? "jg-toast-big" : ""}`;
  t.textContent = text;
  host.appendChild(t);
  setTimeout(() => t.classList.add("jg-toast-out"), big ? 2600 : 1600);
  setTimeout(() => t.remove(), big ? 3100 : 2100);
}

function confetti() {
  const c = document.createElement("div");
  c.className = "jg-confetti";
  const colors = ["#c46a1f", "#2f8f83", "#e1a62b", "#7d5bc9", "#e0625b"];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement("i");
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.6}s`;
    c.appendChild(p);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 3200);
}

window.addEventListener("jg-xp", (e) => {
  toast(`+${e.detail.amount} XP · ${e.detail.reason}`);
  drawLevel();
});
window.addEventListener("jg-toast", (e) => toast(e.detail.text, { big: e.detail.big }));
window.addEventListener("jg-celebrate", () => {
  confetti();
  maybeShowFunFact();
});
document.addEventListener("click", (e) => {
  if (e.target.closest(".jg-funfact-open")) showFunFact();
});

drawLevel();
let startTab = "lessons";
try { startTab = localStorage.getItem("jg_tab") || "lessons"; } catch (e) { /* ignore */ }
show(panels[startTab] ? startTab : "lessons");
