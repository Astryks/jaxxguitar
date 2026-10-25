// Our own drawings of the guitar, all the same way round as the fretboard:
// how a right-handed player sees their guitar looking down at it, neck to
// the left, thickest string (low E) at the bottom: your head is below the
// picture, so the low E (the top string on the guitar) is the nearest one.
//   guitarSvg()            the whole guitar, with where each hand goes
//   headstockSvg(opts)     the tuning pegs, one per string (tuner)
//   fingerStrumSvg()       strumming with a finger instead of a pick
//   viewerSvg()            side view + "what you see looking down" (why
//                          low E is at the bottom)

import { isLefty, mirrorSvgTexts, handSide } from "./settings.js";

const STR = ["E", "A", "D", "G", "B", "e"];

function guitarSvg() {
  const sy = (s) => 100 + (5 - s) * 6; // strings, low E at the bottom
  const frets = [];
  let x = 92;
  for (let f = 1; f <= 14; f++) { x += 22 - f * 0.55; frets.push(x); }
  const lefty = isLefty();
  const fh = handSide("fret"), sh = handSide("strum");
  const cap = (w) => w[0].toUpperCase() + w.slice(1);
  const svg = `<svg viewBox="0 0 640 290" class="jg-guitar-art" role="img" aria-label="A whole acoustic guitar, drawn for a ${lefty ? "left" : "right"}-handed player: neck on the ${fh}, body on the ${sh}. ${cap(fh)} hand presses the frets, ${sh} hand strums.">
    <defs><radialGradient id="jgBody" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#f3c27a"/><stop offset="1" stop-color="#c9843c"/></radialGradient></defs>
    <g transform="translate(0 20)">
    <path d="M14 92 L88 84 L88 136 L14 128 Q6 110 14 92 Z" class="jg-ga-head"/>
    ${[0, 1, 2].map((i) => `<circle cx="${28 + i * 20}" cy="80" r="6" class="jg-ga-peg"/><circle cx="${28 + i * 20}" cy="140" r="6" class="jg-ga-peg"/>`).join("")}
    <rect x="86" y="92" width="${frets[13] - 80}" height="36" rx="3" class="jg-ga-neck"/>
    <rect x="86" y="90" width="5" height="40" class="jg-ga-nut"/>
    ${frets.map((fx) => `<line x1="${fx}" x2="${fx}" y1="92" y2="128" class="jg-ga-fret"/>`).join("")}
    <path d="M360 110 C360 40 420 22 470 40 C500 50 520 46 540 34 C590 8 632 50 632 110 C632 170 590 212 540 186 C520 174 500 170 470 180 C420 198 360 180 360 110 Z" class="jg-ga-body" fill="url(#jgBody)"/>
    <circle cx="440" cy="110" r="30" class="jg-ga-hole"/>
    <rect x="556" y="94" width="14" height="32" rx="3" class="jg-ga-bridge"/>
    ${STR.map((n, s) => `<line x1="40" x2="562" y1="${sy(s)}" y2="${sy(s)}" class="jg-ga-string" style="stroke-width:${2.2 - s * 0.28}"/>`).join("")}
    <text x="96" y="${sy(0) + 22}" class="jg-ga-small jg-ga-left">low E (thickest) at the bottom: nearest you</text>
    </g>
    <g class="jg-ga-label"><path d="M200 152 L200 174" class="jg-ga-arrow"/><text x="200" y="196">${cap(fh)} hand</text><text x="200" y="214" class="jg-ga-small">presses the frets</text></g>
    <g class="jg-ga-label"><path d="M440 154 L440 222" class="jg-ga-arrow"/><text x="440" y="244">${cap(sh)} hand</text><text x="440" y="262" class="jg-ga-small">strums over the hole</text></g>
    <text x="320" y="284" class="jg-ga-small jg-ga-mid">${lefty ? "Flipped for left-handed players" : "Drawn for right-handed players"}, as you see it looking down at your guitar</text>
  </svg>`;
  return lefty ? mirrorSvgTexts(svg) : svg;
}

