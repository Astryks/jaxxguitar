// Jaxx the kitten: a flat, chubby orange tabby drawn in SVG (like Hayden
// Keys' panda), so it stays crisp and can move. Big round head, pointy
// ears, forehead stripes, shiny eyes, a cream muzzle, a teal bowtie, little
// paws and a swishy tail. No mouth: the eyes do the talking.
//
// Jaxx looks alive but calm (breathing, blinking, glancing, tail swish).
// Bigger moves play once or twice and then settle back down.
//
// Poses:   idle  wave  cheer  think  oops  play (strumming)  sing  sleep
// Tricks:  spin · rockout (guitar up, jumping) · jump (sparkly leap)
//          yarn (batting a ball of yarn) · fish (a fishy snack)
//          tangled (wrapped in guitar strings — for "keep trying")
// Jaxx holds a little guitar unless a trick needs both paws.

const POSES = ["idle", "wave", "cheer", "think", "oops", "play", "sing", "sleep", "spin", "rockout", "jump", "yarn", "fish", "tangled"];
const YAY = ["spin", "rockout", "jump", "yarn", "fish", "cheer"];
const TRY = ["tangled", "oops"];
const turn = { yay: Math.floor(Math.random() * YAY.length), try: 0 };
function nextTrick(kind = "yay") {
  const list = kind === "yay" ? YAY : TRY;
  return list[turn[kind]++ % list.length];
}
// Jaxx keeps his guitar unless a trick needs his paws (snack, yarn, spinning).
const NO_GUITAR = new Set(["fish", "yarn", "spin"]);

const LX = 74, RX = 126, EY = 96;

function eyes(pose) {
  const line = (d) => `<path class="jk-line" d="${d}"/>`;
  if (pose === "sleep") return line(`M${LX - 10} ${EY} Q${LX} ${EY + 7} ${LX + 10} ${EY}`) + line(`M${RX - 10} ${EY} Q${RX} ${EY + 7} ${RX + 10} ${EY}`);
  if (pose === "tangled") return line(`M${LX - 7} ${EY - 7} L${LX + 6} ${EY} L${LX - 7} ${EY + 7}`) + line(`M${RX + 7} ${EY - 7} L${RX - 6} ${EY} L${RX + 7} ${EY + 7}`);
  if (["cheer", "sing", "spin", "rockout", "jump", "fish"].includes(pose)) return line(`M${LX - 10} ${EY + 3} Q${LX} ${EY - 9} ${LX + 10} ${EY + 3}`) + line(`M${RX - 10} ${EY + 3} Q${RX} ${EY - 9} ${RX + 10} ${EY + 3}`);
  const r = pose === "oops" ? 13 : 11.5;
  const look = pose === "think" ? -4 : pose === "yarn" ? 4 : 0;
  const eye = (x) => `<ellipse cx="${x}" cy="${EY}" rx="${r}" ry="${r + 1.5}" class="jk-eye"/>
      <g class="jk-look"><ellipse cx="${x + look / 2}" cy="${EY + 1 + look / 2}" rx="${r - 3.5}" ry="${r - 1}" class="jk-pupil"/>
      <circle cx="${x + 3 + look / 2}" cy="${EY - 4 + look / 2}" r="3.6" fill="#fff"/><circle cx="${x - 3 + look / 2}" cy="${EY + 5 + look / 2}" r="1.7" fill="#fff"/></g>`;
  return `<g class="jk-eyes">${eye(LX)}${eye(RX)}</g>`;
}

