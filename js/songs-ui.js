// Songs tab: the library, filterable by level and searchable, each song
// with its easiest capo and chord shapes, and a play-along.

import { SONGS, SONG_STRUCTURES, APPROX_STRUCTURES, getDifficulty } from "./songs-data.js";
import { songPlan } from "./song-plan.js";
import { chordShape, shapeMidis, transposeSymbol } from "./guitar-theory.js";
import { videoHtml, wireVideos } from "./media.js";
import { SONG_VIDEOS } from "./media-data.js";
import { SONG_ART } from "./song-art-data.js";
import { icon } from "./icons.js";
import { chordDiagramSvg } from "./fretboard.js";
import { strum } from "./guitar-audio.js";
import { mountInstrument, createPracticeBox } from "./practice-widget.js";
import { getSavedSongs, markSongStatus } from "./storage.js";
import { chordTimeline } from "./guitar-player.js";

const DDUUDU = ["down", null, "down", "up", null, "up", "down", "up"];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let filter = { tier: "All", q: "" };
let cleanup = null;

let lastPanel = null;
// The library, Netflix-style: one row per genre, each scrolling sideways.
const ROW_TESTS = {
  "International": (g) => /^World/.test(g),
  "Christmas": (g) => /Christmas|Holiday/i.test(g),
  "Jazz": (g) => /Jazz/i.test(g),
  "Film & classical": (g) => /Classical|Film|Soundtrack|Contemporary Piano|Piano duet/i.test(g),
  "Hip-hop": (g) => /Hip-Hop/i.test(g),
  "R&B, soul & disco": (g) => /R&B|Soul|Funk|Disco/i.test(g),
  "Reggae & Latin": (g) => /Reggae|Dancehall|Latin/i.test(g),
  "Folk & country": (g) => /Folk|Country|Traditional|Hymn|Ukulele/i.test(g),
  "Metal": (g) => /Metal/i.test(g),
  "Rock & alternative": (g) => /Rock|Britpop|Alternative|Indie|Blues|Grunge/i.test(g),
  "Pop": () => true,
};
const KARAOKE = ["Sweet Caroline", "Bohemian Rhapsody", "Don't Stop Believin'", "I Want It That Way", "Dancing Queen", "Mr. Brightside", "I Will Survive", "Wonderwall", "Piano Man", "Man! I Feel Like a Woman!", "Total Eclipse of the Heart", "Take On Me", "Like a Prayer", "Valerie", "Before He Cheats", "Tennessee Whiskey", "Angels", "My Way", "Africa", "Lose Control"];
const ROW_ORDER = ["Popular right now", "Karaoke anthems", "Pop", "Rock & alternative", "Metal", "Folk & country", "R&B, soul & disco", "Hip-hop", "Reggae & Latin", "Jazz", "Film & classical", "Christmas", "International"];
function libraryRows(q, tier) {
  const byRank = (a, b) => (a.popularityRank || 999) - (b.popularityRank || 999);
  const songs = SONGS.filter((s) => songPlan(s).playable)
    .filter((s) => tier === "All" || getDifficulty(s) === tier)
    .filter((s) => !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  const rows = Object.fromEntries(ROW_ORDER.map((n) => [n, []]));
  // (Karaoke anthems is filled from its own list below.)
  if (!q) rows["Popular right now"] = songs.filter((s) => !s.genre?.startsWith("World")).sort(byRank).slice(0, 12);
  if (!q) rows["Karaoke anthems"] = KARAOKE.map((t) => songs.find((s) => s.title === t)).filter(Boolean);
  songs.forEach((s) => rows[Object.keys(ROW_TESTS).find((n) => ROW_TESTS[n](s.genre || ""))].push(s));
  return ROW_ORDER.map((name) => ({ name, songs: ["Popular right now", "Karaoke anthems"].includes(name) ? rows[name] : rows[name].sort(byRank) })).filter((r) => r.songs.length);
}

function renderSongs(panel) {
  lastPanel = panel;
  if (cleanup) { cleanup(); cleanup = null; }
  const saved = getSavedSongs();
  const tiers = ["All", "Beginner", "Intermediate", "Advanced"];
  panel.innerHTML = `
    <div class="jg-row">
      <input class="jg-btn jg-song-q" type="search" placeholder="Search songs or artists" value="${esc(filter.q)}" style="flex:1 1 220px">
      ${tiers.map((t) => `<button class="jg-pill ${filter.tier === t ? "jg-pill-active" : ""}" data-tier="${t}">${t}</button>`).join("")}
    </div>
    <div class="jg-lib"></div>`;
  const lib = panel.querySelector(".jg-lib");
  function draw() {
    const rows = libraryRows(filter.q.toLowerCase(), filter.tier);
    lib.innerHTML = rows.map((row) => `
      <section class="jg-lib-row"><h3>${esc(row.name)}</h3>
        <div class="jg-lib-scroll">${row.songs.map((s) => {
          const art = SONG_ART[`${s.title}|${s.artist}`];
          return `<button class="jg-lib-card" data-song="${esc(s.title)}" aria-label="${esc(s.title)} by ${esc(s.artist)}">
            <span class="jg-lib-art">${art ? `<img src="${art.img}" alt="" loading="lazy" />` : `<span class="jg-lib-initials">${esc(s.title.slice(0, 1))}</span>`}
              ${saved[s.title]?.status === "completed" ? `<span class="jg-lib-tag">${icon("check", 14)} Learned</span>` : ""}
              <span class="jg-lib-play">${icon("play", 34)}</span></span>
            <span class="jg-lib-title">${esc(s.title)}</span>
            <span class="jg-lib-artist">${esc(s.artist)}</span>
          </button>`;
        }).join("")}</div>
      </section>`).join("") || '<p class="jg-note">No songs match.</p>';
  }
  draw();
  panel.querySelector(".jg-song-q").addEventListener("input", (e) => { filter.q = e.target.value; draw(); });
  panel.onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.tier) { filter.tier = b.dataset.tier; renderSongs(panel); }
    // Tap a song: the play-along opens and starts right away.
    else if (b.dataset.song) openSong(panel, SONGS.find((s) => s.title === b.dataset.song), { autoplay: true });
  };
}

// Album artwork from Apple's public iTunes Search (only the song title and
// artist are sent), cached on the device; initials if offline.
const ART_KEY = "jg_song_art";
const artCache = () => { try { return JSON.parse(localStorage.getItem(ART_KEY) || "{}"); } catch (e) { return {}; } };
async function songArt(song) {
  const id = `${song.title}|${song.artist}`;
  if (SONG_ART[id]) return SONG_ART[id];
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

function openSong(panel, song, { autoplay = false } = {}) {
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
        <div class="jg-row"><span class="jg-label">Play</span><button class="jg-pill jg-pill-active" data-part="main">Main part (4 chords)</button>${SONG_STRUCTURES[song.title] ? `<button class="jg-pill" data-part="whole">Whole song${APPROX_STRUCTURES.has(song.title) ? " (our best guide)" : ""}</button>` : ""}</div>
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
  if (autoplay) setTimeout(() => panel.querySelector(".jg-pb-go")?.click(), 400);
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