// Tuner: the headstock with six pegs (3 on each side, like most
// acoustics), each string running to its peg. `active` = string index
// being tuned, `done` = Set of tuned strings, `ok` = active one is in tune,
// `names` = the string names (they change in alternate tunings).
function headstockSvg({ active = 0, done = new Set(), ok = false, names = STR } = {}) {
  const sy = (s) => 72 + (5 - s) * 15.5; // at the nut, low E at the bottom
  // Low E, A, D pegs on the top edge (low E farthest from the nut);
  // G, B, high e on the bottom edge (high e farthest).
  const pegX = [40, 100, 160, 160, 100, 40];
  const pegY = (s) => (s < 3 ? 196 : 22);
  const p = [];
  p.push(`<path d="M18 40 Q10 110 18 178 L226 164 L226 60 Z" class="jg-hs-head"/>`);
  p.push(`<rect x="226" y="60" width="300" height="104" class="jg-hs-neck"/>`);
  p.push(`<rect x="222" y="58" width="8" height="108" class="jg-hs-nut"/>`);
  [300, 368, 430, 486].forEach((x) => p.push(`<line x1="${x}" x2="${x}" y1="60" y2="164" class="jg-hs-fret"/>`));
  STR.forEach((n, s) => {
    const cls = ["jg-hs-string", s === active ? "jg-hs-active" : "", s === active && ok ? "jg-hs-ok" : "", done.has(s) ? "jg-hs-done" : ""].join(" ");
    // From the peg post to the nut, then along the neck.
    p.push(`<path d="M${pegX[s]} ${s < 3 ? 178 : 40} L226 ${sy(s)} L526 ${sy(s)}" class="${cls}" style="stroke-width:${3.2 - s * 0.4}"/>`);
  });
  names.forEach((n, s) => {
    const cls = ["jg-hs-peg", s === active ? "jg-hs-peg-active" : "", s === active && ok ? "jg-hs-peg-ok" : "", done.has(s) ? "jg-hs-peg-done" : ""].join(" ");
    p.push(`<g class="${cls}" data-s="${s}" role="button" tabindex="0" aria-label="${n} string"><circle cx="${pegX[s]}" cy="${pegY(s)}" r="19"/><text x="${pegX[s]}" y="${pegY(s) + 6}">${n}${done.has(s) ? "✓" : ""}</text></g>`);
    p.push(`<text x="534" y="${sy(s) + 5}" class="jg-hs-name ${s === active ? "jg-hs-name-active" : ""}">${n}</text>`);
  });
  const body = isLefty() ? mirrorSvgTexts(p.join("")) : p.join("");
  return `<svg viewBox="0 0 560 220" class="jg-headstock" role="img" aria-label="Guitar headstock: tap a peg to tune that string">${body}</svg>`;
}

// A finger brushing down across the strings (back of the nail), then
// back up (the fleshy pad), looping.
function fingerStrumSvg() {
  return `<svg viewBox="0 0 320 170" class="jg-fingerstrum" role="img" aria-label="A finger strumming down with the nail and up with the pad">
    ${STR.map((n, s) => `<line x1="20" x2="300" y1="${40 + s * 18}" y2="${40 + s * 18}" class="jg-fs-string" style="stroke-width:${3 - s * 0.35}"/><text x="6" y="${44 + s * 18}" class="jg-fs-name">${n}</text>`).join("")}
    <g class="jg-fs-hand">
      <path d="M150 -60 C150 -90 210 -90 210 -60 L206 6 C204 22 156 22 154 6 Z" class="jg-fs-skin"/>
      <path d="M162 2 C162 -12 198 -12 198 2 C198 10 162 10 162 2 Z" class="jg-fs-nail"/>
    </g>
    <text x="250" y="22" class="jg-fs-dir jg-fs-down">↓ nail</text>
    <text x="250" y="22" class="jg-fs-dir jg-fs-up">↑ pad</text>
  </svg>`;
}

