// "Support us" tip jar: optional tips through Apple's In-App Purchase.
// Only inside the iPhone/iPad app (native TipJar plugin); tips unlock
// nothing — Jaxx Guitar stays free for everyone.
import { icon } from "./icons.js";

const TIP_IDS = ["com.jaxxguitar.app.tip.small", "com.jaxxguitar.app.tip.medium", "com.jaxxguitar.app.tip.large"];
const LABELS = { small: "A little thank you", medium: "A big thank you", large: "You're amazing" };

function tipPlugin() {
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  return cap.registerPlugin ? cap.registerPlugin("TipJar") : cap.Plugins?.TipJar;
}

// Renders the tip jar into `el`. Returns false (and renders nothing)
// outside the app, so the website never shows it.
function renderTipJar(el) {
  const plugin = tipPlugin();
  if (!plugin) { el.innerHTML = ""; return false; }
  el.innerHTML = `
    <section class="jg-tipjar">
      <h3>${icon("gift", 28)} Support Jaxx Guitar</h3>
      <p>Jaxx Guitar is free, with no ads and no account. If it's helping you play, you can leave a tip to help us keep making it. Tips don't unlock anything: everything stays free for everyone.</p>
      <div class="jg-tip-list"><span class="jg-tip-status">Loading…</span></div>
      <p class="jg-tip-note">Paid through Apple. Thank you!</p>
    </section>`;
  const list = el.querySelector(".jg-tip-list");
  const note = el.querySelector(".jg-tip-note");
  plugin.getProducts({ ids: TIP_IDS }).then(({ products }) => {
    if (!products?.length) { list.innerHTML = '<span class="jg-tip-status">Tips will be available soon.</span>'; return; }
    list.innerHTML = products.map((p) => `<button class="jg-tip" data-tip="${p.id}"><b>${p.price}</b><span>${LABELS[p.id.split(".").pop()] || p.title}</span></button>`).join("");
    list.querySelectorAll("[data-tip]").forEach((b) => b.addEventListener("click", async () => {
      list.querySelectorAll("button").forEach((x) => (x.disabled = true));
      try {
        const { status } = await plugin.purchase({ id: b.dataset.tip });
        if (status === "success") {
          note.innerHTML = "<b>Thank you so much!</b> Your tip really helps. 🎉";
          window.dispatchEvent(new CustomEvent("jg-celebrate"));
        } else if (status === "pending") {
          note.textContent = "Waiting for approval. Thank you!";
        }
      } catch (e) {
        note.textContent = "That didn't go through: " + (e?.message || "please try again later.");
      } finally {
        list.querySelectorAll("button").forEach((x) => (x.disabled = false));
      }
    }));
  }).catch(() => { list.innerHTML = '<span class="jg-tip-status">Tips aren\'t available right now.</span>'; });
  return true;
}

export { renderTipJar, TIP_IDS };
