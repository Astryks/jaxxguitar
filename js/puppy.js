// Jaxx the puppy: a beagle pup (tan head and long ears, white blaze and
// chest, black saddle) with a red
// bandana and his own little guitar, drawn in SVG so he stays crisp and
// can move. He drives a little red pickup truck.
//
// Jaxx looks alive but calm (breathing, blinking, ear flops, tail wag).
// Bigger moves play once or twice and then settle back down.
//
// Poses:   idle  wave  cheer  think  oops  play (strumming)  sing  sleep
// Tricks:  spin · rockout (guitar up, jumping) · jump (sparkly leap)
//          yarn (fetching a tennis ball) · fish (a bone snack)
//          tangled (wrapped in guitar strings, for "keep trying")
// Truck:   truck (in the truck bed, strumming: the logo)
//          show  (hops out of the truck, does tricks, plays, hops back in)
//          drive (at the wheel, the truck rolling along)
// Pose names match the old kitten so every screen keeps working.

const POSES = ["bonejam", "xmas", "water", "rain", "idle", "wave", "cheer", "think", "oops", "play", "sing", "sleep", "spin", "rockout", "jump", "yarn", "fish", "tangled", "truck", "show", "drive"];
const YAY = ["spin", "rockout", "jump", "yarn", "fish", "cheer", "show"];
const TRY = ["tangled", "oops"];
const turn = { yay: Math.floor(Math.random() * YAY.length), try: 0 };
function nextTrick(kind = "yay") {
  const list = kind === "yay" ? YAY : TRY;
  return list[turn[kind]++ % list.length];
}
// Jaxx keeps his guitar unless a trick needs his paws.
const NO_GUITAR = new Set(["fish", "yarn", "spin", "drive"]);
const TRUCK = new Set(["truck", "show", "drive", "xmas", "water", "rain", "bonejam"]);

const LX = 78, RX = 122, EY = 76;

function eyes(pose) {
  const line = (d) => `<path class="jp-line" d="${d}"/>`;
  if (pose === "sleep") return line(`M${LX - 9} ${EY + 2} Q${LX} ${EY + 7} ${LX + 9} ${EY + 2}`) + line(`M${RX - 9} ${EY + 2} Q${RX} ${EY + 7} ${RX + 9} ${EY + 2}`);
  if (pose === "tangled") return line(`M${LX - 7} ${EY - 5} L${LX + 6} ${EY} L${LX - 7} ${EY + 5}`) + line(`M${RX + 7} ${EY - 5} L${RX - 6} ${EY} L${RX + 7} ${EY + 5}`);
  if (["cheer", "sing", "spin", "rockout", "jump", "fish"].includes(pose)) return line(`M${LX - 9} ${EY + 3} Q${LX} ${EY - 6} ${LX + 9} ${EY + 3}`) + line(`M${RX - 9} ${EY + 3} Q${RX} ${EY - 6} ${RX + 9} ${EY + 3}`);
  const look = pose === "think" ? -3 : pose === "yarn" ? 3 : 0;
  const eye = (x) => `<path d="M${x - 11} ${EY + 1} Q${x} ${EY - 13} ${x + 11} ${EY + 1} Q${x} ${EY + 11} ${x - 11} ${EY + 1} Z" class="jp-eye"/>
      <g class="jp-look"><circle cx="${x + look}" cy="${EY - 0.5}" r="7.6" fill="url(#jp-gr-iris)"/><circle cx="${x + look}" cy="${EY - 0.5}" r="4" fill="#120b07"/>
      <circle cx="${x + 2.8 + look}" cy="${EY - 3.4}" r="2.4" fill="#fff"/><circle cx="${x - 2 + look}" cy="${EY + 2.6}" r="0.9" fill="#fff" opacity="0.8"/></g>
      <path d="M${x - 11} ${EY + 1} Q${x} ${EY - 13} ${x + 11} ${EY + 1}" class="jp-lid"/>
      <path d="M${x - 11} ${EY - 9} Q${x} ${EY - 15} ${x + 9} ${EY - 10}" class="jp-brow"/>`;
  return `<g class="jp-eyes">${eye(LX)}${eye(RX)}</g>`;
}

