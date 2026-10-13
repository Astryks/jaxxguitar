// Our own drawings of the guitar, all the same way round as the fretboard:
// how a right-handed player sees their guitar looking down at it, neck to
// the left, thickest string (low E) at the bottom: your head is below the
// picture, so the low E (the top string on the guitar) is the nearest one.
//   guitarSvg()            the whole guitar, with where each hand goes
//   headstockSvg(opts)     the tuning pegs, one per string (tuner)
//   fingerStrumSvg()       strumming with a finger instead of a pick
//   viewerSvg()            a soft shadow of your head under the fretboard,
//                          looking down at it (why low E is at the bottom)

const STR = ["E", "A", "D", "G", "B", "e"];

function guitarSvg() {
  const sy = (s) => 100 + (5 - s) * 6; // strings, low E at the bottom
  const frets = [];
  let x = 92;
  for (let f = 1; f <= 14; f++) { x += 22 - f * 0.55; frets.push(x); }
  return `<svg viewBox="0 0 640 290" class="jg-guitar-art" role="img" aria-label="A whole acoustic guitar, drawn for a right-handed player: neck on the left, body on the right">
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
    <text x="96" y="${sy(0) + 22}" class="jg-ga-small">low E (thickest) at the bottom: nearest you</text>
    </g>
    <g class="jg-ga-label"><path d="M200 152 L200 174" class="jg-ga-arrow"/><text x="200" y="196">Left hand</text><text x="200" y="214" class="jg-ga-small">presses the frets</text></g>
    <g class="jg-ga-label"><path d="M440 154 L440 222" class="jg-ga-arrow"/><text x="440" y="244">Right hand</text><text x="440" y="262" class="jg-ga-small">strums over the hole</text></g>
    <text x="320" y="284" class="jg-ga-small jg-ga-mid">Drawn for right-handed players, as you see it looking down at your guitar</text>
  </svg>`;
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
  return `<svg viewBox="0 0 560 220" class="jg-headstock" role="img" aria-label="Guitar headstock: tap a peg to tune that string">${p.join("")}</svg>`;
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

// A small shadow of a 60s rock guitarist seen from behind (big round afro,
// headband ties), as if sitting just below the screen looking down at the
// neck: why the thick low E is drawn at the bottom.
function viewerSvg() {
  return `<svg viewBox="0 0 300 74" class="jg-viewer" role="img" aria-label="A guitarist below the fretboard, looking down at it: the thick low E string is the one nearest them">
    <g class="jg-viewer-fig">
      <path d="M112 74 C116 58 132 52 150 52 C168 52 184 58 188 74 Z"/>
      <rect x="143" y="38" width="14" height="16" rx="5"/>
      <ellipse cx="150" cy="28" rx="22" ry="20"/><circle cx="129.0" cy="25.0" r="7.5"/><circle cx="130.5" cy="17.9" r="7.5"/><circle cx="134.9" cy="11.8" r="7.5"/><circle cx="141.5" cy="7.6" r="7.5"/><circle cx="149.3" cy="6.0" r="7.5"/><circle cx="157.2" cy="7.1" r="7.5"/><circle cx="164.1" cy="10.9" r="7.5"/><circle cx="168.9" cy="16.7" r="7.5"/><circle cx="170.9" cy="23.7" r="7.5"/>
    </g>
    <path d="M128 31 Q150 37 172 31" class="jg-viewer-band"/>
    <path d="M171 32 q7 6 4 15 M173 31 q10 4 11 13" class="jg-viewer-band jg-viewer-tie"/>
    <text x="98" y="30" class="jg-viewer-txt jg-viewer-left">low E (thickest)</text><text x="98" y="45" class="jg-viewer-txt jg-viewer-left">is nearest you</text>
    <text x="202" y="30" class="jg-viewer-txt">you, looking</text><text x="202" y="45" class="jg-viewer-txt">down at the neck</text>
  </svg>`;
}

export { guitarSvg, headstockSvg, fingerStrumSvg, viewerSvg };
