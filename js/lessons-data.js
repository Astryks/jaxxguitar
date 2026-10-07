// Jaxx Guitar curriculum. Each lesson is a list of pages; lessons-ui.js
// renders them all the same way. A page can have:
//   html            - the explanation (shown in the mascot's speech bubble)
//   diagrams        - chord symbols to draw as chord boxes
//   shape           - chord symbol to show on the fretboard (with fingers)
//   notes           - [{ string, fret, label?, tone? }] to show on the fretboard
//   practice        - { items: () => timeline, bpm, modes, label } (falling notes)
//   tab             - { items, beatsPerBar, bars } drawn as tab
//   tuner           - true: the per-string tuner
//   fretQuiz        - { count } "tap the note" quiz on the fretboard
//   changes         - [chordA, chordB]: the one-minute chord-change drill
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
        <p>The three main kinds are <strong>classical</strong>, <strong>acoustic</strong> and <strong>electric</strong> (compared on the next page). Any of them works with this app.</p>
        <ul>
          <li><strong>Bass guitar:</strong> usually 4 thick strings for the low notes. It's a different instrument; this app teaches 6-string guitar.</li>
          <li><strong>12-string guitar:</strong> pairs of strings for a shimmering sound.</li>
        </ul>` },
      { html: `<h3>Electric, acoustic, classical… or a ukulele?</h3>
        <table class="jg-table">
          <tr><th></th><th>Strings</th><th>Feels</th><th>Good for</th></tr>
          <tr><td><strong>Classical</strong></td><td>6 nylon</td><td>Softest on fingertips; wide neck</td><td>Fingerpicking, classical, Spanish styles; young kids</td></tr>
          <tr><td><strong>Acoustic</strong></td><td>6 steel</td><td>Bright and loud; a bit harder to press at first</td><td>Strumming songs, singing along, campfires</td></tr>
          <tr><td><strong>Electric</strong></td><td>6 thin steel</td><td>Easiest to press; needs an amp (or headphones amp)</td><td>Rock, blues, solos, bending notes</td></tr>
          <tr><td><strong>Ukulele</strong></td><td>4 nylon</td><td>Tiny, light, very easy</td><td>A fun first instrument - but it's not a guitar</td></tr>
        </table>
        <p><strong>Which should you start on?</strong> The one that makes you want to play every day! Everything in this app works on acoustic, electric and classical guitars.</p>
        <p class="jg-fact">Ukulele secret: a uke is tuned <strong>G C E A</strong> - the same as a guitar's top four strings with a capo on the 5th fret. So a guitar "G" shape on the top four strings is a uke "C"! Learn one and you're halfway to the other.</p>` },
      { html: `<h3>Get one cheap (or free!)</h3>
        <p>You don't need a new or fancy guitar to learn. Some smart places to look:</p>
        <ul>
          <li><strong>Facebook Marketplace</strong>, Craigslist, Gumtree or local buy-and-sell groups - beginner guitars often sell for <strong>$40–100</strong> used, because lots of people buy one and stop playing.</li>
          <li><strong>Family and friends</strong> - ask around; there's often a guitar sitting in someone's closet.</li>
          <li><strong>Your school</strong> or a local community music centre, which may lend instruments.</li>
          <li>New: a decent beginner acoustic or electric is usually around <strong>$100–200</strong>.</li>
        </ul>
        <h3>What to check before you pay</h3>
        <ul>
          <li><strong>The neck:</strong> look down it from the headstock like aiming an arrow - it should be straight, not twisted.</li>
          <li><strong>String height ("action"):</strong> at the 12th fret the strings should sit low - about the thickness of two or three coins. Very high strings make every chord hard.</li>
          <li><strong>Play every string</strong> at a few frets: listen for buzzing or dead notes.</li>
          <li><strong>Tuning pegs</strong> turn smoothly and hold their tuning; no cracks in the body or where the neck meets it.</li>
          <li><strong>Electric?</strong> Plug it in and wiggle the knobs and the cable - crackles mean repairs.</li>
        </ul>
        <p class="jg-note">Old strings are fine to start - a fresh set costs about $5–10 and makes any guitar sound better. Grab a few picks, and a capo when you can.</p>` },
      { html: `<h3>Going electric? Keep it simple 🎸⚡</h3>
        <p>An <strong>acoustic</strong> makes its own sound: just pick it up and play. An <strong>electric</strong> is quiet on its own; it plugs into an amp (or headphones), and its lighter strings are easier to press.</p>
        <p>What you need for an electric:</p>
        <ul>
          <li><strong>The guitar</strong>: a starter like a Squier Sonic Stratocaster is about $200–250.</li>
          <li><strong>A small practice amp</strong> (about $80–150), <strong>or</strong> a headphone amp that plugs straight into the guitar (about $70–130) so you can practise silently.</li>
          <li><strong>A cable</strong> (about $20–30), a <strong>clip-on tuner</strong> (about $18–38), a few <strong>picks</strong> and a <strong>strap</strong>.</li>
        </ul>
        <p class="jg-note">Tip: a <strong>starter pack</strong> (guitar, amp, cable, strap, picks, tuner and bag in one box) is often the easiest way to buy everything at once. Prices from Sweetwater, 2026.</p>` },
      { html: `<h3>Now let's make sure it's in tune 🎵</h3>
        <p>Tap a peg to <strong>hear</strong> the note. Then tap <strong>Start listening</strong>, play that string and turn the peg until it goes <strong>green</strong>. It moves to the next string by itself.</p>`, tuner: true },

    ],
  },
  {
    id: "p-tune", pre: true, title: "Tune your guitar (free tuner)", subtitle: "Every string, one by one",
    pages: [
      { html: `<h3>Tune up before you play - every time</h3>
        <p>An out-of-tune guitar makes even perfect chords sound wrong, so guitarists tune before every practice. This app has a <strong>free tuner</strong> built in - it listens through your microphone.</p>
        <ol>
          <li>Pick a string below, starting with the thickest: <strong>low E</strong>.</li>
          <li>Tap <strong>Start listening</strong> and pluck that string (let it ring).</li>
          <li>Too low (flat)? <strong>Tighten</strong> its peg a little. Too high (sharp)? <strong>Loosen</strong> a little, then come back up.</li>
          <li>When the meter turns <strong>green</strong>, it jumps to the next string by itself. Do all six: <strong>E A D G B E</strong>.</li>
        </ol>
        <p class="jg-note">Turn pegs slowly - a quarter turn can be a big change, and over-tightening can snap a string. Not sure which way to turn? Turn a tiny bit and watch the needle.</p>`, tuner: true },
    ],
  },
  {
    id: "p-parts", pre: true, title: "Meet your guitar", subtitle: "The parts, top to bottom",
    pages: [
      { html: `<h3>From the top:</h3>
        <ul>
          <li><strong>Headstock</strong> with <strong>tuning pegs</strong> - turn them to tighten (higher) or loosen (lower) each string.</li>
          <li><strong>Nut</strong> - the little strip the strings pass over at the top of the neck.</li>
          <li><strong>Neck</strong> and <strong>fretboard</strong> - the long part you press strings against.</li>
          <li><strong>Frets</strong> - the metal strips across the fretboard. The dots (inlays) mark frets 3, 5, 7, 9 and the double dot at 12.</li>
          <li><strong>Body</strong> - on an acoustic it's hollow with a <strong>sound hole</strong>; on an electric it's usually solid with <strong>pickups</strong> (magnets that "hear" the strings) plus volume and tone knobs.</li>
          <li><strong>Bridge</strong> - where the strings are anchored on the body.</li>
        </ul>
        <p>Below is your fretboard, the way it looks when you glance down at your guitar: nut on the left, and the thickest string (low E, nearest your chin) on top.</p>` },
    ],
  },
  {
    id: "p-howitworks", pre: true, fun: true, title: "Just for fun: how a guitar is made - and why it rings", subtitle: "Wood, wiggles and air",
    pages: [
      { html: `<h3>Someone builds every guitar!</h3>
        <p>A guitar maker is called a <strong>luthier</strong> (say "LOO-tee-er"). Here's how they make an acoustic guitar:</p>
        <ol>
          <li>Carve the <strong>top</strong> from a thin sheet of wood - often spruce, about as thick as two coins. It has to be thin so it can wobble.</li>
          <li>Glue wooden sticks called <strong>braces</strong> underneath, like a skeleton, so the top doesn't crack when the strings pull on it.</li>
          <li>Bend the <strong>sides</strong> into that curvy shape with heat, and glue on the <strong>back</strong> - now it's a hollow wooden box.</li>
          <li>Make the <strong>neck</strong>, with a steel <strong>truss rod</strong> hidden inside, and tap metal <strong>frets</strong> into little slots.</li>
          <li>Add the <strong>bridge</strong>, tuning pegs and strings… and tune it up!</li>
        </ol>
        <p class="jg-fact">All six strings pull with about <strong>70 kilograms</strong> of force - like a grown-up hanging off your guitar all day long. That's why it needs braces and a truss rod!</p>`, video: "how-guitar-made" },
      { html: `<h3>Why does it make sound?</h3>
        <p>When you pluck a string, it <strong>wiggles</strong> back and forth really fast. But a string is so thin it hardly pushes any air - on its own, you'd barely hear it!</p>
        <ol>
          <li>The wiggle travels through the <strong>bridge</strong> into the wooden <strong>top</strong>…</li>
          <li>…which wobbles like a <strong>trampoline</strong> and pushes LOTS of air…</li>
          <li>…and the air inside the body puffs <strong>in and out of the sound hole</strong>, like blowing across a bottle - <em>hoooo</em> - making the low notes big and warm.</li>
        </ol>
        <p>The thick low E string wiggles about <strong>82 times every second</strong>. The thin high e wiggles about <strong>330 times a second</strong>. Listen to all six, thick to thin:</p>`,
        notes: [0, 1, 2, 3, 4, 5].map((s) => ({ string: s, fret: 0, label: STRING_NAMES[s] })),
        practice: { items: melody([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]), bpm: 60, modes: ["listen"], label: "The six open strings" } },
      { html: `<h3>The halfway trick</h3>
        <p>Pressing a fret makes the wiggly part of the string <strong>shorter</strong> - and shorter strings wiggle faster, so the note goes higher.</p>
        <p>The <strong>12th fret</strong> (the double dot) is exactly <strong>halfway</strong> along the string. Half the string wiggles twice as fast, which sounds like the <strong>same note, only higher</strong>. Tap the open low E, then the low E at the 12th fret, and hear it!</p>
        <p class="jg-note">That's also why the frets get closer together as you go up the neck - each one sits about one-eighteenth of the way along the string that's left.</p>`,
        notes: [{ string: 0, fret: 0, label: "E" }, { string: 0, fret: 12, label: "E", tone: "root" }] },
      { html: `<h3>Electric guitars "hear" with magnets</h3>
        <p>An electric guitar is usually a <strong>solid</strong> block of wood, so it's quiet by itself. Under the strings sit <strong>pickups</strong>: magnets wrapped in thousands of turns of super-thin copper wire. When a steel string wiggles over the magnet, it makes a tiny <strong>electric signal</strong>, and the <strong>amplifier</strong> turns it into big sound.</p>
        <p>Acoustic or electric, it all starts the same way: a string, wiggling. 🎸</p>` },
    ],
  },
  {
    id: "p-strings", pre: true, title: "The six strings - and tuning", subtitle: "E A D G B E",
    pages: [
      { html: `<h3>Six strings, thickest to thinnest: E A D G B E.</h3>
        <p>A popular way to remember it: <strong>E</strong>ddie <strong>A</strong>te <strong>D</strong>ynamite, <strong>G</strong>ood <strong>B</strong>ye <strong>E</strong>ddie.</p>
        <p>Guitarists number them backwards: the <strong>thickest</strong> (lowest-sounding) string is the <strong>6th</strong>, the thinnest (highest) is the <strong>1st</strong>. Both outside strings are E - two octaves apart.</p>
        <p class="jg-note">On the fretboard below, the thick low E string is on top: the way you see your guitar looking down at it. (Tab, which comes later, is written the other way up.)</p>`,
        notes: [0, 1, 2, 3, 4, 5].map((s) => ({ string: s, fret: 0, label: STRING_NAMES[s] })) },
      { html: `<h3>Tune up every time you play.</h3>
        <p>Strings drift out of tune all the time. Pick a string, tap <strong>Start listening</strong>, play it and turn the peg slowly until it goes <strong>green</strong>.</p>`, tuner: true },
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
          <li><strong>Just behind the fret</strong> - close to the metal fret on the body side, not in the middle of the space and never on top of the fret. Closer = less pressure needed and no buzz.</li>
          <li><strong>Thumb behind the neck,</strong> roughly opposite your middle finger - like a gentle pinch, not a fist around the neck.</li>
          <li><strong>Curve your fingers</strong> like holding a small ball, with your wrist relaxed and slightly forward.</li>
          <li><strong>Only as hard as needed.</strong> Press until the buzz stops - then no harder. Pressing harder just tires your hand.</li>
        </ol>
        <p class="jg-note">Short nails on your fretting hand help a lot. Sore fingertips for the first week or two are normal - they toughen up. Stop if anything actually hurts.</p>`,
        notes: [{ string: 4, fret: 1, label: "1", tone: "root" }] },
      { html: `<h3>The buzz check</h3>
        <p>Press the B string (2nd string) at the 1st fret with your index fingertip - lit up below - and pick it. Buzzing? Move closer to the fret or press a little firmer. Muffled? Your finger is touching a neighbouring string or not on its tip.</p>
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
          <li><strong>Play right-handed anyway.</strong> Many lefties do - both hands are learning something new either way.</li>
          <li><strong>Get a left-handed guitar</strong> - a mirror image, strumming with your left hand. Paul McCartney and Jimi Hendrix played left-handed (Hendrix often flipped a right-handed guitar and restrung it).</li>
          <li><strong>Flip a right-handed guitar upside down without restringing</strong> - the thin strings end up on top. Bluesman <strong>Albert King</strong> and folk legend <strong>Elizabeth Cotten</strong> played this way, and invented their own styles because of it!</li>
        </ul>
        <p class="jg-note">Playing a left-handed guitar? Turn on <strong>Left-handed</strong> below and every fretboard in the app flips to match yours.</p>`, people: ["jimi-hendrix"], lefty: true,
        notes: [0, 1, 2, 3, 4, 5].map((s) => ({ string: s, fret: 0, label: STRING_NAMES[s] })) },
    ],
  },
  {
    id: "p-hold", pre: true, title: "Sitting, standing and straps", subtitle: "Comfortable from day one",
    pages: [
      { html: `<h3>Sitting down</h3>
        <ul>
          <li>Sit on a chair without arms, near the front, back straight and shoulders relaxed.</li>
          <li>Rest the guitar's waist (the curvy dip) on your <strong>right leg</strong>, the body against your tummy, neck pointing slightly up - not flat.</li>
          <li><strong>Classical players</strong> rest it on the <strong>left leg</strong> with that foot on a small footstool, so the neck sits higher. Try both and use what's comfortable.</li>
          <li>Don't lean over to look at the fretboard - tilt your head a little, not your whole body.</li>
        </ul>` },
      { html: `<h3>Standing up: should it hang around your neck?</h3>
        <p>Not around your neck! A <strong>strap</strong> goes over your <strong>left shoulder</strong> and across your back, so your shoulders and back carry the weight, not your neck.</p>
        <ul>
          <li>Set the strap so the guitar sits at about the <strong>same height as when you're sitting</strong> - then your hands work the same way standing up. Rock stars wear guitars low; it looks cool and is much harder to play!</li>
          <li>Strap buttons: most acoustic and electric guitars have one at the bottom and one near the neck. Some acoustics need the strap tied around the headstock.</li>
          <li>Check the strap ends are pushed fully on - rubber <strong>strap locks</strong> are cheap and stop the guitar falling.</li>
        </ul>` },
    ],
  },
  {
    id: "p-pick", pre: true, title: "Pick or fingers?", subtitle: "And which pick to buy",
    pages: [
      { html: `<h3>When to use a pick</h3>
        <ul>
          <li><strong>Use a pick</strong> for strumming, rock and pop, single-note solos on electric guitar - it's louder and brighter.</li>
          <li><strong>Use your fingers</strong> for fingerpicking, classical and Spanish guitar, and soft songs - warmer, and you can play bass and melody at once.</li>
          <li>Many songs use both - and on a steel-string acoustic, a light pick is easiest for beginners' strumming.</li>
        </ul>
        <h3>Pick thickness</h3>
        <table class="jg-table">
          <tr><th>Thin (about 0.4–0.6 mm)</th><td>Flexible and forgiving - great for strumming acoustic chords.</td></tr>
          <tr><th>Medium (about 0.6–0.8 mm)</th><td>The all-rounder: strumming and single notes. A good first pick.</td></tr>
          <tr><th>Heavy (1 mm and up)</th><td>Stiff and precise - for solos and fast picking.</td></tr>
        </table>
        <h3>How to hold it</h3>
        <p>Curl your index finger, lay the pick on the side of its first joint, and press it there with your thumb - only the tip pokes out, pointing at the strings. Grip just firmly enough that it doesn't fly away.</p>` },
    ],
  },
];