// Happy poses get a tongue out; the rest a little smile.
function mouth(pose) {
  const happy = ["cheer", "sing", "spin", "rockout", "jump", "wave", "play", "truck", "show", "drive", "yarn"].includes(pose);
  if (pose === "oops" || pose === "tangled") return '<path class="jp-mouth" d="M100 112 v6 M92 124 Q100 119 108 124"/>';
  if (pose === "fish") return '<path class="jp-mouth" d="M100 112 v6 M90 120 Q100 128 110 120"/>';
  return `<path class="jp-mouth" d="M100 111 v8 M100 119 Q93 125 86 121 M100 119 Q107 125 114 121"/>${happy ? '<path class="jp-tongue" d="M93 122 Q100 120 107 122 L106 132 Q100 138 94 132 Z"/><path d="M100 123 v8" stroke="#c9566c" stroke-width="1" fill="none"/>' : ""}`;
}

const GUITAR = `<g class="jp-guitar" filter="url(#jp-vol)">
    <rect x="104" y="128" width="11" height="58" rx="3" transform="rotate(48 110 157)" class="jp-neck"/>
    <rect x="133" y="112" width="16" height="20" rx="4" transform="rotate(48 141 122)" class="jp-head-stock"/>
    <ellipse cx="78" cy="190" rx="30" ry="24" class="jp-gbody"/>
    <ellipse cx="96" cy="172" rx="21" ry="17" class="jp-gbody"/>
    <ellipse cx="78" cy="190" rx="24" ry="18" class="jp-gtop"/>
    <ellipse cx="96" cy="172" rx="16" ry="12" class="jp-gtop"/>
    <circle cx="90" cy="178" r="7" class="jp-hole"/>
    <path d="M70 198 L138 128 M73 200 L140 131 M76 202 L142 134" class="jp-gstrings"/>
    <rect x="66" y="194" width="16" height="5" rx="2" transform="rotate(-44 74 196)" class="jp-bridge"/>
  </g>`;

function props(pose) {
  if (pose === "sing") return '<g class="jp-notes"><text x="150" y="58">♪</text><text x="166" y="38">♫</text></g>';
  if (pose === "play" || pose === "truck" || pose === "show") return '<g class="jp-notes jp-notes-play"><text x="18" y="140">♪</text><text x="164" y="96">♫</text></g>';
  if (pose === "sleep") return '<g class="jp-zzz"><text x="150" y="50">z</text><text x="164" y="34">z</text><text x="176" y="18">Z</text></g>';
  if (pose === "oops") return '<path class="jp-sweat" d="M162 56 Q170 68 162 74 Q154 68 162 56Z"/>';
  if (pose === "cheer" || pose === "jump") return '<g class="jp-sparkles"><path d="M24 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M172 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M182 120l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>';
  if (pose === "spin") return '<g class="jp-swoosh"><path d="M12 130 q-8 -44 22 -76 M188 130 q8 -44 -22 -76" fill="none" stroke="#f6c58f" stroke-width="5" stroke-linecap="round"/></g>';
  if (pose === "rockout") return '<g class="jp-notes jp-notes-play"><text x="10" y="70">♪</text><text x="168" y="60">♫</text><text x="176" y="130">♪</text></g>';
  if (pose === "yarn") return '<g class="jp-ball"><circle cx="162" cy="198" r="16" fill="#c9e04a"/><path d="M148 190 q14 8 28 -2 M148 206 q14 -8 28 2" fill="none" stroke="#fff" stroke-width="2.5"/></g>';
  if (pose === "fish") return '<g class="jp-bone"><rect x="78" y="141" width="44" height="10" rx="5" fill="#fff6e8"/><circle cx="78" cy="141" r="7" fill="#fff6e8"/><circle cx="78" cy="151" r="7" fill="#fff6e8"/><circle cx="122" cy="141" r="7" fill="#fff6e8"/><circle cx="122" cy="151" r="7" fill="#fff6e8"/></g>';
  if (pose === "tangled") return '<g class="jp-tangle"><path d="M28 120 q70 -40 144 10 M30 150 q70 40 140 -20 M50 96 q50 90 100 40 M150 96 q-60 90 -100 50" fill="none" stroke="#c9a46a" stroke-width="2.4" stroke-linecap="round"/></g>';
  return "";
}

function stage(pose) {
  if (pose === "rockout") return '<text class="jp-shout" x="4" y="22">WOOF!</text>';
  if (pose === "tangled") return '<text class="jp-shout jp-ugh" x="120" y="22">arooo…</text>';
  if (pose === "fish") return '<text class="jp-shout" x="120" y="22">nom!</text>';
  return "";
}

