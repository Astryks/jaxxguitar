// Jaxx Guitar's card animations: music objects and legendary guitars, drawn
// in SVG with real lighting (the js-vol filter), so most cards show a
// boombox, a cassette, a Walkman, strings or a famous guitar rather than
// the puppy. The puppy (js/puppy.js) still turns up now and then.
//
// sceneSvg(name) returns one 400 x 240 scene. pickScene(topic) chooses one
// for a card: metal lessons get the metal stage, history lessons a legend.

import { puppySvg } from "./puppy.js";

const DEFS = `<defs>
  <filter id="js-vol" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b"/>
    <feDiffuseLighting in="b" surfaceScale="4" diffuseConstant="1" lighting-color="#fff" result="d"><feDistantLight azimuth="235" elevation="45"/></feDiffuseLighting>
    <feSpecularLighting in="b" surfaceScale="4" specularConstant="0.6" specularExponent="34" lighting-color="#fff" result="sp"><feDistantLight azimuth="235" elevation="45"/></feSpecularLighting>
    <feComposite in="sp" in2="SourceAlpha" operator="in" result="sp2"/><feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1.02" k2="0" k3="0" k4="0" result="lit"/>
    <feComposite in="lit" in2="SourceAlpha" operator="in" result="lit2"/><feComposite in="lit2" in2="sp2" operator="arithmetic" k1="0" k2="1" k3="0.45" k4="0"/></filter>
  <filter id="js-soft"><feGaussianBlur stdDeviation="6"/></filter>
  <linearGradient id="js-silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset="0.5" stop-color="#b9c1ca"/><stop offset="1" stop-color="#7d8894"/></linearGradient>
  <linearGradient id="js-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4752"/><stop offset="1" stop-color="#16151a"/></linearGradient>
  <radialGradient id="js-cone" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#2a2a30"/><stop offset="0.7" stop-color="#48484f"/><stop offset="0.86" stop-color="#1c1c21"/><stop offset="1" stop-color="#5a5a62"/></radialGradient>
  <radialGradient id="js-cap" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#8a8a94"/><stop offset="1" stop-color="#1c1c21"/></radialGradient>
  <linearGradient id="js-shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b4b55" stop-opacity="0.95"/><stop offset="1" stop-color="#1d1d23" stop-opacity="0.95"/></linearGradient>
  <linearGradient id="js-label" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4dc"/><stop offset="1" stop-color="#f1dcb0"/></linearGradient>
  <linearGradient id="js-walk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a9bd0"/><stop offset="1" stop-color="#2f6aa0"/></linearGradient>
  <linearGradient id="js-burst" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1608"/><stop offset="0.35" stop-color="#9a3d12"/><stop offset="0.6" stop-color="#e3a43a"/><stop offset="1" stop-color="#f6d27a"/></linearGradient>
  <linearGradient id="js-string" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#9aa3ad"/></linearGradient>
  <linearGradient id="js-stage" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2140"/><stop offset="1" stop-color="#120d1f"/></linearGradient>
  <linearGradient id="js-gallery" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3346"/><stop offset="1" stop-color="#211c29"/></linearGradient>
  <linearGradient id="js-spot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc" stop-opacity="0.45"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0.06"/></linearGradient>
  <linearGradient id="js-sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b4b9a"/><stop offset="0.55" stop-color="#e98a5a"/><stop offset="1" stop-color="#ffd08a"/></linearGradient>
  <linearGradient id="js-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>`;

const reel = (cx, cy, r = 13) => `<g class="js-reel" style="transform-origin:${cx}px ${cy}px">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f2f2f2" stroke="#9aa3ad" stroke-width="1.2"/>
    ${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="${cx - 1.6}" y="${cy - r + 1}" width="3.2" height="5" fill="#9aa3ad" transform="rotate(${a} ${cx} ${cy})"/>`).join("")}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.35}" fill="#3a3a42"/></g>`;
const notes = `<g class="js-notes"><text x="70" y="70">♪</text><text x="320" y="56">♫</text><text x="340" y="120">♪</text><text x="52" y="130">♬</text></g>`;

