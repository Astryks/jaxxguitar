// Songs tab: the library, filterable by level and searchable, each song
// with its easiest capo and chord shapes, and a play-along.

import { SONGS, getDifficulty } from "./songs-data.js";
import { songPlan } from "./song-plan.js";
import { chordShape, shapeMidis } from "./guitar-theory.js";
import { chordDiagramSvg } from "./fretboard.js";
import { strum } from "./guitar-audio.js";
import { mountInstrument, createPracticeBox } from "./practice-widget.js";
import { getSavedSongs, markSongStatus } from "./storage.js";
import { chordTimeline } from "./guitar-player.js";

const DDUUDU = ["down", null, "down", "up", null, "up", "down", "up"];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let filter = { tier: "All", q: "", world: false };
let cleanup = null;

function renderSongs(panel) {
  if (cleanup) { cleanup(); cleanup = null; }
  const saved = getSavedSongs();
  const tiers = ["All", "Beginner", "Intermediate", "Advanced"];
  panel.innerHTML = `
    <div class="jg-row">
      <input class="jg-btn jg-song-q" type="search" placeholder="Search songs or artists" value="${esc(filter.q)}" style="flex:1 1 220px">
      ${tiers.map((t) => `<button class="jg-pill ${filter.tier === t ? "jg-pill-active" : ""}" data-tier="${t}">${t}</button>`).join("")}
      <button class="jg-pill ${filter.world ? "jg-pill-active" : ""}" data-world>🌍 World songs</button>
    </div>
    <div class="jg-say"><div class="jg-avatar"><img src="assets/mascot/music-scrolls.webp" alt=""></div><p class="jg-note" style="align-self:center">Chord names and progressions only — no lyrics. Every song shows the easiest way to play it, often with a capo.</p></div>
    <div class="jg-song-grid"></div>`;
  const grid = panel.querySelector(".jg-song-grid");
  function draw() {
    const q = filter.q.toLowerCase();
    const list = SONGS.filter((s) => Boolean(s.genre?.startsWith("World")) === filter.world)
      .filter((s) => filter.tier === "All" || getDifficulty(s) === filter.tier)
      .filter((s) => !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
      .sort((a, b) => (songPlan(b).playable - songPlan(a).playable) || (a.popularityRank || 999) - (b.popularityRank || 999));
    grid.innerHTML = list.map((s) => {
      const p = songPlan(s);
      const st = saved[s.title]?.status;
      return `<div class="jg-song">
        <h3>${esc(s.title)} ${st === "completed" ? "✅" : ""}</h3>
        <div class="jg-song-meta">${esc(s.artist)} · ${esc(s.key || "")}</div>
        <div><span class="jg-badge">${getDifficulty(s)}</span>${s.confidence === "confirmed" ? '<span class="jg-badge jg-badge-ok">chords confirmed</span>' : '<span class="jg-badge jg-badge-warn">close version</span>'}${s.oneFiveSixFourMatch === "exact" ? '<span class="jg-badge">4-chord song</span>' : ""}</div>
        ${p.playable
          ? `<div class="jg-capo">${p.capo ? `Capo ${p.capo}: ` : "No capo: "}${[...new Set(p.shapes)].join(" ")}</div><button class="jg-btn jg-btn-small" data-song="${esc(s.title)}">Play along</button>`
          : '<div class="jg-song-meta">Sources didn\'t agree enough to chart this one yet.</div>'}
      </div>`;
    }).join("") || '<p class="jg-note">No songs match.</p>';
  }
  draw();
  panel.querySelector(".jg-song-q").addEventListener("input", (e) => { filter.q = e.target.value; draw(); });
  panel.onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.tier) { filter.tier = b.dataset.tier; renderSongs(panel); }
    else if (b.hasAttribute("data-world")) { filter.world = !filter.world; renderSongs(panel); }
    else if (b.dataset.song) openSong(panel, SONGS.find((s) => s.title === b.dataset.song));
  };
}

function openSong(panel, song) {
  const p = songPlan(song);
  const unique = [...new Set(p.shapes)];
  let bpm = 80;
  panel.onclick = null;
  panel.innerHTML = `
    <div class="jg-lesson-player">
      <div class="jg-lesson-content">
        <button class="jg-exit">← All songs</button>
        <h2 style="margin:4px 0">${esc(song.title)} <span class="jg-label">${esc(song.artist)}</span></h2>
        <p>Key ${esc(song.key || "?")} · original chords <strong>${esc(song.chords.join(" – "))}</strong>${p.capo ? ` · <span class="jg-capo">capo ${p.capo} → play ${esc(p.shapes.join(" – "))}</span>` : ""}</p>
        <div class="jg-diagram-row">${unique.map((c) => `<button class="jg-btn jg-dg-btn" data-chord="${esc(c)}">${chordDiagramSvg(chordShape(c), c)}</button>`).join("")}</div>
        <div class="jg-row"><span class="jg-label">Practice tempo</span>${[60, 80, 100, 120].map((t) => `<button class="jg-pill ${t === bpm ? "jg-pill-active" : ""}" data-bpm="${t}">${t}</button>`).join("")}
          <span class="jg-label">Strum</span><button class="jg-pill jg-pill-active" data-pat="dduudu">D·DU·UDU</button><button class="jg-pill" data-pat="d">Downs</button></div>
        <div class="jg-practice-host"></div>
        <div class="jg-row"><button class="jg-btn jg-learned">${getSavedSongs()[song.title]?.status === "completed" ? "✅ Learned" : "Mark as learned (+15 XP)"}</button></div>
      </div>
      <div class="jg-instrument-host"></div>
    </div>`;
  const inst = mountInstrument(panel.querySelector(".jg-instrument-host"));
  let pattern = DDUUDU;
  let box = null;
  const mount = () => {
    if (box) box.destroy();
    const items = () => chordTimeline(p.shapes.concat(p.shapes).map((c) => ({ chord: c, shape: chordShape(c) })), { beatsPerChord: 4, pattern });
    box = createPracticeBox(panel.querySelector(".jg-practice-host"), inst, { items, bpm, modes: ["listen", "wait"], label: "Play along", drums: true, key: `song:${song.title}`, restore: () => inst.fb.showShape(chordShape(p.shapes[0])) });
  };
  mount();
  inst.fb.showShape(chordShape(p.shapes[0]));
  cleanup = () => { box && box.destroy(); inst.hw.destroy(); };
  panel.querySelector(".jg-exit").addEventListener("click", () => renderSongs(panel));
  panel.querySelectorAll(".jg-dg-btn").forEach((b) => b.addEventListener("click", () => {
    const sh = chordShape(b.dataset.chord);
    inst.fb.showShape(sh);
    strum(shapeMidis(sh));
  }));
  panel.querySelectorAll("[data-bpm]").forEach((b) => b.addEventListener("click", () => {
    bpm = Number(b.dataset.bpm);
    panel.querySelectorAll("[data-bpm]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
    mount();
  }));
  panel.querySelectorAll("[data-pat]").forEach((b) => b.addEventListener("click", () => {
    pattern = b.dataset.pat === "d" ? ["down", "down", "down", "down"] : DDUUDU;
    panel.querySelectorAll("[data-pat]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
    mount();
  }));
  panel.querySelector(".jg-learned").addEventListener("click", (e) => {
    markSongStatus(song.title, "completed");
    e.target.textContent = "✅ Learned";
  });
}

function leaveSongs() {
  if (cleanup) { cleanup(); cleanup = null; }
}

export { renderSongs, leaveSongs };
