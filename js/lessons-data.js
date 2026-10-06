// Jaxx Guitar curriculum. Each lesson is a list of pages; lessons-ui.js
// renders them all the same way. A page can have:
//   html            — the explanation (shown in the mascot's speech bubble)
//   diagrams        — chord symbols to draw as chord boxes
//   shape           — chord symbol to show on the fretboard (with fingers)
//   notes           — [{ string, fret, label?, tone? }] to show on the fretboard
//   practice        — { items: () => timeline, bpm, modes, label } (falling notes)
//   tab             — { items, beatsPerBar, bars } drawn as tab
//   tuner           — true: the per-string tuner
//   fretQuiz        — { count } "tap the note" quiz on the fretboard
//   changes         — [chordA, chordB]: the one-minute chord-change drill
//
// Facts are kept to what's well documented; anything copyrighted (solos,
// riffs, lyrics) is described and taught through its scales and
// techniques, never transcribed.

import { chordShape, scaleBox, SCALES, midiAt, STRING_NAMES } from "./guitar-theory.js";
import { chordTimeline } from "./guitar-player.js";

const shapes = (syms) => syms.map((c) => ({ chord: c, shape: chordShape(c) }));
const strumItems = (syms, pattern = ["down", "down", "down", "down"], beatsPerChord = 4) => () => chordTimeline(shapes(syms), { beatsPerChord, pattern });
const DDUUDU = ["down", null, "down", "up", null, "up", "down", "up"]; // 8 eighth-note slots: D - D U - U D U
const scaleItems = (box, { down = true, beats = 0.5 } = {}) => () => {
  const seq = down ? [...box, ...[...box].reverse().slice(1)] : box;
  return seq.map((n, i) => ({ string: n.string, fret: n.fret, start: i * beats, dur: beats }));
};
const melody = (notes, beats = 1) => () => notes.map(([string, fret, len], i, arr) => ({
  string, fret, dur: len || beats,
  start: arr.slice(0, i).reduce((a, n) => a + (n[2] || beats), 0),
}));


// Looping lesson: the loop pedal and the gear (facts from Boss's own
// history and loop-pedal guides, Guitar.com, Reverb; prices are Reverb's).
const LOOP_PEDAL_PAGE = { html: `<h3>Be your own band: the loop pedal.</h3>
  <p>A <strong>loop pedal</strong> (looper) records what you play and plays it straight back, again and again. Record your chords, and while they repeat, play lead on top. Add more layers (a bass line, a tap on the guitar body for a drum) and you sound like a whole band.</p>
  <p><strong>Ed Sheeran</strong> is famous for this. His first looper was a <strong>Boss RC-20XL</strong>, which Boss says put "a teenage Ed Sheeran on his road to the stadium league". Later his guitar tech Trevor Dawkins built him a custom looping rig called <strong>Chewie</strong>, which he played on huge tours. Watch him build songs layer by layer:</p>
  <p><strong>How most one-button loopers work:</strong></p>
  <ol>
    <li>Tap once: <strong>record</strong>. Play your chords (Am G F G).</li>
    <li>Tap again at the end of the bar: it <strong>plays your loop</strong> over and over.</li>
    <li>Tap again: <strong>add a layer</strong> on top (overdub). Tap to stop adding.</li>
    <li>Tap twice quickly: <strong>stop</strong>.</li>
  </ol>
  <p class="jg-note">The hardest part is tapping exactly on the beat, so the loop doesn't hiccup. Count "1, 2, 3, 4" and tap right on the next "1".</p>`, video: "ed-sheeran-looping" };
const LOOP_GEAR_PAGE = { html: `<h3>What you need to start looping</h3>
  <ul>
    <li><strong>A simple looper pedal.</strong> One button is all you need. Good first ones: the <strong>TC Electronic Ditto Looper</strong> (about $66–100) or the <strong>Boss RC-1</strong> (about $79–120). Want more later? The <strong>Boss RC-5</strong> (about $199) saves your loops.</li>
    <li><strong>Two instrument cables</strong> (1/4" jack): guitar → looper, and looper → amp. If you have other pedals, the looper goes <strong>last</strong>, just before the amp.</li>
    <li><strong>An amp or speaker.</strong> The looper makes no sound on its own. Electric guitar: a guitar amp. Acoustic: an acoustic amp or a PA speaker.</li>
    <li><strong>An acoustic needs a pickup</strong> to plug in (an "acoustic-electric" guitar has one built in). No pickup? Use a microphone into a looper that has a mic input.</li>
    <li><strong>Power:</strong> most loopers use a 9V power adapter (the Boss RC-1 can also run on a 9V battery). An adapter is more reliable.</li>
  </ul>
  <p class="jg-note">Into singing and beatboxing too? Tabletop "loop stations" like the Boss RC-505mkII have microphone inputs and several tracks, but start with a simple pedal first.</p>
  <p>No pedal yet? No problem: practise with a friend, or with the backing loop in this lesson.</p>` };

const AMIN_PENT = scaleBox(9, SCALES.minorPentatonic, 5);
const BMIN_PENT = scaleBox(11, SCALES.minorPentatonic, 7);
const GMAJ = scaleBox(7, SCALES.major, 2);
const BMIN_NAT = scaleBox(11, SCALES.naturalMinor, 7, 4);

