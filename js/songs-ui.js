// Songs tab: the library, filterable by level and searchable, each song
// with its easiest capo and chord shapes, and a play-along.

import { SONGS, SONG_STRUCTURES, getDifficulty } from "./songs-data.js";
import { songPlan } from "./song-plan.js";
import { chordShape, shapeMidis, transposeSymbol } from "./guitar-theory.js";
import { videoHtml, wireVideos } from "./media.js";
import { SONG_VIDEOS } from "./media-data.js";
import { icon } from "./icons.js";
import { chordDiagramSvg } from "./fretboard.js";
import { strum } from "./guitar-audio.js";
import { mountInstrument, createPracticeBox } from "./practice-widget.js";
import { getSavedSongs, markSongStatus } from "./storage.js";
import { chordTimeline } from "./guitar-player.js";

const DDUUDU = ["down", null, "down", "up", null, "up", "down", "up"];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let filter = { tier: "All", q: "", world: false };
let cleanup = null;

let lastPanel = null;
function renderSongs(panel) {
  lastPanel = panel;
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

// Album artwork from Apple's public iTunes Search (only the song title and
// artist are sent), cached on the device; initials if offline.
const ART_KEY = "jg_song_art";
const artCache = () => { try { return JSON.parse(localStorage.getItem(ART_KEY) || "{}"); } catch (e) { return {}; } };
async function songArt(song) {
  const id = `${song.title}|${song.artist}`;
  if (artCache()[id]) return artCache()[id];
  const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(`${song.title} ${song.artist}`)}&entity=song&limit=5&country=us`);
  const data = await res.json();
  const hit = (data.results || []).find((r) => r.artistName?.toLowerCase().includes(song.artist.split(/[ ,&(]/)[0].toLowerCase())) || data.results?.[0];
  if (!hit?.artworkUrl100) return null;
  const art = { img: hit.artworkUrl100.replace("100x100bb", "300x300bb"), url: hit.trackViewUrl || "" };
  try { localStorage.setItem(ART_KEY, JSON.stringify({ ...artCache(), [id]: art })); } catch (e) { /* ignore */ }
  return art;
}
// The song's chords section by section, neighbours with the same chords grouped.
function progressionRows(song) {
  const st = SONG_STRUCTURES[song.title];
  if (!st) return [{ label: "Main part", chords: song.chords }];
  const rows = [];
  st.forEach((part) => {
    const name = part.section.replace(/\s+\d+$/, "");
    const last = rows[rows.length - 1];
    if (last && last.chords.join() === part.chords.join()) { if (!last.names.includes(name)) last.names.push(name); }
    else rows.push({ names: [name], chords: part.chords });
  });
  return rows.map((r) => ({ label: r.names.join(" · "), chords: r.chords }));
}
// Bar by bar, start to finish.
function wholeSongChords(song) {
  const out = [];
  (SONG_STRUCTURES[song.title] || []).forEach((part) => {
    const bars = part.bars || part.chords.length;
    for (let i = 0; i < bars; i++) out.push(part.chords[i % part.chords.length]);
  });
  return out;
}
const initials = (name) => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function openSong(panel, song) {
  const p = songPlan(song);
  const unique = [...new Set(p.shapes)];
  let bpm = 80;
  panel.onclick = null;
  panel.innerHTML = `
    <div class="jg-lesson-player">
      <div class="jg-lesson-content">
        <button class="jg-exit">← All songs</button>
        <div class="jg-song-card">
          <a class="jg-song-art" id="jg-song-art"><span>${esc(initials(song.artist))}</span></a>
          <div class="jg-song-info"><h2>${esc(song.title)}</h2><p>${esc(song.artist)}</p>
            <span class="jg-song-key">${icon("guitar", 18)} Key of ${esc((song.key || "?").replace(/\s*\(.*\)/, ""))}</span>
            ${p.capo ? `<span class="jg-capo">Capo ${p.capo}: play ${esc([...new Set(p.shapes)].join(" – "))}</span>` : ""}</div>
        </div>
        <div class="jg-song-prog"><div class="jg-song-prog-title">The chords in this song</div>
          ${progressionRows(song).map((r) => `<div class="jg-song-prog-row"><span>${esc(r.label)}</span><b>${r.chords.map((c) => `<i>${esc(c)}</i>`).join("")}</b></div>`).join("")}
        </div>
        ${SONG_VIDEOS[song.title] ? videoHtml(SONG_VIDEOS[song.title]) : ""}
        <div class="jg-diagram-row">${unique.map((c) => `<button class="jg-btn jg-dg-btn" data-chord="${esc(c)}">${chordDiagramSvg(chordShape(c), c)}</button>`).join("")}</div>
        <div class="jg-row"><span class="jg-label">Practice tempo</span>${[60, 80, 100, 120].map((t) => `<button class="jg-pill ${t === bpm ? "jg-pill-active" : ""}" data-bpm="${t}">${t}</button>`).join("")}
          <span class="jg-label">Strum</span><button class="jg-pill jg-pill-active" data-pat="dduudu">D·DU·UDU</button><button class="jg-pill" data-pat="d">Downs</button></div>
        <div class="jg-row"><span class="jg-label">Play</span><button class="jg-pill jg-pill-active" data-part="main">Main part (4 chords)</button>${SONG_STRUCTURES[song.title] ? `<button class="jg-pill" data-part="whole">Whole song</button>` : ""}</div>
        <div class="jg-practice-host"></div>
        <div class="jg-row"><button class="jg-btn jg-learned">${getSavedSongs()[song.title]?.status === "completed" ? `${icon("check", 18)} Learned` : "Mark as learned (+15 XP)"}</button></div>
      </div>
      <div class="jg-instrument-host"></div>
    </div>`;
  const inst = mountInstrument(panel.querySelector(".jg-instrument-host"));
  let pattern = DDUUDU;
  let part = "main";
  let box = null;
  // Whole song: the structure's chords, moved to the capo shapes.
  const shapeFor = (c) => { const t = transposeSymbol(c, -(p.capo || 0)); return chordShape(t) ? t : (chordShape(c) ? c : null); };
  const mount = () => {
    if (box) box.destroy();
    const seq = part === "whole" ? wholeSongChords(song).map(shapeFor).filter(Boolean) : p.shapes.concat(p.shapes);
    const items = () => chordTimeline(seq.map((c) => ({ chord: c, shape: chordShape(c) })), { beatsPerChord: 4, pattern });
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
  panel.querySelectorAll("[data-part]").forEach((b) => b.addEventListener("click", () => {
    part = b.dataset.part;
    panel.querySelectorAll("[data-part]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
    mount();
  }));
  wireVideos(panel);
  songArt(song).then((art) => {
    const el = panel.querySelector("#jg-song-art");
    if (!art || !el) return;
    el.innerHTML = `<img src="${art.img}" alt="" />`;
    if (art.url) { el.href = art.url; el.target = "_blank"; el.rel = "noopener"; }
  }).catch(() => {});
  panel.querySelectorAll("[data-pat]").forEach((b) => b.addEventListener("click", () => {
    pattern = b.dataset.pat === "d" ? ["down", "down", "down", "down"] : DDUUDU;
    panel.querySelectorAll("[data-pat]").forEach((x) => x.classList.toggle("jg-pill-active", x === b));
    mount();
  }));
  panel.querySelector(".jg-learned").addEventListener("click", (e) => {
    markSongStatus(song.title, "completed");
    e.currentTarget.innerHTML = `${icon("check", 18)} Learned`;
  });
}

function leaveSongs() {
  if (cleanup) { cleanup(); cleanup = null; }
}

// Used by "songs with the same chords" and "Guess the song" in Practice.
function openSongByTitle(title) {
  const song = SONGS.find((s) => s.title.toLowerCase() === String(title).toLowerCase());
  if (!song) return false;
  document.querySelector('.jg-tab[data-tab="songs"]')?.click();
  setTimeout(() => lastPanel && openSong(lastPanel, song), 50);
  return true;
}

export { renderSongs, leaveSongs, openSongByTitle };