// ===== Simple cards for the beginner lessons (see js/cards.js) =====
// Owner feedback 2026-10: slower chords ("Let's learn the G chord", then it
// stays on screen until Next chord), the fingers shown landing one by one,
// all the chords side by side, how to switch, a plain looping Play, and
// every lesson ends with 3 songs (added by lesson-songs.js).
const LESSON1_CARDS = [
  { say: `Welcome to Jaxx Guitar! 🎸<br>Soon you'll know <b>4 chords</b> that play <b>100+ songs</b>: <b>G · D · Em · C</b> 🎶<br>But <b>bear</b> 🐻 with us while we cover the <b>basics</b> first. It only takes a minute!<br><br>Grab <b>your guitar</b> (the real one!) 🎸`, want: { tap: "I've got my guitar! 🎸" }, done: "Let's get you in tune! 🎵" },
  { say: `Quick <b>tuning check</b> 🎵<br>Tap a peg to <b>hear</b> the note. Then tap <b>Start listening</b>, play that string and turn the peg until it goes <b>green</b>.`, want: { tuner: true }, done: "In tune and ready! 🎉" },
  { say: `This is how you hold it 👇<br>Your <b>left hand</b> presses the strings on the <b>neck</b>. Your <b>right hand</b> strums over the <b>sound hole</b>.<br>We draw it for <b>right-handed</b> players, but hold it however feels comfortable for you 😺`,
    more: [["I'm left-handed!", "Lots of lefties play this way round, and some flip it. Try both! On a left-handed guitar, turn on <b>Left-handed</b> in <b>About &amp; settings</b> and the fretboards flip to match."]],
    show: { guitar: true }, want: { tap: "Got it 👍" }, done: "Neck on the left, strum on the right! 👍" },
  { say: `Now let's zoom in on the <b>neck</b> 👇<br>The <b>6 strings</b> run along it. The thin metal bars across it are the <b>frets</b>.<br>It's drawn the way you see it <b>looking down</b> at your guitar: the <b>thickest</b> string (nearest your chin) is on <b>top</b>.`,
    more: [["What are the numbers at the bottom?", "The <b>fret numbers</b>. Fret 1 is the space next to the end of the neck (by the tuning pegs), then fret 2, and so on. Today we only need frets <b>1, 2 and 3</b> 👆"], ["Where do I press?", "In the <b>space between</b> the metal bars, just behind a bar. Never right on top of it."]],
    show: { frets: [1, 2, 3] }, want: { tap: "Got it 👍" }, done: "Strings along, frets across! 👍" },
  { say: `Strings are named with <b>letters</b>: <b>E A D G B e</b>, from the thickest to the thinnest. (Frets are the ones with <b>numbers</b>.)<br>Tap the <b>thickest string</b>: the <b>low E</b>, on top.`,
    more: [["Why two E strings?", "The thickest and the thinnest are both <b>E</b>, two octaves apart. We write the thin one as a small <b>e</b> so you can tell them apart."], ["Do strings have numbers too?", "Yes, as a side note: guitarists also count them <b>6</b> (thickest) down to <b>1</b> (thinnest). You'll see both."]],
    show: {}, want: { string: 0 }, done: "That's the low E string! 🎉" },
  { say: `Now <b>press a fret</b>: on the <b>low E</b> string, press <b>fret 3</b>.<br>Use your fingertip, just <b>behind</b> the metal bar.`, show: { frets: [3] }, want: { pos: [{ string: 0, fret: 3 }] },
    tip: `How hard? Only <b>just hard enough</b> that the buzz stops. Pressing harder doesn't sound better, it just tires your hand. On a real guitar it gets easier every day 💪`, done: "That's a G note! 🎵" },
  { say: `Let's learn your first chord: <b>E minor</b> (Em), the easiest one! 😺<br>Watch the fingers land, then place them yourself and strum all 6 strings.<br><small>Finger numbers: <b>1</b> index · <b>2</b> middle · <b>3</b> ring · <b>4</b> pinky</small>`, show: {}, want: { chord: "Em" }, done: "That's the <b>Em</b> chord! A soft, sad sound 🥲" },
  { say: `Let's learn the <b>G</b> chord 🎸<br>Three fingers this time. Watch where they go first.`, show: {}, want: { chord: "G" }, done: "That's the <b>G</b> chord! Big and happy 😀" },
  { say: `Let's learn the <b>C</b> chord 🎸<br>Arch your fingers so the open strings ring.<br>Don't strum the thickest string (the ✕).`, show: {}, want: { chord: "C" }, done: "That's the <b>C</b> chord! 🎉" },
  { say: `Last one! Let's learn the <b>D</b> chord 🎸<br>Strum only the <b>4 thinnest</b> strings. Skip the two thick ones (the ✕s).`, show: {}, want: { chord: "D" }, next: "Next →", done: "That's the <b>D</b> chord! You know 4 chords! 💥" },
  { say: `Here are your <b>4 chords</b> side by side 👀<br>Tap each one to see it on the fretboard and hear it.`, want: { compare: ["G", "D", "Em", "C"], note: "Spot it: <b>G</b> and <b>C</b> both use your ring finger on fret 3, and <b>Em</b> only needs two fingers." }, done: "4 chords, 100+ songs! 🎶" },
  { say: `Quick quiz! 🧠<br>Which chord uses only <b>two fingers</b>?`, want: { choice: "Em", options: ["G", "Em", "C"] }, done: "Yes! Em is the easy one 😺" },
  { say: `How do guitarists <b>switch chords</b> so fast? 🤔<br>Watch the fingers move. Some <b>stay</b>, the rest <b>move together</b>. Tap a pair to see it.`, show: {}, want: { morph: [["G", "Em"], ["Em", "C"], ["C", "D"], ["D", "G"]] }, done: "Anchor, pivot, lift together! ⚓" },
  { say: `<b>Boom!</b> Now the loop: <b>G → D → Em → C</b> 🔁<br>That's the pattern behind 100+ songs. Tap <b>Play</b>: it keeps looping, so strum along on your guitar, one strum on each arrow. Switch when the chord changes.`, show: {}, want: { loop: { chords: ["G", "D", "Em", "C"], bpm: 66, label: "G – D – Em – C" }, ok: "I played the loop! ✓" }, done: "That's the loop in 100+ songs! 🏆" },
];
const SONGS_QUIZ_CARDS = [
  { say: `Quiz time! 🧠<br>Which of these songs can you play with <b>G, D, Em and C</b>?<br><small>(Some need a <b>capo</b>, a clip that moves the same shapes higher. More on that later!)</small>`,
    want: { allCorrect: "<b>Correct!</b> In fact, <b>all of them</b> use these chords! 🤯", options: ["I'm Yours (Jason Mraz)", "Someone Like You (Adele)", "Stand By Me (Ben E. King)", "Zombie (The Cranberries)"] }, done: "4 chords, so many songs! 🎉" },
  { say: `Your turn to explore! 🔎<br><b>Search online</b> for "songs with G D Em C" and see what other songs you can play with these chords!<br>You can also look in the <b>Songs</b> tab: every song shows its easy chords.`, want: { tap: "I'll look! 🔎" }, done: "Happy hunting! 🎶" },
];
const STRUM_CARDS = [
  { say: `Time to <b>strum</b>! 🎸<br>No pick? No problem! Use your <b>finger</b>:<br>⬇️ <b>Down:</b> brush the strings with the <b>back of your index fingernail</b>, like flicking a crumb off the table.<br>⬆️ <b>Up:</b> brush back up with the soft <b>pad</b> of the same finger (or your thumb).`,
    more: [["What if I have a pick?", "Hold it between your <b>thumb</b> and the side of your <b>index finger</b>, with just the tip showing. Same down and up movement."]],
    show: { fingerStrum: true }, want: { tap: "Got it 👍" }, done: "Loose wrist, happy strum 😺" },
  { say: `How hard should you strum? <b>Gently!</b><br>Loud comes from a <b>relaxed swing</b> from the wrist, not from pushing. Like shaking water off your hand.`,
    more: [["What does a downstrum hit?", "<b>Down</b> (towards the floor) hits more of the thick strings, so it's a bit stronger. <b>Up</b> is lighter and just catches the thin strings."]], want: { tap: "I'll strum gently 🎵" }, done: "Gentle and relaxed 👍" },
  { say: `Count <b>1 & 2 & 3 & 4 &</b> 🔢<br>Your hand goes <b>down</b> on every number and <b>up</b> on every "&", all the time, like a pendulum.<br>The most-used pattern: <b>D · D U · U D U</b>. Tap <b>Play</b> and strum along on your G chord, one strum per big arrow!`, show: {},
    want: { strum: { chords: ["G"], pattern: ["down", null, "down", "up", null, "up", "down", "up"], bpm: 66, label: "D · D U · U D U" }, ok: "I strummed along! ✓" }, done: "That's the strum in so many songs! 🎉" },
  { say: `Quick quiz! 🧠<br>In <b>D · D U · U D U</b> there are two gaps (the faded arrows). What does your hand do in a gap?`,
    want: { choice: "It keeps swinging but misses the strings", options: ["It stops and waits", "It keeps swinging but misses the strings"], wrong: "Not quite! Your hand never stops. It swings past the strings without touching them 🙈" }, done: "Yes! Keep the hand moving like a pendulum, just miss the strings 👍" },
  { say: `Now strum the pattern while you change chords: <b>G</b> then <b>C</b> 🔁<br>Tap <b>Play</b> and keep that hand swinging.`, show: {},
    want: { strum: { chords: ["G", "C"], pattern: ["down", null, "down", "up", null, "up", "down", "up"], bpm: 66, label: "G and C" }, ok: "I did it! ✓" }, done: "Rhythm and chords together! 🏆" },
];
const CHANGES_CARDS = [
  { say: `Changing chords without stopping 🔁<br>Watch <b>C</b> turn into <b>A minor (Am)</b>: fingers <b>1</b> and <b>2</b> <b>don't move at all</b> (the rings). Only finger <b>3</b> hops to another string. That's an <b>anchor</b> ⚓`, show: {}, want: { morph: [["C", "Am"], ["G", "C"], ["Em", "Am"]] }, done: "Anchor fingers save time! ⚓" },
  { say: `Your turn: play <b>C</b> first.`, show: {}, want: { chord: "C" }, next: "Next →", done: "C ready! 😺" },
  { say: `Now change to <b>Am</b>. Keep fingers 1 and 2 down and move only finger 3!`, show: { shape: "C" }, want: { chord: "Am" }, next: "Next →", done: "That's <b>Am</b>! Two fingers stayed put ⚓" },
  { say: `The <b>one-minute challenge</b> ⏱️<br>Strum one chord, switch, strum the other. How many clean changes in 60 seconds? Turn on the <b>microphone</b> and Jaxx counts them for you. Try to beat it tomorrow!`, show: {}, want: { changes: ["G", "C"], ok: "Done ✓" }, done: "That's how you get smooth! 🏆" },
];
const OPEN_CARDS = [
  { say: `Ready for <b>more chords</b>? 🎸<br>With <b>A, E, Am and Dm</b> (plus the 4 you know) you can play loads more songs.<br>These are all <b>open chords</b>: some strings ring without being pressed.`, want: { tap: "Let's go! 🎸" }, done: "Here we go! 🎵" },
  { say: `Let's learn the <b>E</b> chord 🎸<br>Strum all 6 strings. It looks like Em with one more finger!`, show: {}, want: { chord: "E" }, done: "That's the <b>E</b> chord! 🎉" },
  { say: `<b>E</b> vs <b>Em</b>: just <b>one finger</b> different! 👀<br>Lift finger <b>1</b> and happy E becomes sad Em. Tap each to hear it.`, want: { compare: ["E", "Em"], note: "That one note decides <b>happy</b> (major) or <b>sad</b> (minor)." }, done: "One finger, a whole new mood! 🎭" },
  { say: `Let's learn the <b>A</b> chord 🎸<br>Three fingers squeeze into fret 2. Skip the thickest string (✕).`, show: {}, want: { chord: "A" }, done: "That's the <b>A</b> chord! 🎉" },
  { say: `Let's learn the <b>A minor</b> (Am) chord 🎸<br>Same shape as E, moved down one string!`, show: {}, want: { chord: "Am" }, done: "That's the <b>Am</b> chord! 🥲" },
  { say: `<b>A</b> vs <b>Am</b>: one finger again! 👀<br>Tap each to hear happy and sad.`, want: { compare: ["A", "Am"], note: "In A, three fingers sit on fret 2. In Am, one of them drops back to fret 1 on the B string." }, done: "Happy, sad, happy, sad! 🎭" },
  { say: `Let's learn the <b>D minor</b> (Dm) chord 🎸<br>A little triangle on the thin strings. Strum only the 4 thinnest.`, show: {}, want: { chord: "Dm" }, next: "Next →", done: "That's the <b>Dm</b> chord! 🎉" },
  { say: `All <b>8 open chords</b> you know, side by side 👀<br>Tap any one to see it and hear it.`, want: { compare: ["G", "D", "Em", "C", "E", "A", "Am", "Dm"], note: "Happy (major): <b>G D C E A</b>. Sad (minor, with an m): <b>Em Am Dm</b>." }, done: "8 chords! That's a lot of songs 🎶" },
  { say: `Now a loop with the new chords: <b>Am → Dm → E → Am</b> 🔁<br>Tap <b>Play</b> and strum along.`, show: {}, want: { loop: { chords: ["Am", "Dm", "E", "Am"], bpm: 66, label: "Am – Dm – E – Am" }, ok: "I played it! ✓" }, done: "Spooky and cool! 🏆" },
];