const PRE = [
  {
    id: "p-guitar", pre: true, title: "Get yourself a guitar", subtitle: "Which kind, and what to check",
    pages: [
      { html: `<h3>You don't need an expensive guitar to start.</h3>
        <p>There are a few kinds — here's what actually matters:</p>
        <ul>
          <li><strong>Acoustic (steel-string)</strong> — loud on its own, bright sound, the classic campfire/pop guitar. Steel strings are a bit harder on fingertips at first.</li>
          <li><strong>Classical (nylon-string)</strong> — softer strings that are gentler on fingers, a wider neck, a warm mellow sound. Great for fingerstyle and classical music.</li>
          <li><strong>Electric</strong> — thin strings that are easy to press, needs an amplifier (or headphones amp) to be heard. Perfect for rock and solos.</li>
          <li><strong>Bass guitar</strong> — usually 4 thicker strings, plays the low notes in a band. It's a different instrument; this app teaches 6-string guitar.</li>
          <li>Also out there: <strong>12-string</strong> guitars (pairs of strings, a shimmering sound) and ukuleles (4 strings, different tuning).</li>
        </ul>` },
      { html: `<h3>Electric, acoustic, classical… or a ukulele?</h3>
        <table class="jg-table">
          <tr><th></th><th>Strings</th><th>Feels</th><th>Good for</th></tr>
          <tr><td><strong>Classical</strong></td><td>6 nylon</td><td>Softest on fingertips; wide neck</td><td>Fingerpicking, classical, Spanish styles; young kids</td></tr>
          <tr><td><strong>Acoustic</strong></td><td>6 steel</td><td>Bright and loud; a bit harder to press at first</td><td>Strumming songs, singing along, campfires</td></tr>
          <tr><td><strong>Electric</strong></td><td>6 thin steel</td><td>Easiest to press; needs an amp (or headphones amp)</td><td>Rock, blues, solos, bending notes</td></tr>
          <tr><td><strong>Ukulele</strong></td><td>4 nylon</td><td>Tiny, light, very easy</td><td>A fun first instrument — but it's not a guitar</td></tr>
        </table>
        <p><strong>Which should you start on?</strong> The one that makes you want to play every day! Everything in this app works on acoustic, electric and classical guitars.</p>
        <p class="jg-fact">Ukulele secret: a uke is tuned <strong>G C E A</strong> — the same as a guitar's top four strings with a capo on the 5th fret. So a guitar "G" shape on the top four strings is a uke "C"! Learn one and you're halfway to the other.</p>` },
      { html: `<h3>Get one cheap (or free!)</h3>
        <p>You don't need a new or fancy guitar to learn. Some smart places to look:</p>
        <ul>
          <li><strong>Facebook Marketplace</strong>, Craigslist, Gumtree or local buy-and-sell groups — beginner guitars often sell for <strong>$40–100</strong> used, because lots of people buy one and stop playing.</li>
          <li><strong>Family and friends</strong> — ask around; there's often a guitar sitting in someone's closet.</li>
          <li><strong>Your school</strong> or a local community music centre, which may lend instruments.</li>
          <li>New: a decent beginner acoustic or electric is usually around <strong>$100–200</strong>.</li>
        </ul>
        <h3>What to check before you pay</h3>
        <ul>
          <li><strong>The neck:</strong> look down it from the headstock like aiming an arrow — it should be straight, not twisted.</li>
          <li><strong>String height ("action"):</strong> at the 12th fret the strings should sit low — about the thickness of two or three coins. Very high strings make every chord hard.</li>
          <li><strong>Play every string</strong> at a few frets: listen for buzzing or dead notes.</li>
          <li><strong>Tuning pegs</strong> turn smoothly and hold their tuning; no cracks in the body or where the neck meets it.</li>
          <li><strong>Electric?</strong> Plug it in and wiggle the knobs and the cable — crackles mean repairs.</li>
        </ul>
        <p class="jg-note">Old strings are fine to start — a fresh set costs about $5–10 and makes any guitar sound better. Grab a few picks, and a capo when you can.</p>` },
      { html: `<h3>Going electric? Keep it simple 🎸⚡</h3>
        <p>An <strong>acoustic</strong> makes its own sound: just pick it up and play. An <strong>electric</strong> is quiet on its own; it plugs into an amp (or headphones), and its lighter strings are easier to press.</p>
        <p>What you need for an electric:</p>
        <ul>
          <li><strong>The guitar</strong>: a starter like a Squier Sonic Stratocaster is about $200–250.</li>
          <li><strong>A small practice amp</strong> (about $80–150), <strong>or</strong> a headphone amp that plugs straight into the guitar (about $70–130) so you can practise silently.</li>
          <li><strong>A cable</strong> (about $20–30), a <strong>clip-on tuner</strong> (about $18–38), a few <strong>picks</strong> and a <strong>strap</strong>.</li>
        </ul>
        <p class="jg-note">Tip: a <strong>starter pack</strong> (guitar, amp, cable, strap, picks, tuner and bag in one box) is often the easiest way to buy everything at once. Prices from Sweetwater, 2026.</p>` },
      { html: `<h3>Now that you have your guitar, let's make sure it's in tune 🎵</h3>
        <p>Tap a string to <strong>hear</strong> how it should sound. Then tap <strong>Start listening</strong> and play that string on your guitar: the needle shows if it's too low or too high and tells you to <strong>tighten</strong> or <strong>loosen</strong> the peg, until it turns <strong>green</strong>. Then it moves on to the next string by itself.</p>`, tuner: true },

    ],
  },
  {
    id: "p-tune", pre: true, title: "Tune your guitar (free tuner)", subtitle: "Every string, one by one",
    pages: [
      { html: `<h3>Tune up before you play — every time</h3>
        <p>An out-of-tune guitar makes even perfect chords sound wrong, so guitarists tune before every practice. This app has a <strong>free tuner</strong> built in — it listens through your microphone.</p>
        <ol>
          <li>Pick a string below, starting with the thickest: <strong>low E</strong>.</li>
          <li>Tap <strong>Start listening</strong> and pluck that string (let it ring).</li>
          <li>Too low (flat)? <strong>Tighten</strong> its peg a little. Too high (sharp)? <strong>Loosen</strong> a little, then come back up.</li>
          <li>When the meter turns <strong>green</strong>, it jumps to the next string by itself. Do all six: <strong>E A D G B E</strong>.</li>
        </ol>
        <p class="jg-note">Turn pegs slowly — a quarter turn can be a big change, and over-tightening can snap a string. Not sure which way to turn? Turn a tiny bit and watch the needle.</p>`, tuner: true },
    ],
  },
  {
    id: "p-parts", pre: true, title: "Meet your guitar", subtitle: "The parts, top to bottom",
    pages: [
      { html: `<h3>From the top:</h3>
        <ul>
          <li><strong>Headstock</strong> with <strong>tuning pegs</strong> — turn them to tighten (higher) or loosen (lower) each string.</li>
          <li><strong>Nut</strong> — the little strip the strings pass over at the top of the neck.</li>
          <li><strong>Neck</strong> and <strong>fretboard</strong> — the long part you press strings against.</li>
          <li><strong>Frets</strong> — the metal strips across the fretboard. The dots (inlays) mark frets 3, 5, 7, 9 and the double dot at 12.</li>
          <li><strong>Body</strong> — on an acoustic it's hollow with a <strong>sound hole</strong>; on an electric it's usually solid with <strong>pickups</strong> (magnets that "hear" the strings) plus volume and tone knobs.</li>
          <li><strong>Bridge</strong> — where the strings are anchored on the body.</li>
        </ul>
        <p>Below is your fretboard, the way it looks when you glance down at your guitar: nut on the left, thinnest string on top.</p>` },
    ],
  },
  {
    id: "p-howitworks", pre: true, fun: true, title: "Just for fun: how a guitar is made — and why it rings", subtitle: "Wood, wiggles and air",
    pages: [
      { html: `<h3>Someone builds every guitar!</h3>
        <p>A guitar maker is called a <strong>luthier</strong> (say "LOO-tee-er"). Here's how they make an acoustic guitar:</p>
        <ol>
          <li>Carve the <strong>top</strong> from a thin sheet of wood — often spruce, about as thick as two coins. It has to be thin so it can wobble.</li>
          <li>Glue wooden sticks called <strong>braces</strong> underneath, like a skeleton, so the top doesn't crack when the strings pull on it.</li>
          <li>Bend the <strong>sides</strong> into that curvy shape with heat, and glue on the <strong>back</strong> — now it's a hollow wooden box.</li>
          <li>Make the <strong>neck</strong>, with a steel <strong>truss rod</strong> hidden inside, and tap metal <strong>frets</strong> into little slots.</li>
          <li>Add the <strong>bridge</strong>, tuning pegs and strings… and tune it up!</li>
        </ol>
        <p class="jg-fact">All six strings pull with about <strong>70 kilograms</strong> of force — like a grown-up hanging off your guitar all day long. That's why it needs braces and a truss rod!</p>`, video: "how-guitar-made" },
      { html: `<h3>Why does it make sound?</h3>
        <p>When you pluck a string, it <strong>wiggles</strong> back and forth really fast. But a string is so thin it hardly pushes any air — on its own, you'd barely hear it!</p>
        <ol>
          <li>The wiggle travels through the <strong>bridge</strong> into the wooden <strong>top</strong>…</li>
          <li>…which wobbles like a <strong>trampoline</strong> and pushes LOTS of air…</li>
          <li>…and the air inside the body puffs <strong>in and out of the sound hole</strong>, like blowing across a bottle — <em>hoooo</em> — making the low notes big and warm.</li>
        </ol>
        <p>The thick low E string wiggles about <strong>82 times every second</strong>. The thin high e wiggles about <strong>330 times a second</strong>. Listen to all six, thick to thin:</p>`,
        notes: [0, 1, 2, 3, 4, 5].map((s) => ({ string: s, fret: 0, label: STRING_NAMES[s] })),
        practice: { items: melody([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]), bpm: 60, modes: ["listen"], label: "The six open strings" } },
      { html: `<h3>The halfway trick</h3>
        <p>Pressing a fret makes the wiggly part of the string <strong>shorter</strong> — and shorter strings wiggle faster, so the note goes higher.</p>
        <p>The <strong>12th fret</strong> (the double dot) is exactly <strong>halfway</strong> along the string. Half the string wiggles twice as fast, which sounds like the <strong>same note, only higher</strong>. Tap the open low E, then the low E at the 12th fret, and hear it!</p>
        <p class="jg-note">That's also why the frets get closer together as you go up the neck — each one sits about one-eighteenth of the way along the string that's left.</p>`,
        notes: [{ string: 0, fret: 0, label: "E" }, { string: 0, fret: 12, label: "E", tone: "root" }] },
      { html: `<h3>Electric guitars "hear" with magnets</h3>
        <p>An electric guitar is usually a <strong>solid</strong> block of wood, so it's quiet by itself. Under the strings sit <strong>pickups</strong>: magnets wrapped in thousands of turns of super-thin copper wire. When a steel string wiggles over the magnet, it makes a tiny <strong>electric signal</strong>, and the <strong>amplifier</strong> turns it into big sound.</p>
        <p>Acoustic or electric, it all starts the same way: a string, wiggling. 🎸</p>` },
    ],
  },
  {
    id: "p-strings", pre: true, title: "The six strings — and tuning", subtitle: "E A D G B E",
    pages: [
      { html: `<h3>Six strings, thickest to thinnest: E A D G B E.</h3>
        <p>A popular way to remember it: <strong>E</strong>ddie <strong>A</strong>te <strong>D</strong>ynamite, <strong>G</strong>ood <strong>B</strong>ye <strong>E</strong>ddie.</p>
        <p>Guitarists number them backwards: the <strong>thickest</strong> (lowest-sounding) string is the <strong>6th</strong>, the thinnest (highest) is the <strong>1st</strong>. Both outside strings are E — two octaves apart.</p>
        <p class="jg-note">On the fretboard below, the thin high e string is on top — the same order as guitar tab.</p>`,
        notes: [0, 1, 2, 3, 4, 5].map((s) => ({ string: s, fret: 0, label: STRING_NAMES[s] })) },
      { html: `<h3>Tune up — every time you play.</h3>
        <p>Strings drift out of tune all the time. Tap <strong>Start listening</strong>, pick a string, then play it and turn its peg slowly: the meter turns <strong>green</strong> when it's in tune. Too low? Tighten. Too high? Loosen a little, then come back up.</p>`, tuner: true },
    ],
  },
  {
    id: "p-fretboard", pre: true, title: "The fretboard", subtitle: "Frets are half-steps",
    pages: [
      { html: `<h3>Each fret is one half-step higher.</h3>
        <p>Press a string just behind the 1st fret and it sounds one step higher than open; the 2nd fret, one more; and so on. At the <strong>12th fret</strong> (the double dot) you're back to the same note name, one octave higher.</p>
        <p>The notes on the low E string, which you'll use to find chords later:</p>`,
        notes: [[0, "E"], [1, "F"], [3, "G"], [5, "A"], [7, "B"], [8, "C"], [10, "D"], [12, "E"]].map(([f, l]) => ({ string: 0, fret: f, label: l })) },
      { html: `<h3>Try it: find notes on the fretboard.</h3><p>Tap the note asked for (on the string it names).</p>`, fretQuiz: { count: 6 } },
    ],
  },
  {
    id: "p-press", pre: true, title: "How to press a fret (no buzz)", subtitle: "Best practice from day one",
    pages: [
      { html: `<h3>Five habits that make notes ring clean:</h3>
        <ol>
          <li><strong>Fingertip, not finger pad.</strong> Come down on the very tip of your finger so it doesn't touch the strings next to it.</li>
          <li><strong>Just behind the fret</strong> — close to the metal fret on the body side, not in the middle of the space and never on top of the fret. Closer = less pressure needed and no buzz.</li>
          <li><strong>Thumb behind the neck,</strong> roughly opposite your middle finger — like a gentle pinch, not a fist around the neck.</li>
          <li><strong>Curve your fingers</strong> like holding a small ball, with your wrist relaxed and slightly forward.</li>
          <li><strong>Only as hard as needed.</strong> Press until the buzz stops — then no harder. Pressing harder just tires your hand.</li>
        </ol>
        <p class="jg-note">Short nails on your fretting hand help a lot. Sore fingertips for the first week or two are normal — they toughen up. Stop if anything actually hurts.</p>`,
        notes: [{ string: 4, fret: 1, label: "1", tone: "root" }] },
      { html: `<h3>The buzz check</h3>
        <p>Press the B string (2nd string) at the 1st fret with your index fingertip — lit up below — and pick it. Buzzing? Move closer to the fret or press a little firmer. Muffled? Your finger is touching a neighbouring string or not on its tip.</p>
        <p>Then try the same with fingers 2, 3 and 4 on frets 2, 3 and 4. This little "1-2-3-4" walk is also a great daily warm-up.</p>`,
        notes: [1, 2, 3, 4].map((f) => ({ string: 4, fret: f, label: String(f) })),
        practice: { items: melody([[4, 1], [4, 2], [4, 3], [4, 4], [3, 1], [3, 2], [3, 3], [3, 4]]), bpm: 60, modes: ["listen", "wait"], label: "1-2-3-4 on the B and G strings" } },
    ],
  },
  {
    id: "p-hands", pre: true, title: "Left-handed or right-handed?", subtitle: "Which hand does what",
    pages: [
      { html: `<h3>Both hands work hard on guitar</h3>
        <p>On a standard (right-handed) guitar, your <strong>right hand strums or picks</strong> near the sound hole, and your <strong>left hand presses the frets</strong>. Your fretting hand actually does the trickier finger work!</p>
        <p><strong>If you're left-handed</strong>, you have three choices:</p>
        <ul>
          <li><strong>Play right-handed anyway.</strong> Many lefties do — both hands are learning something new either way.</li>
          <li><strong>Get a left-handed guitar</strong> — a mirror image, strumming with your left hand. Paul McCartney and Jimi Hendrix played left-handed (Hendrix often flipped a right-handed guitar and restrung it).</li>
          <li><strong>Flip a right-handed guitar upside down without restringing</strong> — the thin strings end up on top. Bluesman <strong>Albert King</strong> and folk legend <strong>Elizabeth Cotten</strong> played this way, and invented their own styles because of it!</li>
        </ul>
        <p class="jg-note">For now, Jaxx Guitar's diagrams are drawn for right-handed playing. Left-handed players on a lefty guitar can read every diagram as a mirror image — the strings and frets are the same, just flipped.</p>`, people: ["jimi-hendrix"] },
    ],
  },
  {
    id: "p-hold", pre: true, title: "Sitting, standing and straps", subtitle: "Comfortable from day one",
    pages: [
      { html: `<h3>Sitting down</h3>
        <ul>
          <li>Sit on a chair without arms, near the front, back straight and shoulders relaxed.</li>
          <li>Rest the guitar's waist (the curvy dip) on your <strong>right leg</strong>, the body against your tummy, neck pointing slightly up — not flat.</li>
          <li><strong>Classical players</strong> rest it on the <strong>left leg</strong> with that foot on a small footstool, so the neck sits higher. Try both and use what's comfortable.</li>
          <li>Don't lean over to look at the fretboard — tilt your head a little, not your whole body.</li>
        </ul>` },
      { html: `<h3>Standing up: should it hang around your neck?</h3>
        <p>Not around your neck! A <strong>strap</strong> goes over your <strong>left shoulder</strong> and across your back, so your shoulders and back carry the weight, not your neck.</p>
        <ul>
          <li>Set the strap so the guitar sits at about the <strong>same height as when you're sitting</strong> — then your hands work the same way standing up. Rock stars wear guitars low; it looks cool and is much harder to play!</li>
          <li>Strap buttons: most acoustic and electric guitars have one at the bottom and one near the neck. Some acoustics need the strap tied around the headstock.</li>
          <li>Check the strap ends are pushed fully on — rubber <strong>strap locks</strong> are cheap and stop the guitar falling.</li>
        </ul>` },
    ],
  },
  {
    id: "p-pick", pre: true, title: "Pick or fingers?", subtitle: "And which pick to buy",
    pages: [
      { html: `<h3>When to use a pick</h3>
        <ul>
          <li><strong>Use a pick</strong> for strumming, rock and pop, single-note solos on electric guitar — it's louder and brighter.</li>
          <li><strong>Use your fingers</strong> for fingerpicking, classical and Spanish guitar, and soft songs — warmer, and you can play bass and melody at once.</li>
          <li>Many songs use both — and on a steel-string acoustic, a light pick is easiest for beginners' strumming.</li>
        </ul>
        <h3>Pick thickness</h3>
        <table class="jg-table">
          <tr><th>Thin (about 0.4–0.6 mm)</th><td>Flexible and forgiving — great for strumming acoustic chords.</td></tr>
          <tr><th>Medium (about 0.6–0.8 mm)</th><td>The all-rounder: strumming and single notes. A good first pick.</td></tr>
          <tr><th>Heavy (1 mm and up)</th><td>Stiff and precise — for solos and fast picking.</td></tr>
        </table>
        <h3>How to hold it</h3>
        <p>Curl your index finger, lay the pick on the side of its first joint, and press it there with your thumb — only the tip pokes out, pointing at the strings. Grip just firmly enough that it doesn't fly away.</p>` },
    ],
  },
];