function paw(cx, cy, cls = "") {
  return `<g class="jp-paw ${cls}"><ellipse cx="${cx}" cy="${cy}" rx="12.5" ry="10" class="jp-white"/><path d="M${cx - 5} ${cy + 2} v6 M${cx} ${cy + 3} v6 M${cx + 5} ${cy + 2} v6" class="jp-toe"/></g>`;
}
function leg(cx, side) {
  return `<g class="jp-leg jp-leg-${side}" filter="url(#jp-vol)"><ellipse cx="${cx}" cy="200" rx="26" ry="20" class="jp-fur"/>
    <path d="M${cx + (side === "l" ? -20 : 20)} 190 Q${cx} 178 ${cx + (side === "l" ? 18 : -18)} 186 Q${cx + (side === "l" ? 4 : -4)} 196 ${cx + (side === "l" ? -20 : 20)} 190 Z" class="jp-black"/>
    <ellipse cx="${cx + (side === "l" ? 6 : -6)}" cy="212" rx="14" ry="8" class="jp-white"/>
    <path d="M${cx + (side === "l" ? 0 : -12)} 214 v5 M${cx + (side === "l" ? 6 : -6)} 215 v5 M${cx + (side === "l" ? 12 : 0)} 214 v5" class="jp-toe"/></g>`;
}
function arm(side) {
  const x = side === "l" ? 46 : 132;
  return `<g class="jp-arm jp-arm-${side}" filter="url(#jp-vol)"><path d="M${x + 2} 138 Q${x + 11} 130 ${x + 20} 138 L${x + 21} 180 Q${x + 11} 188 ${x + 1} 180 Z" class="jp-white"/>
    <path d="M${x + 2} 138 Q${x + 11} 130 ${x + 20} 138 L${x + 20.5} 152 Q${x + 11} 158 ${x + 1.5} 152 Z" class="jp-fur"/>
    <path d="M${x + (side === "l" ? 2 : 20)} 146 q${side === "l" ? -6 : 6} 10 0 20" class="jp-feather"/></g>`;
}