const CREEP = {
  G: { name: "G (barre, fret 3)", frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], barre: 3 },
  B: { name: "B (barre, fret 2)", frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], barre: 2 },
  C: { name: "C (barre, fret 3)", frets: [-1, 3, 5, 5, 5, 3], fingers: [0, 1, 2, 3, 4, 1], barre: 3 },
  Cm: { name: "Cm (barre, fret 3)", frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: 3 },
};
const creepItems = () => chordTimeline(["G", "G", "B", "B", "C", "C", "Cm", "Cm"].map((c) => ({ chord: c, shape: CREEP[c] })), { beatsPerChord: 4, pattern: ["down", "down", "down", "down"] });

const BEGINNER = [
  {
    id: "lesson-1", title: "The 4 chords to play 100 songs", subtitle: "G, D, Em and C, then 3 songs",
    cards: LESSON1_CARDS,
    songs: ["Take Me Home, Country Roads", "Perfect", "Amazing Grace"],
    pages: [],
  },
  {
    id: "lesson-songs-quiz", title: "Which songs use these chords?", subtitle: "A quiz where every answer is right",
    cards: SONGS_QUIZ_CARDS,
    songs: ["I'm Yours", "Someone Like You", "Stand By Me"],
    pages: [],
  },
  {
    id: "lesson-strum", title: "Strumming and rhythm", subtitle: "With your fingers or a pick",
    cards: STRUM_CARDS,
    songs: ["Brown Eyed Girl", "Ocean Eyes", "Sweet Caroline"],
    pages: [],
  },
  {
    id: "lesson-changes", title: "Changing chords without stopping", subtitle: "Anchor fingers and the one-minute challenge",
    cards: CHANGES_CARDS,
    songs: ["Knockin' on Heaven's Door", "Let Her Go", "Say You Won't Let Go"],
    pages: [],
  },
  {
    id: "lesson-open-chords", title: "More open chords: E, A, Am, Dm", subtitle: "Happy or sad? One finger",
    cards: OPEN_CARDS,
    songs: ["Riptide", "Last Christmas"],
    pages: [],
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
          <li><strong>The baby F</strong>: your index finger presses just the <strong>2 thinnest strings</strong> at the 1st fret (a tiny barre), middle finger on the G string at fret 2, ring finger on the D string at fret 3. Strum only the 4 thinnest strings.</li>
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
        <p>In the 1920s and '30s, a teenage guitarist from Waukesha, Wisconsin called <strong>Les Paul</strong> played at drive-ins and roadhouses, often outdoors, where an acoustic guitar just got lost.</p>
        <p>So he rigged up his own solution: he jammed a <strong>record-player needle</strong> into his guitar to pick up the vibrations and ran it into a <strong>radio speaker</strong>. Suddenly people could hear him.</p>
        <p>That homemade hack started a lifetime of inventing. Les Paul went on to build one of the first <strong>solid-body electric guitars</strong> (nicknamed "The Log" - a block of wood with a guitar neck), which led to the famous Gibson Les Paul guitar. He also pioneered multitrack recording.</p>
        <p class="jg-fact">He's in both the <strong>Rock and Roll Hall of Fame</strong> and the <strong>National Inventors Hall of Fame</strong> - often called the only person in both. Isn't that amazing?</p>
        <p class="jg-note">He didn't invent the amplifier, but his homemade rig helped lead to the electric guitar.</p>`, people: ["les-paul"], video: "les-paul" },
    ],
  },
  {
    id: "lesson-capo", title: "The capo: play in any key", subtitle: "Same shapes, higher sound",
    pages: [
      { html: `<h3>A capo is a clamp that moves the nut.</h3>
        <p>Clip it across all six strings just behind a fret, and every open-chord shape now sounds higher by that many half-steps. That's how guitarists play songs in hard keys with easy shapes.</p>
        <p>Example: "I'm Yours" is in <strong>B major</strong> (B – F# – G#m – E - lots of barre chords). With a <strong>capo on the 4th fret</strong>, you play the easy shapes <strong>G – D – Em – C</strong> and it sounds exactly right. Every song in the Songs tab shows its easiest capo.</p>`,
        diagrams: ["G", "D", "Em", "C"] },
    ],
  },
  {
    id: "lesson-tab", title: "Reading tab - and your first melodies", subtitle: "Single notes with the microphone",
    pages: [
      { html: `<h3>Tab = a picture of the strings.</h3>
        <p>Six lines are the six strings: the <strong>top line is the thin high e string</strong>, the bottom line is the low E. (That's upside down compared with our fretboard pictures: tab is written as if you tipped the guitar up to face you.) A number tells you which fret to press on that string; 0 means play it open. Read left to right.</p>`,
        tab: { items: melody([[5, 0], [5, 1], [5, 3], [4, 0], [4, 1], [4, 3]])(), beatsPerBar: 6, bars: 1 } },
      { html: `<h3>Ode to Joy (Beethoven, 1824 - public domain)</h3>
        <p>All on the B and high e strings. Try <strong>Wait for me</strong> with the <strong>microphone</strong> on - play each note on your guitar and the music waits until it hears it.</p>`,
        practice: { items: melody([[5, 0], [5, 0], [5, 1], [5, 3], [5, 3], [5, 1], [5, 0], [4, 3], [4, 1], [4, 1], [4, 3], [5, 0], [5, 0, 1.5], [4, 3, 0.5], [4, 3, 2]]), bpm: 80, modes: ["listen", "wait", "timed"], mic: true, label: "Ode to Joy", showTab: true } },
    ],
  },
  {
    id: "lesson-power", title: "Power chords and palm muting", subtitle: "The rock sound",
    pages: [
      { html: `<h3>Two notes, huge sound.</h3>
        <p>A <strong>power chord</strong> is just a root and the note a fifth above it - no third, so it's neither major nor minor, and it sounds great with distortion. Shape: index on the root (6th or 5th string), ring finger two frets higher on the next string. Written "E5", "A5", "G5".</p>
        <p><strong>Palm muting:</strong> rest the side of your picking hand lightly on the strings right by the bridge for that chunky, chugging sound.</p>`,
        diagrams: ["E5", "A5", "G5", "D5"],
        practice: { items: () => chordTimeline(shapes(["E5", "G5", "A5", "A5", "E5", "G5", "D5", "A5"]), { beatsPerChord: 2, pattern: ["down", "down", "down", "down"] }), bpm: 90, modes: ["listen"], label: "A power-chord riff" } },
    ],
  },
  {
    id: "lesson-redspecial", fun: true, title: "Just for fun: the guitar built from a fireplace", subtitle: "Brian May & his dad",
    pages: [
      { html: `<h3>A father-and-son project that went to stadiums</h3>
        <p>In August 1963, a teenage <strong>Brian May</strong> - later the guitarist of <strong>Queen</strong> - couldn't afford the guitar he wanted. So he and his dad, <strong>Harold</strong>, built one at home.</p>
        <p>The neck was carved from wood from a <strong>century-old fireplace mantel</strong> a family friend was throwing out (Brian filled the wormholes with matchsticks). They finished it in October 1964 and called it the <strong>Red Special</strong>. Brian has played it on almost every Queen record and concert since.</p>`, people: ["brian-may"], video: "brian-may-red-special" },
    ],
  },
  {
    id: "lesson-barre", title: "Barre chords: one shape, every chord", subtitle: "A B C D E F G up and down the neck",
    pages: [
      { html: `<h3>Your index finger becomes the nut.</h3>
        <p>Lay your index finger flat across all six strings at one fret (a <strong>barre</strong>), and make the <strong>E</strong> chord shape with your other three fingers just in front of it. At the 1st fret, that's <strong>F</strong>.</p>
        <h3>Barre tips that really help</h3>
        <ul>
          <li><strong>Close to the fret:</strong> put the barre just behind the metal fret, not in the middle of the space. Much less pressure needed.</li>
          <li><strong>Roll the index finger</strong> a little onto its bony side (towards the headstock). The hard edge presses better than the soft middle.</li>
          <li><strong>Thumb behind the neck</strong>, roughly behind your middle finger, not hooked over the top.</li>
          <li><strong>Pull, don't squeeze:</strong> let the weight of your arm pull back gently, so your hand doesn't have to clamp hard.</li>
          <li><strong>Check each string:</strong> pick them one at a time. A dead string usually sits in a crease of your finger: move the barre slightly up or down.</li>
          <li><strong>Little and often:</strong> a few minutes a day. It takes most people a few weeks, and that's normal! Use the baby F meanwhile.</li>
        </ul>`,
        diagrams: ["F"], shape: "F" },
      { html: `<h3>One shape, every chord 🤯</h3>
        <p>Here's the magic: slide that <strong>same shape</strong> up the neck and it plays a new chord. The note under your barre on the <strong>thickest string</strong> is the chord's name.</p>
        <p>Tap a letter to see where the shape goes for <strong>A B C D E F G</strong>, and switch between major (happy) and minor (sad: lift your middle finger).</p>`,
        barreMover: true },
      { html: `<h3>The other barre shape: from Am</h3>
        <p>Barre at the 2nd fret and make the <strong>Am</strong> shape in front of it: that's <strong>Bm</strong>. This shape takes its name from the <strong>A string</strong> (the 2nd thickest). Slide it to fret 3 for Cm, fret 5 for Dm.</p>`,
        diagrams: ["Bm"], shape: "Bm",
        practice: { items: strumItems(["G", "Bm", "C", "D"]), bpm: 66, modes: ["listen", "wait"], label: "G – Bm – C – D" } },
    ],
    songs: ["Love Story", "Count on Me", "Summer of '69"],
  },
  {
    id: "lesson-creep", title: "Song study: Creep", subtitle: "Radiohead, 1992. Four barre chords",
    pages: [
      { html: `<h3>Creep, by Radiohead</h3>
        <p>A huge 90s rock song, and a perfect first <strong>barre-chord song</strong>: the same <strong>4 chords</strong> loop the whole way through: <strong>G – B – C – Cm</strong>, each for one bar (4 beats).</p>
        <p>All four are barre shapes: <strong>G</strong> is the E-shape at fret 3, <strong>B</strong> is the A-shape at fret 2, <strong>C</strong> is the A-shape at fret 3, and <strong>Cm</strong> is the A-minor shape at fret 3. Going from C to Cm, only one finger moves!</p>
        <p class="jg-note">Too hard for now? Strum just the 4 thinnest strings of each shape while your barre finger gets stronger. We only teach the chords here, no lyrics or tab.</p>`,
        diagrams: [CREEP.G, CREEP.B, CREEP.C, CREEP.Cm], video: "creep" },
      { html: `<h3>Play along: G – B – C – Cm</h3>
        <p>Four strums per chord. Listen first, then try <strong>Wait for me</strong>. Listen out for the loud, crunchy strums the guitarist adds before the chorus!</p>`,
        diagrams: [CREEP.G, CREEP.B, CREEP.C, CREEP.Cm],
        practice: { items: creepItems, bpm: 92, modes: ["listen", "wait"], label: "Creep: G – B – C – Cm", drums: true } },
    ],
    chords: ["Bm", "F"],
  },
  {
    id: "lesson-genres", title: "Music has flavours: genres", subtitle: "Pop, rock, blues, jazz, reggae, flamenco, classical",
    pages: [
      { html: `<h3>Same guitar, different flavours 🍦</h3>
        <p>Styles of music are called <strong>genres</strong>: <strong>pop</strong>, <strong>rock</strong>, <strong>blues</strong>, <strong>jazz</strong>, <strong>reggae</strong>, <strong>flamenco</strong>, <strong>classical</strong>, and many more like country and R&amp;B.</p>
        <p>What changes is <strong>which chords</strong> they love and <strong>how you strum or pick</strong> them. Let's taste each one, and learn a song from it straight away!</p>` },
      { html: `<h3>Pop: catchy chords, round and round</h3>
        <p>Pop loves a short loop of 4 chords you can sing over. You already know the most famous one: <strong>G – D – Em – C</strong>, with the D · DU · UDU strum.</p>`,
        diagrams: ["G", "D", "Em", "C"], practice: { items: strumItems(["G", "D", "Em", "C"], DDUUDU), bpm: 80, modes: ["listen", "wait"], label: "Pop: G D Em C" } },
      { html: `<h3>A pop song to learn</h3><p>Four chords, a happy strum, and a big singalong chorus.</p>`, song: "Hey Soul Sister" },
      { html: `<h3>Rock: big, strong chords</h3>
        <p>Rock plays simple chords <strong>loud and driving</strong>, often with strong downstrums or power chords. A rock favourite: <strong>D – C – G</strong>.</p>`,
        diagrams: ["D", "C", "G"], practice: { items: strumItems(["D", "C", "G", "G"], ["down", "down", "down", "down", "down", "down", "down", "down"]), bpm: 96, modes: ["listen", "wait"], label: "Rock: D C G, all downstrums" } },
      { html: `<h3>A rock song to learn</h3><p>The same <strong>D – C – G</strong> you just played!</p>`, song: "Sweet Child O' Mine" },
      { html: `<h3>Blues: the parent of rock and jazz</h3>
        <p>The blues came from African American musicians in the southern United States in the late 1800s. The <strong>12-bar blues</strong> uses chords <strong>1, 4 and 5</strong> as 7th chords. In A: <strong>A7, D7, E7</strong>.</p>`,
        diagrams: ["A7", "D7", "E7"], practice: { items: strumItems(["A7", "A7", "A7", "A7", "D7", "D7", "A7", "A7", "E7", "D7", "A7", "E7"]), bpm: 92, modes: ["listen"], label: "12-bar blues in A" } },
      { html: `<h3>A blues to learn</h3><p>Thelonious Monk's <em>Blue Monk</em> is a 12-bar blues: the same 1, 4, 5 pattern you just played.</p>`, song: "Blue Monk" },
      { html: `<h3>Jazz: rich chords and the famous 2 – 5 – 1</h3>
        <p>Jazz grew out of the blues in <strong>New Orleans</strong> in the early 1900s. It loves rich 4-note chords and making things up as you go. Its most famous move is <strong>2 – 5 – 1</strong>: in C, <strong>Dm7 – G7 – Cmaj7</strong>.</p>`,
        diagrams: ["Dm7", "G7", "Cmaj7"], practice: { items: strumItems(["Dm7", "G7", "Cmaj7", "Cmaj7"]), bpm: 72, modes: ["listen", "wait"], label: "Jazz: Dm7 G7 Cmaj7" } },
      { html: `<h3>A jazz song to learn</h3><p>Listen for the 2 – 5 – 1 moves all through it.</p>`, song: "Fly Me to the Moon" },
      { html: `<h3>Reggae: strum on the off-beat</h3>
        <p>Reggae from Jamaica flips the strum: short, choppy chords on the <strong>"&amp;"</strong> between the beats, never on the beat.</p>
        <p class="jg-note">Count "1 & 2 & 3 & 4 &" and only strum (a quick upstroke) on each "&".</p>`,
        diagrams: ["A", "D", "E"], practice: { items: strumItems(["A", "D", "A", "E"], [null, "up", null, "up", null, "up", null, "up"]), bpm: 76, modes: ["listen"], label: "Reggae: upstrokes on the off-beat" } },
      { html: `<h3>A reggae song to learn</h3><p>Bob Marley's happiest song, with just <strong>A, D and E</strong>.</p>`, song: "Three Little Birds" },
      { html: `<h3>Flamenco: Spanish fire</h3>
        <p>Flamenco comes from Andalusia in the south of Spain. Its signature sound walks down <strong>Am – G – F – E</strong>, with fast finger flicks called <strong>rasgueado</strong>. Use the baby F!</p>`,
        diagrams: ["Am", "G", { name: "F (baby)", frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], barre: 1 }, "E"] },
      { html: `<h3>A flamenco-pop song to learn</h3><p>The Gipsy Kings mix flamenco guitar with pop.</p>`, song: "Bamboléo" },
      { html: `<h3>Classical: fingers, not a pick</h3>
        <p>Classical guitar is played with the <strong>fingers</strong>, picking the strings one at a time: a chord becomes a little melody. You'll learn it properly in the Fingerpicking and Classical guitar lessons.</p>`,
        diagrams: ["Am"], practice: { items: () => [[4, 0], [3, 2], [2, 2], [1, 1], [0, 0], [1, 1], [2, 2], [3, 2]].map(([string, fret], i) => ({ string, fret, start: i * 0.5, dur: 0.5 })), bpm: 70, modes: ["listen"], label: "Am, one string at a time" } },
      { html: `<h3>A classical piece to learn</h3><p>Beethoven's famous tune. Pick the chords one string at a time.</p>`, song: "Für Elise" },
      { html: `<h3>Which flavour is yours?</h3>
        <p>Pick songs from the style you love most and you'll practise more. Find them in <strong>Songs</strong>, or upload any song in <strong>Practice</strong>.</p>` },
    ],
  },
  {
    id: "lesson-sevenths", title: "Jargon alert! Extra chords", subtitle: "7ths, sus, add9 and maj7",
    pages: [
      { html: `<h3>Jargon alert! 🚨</h3>
        <p>You <strong>don't really need these</strong> for easier songs. But here are some other chords you'll see in songbooks, so the names don't scare you:</p>
        <ul>
          <li><strong>7</strong> (A7, D7, E7): adds a note that makes the chord want to move on. The sound of the blues.</li>
          <li><strong>maj7</strong> (Cmaj7, Fmaj7): soft and dreamy.</li>
          <li><strong>sus2 / sus4</strong> (Dsus2, Dsus4, Asus4): "suspended", the happy-or-sad note is swapped out, so it sounds open and waiting.</li>
          <li><strong>add9</strong> (Cadd9): the chord plus a sparkly extra note.</li>
        </ul>
        <p>Most of them are an open chord you know, with <strong>one finger added or moved</strong>. Tap each to hear it.</p>`,
        diagrams: ["A7", "D7", "E7", "Cmaj7", "Fmaj7", "Dsus2", "Dsus4", "Asus4", "Cadd9"] },
      { html: `<h3>The 12-bar blues</h3>
        <p>The <strong>12-bar blues</strong> in A: four bars of A7, two of D7, two of A7, then E7, D7, A7, E7. It's behind thousands of songs.</p>`,
        diagrams: ["A7", "D7", "E7"],
        practice: { items: strumItems(["A7", "A7", "A7", "A7", "D7", "D7", "A7", "A7", "E7", "D7", "A7", "E7"]), bpm: 92, modes: ["listen"], label: "12-bar blues in A" } },
      { html: `<h3>A song full of jargon chords: Wonderwall</h3>
        <p>Oasis's <em>Wonderwall</em> (1995), with a capo on fret 2, loops <strong>Em7 – G – Dsus4 – A7sus4</strong>. Big names, but look: your ring and pinky stay on the 3rd fret of the two thinnest strings the <strong>whole time</strong>, and only the other fingers move. Strum D · D U · U D U.</p>
        <p class="jg-note">Chords only, no lyrics or tab.</p>`,
        diagrams: ["Em7", "G", "Dsus4", "A7sus4"],
        practice: { items: strumItems(["Em7", "G", "Dsus4", "A7sus4", "Em7", "G", "Dsus4", "A7sus4"], DDUUDU), bpm: 87, modes: ["listen", "wait"], label: "Wonderwall loop" } },
      { html: `<h3>Wonderwall: the song</h3>`, song: "Wonderwall" },
    ],
  },
];

