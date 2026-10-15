// Little delights (fun-animations): small, quick touches; all skipped under
// prefers-reduced-motion.
//  - Sparkles and little hearts pop when a lesson is completed.
//  - The fretboard strings shimmer when a note or chord rings on it.
//  - Jaxx the beagle (art and animations unchanged): tap him for a happy
//    boop hop and a heart; now and then he tilts his head curiously; he
//    wiggles when you finish a lesson.
const reduce = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function burst(x, y, n, spread = 120) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    const heart = i % 3 === 2;
    s.className = `jg-fx${heart ? " jg-fx-heart" : ""}`;
    s.textContent = heart ? "♥" : i % 2 ? "✧" : "✦";
    s.style.left = `${x}px`; s.style.top = `${y}px`;
    s.style.setProperty("--dx", `${Math.round((Math.random() - 0.5) * spread)}px`);
    s.style.setProperty("--dy", `${-20 - Math.round(Math.random() * spread * 0.6)}px`);
    s.style.animationDelay = `${i * 35}ms`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1000 + i * 35);
  }
}
function play(el, cls, ms) {
  el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}
const visiblePups = () => [...document.querySelectorAll("svg.jp-puppy")].filter((p) => p.getBoundingClientRect().width > 40);

function init() {
  if (reduce()) return;
  window.addEventListener("jg-celebrate", () => {
    burst(window.innerWidth / 2, window.innerHeight * 0.45, 12);
    visiblePups().forEach((p) => play(p, "jg-fx-wiggle", 850));
  });
  document.addEventListener("pointerdown", (e) => {
    const pup = e.target.closest?.("svg.jp-puppy");
    if (pup) { play(pup, "jg-fx-boop", 600); burst(e.clientX, e.clientY - 10, 2, 40); }
    const fb = e.target.closest?.("svg");
    if (fb && fb.querySelector(".jg-string")) play(fb, "jg-fx-ring", 700);
  }, { passive: true });
  // Fretboard notes lit by the app (chord shown/strummed) also shimmer.
  new MutationObserver((muts) => {
    for (const m of muts) {
      const svg = m.target.closest?.("svg");
      if (svg && svg.querySelector(".jg-string") && [...m.addedNodes].some((n) => n.classList?.contains("jg-glow-string"))) { play(svg, "jg-fx-ring", 700); break; }
    }
  }).observe(document.body, { childList: true, subtree: true });
  setInterval(() => {
    if (document.hidden || Math.random() < 0.5) return;
    const p = visiblePups()[0];
    if (p) play(p, "jg-fx-tilt", 950);
  }, 9000);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