// A big chrome-and-black boombox with pumping speakers and EQ lights.
function boombox() {
  const speaker = (cx) => `<g class="js-speaker" style="transform-origin:${cx}px 142px"><circle cx="${cx}" cy="142" r="44" fill="url(#js-silver)"/><circle cx="${cx}" cy="142" r="38" fill="url(#js-cone)"/>
      <circle cx="${cx}" cy="142" r="13" fill="url(#js-cap)"/><circle cx="${cx - 5}" cy="137" r="4" fill="#fff" opacity="0.25"/></g>`;
  const eq = Array.from({ length: 9 }, (_, i) => `<rect x="${170 + i * 7}" y="${112 - (i % 4) * 4}" width="5" height="${14 + (i % 4) * 4}" rx="1" class="js-eq" style="animation-delay:${(i * 0.09).toFixed(2)}s"/>`).join("");
  return `<ellipse cx="200" cy="224" rx="170" ry="8" fill="#000" opacity="0.15"/>
    <g filter="url(#js-vol)"><path d="M120 76 Q120 52 140 52 H260 Q280 52 280 76" fill="none" stroke="#2a2a30" stroke-width="10" stroke-linecap="round"/>
    <rect x="30" y="76" width="340" height="146" rx="18" fill="url(#js-dark)"/></g>
    <rect x="36" y="82" width="328" height="12" rx="6" fill="url(#js-silver)" opacity="0.9"/>
    <path d="M330 76 L362 18" stroke="#c9ced6" stroke-width="3"/><circle cx="362" cy="18" r="3" fill="#c9ced6"/>
    ${speaker(92)}${speaker(308)}
    <g filter="url(#js-vol)"><rect x="150" y="104" width="100" height="34" rx="4" fill="#0e0e12"/></g>${eq}
    <g filter="url(#js-vol)"><rect x="152" y="146" width="96" height="52" rx="5" fill="url(#js-shell)"/></g>
    <rect x="162" y="154" width="76" height="26" rx="3" fill="url(#js-label)" opacity="0.92"/>${reel(182, 167, 9)}${reel(218, 167, 9)}
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${156 + i * 18}" y="204" width="14" height="10" rx="2" fill="url(#js-silver)"/>`).join("")}
    <circle cx="150" cy="96" r="2.2" fill="#ff5b5b" class="js-led"/>
    ${notes}`;
}

// A cassette close-up: tinted shell, a hand-written label, turning reels.
function cassette() {
  return `<ellipse cx="200" cy="216" rx="160" ry="8" fill="#000" opacity="0.15"/>
    <g filter="url(#js-vol)"><rect x="40" y="36" width="320" height="176" rx="14" fill="url(#js-shell)"/></g>
    <rect x="56" y="50" width="288" height="104" rx="8" fill="url(#js-label)"/>
    <rect x="56" y="50" width="288" height="16" rx="8" fill="#e5484d"/><rect x="56" y="62" width="288" height="6" fill="#f5a142"/>
    <text x="74" y="94" class="js-hand">Jaxx's mixtape</text><path d="M74 102 H270" stroke="#c9b48a" stroke-width="1.2"/>
    <rect x="128" y="106" width="144" height="40" rx="20" fill="#1b1b20"/>
    <path d="M150 126 Q200 140 250 126" stroke="#5a3a24" stroke-width="10" fill="none" opacity="0.85"/>
    ${reel(150, 126, 16)}${reel(250, 126, 16)}
    <path d="M110 212 L130 176 H270 L290 212 Z" fill="#2a2a32"/>
    ${[[52, 48], [348, 48], [52, 200], [348, 200], [200, 196]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="url(#js-silver)"/><path d="M${x - 2.4} ${y} h4.8" stroke="#555" stroke-width="1"/>`).join("")}
    <circle cx="160" cy="194" r="5" fill="#111"/><circle cx="240" cy="194" r="5" fill="#111"/>
    <path d="M60 46 L130 46" stroke="#fff" stroke-width="3" opacity="0.25" stroke-linecap="round"/>`;
}

// A Walkman with foam headphones on a coiled cable.
function walkman() {
  return `<ellipse cx="200" cy="222" rx="150" ry="7" fill="#000" opacity="0.14"/>
    <g class="js-phones"><path d="M216 70 Q290 -6 364 70" fill="none" stroke="url(#js-silver)" stroke-width="7" stroke-linecap="round"/>
      <g filter="url(#js-vol)"><ellipse cx="216" cy="86" rx="20" ry="24" fill="#f08a2a"/><ellipse cx="364" cy="86" rx="20" ry="24" fill="#f08a2a"/></g>
      <ellipse cx="216" cy="86" rx="10" ry="13" fill="#d06c14" opacity="0.6"/><ellipse cx="364" cy="86" rx="10" ry="13" fill="#d06c14" opacity="0.6"/></g>
    <path d="M216 110 C220 160 180 150 168 170" fill="none" stroke="#2a2a30" stroke-width="2.4"/>
    <g filter="url(#js-vol)"><rect x="54" y="66" width="128" height="156" rx="12" fill="url(#js-walk)"/></g>
    <rect x="66" y="80" width="104" height="70" rx="6" fill="url(#js-shell)"/>
    <rect x="74" y="88" width="88" height="30" rx="3" fill="url(#js-label)" opacity="0.9"/>${reel(98, 103, 9)}${reel(138, 103, 9)}
    <rect x="66" y="160" width="104" height="8" rx="3" fill="url(#js-silver)"/>
    ${["PLAY", "STOP", "FF"].map((t, i) => `<g filter="url(#js-vol)"><rect x="${68 + i * 34}" y="${176 + (i === 0 ? 2 : 0)}" width="30" height="16" rx="3" fill="url(#js-silver)"/></g><text x="${83 + i * 34}" y="${188 + (i === 0 ? 2 : 0)}" class="js-btn">${t}</text>`).join("")}
    <circle cx="160" cy="208" r="7" fill="url(#js-silver)"/><path d="M60 72 L120 72" stroke="#fff" stroke-width="3" opacity="0.3" stroke-linecap="round"/>
    <text x="74" y="210" class="js-brand">Walk-a-tune</text>
    ${notes}`;
}

// Electric guitar close-up: sunburst top, two pickups, six strings that
// shimmer when they're played.
function strings() {
  const ys = [92, 106, 120, 134, 148, 162];
  const w = [1.2, 1.5, 1.9, 2.4, 2.9, 3.4];
  return `<rect width="400" height="240" fill="#1b1410"/>
    <g filter="url(#js-vol)"><path d="M-20 30 Q140 0 260 40 Q330 60 420 40 L420 240 L-20 240 Z" fill="url(#js-burst)"/></g>
    <path d="M-20 34 Q140 4 260 44 Q330 64 420 44" fill="none" stroke="#f6e6c0" stroke-width="3" opacity="0.7"/>
    ${[90, 210].map((x) => `<g filter="url(#js-vol)"><rect x="${x}" y="80" width="64" height="94" rx="8" fill="#1a1a1e"/></g>
      ${ys.map((y) => `<circle cx="${x + 20}" cy="${y}" r="3.2" fill="url(#js-silver)"/><circle cx="${x + 44}" cy="${y}" r="3.2" fill="url(#js-silver)"/>`).join("")}`).join("")}
    <g filter="url(#js-vol)"><rect x="318" y="78" width="26" height="100" rx="4" fill="url(#js-silver)"/></g>
    ${ys.map((y, i) => `<path class="js-str js-str-${i}" d="M-20 ${y} H330" stroke="${i < 2 ? "#eef1f4" : "#d9c9a8"}" stroke-width="${w[i]}"/><path d="M-20 ${y - w[i] / 3} H330" stroke="#fff" stroke-width="0.6" opacity="0.8"/>`).join("")}
    ${[[364, 190], [364, 214], [390, 202]].map(([x, y]) => `<g filter="url(#js-vol)"><circle cx="${x}" cy="${y}" r="10" fill="url(#js-silver)"/></g>`).join("")}
    <path class="js-pick" d="M150 150 q12 -4 16 8 q-4 12 -14 10 q-8 -6 -2 -18z" fill="#e5484d"/>`;
}

// Kid-friendly metal: a stage, a stack of amps, lights sweeping through
// fog, and a pointy guitar on its stand. Loud, not scary.
function metal() {
  const cab = (x, y) => `<g filter="url(#js-vol)"><rect x="${x}" y="${y}" width="96" height="64" rx="4" fill="#141418"/></g>
    <rect x="${x + 6}" y="${y + 6}" width="84" height="52" rx="2" fill="#2a2a30"/>
    ${[[24, 18], [60, 18], [24, 46], [60, 46]].map(([dx, dy]) => `<circle class="js-cone" cx="${x + 6 + dx}" cy="${y + dy}" r="13" fill="url(#js-cone)" style="transform-origin:${x + 6 + dx}px ${y + dy}px"/>`).join("")}`;
  return `<rect width="400" height="240" fill="url(#js-stage)"/>
    <g class="js-beams"><path class="js-beam js-beam-1" d="M80 0 L20 230 L150 230 Z" fill="url(#js-beam)"/><path class="js-beam js-beam-2" d="M320 0 L250 230 L380 230 Z" fill="url(#js-beam)"/></g>
    <rect x="0" y="204" width="400" height="36" fill="#0b0810"/>
    ${cab(220, 140)}${cab(316, 140)}${cab(220, 76)}${cab(316, 76)}
    <g filter="url(#js-vol)"><rect x="226" y="48" width="180" height="28" rx="4" fill="#141418"/></g>
    ${Array.from({ length: 8 }, (_, i) => `<circle cx="${244 + i * 19}" cy="62" r="4.5" fill="url(#js-silver)"/>`).join("")}<circle cx="236" cy="62" r="2.4" fill="#ff5b5b" class="js-led"/>
    <g class="js-vguitar" transform="translate(-96 -4) scale(0.92)" style="transform-origin:0 0">${LEGENDS.rhoads.draw().replace(/translate\(400 0\) scale\(-1 1\)/g, "")}</g>
    <path d="M70 236 L86 204 L102 236" stroke="#7d8894" stroke-width="3" fill="none"/>
    <path class="js-bolt" d="M170 40 L150 92 L168 92 L156 140 L196 74 L176 74 L190 40 Z" fill="#ffd23f"/>
    <g class="js-fog"><ellipse cx="80" cy="214" rx="120" ry="22" fill="#fff" opacity="0.18" filter="url(#js-soft)"/><ellipse cx="300" cy="218" rx="140" ry="24" fill="#fff" opacity="0.16" filter="url(#js-soft)"/></g>`;
}

// A rock concert: truss and lights, a band on stage, speaker stacks, a
// banner, confetti, and a crowd with hands in the air.
function concert() {
  const crowd = Array.from({ length: 16 }, (_, k) => {
    const x = 8 + k * 25 + (k % 2) * 6, y = 206 + (k % 3) * 6;
    return `<g class="js-fan js-fan-${k % 4}" style="transform-origin:${x}px ${y + 30}px"><circle cx="${x}" cy="${y}" r="9"/><path d="M${x - 12} ${y + 34} Q${x - 12} ${y + 10} ${x} ${y + 10} Q${x + 12} ${y + 10} ${x + 12} ${y + 34} Z"/>
      ${k % 3 === 0 ? `<path class="js-hand" d="M${x + 8} ${y + 14} L${x + 16} ${y - 14}" stroke-width="5" stroke-linecap="round"/>` : ""}${k % 4 === 1 ? `<path class="js-hand js-hand-2" d="M${x - 8} ${y + 14} L${x - 18} ${y - 12}" stroke-width="5" stroke-linecap="round"/>` : ""}</g>`;
  }).join("");
  const beam = (x, c, cls) => `<path class="js-cbeam ${cls}" d="M${x - 4} 18 L${x + 4} 18 L${x + 70} 200 L${x - 70} 200 Z" fill="${c}" style="transform-origin:${x}px 18px"/>`;
  const confetti = Array.from({ length: 22 }, (_, k) => `<rect class="js-conf" x="${(k * 47) % 400}" y="${-10 - (k * 13) % 60}" width="5" height="9" rx="1" fill="${["#ff5b8a", "#ffd23f", "#3ddc84", "#5ab0ff", "#c38bff"][k % 5]}" style="animation-delay:${((k * 0.23) % 3).toFixed(2)}s"/>`).join("");
  const stack = (x) => `<g filter="url(#js-vol)"><rect x="${x}" y="96" width="54" height="104" rx="3" fill="#141418"/></g>${[0, 1, 2].map((r) => [0, 1].map((c) => `<circle class="js-cone" cx="${x + 15 + c * 24}" cy="${114 + r * 32}" r="10" fill="url(#js-cone)" style="transform-origin:${x + 15 + c * 24}px ${114 + r * 32}px"/>`).join("")).join("")}`;
  return `<rect width="400" height="240" fill="url(#js-stage)"/>
    <circle cx="200" cy="110" r="120" fill="#7a3cff" opacity="0.18" filter="url(#js-soft)" class="js-haze"/>
    <rect x="10" y="10" width="380" height="10" rx="3" fill="url(#js-silver)"/>${[30, 110, 200, 290, 370].map((x) => `<rect x="${x - 7}" y="18" width="14" height="10" rx="3" fill="#2a2a30"/>`).join("")}
    <g opacity="0.55">${beam(30, "#ff5b8a", "js-cb-1")}${beam(110, "#5ab0ff", "js-cb-2")}${beam(290, "#ffd23f", "js-cb-3")}${beam(370, "#3ddc84", "js-cb-4")}${beam(200, "#ffffff", "js-cb-5")}</g>
    <g filter="url(#js-vol)"><rect x="120" y="40" width="160" height="34" rx="6" fill="#e5484d"/></g><text x="200" y="65" class="js-banner" text-anchor="middle">JAXX LIVE!</text>
    ${stack(4)}${stack(342)}
    <rect x="0" y="196" width="400" height="10" fill="#2a2230"/>
    <g class="js-drums"><ellipse cx="200" cy="184" rx="20" ry="13" fill="#e5484d"/><ellipse cx="200" cy="184" rx="14" ry="9" fill="#f4efe2"/><ellipse class="js-cymbal" cx="170" cy="150" rx="13" ry="3" fill="#e8c25a" style="transform-origin:170px 150px"/><path d="M170 150 V196" stroke="#9aa3ad" stroke-width="2"/><ellipse class="js-cymbal js-cymbal-2" cx="232" cy="156" rx="11" ry="3" fill="#e8c25a" style="transform-origin:232px 156px"/><path d="M232 156 V196" stroke="#9aa3ad" stroke-width="2"/>
      <g fill="#140f1c"><circle cx="200" cy="146" r="8"/><rect x="190" y="154" width="20" height="22" rx="6"/></g></g>
    <g class="js-band" fill="#140f1c">
      <g class="js-guitarist" style="transform-origin:120px 196px"><circle cx="120" cy="134" r="9"/><rect x="110" y="142" width="20" height="30" rx="6"/><path d="M114 170 L108 196 M126 170 L132 196" stroke="#140f1c" stroke-width="7" stroke-linecap="round"/>
        <path d="M100 166 L146 146" stroke="#2a2a30" stroke-width="3"/><path d="M98 158 C92 166 96 176 106 176 L114 170 C116 162 108 154 98 158 Z" fill="#ffd23f"/></g>
      <g class="js-bassist" style="transform-origin:282px 196px"><circle cx="282" cy="136" r="9"/><rect x="272" y="144" width="20" height="30" rx="6"/><path d="M276 172 L272 196 M288 172 L292 196" stroke="#140f1c" stroke-width="7" stroke-linecap="round"/>
        <path d="M262 170 L312 150" stroke="#2a2a30" stroke-width="3"/><path d="M258 160 C252 170 256 182 268 180 L276 172 C276 164 268 156 258 160 Z" fill="#5ab0ff"/></g>
    </g>
    <g class="js-crowd" fill="#0b0810" stroke="#0b0810">${crowd}</g>
    <g class="js-confetti">${confetti}</g>`;
}

// ----- Legendary guitars (facts checked against Wikipedia, Oct 2026) -----
// Each one stands on a museum stand under a spotlight. Drawn from the real
// guitar's shape and finish, with no brand logos. LEGENDS[id].fact is the
// caption shown under the card.
const BODY = {
  strat: "M200 122 C186 122 176 112 168 104 C160 98 150 104 152 116 C154 130 160 138 156 150 C150 166 140 176 142 196 C146 222 176 230 200 230 C226 230 256 224 260 198 C262 178 250 166 246 152 C242 140 246 128 248 118 C250 108 242 100 234 106 C226 114 216 122 200 122 Z",
  lp: "M200 124 C186 124 170 120 162 128 C152 140 158 154 152 166 C144 182 144 206 158 220 C172 232 228 232 242 220 C256 206 256 184 246 168 C240 156 246 146 244 136 C242 126 236 116 230 110 C226 120 216 126 206 124 Z",
  semi: "M200 118 C190 118 182 122 176 116 C168 106 150 108 148 124 C146 136 156 144 150 156 C138 172 136 200 150 216 C166 232 234 232 250 216 C264 200 262 172 250 156 C244 144 254 136 252 124 C250 108 232 106 224 116 C218 122 210 118 200 118 Z",
  acoustic: "M200 112 C184 112 170 112 162 120 C154 128 160 142 156 152 C146 168 136 184 140 204 C146 228 176 234 200 234 C224 234 254 228 260 204 C264 184 254 168 244 152 C240 142 246 128 238 120 C230 112 216 112 200 112 Z",
  classical: "M200 116 C188 116 174 116 168 124 C162 132 166 144 162 152 C152 168 148 186 152 204 C158 226 180 232 200 232 C220 232 242 226 248 204 C252 186 248 168 238 152 C234 144 238 132 232 124 C226 116 212 116 200 116 Z",
  red: "M200 120 C184 118 166 118 160 134 C154 150 162 158 152 172 C140 192 146 222 172 230 C190 236 214 236 232 228 C258 218 262 190 248 170 C242 160 248 150 244 140 C240 126 232 112 222 112 C216 124 210 120 200 120 Z",
  v: "M188 118 L146 232 L176 232 L200 170 L224 232 L254 232 L212 118 Z",
};
const neck = (fb = "#3a2414", inlay = "#f2e6cc") => `<rect x="193" y="38" width="14" height="${110}" rx="2" fill="${fb}"/>
  ${Array.from({ length: 14 }, (_, k) => `<path d="M193 ${44 + k * 7.6} h14" stroke="#c9ced6" stroke-width="1"/>`).join("")}
  ${[3, 5, 7, 9].map((k) => `<circle cx="200" cy="${44 + k * 7.6 - 3.8}" r="1.6" fill="${inlay}"/>`).join("")}
  ${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M${195 + k * 2} 38 V200" stroke="#e8ebef" stroke-width="0.6" opacity="0.9"/>`).join("")}`;
const head = {
  inline: (c) => `<path d="M194 40 L194 18 Q196 6 208 8 L222 12 Q228 18 220 24 L210 32 L208 40 Z" fill="${c}"/>${[0, 1, 2, 3, 4, 5].map((k) => `<circle cx="${210 + (k % 2)}" cy="${12 + k * 4.6}" r="2" fill="url(#js-silver)"/>`).join("")}`,
  three: (c) => `<path d="M193 40 L188 14 Q200 4 212 14 L207 40 Z" fill="${c}"/>${[0, 1, 2].map((k) => `<circle cx="186" cy="${18 + k * 7}" r="2.4" fill="url(#js-silver)"/><circle cx="214" cy="${18 + k * 7}" r="2.4" fill="url(#js-silver)"/>`).join("")}`,
  slotted: (c) => `<path d="M192 40 L190 8 L210 8 L208 40 Z" fill="${c}"/><rect x="195" y="13" width="3.5" height="20" fill="#1a1208"/><rect x="201.5" y="13" width="3.5" height="20" fill="#1a1208"/>${[0, 1, 2].map((k) => `<circle cx="188" cy="${17 + k * 7}" r="2" fill="#e8d7a8"/><circle cx="212" cy="${17 + k * 7}" r="2" fill="#e8d7a8"/>`).join("")}`,
  arrow: (c) => `<path d="M193 40 L186 10 L200 0 L214 10 L207 40 Z" fill="${c}"/>${[0, 1, 2].map((k) => `<circle cx="186" cy="${16 + k * 7}" r="2.2" fill="url(#js-silver)"/><circle cx="214" cy="${16 + k * 7}" r="2.2" fill="url(#js-silver)"/>`).join("")}`,
};
const single = (x, y, a = 0) => `<rect x="${x - 15}" y="${y - 4}" width="30" height="8" rx="4" fill="#f4f1ea" stroke="#bbb" stroke-width="0.6" transform="rotate(${a} ${x} ${y})"/>`;
const hum = (x, y, c = "#1a1a1e", a = 0) => `<g transform="rotate(${a} ${x} ${y})"><rect x="${x - 16}" y="${y - 7}" width="32" height="14" rx="2.5" fill="${c}"/>${[0, 1, 2, 3, 4, 5].map((k) => `<circle cx="${x - 12.5 + k * 5}" cy="${y - 3}" r="1.2" fill="url(#js-silver)"/><circle cx="${x - 12.5 + k * 5}" cy="${y + 3}" r="1.2" fill="url(#js-silver)"/>`).join("")}</g>`;
const knobs = (pts, c = "url(#js-silver)") => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}" stroke="#555" stroke-width="0.5"/>`).join("");
const dots = (n, cx, cy, r) => Array.from({ length: n }, (_, k) => { const a = k * 2.4; const d = Math.sqrt(k) * r; return `<circle cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d).toFixed(1)}" r="4.2"/>`; }).join("");

