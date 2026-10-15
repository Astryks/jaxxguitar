// Small app settings, kept on this device.
//   Left-handed: every fretboard and chord box is drawn mirrored, the way
//   a left-handed player sees their own guitar (nut on the right).

const LEFTY_KEY = "jg_lefty";

function isLefty() {
  try { return localStorage.getItem(LEFTY_KEY) === "1"; } catch (e) { return false; }
}

function setLefty(on) {
  try { localStorage.setItem(LEFTY_KEY, on ? "1" : "0"); } catch (e) { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent("jg-settings"));
}

// A switch for the left-handed setting. Wire it with wireLeftyToggle(root).
function leftyToggleHtml() {
  return `<label class="jg-switch"><input type="checkbox" class="jg-lefty-toggle" ${isLefty() ? "checked" : ""}><span>Left-handed fretboard (mirrored)</span></label>`;
}
function wireLeftyToggle(root, onChange) {
  root.querySelectorAll(".jg-lefty-toggle").forEach((box) => box.addEventListener("change", () => {
    setLefty(box.checked);
    onChange?.(box.checked);
  }));
}

// The "↔ Left-handed? Flip it" button, used on every screen with a guitar.
function flipButtonHtml() {
  return `<button class="jg-flip-btn" type="button">↔ ${isLefty() ? "Left-handed view (tap for right-handed)" : "Left-handed? Flip it"}</button>`;
}
function wireFlip(root, rerender) {
  root.querySelectorAll(".jg-flip-btn").forEach((b) => b.addEventListener("click", () => { setLefty(!isLefty()); rerender(); }));
}

export { isLefty, setLefty, leftyToggleHtml, wireLeftyToggle, flipButtonHtml, wireFlip };
