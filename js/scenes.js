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
  lp: "M193 116 C176 112 157 117 151 133 C146 147 153 158 149 171 C138 188 136 214 154 228 C172 243 228 243 246 228 C264 214 263 188 251 172 C244 162 251 152 249 141 C247 130 244 120 238 110 C234 103 225 104 223 112 C221 124 216 131 208 127 L207 116 Z",
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
    fact: "Brian and his dad built it by hand: the neck came from an old fireplace mantel, and the whammy bar tip is a knitting needle!",
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
    name: "Leather-cover Martin", who: "Elvis Presley", year: "1955",
    fact: "Elvis wrapped his Martin D-28 in a hand-tooled leather cover to protect it while he toured!",
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
// Drawing helpers for the cliff scene.
const f1 = (n) => +n.toFixed(1);
// A smooth Catmull-Rom curve through the points, as cubic Beziers.
function crPath(pts) {
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d;
}
// A tapered tube (arm, leg) through [x, y, width] points, round at the end.
function limbPath(pts) {
  const L = [], R = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = (-(b[1] - a[1]) / len) * p[2] / 2, ny = ((b[0] - a[0]) / len) * p[2] / 2;
    L.push([p[0] + nx, p[1] + ny]); R.push([p[0] - nx, p[1] - ny]);
  });
  const r = f1(pts[pts.length - 1][2] / 2), e = R[R.length - 1];
  return `${crPath(L)} A${r} ${r} 0 0 1 ${f1(e[0])} ${f1(e[1])}${crPath(R.reverse()).replace(/^M[^C]*/, " ")} Z`;
}
// Long curly hair: overlapping curls along Bezier strands, with warm glints.
function curls(strands, r0, seed = 7) {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  let base = "", hi = "";
  strands.forEach(([p0, p1, p2, p3], k) => {
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, u = 1 - t;
      const b = (j) => u * u * u * p0[j] + 3 * u * u * t * p1[j] + 3 * u * t * t * p2[j] + t * t * t * p3[j];
      const r = r0 * (1 - 0.45 * t) * (0.85 + rnd() * 0.3);
      const x = b(0) + Math.sin(t * 9 + k) * 1.1, y = b(1) + Math.cos(t * 9 + k * 2) * 1.1;
      base += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}"/>`;
      hi += `<path d="M${f1(x - r * 0.55)} ${f1(y + r * 0.1)} a${f1(r * 0.55)} ${f1(r * 0.55)} 0 0 1 ${f1(r * 0.9)} -${f1(r * 0.3)}"/>`;
    }
  });
  return `<g fill="#1d120c">${base}</g><g fill="none" stroke="#7a4a2c" stroke-width="0.7" stroke-linecap="round" opacity="0.85">${hi}</g>`;
}