const INTERMEDIATE = [
  {
    id: "lesson-pentatonic", title: "Scales: the minor pentatonic", subtitle: "The solo scale",
    pages: [
      { html: `<h3>Five notes behind countless rock and blues solos.</h3>
        <p>The <strong>minor pentatonic</strong> has just five notes, and they all sound good together. Here's "box 1" in <strong>A minor</strong>, starting at the 5th fret: index finger plays everything at fret 5, ring or pinky the higher frets. Roots (A) are highlighted.</p>
        <p>Play it up and back down slowly with <strong>Wait for me</strong> and the microphone - clean before fast.</p>`,
        notes: AMIN_PENT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(AMIN_PENT), bpm: 72, modes: ["listen", "wait", "timed"], mic: true, label: "A minor pentatonic, box 1", showTab: true } },
      { html: `<h3>The same box, anywhere.</h3>
        <p>Slide the whole shape so your index starts on a different root and it's the pentatonic of that key - at the 7th fret it's <strong>B minor</strong> (you'll use it in the Hotel California and November Rain lessons).</p>`,
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
        <p>Seven notes - do, re, mi, fa, so, la, ti - the scale most melodies come from. This position covers frets 2 to 5, one finger per fret (index on 2, middle 3, ring 4, pinky 5). Roots (G) highlighted.</p>`,
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
          <li><strong>Slow and clean first.</strong> Set the metronome where you can play every note perfectly - even 60 BPM. Speed comes later, by itself.</li>
          <li><strong>One finger per fret.</strong> In a 4-fret box, index takes the lowest fret, pinky the highest. Keep fingers hovering close to the strings.</li>
          <li><strong>Alternate picking:</strong> down, up, down, up - never two downs in a row.</li>
          <li><strong>Up and back down</strong>, then play it in <strong>groups of three</strong> (1-2-3, 2-3-4, 3-4-5…) so your fingers learn the shape, not just a list.</li>
          <li><strong>Raise the tempo 5 BPM</strong> only after three clean runs in a row.</li>
          <li><strong>Make music:</strong> finish by improvising a little over a chord loop - that's what scales are for!</li>
        </ol>
        <p class="jg-note">The Practice tab has every scale in every key and position, with Wait for me and Play in time.</p>` },
      { html: `<h3>Too fast for your fingers? Easy tricks 🐾</h3>
        <p>On top of the routine:</p>
        <ul>
          <li><strong>Stay close:</strong> keep your fingers a few millimetres above the strings, and the pick only just past the string.</li>
          <li><strong>Bursts:</strong> play just 3–4 notes fast, rest, repeat. Short bursts build speed without tiring your hand.</li>
          <li><strong>Hammer-ons and pull-offs:</strong> let your fretting fingers sound some notes so you don't have to pick every one. Runs get smooth and fast.</li>
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
          <li><strong>Bend (b):</strong> push the string up toward the ceiling to raise the pitch - usually a whole step (two frets' worth). Use two or three fingers together for strength. Tab: <code>7b9</code>.</li>
          <li><strong>Hammer-on (h):</strong> pick one note, then slam another finger down higher on the same string without picking. Tab: <code>5h7</code>.</li>
          <li><strong>Pull-off (p):</strong> the reverse - flick a finger off the string to sound the lower note. Tab: <code>7p5</code>.</li>
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
        <p>The <strong>harmonic minor</strong> raises the 7th note (A → A#), which creates a strong pull back home - that's the dramatic, slightly exotic sound you hear over an F#7 chord in B minor.</p>`,
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
        <p>We won't copy the solo note for note. Instead you'll learn what it's <strong>built from</strong>: the chords, the scales and the techniques.</p>`, people: ["don-felder", "joe-walsh"], video: "hotel-california" },
      { html: `<h3>The chords underneath: B minor</h3>
        <p><strong>Bm – F#7 – A – E – G – D – Em – F#7</strong>. Learn to strum it first - every lick in the solo is aimed at these chords.</p>`,
        diagrams: ["Bm", "F#7", "A", "E", "G", "D", "Em", "F#7"],
        practice: { items: strumItems(["Bm", "F#7", "A", "E", "G", "D", "Em", "F#7"]), bpm: 74, modes: ["listen"], label: "Hotel California progression" } },
      { html: `<h3>The scales</h3>
        <p>The solo mostly uses <strong>B minor pentatonic</strong> and <strong>B natural minor</strong> (7th position), and leans on the <strong>harmonic minor</strong>'s A# whenever the F#7 chord comes round. A great habit it teaches: <strong>target the notes of the chord that's playing</strong> - e.g. land on F# or A# over F#7, on D over D.</p>
        <p>Practice idea (our own lick, not the record's): play B minor pentatonic over the progression in the Practice tab, and finish each phrase on a note of the current chord.</p>`,
        notes: BMIN_PENT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(BMIN_PENT), bpm: 80, modes: ["listen", "wait"], mic: true, label: "B minor pentatonic, 7th position", showTab: true } },
      { html: `<h3>The twin-guitar trick: harmony in thirds</h3>
        <p>For the famous ending, two guitars play the same melody at the same time, one a <strong>third</strong> above the other (about two scale steps higher). Try it with a friend: one plays the B minor scale from B, the other plays it from D, in step together.</p>` },
    ],
  },
  {
    id: "lesson-november", title: "Solo study: November Rain", subtitle: "Guns N' Roses, 1991",
    pages: [
      { html: `<h3>Slash's slow-burn solos</h3>
        <p>"November Rain" is a nearly nine-minute power ballad, led by Axl Rose's piano, with big orchestra-style strings he played on a synthesizer. <strong>Slash</strong> plays melodic solos full of long bends and wide vibrato, and for the finale the band kicks into a heavier outro with his most famous solo of the song.</p>
        <p class="jg-note">Guns N' Roses tune their guitars down a half step (to E♭), so to play along with the record you'd tune each string one half-step lower. The scales and shapes stay exactly the same.</p>
        <p>We'll practise his bends and vibrato in B minor, a comfy key for lead playing. (The song itself is in B major.) The solos are copyrighted, so here's what they're made of.</p>`, people: ["slash"], video: "november-rain" },
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
        <p><strong>Travis picking</strong> (named after Merle Travis) keeps the thumb alternating between two bass strings while the fingers add melody on top - the sound of countless folk and country songs.</p>`, people: ["merle-travis"],
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
    id: "lesson-stairway", title: "Song study: Stairway to Heaven", subtitle: "Led Zeppelin, 1971 - fingerpicking to a solo",
    pages: [
      { html: `<h3>One of the most famous guitar songs ever</h3>
        <p>"Stairway to Heaven" was written by <strong>Jimmy Page</strong> and <strong>Robert Plant</strong> and released on Led Zeppelin's fourth album in <strong>1971</strong>. It was never released as a single in the UK or US - yet it became one of the most-played rock songs on radio.</p>
        <p>It grows like a staircase: it starts soft, fingerpicked with recorders, adds a 12-string guitar, then drums, and ends as full-on hard rock with a famous solo. Page recorded that solo on a <strong>Fender Telecaster</strong> he'd been given by his friend Jeff Beck. Live, he played a <strong>double-neck guitar</strong> - a 12-string neck on top and a 6-string neck below - so he could switch parts without changing guitars.</p>
        <p class="jg-note">We don't copy Page's exact notes. You'll learn what the song is built from (chords, bass line, picking and scale) with our own exercises.</p>`, people: ["jimmy-page", "robert-plant"], video: "stairway" },
      { html: `<h3>The secret: a bass line that walks down</h3>
        <p>The intro keeps the <strong>A minor</strong> sound on top while the lowest note steps down one fret at a time: <strong>A → G# → G → F# → F</strong>. Each step makes a new chord name, even though your top fingers barely move:</p>
        <p><strong>Am – Am/G# – Am/G – D/F# – Fmaj7</strong>, then <strong>G</strong> and back to <strong>Am</strong>.</p>
        <p class="jg-note">A slash chord like "Am/G#" means "Am, with G# as the lowest note". Watch the bass note on the low strings move down in the diagrams.</p>`,
        diagrams: ["Am", "Am/G#", "Am/G", "D/F#", "Fmaj7", "G"] },
      { html: `<h3>Fingerpick it (our own exercise)</h3>
        <p>Thumb plays the bass note, then index, middle and ring fingers play the G, B and high e strings - the p-i-m-a pattern from the Fingerpicking lesson. Go slowly with <strong>Wait for me</strong> and the microphone: hear the bass walk down underneath.</p>`,
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
        <p>In the middle of the song the chords open up around <strong>C, D, Fmaj7 and Am</strong>. Strum them gently with the D · D U · U D U pattern - if you have a 12-string guitar, this is where it shines.</p>`,
        diagrams: ["C", "D", "Fmaj7", "Am"],
        practice: { items: strumItems(["C", "D", "Fmaj7", "Am", "C", "D", "Fmaj7", "Am"], DDUUDU), bpm: 72, modes: ["listen", "wait"], label: "C – D – Fmaj7 – Am", drums: true } },
      { html: `<h3>The solo: A minor pentatonic over Am – G – F</h3>
        <p>For the big ending, the band repeats <strong>Am – G – F</strong> and Page solos over it, mostly using the <strong>A minor pentatonic</strong> - the very first scale box you learned, at the <strong>5th fret</strong>. That's why it's such a great first "real" solo to explore.</p>
        <p>Practice the box below, then make up your own lines over the loop in the Practice tab (try Am, G, F with Downs ×4). A good habit: end each phrase on a note of the current chord - <strong>A</strong> over Am, <strong>G</strong> over G, <strong>F</strong> or <strong>C</strong> over F.</p>`,
        notes: AMIN_PENT.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(AMIN_PENT), bpm: 84, modes: ["listen", "wait", "timed"], mic: true, label: "A minor pentatonic, 5th position", showTab: true } },
    ],
  },
  {
    id: "lesson-classical", title: "Classical guitar: playing with your fingers", subtitle: "Spain - Tárrega, Segovia and Romance",
    people: ["tarrega", "segovia"],
    pages: [
      { html: `<h3>The guitar's home: Spain</h3>
        <p>The six-string classical guitar as we know it took shape in <strong>Spain</strong> in the 1800s - the luthier <strong>Antonio de Torres</strong> made the body bigger and perfected the fan-shaped bracing still used today. Composer <strong>Francisco Tárrega</strong> wrote beautiful pieces for it, and later <strong>Andrés Segovia</strong> carried it onto the world's great concert stages, proving the guitar could be a serious solo instrument.</p>
        <p>Classical guitarists use <strong>nylon strings</strong>, play with their <strong>fingers and nails</strong> (no pick), and sit with the guitar on the left leg, raised by a footstool.</p>`, people: ["tarrega", "segovia"], video: "segovia" },
      { html: `<h3>Your picking fingers have Spanish names</h3>
        <table class="jg-table">
          <tr><th>p</th><td>pulgar - thumb</td><td>plays the bass strings (6, 5, 4)</td></tr>
          <tr><th>i</th><td>índice - index</td><td>usually the G string</td></tr>
          <tr><th>m</th><td>medio - middle</td><td>usually the B string</td></tr>
          <tr><th>a</th><td>anular - ring</td><td>usually the high e string</td></tr>
        </table>
        <h3>Two ways to pluck</h3>
        <ul>
          <li><strong>Free stroke</strong> (tirando): pluck the string and your finger swings up into your palm, missing the next string. Used for chords and arpeggios.</li>
          <li><strong>Rest stroke</strong> (apoyando): pluck "through" the string so your finger comes to rest on the next string. Fuller and louder - for melodies.</li>
        </ul>
        <p>Keep your wrist slightly arched and still; the movement comes from the finger joints. Pluck from the fingertip, not the whole hand.</p>
        <p class="jg-note">Listen to the famous "tremolo" piece <em>Recuerdos de la Alhambra</em> (Tárrega, 1896) - the melody is one note plucked by a-m-i in a super-fast blur, with the thumb playing the bass.</p>`, video: "recuerdos" },
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
      { html: `<h3>Romance - "Spanish Romance" (traditional, public domain)</h3>
        <p>Nobody knows for sure who wrote this famous piece - that's why it's called <em>Romance anónimo</em>. It's in 3/4 time: each beat is three notes - the <strong>melody on the high e string</strong> (finger a, a rest stroke if you like), then the open <strong>B</strong> (m) and <strong>G</strong> (i) strings, with the <strong>low E</strong> bass (p) at the start of each bar. Here are the first four bars over E minor:</p>`,
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
        }, bpm: 50, modes: ["listen", "wait"], mic: true, label: "Romance - bars 1-4 (p-a-m-i)", showTab: true } },
    ],
  },
  {
    id: "lesson-world", title: "Guitar around the world", subtitle: "Flamenco, Italian tremolo, bossa nova, slack key and more",
    pages: [
      { html: `<h3>🇪🇸 Flamenco: the fastest strumming you'll ever see</h3>
        <p>Flamenco comes from Andalusia in southern Spain. Its guitarists - like the legendary <strong>Paco de Lucía</strong> - play with fingers and nails, tap on the guitar's body, and use the <strong>rasgueado</strong>: flicking the fingers out one after another across the strings - little finger, ring, middle, index - so fast it sounds like a drum roll.</p>
        <p>The classic flamenco chord walk is the <strong>Andalusian cadence</strong>: <strong>Am – G – F – E</strong>, falling step by step to that dramatic E chord. Below: a 4-finger rasgueado burst on each chord, then strums. Practise slowly; flamenco players spend years on this!</p>
        <p><strong>Next song to practise:</strong> "Bamboléo" by the Gipsy Kings. Find it in <strong>Songs</strong> (capo 2, shapes Em B7 Am C), with the official video.</p>`,
        people: ["paco-de-lucia"], video: "flamenco",
        diagrams: ["Am", "G", "F", "E"],
        practice: { items: () => chordTimeline(shapes(["Am", "G", "F", "E", "Am", "G", "F", "E"]), { beatsPerChord: 4, pattern: ["down", "down", "down", "down", "down", null, "up", null, "down", "down", "down", "down", "down", null, "up", null] }), bpm: 70, modes: ["listen", "wait"], label: "Andalusian cadence with rasgueado" } },
      { html: `<h3>🇮🇹 Italy and the Godfather sound: tremolo picking</h3>
        <p>Italian mandolin players make a single note <strong>sing</strong> by picking it super fast - down-up-down-up - over and over. That's <strong>tremolo picking</strong>. It's the shimmering sound guitarists use when they play the love theme from <strong>The Godfather</strong> (1972), composed by <strong>Nino Rota</strong>.</p>
        <p>Here's the technique on our own little A minor tune (not the film's music). Pick each note four times, fast and even, with a loose wrist and tiny movements.</p>
        <p class="jg-note">Classical guitarists do tremolo with their fingers instead (p-a-m-i, very fast) - listen to Tárrega's <em>Recuerdos de la Alhambra</em> (1896), the most famous tremolo piece ever.</p>`,
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
        <p>Hawaiian <strong>kī hōʻalu</strong> - "slack key" - means loosening ("slacking") some strings into an <strong>open tuning</strong>, so the open strings already make a chord. A favourite is "taro patch" tuning, <strong>D G D G B D</strong> (an open G chord). Players like <strong>Gabby Pahinui</strong> keep a rolling bass going with the thumb while the fingers play the melody - gentle, rippling music that sounds like the ocean.</p>`,
        people: ["gabby-pahinui"], video: "slack-key" },
      { html: `<h3>🌍 West Africa and 🇮🇳 India</h3>
        <ul>
          <li><strong>Mali:</strong> <strong>Ali Farka Touré</strong> played hypnotic, repeating fingerpicked lines rooted in centuries-old West African music - so close to American blues that people call it "desert blues". His album with Ry Cooder, <em>Talking Timbuktu</em>, won a Grammy.</li>
          <li><strong>Congo:</strong> in Congolese rumba and soukous, guitarists play bright, fast, interlocking melodies high up the neck - <strong>Franco Luambo</strong> was nicknamed "the Sorcerer of the Guitar".</li>
          <li><strong>India:</strong> <strong>Vishwa Mohan Bhatt</strong> turned a guitar into the <strong>Mohan veena</strong>, played lying flat with a slide, bending notes like a sitar to play Indian ragas. He won a Grammy with Ry Cooder for <em>A Meeting by the River</em>.</li>
        </ul>
        <p>Same six strings - completely different music. Which style will you try?</p>`,
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
        <p>Learning where the root sits in each shape lets you play any chord - and the scale around it - anywhere on the neck.</p>`,
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
        <p>Play the G major scale but treat <strong>A</strong> as home and you get <strong>A Dorian</strong> - minor, but with a brighter 6th note (F#). It's the sound of a lot of funk and Santana-style rock. Treat <strong>D</strong> as home and you get <strong>D Mixolydian</strong> - major with a flat 7th (C), a classic rock and blues sound.</p>
        <p>A practical way in: play your A minor pentatonic and add B and F#. That's Dorian, and the F# gives it the bright sound.</p>`,
        notes: scaleBox(9, [0, 2, 3, 5, 7, 9, 10], 5).map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(scaleBox(9, [0, 2, 3, 5, 7, 9, 10], 5)), bpm: 72, modes: ["listen", "wait"], mic: true, label: "A Dorian", showTab: true } },
    ],
  },
  {
    id: "lesson-wmggw", title: "Solo study: Prince & While My Guitar Gently Weeps", subtitle: "The 2004 Hall of Fame solo",
    pages: [
      { html: `<h3>The most famous guitar solo at a tribute show</h3>
        <p><strong>George Harrison</strong> wrote "While My Guitar Gently Weeps" for the Beatles' White Album in 1968. His friend <strong>Eric Clapton</strong> played the original lead guitar on the record.</p>
        <p>In March 2004, Harrison was inducted into the Rock and Roll Hall of Fame. Tom Petty, Jeff Lynne, Steve Winwood and George's son Dhani played the song, and <strong>Prince</strong> stepped up for the ending: a blazing three-minute solo. He leaned back so far off the edge of the stage that a stagehand had to catch him and push him back up! He kept playing, and finished by tossing his guitar high into the air and walking off. It's one of the most-watched live guitar moments ever.</p>
        <p class="jg-note">We won't copy the solo note for note. You'll learn what it's built from: the chords, the scale and Prince's tricks.</p>`,
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