// The pup on his own, in a 200 x 230 box (used for avatars and tricks).
function pup(pose) {
  const guitar = !NO_GUITAR.has(pose);
  const bone = pose === "bonejam";
  return `<g class="jp-all"><ellipse cx="100" cy="220" rx="62" ry="7" class="jp-shadow"/><g class="jp-live" filter="url(#jp-fur)">
      <path class="jp-tail" d="M146 196 Q182 192 180 156 Q178 140 168 138" fill="none" stroke-linecap="round"/>
      <path class="jp-tail-tip" d="M181 158 Q180 144 170 140" fill="none" stroke-linecap="round"/>
      ${leg(66, "l")}${leg(134, "r")}
      <g class="jp-body" filter="url(#jp-vol)">
        <path d="M60 142 C52 170 56 200 70 214 L130 214 C144 200 148 170 140 142 Q100 128 60 142 Z" class="jp-fur"/>
        <path d="M60 142 C52 160 54 184 62 202 Q70 176 80 148 Z M140 142 C148 160 146 184 138 202 Q130 176 120 148 Z" class="jp-black"/>
        <path d="M76 144 C70 168 78 196 100 206 C122 196 130 168 124 144 Q100 136 76 144 Z" class="jp-white"/>
        <path d="M84 150 l4 8 4 -8 4 8 4 -8 4 8 4 -8 4 8" class="jp-fluff"/>
        <ellipse cx="100" cy="140" rx="36" ry="8" class="jp-ao"/>
      </g>
      ${arm("l")}${arm("r")}
      <g class="jp-bandana"><path d="M64 136 Q100 154 136 136 L100 176 Z"/><path d="M66 138 Q100 154 134 138" fill="none" stroke="#b8343a" stroke-width="2"/><circle cx="100" cy="160" r="2.2" fill="#fff"/><circle cx="90" cy="149" r="1.8" fill="#fff"/><circle cx="110" cy="149" r="1.8" fill="#fff"/></g>
      <g class="jp-head" filter="url(#jp-vol)">
        <path d="M52 90 C52 56 74 40 100 40 C126 40 148 56 148 90 C148 110 138 124 122 130 Q100 136 78 130 C62 124 52 110 52 90 Z" class="jp-fur"/>
        <path d="M100 46 C96 56 93 70 91 88 L109 88 C107 70 104 56 100 46 Z" class="jp-white"/>
        <path d="M60 64 C66 52 80 44 96 42" class="jp-rim"/>
        <path d="M56 78 l-3 3 M54 88 l-3 3 M144 78 l3 3 M146 88 l3 3 M80 50 l-1 -4 M88 46 l0 -4 M112 46 l0 -4 M120 50 l1 -4" class="jp-strands"/>
        ${eyes(pose)}
        <path d="M74 108 C74 91 85 83 100 83 C115 83 126 91 126 108 C126 125 115 135 100 135 C85 135 74 125 74 108 Z" class="jp-white"/>
        <path d="M74 104 C76 92 82 86 90 85 Q84 98 86 112 Z M126 104 C124 92 118 86 110 85 Q116 98 114 112 Z" class="jp-fur" opacity="0.55"/>
        <path d="M80 112 Q100 124 120 112" class="jp-snout-shade"/>
        <g class="jp-whisker-dots"><circle cx="88" cy="110" r="0.9"/><circle cx="85" cy="114" r="0.9"/><circle cx="112" cy="110" r="0.9"/><circle cx="115" cy="114" r="0.9"/></g>
        <path d="M89 98 Q100 90 111 98 Q110 108 100 111 Q90 108 89 98 Z" class="jp-nose"/>
        <ellipse cx="95" cy="101" rx="2.2" ry="1.4" fill="#000" opacity="0.6"/><ellipse cx="105" cy="101" rx="2.2" ry="1.4" fill="#000" opacity="0.6"/>
        <path d="M93 95 Q99 92 104 94" stroke="#fff" stroke-width="1.6" opacity="0.5" fill="none" stroke-linecap="round"/>
        ${bone ? '<g class="jp-bone-mouth"><rect x="70" y="118" width="60" height="11" rx="5" fill="#fff6e8" stroke="#b89a6e" stroke-width="2"/><circle cx="70" cy="118" r="6" fill="#fff6e8" stroke="#b89a6e" stroke-width="2"/><circle cx="70" cy="129" r="6" fill="#fff6e8" stroke="#b89a6e" stroke-width="2"/><circle cx="130" cy="118" r="6" fill="#fff6e8" stroke="#b89a6e" stroke-width="2"/><circle cx="130" cy="129" r="6" fill="#fff6e8" stroke="#b89a6e" stroke-width="2"/></g>' : mouth(pose)}
        <g class="jp-ear jp-ear-l" filter="url(#jp-vol)"><path d="M62 62 C44 60 30 82 30 112 C30 136 42 150 56 146 C66 142 70 118 70 92 C70 78 68 68 62 62 Z" class="jp-ear-fur"/><path d="M44 90 q-2 16 2 30 M52 82 q-2 20 0 40" class="jp-ear-lines"/></g>
        <g class="jp-ear jp-ear-r" filter="url(#jp-vol)"><path d="M138 62 C156 60 170 82 170 112 C170 136 158 150 144 146 C134 142 130 118 130 92 C130 78 132 68 138 62 Z" class="jp-ear-fur"/><path d="M156 90 q2 16 -2 30 M148 82 q2 20 0 40" class="jp-ear-lines"/></g>
      </g>
      ${guitar ? GUITAR + paw(92, 176, "jp-strum-paw") + paw(130, 136, "jp-fret-paw") : ""}
    </g>
    ${props(pose)}</g>`;
}