// ===== Simple cards for the beginner lessons (see js/cards.js) =====
const LESSON1_CARDS = [
  { say: `Welcome to Jaxx Guitar! 🎸<br>In about <b>a minute</b> you'll learn <b>4 chords</b> that play <b>100+ songs</b>: <b>G · D · Em · C</b> 🎶<br>But <b>bear</b> 🐻 with us while we cover the <b>basics</b> first. It only takes a few seconds!<br><br>Grab <b>your guitar</b> (the real one!) 🎸`, want: { tap: "I've got my guitar! 🎸" }, done: "Let's get you in tune! 🎵" },
  { say: `Quick <b>tuning check</b> before every practice 🎵<br>Tap a string to <b>hear</b> how it should sound. Then tap <b>Start listening</b> and play that string: the needle shows if it's too low or too high, and tells you to <b>tighten</b> or <b>loosen</b> the peg until it goes <b>green</b>.`, want: { tuner: true }, done: "In tune and ready! 🎉" },
  { say: `This is the <b>fretboard</b> 👇<br>The <b>6 strings</b> run along the neck. The thin metal bars across it are the <b>frets</b>.<br>Fretboards are long (around 20 frets!), but today we only need the first <b>3 frets</b>, near the end with the tuning pegs.`,
    more: [["Which way round is the picture?", "Exactly like <b>tab</b>: the <b>thickest string</b> is at the <b>bottom</b> of the picture. On your guitar, it's the one closest to your chin 😺"], ["What's fret 1?", "The space just after the end of the neck (by the tuning pegs). Fret 2 is the next space, and so on. You press <b>between</b> the metal bars, not on them."]],
    show: { notes: [{ string: 0, fret: 1, label: "1" }, { string: 0, fret: 2, label: "2" }, { string: 0, fret: 3, label: "3" }] }, want: { tap: "Got it 👍" }, done: "Strings along, frets across! 👍" },
  { say: `Strings have <b>numbers</b>: the <b>thickest</b> is string <b>6</b>, the thinnest is string <b>1</b>.<br>Tap the <b>thickest string</b> (6th, low E).`, show: {}, want: { string: 0 }, done: "That's the 6th string, the low E! 🎉" },
  { say: `Now <b>press a fret</b>: on the <b>6th string</b>, press <b>fret 3</b>.<br>Use your fingertip, just <b>behind</b> the metal bar.`, show: {}, want: { pos: [{ string: 0, fret: 3 }] },
    tip: `How hard? Only <b>just hard enough</b> that the buzz stops. Pressing harder doesn't sound better, it just tires your hand. On a real guitar it gets easier every day 💪`, done: "That's a G note! 🎵" },
  { say: `Your first chord: <b>E minor</b> (Em), the easiest one! 😺<br>Two fingers: <b>2</b> and <b>3</b>, both on <b>fret 2</b>.<br>Place them one at a time, then strum all 6 strings.`, show: {}, want: { chord: "Em" }, done: "Em! A soft, sad sound 🥲" },
  { say: `Now <b>G</b> 🎸<br>Three fingers. Finger numbers: <b>1</b> = index, <b>2</b> = middle, <b>3</b> = ring.`, show: {}, want: { chord: "G" }, done: "G! Big and happy 😀" },
  { say: `Now <b>C</b> 🎸<br>Arch your fingers so the open strings ring.<br>Don't strum the thickest string (the ✕).`, show: {}, want: { chord: "C" }, done: "C! 🎉" },
  { say: `Last one: <b>D</b> 🎸<br>Only the <b>4 thinnest</b> strings. Skip the two thick ones (the ✕s).`, show: {}, want: { chord: "D" }, done: "D! You know 4 chords! 💥" },
  { say: `Quick quiz! 🧠<br>Which chord uses only <b>two fingers</b>?`, want: { choice: "Em", options: ["G", "Em", "C"] }, done: "Yes! Em is the easy one 😺" },
  { say: `<b>Boom!</b> Now the loop: <b>G → D → Em → C</b> 🔁<br>That's the pattern behind 100+ songs. Tap <b>Start</b> and watch the notes arrive at the frets. <b>Wait for me</b> waits until you play each chord (on screen, or your guitar with the microphone).`, want: { practice: { items: strumItems(["G", "D", "Em", "C", "G", "D", "Em", "C"]), bpm: 70, modes: ["listen", "wait"], label: "G – D – Em – C" }, ok: "I played the loop! ✓" }, done: "That's the loop in 100+ songs! 🏆" },
];
const STRUM_CARDS = [
  { say: `Time to <b>strum</b>! 🎸<br>Hold the pick between your <b>thumb</b> and the side of your <b>index finger</b>, with just the tip showing.<br>Strum from the <b>wrist</b>, loose, like shaking water off your hand.`, want: { tap: "Got it 👍" }, done: "Loose wrist, happy strum 😺" },
  { say: `How hard should you strum? <b>Gently!</b><br>Loud comes from a <b>relaxed swing</b>, not from pushing. Just like pressing frets: soft or strong changes the <b>feeling</b> of the song.`,
    more: [["What does a downstrum hit?", "<b>Down</b> (towards the floor) hits more of the thick strings, so it's a bit stronger. <b>Up</b> is lighter and just catches the thin strings."]], want: { tap: "I'll strum gently 🎵" }, done: "Gentle and relaxed 👍" },
  { say: `Count <b>1 & 2 & 3 & 4 &</b> 🔢<br>Your hand goes <b>down</b> on every number and <b>up</b> on every "&", all the time, like a pendulum.<br>The most-used pattern: <b>D · D U · U D U</b>. Tap Start and strum along!`, want: { practice: { items: strumItems(["G", "G", "C", "C"], ["down", null, "down", "up", null, "up", "down", "up"]), bpm: 70, modes: ["listen"], label: "D · D U · U D U" }, ok: "I strummed along! ✓" }, done: "That's the strum in so many songs! 🎉" },
  { say: `Quick quiz! 🧠<br>In <b>D · D U · U D U</b>, what happens on beat <b>3</b>?`, want: { choice: "Miss it (hand still moves)", options: ["Strum down", "Miss it (hand still moves)"] }, done: "Yes! The hand keeps moving, it just misses the strings 👍" },
];
const CHANGES_CARDS = [
  { say: `Changing chords without stopping 🔁<br>The trick: look for a <b>finger that can stay</b>. Play <b>C</b> first.`, show: {}, want: { chord: "C" }, done: "C ready! 😺" },
  { say: `Now change to <b>A minor (Am)</b>.<br>Your fingers <b>1</b> and <b>2</b> <b>don't move at all</b>! Only finger <b>3</b> hops to another string. That's an <b>anchor</b> ⚓`, show: { shape: "C" }, want: { chord: "Am" }, done: "Am! Two fingers stayed put ⚓" },
  { say: `The <b>one-minute drill</b> ⏱️<br>Strum one chord, switch, strum the other. How many clean changes in 60 seconds? Try to beat it tomorrow!`, show: {}, want: { changes: ["G", "C"], ok: "Done ✓" }, done: "That's how you get smooth! 🏆" },
];

