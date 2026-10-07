// The thank-you moment after a tip: Jaxx sits on his rug with his little
// acoustic guitar, strums once, the sound hole glows and a warm heart
// floats out of it; his ears lift and his tail wags. Bigger tips add
// floating notes (Bravo), then a spotlight, a bow with a paw on his chest
// and a gentle fall of notes and stars (Encore).
//
// showThanks(tier): tier is "small" | "medium" | "large". Opens a centred
// card over a dimmed backdrop; tap anywhere or "×" to close, closes by
// itself after about 7 seconds. Reduced motion gets the finished picture
// without movement. A soft three-note chime plays if audio is unlocked.
// Never throws.
import { puppySvg } from "./puppy.js";
import { getAudioContext, playNote } from "./guitar-audio.js";

const TIERS = ["small", "medium", "large"];
const SUBLINE = {
  small: "You made my tail wag.",
  medium: "Bravo to you!",
  large: "Encore! You are a star.",
};

const HEART_D = "M0 -12 C-4 -22 -16 -25 -23 -18 C-30 -11 -27 0 -19 7 L0 23 L19 7 C27 0 30 -11 23 -18 C16 -25 4 -22 0 -12 Z";

// Jaxx himself, from puppy.js (the strumming pose), with a glow added
// inside the sound hole, under his strumming paw.
function jaxx() {
  const svg = puppySvg("play", { label: "" });
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const glow = `<g class="jg-ty-hole"><circle cx="90" cy="178" r="13" class="jg-ty-hole-halo"/><circle cx="90" cy="178" r="6.6" fill="url(#jg-ty-hole-gr)"/></g>`;
  return inner.replace('<g class="jp-paw jp-strum-paw">', `${glow}<g class="jp-paw jp-strum-paw">`);
}

function sceneSvg(tier) {
  const notes = tier !== "small" ? `<g class="jg-ty-notes"><text x="44" y="150">♪</text><text x="236" y="120">♫</text><text x="30" y="96">♫</text><text x="250" y="190">♪</text></g>` : "";
  const spot = tier === "large" ? `<g class="jg-ty-spot"><path d="M126 -10 L174 -10 L268 250 Q150 272 32 250 Z" fill="url(#jg-ty-beam)"/><ellipse cx="150" cy="246" rx="120" ry="20" fill="url(#jg-ty-pool)"/></g>` : "";
  const sparkles = `<g class="jg-ty-sparkles"><path d="M70 50 l2.2 5.4 5.4 2.2 -5.4 2.2 -2.2 5.4 -2.2 -5.4 -5.4 -2.2 5.4 -2.2 z"/><path d="M226 40 l1.8 4.4 4.4 1.8 -4.4 1.8 -1.8 4.4 -1.8 -4.4 -4.4 -1.8 4.4 -1.8 z"/><path d="M240 92 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4 z"/></g>`;
  return `<svg class="jp-puppy jg-ty-svg" viewBox="15 18 270 243" role="img" aria-label="Jaxx strums his guitar and a warm heart floats out of the sound hole">
    <defs>
      <radialGradient id="jg-ty-hole-gr" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.55" stop-color="#ffd36b"/><stop offset="1" stop-color="#f29a3c"/></radialGradient>
      <radialGradient id="jg-ty-heart-gr" cx="36%" cy="30%" r="80%"><stop offset="0" stop-color="#ffb8c2"/><stop offset="0.45" stop-color="#f0566c"/><stop offset="1" stop-color="#b8243c"/></radialGradient>
      <radialGradient id="jg-ty-rug" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#e9a66b"/><stop offset="0.7" stop-color="#c9773f"/><stop offset="1" stop-color="#9c5629"/></radialGradient>
      <linearGradient id="jg-ty-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3d2" stop-opacity="0.7"/><stop offset="1" stop-color="#fff3d2" stop-opacity="0.08"/></linearGradient>
      <radialGradient id="jg-ty-pool" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff0c4" stop-opacity="0.75"/><stop offset="1" stop-color="#fff0c4" stop-opacity="0"/></radialGradient>
      <filter id="jg-ty-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur in="SourceGraphic" stdDeviation="4"/></filter>
    </defs>
    ${spot}
    <g class="jg-ty-rug"><ellipse cx="150" cy="246" rx="104" ry="17" fill="url(#jg-ty-rug)"/><ellipse cx="150" cy="246" rx="94" ry="13" fill="none" stroke="#f6d3a4" stroke-width="1.6" stroke-dasharray="3 3" opacity="0.8"/><ellipse cx="150" cy="243" rx="70" ry="7" fill="#fff" opacity="0.12"/></g>
    <g style="transform-box:view-box" transform="translate(60 42) scale(0.9)">
      <g class="jg-ty-bow">${jaxx()}</g>
      <g style="transform-box:view-box" transform="translate(100 14)"><g class="jg-ty-heart"><g class="jg-ty-heart-in">
        <path d="${HEART_D}" class="jg-ty-heart-glow" style="transform-box:view-box" transform="scale(1.35)"/>
        <path d="${HEART_D}" fill="url(#jg-ty-heart-gr)" stroke="#a8203a" stroke-width="0.8"/>
        <path d="M-16 -14 C-12 -19 -7 -19 -4 -15" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>
      </g></g></g>
    </g>
    ${notes}${sparkles}
  </svg>`;
}