// A little acoustic guitar held across the tummy.
const GUITAR = `<g class="jk-guitar">
    <rect x="104" y="128" width="11" height="58" rx="3" transform="rotate(48 110 157)" class="jk-neck"/>
    <rect x="133" y="112" width="16" height="20" rx="4" transform="rotate(48 141 122)" class="jk-head-stock"/>
    <ellipse cx="78" cy="190" rx="30" ry="24" class="jk-gbody"/>
    <ellipse cx="96" cy="172" rx="21" ry="17" class="jk-gbody"/>
    <ellipse cx="78" cy="190" rx="24" ry="18" class="jk-gtop"/>
    <ellipse cx="96" cy="172" rx="16" ry="12" class="jk-gtop"/>
    <circle cx="90" cy="178" r="7" class="jk-hole"/>
    <path d="M70 198 L138 128 M73 200 L140 131 M76 202 L142 134" class="jk-gstrings"/>
    <rect x="66" y="194" width="16" height="5" rx="2" transform="rotate(-44 74 196)" class="jk-bridge"/>
  </g>`;

function props(pose) {
  if (pose === "sing") return '<g class="jk-notes"><text x="150" y="58">♪</text><text x="166" y="38">♫</text></g>';
  if (pose === "play") return '<g class="jk-notes jk-notes-play"><text x="18" y="140">♪</text><text x="164" y="96">♫</text></g>';
  if (pose === "sleep") return '<g class="jk-zzz"><text x="150" y="50">z</text><text x="164" y="34">z</text><text x="176" y="18">Z</text></g>';
  if (pose === "oops") return '<path class="jk-sweat" d="M162 56 Q170 68 162 74 Q154 68 162 56Z"/>';
  if (pose === "cheer" || pose === "jump") return '<g class="jk-sparkles"><path d="M24 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M172 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M182 120l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>';
  if (pose === "spin") return '<g class="jk-swoosh"><path d="M12 130 q-8 -44 22 -76 M188 130 q8 -44 -22 -76" fill="none" stroke="#f6c58f" stroke-width="5" stroke-linecap="round"/></g>';
  if (pose === "rockout") return '<g class="jk-notes jk-notes-play"><text x="10" y="70">♪</text><text x="168" y="60">♫</text><text x="176" y="130">♪</text></g>';
  if (pose === "yarn") return `<g class="jk-yarn"><circle cx="160" cy="200" r="18" fill="#d9678f"/><path d="M146 194 q14 -10 28 4 M144 204 q16 -6 30 6 M152 188 q10 14 4 30" fill="none" stroke="#f4a6c0" stroke-width="2.5"/><path d="M142 206 q-20 10 -34 2" fill="none" stroke="#d9678f" stroke-width="2.5"/></g>`;
  if (pose === "fish") return `<g class="jk-fish"><path d="M84 146 q16 -14 36 0 q-16 14 -36 0z" fill="#8fd0f5"/><path d="M120 146 l12 -10 v20z" fill="#8fd0f5"/><circle cx="92" cy="144" r="2.2" fill="#2a2a3a"/><path d="M104 140 v12 M110 141 v10" stroke="#5fb3df" stroke-width="2"/></g>`;
  if (pose === "tangled") return `<g class="jk-tangle"><path d="M28 120 q70 -40 144 10 M30 150 q70 40 140 -20 M50 96 q50 90 100 40 M150 96 q-60 90 -100 50" fill="none" stroke="#c9a46a" stroke-width="2.4" stroke-linecap="round"/></g>`;
  return "";
}

function stage(pose) {
  if (pose === "rockout") return '<text class="jk-shout" x="4" y="22">ROCK!</text>';
  if (pose === "tangled") return '<text class="jk-shout jk-ugh" x="112" y="22">mrrrow…</text>';
  if (pose === "fish") return '<text class="jk-shout" x="120" y="22">nom!</text>';
  return "";
}

