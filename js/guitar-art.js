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

// Looking over a guitarist's shoulder (a cartoon in the style of a cool
// desert-movie guitar hero: long dark hair, black embroidered jacket, warm
// acoustic guitar; seen from behind, not a likeness of anyone): the neck
// runs up to the right with his hand on it, the other hand strums over the
// sound hole. This is what you see looking down at your own guitar, and the
// thick low E string is the one nearest your face.
function viewerSvg() {
  return `<svg viewBox="0 0 320 284" class="jg-viewer" role="img" aria-label="Over a guitarist's shoulder, looking down at the guitar in his lap: the thick low E string is the one nearest his face">
    <defs><radialGradient id="vw-sun" cx="80%" cy="15%" r="85%"><stop offset="0" stop-color="#ffe6b0"/><stop offset="0.55" stop-color="#f6cf96"/><stop offset="1" stop-color="#e3aa72"/></radialGradient>
      <linearGradient id="vw-top" x1="0" x2="1"><stop offset="0" stop-color="#ebba73"/><stop offset="1" stop-color="#cf9350"/></linearGradient></defs>
    <rect x="0" y="0" width="320" height="250" rx="18" fill="url(#vw-sun)"/>
    <path d="M0 214 Q80 198 160 206 T320 196 V232 Q320 250 302 250 H18 Q0 250 0 232 Z" fill="#d79b62" opacity="0.5"/>
    <g transform="translate(160 176) rotate(-34) scale(1.05)">
      <path d="M150 12 L138 64" class="vw-sleeve" style="stroke-width:20"/>
      <ellipse cx="150" cy="16" rx="14" ry="10" class="vw-skin"/>
      <ellipse cx="-22" cy="0" rx="60" ry="48" class="vw-side"/><ellipse cx="38" cy="0" rx="44" ry="37" class="vw-side"/>
      <ellipse cx="-22" cy="0" rx="55" ry="43" fill="url(#vw-top)"/><ellipse cx="38" cy="0" rx="39" ry="32" fill="url(#vw-top)"/>
      <circle cx="22" cy="0" r="17" class="vw-ring"/><circle cx="22" cy="0" r="13" class="vw-hole"/>
      <rect x="-56" y="-15" width="11" height="30" rx="3" class="vw-bridge"/>
      <rect x="68" y="-9.5" width="126" height="19" rx="2" class="vw-board"/>
      <path d="M194 -11 L228 -15 L228 15 L194 11 Z" class="vw-head"/><circle cx="198" cy="-14" r="3.2" class="vw-peg"/><circle cx="198" cy="14" r="3.2" class="vw-peg"/><circle cx="209" cy="-14" r="3.2" class="vw-peg"/><circle cx="209" cy="14" r="3.2" class="vw-peg"/><circle cx="220" cy="-14" r="3.2" class="vw-peg"/><circle cx="220" cy="14" r="3.2" class="vw-peg"/>
      <line x1="90" x2="90" y1="-9" y2="9" class="vw-fret"/><line x1="110" x2="110" y1="-9" y2="9" class="vw-fret"/><line x1="128" x2="128" y1="-9" y2="9" class="vw-fret"/><line x1="144" x2="144" y1="-9" y2="9" class="vw-fret"/><line x1="158" x2="158" y1="-9" y2="9" class="vw-fret"/><line x1="170" x2="170" y1="-9" y2="9" class="vw-fret"/><line x1="180" x2="180" y1="-9" y2="9" class="vw-fret"/>
      <line x1="66" x2="66" y1="-10" y2="10" class="vw-nut"/>
      <line x1="-46" x2="194" y1="-7.5" y2="-7.5" class="vw-str" style="stroke-width:1.90"/><line x1="-46" x2="194" y1="-4.5" y2="-4.5" class="vw-str" style="stroke-width:1.65"/><line x1="-46" x2="194" y1="-1.5" y2="-1.5" class="vw-str" style="stroke-width:1.40"/><line x1="-46" x2="194" y1="1.5" y2="1.5" class="vw-str" style="stroke-width:1.15"/><line x1="-46" x2="194" y1="4.5" y2="4.5" class="vw-str" style="stroke-width:0.90"/><line x1="-46" x2="194" y1="7.5" y2="7.5" class="vw-str" style="stroke-width:0.65"/>
      <path d="M138 18 L137 -3 M149 19 L149 -5 M160 18 L160 -4 M170 16 L171 -1" class="vw-finger"/>
    </g>
    <path d="M40 156 Q92 172 128 190" class="vw-sleeve" style="stroke-width:30"/>
    <path d="M40 156 Q92 172 128 190" class="vw-trim"/>
    <ellipse cx="136" cy="194" rx="15" ry="11" transform="rotate(-30 136 194)" class="vw-skin"/>
    <path d="M131 200 l10 9 l4 -11 z" fill="#c0392b"/>
    <path d="M0 250 L0 92 C16 58 66 50 108 72 C130 88 124 128 100 152 C82 170 58 200 50 250 Z" class="vw-jacket"/>
    <path d="M16 104 q14 -14 32 -6 q-10 10 -4 22 M64 80 q16 -6 28 6 q-14 2 -16 16 M24 140 q12 -8 22 2" class="vw-embroidery"/>
    <path d="M84 96 L106 100 L94 118 Z" fill="#f4efe6"/>
    <path d="M30 72 C18 34 52 4 88 12 C122 20 132 54 118 82 C114 96 112 112 116 130 C104 124 98 110 96 98 C92 116 94 132 100 146 C86 140 80 124 80 108 C74 122 76 140 82 156 C66 146 62 128 64 110 C56 126 56 142 60 158 C44 144 44 124 48 106 C40 116 32 122 22 124 C32 108 34 90 30 72 Z" class="vw-hair"/>
    <path d="M44 28 C62 18 84 24 100 38 M38 52 C58 42 82 48 102 62 M56 76 C70 70 86 80 92 98 M70 92 C76 108 78 124 84 140" class="vw-strand"/>
    <text x="160" y="266" class="jg-viewer-txt">This is you, looking down at your guitar:</text>
    <text x="160" y="281" class="jg-viewer-txt jg-viewer-strong">the thick low E string is the one nearest you</text>
  </svg>`;
}

export { guitarSvg, headstockSvg, fingerStrumSvg, viewerSvg };
