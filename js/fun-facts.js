import { puppySvg, nextPuppyScene } from "./puppy.js";
// "Did you know?" - a quirky guitar fact, written for young learners,
// that pops up at random between lessons (about half the time a lesson
// is finished): how a guitar is built, why it rings, and legendary
// players. Each fact is shown once before any repeats. Kept to what's
// well documented.

import { peopleHtml } from "./media.js";

const FACTS = [
  // Always the 2nd fact anyone sees (see nextFact).
  {
    id: "inventor",
    photosFirst: true,
    title: "Who invented the guitar? 🎸",
    people: ["torres", "torres-guitar"],
    text: `Nobody invented the guitar in one go! It grew over <strong>hundreds of years</strong> from older string instruments like the <strong>lute</strong> and Spain's <strong>vihuela</strong>. Early guitars were small, with pairs of strings, and quite quiet.<br><br>
      The guitar you know was shaped by a Spanish carpenter-turned-guitar-maker, <strong>Antonio de Torres</strong>, in the <strong>1850s and 60s</strong>. He made the body <strong>bigger and rounder</strong>, the wooden top <strong>thinner</strong>, and glued a <strong>fan of thin wooden strips</strong> under the top to hold it strong while it wobbles. Result: a much <strong>louder, richer</strong> sound!<br><br>
      To prove the <strong>top</strong> is what really makes the sound, he once built a guitar with its back and sides made of <strong>papier-mâché</strong> (paper and glue)… and it still sounded great! 📄🎶`,
    footnote: "Torres lived from 1817 to 1892. He was born in Almería, Spain, and built his most famous guitars in Seville. Almost every classical guitar today still follows his design.",
  },
  {
    title: "A string by itself is really quiet!",
    text: `Pluck a guitar string and it wiggles back and forth super fast - but a string is so thin it can hardly push any air, so on its own you'd barely hear it. The magic is the <strong>wooden body</strong>. The string's wiggle travels through the <strong>bridge</strong> into the thin wooden <strong>top</strong> of the guitar, which wobbles like a <strong>trampoline</strong> or a speaker - and pushes LOTS of air. That's the sound!`,
  },
  {
    title: "Why is there a hole in the middle?",
    text: `The air inside an acoustic guitar is part of the instrument too! When the top wobbles, the air inside gets squeezed and puffs <strong>in and out of the sound hole</strong> - just like when you blow across the top of a bottle and it goes <em>hoooo</em>. That bouncing air makes the low notes big and warm.`,
    footnote: "Scientists call it a Helmholtz resonance, after the German scientist who studied it.",
  },
  {
    title: "How fast does a string wiggle?",
    text: `The thick low E string wiggles about <strong>82 times every second</strong>. The thin high e string? About <strong>330 times a second</strong> - four times faster! Pressing a fret makes the wiggly part of the string shorter, and shorter strings wiggle faster, so the note goes higher.`,
  },
  {
    title: "Halfway = the same note, only higher",
    text: `Find the <strong>12th fret</strong> (the two dots). It's exactly <strong>halfway</strong> along the string! Halve the string and it wiggles twice as fast, which sounds like the same note, just higher - musicians call that an <strong>octave</strong>. And notice the frets get closer together as you go up? Each one sits about one-eighteenth of the way along the string that's left.`,
  },
  {
    title: "Guitar makers have a cool name",
    text: `A person who builds guitars is called a <strong>luthier</strong> (say "LOO-tee-er") - from the old word for a <strong>lute</strong>, the guitar's great-great-grandparent. They carve a thin wooden <strong>top</strong> (often spruce, about as thick as two coins), bend the <strong>sides</strong> into that curvy shape using heat, glue on a <strong>back</strong>, then fit the neck, frets and strings. Building one by hand can take weeks!`,
  },
  {
    title: "The secret skeleton inside",
    people: ["cf-martin"],
    text: `Look inside the sound hole with a torch and you'll see wooden sticks glued under the top - the guitar's <strong>braces</strong>. They're like a skeleton: they stop the thin top from cracking under the strings' pull, while still letting it wobble to make sound. The famous <strong>X-shaped</strong> pattern used in most steel-string guitars was developed by the guitar maker <strong>C. F. Martin</strong> back in the 1800s.`,
  },
  {
    title: "Your guitar is in a tug-of-war",
    text: `All six strings on an acoustic guitar together pull with about <strong>70 kilograms</strong> of force - roughly a grown-up's weight, pulling all the time! So inside the neck hides a <strong>steel rod</strong>, called the <strong>truss rod</strong>, that stops the neck from bending.`,
  },
  {
    title: "Strings used to be made from… sheep!",
    text: `For hundreds of years, guitar and lute strings were made from <strong>gut</strong> - dried and twisted sheep intestines! In the 1940s, classical guitars switched to <strong>nylon</strong>, the same stuff as some toothbrush bristles. Acoustic and electric guitars use <strong>steel</strong> strings, which are brighter and louder.`,
  },
  {
    title: "How an electric guitar 'hears' the strings",
    text: `Under the strings of an electric guitar are <strong>pickups</strong>: magnets wrapped in thousands of turns of super-thin copper wire. When a steel string wiggles over the magnet, it makes a tiny <strong>electric signal</strong> in the wire - the amplifier makes it big enough to hear. That's why an electric guitar is quiet when it's not plugged in!`,
  },
  {
    title: "A coin for a pick",
    people: ["brian-may"],
    text: `<strong>Brian May</strong> of Queen plays with an old British <strong>sixpence coin</strong> instead of a plastic pick. He says the hard metal edge gives him a crunchier sound. (He also built his own guitar with his dad - see the Red Special lesson!)`,
  },
  {
    title: "Playing a guitar upside down",
    people: ["jimi-hendrix"],
    text: `<strong>Jimi Hendrix</strong> was left-handed, but most guitars in shops were made for right-handers. So he often flipped a right-handed guitar <strong>upside down</strong> and restrung it so the thick string was on top. He became one of the greatest guitarists ever!`,
  },
  {
    title: "Two fingers, one legend",
    people: ["django"],
    text: `<strong>Django Reinhardt</strong> was a young guitarist in France when a fire badly hurt his left hand, and two of his fingers stopped working properly. Doctors thought he'd never play again. He invented a whole new way of playing using mostly <strong>two fingers</strong> - and became one of the most famous jazz guitarists in history.`,
  },
  {
    title: "The guitar he ran into a fire to save",
    people: ["bb-king"],
    text: `One night in 1949, a fire started at a dance hall where <strong>B.B. King</strong> was playing. He ran back inside to rescue his guitar! He later learned the fight that started the fire was over a woman named <strong>Lucille</strong> - so he named his guitars "Lucille" to remind himself never to do something that dangerous again.`,
  },
  {
    title: "The inventor who didn't play guitar",
    people: ["leo-fender"],
    text: `<strong>Leo Fender</strong> designed some of the most famous electric guitars ever - the Telecaster and Stratocaster - and the Fender amplifiers. But he wasn't a guitar player! He was a radio repairman who listened carefully to what musicians wanted.`,
  },
  {
    title: "The Frankenstein guitar",
    people: ["eddie-van-halen"],
    text: `<strong>Eddie Van Halen</strong> couldn't find a guitar that did everything he wanted, so he built his own from <strong>spare parts</strong>, painted it with stripes of tape and spray paint, and called it the <strong>"Frankenstrat"</strong>: a Stratocaster-style body with a Gibson pickup, stitched together like Frankenstein's monster!`,
  },
];