const BEGINNER = [
  {
    id: "lesson-1", title: "The 4 chords to play 100 songs", subtitle: "G, D, Em and C",
    cards: LESSON1_CARDS,
    pages: [
      { html: `<h3>Welcome to Jaxx Guitar! 🎸</h3>
        <p>In about <strong>a minute</strong> you'll learn <strong>4 chords</strong> that play <strong>100+ songs</strong>: <strong>G · D · Em · C</strong> 🎶</p>
        <p>But bear with us while we cover the <strong>basics</strong> first. It'll only take a few seconds! Grab <strong>your guitar</strong> 🎸</p>
        <h3>First: is your guitar in tune?</h3>
        <p>Before every practice, check your tuning — it takes a minute and makes everything sound right. Play each string with the tuner below; it moves to the next string on its own when one goes green. Already tuned? Tap <strong>Next</strong>.</p>`, tuner: true },
      { html: `<h3>Four chords play hundreds of songs.</h3>
        <p>"Let It Be", "Someone Like You", "I'm Yours", "With or Without You"… all built on the same 4-chord pattern. On guitar, the friendliest version is <strong>G – D – Em – C</strong>.</p>
`,
        diagrams: ["G", "D", "Em", "C"] },
      { html: `<h3>G major</h3><p>Middle finger on the 6th string, 3rd fret; index on the 5th string, 2nd fret; ring finger on the 1st string, 3rd fret. Strum all six strings.</p>`, shape: "G", diagrams: ["G"],
        practice: { items: strumItems(["G"]), bpm: 70, modes: ["listen"], label: "Hear G" } },
      { html: `<h3>D major</h3><p>Only the top four strings: index on the 3rd string 2nd fret, middle on the 1st string 2nd fret, ring on the 2nd string 3rd fret. <strong>Don't strum the two low strings</strong> (the ×s).</p>`, shape: "D", diagrams: ["D"],
        practice: { items: strumItems(["D"]), bpm: 70, modes: ["listen"], label: "Hear D" } },
      { html: `<h3>E minor — the easiest chord on guitar</h3><p>Two fingers: middle on the 5th string 2nd fret, ring on the 4th string 2nd fret. Strum all six. The little "m" means <strong>minor</strong> — a softer, sadder sound.</p>`, shape: "Em", diagrams: ["Em"],
        practice: { items: strumItems(["Em"]), bpm: 70, modes: ["listen"], label: "Hear Em" } },
      { html: `<h3>C major</h3><p>Ring finger on the 5th string 3rd fret, middle on the 4th string 2nd fret, index on the 2nd string 1st fret. Skip the low E string. Arch your fingers so the open strings ring.</p>`, shape: "C", diagrams: ["C"],
        practice: { items: strumItems(["C"]), bpm: 70, modes: ["listen"], label: "Hear C" } },
      { html: `<h3>Now the whole pattern: G – D – Em – C</h3>
        <p>One strum per beat, four beats per chord. Watch the falling notes; the app strums along. Then switch to <strong>Wait for me</strong> — it moves on each time it hears you strum the chord.</p>`,
        diagrams: ["G", "D", "Em", "C"],
        practice: { items: strumItems(["G", "D", "Em", "C", "G", "D", "Em", "C"]), bpm: 70, modes: ["listen", "wait"], label: "G – D – Em – C" } },
    ],
  },
  {
    id: "lesson-strum", title: "Strumming and rhythm", subtitle: "Down, up, and the classic pattern",
    cards: STRUM_CARDS,
    pages: [
      { html: `<h3>Hold the pick and strum from the wrist.</h3>
        <p>Pinch the pick between your thumb and the side of your index finger, with just the tip showing. Strum with a loose wrist, like shaking water off your hand — not a stiff arm.</p>
        <p><strong>Downstrums</strong> go toward the floor (thick strings first); <strong>upstrums</strong> come back up and usually just catch the thinner strings.</p>` },
      { html: `<h3>How hard should you strum?</h3>
        <p>Much more gently than you'd think! Loud comes from <strong>speed and a relaxed swing</strong>, not from pushing hard.</p>
        <ul>
          <li>Hold the pick <strong>loosely</strong> — just firm enough that it doesn't fall. A tight grip makes it catch and clack on the strings.</li>
          <li>Let only the <strong>tip</strong> of the pick brush the strings, and let it flex a little as it passes.</li>
          <li><strong>Downstrums</strong> hit more of the thick strings, so they're naturally a bit stronger; <strong>upstrums</strong> are lighter and usually just catch the top three or four strings.</li>
          <li>Move from the <strong>wrist</strong> (like shaking water off your hand), not the whole arm or shoulder.</li>
          <li>Strings rattling or a harsh clang? Strum softer. Chord sounds thin? Make sure you're catching all the strings it uses.</li>
        </ul>
        <p class="jg-note">Fretting hand: press each string just behind the fret with your fingertip — only hard enough for the buzz to stop (see "How to press a fret" in Before you start). Pressing harder than that just tires your hand.</p>` },
      { html: `<h3>Count "1 & 2 & 3 & 4 &"</h3>
        <p>Your hand moves down on every number and up on every "&" — all the time, like a pendulum — even when it doesn't touch the strings. That steady motion is the secret to good rhythm.</p>
        <p>The most-used pattern in pop and folk: <span class="jg-strum">D · D U · U D U</span> (down on 1, down on 2, up on "&", miss 3, up on "&", down on 4, up on "&").</p>`,
        diagrams: ["G"],
        practice: { items: strumItems(["G", "G", "C", "C"], DDUUDU), bpm: 70, modes: ["listen"], label: "D · D U · U D U on G and C" } },
    ],
  },
  {
    id: "lesson-changes", title: "Changing chords without stopping", subtitle: "Anchor fingers and one-minute changes",
    cards: CHANGES_CARDS,
    pages: [
      { html: `<h3>Look for the finger that can stay.</h3>
        <p>From <strong>C</strong> to <strong>Am</strong>, your index (2nd string, 1st fret) and middle finger (4th string, 2nd fret) <strong>don't move at all</strong> — only your ring finger hops from the 5th string to the 3rd string. That's an "anchor".</p>
        <p>Even when no finger can stay, move all fingers together as one shape, and look at where they're going, not where they've been.</p>`, diagrams: ["C", "Am"] },
      { html: `<h3>The one-minute change drill</h3>
        <p>Strum one chord, switch, strum the other — as many clean changes as you can in 60 seconds. Count them, and try to beat your score tomorrow. It's one of the fastest ways to get smooth.</p>`, changes: ["G", "C"] },
    ],
  },
  {
    id: "lesson-minor", title: "Major or minor? One finger", subtitle: "E vs Em, A vs Am",
    pages: [
      { html: `<h3>Hear the difference, see the difference.</h3>
        <p><strong>E major</strong> and <strong>E minor</strong> differ by a single finger: lift your index off the 3rd string's 1st fret and E becomes Em. Same for <strong>A → Am</strong>: one finger moves from the 2nd fret to the 1st on the B string.</p>
        <p>That one note is the chord's <strong>third</strong> — the note that decides happy (major) or sad (minor).</p>`,
        diagrams: ["E", "Em", "A", "Am"],
        practice: { items: strumItems(["E", "Em", "A", "Am"]), bpm: 66, modes: ["listen", "wait"], label: "E – Em – A – Am" } },
    ],
  },
  {
    id: "lesson-more", title: "Four more chords: A, E, Am, Dm", subtitle: "More songs unlocked",
    pages: [
      { html: `<h3>With these, most beginner songs are open to you.</h3>
        <p><strong>A</strong> squeezes three fingers onto the 2nd fret; <strong>Dm</strong> is like a small triangle on the top strings. Practise each, then the loop below.</p>`,
        diagrams: ["A", "E", "Am", "Dm"],
        practice: { items: strumItems(["Am", "Dm", "E", "Am", "C", "G", "Am", "Am"]), bpm: 70, modes: ["listen", "wait"], label: "Am – Dm – E – Am – C – G – Am" } },
    ],
  },
  {
    id: "lesson-open-barre", title: "Open chords, barre chords and the baby F", subtitle: "Why F is tricky, and an easy way in",
    pages: [
      { html: `<h3>Two kinds of chords</h3>
        <p><strong>Open chords</strong> use some strings you don't press at all ("open" strings), and they live right by the nut. G, C, D, Em, Am, E, A and Dm are all open chords. They're the easiest, and they ring out bright and full.</p>
        <p><strong>Barre chords</strong> ("bar" chords) have no open strings. Your index finger lies flat across several strings, like a moving nut, and the other fingers make a shape in front of it. Because there are no open strings, you can slide the same shape up and down the neck to play any chord. They take more strength, so they come a little later.</p>`,
        diagrams: ["C", "F"] },
      { html: `<h3>F: the chord everyone finds tricky</h3>
        <p>The full F chord is a barre chord, and it's the one that makes most beginners groan. That's completely normal! Here are two easier stepping stones:</p>
        <ol>
          <li><strong>Fmaj7</strong>: no barre at all. Same as the baby F but leave the thin e string open. It sounds dreamy and works in lots of songs where F is written.</li>
          <li><strong>The baby F</strong>: your index finger presses just the <strong>top two strings</strong> at the 1st fret (a tiny barre), middle finger on the G string at fret 2, ring finger on the D string at fret 3. Strum only the top four strings.</li>
        </ol>
        <p>Use the baby F in songs now; the full F comes in the Barre chords lesson, once your fingers are stronger.</p>`,
        diagrams: [{ name: "Fmaj7", frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] }, { name: "F (baby)", frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], barre: 1 }, "F"] },
      { html: `<h3>Try it in a song pattern</h3>
        <p><strong>C – G – Am – F</strong> is one of the most-used chord loops in pop music. Play it with the baby F. Start with Listen, then Wait for me.</p>`,
        diagrams: ["C", "G", "Am", { name: "F (baby)", frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], barre: 1 }],
        practice: { items: () => chordTimeline([["C", chordShape("C")], ["G", chordShape("G")], ["Am", chordShape("Am")], ["F", { frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], barre: 1 }]].concat([["C", chordShape("C")], ["G", chordShape("G")], ["Am", chordShape("Am")], ["F", { frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], barre: 1 }]]).map(([chord, shape]) => ({ chord, shape })), { beatsPerChord: 4, pattern: ["down", "down", "down", "down"] }), bpm: 70, modes: ["listen", "wait"], label: "C – G – Am – baby F" } },
    ],
  },
  {
    id: "lesson-lespaul", fun: true, title: "Just for fun: the teenager who needed to be heard", subtitle: "Les Paul",
    pages: [
      { html: `<h3>Too quiet for the crowd</h3>
        <p>In the 1920s and '30s, a teenage guitarist from Waukesha, Wisconsin called <strong>Les Paul</strong> played at drive-ins and roadside stands — often outdoors, where an acoustic guitar just got lost.</p>
        <p>So he rigged up his own solution: he jammed a <strong>record-player needle</strong> into his guitar to pick up the vibrations and ran it into a <strong>radio speaker</strong>. Suddenly people could hear him.</p>
        <p>That homemade hack started a lifetime of inventing. Les Paul went on to build one of the first <strong>solid-body electric guitars</strong> (nicknamed "The Log" — a block of wood with a guitar neck), which led to the famous Gibson Les Paul guitar. He also pioneered multitrack recording.</p>
        <p class="jg-fact">He's in both the <strong>Rock and Roll Hall of Fame</strong> and the <strong>National Inventors Hall of Fame</strong> — often called the only person in both. Isn't that amazing?</p>
        <p class="jg-note">To be precise: he didn't invent the amplifier itself — but his DIY rig to be heard as a young performer is a big part of how the electric guitar came to be.</p>`, people: ["les-paul"], video: "les-paul" },
    ],
  },
  {
    id: "lesson-capo", title: "The capo: play in any key", subtitle: "Same shapes, higher sound",
    pages: [
      { html: `<h3>A capo is a clamp that moves the nut.</h3>
        <p>Clip it across all six strings just behind a fret, and every open-chord shape now sounds higher by that many half-steps. That's how guitarists play songs in hard keys with easy shapes.</p>
        <p>Example: "I'm Yours" is in <strong>B major</strong> (B – F# – G#m – E — lots of barre chords). With a <strong>capo on the 4th fret</strong>, you play the easy shapes <strong>G – D – Em – C</strong> and it sounds exactly right. Every song in the Songs tab shows its easiest capo.</p>`,
        diagrams: ["G", "D", "Em", "C"] },
    ],
  },
  {
    id: "lesson-tab", title: "Reading tab — and your first melodies", subtitle: "Single notes with the microphone",
    pages: [
      { html: `<h3>Tab = a picture of the strings.</h3>
        <p>Six lines are the six strings — the <strong>top line is the thin high e string</strong>, the bottom line is the low E. A number tells you which fret to press on that string; 0 means play it open. Read left to right.</p>`,
        tab: { items: melody([[5, 0], [5, 1], [5, 3], [4, 0], [4, 1], [4, 3]])(), beatsPerBar: 6, bars: 1 } },
      { html: `<h3>Ode to Joy (Beethoven, 1824 — public domain)</h3>
        <p>All on the B and high e strings. Try <strong>Wait for me</strong> with the <strong>microphone</strong> on — play each note on your guitar and the music waits until it hears it.</p>`,
        practice: { items: melody([[5, 0], [5, 0], [5, 1], [5, 3], [5, 3], [5, 1], [5, 0], [4, 3], [4, 1], [4, 1], [4, 3], [5, 0], [5, 0, 1.5], [4, 3, 0.5], [4, 3, 2]]), bpm: 80, modes: ["listen", "wait", "timed"], mic: true, label: "Ode to Joy", showTab: true } },
    ],
  },
  {
    id: "lesson-power", title: "Power chords and palm muting", subtitle: "The rock sound",
    pages: [
      { html: `<h3>Two notes, huge sound.</h3>
        <p>A <strong>power chord</strong> is just a root and the note a fifth above it — no third, so it's neither major nor minor, and it sounds great with distortion. Shape: index on the root (6th or 5th string), ring finger two frets higher on the next string. Written "E5", "A5", "G5".</p>
        <p><strong>Palm muting:</strong> rest the side of your picking hand lightly on the strings right by the bridge for that chunky, chugging sound.</p>`,
        diagrams: ["E5", "A5", "G5", "D5"],
        practice: { items: () => chordTimeline(shapes(["E5", "G5", "A5", "A5", "E5", "G5", "D5", "A5"]), { beatsPerChord: 2, pattern: ["down", "down", "down", "down"] }), bpm: 90, modes: ["listen"], label: "A power-chord riff" } },
    ],
  },
  {
    id: "lesson-redspecial", fun: true, title: "Just for fun: the guitar built from a fireplace", subtitle: "Brian May & his dad",
    pages: [
      { html: `<h3>A father-and-son project that went to stadiums</h3>
        <p>In August 1963, a teenage <strong>Brian May</strong> — later the guitarist of <strong>Queen</strong> — couldn't afford the guitar he wanted. So he and his dad, <strong>Harold</strong>, built one at home.</p>
        <p>The neck was carved from wood from a <strong>century-old fireplace mantel</strong> a family friend was throwing out (Brian filled the wormholes with matchsticks). They finished it in October 1964 and called it the <strong>Red Special</strong>. Brian has played it on almost every Queen record and concert since.</p>
        <p class="jg-note">This story is sometimes mixed up with Led Zeppelin — it's actually Brian May of Queen, and the guitar is now one of the most famous instruments in rock.</p>`, people: ["brian-may"], video: "brian-may-red-special" },
    ],
  },
  {
    id: "lesson-barre", title: "Barre chords: F and Bm", subtitle: "One shape, every chord",
    pages: [
      { html: `<h3>Your index finger becomes the nut.</h3>
        <p>Lay your index finger flat across all the strings at one fret (a <strong>barre</strong>), and make an E-shape or A-shape chord with your other fingers in front of it.</p>
        <p>Remember the baby F? Now it's time for the full one. <strong>F</strong> is the E-shape at the 1st fret. <strong>Bm</strong> is the A-minor shape at the 2nd fret. Tips: roll your index slightly onto its bony side, keep your elbow in, and press just enough.</p>`,
        diagrams: ["F", "Bm"], shape: "F" },
      { html: `<h3>Movable: slide the shape, change the chord.</h3>
        <p>The E-shape barre with its root on the 6th string: 1st fret = F, 3rd = G, 5th = A, 7th = B, 8th = C. The A-shape with its root on the 5th string: 2nd = B, 3rd = C, 5th = D, 7th = E. That's every major and minor chord, anywhere.</p>`,
        diagrams: ["F", "G#m", "Bb", "C#m", "Bm", "F#"],
        practice: { items: strumItems(["F", "C", "G", "Am", "F", "C", "G", "C"]), bpm: 66, modes: ["listen", "wait"], label: "F – C – G – Am" } },
    ],
  },
  {
    id: "lesson-sevenths", title: "7th chords and the 12-bar blues", subtitle: "The bluesy sound",
    pages: [
      { html: `<h3>Add a note, get the blues.</h3>
        <p>A <strong>7th chord</strong> adds a fourth note that makes the chord want to move on. The open ones — A7, D7, E7 — are the sound of the blues.</p>
        <p>The <strong>12-bar blues</strong> in A: four bars of A7, two of D7, two of A7, then E7, D7, A7, E7. It's behind thousands of songs.</p>`,
        diagrams: ["A7", "D7", "E7"],
        practice: { items: strumItems(["A7", "A7", "A7", "A7", "D7", "D7", "A7", "A7", "E7", "D7", "A7", "E7"]), bpm: 92, modes: ["listen"], label: "12-bar blues in A" } },
    ],
  },
  {
    id: "lesson-genres", title: "Music has flavours: genres", subtitle: "Pop, rock, blues, jazz, reggae, classical",
    pages: [
      { html: `<h3>Same guitar, different flavours 🍦</h3>
        <p>Styles of music are called <strong>genres</strong>: <strong>pop</strong>, <strong>rock</strong>, <strong>blues</strong>, <strong>jazz</strong>, <strong>reggae</strong>, <strong>classical</strong>, and many more like country and R&amp;B.</p>
        <p>What changes is <strong>which chords</strong> they love and <strong>how you strum or pick</strong> them. Let's taste six.</p>` },
      { html: `<h3>Pop: catchy chords, round and round</h3>
        <p>Pop loves a short loop of 4 chords you can sing over. You already know the most famous one: <strong>G – D – Em – C</strong>, with the D · DU · UDU strum.</p>`,
        diagrams: ["G", "D", "Em", "C"], practice: { items: strumItems(["G", "D", "Em", "C"], DDUUDU), bpm: 80, modes: ["listen", "wait"], label: "Pop: G D Em C" } },
      { html: `<h3>Rock: big, strong chords</h3>
        <p>Rock plays simple chords <strong>loud and driving</strong>, often with strong downstrums or power chords. A rock favourite: <strong>D – C – G</strong>, the chords of <em>Sweet Home Alabama</em> by Lynyrd Skynyrd.</p>`,
        diagrams: ["D", "C", "G"], practice: { items: strumItems(["D", "C", "G", "G"], ["down", "down", "down", "down", "down", "down", "down", "down"]), bpm: 96, modes: ["listen", "wait"], label: "Rock: D C G, all downstrums" } },
      { html: `<h3>Blues: the parent of rock and jazz</h3>
        <p>The blues came from African American musicians in the southern United States in the late 1800s. The <strong>12-bar blues</strong> uses chords <strong>1, 4 and 5</strong> as 7th chords. In A: <strong>A7, D7, E7</strong>.</p>`,
        diagrams: ["A7", "D7", "E7"], practice: { items: strumItems(["A7", "A7", "A7", "A7", "D7", "D7", "A7", "A7", "E7", "D7", "A7", "E7"]), bpm: 92, modes: ["listen"], label: "12-bar blues in A" } },
      { html: `<h3>Jazz: rich chords and the famous 2 – 5 – 1</h3>
        <p>Jazz grew out of the blues in <strong>New Orleans</strong> in the early 1900s. It loves rich 4-note chords and making things up as you go. Its most famous move is <strong>2 – 5 – 1</strong>: in C, <strong>Dm7 – G7 – Cmaj7</strong>. You'll hear it in <em>Autumn Leaves</em> and <em>Fly Me to the Moon</em>.</p>`,
        diagrams: ["Dm7", "G7", "Cmaj7"], practice: { items: strumItems(["Dm7", "G7", "Cmaj7", "Cmaj7"]), bpm: 72, modes: ["listen", "wait"], label: "Jazz: Dm7 G7 Cmaj7" } },
      { html: `<h3>Reggae: strum on the off-beat</h3>
        <p>Reggae from Jamaica flips the strum: short, choppy chords on the <strong>"&amp;"</strong> between the beats, never on the beat. Bob Marley's <em>Three Little Birds</em> uses just <strong>A, D and E</strong>.</p>
        <p class="jg-note">Count "1 & 2 & 3 & 4 &" and only strum (a quick upstroke) on each "&".</p>`,
        diagrams: ["A", "D", "E"], practice: { items: strumItems(["A", "D", "A", "E"], [null, "up", null, "up", null, "up", null, "up"]), bpm: 76, modes: ["listen"], label: "Reggae: upstrokes on the off-beat" } },
      { html: `<h3>Classical: fingers, not a pick</h3>
        <p>Classical guitar is played with the <strong>fingers</strong>, picking the strings one at a time: a chord becomes a little melody. You'll learn it properly in the Fingerpicking and Classical guitar lessons.</p>
        <h3>Which flavour is yours?</h3>
        <p>Pick songs from the style you love most and you'll practise more. Find them in <strong>Songs</strong>, or upload any song in <strong>Practice</strong>.</p>`,
        diagrams: ["Am"], practice: { items: () => [[4, 0], [3, 2], [2, 2], [1, 1], [0, 0], [1, 1], [2, 2], [3, 2]].map(([string, fret], i) => ({ string, fret, start: i * 0.5, dur: 0.5 })), bpm: 70, modes: ["listen"], label: "Am, one string at a time" } },
    ],
  },
];

