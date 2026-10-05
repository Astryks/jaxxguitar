// App Store screenshots for Jaxx Guitar: serve the site on :8766, then
//   node ios/screenshots/shoot.mjs   (needs puppeteer-core + Chrome)
import puppeteer from "puppeteer-core";
const OUT = new URL(".", import.meta.url).pathname;
const DEVICES = [
  { name: "iphone-6.9", width: 956, height: 440, dpr: 3 },
  { name: "iphone-6.5", width: 896, height: 414, dpr: 3 },
  { name: "ipad-13", width: 1376, height: 1032, dpr: 2 },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOTS = [
  ["01-four-chords", `const m = await import("/js/lessons-ui.js"); m.openLesson("lesson-1", 5); document.querySelector(".jg-pb-go").click(); await sleep(2700); document.querySelector(".jg-instrument-host").scrollIntoView({block:"end"});`],
  ["02-chord-diagrams", `const m = await import("/js/lessons-ui.js"); m.openLesson("lesson-1", 0); document.querySelector(".jg-dg-btn").click(); window.scrollTo(0, 120);`],
  ["03-home-quests", `const m = await import("/js/lessons-ui.js"); m.showHome();`],
  ["04-songs-capo", `document.querySelector("[data-tab=songs]").click(); await sleep(300);`],
  ["05-scales", `document.querySelector("[data-tab=practice]").click(); await sleep(200); document.querySelector("[data-sec=scales]").click(); await sleep(300); document.querySelector(".jg-instrument-host").scrollIntoView({block:"end"});`],
  ["06-tuner", `document.querySelector("[data-tab=tuner]").click(); await sleep(300);`],
  ["07-fun-fact", `const m = await import("/js/lessons-ui.js"); m.openLesson("lesson-redspecial", 0); const f = await import("/js/fun-facts.js"); f.showFunFact(f.FACTS[0]);`],
];
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"] });
for (const d of DEVICES) {
  for (const [name, js] of SHOTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: d.width, height: d.height, deviceScaleFactor: d.dpr, isMobile: d.name.startsWith("iphone"), hasTouch: true });
    await page.goto("http://localhost:8766/", { waitUntil: "networkidle0" });
    // A realistic learner: a few lessons in, some XP, a 5-day streak.
    await page.evaluate(() => {
      localStorage.clear();
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      localStorage.setItem("jg_xp", "260");
      localStorage.setItem("jg_streak", JSON.stringify({ count: 5, lastDay: today }));
      localStorage.setItem("jg_quests", JSON.stringify({ date: today, done: { lesson: true } }));
      localStorage.setItem("jg_fun_facts_seen", "[1]");
      const p = {};
      ["p-guitar", "p-parts", "p-howitworks", "lesson-1", "lesson-strum"].forEach((id) => { p[id] = { completed: true }; });
      localStorage.setItem("jg_lesson_progress", JSON.stringify(p));
    });
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(500);
    await page.evaluate(`(async () => { const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); ${js} })()`);
    await sleep(500);
    await page.screenshot({ path: `${OUT}${d.name}-${name}.png` });
    await page.close();
  }
}
await browser.close();
console.log("done");