// A red pickup truck, side view facing left, in a 400 x 240 scene. Drawn
// with real proportions: long hood, cab, a bed the pup sits in, panel lines,
// glass reflections, chrome, and tyres with spoked rims. jp-vol lights it.
function wheel(cx) {
  const spokes = [0, 72, 144, 216, 288].map((a) => `<path d="M${cx} 196 L${cx} 182" transform="rotate(${a} ${cx} 196)" class="jp-spoke"/>`).join("");
  return `<g class="jp-wheel">
    <circle cx="${cx}" cy="196" r="27" fill="url(#jp-gr-tyre)"/>
    <circle cx="${cx}" cy="196" r="24" fill="none" stroke="#2c2c33" stroke-width="2" stroke-dasharray="3 2.4"/>
    <circle cx="${cx}" cy="196" r="17" fill="url(#jp-gr-rim)"/>
    <g class="jp-spokes" style="transform-origin:${cx}px 196px">${spokes}<circle cx="${cx}" cy="196" r="5" fill="url(#jp-gr-chrome)" stroke="#6b7480" stroke-width="1"/></g>
    <circle cx="${cx}" cy="196" r="17" fill="none" stroke="#5d6670" stroke-width="1.4"/>
    <path d="M${cx - 12} ${196 - 8} A14 14 0 0 1 ${cx + 4} ${196 - 14}" stroke="#fff" stroke-width="2" opacity="0.55" fill="none" stroke-linecap="round"/>
  </g>`;
}
const BODY = "M18 178 L18 150 Q19 137 34 133 L116 122 L146 86 Q149 81 155 81 L205 81 Q211 81 211 87 L211 124 L318 124 Q323 124 323 129 L323 177 Q323 182 318 182 L285 182 A34 34 0 0 0 215 182 L115 182 A34 34 0 0 0 45 182 L23 182 Q18 182 18 178 Z";
function truck(drive) {
  return `<g class="jp-truck${drive ? " jp-driving" : ""}">
      <ellipse cx="170" cy="223" rx="160" ry="6" fill="#2a1d10" opacity="0.18"/>
      <g filter="url(#jp-vol-big)"><path d="${BODY}" class="jp-paint"/></g>
      <path d="M115 182 A34 34 0 0 0 45 182 Z M285 182 A34 34 0 0 0 215 182 Z" fill="#26090b" opacity="0.88"/>
      <path d="M45 182 A34 34 0 0 1 115 182 M215 182 A34 34 0 0 1 285 182" fill="none" stroke="#8f1f25" stroke-width="5"/>
      <path d="M22 168 H318" stroke="#9e2a2f" stroke-width="1.4" opacity="0.7"/>
      <path d="M26 150 Q120 142 320 146" stroke="#fff" stroke-width="2.4" opacity="0.28" fill="none" stroke-linecap="round"/>
      <path d="M118 124 V178 M211 124 V178 M211 124 H323" stroke="#9e2a2f" stroke-width="1.3" fill="none"/>
      <rect x="211" y="121" width="112" height="6" rx="2" fill="#c43a40"/><rect x="211" y="121" width="112" height="2" rx="1" fill="#ff8b8f" opacity="0.6"/>
      <path d="M318 130 V174" stroke="#9e2a2f" stroke-width="1.2"/>
      <path d="${WINDOW}" class="jp-window"/>
      <path d="M182 89 L203 89 Q205 89 205 91 L205 120 L182 120 Z" class="jp-window"/>
      <path d="M134 116 L156 90 L164 90 L142 116 Z M186 116 L200 92 L203 92 L190 116 Z" fill="#fff" opacity="0.45"/>
      <path d="M124 120 L150 89 L178 89 L178 120 Z M182 89 L203 89 Q205 89 205 91 L205 120 L182 120 Z" fill="none" stroke="#2c2c33" stroke-width="2.2"/>
      <rect x="142" y="104" width="9" height="11" rx="2.5" fill="url(#jp-gr-chrome)" stroke="#6b7480" stroke-width="0.8"/>
      <rect x="190" y="131" width="14" height="3.6" rx="1.8" fill="url(#jp-gr-chrome)"/>
      <ellipse cx="25" cy="144" rx="6" ry="7" fill="url(#jp-gr-lamp)" stroke="#9aa3ad" stroke-width="1.4"/>
      <rect x="12" y="152" width="10" height="16" rx="2" fill="#2c2c33"/><path d="M13 156 h8 M13 160 h8 M13 164 h8" stroke="#9aa3ad" stroke-width="1.2"/>
      <rect x="6" y="170" width="34" height="11" rx="5" fill="url(#jp-gr-chrome)" stroke="#7d8894" stroke-width="0.8"/>
      <rect x="306" y="170" width="24" height="11" rx="5" fill="url(#jp-gr-chrome)" stroke="#7d8894" stroke-width="0.8"/>
      <rect x="319" y="132" width="5" height="14" rx="1.5" fill="#ff3b3b"/><rect x="319" y="132" width="5" height="4" rx="1.5" fill="#ffb0a0"/>
      ${wheel(80)}${wheel(250)}
      <g class="jp-puffs"><circle cx="336" cy="176" r="6"/><circle cx="350" cy="168" r="8"/><circle cx="366" cy="162" r="10"/></g>
    </g>`;
}