const LEGENDS = {
  hendrix: {
    name: "Woodstock Strat", who: "Jimi Hendrix", year: "1969",
    fact: "Jimi was left-handed, so he flipped a right-handed guitar upside down and restrung it to play!",
    draw: () => `<g filter="url(#js-vol)"><path d="${BODY.strat}" fill="#f1ece0" transform="translate(400 0) scale(-1 1)"/></g><g transform="translate(400 0) scale(-1 1)">
      <path d="M182 128 C170 134 168 150 176 162 C184 176 170 196 184 206 C200 214 226 210 236 196 C240 176 226 168 222 150 C218 136 206 128 182 128 Z" fill="#fbfaf6" stroke="#d6d0c4" stroke-width="0.8"/>
      ${neck("#e7c68a", "#2a1a10")}${head.inline("#e7c68a")}${single(200, 148, -4)}${single(200, 166)}${single(200, 188, -8)}<rect x="186" y="200" width="28" height="8" rx="2" fill="url(#js-silver)"/>
      ${knobs([[226, 190], [232, 202], [234, 214]])}<path d="M214 204 q16 6 22 20" stroke="#c9ced6" stroke-width="2" fill="none"/></g>`,
  },
  frankenstrat: {
    name: "Frankenstrat", who: "Eddie Van Halen", year: "1979",
    fact: "Eddie stuck truck reflectors on the back so it would sparkle under the stage lights!",
    draw: () => `<defs><clipPath id="js-fs"><path d="${BODY.strat}"/></clipPath></defs><g filter="url(#js-vol)"><path d="${BODY.strat}" fill="#d32a2f"/></g>
      <g clip-path="url(#js-fs)" opacity="0.95"><path d="M130 150 L270 210 M130 172 L270 128 M150 236 L250 100 M140 120 L260 236 M120 196 L280 160" stroke="#f7f4ee" stroke-width="5"/><path d="M130 158 L270 218 M130 180 L270 136 M158 236 L258 100" stroke="#141418" stroke-width="3.5"/></g>
      <path d="M184 172 h30 v26 h-30 z" fill="#141418"/>${neck("#e7c68a", "#2a1a10")}${head.inline("#e7c68a")}${hum(200, 198, "#141418", -12)}
      <rect x="186" y="206" width="28" height="9" rx="2" fill="url(#js-silver)"/>${knobs([[232, 196]])}`,
  },
  redspecial: {
    name: "The Red Special", who: "Brian May", year: "1964",
    fact: "Brian and his dad built it from an old fireplace mantel, and the whammy bar tip is a knitting needle!",
    draw: () => `<g filter="url(#js-vol)"><path d="${BODY.red}" fill="#8a2a18"/></g>
      <path d="M176 140 C166 150 168 170 176 182 L224 182 C232 170 232 150 222 140 Z" fill="#141418"/>
      ${neck("#2a1a10")}${head.three("#141418")}${single(200, 150)}${single(200, 164)}${single(200, 178)}
      ${[0, 1, 2, 3, 4, 5].map((k) => `<rect x="${178 + k * 8}" y="190" width="5" height="9" rx="1" fill="#e8e8e8"/>`).join("")}
      <rect x="186" y="206" width="28" height="7" rx="2" fill="url(#js-silver)"/>${knobs([[234, 208], [222, 220], [176, 218]])}<path d="M214 210 q18 4 24 18" stroke="#c9ced6" stroke-width="2" fill="none"/>`,
  },
  trigger: {
    name: "Trigger", who: "Willie Nelson", year: "1969",
    fact: "Willie named his guitar Trigger after cowboy Roy Rogers' horse, because it was his trusty horse!",
    draw: () => `<g filter="url(#js-vol)"><path d="${BODY.classical}" fill="#d9a35a"/></g>
      <circle cx="200" cy="160" r="15" fill="#1a1208"/><circle cx="200" cy="160" r="19" fill="none" stroke="#7a4a20" stroke-width="3"/>
      <path d="M190 178 Q186 184 192 192 Q200 196 208 190 Q214 184 208 178 Q200 182 190 178 Z" fill="#1a1208"/><path d="M190 178 Q200 182 208 178" fill="none" stroke="#a87534" stroke-width="2"/>
      <g stroke="#6b4a22" stroke-width="0.8" fill="none" opacity="0.7"><path d="M164 196 q6 -6 10 0 t10 0"/><path d="M226 140 q4 -4 8 0 t8 0"/><path d="M170 140 q5 -5 9 0"/><path d="M220 210 q6 -4 10 2"/><path d="M176 214 q6 -6 12 0"/></g>
      <rect x="182" y="204" width="36" height="7" rx="2" fill="#4a2a10"/>${neck("#2a1a10", "#2a1a10")}${head.slotted("#3a2414")}`,
  },
  lucille: {
    name: "Lucille", who: "B.B. King", year: "1950s on",
    fact: "B.B. King named every one of his guitars Lucille, and he had lots of Lucilles over his life!",
    draw: () => `<g filter="url(#js-vol)"><path d="${BODY.semi}" fill="#151418"/></g>
      <path d="${BODY.semi}" fill="none" stroke="#f4efe2" stroke-width="2.4"/>
      <path d="M212 150 C228 156 232 176 224 190 L210 190 Z" fill="#26242c"/>
      ${neck("#2a1a10")}${head.three("#151418")}<text x="200" y="30" class="js-script" text-anchor="middle">Lucille</text>
      ${hum(200, 160, "#151418")}${hum(200, 186, "#151418")}<rect x="186" y="200" width="28" height="7" rx="2" fill="#d4af37"/>
      ${knobs([[228, 196], [240, 204], [228, 212], [240, 220]], "#d4af37")}<path d="M164 150 l10 -6" stroke="#d4af37" stroke-width="3"/>`,
  },
  elvis: {
    name: "Leather-cover acoustic", who: "Elvis Presley", year: "1956",
    fact: "Elvis bought a Martin guitar for $175 after trading in his old one for just $8.",
    draw: () => `<defs><clipPath id="js-ev"><path d="${BODY.acoustic}"/></clipPath></defs><g filter="url(#js-vol)"><path d="${BODY.acoustic}" fill="#8a5a2c"/></g>
      <g clip-path="url(#js-ev)"><g stroke="#5a3414" stroke-width="1.4" fill="none" opacity="0.85">${Array.from({ length: 9 }, (_, k) => `<path d="M${150 + (k % 3) * 40} ${140 + Math.floor(k / 3) * 32} q10 -14 20 0 q10 14 0 20 q-14 6 -14 -8"/>`).join("")}</g>
        <path d="M${140} 128 Q200 118 260 128 M140 226 Q200 236 260 226" stroke="#d9b07a" stroke-width="2" stroke-dasharray="3 3" fill="none"/></g>
      <circle cx="200" cy="158" r="13" fill="#1a1208" stroke="#c9a35a" stroke-width="2"/>
      ${[0, 1, 2].map((k) => `<path d="M${182 + k * 18} 196 l3 6 6 1 -5 4 1 6 -5 -3 -5 3 1 -6 -5 -4 6 -1z" fill="#f2d27a"/>`).join("")}
      ${neck("#2a1a10")}${head.three("#2a1a10")}`,
  },
  cobain: {
    name: "The blue Mustang", who: "Kurt Cobain", year: "1991",
    fact: "Kurt played left-handed, and his small blue Mustang was a beginner-sized guitar that became legendary!",
    draw: () => `<g filter="url(#js-vol)"><path d="${BODY.strat}" fill="#7fb3dc" transform="translate(400 0) scale(-1 1) translate(24 30) scale(0.88)"/></g><g transform="translate(400 0) scale(-1 1)"><g transform="translate(24 30) scale(0.88)"><defs><clipPath id="js-mu"><path d="${BODY.strat}"/></clipPath></defs>
      <g clip-path="url(#js-mu)"><path d="M150 230 L250 110" stroke="#f4f1ea" stroke-width="9"/><path d="M162 232 L262 112" stroke="#1f4f7a" stroke-width="5"/></g>
      <path d="M180 132 C168 146 170 168 182 184 C196 200 224 196 232 180 C236 160 220 140 180 132 Z" fill="#f4f1ea" opacity="0.92"/>
      ${neck()}${head.inline("#e7c68a")}${single(200, 154, -12)}${single(200, 180, 12)}<rect x="186" y="198" width="28" height="7" rx="2" fill="url(#js-silver)"/>${knobs([[230, 200], [236, 212]])}</g></g>`,
  },
  log: {
    name: "The Log", who: "Les Paul", year: "1940",
    fact: "Les Paul built one of the first solid-body electric guitars from a plain block of wood called The Log!",
    draw: () => `<g filter="url(#js-vol)"><path d="${BODY.semi}" fill="url(#js-burst)"/></g>
      <path d="M170 166 q-4 14 2 26 M230 166 q4 14 -2 26" stroke="#1a0f06" stroke-width="3" fill="none"/>
      <g filter="url(#js-vol)"><rect x="189" y="114" width="22" height="118" fill="#c9a06a"/></g><path d="M189 114 V232 M211 114 V232" stroke="#7a5a30" stroke-width="1.2"/>
      ${[0, 1, 2, 3].map((k) => `<circle cx="${k % 2 ? 193 : 207}" cy="${124 + k * 30}" r="1.6" fill="url(#js-silver)"/>`).join("")}
      ${neck()}${head.three("#2a1a10")}${single(200, 176)}<rect x="188" y="200" width="24" height="7" rx="2" fill="url(#js-silver)"/>`,
  },
  rhoads: {
    name: "The polka-dot V", who: "Randy Rhoads", year: "1979",
    fact: "Randy drew the design for his polka-dot guitar himself, and a local luthier built it for him!",
    draw: () => `<defs><clipPath id="js-pd"><path d="${BODY.v}"/></clipPath></defs><g filter="url(#js-vol)"><path d="${BODY.v}" fill="#141418"/></g>
      <g clip-path="url(#js-pd)" fill="#f7f4ee">${dots(60, 200, 190, 7.2)}</g>
      ${neck()}${head.arrow("#141418")}<g fill="#f7f4ee">${dots(6, 200, 22, 4)}</g>${hum(200, 150, "#141418")}${hum(200, 176, "#141418")}
      <rect x="188" y="190" width="24" height="7" rx="2" fill="url(#js-silver)"/>${knobs([[226, 206], [234, 218]])}`,
  },
};