// A soft, warm three-note rising chime, plucked on Jaxx's own guitar
// sound. Quietly does nothing if the audio engine is not unlocked yet.
function chime() {
  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== "running") return;
    [67, 71, 76].forEach((m, i) => playNote(m, { delay: i * 0.16, duration: i === 2 ? 2 : 1.2, gain: 0.2 }));
  } catch (e) { /* no sound is fine */ }
}

function confettiHtml() {
  const glyphs = ["♪", "★", "♫", "✦", "♩", "★"];
  const colors = ["#f5c542", "#f0566c", "#2f8f83", "#f0a35e", "#ffffff"];
  return Array.from({ length: 30 }, (_, i) => {
    const left = (i * 37 + 11) % 100, dur = 3.4 + ((i * 7) % 10) / 6, delay = ((i * 13) % 20) / 10;
    return `<span style="left:${left}%;color:${colors[i % colors.length]};font-size:${12 + ((i * 5) % 12)}px;animation-duration:${dur.toFixed(2)}s,${(1.2 + (i % 4) * 0.3).toFixed(2)}s;animation-delay:calc(var(--jg-ty-d) + ${(1.6 + delay).toFixed(2)}s),0s">${glyphs[i % glyphs.length]}</span>`;
  }).join("");
}

let current = null;

function closeThanks() {
  const el = current;
  if (!el) return;
  current = null;
  clearTimeout(el._timer);
  document.removeEventListener("keydown", el._onKey, true);
  el.classList.add("jg-ty-out");
  setTimeout(() => { try { el.remove(); } catch (e) { /* gone */ } }, 320);
  try { el._returnFocus?.focus?.({ preventScroll: true }); } catch (e) { /* ignore */ }
}

function showThanks(tier = "small") {
  try {
    if (!TIERS.includes(tier)) tier = "small";
    if (current) { current.remove(); current = null; }
    const el = document.createElement("div");
    el.className = `jg-ty jg-ty-${tier}`;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Thank you");
    el.innerHTML = `<div class="jg-ty-card">
        <button class="jg-ty-x" type="button" aria-label="Close">×</button>
        <div class="jg-ty-stage">${sceneSvg(tier)}</div>
        <p class="jg-ty-cap">Thank you, from Jaxx ♥</p>
        <p class="jg-ty-sub">${SUBLINE[tier]}</p>
      </div>${tier === "large" ? `<div class="jg-ty-confetti" aria-hidden="true">${confettiHtml()}</div>` : ""}`;
    el._returnFocus = document.activeElement;
    el.addEventListener("click", closeThanks);
    el._onKey = (e) => { if (e.key === "Escape") closeThanks(); };
    document.addEventListener("keydown", el._onKey, true);
    document.body.appendChild(el);
    current = el;
    el.querySelector(".jg-ty-x")?.focus({ preventScroll: true });
    el._timer = setTimeout(closeThanks, tier === "large" ? 8000 : 7000);
    chime();
  } catch (e) {
    try { console.warn("Jaxx Guitar: thank-you card could not open.", e); } catch (_) { /* ignore */ }
  }
}

export { showThanks, closeThanks };