const WINDOW = "M124 120 L150 89 L178 89 L178 120 Z";
// The bed's side, drawn again after the pup so he sits inside the bed.
const BED_FRONT = `<g filter="url(#jp-vol-big)"><path d="M211 127 L323 127 L323 177 Q323 182 318 182 L285 182 A34 34 0 0 0 215 182 L211 182 Z" class="jp-paint"/></g>
  <path d="M215 182 A34 34 0 0 1 285 182" fill="none" stroke="#8f1f25" stroke-width="5"/><path d="M285 182 A34 34 0 0 0 215 182 Z" fill="#26090b" opacity="0.88"/>
  <path d="M212 168 H322" stroke="#9e2a2f" stroke-width="1.4" opacity="0.7"/><path d="M214 146 H320" stroke="#fff" stroke-width="2.4" opacity="0.28"/>
  <rect x="211" y="121" width="112" height="6" rx="2" fill="#c43a40"/><rect x="211" y="121" width="112" height="2" rx="1" fill="#ff8b8f" opacity="0.6"/>
  <path d="M318 130 V174" stroke="#9e2a2f" stroke-width="1.2"/>
  <rect x="319" y="132" width="5" height="14" rx="1.5" fill="#ff3b3b"/><rect x="319" y="132" width="5" height="4" rx="1.5" fill="#ffb0a0"/>
  <rect x="306" y="170" width="24" height="11" rx="5" fill="url(#jp-gr-chrome)" stroke="#7d8894" stroke-width="0.8"/>${wheel(250)}`;

const DEFS = `<defs>
  <radialGradient id="jp-gr-fur" cx="35%" cy="25%" r="85%"><stop offset="0" stop-color="#e2a766"/><stop offset="0.5" stop-color="#c47f3c"/><stop offset="0.9" stop-color="#94561f"/><stop offset="1" stop-color="#6e3d14"/></radialGradient>
  <radialGradient id="jp-gr-white" cx="35%" cy="25%" r="90%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.65" stop-color="#f4eee6"/><stop offset="1" stop-color="#d3c7b6"/></radialGradient>
  <radialGradient id="jp-gr-black" cx="35%" cy="25%" r="90%"><stop offset="0" stop-color="#4c443e"/><stop offset="0.6" stop-color="#26201c"/><stop offset="1" stop-color="#110d0a"/></radialGradient>
  <radialGradient id="jp-gr-ear" cx="40%" cy="15%" r="90%"><stop offset="0" stop-color="#c47f3c"/><stop offset="0.6" stop-color="#8f531d"/><stop offset="1" stop-color="#5c3110"/></radialGradient>
  <radialGradient id="jp-gr-cream" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f6e3c6"/></radialGradient>
  <radialGradient id="jp-gr-iris" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#b9783c"/><stop offset="0.6" stop-color="#6b3a16"/><stop offset="1" stop-color="#3a1d08"/></radialGradient>
  <radialGradient id="jp-gr-snout" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="#fbe2b8"/><stop offset="1" stop-color="#e2b27a"/></radialGradient>
  <radialGradient id="jp-gr-ao" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#4a2a10" stop-opacity="0.3"/><stop offset="1" stop-color="#4a2a10" stop-opacity="0"/></radialGradient>
  <filter id="jp-fur" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.2" xChannelSelector="R" yChannelSelector="G"/></filter>
  <linearGradient id="jp-gr-chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#b9c2cc"/><stop offset="1" stop-color="#7d8894"/></linearGradient>
  <filter id="jp-vol" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur in="SourceAlpha" stdDeviation="7" result="b"/>
    <feDiffuseLighting in="b" surfaceScale="5" diffuseConstant="1.15" lighting-color="#fff" result="d"><feDistantLight azimuth="235" elevation="50"/></feDiffuseLighting>
    <feSpecularLighting in="b" surfaceScale="5" specularConstant="0.55" specularExponent="22" lighting-color="#fff" result="sp"><feDistantLight azimuth="235" elevation="50"/></feSpecularLighting>
    <feComposite in="sp" in2="SourceAlpha" operator="in" result="sp2"/><feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1.15" k2="0" k3="0" k4="0" result="lit"/>
    <feComposite in="lit" in2="SourceAlpha" operator="in" result="lit2"/><feComposite in="lit2" in2="sp2" operator="arithmetic" k1="0" k2="1" k3="0.45" k4="0"/></filter>
  <filter id="jp-vol-big" x="-5%" y="-10%" width="110%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="5" result="b"/>
    <feDiffuseLighting in="b" surfaceScale="4" diffuseConstant="1" lighting-color="#fff" result="d"><feDistantLight azimuth="235" elevation="42"/></feDiffuseLighting>
    <feSpecularLighting in="b" surfaceScale="4" specularConstant="0.5" specularExponent="40" lighting-color="#fff" result="sp"><feDistantLight azimuth="235" elevation="42"/></feSpecularLighting>
    <feComposite in="sp" in2="SourceAlpha" operator="in" result="sp2"/><feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="lit"/>
    <feComposite in="lit" in2="SourceAlpha" operator="in" result="lit2"/><feComposite in="lit2" in2="sp2" operator="arithmetic" k1="0" k2="1" k3="0.35" k4="0"/></filter>
  <radialGradient id="jp-gr-tyre" cx="50%" cy="50%" r="50%"><stop offset="0.6" stop-color="#2a2a30"/><stop offset="0.9" stop-color="#18181c"/><stop offset="1" stop-color="#3a3a42"/></radialGradient>
  <radialGradient id="jp-gr-rim" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f4f6f8"/><stop offset="0.6" stop-color="#aeb6c0"/><stop offset="1" stop-color="#6b7480"/></radialGradient>
  <radialGradient id="jp-gr-lamp" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#fff2b8"/><stop offset="1" stop-color="#e8c25a"/></radialGradient>
  <linearGradient id="jp-gr-fir" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fae6c"/><stop offset="1" stop-color="#2a6b40"/></linearGradient>
  <linearGradient id="jp-gr-paint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.6" stop-color="#e5484d"/><stop offset="1" stop-color="#b8343a"/></linearGradient>
  <linearGradient id="jp-gr-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6f6fd"/><stop offset="1" stop-color="#9fd4ee"/></linearGradient>
  <linearGradient id="jp-gr-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f5"/><stop offset="1" stop-color="#4a9bc9"/></linearGradient>
</defs>`;