// A guitar on a museum stand under a spotlight, with a little plaque.
function legend(id) {
  const g = LEGENDS[id];
  return `<rect width="400" height="240" fill="url(#js-gallery)"/>
    <path d="M140 0 L260 0 L340 236 L60 236 Z" fill="url(#js-spot)"/>
    <rect x="0" y="226" width="400" height="14" fill="#2a2230"/><ellipse cx="200" cy="232" rx="90" ry="6" fill="#000" opacity="0.35"/>
    <g class="js-legend">${g.draw()}</g>
    <path d="M168 236 L186 200 M232 236 L214 200 M186 200 h28" stroke="#2a2a30" stroke-width="4" stroke-linecap="round" fill="none"/>
    <g filter="url(#js-vol)"><rect x="268" y="174" width="124" height="46" rx="4" fill="#f4ecd8"/></g>
    <text x="330" y="193" class="js-plaque-t" text-anchor="middle" textLength="${Math.min(112, g.name.length * 6.2)}">${g.name}</text><text x="330" y="209" class="js-plaque" text-anchor="middle">${g.who} · ${g.year}</text>`;
}

// Slash's November Rain solo, kid-friendly: a lone white church in the New
// Mexico desert at sunset and a top-hatted guitarist on the rocks. (The
// "threw his guitar off a cliff" story is a myth; the church was real and
// moved there for the video.)
function cliff() {
  return `<rect width="400" height="240" fill="url(#js-sunset)"/>
    <circle cx="300" cy="150" r="34" fill="#ffd27a" opacity="0.9"/>
    <path d="M0 176 Q80 150 160 168 T320 160 T400 166 V240 H0 Z" fill="#c9773d"/>
    <path d="M0 196 Q100 182 200 192 T400 190 V240 H0 Z" fill="#a85a28"/>
    <g filter="url(#js-vol)"><rect x="40" y="132" width="44" height="40" fill="#f6f0e4"/><path d="M36 134 L62 112 L88 134 Z" fill="#e6dccb"/><rect x="56" y="88" width="12" height="28" fill="#f6f0e4"/><path d="M53 90 L62 76 L71 90 Z" fill="#e6dccb"/></g>
    <path d="M62 66 v12 M57 70 h10" stroke="#5a4a3a" stroke-width="2"/><rect x="56" y="148" width="12" height="24" rx="6" fill="#7a5a3a"/>
    <path d="M170 200 L240 200 L262 240 L150 240 Z" fill="#7a3f1c"/>
    <g class="js-player" fill="#1e1410">
      <rect x="196" y="150" width="20" height="36" rx="6"/><path d="M198 186 L194 202 M214 186 L218 202" stroke="#1e1410" stroke-width="6" stroke-linecap="round"/>
      <circle cx="206" cy="140" r="10"/><path d="M194 140 q-6 14 0 22 M218 140 q6 14 0 22" stroke="#1e1410" stroke-width="5" fill="none"/>
      <rect x="196" y="122" width="20" height="12" rx="1"/><rect x="190" y="132" width="32" height="4" rx="2"/>
      <g class="js-player-guitar"><path d="${BODY.lp}" transform="translate(152 104) scale(0.28) rotate(-60 200 170)" fill="#6b1a12"/><path d="M196 170 L240 150" stroke="#2a1a10" stroke-width="4"/></g>
    </g>
    <g class="js-wind"><path d="M20 100 q40 -8 80 0" /><path d="M260 90 q40 -8 80 0"/></g>`;
}