function paw(cx, cy, cls = "") {
  return `<g class="jk-paw ${cls}"><ellipse cx="${cx}" cy="${cy}" rx="12" ry="10" class="jk-fur"/><ellipse cx="${cx}" cy="${cy + 2}" rx="5" ry="4" class="jk-pad"/></g>`;
}
function leg(cx, side) {
  return `<g class="jk-leg jk-leg-${side}"><ellipse cx="${cx}" cy="204" rx="20" ry="15" class="jk-fur"/>
    <ellipse cx="${cx}" cy="207" rx="7.5" ry="6" class="jk-pad"/>
    <circle cx="${cx - 8.5}" cy="198" r="2.8" class="jk-pad"/><circle cx="${cx}" cy="195" r="2.8" class="jk-pad"/><circle cx="${cx + 8.5}" cy="198" r="2.8" class="jk-pad"/></g>`;
}
function arm(side) {
  const x = side === "l" ? 46 : 132;
  return `<g class="jk-arm jk-arm-${side}"><rect x="${x}" y="136" width="22" height="46" rx="11" class="jk-fur"/>
    <path d="M${x + 3} 150 h16 M${x + 3} 160 h16" class="jk-stripe-line"/>
    <ellipse cx="${x + 11}" cy="176" rx="9" ry="7" class="jk-cream"/></g>`;
}

function kittenSvg(pose = "idle", { label = "Jaxx the kitten" } = {}) {
  if (!POSES.includes(pose)) pose = "idle";
  const guitar = !NO_GUITAR.has(pose);
  return `<svg class="jk-kitten jk-${pose}" viewBox="0 -10 200 230" role="img" aria-label="${label}">
    <g class="jk-all"><g class="jk-live">
      <path class="jk-tail" d="M136 196 Q186 198 184 150 Q182 120 162 126" fill="none" stroke-linecap="round"/>
      <path class="jk-tail-stripes" d="M170 194 l8 -6 M182 172 l-9 -3 M181 150 l-9 2" fill="none" stroke-linecap="round"/>
      ${leg(70, "l")}${leg(130, "r")}
      <g class="jk-body">
        <ellipse cx="100" cy="166" rx="52" ry="43" class="jk-fur"/>
        <ellipse cx="100" cy="176" rx="31" ry="27" class="jk-cream"/>
      </g>
      ${arm("l")}${arm("r")}
      <g class="jk-head">
        <g class="jk-ear jk-ear-l"><path d="M36 78 L44 20 Q48 12 56 18 L88 46 Z" class="jk-fur"/><path d="M46 62 L50 30 L76 48 Z" class="jk-ear-in"/></g>
        <g class="jk-ear jk-ear-r"><path d="M164 78 L156 20 Q152 12 144 18 L112 46 Z" class="jk-fur"/><path d="M154 62 L150 30 L124 48 Z" class="jk-ear-in"/></g>
        <ellipse cx="100" cy="94" rx="72" ry="58" class="jk-fur"/>
        <path d="M100 38 v16 M86 40 l3 13 M114 40 l-3 13" class="jk-stripe-line"/>
        <path d="M30 92 h15 M31 104 h13 M170 92 h-15 M169 104 h-13" class="jk-stripe-line"/>
        ${eyes(pose)}
        <ellipse cx="54" cy="122" rx="10" ry="6" class="jk-cheek"/><ellipse cx="146" cy="122" rx="10" ry="6" class="jk-cheek"/>
        <ellipse cx="89" cy="124" rx="14" ry="10" class="jk-cream"/><ellipse cx="111" cy="124" rx="14" ry="10" class="jk-cream"/>
        <path d="M94 114 Q100 110 106 114 Q104 120 100 121 Q96 120 94 114Z" class="jk-nose"/>
        <path d="M74 122 h-24 M74 127 l-22 4 M126 122 h24 M126 127 l22 4" class="jk-whisker"/>
      </g>
      <g class="jk-bow"><path d="M100 156 L84 147 Q80 156 84 165 Z"/><path d="M100 156 L116 147 Q120 156 116 165 Z"/><circle cx="100" cy="156" r="5.5"/></g>
      ${guitar ? GUITAR + paw(92, 176, "jk-strum-paw") + paw(130, 136, "jk-fret-paw") : ""}
      ${props(pose)}
    </g></g>
    ${stage(pose)}
  </svg>`;
}

export { kittenSvg, POSES, nextTrick };