// A real fir tree lying in the bed, tied down with rope.
const XMAS_TREE = `<g class="jp-xtree" filter="url(#jp-vol-big)">
  <path d="M222 122 L232 96 L240 108 L252 78 L262 100 L274 66 L286 98 L298 82 L306 106 L316 94 L318 122 Z" fill="url(#jp-gr-fir)"/>
  <path d="M236 110 l6 -10 M250 102 l8 -14 M266 96 l8 -16 M284 98 l6 -12 M300 106 l6 -10" stroke="#2d7246" stroke-width="2" fill="none"/>
  <path d="M244 116 l4 -8 M262 112 l6 -12 M280 112 l6 -10 M296 116 l4 -8" stroke="#6cc58a" stroke-width="1.6" fill="none" opacity="0.8"/>
  <rect x="316" y="106" width="16" height="7" rx="2" fill="#7d4a27"/>
</g><path d="M236 124 Q250 84 262 70 M290 124 Q284 90 280 76" stroke="#d9b98a" stroke-width="2.2" fill="none"/>`;

function scene(pose) {
  if (pose === "xmas") {
    // Driving home with a Christmas tree tied in the back.
    return `<defs><clipPath id="jp-win"><path d="${WINDOW}"/></clipPath></defs>
      <path d="M0 230 H400" class="jp-dash"/>
      <g class="jp-xmas-ride">${truck(true).replace('<g class="jp-wheel">', XMAS_TREE + '<g class="jp-wheel">')}
      <g clip-path="url(#jp-win)"><g class="jp-actor jp-at-wheel">${pup("drive")}</g></g></g>
      <g class="jp-snow"><circle cx="40" cy="20" r="3"/><circle cx="120" cy="10" r="2.5"/><circle cx="220" cy="24" r="3"/><circle cx="320" cy="8" r="2.5"/><circle cx="370" cy="30" r="3"/><circle cx="80" cy="40" r="2"/></g>`;
  }
  if (pose === "water") {
    // Hopping back and forth over a little stream.
    return `<path d="M0 222 H150 M250 222 H400" class="jp-grass"/>
      <path d="M150 222 Q200 206 250 222 L250 240 L150 240 Z" fill="url(#jp-gr-water)"/>
      <path class="jp-ripple" d="M168 230 q8 -4 16 0 M206 234 q8 -4 16 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
      <g class="jp-splash"><circle cx="196" cy="214" r="3"/><circle cx="206" cy="206" r="2.5"/><circle cx="186" cy="208" r="2"/></g>
      <g class="jp-actor jp-hopper"><g class="jp-inner">${pup("jump")}</g></g>`;
  }
  if (pose === "rain") {
    // A rain shower: he shakes his fur out and splashes in a puddle.
    const drops = Array.from({ length: 22 }, (_, i) => `<path d="M${(i * 37) % 400} ${(i * 53) % 120} l-4 12" class="jp-drop" style="animation-delay:${((i * 0.13) % 1).toFixed(2)}s"/>`).join("");
    return `<g class="jp-cloud"><ellipse cx="120" cy="22" rx="60" ry="20"/><ellipse cx="170" cy="14" rx="44" ry="18"/><ellipse cx="290" cy="22" rx="58" ry="18"/></g>
      <g class="jp-rain">${drops}</g>
      <ellipse cx="200" cy="228" rx="110" ry="9" fill="url(#jp-gr-water)" opacity="0.7"/>
      <g class="jp-actor jp-shaker"><g class="jp-inner">${pup("cheer")}</g></g>
      <g class="jp-flick"><circle cx="150" cy="140" r="3"/><circle cx="250" cy="130" r="3"/><circle cx="140" cy="100" r="2.5"/><circle cx="262" cy="96" r="2.5"/><circle cx="200" cy="70" r="2.5"/></g>`;
  }
  if (pose === "bonejam") {
    // A bone in his mouth and still strumming away.
    return `<path d="M0 230 H400" class="jp-road"/>
      <g class="jp-actor jp-center"><g class="jp-inner">${pup("bonejam")}</g></g>
      <g class="jp-notes jp-notes-play"><text x="110" y="90">♪</text><text x="280" y="70">♫</text><text x="300" y="150">♪</text></g>`;
  }
  if (pose === "drive") {
    // At the wheel: only his head shows through the cab window.
    return `<defs><clipPath id="jp-win"><path d="${WINDOW}"/></clipPath></defs>
      <path d="M0 230 H400" class="jp-dash"/>
      ${truck(true)}
      <g clip-path="url(#jp-win)"><g class="jp-actor jp-at-wheel">${pup("drive")}</g></g>`;
  }
  const show = pose === "show";
  return `<path d="M0 230 H400" class="jp-dash"/>
    ${show ? '<g class="jp-show-ball"><circle cx="352" cy="210" r="11" fill="#c9e04a"/><path d="M342 206 q10 6 20 -1" fill="none" stroke="#fff" stroke-width="2"/></g>' : ""}
    ${truck(false)}
    <g class="jp-actor"><g class="jp-inner">${pup("play")}</g></g>
    ${BED_FRONT}
    ${show ? '<g class="jp-show-sparkles jp-sparkles"><path d="M300 70l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M384 108l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g>' : ""}`;
}

function puppySvg(pose = "idle", { label = "Jaxx the puppy" } = {}) {
  if (!POSES.includes(pose)) pose = "idle";
  if (TRUCK.has(pose)) {
    return `<svg class="jp-puppy jp-scene jp-${pose}" viewBox="0 0 400 240" role="img" aria-label="${label}">${DEFS}${scene(pose)}</svg>`;
  }
  return `<svg class="jp-puppy jp-${pose}" viewBox="0 -10 200 230" role="img" aria-label="${label}">${DEFS}${pup(pose)}${stage(pose)}</svg>`;
}

// One scene per card: the hop-out show most of the time, a special one now and then.
const SCENE_ORDER = ["show", "bonejam", "xmas", "show", "water", "rain", "show", "drive"];
let sceneTurn = Math.floor(Math.random() * SCENE_ORDER.length);
function nextPuppyScene() {
  return SCENE_ORDER[sceneTurn++ % SCENE_ORDER.length];
}

export { puppySvg, POSES, nextTrick, nextPuppyScene };
