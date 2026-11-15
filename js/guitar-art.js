// Our own drawings of the guitar, all the same way round as the fretboard:
// how a right-handed player sees their guitar looking down at it, neck to
// the left, thickest string (low E) at the bottom: your head is below the
// picture, so the low E (the top string on the guitar) is the nearest one.
//   guitarSvg()            the whole guitar, with where each hand goes
//   headstockSvg(opts)     the tuning pegs, one per string (tuner)
//   fingerStrumSvg()       strumming with a finger instead of a pick
//   viewerSvg()            over-the-shoulder view down onto the neck (why
//                          low E is at the bottom: it's nearest you)

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

// Why the thick low E string is drawn at the BOTTOM of every fretboard
// (owner request 2026-11): one picture, over the player's shoulder. We
// stand behind them: the back of their head and their shoulders are at
// the bottom, and we look down past their head at the guitar they hold,
// so the neck runs across the picture with the six strings showing. The
// thick low E is the nearest string (bottom, next to their head), the
// thin high e the furthest (top). Headstock on the left, like the
// fretboard; left-handed players get it mirrored (text kept readable).
function viewerSvg() {
  const lefty = isLefty();
  const T = (x, y, txt, { size = 11, w = 700, fill = "#4a3420", anchor = "middle" } = {}) =>
    `<text x="${x}" y="${y}" style="font:${w} ${size}px system-ui,-apple-system,sans-serif;fill:${fill};text-anchor:${anchor}">${txt}</text>`;
  const names = ["E", "A", "D", "G", "B", "e"];
  const NEAR = "#2f8f83", FAR = "#b5532a";
  const sy = (s) => 144 - s * 12.4 + s * s * 0.14; // low E nearest (bottom), a touch wider apart
  const nutX = 60, joinX = 238, top = 79, bot = 151;
  const frets = [98, 134, 167, 197, 224];
  // Tuning posts on the headstock: low E, A, D on the near side, G, B, e far.
  const post = [[24, 143], [36, 141], [48, 139], [48, 90], [36, 88], [24, 86]];
  const strings = names.map((n, s) => {
    const y = sy(s).toFixed(1);
    const wound = s < 3;
    return `<path d="M${post[s][0]} ${post[s][1]} L${nutX} ${y} L372 ${y}" fill="none" stroke="${wound ? "#d9b46a" : "#eeebe4"}" stroke-width="${(3.6 - s * 0.48).toFixed(2)}" stroke-linecap="round"/>`;
  }).join("");
  const tags = names.map((n, s) => {
    const y = sy(s);
    const c = s === 0 ? NEAR : s === 5 ? FAR : "#5a4632";
    return `<rect x="73" y="${(y - 5.6).toFixed(1)}" width="15" height="11.2" rx="3.5" fill="#fffaf2" stroke="${c}" stroke-width="${s === 0 || s === 5 ? 1.6 : 0.8}"/>${T(80.5, (y + 3.6).toFixed(1), n, { size: 9.5, w: 900, fill: c })}`;
  }).join("");
  const scene = `
    <!-- guitar body (upper bout) and sound hole -->
    <path d="M232 76 C250 42 320 34 376 46 L376 196 C334 208 290 204 266 186 C250 174 240 166 234 158 Z" fill="#e3a95f" stroke="#a8692f" stroke-width="2"/>
    <path d="M240 80 C256 52 318 44 376 54" fill="none" stroke="#f3cf95" stroke-width="2"/>
    <circle cx="308" cy="114" r="33" fill="none" stroke="#a8692f" stroke-width="3"/>
    <circle cx="308" cy="114" r="26" fill="#3a2414"/>
    <!-- headstock, neck and frets -->
    <path d="M${nutX} ${top} L20 70 Q8 115 20 160 L${nutX} ${bot} Z" fill="#6b3f1f"/>
    ${[[24, 64], [36, 62], [48, 60]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="#d8c79a" stroke="#9c8a5c"/>`).join("")}
    ${[[24, 166], [36, 168], [48, 170]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="#d8c79a" stroke="#9c8a5c"/>`).join("")}
    ${post.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#d8c79a"/>`).join("")}
    <rect x="${nutX}" y="${bot}" width="${joinX - nutX}" height="7" fill="#c9843c"/>
    <rect x="${nutX}" y="${top}" width="${joinX - nutX}" height="${bot - top}" fill="#4a2e1a"/>
    ${frets.map((x) => `<line x1="${x}" y1="${top}" x2="${x}" y2="${bot}" stroke="#d9d2c4" stroke-width="2.2"/>`).join("")}
    ${[150, 210].map((x) => `<circle cx="${x}" cy="${(top + bot) / 2}" r="4" fill="#efe6d2" opacity="0.8"/>`).join("")}
    <rect x="${nutX - 3}" y="${top - 1}" width="6" height="${bot - top + 2}" rx="1.5" fill="#f4eee0"/>
    ${strings}
    ${tags}
    <!-- the player, from behind: shoulders, arms, back of the head -->
    <path d="M40 352 C44 300 104 276 190 276 C276 276 336 300 340 350 Z" fill="#d9638f"/>
    <path d="M108 300 C84 290 66 270 62 238" fill="none" stroke="#d9638f" stroke-width="28" stroke-linecap="round"/>
    <path d="M62 238 C68 206 90 182 110 166" fill="none" stroke="#e8b994" stroke-width="17" stroke-linecap="round"/>
    <ellipse cx="114" cy="160" rx="14" ry="10" fill="#e8b994" stroke="#c48a64" stroke-width="1.2"/>
    <ellipse cx="117" cy="148.5" rx="6" ry="4.5" fill="#e8b994" stroke="#c48a64" stroke-width="1.2"/>
    <path d="M272 300 C298 292 322 272 332 240" fill="none" stroke="#d9638f" stroke-width="28" stroke-linecap="round"/>
    <path d="M332 240 C330 206 312 176 298 158" fill="none" stroke="#e8b994" stroke-width="17" stroke-linecap="round"/>
    <ellipse cx="294" cy="150" rx="15" ry="11" fill="#e8b994" stroke="#c48a64" stroke-width="1.2"/>
    <path d="M288 140 L300 140 L294 131 Z" fill="#c46a1f"/>
    <g transform="translate(0 14)">
    <path d="M172 244 L208 244 L210 268 L170 268 Z" fill="#e0ad88"/>
    <path d="M160 268 C172 280 208 280 220 268" fill="none" stroke="#6a4bc4" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="152" cy="226" rx="6.5" ry="11" fill="#e8b994" stroke="#c48a64" stroke-width="1.2"/>
    <ellipse cx="228" cy="226" rx="6.5" ry="11" fill="#e8b994" stroke="#c48a64" stroke-width="1.2"/>
    <ellipse cx="190" cy="220" rx="38" ry="42" fill="#4a3022"/>
    <path d="M190 182 C176 196 170 222 172 252 M198 186 C200 206 206 230 204 254 M178 190 C162 206 158 228 160 246 M205 192 C218 206 222 228 218 246" fill="none" stroke="#6b4630" stroke-width="2" stroke-linecap="round"/>
    <path d="M194 200 c-6 -2 -8 6 -2 7 c6 1 8 -8 0 -10" fill="none" stroke="#7a5238" stroke-width="2" stroke-linecap="round"/>
    </g>
    <!-- labels -->
    <path d="M176 165 L176 ${sy(0) + 6}" stroke="${NEAR}" stroke-width="2"/><path d="M171 ${sy(0) + 11} l5 -6 l5 6" fill="none" stroke="${NEAR}" stroke-width="2"/>
    ${T(178, 178, "low E – closest to you", { size: 12, w: 900, fill: NEAR })}
    ${T(166, 68, "high e – furthest away", { size: 12, w: 900, fill: FAR })}
    <path d="M166 71 L166 ${sy(5) - 5}" stroke="${FAR}" stroke-width="2"/><path d="M161 ${sy(5) - 10} l5 6 l5 -6" fill="none" stroke="${FAR}" stroke-width="2"/>
    ${T(190, 334, "You, seen from behind", { size: 11.5, w: 700, fill: "#ffffff" })}`;
  const body = lefty ? `<g transform="translate(360 0) scale(-1 1)">${mirrorSvgTexts(scene)}</g>` : scene;
  return `<svg viewBox="0 0 360 350" class="jg-viewer" role="img" aria-label="Looking over your own shoulder at the guitar you're holding: the back of your head is at the bottom, the neck runs across with the headstock on the ${lefty ? "right" : "left"}. The thick low E string is the closest string to you (bottom) and the thin high e string is the furthest away (top).">
    <defs><clipPath id="jgViewerClip"><rect x="0" y="0" width="360" height="350" rx="18"/></clipPath></defs>
    <g clip-path="url(#jgViewerClip)">
      <rect x="0" y="0" width="360" height="350" fill="#fff7ec"/>
      ${body}
    </g>
    <rect x="0.75" y="0.75" width="358.5" height="348.5" rx="18" fill="none" stroke="#ead7bd" stroke-width="1.5"/>
    ${T(180, 22, "Looking down at your guitar", { size: 14, w: 800, fill: "#3b2410" })}
    ${T(180, 38, "(over your own shoulder)", { size: 11, w: 600, fill: "#7a6a58" })}
  </svg>`;
}

export { guitarSvg, headstockSvg, fingerStrumSvg, viewerSvg };