// The honey-amber Les Paul for the cliff scene, in the logo's local frame
// (body from BODY.lp, a full-length neck: nut at y 4, headstock to y -52).
function cliffGuitar() {
  const T = "translate(190 146) rotate(50) scale(0.285) translate(-200 -172)";
  const fret = (n) => 4 + 196 * (1 - 2 ** (-n / 12));
  const frets = Array.from({ length: 19 }, (_, k) => `<path d="M193 ${f1(fret(k + 1))} h14" stroke="#d9dde2" stroke-width="1.6"/>`).join("");
  const inlays = [3, 5, 7, 9, 12, 15].map((n) => { const y = (fret(n - 1) + fret(n)) / 2; return `<path d="M195.5 ${f1(y - 3)} h9 l-1 6 h-7 z" fill="#efe3c4"/>`; }).join("");
  const flames = Array.from({ length: 16 }, (_, k) => `<path d="M140 ${112 + k * 8} q15 -7 30 0 t30 0 t30 0 t30 0"/>`).join("");
  return `<path d="${BODY.lp}" transform="${T} translate(10 12)" fill="#1a0a04" opacity="0.35"/>
    <g filter="url(#js-vol)"><path d="${BODY.lp}" transform="${T}" fill="url(#js-cl-amber)"/></g>
    <g transform="${T}">
      <g clip-path="url(#js-cl-lpclip)"><g fill="none" stroke="#b5601a" stroke-width="3" opacity="0.35">${flames}</g>
        <ellipse cx="186" cy="150" rx="34" ry="22" fill="#fff6d0" opacity="0.32"/></g>
      <path d="${BODY.lp}" fill="none" stroke="#f6ecd2" stroke-width="4.5"/>
      <path d="M211 134 C228 138 238 160 232 182 Q224 188 215 180 Z" fill="#efe3c4" stroke="#d9c9a4" stroke-width="1"/>
      <path d="M193 4 L189 -40 Q193 -55 200 -48 Q207 -55 211 -40 L207 4 Z" fill="#141418"/>
      <path d="M194 0 L191 -38" stroke="#5a5a66" stroke-width="2" opacity="0.7"/>
      ${[0, 1, 2].map((k) => `<rect x="179" y="${-8 - k * 13}" width="9" height="6" rx="3" fill="url(#js-silver)"/><rect x="212" y="${-8 - k * 13}" width="9" height="6" rx="3" fill="url(#js-silver)"/>`).join("")}
      <rect x="192" y="2" width="16" height="3" fill="#efe3c4"/>
      <rect x="193" y="4" width="14" height="146" fill="#3a2414"/><path d="M193 4 v146 M207 4 v146" stroke="#f6ecd2" stroke-width="1.6"/>
      ${frets}${inlays}
      ${hum(200, 158, "#141418")}${hum(200, 184, "#141418")}
      <rect x="185" y="196" width="30" height="7" rx="2" fill="url(#js-silver)"/><rect x="184" y="209" width="32" height="6" rx="2" fill="url(#js-silver)"/>
      ${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M${195 + k * 2} 2 V212" stroke="#f4f6f8" stroke-width="1.1" opacity="0.9"/>`).join("")}
      ${[[226, 196], [240, 204], [226, 214], [240, 222]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#e9a22e" stroke="#7a4a10" stroke-width="1"/><circle cx="${x - 1.6}" cy="${y - 1.8}" r="1.8" fill="#fff4c8" opacity="0.8"/>`).join("")}
      <circle cx="168" cy="128" r="3.6" fill="url(#js-silver)"/><path d="M168 128 l-6 -8" stroke="#e8ebef" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;
}

// Slash's November Rain solo, kid-friendly: a lone white church in the New
// Mexico desert at sunset and a top-hatted guitarist on the rocks. (The
// "threw his guitar off a cliff" story is a myth; the church was real and
// moved there for the video.) Drawn ~89 px per metre: the player is about
// 1.8 m tall and the Les Paul about 1 m long. He's right-handed and faces
// us, so the neck rises toward his left hand (our right).
function cliff() {
  const sky = `<linearGradient id="js-cl-sky" x1="0" y1="0" x2="0" y2="168" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2a2462"/><stop offset="0.3" stop-color="#5e3c86"/><stop offset="0.55" stop-color="#b9587e"/><stop offset="0.76" stop-color="#ef8a55"/><stop offset="0.92" stop-color="#ffc56e"/><stop offset="1" stop-color="#ffe3a4"/></linearGradient>
    <radialGradient id="js-cl-glow" cx="128" cy="148" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6cf" stop-opacity="0.95"/><stop offset="0.14" stop-color="#ffd27a" stop-opacity="0.7"/><stop offset="0.45" stop-color="#ff9a5a" stop-opacity="0.22"/><stop offset="1" stop-color="#ff7a50" stop-opacity="0"/></radialGradient>
    <radialGradient id="js-cl-sun" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#fffdf0"/><stop offset="0.7" stop-color="#ffe7a6"/><stop offset="1" stop-color="#ffc469"/></radialGradient>
    <linearGradient id="js-cl-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4a8e" stop-opacity="0.85"/><stop offset="0.55" stop-color="#d77a8a"/><stop offset="1" stop-color="#ffc38a"/></linearGradient>
    <linearGradient id="js-cl-floor" x1="0" y1="150" x2="0" y2="240" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f7b878"/><stop offset="0.2" stop-color="#e08a50"/><stop offset="0.6" stop-color="#b45a30"/><stop offset="1" stop-color="#7c3a1e"/></linearGradient>
    <linearGradient id="js-cl-rock" x1="0" y1="160" x2="0" y2="240" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#c26a3a"/><stop offset="0.35" stop-color="#93482a"/><stop offset="1" stop-color="#3e1c10"/></linearGradient>
    <linearGradient id="js-cl-rockx" x1="100" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb070" stop-opacity="0.35"/><stop offset="0.5" stop-color="#ffb070" stop-opacity="0"/><stop offset="1" stop-color="#1a0804" stop-opacity="0.35"/></linearGradient>
    <linearGradient id="js-cl-coat" x1="160" y1="0" x2="228" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#7d4a32"/><stop offset="0.18" stop-color="#3f2619"/><stop offset="0.6" stop-color="#25160f"/><stop offset="1" stop-color="#130b07"/></linearGradient>
    <linearGradient id="js-cl-jeans" x1="168" y1="0" x2="234" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5a4048"/><stop offset="0.25" stop-color="#2c2229"/><stop offset="1" stop-color="#140f13"/></linearGradient>
    <linearGradient id="js-cl-hat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a4038"/><stop offset="0.3" stop-color="#241a18"/><stop offset="1" stop-color="#0b0808"/></linearGradient>
    <radialGradient id="js-cl-skin" cx="35%" cy="40%" r="70%"><stop offset="0" stop-color="#f6cfa6"/><stop offset="1" stop-color="#b8785a"/></radialGradient>
    <radialGradient id="js-cl-amber" cx="40%" cy="45%" r="65%"><stop offset="0" stop-color="#ffe98c"/><stop offset="0.45" stop-color="#f6b93c"/><stop offset="0.8" stop-color="#c96c16"/><stop offset="1" stop-color="#6e2a08"/></radialGradient>
    <linearGradient id="js-cl-ledge" x1="0" y1="196" x2="0" y2="240" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#b85a2e"/><stop offset="1" stop-color="#5e2812"/></linearGradient>
    <clipPath id="js-cl-lpclip"><path d="${BODY.lp}"/></clipPath>
    <filter id="js-cl-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="js-cl-blur3" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>`;

  const cloud = (cx, cy, rx, ry) => `<g filter="url(#js-cl-blur)"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#js-cl-cloud)"/><ellipse cx="${cx - rx * 0.4}" cy="${cy - ry * 0.5}" rx="${rx * 0.45}" ry="${ry * 0.8}" fill="url(#js-cl-cloud)"/><ellipse cx="${cx + rx * 0.35}" cy="${cy - ry * 0.3}" rx="${rx * 0.5}" ry="${ry * 0.75}" fill="url(#js-cl-cloud)"/></g>
      <path d="M${cx - rx * 0.8} ${cy + ry * 0.75} Q${cx} ${cy + ry * 1.25} ${cx + rx * 0.8} ${cy + ry * 0.75}" fill="none" stroke="#ffd9a0" stroke-width="1" opacity="0.6" filter="url(#js-cl-blur)"/>`;

  // The little white adobe church, far off in the desert.
  const church = `<g class="js-cl-church" transform="translate(52 164) scale(0.72) translate(-52 -164)">
      <path d="M60 164 L20 166 L24 163 L44 162 Z" fill="#6a2e22" opacity="0.35"/>
      <path d="M58 153 L70 150 L74 152 L74 163 L58 164 Z" fill="#ffdcae"/><path d="M58 153 L66 146 L70 150 Z" fill="#f8c890"/>
      <path d="M43 164 L43 152 L50.5 145 L58 152 L58 164 Z" fill="#ebdde6"/>
      <path d="M47.5 152 L47.5 139 Q50.5 137.5 53.5 139 L53.5 152 Z" fill="#f1e6ec"/><path d="M47 139.5 L50.5 134 L54 139.5 Z" fill="#dccbd8"/>
      <path d="M53.5 139 L54.5 140 L54.5 152 L53.5 152 Z" fill="#ffd9a6"/><path d="M58 152 L58 164" stroke="#ffe2b8" stroke-width="0.8"/>
      <path d="M50.5 134 V128 M48.6 130 H52.4" stroke="#4a3436" stroke-width="0.9"/>
      <path d="M49.2 146 Q50.5 143.5 51.8 146 V148 H49.2 Z" fill="#5a3e46"/>
      <path d="M48.6 164 V159 Q50.5 155.5 52.4 159 V164 Z" fill="#6a4a4e"/><circle cx="50.5" cy="153.5" r="1" fill="#8a6a74"/>
      <path d="M62 157 h2 v3 h-2 z M67 156 h2 v3 h-2 z" fill="#b8865e"/>
    </g>`;

  // The rocky cliff top in the foreground (the drop is on the left).
  const rockTop = "M96 240 L100 226 L106 216 L112 206 L124 202 L140 204 C170 207 198 210 232 209 C258 208 280 202 298 195 C320 186 340 174 358 166 C374 160 388 156 400 155 L400 240 Z";
  const rocks = `<path d="${rockTop}" fill="url(#js-cl-rock)"/><path d="${rockTop}" fill="url(#js-cl-rockx)"/>
    <path d="M96 240 L100 226 L106 216 L112 206 L124 202 L127 212 L122 222 L119 232 L118 240 Z" fill="#d8783f"/>
    <path d="M100 226 L106 216 L112 206 L124 202 L127 212 L116 214 L108 224 Z" fill="#f09858" opacity="0.6"/>
    <path d="M104 228 L102 240 M110 218 L108 234 M117 210 L114 226 M122 206 L120 218" stroke="#7a3418" stroke-width="0.9" opacity="0.7"/>
    <path d="M118 240 L121 230 C160 232 220 236 270 232 C310 228 350 214 400 196 L400 240 Z" fill="#3e1a0c" opacity="0.35"/>
    <g fill="none" stroke-linecap="round"><path d="M126 228 C170 231 220 233 262 229 C300 225 330 214 360 200" stroke="#5a2412" stroke-width="1.1" opacity="0.45"/>
      <path d="M140 236 C190 239 250 239 300 234 C340 230 370 220 400 206" stroke="#5a2412" stroke-width="1.2" opacity="0.4"/>
      <path d="M128 224 C168 226 212 228 252 225" stroke="#f0a060" stroke-width="0.8" opacity="0.35"/>
      <path d="M300 222 l10 -6 l6 4 M262 236 l8 -4 l10 2 M150 232 l6 -3" stroke="#3a160a" stroke-width="0.8" opacity="0.6"/></g>
    <path d="M112 206 L124 202 L140 204 C170 207 198 210 232 209 C258 208 280 202 298 195 C320 186 340 174 358 166 C374 160 388 156 400 155" fill="none" stroke="#ffbe7a" stroke-width="1.5" opacity="0.9"/>
    <g filter="url(#js-vol)"><path d="M300 240 C296 216 312 198 336 194 C360 190 380 202 384 222 L386 240 Z" fill="#8e4a28"/>
      <path d="M352 204 C350 182 366 168 386 168 C400 169 404 182 402 198 L400 240 L362 240 Z" fill="#7a3c20"/>
      <path d="M244 228 C246 220 258 218 265 223 C270 229 262 233 250 233 Z" fill="#a65a30"/>
      <path d="M140 226 C142 220 150 219 154 223 C156 228 150 230 144 230 Z" fill="#b0623a"/></g>
    <path d="M300 236 C298 214 314 197 336 194 M352 202 C351 182 366 169 386 168" fill="none" stroke="#ffb878" stroke-width="1.3" opacity="0.75"/>
    <path d="M318 214 l12 8 l-4 10 M370 190 l8 12 l-2 14" fill="none" stroke="#3e1a0c" stroke-width="0.9" opacity="0.6"/>
    <g fill="#b8683a"><path d="M150 216 l14 -3 l12 2 l-4 4 l-18 1 z"/><path d="M252 214 l10 -2 l8 2 l-6 3 z"/><path d="M300 224 l16 -5 l10 3 l-8 5 z"/></g>
    <g fill="#f2a466" opacity="0.7"><path d="M150 216 l14 -3 l12 2 l-14 0 z"/><path d="M252 214 l10 -2 l8 2 l-9 0 z"/><path d="M300 224 l16 -5 l10 3 l-14 0 z"/></g>
    <g fill="#5a2a14">${[[136, 222], [168, 230], [240, 234], [262, 222], [286, 230], [210, 236], [190, 228]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="0.9"/>`).join("")}</g>
    <g fill="#4e4a22"><circle cx="276" cy="204" r="3"/><circle cx="281" cy="203" r="3.6"/><circle cx="286" cy="205" r="2.6"/><circle cx="141" cy="208" r="2.2"/><circle cx="145" cy="207" r="2.8"/></g>
    <g fill="#8a8a3a" opacity="0.7"><circle cx="280" cy="201.5" r="1.4"/><circle cx="144" cy="205.5" r="1.1"/></g>`;

  // The guitarist, lit from the low sun on our left.
  const hairBack = `<path d="M190 63 C182 66 170 74 160 86 C164 92 168 100 170 108 C176 114 184 116 194 112 C202 112 210 110 216 104 C220 94 218 78 213 64 Z" fill="#1d120c"/>` + curls([
    [[196, 64], [186, 70], [176, 84], [162, 94]],
    [[199, 65], [190, 77], [181, 94], [170, 106]],
    [[203, 65], [197, 80], [188, 100], [180, 113]],
    [[207, 65], [212, 80], [207, 98], [196, 110]],
    [[211, 66], [218, 82], [217, 98], [210, 106]],
    [[192, 65], [180, 70], [168, 77], [156, 84]],
    [[194, 66], [184, 74], [174, 88], [164, 100]],
    [[205, 66], [206, 82], [198, 96], [188, 108]],
    [[209, 66], [216, 76], [214, 90], [204, 104]],
  ], 4.8, 11);
  const hairFront = curls([
    [[195, 66], [192, 74], [190, 84], [186, 95]],
    [[193, 65], [189, 72], [186, 80], [182, 88]],
    [[207, 66], [210, 74], [210, 86], [206, 97]],
    [[209, 65], [213, 72], [214, 82], [212, 92]],
  ], 3.3, 5);
  const leftLeg = limbPath([[190, 130, 15], [185, 158, 13.5], [181, 182, 11], [178, 200, 10], [176, 214, 9]]);
  const rightLeg = limbPath([[210, 130, 15], [215, 156, 13.5], [220, 180, 11], [223, 199, 10], [226, 214, 9]]);
  const rightArm = limbPath([[184, 95, 10], [175, 108, 9.5], [169, 124, 8.5], [176, 139, 7.5], [183, 146, 6.5]]);
  const leftArm = limbPath([[216, 95, 10], [226, 106, 9.5], [232, 122, 8.5], [224, 129, 7.5], [214, 131, 6.5]]);
  const player = `<g class="js-cl-player" style="transform-box:view-box;transform-origin:201px 222px">
      <g class="js-cl-tails" style="transform-box:view-box;transform-origin:196px 110px">
        <path d="M184 116 C174 140 158 162 138 186 C150 191 164 189 174 184 C182 168 192 148 199 126 Z" fill="#1a0f0a"/>
        <path d="M214 118 C220 142 220 166 214 190 C206 190 199 188 194 183 C199 162 204 140 206 124 Z" fill="#160d08"/>
      </g>
      <path d="${leftLeg}" fill="url(#js-cl-jeans)"/><path d="${rightLeg}" fill="url(#js-cl-jeans)"/>
      <path d="M183 160 C182 176 178 196 176 212" fill="none" stroke="#a0706a" stroke-width="0.8" opacity="0.6"/>
      <path d="M171 210 L181 210 L182 219 Q182 224 176 224 L163 224 Q159 224 161 221 Q165 218 171 217 Z" fill="#140d0a"/>
      <path d="M221 210 L231 210 L231 217 Q236 218 240 221 Q242 224 238 224 L225 224 Q220 224 220 219 Z" fill="#140d0a"/>
      <path d="M163 221.5 Q168 219 172 218.5 M232 218.5 Q236 219 239 221.5" stroke="#8a5a40" stroke-width="0.8" fill="none"/>
      <path d="M194 90 L206 90 L209 130 L191 130 Z" fill="#4a1a1e"/>
      <rect x="190" y="126" width="20" height="4.5" rx="1" fill="#1a1210"/><rect x="197.5" y="126.2" width="5" height="4" rx="1" fill="url(#js-silver)"/>
      <path d="M197 88 L203 88 L200 97 Z" fill="url(#js-cl-skin)"/>
      <path d="M194 88 L199 100 L195 104 Z M206 88 L201 100 L205 104 Z" fill="#ece4d6"/>
      <g class="js-cl-coat" style="transform-box:view-box;transform-origin:184px 96px">
        <path d="M183 91 C178 100 176 112 175 124 C172 142 162 162 148 184 C157 187 167 186 176 182 C182 166 188 148 191 130 C193 118 194 104 195 94 Z" fill="url(#js-cl-coat)"/>
        <path d="M183 91 C178 100 176 112 175 124 C172 142 162 162 148 184" fill="none" stroke="#ffae66" stroke-width="0.9" opacity="0.8"/>
      </g>
      <path d="M217 91 C223 102 224 116 224 128 C224 148 222 166 216 182 C210 184 204 184 198 182 C204 166 208 148 209 130 C208 116 207 104 205 94 Z" fill="url(#js-cl-coat)"/>
      <path d="M181 97 Q183 89 194 87.5 L206 87.5 Q217 89 219 97 L214 96 L186 96 Z" fill="url(#js-cl-coat)"/>
      <path d="M195 94 L191 108 M205 94 L209 108" stroke="#5a3424" stroke-width="1" opacity="0.8"/>
      <rect x="197" y="80" width="6.5" height="10" rx="2" fill="url(#js-cl-skin)"/>
      <path d="M195 128 L216 92" stroke="#2a160c" stroke-width="4" stroke-linecap="round"/><path d="M194.4 127 L215.4 91" stroke="#6a4028" stroke-width="1" opacity="0.8"/>
      ${hairBack}
      <g class="js-cl-guitar" style="transform-box:view-box;transform-origin:190px 146px">
        <path d="${leftArm}" fill="url(#js-cl-coat)"/><path d="M216 99 C224 106 230 114 232 120" fill="none" stroke="#5a3424" stroke-width="0.8" opacity="0.7"/>
        ${cliffGuitar()}
        <g transform="rotate(-40 210 128.5)"><ellipse cx="210" cy="128.5" rx="4.6" ry="2.9" fill="url(#js-cl-skin)"/><path d="M207.5 127 v3 M209.8 126.6 v3.4 M212.1 126.9 v3" stroke="#9a6448" stroke-width="0.5"/></g>
      </g>
      <path d="${rightArm}" fill="url(#js-cl-coat)"/>
      <path d="M184 99 C176 106 171 116 169 124" fill="none" stroke="#ffae66" stroke-width="0.9" opacity="0.75"/>
      <g transform="rotate(35 186.5 148)"><ellipse cx="186.5" cy="148" rx="4.2" ry="3.2" fill="url(#js-cl-skin)"/></g>
      <path d="M188.6 150.4 l2.2 1.4 l-2 1.2 z" fill="#f2f2f2"/>
      <g class="js-cl-head" style="transform-box:view-box;transform-origin:200px 86px">
        <ellipse cx="201" cy="74.5" rx="6.6" ry="8.6" transform="rotate(-8 201 74.5)" fill="url(#js-cl-skin)"/>
        <path d="M195.5 79 Q200.5 85.5 206.5 78.2" fill="none" stroke="#9a6044" stroke-width="0.8" opacity="0.7"/>
        <g transform="rotate(-8 201 71)"><ellipse cx="197.6" cy="71" rx="2.9" ry="2.2" fill="#0d0d12"/><ellipse cx="204.4" cy="71" rx="2.9" ry="2.2" fill="#0d0d12"/>
          <path d="M200.4 70.6 h1.2" stroke="#0d0d12" stroke-width="0.8"/><ellipse cx="196.6" cy="70.2" rx="1" ry="0.6" fill="#ffd9a0" opacity="0.85"/><ellipse cx="203.4" cy="70.2" rx="1" ry="0.6" fill="#fff" opacity="0.6"/></g>
        ${hairFront}
        <g transform="rotate(-11 201 64)">
          <path d="M190 64 C190 56 189 49 188.5 43.5 Q201 40 213.5 43.5 C213 49 212 56 212 64 Z" fill="url(#js-cl-hat)"/>
          <ellipse cx="201" cy="43.6" rx="12.5" ry="2.4" fill="#2e2424"/>
          <path d="M190 58.5 Q201 60.5 212 58.5 L212 62.5 Q201 64.5 190 62.5 Z" fill="#2a1a12"/>
          ${[192, 196, 200, 204, 208, 211].map((x) => `<circle cx="${x}" cy="${x === 200 ? 61.6 : 61.3}" r="1" fill="url(#js-silver)"/>`).join("")}
          <path d="M184.5 64 Q201 59.5 217.5 64 Q201 71.5 184.5 64 Z" fill="#161010"/>
          <path d="M184.5 64 Q201 71.5 217.5 64" fill="none" stroke="#4a3434" stroke-width="0.7"/>
          <path d="M188.6 44 C189.2 50 190 57 190.2 63.5" fill="none" stroke="#ffae66" stroke-width="0.9" opacity="0.8"/>
        </g>
      </g>
      <g class="js-cl-hair" style="transform-box:view-box;transform-origin:201px 66px">${curls([
        [[193, 67], [184, 72], [174, 76], [164, 78]],
        [[194, 70], [186, 80], [178, 90], [168, 94]],
      ], 2.6, 3)}</g>
    </g>`;

  return `<defs>${sky}</defs>
    <rect width="400" height="240" fill="url(#js-cl-sky)"/>
    <rect class="js-cl-glow" width="400" height="240" fill="url(#js-cl-glow)" style="transform-box:view-box;transform-origin:128px 148px"/>
    <g opacity="0.6" filter="url(#js-cl-blur)">${[-50, -28, -8, 12, 32, 54].map((a) => `<path d="M128 146 L${f1(128 + Math.sin((a * Math.PI) / 180 - 0.04) * 220)} ${f1(146 - Math.cos((a * Math.PI) / 180 - 0.04) * 220)} L${f1(128 + Math.sin((a * Math.PI) / 180 + 0.04) * 220)} ${f1(146 - Math.cos((a * Math.PI) / 180 + 0.04) * 220)} Z" fill="#fff1c8" opacity="0.1"/>`).join("")}</g>
    <circle cx="128" cy="147" r="15" fill="url(#js-cl-sun)"/>
    <g class="js-cl-clouds" style="transform-box:view-box">${cloud(70, 40, 74, 7)}${cloud(270, 30, 110, 9)}${cloud(340, 82, 70, 6)}${cloud(196, 100, 84, 4.5)}${cloud(36, 118, 52, 3.6)}${cloud(300, 124, 64, 3.6)}</g>
    <path d="M0 162 L0 152 L14 151 L20 146 L52 145 L57 150 L74 151 L80 154 L150 155 L158 149 L196 148 L202 153 L236 154 L240 146 L246 141 L300 140 L306 146 L312 152 L360 153 L366 147 L400 146 L400 166 Z" fill="#a8628a" opacity="0.9"/>
    <path d="M20 146 L52 145 M158 149 L196 148 M246 141 L300 140 M366 147 L400 146" stroke="#ffcf9a" stroke-width="1" opacity="0.8"/>
    <path d="M220 162 L230 152 L236 151 L262 150 L268 155 L292 156 L300 160 L330 160 L336 156 L360 156 L366 161 Z" fill="#8a4a64"/>
    <path d="M0 160 L400 160 L400 240 L0 240 Z" fill="url(#js-cl-floor)"/>
    <path d="M0 160 H400 V166 H0 Z" fill="#ffd9a0" opacity="0.35" filter="url(#js-cl-blur)"/>
    <path d="M0 194 C26 186 46 178 55 165 L57 165 C50 178 32 190 6 199 L0 200 Z" fill="#f6c890" opacity="0.5"/>
    <g fill="#6a3018" opacity="0.4">${[[18, 186, 9], [88, 180, 7], [72, 204, 11], [30, 174, 6], [96, 196, 8], [150, 176, 9], [262, 182, 10], [300, 172, 8], [150, 196, 9], [372, 160, 6]].map(([x, y, w]) => `<ellipse cx="${x - w}" cy="${y + 1}" rx="${w}" ry="1.3"/>`).join("")}</g>
    <g fill="#5a4426">${[[18, 186, 1.8], [88, 180, 1.5], [72, 204, 2.2], [30, 174, 1.3], [96, 196, 1.8], [150, 176, 1.8], [262, 182, 2], [300, 172, 1.6], [150, 196, 1.8], [372, 160, 1.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>
    <path d="M0 203 C8 199 14 204 22 201 L28 197 L36 200 C48 198 56 202 66 198 L74 195 L82 199 C92 197 100 200 108 196 L112 206 L100 226 L96 240 L0 240 Z" fill="url(#js-cl-ledge)"/>
    <path d="M0 203 C8 199 14 204 22 201 L28 197 L36 200 C48 198 56 202 66 198 L74 195 L82 199 C92 197 100 200 108 196" fill="none" stroke="#ffb878" stroke-width="1" opacity="0.75"/>
    <path d="M0 206 C10 203 16 207 24 205 L36 204 C50 202 58 206 68 202 L82 203 C94 201 102 204 108 201 L108 209 C80 212 40 213 0 212 Z" fill="#5a2410" opacity="0.35"/>
    <rect x="0" y="150" width="400" height="60" fill="#ffd3a0" opacity="0.18" filter="url(#js-cl-blur3)"/>
    ${church}
    ${rocks}
    <path d="M178 223 L230 223 L330 232 L314 236 Z" fill="#2a0e06" opacity="0.32" filter="url(#js-cl-blur)"/>
    ${player}
    <g class="js-cl-dust" fill="none" stroke="#fff4e0" stroke-linecap="round"><path d="M340 112 q-24 -5 -48 0" stroke-width="1.2"/><path d="M380 150 q-30 -6 -60 0" stroke-width="1"/><path d="M300 70 q-20 -4 -40 0" stroke-width="1"/><path d="M360 196 q-26 -5 -52 0" stroke-width="1.3"/></g>
    <g class="js-cl-specks" fill="#ffd9a8">${[[330, 200], [350, 190], [300, 210], [370, 182], [280, 216]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9"/>`).join("")}</g>
    <g class="js-cl-notes"><text x="242" y="96">♪</text><text x="256" y="78">♫</text><text x="232" y="66">♪</text></g>`;
}


// The Jaxx Guitar logo/app icon: a Les Paul-style single-cut in the honey /
// amber flame-top finish Slash made famous: cream binding, two uncovered
// black humbuckers, amber "top hat" knobs, a cream pickguard, trapezoid
// inlays and an open-book headstock. No brand logo.
function guitarLogo({ label = "Jaxx Guitar", tile = true } = {}) {
  const flames = Array.from({ length: 14 }, (_, k) => `<path d="M140 ${120 + k * 8} q15 -6 30 0 t30 0 t30 0 t30 0" />`).join("");
  const inlays = [0, 1, 2, 3, 4].map((k) => `<path d="M196 ${60 + k * 16} h8 l-1 5 h-6 z" fill="#efe3c4"/>`).join("");
  return `<svg class="js-scene js-guitar-logo" viewBox="0 0 200 200" role="img" aria-label="${label}">${DEFS}
    <defs><radialGradient id="js-logo-bg" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#3b2a4a"/><stop offset="0.7" stop-color="#1d1626"/><stop offset="1" stop-color="#100c16"/></radialGradient>
      <radialGradient id="js-logo-gold" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff3c4"/><stop offset="0.6" stop-color="#f2c94c"/><stop offset="1" stop-color="#c9921f"/></radialGradient>
      <radialGradient id="js-amber" cx="45%" cy="55%" r="65%"><stop offset="0" stop-color="#ffe27a"/><stop offset="0.45" stop-color="#f4b63a"/><stop offset="0.8" stop-color="#c46a16"/><stop offset="1" stop-color="#6e2a08"/></radialGradient>
      <clipPath id="js-lp-clip"><path d="${BODY.lp}"/></clipPath>
      <radialGradient id="js-logo-spot" cx="50%" cy="40%" r="50%"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.45"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
    <rect width="200" height="200" rx="${tile ? 44 : 0}" fill="url(#js-logo-bg)"/>
    <ellipse cx="104" cy="96" rx="90" ry="90" fill="url(#js-logo-spot)"/>
    <g class="js-logo-guitar" style="transform-box:view-box" transform="translate(102 102) rotate(22) scale(0.8) translate(-200 -140)">
      <path d="${BODY.lp}" transform="translate(4 6)" fill="#000" opacity="0.35"/>
      <g filter="url(#js-vol)"><path d="${BODY.lp}" fill="url(#js-amber)"/></g>
      <g clip-path="url(#js-lp-clip)" fill="none" stroke="#b5601a" stroke-width="2.2" opacity="0.35">${flames}</g>
      <path d="${BODY.lp}" fill="none" stroke="#f6ecd2" stroke-width="3.4"/>
      <path d="M211 134 C228 138 238 160 232 182 Q224 188 215 180 Z" fill="#efe3c4" stroke="#d9c9a4" stroke-width="0.8"/>
      <rect x="193" y="38" width="14" height="110" rx="2" fill="#3a2414"/><path d="M193 38 v110 M207 38 v110" stroke="#f6ecd2" stroke-width="1"/>
      ${Array.from({ length: 14 }, (_, k) => `<path d="M193 ${44 + k * 7.6} h14" stroke="#c9ced6" stroke-width="0.9"/>`).join("")}${inlays}
      <path d="M193 40 L186 12 Q192 2 200 6 Q208 2 214 12 L207 40 Z" fill="#141418"/>
      ${[0, 1, 2].map((k) => `<circle cx="185" cy="${16 + k * 8}" r="2.6" fill="url(#js-silver)"/><circle cx="215" cy="${16 + k * 8}" r="2.6" fill="url(#js-silver)"/>`).join("")}
      ${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M${195 + k * 2} 38 V206" stroke="#e8ebef" stroke-width="0.6"/>`).join("")}
      ${hum(200, 158, "#141418")}${hum(200, 184, "#141418")}
      <rect x="185" y="198" width="30" height="6" rx="2" fill="url(#js-silver)"/><rect x="184" y="210" width="32" height="5" rx="2" fill="url(#js-silver)"/>
      ${[[226, 196], [240, 204], [226, 214], [240, 222]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="#e9a22e" stroke="#7a4a10" stroke-width="0.8"/><circle cx="${x - 1.4}" cy="${y - 1.6}" r="1.6" fill="#fff4c8" opacity="0.8"/>`).join("")}
      <circle cx="168" cy="128" r="3.2" fill="url(#js-silver)"/><path d="M168 128 l-6 -7" stroke="#e8ebef" stroke-width="2" stroke-linecap="round"/><circle cx="162" cy="121" r="1.8" fill="#f6ecd2"/>
    </g>
    <g class="js-logo-notes" fill="url(#js-logo-gold)" font-family="system-ui" font-weight="900"><text x="22" y="56" font-size="28">♪</text><text x="152" y="40" font-size="22">♫</text><text x="160" y="182" font-size="18">♪</text></g>
  </svg>`;
}

// Home screen: a different legendary guitar on every visit. It drops onto
// its stand with a spin and a sparkle, then sways under the spotlight.
function homeGuitar(id) {
  const g = LEGENDS[id];
  return `<svg class="js-scene js-home-guitar" viewBox="0 0 400 240" role="img" aria-label="${g.name}, ${g.who}">${DEFS}
    ${legend(id).replace('<g class="js-legend">', '<g class="js-legend js-enter">')}
    <g class="js-sparkle">${[[150, 60], [262, 90], [180, 170], [236, 40]].map(([x, y]) => `<path d="M${x} ${y - 7} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff6c4"/>`).join("")}</g>
  </svg>`;
}
function nextHomeGuitar() {
  return dealFrom(Object.keys(LEGENDS), "jg_home_guitar_deck");
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

export { sceneSvg, pickScene, SCENES, LEGENDS, guitarLogo, homeGuitar, nextHomeGuitar };