const INTERMEDIATE = [
  {
    id: "lesson-pentatonic", title: "Scales: the minor pentatonic", subtitle: "The solo scale",
    pages: [
      { html: `<h3>Five notes behind countless rock and blues solos.</h3>
        <p>The <strong>minor pentatonic</strong> has just five notes, and they all sound good together. Here's "box 1" in <strong>A minor</strong>, starting at the 5th fret: index finger plays everything at fret 5, ring or pinky the higher frets. Roots (A) are highlighted.</p>
        <p>Play it up and back down slowly with <strong>Wait for me</strong> and the microphone — clean before fast.</p>`,
        notes: AMIN_PENT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(AMIN_PENT), bpm: 72, modes: ["listen", "wait", "timed"], mic: true, label: "A minor pentatonic, box 1", showTab: true } },
      { html: `<h3>The same box, anywhere.</h3>
        <p>Slide the whole shape so your index starts on a different root and it's the pentatonic of that key — at the 7th fret it's <strong>B minor</strong> (you'll use that for the Hotel California and November Rain lessons).</p>`,
        notes: BMIN_PENT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })) },
    ],
  },
  {
    id: "lesson-looping", title: "Looping: rhythm and lead", subtitle: "With a friend, or with a loop pedal",
    pages: [
      { html: `<h3>Two jobs in every band: rhythm and lead.</h3>
        <p><strong>Rhythm</strong> plays the chords over and over: the loop that holds the song together. <strong>Lead</strong> plays single notes on top: the melody or the solo.</p>
        <p>Now that you know chords <em>and</em> the minor pentatonic, you can do both. Here's the loop we'll use, in A minor: <strong>Am → G → F → G</strong>, one bar each.</p>`,
        diagrams: ["Am", "G", "F", "G"],
        practice: { items: strumItems(["Am", "G", "F", "G"], DDUUDU), bpm: 80, modes: ["listen"], label: "The loop: Am G F G (tap Loop to keep it going)" } },
      { html: `<h3>With a friend: one plays rhythm, one plays lead.</h3>
        <ol>
          <li><strong>Friend 1 (rhythm)</strong> strums Am → G → F → G again and again, steady, not too loud.</li>
          <li><strong>Friend 2 (lead)</strong> plays notes from the A minor pentatonic box (5th fret), any order, any rhythm. Every note in the box fits.</li>
          <li>After a few rounds, <strong>swap</strong>.</li>
        </ol>
        <p>Tips for lead: start on an <strong>A</strong> (the root), leave gaps, and repeat little ideas. Simple sounds better than fast.</p>`,
        notes: AMIN_PENT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })) },
      { html: `<h3>On your own: let the app be your rhythm player.</h3>
        <p>Play the loop below and tap <strong>Loop</strong> so it keeps going. Then improvise with the A minor pentatonic over it.</p>
        <p>When you get bored of A minor, slide the box to the 7th fret and the loop up two frets (Bm → A → G → A): same idea, new key.</p>`,
        practice: { items: strumItems(["Am", "G", "F", "G", "Am", "G", "F", "G"], DDUUDU), bpm: 80, modes: ["listen"], label: "Backing loop: Am G F G" } },
      LOOP_PEDAL_PAGE,
      LOOP_GEAR_PAGE,
    ],
  },
  {
    id: "lesson-major-scale", title: "The major scale", subtitle: "Do re mi on the fretboard",
    pages: [
      { html: `<h3>G major, in one position.</h3>
        <p>Seven notes — do, re, mi, fa, so, la, ti — the scale most melodies come from. This position covers frets 2 to 5, one finger per fret (index on 2, middle 3, ring 4, pinky 5). Roots (G) highlighted.</p>`,
        notes: GMAJ.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(GMAJ), bpm: 72, modes: ["listen", "wait", "timed"], mic: true, label: "G major scale", showTab: true } },
    ],
  },
  {
    id: "lesson-scale-practice", title: "How to practise scales", subtitle: "A 10-minute routine that works",
    pages: [
      { html: `<h3>Scales are workouts for your fingers and ears</h3>
        <p>Practising scales builds speed, accuracy and the "map" of the fretboard you'll use for solos. A simple daily routine:</p>
        <ol>
          <li><strong>Slow and clean first.</strong> Set the metronome where you can play every note perfectly — even 60 BPM. Speed comes later, by itself.</li>
          <li><strong>One finger per fret.</strong> In a 4-fret box, index takes the lowest fret, pinky the highest. Keep fingers hovering close to the strings.</li>
          <li><strong>Alternate picking:</strong> down, up, down, up — never two downs in a row.</li>
          <li><strong>Up and back down</strong>, then play it in <strong>groups of three</strong> (1-2-3, 2-3-4, 3-4-5…) so your fingers learn the shape, not just a list.</li>
          <li><strong>Raise the tempo 5 BPM</strong> only after three clean runs in a row.</li>
          <li><strong>Make music:</strong> finish by improvising a little over a chord loop — that's what scales are for!</li>
        </ol>
        <p class="jg-note">The Practice tab has every scale in every key and position, with Wait for me and Play in time.</p>` },
      { html: `<h3>Too fast for your fingers? Easy tricks 🐾</h3>
        <ul>
          <li><strong>Slow first:</strong> start with a metronome at about 60 BPM. Only go 5–10 BPM faster once it's clean. Speed comes from clean, not from rushing.</li>
          <li><strong>Down, up, down, up:</strong> alternate your pick, even when you change strings. No wasted movements.</li>
          <li><strong>Stay close:</strong> keep your fingers a few millimetres above the strings, and the pick only just past the string.</li>
          <li><strong>Bursts:</strong> play just 3–4 notes fast, rest, repeat. Short bursts build speed without tiring your hand.</li>
          <li><strong>Hammer-ons and pull-offs:</strong> let your fretting fingers sound some notes so you don't have to pick every one. Runs get smooth and fast.</li>
          <li><strong>One finger per fret:</strong> in the pentatonic box, each finger owns one fret, so your hand never has to think.</li>
        </ul>
        <p class="jg-note">Tips from JustinGuitar and Guitar World.</p>` },
      { html: `<h3>Try it: A minor pentatonic in groups of three</h3>
        <p>Each group starts one note higher: notes 1-2-3, then 2-3-4, then 3-4-5… Use alternate picking and Wait for me first.</p>`,
        notes: AMIN_PENT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: () => {
          const out = [];
          let t = 0;
          for (let i = 0; i + 2 < AMIN_PENT.length; i++) {
            for (let k = 0; k < 3; k++) {
              const n = AMIN_PENT[i + k];
              out.push({ string: n.string, fret: n.fret, start: t, dur: 1 / 3 });
              t += 1 / 3;
            }
          }
          return out;
        }, bpm: 60, modes: ["listen", "wait", "timed"], mic: true, label: "Pentatonic in threes", showTab: true } },
    ],
  },
  {
    id: "lesson-techniques", title: "Lead techniques", subtitle: "Bends, hammer-ons, pull-offs, slides, vibrato",
    pages: [
      { html: `<h3>How solos "talk"</h3>
        <ul>
          <li><strong>Bend (b):</strong> push the string up toward the ceiling to raise the pitch — usually a whole step (two frets' worth). Use two or three fingers together for strength. Tab: <code>7b9</code>.</li>
          <li><strong>Hammer-on (h):</strong> pick one note, then slam another finger down higher on the same string without picking. Tab: <code>5h7</code>.</li>
          <li><strong>Pull-off (p):</strong> the reverse — flick a finger off the string to sound the lower note. Tab: <code>7p5</code>.</li>
          <li><strong>Slide (/ or \\):</strong> pick, then glide along the string to another fret, keeping pressure. Tab: <code>5/7</code>.</li>
          <li><strong>Vibrato (~):</strong> rock the string slightly up and down to make a held note sing.</li>
        </ul>
        <p class="jg-note">The trick for good bends: bend <em>to a real note</em>. Play the target note two frets higher first, then bend until it sounds the same.</p>` },
    ],
  },
  {
    id: "lesson-minor-scales", title: "Minor scales: natural and harmonic", subtitle: "The sound of B minor",
    pages: [
      { html: `<h3>Natural minor = pentatonic + 2 notes.</h3>
        <p>The <strong>natural minor</strong> scale fills in the pentatonic's gaps with two more notes for a fuller, more melodic sound. In <strong>B minor</strong>: B C# D E F# G A.</p>
        <p>The <strong>harmonic minor</strong> raises the 7th note (A → A#), which creates a strong pull back home — that's the dramatic, slightly exotic sound you hear over an F#7 chord in B minor.</p>`,
        notes: BMIN_NAT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(BMIN_NAT), bpm: 72, modes: ["listen", "wait"], mic: true, label: "B natural minor", showTab: true } },
    ],
  },
  {
    id: "lesson-all-chords", title: "Learn every chord", subtitle: "Recipes, shapes and the chord library",
    pages: [
      { html: `<h3>Every chord is a recipe</h3>
        <p>Chords are built from the notes of a scale. Count up from the chord's root note:</p>
        <table class="jg-table">
          <tr><th>Major</th><td>root + 4 half-steps + 3 more (1 – 3 – 5)</td><td>happy</td></tr>
          <tr><th>Minor (m)</th><td>root + 3 half-steps + 4 more (1 – ♭3 – 5)</td><td>sad</td></tr>
          <tr><th>7 (dominant)</th><td>major + a ♭7</td><td>bluesy, wants to move</td></tr>
          <tr><th>maj7</th><td>major + a 7</td><td>dreamy, jazzy</td></tr>
          <tr><th>m7</th><td>minor + a ♭7</td><td>smooth, soulful</td></tr>
          <tr><th>sus2 / sus4</th><td>the 3rd swapped for a 2nd / 4th</td><td>open, floating</td></tr>
          <tr><th>5 (power)</th><td>root + 5th only</td><td>rock</td></tr>
        </table>
        <p>That's why one finger changes E into Em: it moves the 3rd down a half step.</p>`,
        diagrams: ["E", "Em", "E7", "Emaj7", "Em7", "Esus4"] },
      { html: `<h3>12 roots × these recipes = every common chord</h3>
        <p>You don't memorise hundreds of shapes. You learn the <strong>open chords</strong> (C A G E D and their minors and 7ths), then use <strong>barre shapes</strong> to move them anywhere:</p>
        <ul>
          <li><strong>E-shape barre</strong>, root on the 6th string: fret 1 = F, 3 = G, 5 = A, 7 = B, 8 = C.</li>
          <li><strong>A-shape barre</strong>, root on the 5th string: fret 2 = B, 3 = C, 5 = D, 7 = E.</li>
        </ul>
        <p>Open the <strong>Practice tab → All chords</strong> to see and hear every chord in every key, and quiz yourself. A good goal: learn 2 new chords a week, and practise switching between them.</p>`,
        diagrams: ["F", "Fm", "F7", "Bb", "Bbm", "Bb7"] },
    ],
  },
  {
    id: "lesson-hotel", title: "Solo study: Hotel California", subtitle: "Eagles, 1976",
    pages: [
      { html: `<h3>One of the most famous guitar solos ever.</h3>
        <p>The song's long outro solo is played by <strong>Don Felder</strong> and <strong>Joe Walsh</strong>, trading lines and then playing together in harmony with flowing arpeggios. In 1998, readers of <em>Guitarist</em> magazine voted it the best guitar solo of all time.</p>
        <p>The solo is copyrighted, so we won't copy it note for note — instead you'll learn what it's <strong>built from</strong>: its chord progression, its scales, and the techniques.</p>`, people: ["don-felder", "joe-walsh"], video: "hotel-california" },
      { html: `<h3>The chords underneath: B minor</h3>
        <p><strong>Bm – F#7 – A – E – G – D – Em – F#7</strong>. Learn to strum it first — every lick in the solo is aimed at these chords.</p>`,
        diagrams: ["Bm", "F#7", "A", "E", "G", "D", "Em", "F#7"],
        practice: { items: strumItems(["Bm", "F#7", "A", "E", "G", "D", "Em", "F#7"]), bpm: 74, modes: ["listen"], label: "Hotel California progression" } },
      { html: `<h3>The scales</h3>
        <p>The solo mostly uses <strong>B minor pentatonic</strong> and <strong>B natural minor</strong> (7th position), and leans on the <strong>harmonic minor</strong>'s A# whenever the F#7 chord comes round. A great habit it teaches: <strong>target the notes of the chord that's playing</strong> — e.g. land on F# or A# over F#7, on D over D.</p>
        <p>Practice idea (our own lick, not the record's): play B minor pentatonic over the progression in the Practice tab, and finish each phrase on a note of the current chord.</p>`,
        notes: BMIN_PENT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(BMIN_PENT), bpm: 80, modes: ["listen", "wait"], mic: true, label: "B minor pentatonic, 7th position", showTab: true } },
      { html: `<h3>The twin-guitar trick: harmony in thirds</h3>
        <p>For the famous ending, two guitars play the same melody at the same time, one a <strong>third</strong> above the other (about two scale steps higher). Try it with a friend: one plays the B minor scale from B, the other plays it from D, in step together.</p>` },
    ],
  },
  {
    id: "lesson-november", title: "Solo study: November Rain", subtitle: "Guns N' Roses, 1992",
    pages: [
      { html: `<h3>Slash's slow-burn solos</h3>
        <p>"November Rain" is a nearly nine-minute power ballad, led by Axl Rose's piano with an orchestra behind the band. <strong>Slash</strong> plays melodic solos full of long bends and wide vibrato, and for the finale the band kicks into a heavier outro with his most famous solo of the song.</p>
        <p class="jg-note">Guns N' Roses tune their guitars down a half step (to E♭), so to play along with the record you'd tune each string one half-step lower. The scales and shapes stay exactly the same.</p>
        <p>We'll practise his style in B minor — a classic, comfortable key for this kind of lead playing.</p>
        <p>Like Hotel California, the solos are copyrighted — so here's what they're made of.</p>`, people: ["slash"], video: "november-rain" },
      { html: `<h3>Make a note sing: bend + vibrato</h3>
        <p>Slash's signature is a <strong>whole-step bend held with vibrato</strong>. In B minor pentatonic (7th position): bend the G string at the 9th fret up a whole step (to sound like the 11th fret), hold it, and add vibrato. Then the B string 10th fret bent up to the sound of the 12th.</p>
        <p>Practice the scale below slowly, then work bends into the top notes.</p>`,
        notes: BMIN_PENT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(BMIN_PENT), bpm: 70, modes: ["listen", "wait", "timed"], mic: true, label: "B minor pentatonic", showTab: true } },
    ],
  },
  {
    id: "lesson-fingerpicking", title: "Fingerpicking", subtitle: "Thumb on the bass, fingers on top",
    pages: [
      { html: `<h3>Each finger gets a job.</h3>
        <p>Your <strong>thumb (p)</strong> plays the bass strings (6, 5, 4); <strong>index (i)</strong> the 3rd string; <strong>middle (m)</strong> the 2nd; <strong>ring (a)</strong> the 1st. A simple pattern over C: thumb on the 5th string, then i, m, a, m, i.</p>
        <p><strong>Travis picking</strong> (named after Merle Travis) keeps the thumb alternating between two bass strings while the fingers add melody on top — the sound of countless folk and country songs.</p>`, people: ["merle-travis"],
        diagrams: ["C", "G", "Am", "Em"],
        practice: { items: () => {
          const pat = (s, root) => [[root, 0], [3, 1], [4, 2], [5, 3], [4, 4], [3, 5]].map(([str, k]) => ({ string: str, fret: s.frets[str], start: k * 0.5, dur: 0.5 }));
          const out = [];
          ["C", "G", "Am", "Em"].forEach((c, i) => {
            const s = chordShape(c);
            const root = c === "C" || c === "Am" ? 1 : 0;
            pat(s, root).forEach((n) => out.push({ ...n, start: n.start + i * 3 }));
          });
          return out;
        }, bpm: 70, modes: ["listen", "wait"], mic: true, label: "p-i-m-a-m-i over C – G – Am – Em", showTab: true } },
    ],
  },
  {
    id: "lesson-stairway", title: "Song study: Stairway to Heaven", subtitle: "Led Zeppelin, 1971 — fingerpicking to a solo",
    pages: [
      { html: `<h3>One of the most famous guitar songs ever</h3>
        <p>"Stairway to Heaven" was written by <strong>Jimmy Page</strong> and <strong>Robert Plant</strong> and released on Led Zeppelin's fourth album in <strong>1971</strong>. It was never released as a single in the UK or US — yet it became one of the most-played rock songs on radio.</p>
        <p>It grows like a staircase: it starts soft, fingerpicked with recorders, adds a 12-string guitar, then drums, and ends as full-on hard rock with a famous solo. Page recorded that solo on a <strong>Fender Telecaster</strong> he'd been given by his friend Jeff Beck. Live, he played a <strong>double-neck guitar</strong> — a 12-string neck on top and a 6-string neck below — so he could switch parts without changing guitars.</p>
        <p class="jg-note">The recording is copyrighted, so we don't copy Page's guitar part note for note. You'll learn what it's built from — the chords, the bass line, the picking style and the scale — and play our own exercises with them.</p>`, people: ["jimmy-page", "robert-plant"], video: "stairway" },
      { html: `<h3>The secret: a bass line that walks down</h3>
        <p>The intro keeps the <strong>A minor</strong> sound on top while the lowest note steps down one fret at a time: <strong>A → G# → G → F# → F</strong>. Each step makes a new chord name, even though your top fingers barely move:</p>
        <p><strong>Am – Am/G# – Am/G – D/F# – Fmaj7</strong>, then <strong>G</strong> and back to <strong>Am</strong>.</p>
        <p class="jg-note">A slash chord like "Am/G#" means "Am, with G# as the lowest note". Watch the bass note on the low strings move down in the diagrams.</p>`,
        diagrams: ["Am", "Am/G#", "Am/G", "D/F#", "Fmaj7", "G"] },
      { html: `<h3>Fingerpick it (our own exercise)</h3>
        <p>Thumb plays the bass note, then index, middle and ring fingers play the G, B and high e strings — the p-i-m-a pattern from the Fingerpicking lesson. Go slowly with <strong>Wait for me</strong> and the microphone: hear the bass walk down underneath.</p>`,
        diagrams: ["Am", "Am/G#", "Am/G", "D/F#", "Fmaj7", "G"],
        practice: { items: () => {
          const out = [];
          ["Am", "Am/G#", "Am/G", "D/F#", "Fmaj7", "G", "Am", "Am"].forEach((c, i) => {
            const sh = chordShape(c);
            const bass = sh.frets.findIndex((f) => f >= 0);
            [[bass, 0], [3, 1], [4, 2], [5, 3]].forEach(([str, k]) => out.push({ string: str, fret: sh.frets[str], start: i * 2 + k * 0.5, dur: 0.5 }));
          });
          return out;
        }, bpm: 66, modes: ["listen", "wait", "timed"], mic: true, label: "Walking bass, p-i-m-a", showTab: true } },
      { html: `<h3>The 12-string part: strum C – D – Fmaj7 – Am</h3>
        <p>In the middle of the song the chords open up around <strong>C, D, Fmaj7 and Am</strong>. Strum them gently with the D · D U · U D U pattern — if you have a 12-string guitar, this is where it shines.</p>`,
        diagrams: ["C", "D", "Fmaj7", "Am"],
        practice: { items: strumItems(["C", "D", "Fmaj7", "Am", "C", "D", "Fmaj7", "Am"], DDUUDU), bpm: 72, modes: ["listen", "wait"], label: "C – D – Fmaj7 – Am", drums: true } },
      { html: `<h3>The solo: A minor pentatonic over Am – G – F</h3>
        <p>For the big ending, the band repeats <strong>Am – G – F</strong> and Page solos over it, mostly using the <strong>A minor pentatonic</strong> — the very first scale box you learned, at the <strong>5th fret</strong>. That's why it's such a great first "real" solo to explore.</p>
        <p>Practice the box below, then make up your own lines over the loop in the Practice tab (try Am, G, F with Downs ×4). A good habit: end each phrase on a note of the current chord — <strong>A</strong> over Am, <strong>G</strong> over G, <strong>F</strong> or <strong>C</strong> over F.</p>`,
        notes: AMIN_PENT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(AMIN_PENT), bpm: 84, modes: ["listen", "wait", "timed"], mic: true, label: "A minor pentatonic, 5th position", showTab: true } },
    ],
  },
  {
    id: "lesson-classical", title: "Classical guitar: playing with your fingers", subtitle: "Spain — Tárrega, Segovia and Romance",
    people: ["tarrega", "segovia"],
    pages: [
      { html: `<h3>The guitar's home: Spain</h3>
        <p>The six-string classical guitar as we know it took shape in <strong>Spain</strong> in the 1800s — the luthier <strong>Antonio de Torres</strong> designed the bigger body and fan-shaped bracing still used today. Composer <strong>Francisco Tárrega</strong> wrote beautiful pieces for it, and later <strong>Andrés Segovia</strong> carried it onto the world's great concert stages, proving the guitar could be a serious solo instrument.</p>
        <p>Classical guitarists use <strong>nylon strings</strong>, play with their <strong>fingers and nails</strong> (no pick), and sit with the guitar on the left leg, raised by a footstool.</p>`, people: ["tarrega", "segovia"], video: "segovia" },
      { html: `<h3>Your picking fingers have Spanish names</h3>
        <table class="jg-table">
          <tr><th>p</th><td>pulgar — thumb</td><td>plays the bass strings (6, 5, 4)</td></tr>
          <tr><th>i</th><td>índice — index</td><td>usually the G string</td></tr>
          <tr><th>m</th><td>medio — middle</td><td>usually the B string</td></tr>
          <tr><th>a</th><td>anular — ring</td><td>usually the high e string</td></tr>
        </table>
        <h3>Two ways to pluck</h3>
        <ul>
          <li><strong>Free stroke</strong> (tirando): pluck the string and your finger swings up into your palm, missing the next string. Used for chords and arpeggios.</li>
          <li><strong>Rest stroke</strong> (apoyando): pluck "through" the string so your finger comes to rest on the next string. Fuller and louder — for melodies.</li>
        </ul>
        <p>Keep your wrist slightly arched and still; the movement comes from the finger joints. Pluck from the fingertip, not the whole hand.</p>
        <p class="jg-note">Listen to the famous "tremolo" piece <em>Recuerdos de la Alhambra</em> (Tárrega, 1896) — the melody is one note plucked by a-m-i in a super-fast blur, with the thumb playing the bass.</p>`, video: "recuerdos" },
      { html: `<h3>Spanish plucking feels hard? Easy tricks 🐾</h3>
        <p>Like the <strong>baby F</strong> for barre chords, there are easy ways in:</p>
        <ul>
          <li><strong>Thumb first:</strong> play only the bass strings with your thumb (p) and get a steady beat. Then add index and middle (i, m) on the thin strings.</li>
          <li><strong>Rest stroke:</strong> after plucking, let your finger land and rest on the next string. It stops your finger wandering and gives a full, strong tone.</li>
          <li><strong>Plant your fingers:</strong> touch each finger to its string before you play it, so your hand stays in place.</li>
          <li><strong>Easy flamenco strum (rasgueado):</strong> rest your thumb by the sound hole, curl your index finger in, then <strong>flick it out</strong> down across the strings. That one flick already sounds Spanish!</li>
          <li><strong>Slow, with a metronome</strong>, before trying the fast four-finger rolls.</li>
        </ul>
        <p class="jg-note">Tips from Fender, Classical Guitar Corner and Guitar World.</p>` },
      { html: `<h3>Next song to practise: "Bamboléo" 💃</h3>
        <p>A famous Spanish-style rumba by the <strong>Gipsy Kings</strong> (1987), full of flamenco strumming. Listen to the guitars!</p>
        <p>It's in <strong>F♯ minor</strong> and swings between <strong>F♯m</strong> and <strong>C♯7</strong>, with <strong>Bm</strong> and <strong>D</strong> in the chorus.</p>
        <p><strong>Easy way:</strong> put a <strong>capo on fret 2</strong> and play the shapes <strong>Em, B7, Am, C</strong>. It sounds just like the record. Try your new flick strum on it!</p>`,
        diagrams: ["Em", "B7", "Am", "C"], video: "bamboleo" },
      { html: `<h3>Romance — "Spanish Romance" (traditional, public domain)</h3>
        <p>Nobody knows for sure who wrote this famous piece — that's why it's called <em>Romance anónimo</em>. It's in 3/4 time: each beat is three notes — the <strong>melody on the high e string</strong> (finger a, a rest stroke if you like), then the open <strong>B</strong> (m) and <strong>G</strong> (i) strings, with the <strong>low E</strong> bass (p) at the start of each bar. Here are the first four bars over E minor:</p>`,
        video: "romance",
        practice: { items: () => {
          const melodyFrets = [[7, 7, 7], [7, 5, 3], [3, 2, 0], [0, 3, 7]];
          const out = [];
          melodyFrets.forEach((bar, b) => {
            out.push({ string: 0, fret: 0, start: b * 3, dur: 3 });
            bar.forEach((f, k) => {
              const t = b * 3 + k;
              out.push({ string: 5, fret: f, start: t, dur: 1 / 3 });
              out.push({ string: 4, fret: 0, start: t + 1 / 3, dur: 1 / 3 });
              out.push({ string: 3, fret: 0, start: t + 2 / 3, dur: 1 / 3 });
            });
          });
          return out;
        }, bpm: 50, modes: ["listen", "wait"], mic: true, label: "Romance — bars 1-4 (p-a-m-i)", showTab: true } },
    ],
  },
  {
    id: "lesson-world", title: "Guitar around the world", subtitle: "Flamenco, Italian tremolo, bossa nova, slack key and more",
    pages: [
      { html: `<h3>🇪🇸 Flamenco: the fastest strumming you'll ever see</h3>
        <p>Flamenco comes from Andalusia in southern Spain. Its guitarists — like the legendary <strong>Paco de Lucía</strong> — play with fingers and nails, tap on the guitar's body, and use the <strong>rasgueado</strong>: flicking the fingers out one after another across the strings — little finger, ring, middle, index — so fast it sounds like a drum roll.</p>
        <p>The classic flamenco chord walk is the <strong>Andalusian cadence</strong>: <strong>Am – G – F – E</strong>, falling step by step to that dramatic E chord. Below: a 4-finger rasgueado burst on each chord, then strums. Practise slowly; flamenco players spend years on this!</p>
        <p><strong>Next song to practise:</strong> "Bamboléo" by the Gipsy Kings. Find it in <strong>Songs</strong> (capo 2, shapes Em B7 Am C), with the official video.</p>`,
        people: ["paco-de-lucia"], video: "flamenco",
        diagrams: ["Am", "G", "F", "E"],
        practice: { items: () => chordTimeline(shapes(["Am", "G", "F", "E", "Am", "G", "F", "E"]), { beatsPerChord: 4, pattern: ["down", "down", "down", "down", "down", null, "up", null, "down", "down", "down", "down", "down", null, "up", null] }), bpm: 70, modes: ["listen", "wait"], label: "Andalusian cadence with rasgueado" } },
      { html: `<h3>🇮🇹 Italy and the Godfather sound: tremolo picking</h3>
        <p>Italian mandolin players make a single note <strong>sing</strong> by picking it super fast — down-up-down-up — over and over. That's <strong>tremolo picking</strong>. It's the shimmering sound guitarists use when they play the love theme from <strong>The Godfather</strong> (1972), composed by <strong>Nino Rota</strong>.</p>
        <p>The Godfather music is copyrighted, so we won't print it — but here's the technique on our own little A-minor melody. Each note is picked four times, as fast and even as you can. Keep your wrist loose, use small movements, and let the pick just graze the string.</p>
        <p class="jg-note">Classical guitarists do tremolo with their fingers instead (p-a-m-i, very fast) — listen to Tárrega's <em>Recuerdos de la Alhambra</em> (1896), the most famous tremolo piece ever.</p>`,
        people: ["nino-rota"], video: "godfather-tremolo",
        practice: { items: () => {
          const tune = [[5, 0], [5, 1], [5, 0], [4, 3], [4, 1], [4, 0], [4, 1], [3, 2], [3, 2], [4, 0], [4, 1], [5, 0]];
          const out = [];
          tune.forEach(([str, f], i) => { for (let k = 0; k < 4; k++) out.push({ string: str, fret: f, start: i + k * 0.25, dur: 0.25 }); });
          return out;
        }, bpm: 60, modes: ["listen", "wait"], mic: true, label: "Tremolo melody in A minor", showTab: true } },
      { html: `<h3>🇧🇷 Brazil: bossa nova</h3>
        <p>In the late 1950s in Rio de Janeiro, <strong>João Gilberto</strong> invented a quiet, swinging guitar style called <strong>bossa nova</strong> ("new trend"). His thumb plays a steady bass on every beat while his fingers pluck the chord off the beat, like a samba drum group squeezed onto one guitar. Jazzy chords like <strong>Am7</strong> and <strong>D7</strong> are its colours.</p>`,
        people: ["joao-gilberto"], video: "bossa-nova",
        diagrams: ["Am7", "D7"],
        practice: { items: () => {
          const out = [];
          const parts = [
            { chord: "Am7", bass: [1, 0], top: { frets: [-1, -1, 2, 0, 1, 0] } },
            { chord: "D7", bass: [2, 0], top: { frets: [-1, -1, -1, 2, 1, 2] } },
          ];
          for (let bar = 0; bar < 4; bar++) {
            const pt = parts[bar % 2];
            const t0 = bar * 4;
            [0, 1, 2, 3].forEach((b) => out.push({ string: pt.bass[0], fret: pt.bass[1], start: t0 + b, dur: 1 }));
            [0, 1.5, 2.5].forEach((b) => out.push({ chord: pt.chord, shape: pt.top, strum: "up", start: t0 + b, dur: 0.5 }));
          }
          return out;
        }, bpm: 80, modes: ["listen"], label: "Bossa feel: thumb on the beat, fingers off it" } },
      { html: `<h3>🌺 Hawaii: slack key</h3>
        <p>Hawaiian <strong>kī hōʻalu</strong> — "slack key" — means loosening ("slacking") some strings into an <strong>open tuning</strong>, so the open strings already make a chord. A favourite is "taro patch" tuning, <strong>D G D G B D</strong> (an open G chord). Players like <strong>Gabby Pahinui</strong> keep a rolling bass going with the thumb while the fingers play the melody — gentle, rippling music that sounds like the ocean.</p>`,
        people: ["gabby-pahinui"], video: "slack-key" },
      { html: `<h3>🌍 West Africa and 🇮🇳 India</h3>
        <ul>
          <li><strong>Mali:</strong> <strong>Ali Farka Touré</strong> played hypnotic, repeating fingerpicked lines rooted in centuries-old West African music — so close to American blues that people call it "desert blues". His album with Ry Cooder, <em>Talking Timbuktu</em>, won a Grammy.</li>
          <li><strong>Congo:</strong> in Congolese rumba and soukous, guitarists play bright, fast, interlocking melodies high up the neck — <strong>Franco Luambo</strong> was nicknamed "the Sorcerer of the Guitar".</li>
          <li><strong>India:</strong> <strong>Vishwa Mohan Bhatt</strong> turned a guitar into the <strong>Mohan veena</strong>, played lying flat with a slide, bending notes like a sitar to play Indian ragas. He won a Grammy with Ry Cooder for <em>A Meeting by the River</em>.</li>
        </ul>
        <p>Same six strings — completely different music. Which style will you try?</p>`,
        people: ["ali-farka-toure"], video: "ali-farka-toure" },
    ],
  },
];

