// Small app settings, kept on this device.
//   Left-handed: every fretboard and chord box is drawn mirrored, the way
//   a left-handed player sees their own guitar (nut on the right).
//
// Right-handed is the default everywhere (owner, 2026-10-18). Two ways to
// see the mirrored view:
//   - the "Left-handed fretboard (mirrored)" switch in About & settings
//     (remembered on this device: for real left-handed players), and
//   - the "↔ Left-handed? Flip it" button on screens with a guitar, which
//     only flips the view for this visit (sessionStorage), so one curious
//     tap can no longer leave the whole course mirrored.

const LEFTY_KEY = "jg_lefty";            // the settings switch ("1" = on)
const SESSION_KEY = "jg_lefty_session";  // this visit's flip ("1" / "0"), wins over the switch
const MIGRATION_KEY = "jg_lefty_reset_v1";

// One-time reset (build 32): the old Flip button saved "left-handed" for
// good, so people who tapped it once saw every fretboard mirrored. Put
// everyone back on right-handed once; the settings switch turns it on again.
try {
  if (localStorage.getItem(MIGRATION_KEY) !== "1") {
    localStorage.setItem(LEFTY_KEY, "0");
    localStorage.setItem(MIGRATION_KEY, "1");
  }
} catch (e) { /* storage unavailable */ }

function leftySetting() {
  try { return localStorage.getItem(LEFTY_KEY) === "1"; } catch (e) { return false; }
}
function sessionFlip() {
  try { const v = sessionStorage.getItem(SESSION_KEY); return v === "1" ? true : v === "0" ? false : null; } catch (e) { return null; }
}

// Mirrored view? This visit's flip if there is one, otherwise the setting.
function isLefty() {
  const s = sessionFlip();
  return s === null ? leftySetting() : s;
}

// The permanent setting (About & settings). Clears any flip for this visit.
function setLefty(on) {
  try { localStorage.setItem(LEFTY_KEY, on ? "1" : "0"); sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent("jg-settings"));
}

// Flip the view for this visit only (the per-screen button).
function flipForSession() {
  const on = !isLefty();
  try {
    if (on === leftySetting()) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, on ? "1" : "0");
  } catch (e) { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent("jg-settings"));
}

// A switch for the left-handed setting. Wire it with wireLeftyToggle(root).
function leftyToggleHtml() {
  return `<label class="jg-switch"><input type="checkbox" class="jg-lefty-toggle" ${leftySetting() ? "checked" : ""}><span>Left-handed (mirrored) fretboard</span></label>`;
}
function wireLeftyToggle(root, onChange) {
  root.querySelectorAll(".jg-lefty-toggle").forEach((box) => box.addEventListener("change", () => {
    setLefty(box.checked);
    onChange?.(box.checked);
  }));
}

// The "↔ Left-handed? Flip it" button, used on every screen with a guitar.
// It flips the view for this visit only; the lasting switch is in About.
function flipButtonHtml() {
  return isLefty()
    ? `<button class="jg-flip-btn jg-flip-on" type="button">↔ Left-handed view · tap for right-handed</button>`
    : `<button class="jg-flip-btn" type="button">↔ Left-handed? Flip it</button>`;
}

// Which hand does what, for the player's setting. Lesson text writes
// {{fret}} / {{strum}} (and {{Fret}} / {{Strum}} at the start of a
// sentence) for the side of the fretting / strumming hand, and
// {{handed}} for "right-handed" / "left-handed":
//   "Your <b>{{fret}} hand</b> presses the frets" -> left (or right for lefties).
function handSide(role) {
  const fretLeft = !isLefty();
  return role === "fret" ? (fretLeft ? "left" : "right") : (fretLeft ? "right" : "left");
}
function handName(role) { return `${handSide(role)} hand`; }
const cap = (w) => w[0].toUpperCase() + w.slice(1);
function hands(html) {
  if (html == null || typeof html !== "string" || !html.includes("{{")) return html;
  return html
    .replace(/\{\{fret\}\}/g, handSide("fret")).replace(/\{\{Fret\}\}/g, cap(handSide("fret")))
    .replace(/\{\{strum\}\}/g, handSide("strum")).replace(/\{\{Strum\}\}/g, cap(handSide("strum")))
    .replace(/\{\{handed\}\}/g, isLefty() ? "left-handed" : "right-handed");
}

// Left-handed pictures are drawn by mirroring the whole drawing
// (scale(-1 1)); this flips each <text> back about its own x so the words
// read normally, and swaps start/end alignment so labels stay on the same
// side of what they label. Pure SVG attributes (no CSS transform-box),
// which every browser, including the iOS web view, draws the same way.
const START_ANCHORED = /\b(jg-string-name|jg-dg-sname|jg-finger-tag|jg-hs-name|jg-ga-left|jg-tab-sname)\b/;
function mirrorSvgTexts(svg) {
  return svg.replace(/<text\b([^>]*)>/g, (all, attrs) => {
    if (/\btransform=/.test(attrs)) return all;
    const x = Number((attrs.match(/\bx="(-?[\d.]+)"/) || [])[1] || 0);
    const cls = (attrs.match(/\bclass="([^"]*)"/) || [])[1] || "";
    const anchor = START_ANCHORED.test(cls) ? ' style="text-anchor:end"' : "";
    return `<text${attrs} transform="matrix(-1 0 0 1 ${+(2 * x).toFixed(2)} 0)"${anchor}>`;
  });
}
function wireFlip(root, rerender) {
  root.querySelectorAll(".jg-flip-btn").forEach((b) => b.addEventListener("click", () => { flipForSession(); rerender(); }));
}

export { isLefty, setLefty, flipForSession, leftySetting, leftyToggleHtml, wireLeftyToggle, flipButtonHtml, wireFlip, hands, handName, handSide, mirrorSvgTexts };