// Why the thick low E string is drawn at the BOTTOM (owner request
// 2026-10-18: a simple picture anyone gets). Left: a person seen from the
// side, holding the guitar upright. Seen from the side, the six strings are
// a little column of dots, thickest on top, nearest the eyes; a dashed line
// shows them looking down. Right: what they see looking down, the same
// fretboard picture used all through the app: nut on the left, low E at
// the bottom, nearest them (an eye under the picture shows where they are).
// Left-handed: the "what you see" picture is mirrored, like every fretboard.
function viewerSvg() {
  const lefty = isLefty();
  const T = (x, y, txt, { size = 11, w = 600, fill = "#4a3420", anchor = "middle" } = {}) =>
    `<text x="${x}" y="${y}" style="font:${w} ${size}px system-ui,-apple-system,sans-serif;fill:${fill};text-anchor:${anchor}">${txt}</text>`;
  const sizes = [3.4, 2.9, 2.4, 2.0, 1.6, 1.25]; // low E (thick) ... high e (thin)
  // Left: side view. Strings (dots) stacked low E on top.
  const dotsSmall = sizes.map((r, k) => `<circle cx="101" cy="${116 + k * 6.4}" r="${r * 0.8}" fill="#c9a24a"/>`).join("");
  const dotsBig = sizes.map((r, k) => `<circle cx="150" cy="${108 + k * 9.6}" r="${r * 1.35}" fill="#c9a24a" stroke="#8a6a22" stroke-width="0.6"/>`).join("");
  const side = `
    <rect x="4" y="22" width="186" height="262" rx="16" fill="#fff7ec" stroke="#ead7bd"/>
    ${T(97, 40, "1. From the side", { size: 13, w: 800, fill: "#3b2410" })}
    <path d="M22 236 C22 170 26 122 42 104 C50 96 66 96 72 104 C80 118 84 170 84 236 Z" fill="#7b5cd6"/>
    <rect x="40" y="88" width="14" height="16" rx="5" fill="#e3b08c"/>
    <circle cx="48" cy="72" r="20" fill="#e8b994"/>
    <path d="M28 68 C28 48 48 42 62 50 C66 52 68 56 68 60 C58 58 48 60 40 68 C38 76 34 82 30 82 Z" fill="#4a3022"/>
    <ellipse cx="61" cy="70" rx="2.6" ry="3" fill="#2b1a10"/>
    <path d="M67 74 l5 4 l-5 2" fill="none" stroke="#c48a64" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M86 128 C92 150 92 196 86 226 C84 234 70 236 68 228 C62 196 62 150 68 128 C70 120 84 120 86 128 Z" fill="#c9843c" stroke="#8a5a33" stroke-width="2"/>
    <rect x="84" y="112" width="9" height="42" rx="2" fill="#3b2416"/>
    ${dotsSmall.replace(/cx="101"/g, 'cx="97"')}
    <path d="M60 116 C70 150 80 176 92 190" fill="none" stroke="#6a4bc4" stroke-width="11" stroke-linecap="round"/>
    <circle cx="93" cy="191" r="6" fill="#e3b08c"/>
    <circle cx="146" cy="134" r="34" fill="#fff" stroke="#7b5cd6" stroke-width="2.5"/>
    <line x1="100" y1="114" x2="122" y2="108" stroke="#7b5cd6" stroke-width="1.5"/><line x1="100" y1="152" x2="122" y2="160" stroke="#7b5cd6" stroke-width="1.5"/>
    <rect x="132" y="104" width="9" height="60" rx="2" fill="#3b2416"/>
    ${dotsBig.replace(/cy="(\d+(\.\d+)?)"/g, (m, y) => `cy="${Number(y) + 2}"`)}
    ${T(164, 114, "E", { size: 12, w: 900, fill: "#2f8f83", anchor: "start" })}${T(164, 164, "e", { size: 12, w: 900, fill: "#3b2410", anchor: "start" })}
    <path d="M63 71 L138 105" stroke="#2f8f83" stroke-width="2.2" stroke-dasharray="5 4" fill="none"/>
    <path d="M140 106 l-9.5 -0.5 l4 -7 z" fill="#2f8f83"/>
    ${T(97, 254, "The thick low E string is", { size: 11, w: 800, fill: "#2f8f83" })}
    ${T(97, 268, "on top, nearest your eyes 👀", { size: 11, w: 800, fill: "#2f8f83" })}`;
  // Right: what you see looking down the neck (owner request 2026-10-26).
  // Perspective: the thick low E is nearest your eyes (bottom, big), the thin
  // high e is furthest away (top, small). The strings light up one by one,
  // from the nearest (E) to the furthest (e).
  const names = ["E", "A", "D", "G", "B", "e"];
  const sy = (s) => 150 - s * 13.2 + s * s * 0.55; // nearer strings further apart
  const nearL = 0, nearR = 140, farL = 16, farR = 126, topY = 72, botY = 160;
  const edgeL = (y) => nearL + (farL - nearL) * (botY - y) / (botY - topY);
  const edgeR = (y) => nearR + (farR - nearR) * (botY - y) / (botY - topY);
  const fretX = [26, 58, 86, 110];
  const view = `
    <path d="M${nearL} ${botY} L${nearR} ${botY} L${farR} ${topY} L${farL} ${topY} Z" fill="#6b3f1f"/>
    <path d="M${nearL} ${botY} L${farL} ${topY} L${farL + 5} ${topY} L${nearL + 7} ${botY} Z" fill="#f1ead9"/>
    ${fretX.map((x) => { const xt = farL + (x - nearL) * (farR - farL) / (nearR - nearL); return `<line x1="${x}" y1="${botY}" x2="${xt.toFixed(1)}" y2="${topY}" stroke="#d9d2c4" stroke-width="2"/>`; }).join("")}
    ${names.map((n, s) => { const y = sy(s); const w = (3.6 - s * 0.5).toFixed(2); return `<line x1="${edgeL(y).toFixed(1)}" x2="${edgeR(y).toFixed(1)}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#efe6d2" stroke-width="${w}"><animate attributeName="stroke" values="#efe6d2;#ffd34d;#efe6d2" keyTimes="0;0.08;0.2" dur="6s" begin="${(s * 0.5).toFixed(1)}s" repeatCount="indefinite"/></line>`; }).join("")}
    ${names.map((n, s) => T(edgeR(sy(s)) + 9, sy(s) + 4, n, { size: s === 0 ? 13 : 10, w: s === 0 || s === 5 ? 900 : 700, fill: s === 0 ? "#2f8f83" : s === 5 ? "#b5532a" : "#4a3420", anchor: "middle" })).join("")}`;
  const right = `
    <rect x="198" y="22" width="158" height="262" rx="16" fill="#fff7ec" stroke="#ead7bd"/>
    ${T(277, 40, "2. Looking down", { size: 13, w: 800, fill: "#3b2410" })}
    ${T(277, 54, "the neck", { size: 13, w: 800, fill: "#3b2410" })}
    ${T(277, 70, "thin e: furthest away", { size: 10.5, w: 800, fill: "#b5532a" })}
    <g transform="translate(${lefty ? 344 : 207} 6)${lefty ? " scale(-1 1)" : ""}">${lefty ? mirrorSvgTexts(view) : view}</g>
    ${T(277, 186, "thick E: closest to you", { size: 11, w: 800, fill: "#2f8f83" })}
    <path d="M277 222 L277 198" stroke="#3b2410" stroke-width="2"/><path d="M271 202 l6 -7 l6 7" fill="none" stroke="#3b2410" stroke-width="2"/>
    <ellipse cx="277" cy="236" rx="14" ry="8.5" fill="#fff" stroke="#3b2410" stroke-width="2"/><circle cx="277" cy="236" r="4.8" fill="#3b2410"><animate attributeName="cy" values="236;239;236" dur="3s" repeatCount="indefinite"/></circle>
    ${T(277, 262, "Your eyes, looking down", { size: 10.5, w: 700, fill: "#7a6a58" })}
    ${T(277, 275, "at the strings", { size: 10.5, w: 700, fill: "#7a6a58" })}`;
  return `<svg viewBox="0 0 360 292" class="jg-viewer" role="img" aria-label="Left: a person seen from the side holding a guitar; the thick low E string is the top string, nearest their eyes. Right: looking down the neck: the thick low E string is closest to you (bottom) and the thin high e string is furthest away (top), with the nut on the ${lefty ? "right" : "left"}.">${side}${right}</svg>`;
}

export { guitarSvg, headstockSvg, fingerStrumSvg, viewerSvg };