const ADVANCED = [
  {
    id: "lesson-caged", title: "The CAGED system", subtitle: "One chord, five places",
    pages: [
      { html: `<h3>Every chord lives in five shapes up the neck.</h3>
        <p>The open chord shapes <strong>C, A, G, E and D</strong> can each be moved up the neck with a barre. Played in that order, they link together to cover the whole fretboard. Here's a <strong>C major</strong> chord in all five shapes:</p>
        <ul>
          <li>C shape (open): x32010</li><li>A shape at the 3rd fret: x35553</li><li>G shape at the 5th fret: 875558</li><li>E shape at the 8th fret: 8 10 10 9 8 8</li><li>D shape at the 10th fret: xx 10 12 13 12</li>
        </ul>
        <p>Learning where the root sits in each shape lets you play any chord — and the scale around it — anywhere on the neck.</p>`,
        caged: true },
    ],
  },
  {
    id: "lesson-greensleeves", title: "Greensleeves", subtitle: "A traditional English tune (public domain)",
    pages: [
      { html: `<h3>Centuries old, still beautiful.</h3>
        <p>"Greensleeves" is a traditional English song in A minor, in a lilting 3/4 time. Its chords: <strong>Am – C – G – Em – Am – F – E</strong>. Try it fingerpicked: thumb on the root, then the top strings.</p>`,
        diagrams: ["Am", "C", "G", "Em", "F", "E"],
        practice: { items: () => chordTimeline(shapes(["Am", "C", "G", "Em", "Am", "F", "E", "E"]), { beatsPerChord: 3, pattern: ["down", "up", "up"] }), bpm: 84, modes: ["listen"], label: "Greensleeves chords in 3/4" } },
    ],
  },
  {
    id: "lesson-modes", title: "A taste of modes", subtitle: "Dorian and Mixolydian",
    pages: [
      { html: `<h3>Same notes, different home.</h3>
        <p>Play the G major scale but treat <strong>A</strong> as home and you get <strong>A Dorian</strong> — minor, but with a brighter 6th note (F#). It's the sound of a lot of funk and Santana-style rock. Treat <strong>D</strong> as home and you get <strong>D Mixolydian</strong> — major with a flat 7th (C), a classic rock and blues sound.</p>
        <p>A practical way in: play your A minor pentatonic and add an F# — that's Dorian.</p>`,
        notes: scaleBox(9, [0, 2, 3, 5, 7, 9, 10], 5).map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(scaleBox(9, [0, 2, 3, 5, 7, 9, 10], 5)), bpm: 72, modes: ["listen", "wait"], mic: true, label: "A Dorian", showTab: true } },
    ],
  },
  {
    id: "lesson-wmggw", title: "Solo study: Prince & While My Guitar Gently Weeps", subtitle: "The 2004 Hall of Fame solo",
    pages: [
      { html: `<h3>The most famous guitar solo at a tribute show</h3>
        <p><strong>George Harrison</strong> wrote "While My Guitar Gently Weeps" for the Beatles' White Album in 1968. His friend <strong>Eric Clapton</strong> played the original lead guitar on the record.</p>
        <p>In March 2004, Harrison was inducted into the Rock and Roll Hall of Fame. Tom Petty, Jeff Lynne, Steve Winwood and George's son Dhani played the song, and <strong>Prince</strong> stepped up for the ending: a blazing three-minute solo. He leaned back so far he fell off the stage into the crowd (a stagehand pushed him back up!), kept playing, and finished by tossing his guitar high into the air and walking off. It's one of the most-watched live guitar moments ever.</p>
        <p class="jg-note">The song and the solo are copyrighted, so we won't copy them note for note. You'll learn what the solo is built from: the chords, the scale, and Prince's techniques.</p>`,
        people: ["prince", "george-harrison"], video: "prince-wmggw" },
      { html: `<h3>The chords: a bass line that cries</h3>
        <p>The song keeps an <strong>A minor</strong> chord on top while the bass walks down: <strong>A → G → F# → F</strong>. Then it climbs back with <strong>Am – G – D – E</strong>. That falling bass is what makes it sound like it's weeping.</p>
        <p><strong>Am – Am/G – Am/F# – F – Am – G – D – E</strong></p>`,
        diagrams: ["Am", "Am/G", "Am/F#", "F", "G", "D", "E"],
        practice: { items: strumItems(["Am", "Am/G", "Am/F#", "F", "Am", "G", "D", "E"], DDUUDU), bpm: 76, modes: ["listen", "wait"], label: "The verse chords", drums: true } },
      { html: `<h3>The scale: A minor pentatonic, plus two magic notes</h3>
        <p>Most of a solo over this song lives in the <strong>A minor pentatonic</strong> box at the 5th fret, the very first scale you learned. Great soloists add colour by aiming for the notes of each chord as it goes by:</p>
        <ul>
          <li>Over <strong>D</strong>, the note <strong>F#</strong> (7th fret on the B string, or 4th fret on the D string) sounds sweet. That's the <strong>Dorian</strong> sound.</li>
          <li>Over <strong>E</strong>, the note <strong>G#</strong> (6th fret on the D string, or 9th fret on the B string) makes it dramatic. That's the <strong>harmonic minor</strong> sound.</li>
        </ul>
        <p>Below is A Dorian in 5th position (pentatonic + B and F#). Practice it up and down.</p>`,
        notes: scaleBox(9, [0, 2, 3, 5, 7, 9, 10], 5).map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(scaleBox(9, [0, 2, 3, 5, 7, 9, 10], 5)), bpm: 80, modes: ["listen", "wait", "timed"], mic: true, label: "A Dorian, 5th position", showTab: true } },
      { html: `<h3>Play like Prince: bends, vibrato and fast runs</h3>
        <ul>
          <li><strong>Long bends with wide vibrato</strong>: bend a note up a whole step, hold it, and shake it so it sings over the whole bar.</li>
          <li><strong>Fast pentatonic runs</strong> that rush down the box, then a long held note to land.</li>
          <li><strong>Dynamics</strong>: play some phrases quietly and some loud. The contrast is what makes a solo exciting.</li>
        </ul>
        <p>Here's our own fast run down the A minor pentatonic box (not Prince's notes). Start slow with Wait for me, then speed up.</p>`,
        notes: AMIN_PENT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: () => {
          const run = [...AMIN_PENT].reverse();
          return run.map((n, i) => ({ string: n.string, fret: n.fret, start: i * 0.25, dur: 0.25 })).concat([{ string: 3, fret: 7, start: run.length * 0.25, dur: 2 }]);
        }, bpm: 70, modes: ["listen", "wait", "timed"], mic: true, label: "A fast pentatonic run (our own lick)", showTab: true } },
    ],
  },
  {
    id: "lesson-ear-gym", title: "Chord Ear Gym", subtitle: "Guess the chord by ear",
    pages: [
      { html: `<h3>Train your ears to name chords 🎧</h3>
        <p>Great guitarists can hear a chord and know its name. That's how they play songs <strong>by ear</strong>.</p>
        <p>3 rounds: <strong>happy or sad</strong>, then <strong>all 24 chords</strong> one by one, then chords played <strong>different ways</strong> (strummed, picked one string at a time, or higher up the neck), like in real songs.</p>`,
        earGym: true },
    ],
  },
];

export { PRE, BEGINNER, INTERMEDIATE, ADVANCED, shapes, strumItems };
