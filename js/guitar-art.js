// Our own drawings of the guitar, all the same way round as the fretboard:
// how a right-handed player sees their guitar looking down at it, neck to
// the left, thickest string (low E) on top.
//   guitarSvg()            the whole guitar, with where each hand goes
//   headstockSvg(opts)     the tuning pegs, one per string (tuner)
//   fingerStrumSvg()       strumming with a finger instead of a pick

const STR = ["E", "A", "D", "G", "B", "e"];

function guitarSvg() {
  const sy = (s) => 100 + s * 6; // strings, low E on top
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
    <text x="96" y="${sy(0) - 14}" class="jg-ga-small">low E (thickest) on top</text>
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
  const sy = (s) => 72 + s * 15.5; // at the nut, low E on top
  // Low E, A, D pegs on the top edge (low E farthest from the nut);
  // G, B, high e on the bottom edge (high e farthest).
  const pegX = [40, 100, 160, 160, 100, 40];
  const pegY = (s) => (s < 3 ? 22 : 196);
  const p = [];
  p.push(`<path d="M18 40 Q10 110 18 178 L226 164 L226 60 Z" class="jg-hs-head"/>`);
  p.push(`<rect x="226" y="60" width="300" height="104" class="jg-hs-neck"/>`);
  p.push(`<rect x="222" y="58" width="8" height="108" class="jg-hs-nut"/>`);
  [300, 368, 430, 486].forEach((x) => p.push(`<line x1="${x}" x2="${x}" y1="60" y2="164" class="jg-hs-fret"/>`));
  STR.forEach((n, s) => {
    const cls = ["jg-hs-string", s === active ? "jg-hs-active" : "", s === active && ok ? "jg-hs-ok" : "", done.has(s) ? "jg-hs-done" : ""].join(" ");
    // From the peg post to the nut, then along the neck.
    p.push(`<path d="M${pegX[s]} ${s < 3 ? 40 : 178} L226 ${sy(s)} L526 ${sy(s)}" class="${cls}" style="stroke-width:${3.2 - s * 0.4}"/>`);
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

export { guitarSvg, headstockSvg, fingerStrumSvg };