const PUPPY = ["show", "bonejam", "xmas", "water", "rain", "drive"];
const SCENES = { boombox, cassette, walkman, strings, metal };
Object.assign(SCENES, { cliff, concert });
for (const id of Object.keys(LEGENDS)) SCENES[`legend-${id}`] = () => legend(id);

function sceneSvg(name, { label = "Jaxx Guitar" } = {}) {
  if (PUPPY.includes(name)) return puppySvg(name, { label });
  const draw = SCENES[name] || boombox;
  return `<svg class="js-scene js-s-${name}" viewBox="0 0 400 240" role="img" aria-label="${label}">${DEFS}${draw()}</svg>`;
}

// Deals scenes like a shuffled deck, so no card repeats a scene until every
// other one has been shown; the deck is remembered between visits.
function dealFrom(all, key) {
  let deck = [];
  try { deck = JSON.parse(localStorage.getItem(key) || "[]").filter((n) => all.includes(n)); } catch (e) { /* ignore */ }
  if (!deck.length) {
    deck = [...all];
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    let last = null;
    try { last = localStorage.getItem(`${key}-last`); } catch (e) { /* ignore */ }
    if (deck[0] === last) deck.push(deck.shift());
  }
  const next = deck.shift();
  try { localStorage.setItem(key, JSON.stringify(deck)); localStorage.setItem(`${key}-last`, next); } catch (e) { /* ignore */ }
  return next;
}

