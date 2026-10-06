import { kittenSvg } from "./kitten.js";
import { icon } from "./icons.js";
// Jaxx Guitar entry point: tabs, the level chip, toasts and confetti.

import { renderLessons } from "./lessons-ui.js";
import { renderSongs, leaveSongs } from "./songs-ui.js";
import { renderPractice, leavePractice } from "./practice-ui.js";
import { renderStringTuner } from "./tuner.js";
import { renderAbout } from "./about.js";
import { renderHow } from "./how-it-works.js";
import { getLevel } from "./storage.js";
import { disableMic } from "./input-hub.js";
import { maybeShowFunFact, showFunFact } from "./fun-facts.js";

const panels = {
  lessons: document.getElementById("panel-lessons"),
  songs: document.getElementById("panel-songs"),
  practice: document.getElementById("panel-practice"),
  tuner: document.getElementById("panel-tuner"),
  about: document.getElementById("panel-about"),
  how: document.getElementById("panel-how"),
};
// Pages without a tab tile (e.g. How it works) are opened by name.
window.addEventListener("jg-show", (e) => show(e.detail));
let tunerWidget = null;

function leave() {
  leaveSongs();
  leavePractice();
  if (tunerWidget) tunerWidget.destroy();
  tunerWidget = null;
  disableMic();
}

const logo = document.getElementById("jg-logo-kitten");
if (logo) logo.innerHTML = kittenSvg("idle", { label: "Jaxx Guitar" });
// Big home tiles: each tab gets one of our own icons.
const TAB_ICONS = { lessons: "guitar", songs: "song", practice: "play", tuner: "tuner" };
document.querySelectorAll(".jg-tab[data-tab]").forEach((b) => {
  if (TAB_ICONS[b.dataset.tab]) b.innerHTML = `${icon(TAB_ICONS[b.dataset.tab], 34)}<span>${b.textContent.trim()}</span>`;
});

function show(tab) {
  leave();
  document.body.dataset.tab = tab;
  document.querySelectorAll(".jg-tab").forEach((b) => b.classList.toggle("jg-tab-active", b.dataset.tab === tab));
  Object.entries(panels).forEach(([k, el]) => el.classList.toggle("jg-hidden", k !== tab));
  const el = panels[tab];
  if (tab === "lessons") renderLessons(el);
  if (tab === "songs") renderSongs(el);
  if (tab === "practice") renderPractice(el);
  if (tab === "tuner") {
    el.innerHTML = `<div class="jg-card"><div class="jg-hero-mascot">${kittenSvg("tangled")}</div><h2 style="margin:4px 0">Tune your guitar</h2>
      <p>Standard tuning, thickest to thinnest: <strong>E A D G B E</strong>. Pick a string, tap <em>Start listening</em> and play it — turn the peg until the meter goes green. It moves on to the next string by itself.</p>
      <div class="jg-tuner-host"></div></div>`;
    tunerWidget = renderStringTuner(el.querySelector(".jg-tuner-host"));
  }
  if (tab === "about") renderAbout(el);
  if (tab === "how") renderHow(el);
  try { localStorage.setItem("jg_tab", tab); } catch (e) { /* ignore */ }
}

document.querySelectorAll(".jg-tab, .jg-footer-link").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));

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
  // Tiny musical notes drifting down from the sky, each swaying as it falls.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const host = document.createElement("div");
  host.className = "jg-notefall";
  host.setAttribute("aria-hidden", "true");
  const glyphs = ["♪", "♫", "♩", "♬"];
  const colors = ["#c46a1f", "#2f8f83", "#e1a62b", "#7d5bc9", "#e0625b"];
  for (let i = 0; i < 46; i++) {
    const n = document.createElement("span");
    n.textContent = glyphs[i % glyphs.length];
    n.style.left = `${Math.random() * 100}%`;
    n.style.color = colors[i % colors.length];
    n.style.fontSize = `${14 + Math.random() * 18}px`;
    n.style.animationDuration = `${2.4 + Math.random() * 1.8}s, ${0.9 + Math.random() * 0.8}s`;
    n.style.animationDelay = `${Math.random() * 1.2}s, 0s`;
    host.appendChild(n);
  }
  document.body.appendChild(host);
  setTimeout(() => host.remove(), 5200);
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
