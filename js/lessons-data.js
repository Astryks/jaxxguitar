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
      { html: `<h3>Buying smart</h3>
        <p><strong>Size:</strong> adults use full size; younger kids often fit a 1/2 or 3/4 size.</p>
        <p><strong>Budget:</strong> a playable beginner acoustic or electric usually costs around $100–200 new — used ones on Facebook Marketplace can be much less.</p>
        <p><strong>Check before you buy:</strong> the strings shouldn't sit too high above the frets near the middle of the neck (that makes pressing hard); play every string at several frets and listen for buzzing; look along the neck to make sure it isn't visibly bent.</p>
        <p><strong>Handy extras:</strong> a few picks (medium thickness), a clip-on tuner (or this app's tuner), and a capo.</p>` },
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
        <p class="jg-fact">All six strings pull with about <strong>70 kilograms</strong> of force — like a grown-up hanging off your guitar all day long. That's why it needs braces and a truss rod!</p>` },
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
];

const BEGINNER = [
  {
    id: "lesson-1", title: "The 4 chords to play 100 songs", subtitle: "G, D, Em, C — the 1-5-6-4",
    pages: [
      { html: `<h3>Four chords play hundreds of songs.</h3>
        <p>"Let It Be", "Someone Like You", "I'm Yours", "With or Without You"… all built on the same 4-chord pattern. On guitar, the friendliest version is <strong>G – D – Em – C</strong>.</p>
        <p class="jg-note">You may have heard the famous four as "G, A, C, D" — the real pattern is <strong>G, D, Em and C</strong> (the 1st, 5th, 6th and 4th chords of the key of G, which is why it's called "1-5-6-4"). G-C-D are in there; the fourth chord is E minor, not A.</p>`,
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
    pages: [
      { html: `<h3>Hold the pick and strum from the wrist.</h3>
        <p>Pinch the pick between your thumb and the side of your index finger, with just the tip showing. Strum with a loose wrist, like shaking water off your hand — not a stiff arm.</p>
        <p><strong>Downstrums</strong> go toward the floor (thick strings first); <strong>upstrums</strong> come back up and usually just catch the thinner strings.</p>` },
      { html: `<h3>Count "1 & 2 & 3 & 4 &"</h3>
        <p>Your hand moves down on every number and up on every "&" — all the time, like a pendulum — even when it doesn't touch the strings. That steady motion is the secret to good rhythm.</p>
        <p>The most-used pattern in pop and folk: <span class="jg-strum">D · D U · U D U</span> (down on 1, down on 2, up on "&", miss 3, up on "&", down on 4, up on "&").</p>`,
        diagrams: ["G"],
        practice: { items: strumItems(["G", "G", "C", "C"], DDUUDU), bpm: 70, modes: ["listen"], label: "D · D U · U D U on G and C" } },
    ],
  },
  {
    id: "lesson-changes", title: "Changing chords without stopping", subtitle: "Anchor fingers and one-minute changes",
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
    id: "lesson-lespaul", fun: true, title: "Just for fun: the teenager who needed to be heard", subtitle: "Les Paul",
    pages: [
      { html: `<h3>Too quiet for the crowd</h3>
        <p>In the 1920s and '30s, a teenage guitarist from Waukesha, Wisconsin called <strong>Les Paul</strong> played at drive-ins and roadside stands — often outdoors, where an acoustic guitar just got lost.</p>
        <p>So he rigged up his own solution: he jammed a <strong>record-player needle</strong> into his guitar to pick up the vibrations and ran it into a <strong>radio speaker</strong>. Suddenly people could hear him.</p>
        <p>That homemade hack started a lifetime of inventing. Les Paul went on to build one of the first <strong>solid-body electric guitars</strong> (nicknamed "The Log" — a block of wood with a guitar neck), which led to the famous Gibson Les Paul guitar. He also pioneered multitrack recording.</p>
        <p class="jg-fact">He's in both the <strong>Rock and Roll Hall of Fame</strong> and the <strong>National Inventors Hall of Fame</strong> — often called the only person in both. Isn't that amazing?</p>
        <p class="jg-note">To be precise: he didn't invent the amplifier itself — but his DIY rig to be heard as a young performer is a big part of how the electric guitar came to be.</p>` },
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
        <p class="jg-note">This story is sometimes mixed up with Led Zeppelin — it's actually Brian May of Queen, and the guitar is now one of the most famous instruments in rock.</p>` },
    ],
  },
  {
    id: "lesson-barre", title: "Barre chords: F and Bm", subtitle: "One shape, every chord",
    pages: [
      { html: `<h3>Your index finger becomes the nut.</h3>
        <p>Lay your index finger flat across all the strings at one fret (a <strong>barre</strong>), and make an E-shape or A-shape chord with your other fingers in front of it.</p>
        <p><strong>F</strong> is the E-shape at the 1st fret. <strong>Bm</strong> is the A-minor shape at the 2nd fret. Tips: roll your index slightly onto its bony side, keep your elbow in, and press just enough.</p>`,
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
    id: "lesson-major-scale", title: "The major scale", subtitle: "Do re mi on the fretboard",
    pages: [
      { html: `<h3>G major, in one position.</h3>
        <p>Seven notes — do, re, mi, fa, so, la, ti — the scale most melodies come from. This position covers frets 2 to 5, one finger per fret (index on 2, middle 3, ring 4, pinky 5). Roots (G) highlighted.</p>`,
        notes: GMAJ.map((n) => ({ string: n.string, fret: n.fret, tone: n.root ? "root" : undefined, label: String(n.fret) })),
        practice: { items: scaleItems(GMAJ), bpm: 72, modes: ["listen", "wait", "timed"], mic: true, label: "G major scale", showTab: true } },
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
    id: "lesson-hotel", title: "Solo study: Hotel California", subtitle: "Eagles, 1976",
    pages: [
      { html: `<h3>One of the most famous guitar solos ever.</h3>
        <p>The song's long outro solo is played by <strong>Don Felder</strong> and <strong>Joe Walsh</strong>, trading lines and then playing together in harmony with flowing arpeggios. In 1998, readers of <em>Guitarist</em> magazine voted it the best guitar solo of all time.</p>
        <p>The solo is copyrighted, so we won't copy it note for note — instead you'll learn what it's <strong>built from</strong>: its chord progression, its scales, and the techniques.</p>` },
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
        <p>Like Hotel California, the solos are copyrighted — so here's what they're made of.</p>` },
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
        <p><strong>Travis picking</strong> (named after Merle Travis) keeps the thumb alternating between two bass strings while the fingers add melody on top — the sound of countless folk and country songs.</p>`,
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
        <p class="jg-note">The recording is copyrighted, so we don't copy Page's guitar part note for note. You'll learn what it's built from — the chords, the bass line, the picking style and the scale — and play our own exercises with them.</p>` },
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
];

export { PRE, BEGINNER, INTERMEDIATE, ADVANCED, shapes, strumItems };