// Mostly music things and legends; the puppy turns up about one card in six.
const ORDER = ["boombox", "legend-hendrix", "cassette", "strings", "legend-redspecial", "walkman", "show", "legend-frankenstrat", "concert", "legend-trigger", "legend-lucille", "bonejam", "legend-elvis", "legend-log", "cliff", "legend-cobain", "xmas", "metal", "legend-rhoads"];
// The deck: every scene once (the puppy ones count as one slot each time).
const DECK = [...new Set(ORDER)];
function pickScene(topic = "") {
  if (/metal|power chord|riff|heavy/i.test(topic)) return "metal";
  if (/concert|rock|band|stage|gig|live/i.test(topic)) return "concert";
  if (/hendrix/i.test(topic)) return "legend-hendrix";
  if (/brian may|red special|queen/i.test(topic)) return "legend-redspecial";
  if (/van halen|frankenstrat/i.test(topic)) return "legend-frankenstrat";
  if (/les paul|the log/i.test(topic)) return "legend-log";
  if (/elvis/i.test(topic)) return "legend-elvis";
  if (/b\.?\s?b\.? king|lucille|blues/i.test(topic)) return "legend-lucille";
  if (/willie|trigger|country/i.test(topic)) return "legend-trigger";
  if (/grunge|nirvana|cobain/i.test(topic)) return "legend-cobain";
  if (/november rain|slash|solo/i.test(topic)) return "cliff";
  return dealFrom(DECK, "jg_scene_deck");
}

export { sceneSvg, pickScene, SCENES, LEGENDS };