const KEY = "jg_fun_facts_seen";

function nextFact() {
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { /* ignore */ }
  let pool = FACTS.map((_, i) => i).filter((i) => !seen.includes(i));
  const inventor = FACTS.findIndex((f) => f.id === "inventor");
  if (seen.length === 0) pool = pool.filter((i) => i !== inventor);
  else if (seen.length === 1 && !seen.includes(inventor)) pool = [inventor];
  if (!pool.length) {
    seen = [];
    pool = FACTS.map((_, i) => i);
  }
  const i = pool[Math.floor(Math.random() * pool.length)];
  try { localStorage.setItem(KEY, JSON.stringify([...seen, i])); } catch (e) { /* ignore */ }
  return FACTS[i];
}

function showFunFact(fact = nextFact()) {
  document.querySelector(".jg-funfact")?.remove();
  const card = document.createElement("div");
  card.className = "jg-funfact";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", "Did you know?");
  card.innerHTML = `
    <div class="jg-funfact-card">
      <div class="jg-funfact-img">${puppySvg("think")}</div>
      <div class="jg-funfact-kicker">Did you know?</div>
      <h3>${fact.title}</h3>
      ${fact.photosFirst ? peopleHtml(fact.people) : ""}
      <p>${fact.text}</p>
      ${fact.photosFirst ? "" : peopleHtml(fact.people)}
      ${fact.footnote ? `<p class="jg-note">${fact.footnote}</p>` : ""}
      <button class="jg-btn jg-btn-primary jg-funfact-close">Cool! Keep going</button>
    </div>`;
  document.body.appendChild(card);
  const close = () => card.remove();
  card.querySelector(".jg-funfact-close").addEventListener("click", close);
  card.addEventListener("click", (e) => { if (e.target === card) close(); });
}

// About half the time a lesson is finished - always the first time.
function maybeShowFunFact() {
  let shown = 0;
  try { shown = JSON.parse(localStorage.getItem(KEY) || "[]").length; } catch (e) { /* ignore */ }
  if (shown === 0 || Math.random() < 0.5) setTimeout(() => showFunFact(), 1400);
}

export { FACTS, showFunFact, maybeShowFunFact };
