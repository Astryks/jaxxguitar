// Riff of the Day: short single-note riffs and licks written as guitar tab.
//
// Every riff here is either
//   - a PUBLIC-DOMAIN melody (traditional songs, or composers who died
//     long ago: Beethoven, Grieg, Pierpont...), arranged by us for guitar, or
//   - an ORIGINAL lick written for Jaxx Guitar "in the style of" a genre
//     (blues, country, metal, funk...). Genre idioms (a boogie shuffle, a
//     blues turnaround, a bass walk-up) are shared musical vocabulary; no
//     copyrighted riff is transcribed here.
//
// Notes are written the guitarist's way, [string, fret, beat, beats]:
// string 1 = high e ... 6 = low E; beat = when it starts (0 = first beat);
// beats = how long it rings. riffEvents() converts them to the app's tab
// events ({ string: 0 = low E, fret, start, dur }) used by tabSvg().

const RIFFS = [
  {
    id: "ode-to-joy", title: "Ode to Joy", source: "Public domain: Beethoven, Symphony No. 9 (1824)",
    level: "Beginner", bpm: 100, beatsPerBar: 4,
    tip: "Everything sits on the top two strings. Use one finger per fret: index on fret 1, ring on fret 3.",
    notes: [[1, 0, 0], [1, 0, 1], [1, 1, 2], [1, 3, 3], [1, 3, 4], [1, 1, 5], [1, 0, 6], [2, 3, 7], [2, 1, 8], [2, 1, 9], [2, 3, 10], [1, 0, 11], [1, 0, 12, 1.5], [2, 3, 13.5, 0.5], [2, 3, 14, 2]],
  },
  {
    id: "greensleeves", title: "Greensleeves", source: "Public domain: traditional English tune (16th century)",
    level: "Beginner", bpm: 92, beatsPerBar: 3,
    tip: "A lilting 3-beat feel: count 1-2-3 and lean on each 1.",
    notes: [[3, 2, 2], [2, 1, 3, 2], [2, 3, 5], [1, 0, 6, 1.5], [1, 1, 7.5, 0.5], [1, 0, 8], [2, 3, 9, 2], [2, 0, 11], [3, 0, 12, 1.5], [3, 2, 13.5, 0.5], [2, 0, 14], [2, 1, 15, 2], [3, 2, 17], [3, 2, 18, 1.5], [3, 1, 19.5, 0.5], [3, 2, 20], [2, 0, 21, 2], [3, 1, 23], [4, 2, 24, 3]],
  },
  {
    id: "rising-sun-arpeggio", title: "Rising Sun arpeggio", source: "Public domain: traditional folk song, picked Am - C - D - F",
    level: "Beginner", bpm: 120, beatsPerBar: 3,
    tip: "Hold each chord shape for the whole bar and let the strings ring into each other.",
    notes: [
      [5, 0, 0], [4, 2, 0.5], [3, 2, 1], [2, 1, 1.5], [1, 0, 2], [2, 1, 2.5],
      [5, 3, 3], [4, 2, 3.5], [3, 0, 4], [2, 1, 4.5], [1, 0, 5], [2, 1, 5.5],
      [4, 0, 6], [3, 2, 6.5], [2, 3, 7], [1, 2, 7.5], [2, 3, 8], [3, 2, 8.5],
      [4, 3, 9], [3, 2, 9.5], [2, 1, 10], [1, 1, 10.5], [2, 1, 11], [3, 2, 11.5, 1],
    ],
  },
  {
    id: "amazing-grace", title: "Amazing Grace", source: "Public domain: traditional hymn tune (words John Newton, 1779)",
    level: "Beginner", bpm: 84, beatsPerBar: 3,
    tip: "Slide gently into the long notes and let them ring.",
    notes: [[4, 0, 2], [3, 0, 3, 2], [2, 0, 5, 0.5], [3, 0, 5.5, 0.5], [2, 0, 6, 2], [3, 2, 8], [3, 0, 9, 2], [4, 2, 11], [4, 0, 12, 3]],
  },
  {
    id: "saints", title: "When the Saints Go Marching In", source: "Public domain: traditional gospel/jazz tune",
    level: "Beginner", bpm: 120, beatsPerBar: 4,
    tip: "The first note comes after a rest: count \"1\" silently, then play.",
    notes: [[2, 1, 1], [1, 0, 2], [1, 1, 3], [1, 3, 4, 4], [2, 1, 9], [1, 0, 10], [1, 1, 11], [1, 3, 12, 4]],
  },
  {
    id: "twinkle", title: "Twinkle, Twinkle, Little Star", source: "Public domain: traditional French melody (1761)",
    level: "Beginner", bpm: 100, beatsPerBar: 4,
    tip: "Great for training your pinky: the A on fret 5 is a stretch at first.",
    notes: [[2, 1, 0], [2, 1, 1], [1, 3, 2], [1, 3, 3], [1, 5, 4], [1, 5, 5], [1, 3, 6, 2], [1, 1, 8], [1, 1, 9], [1, 0, 10], [1, 0, 11], [2, 3, 12], [2, 3, 13], [2, 1, 14, 2]],
  },
  {
    id: "morning-mood", title: "Morning Mood (simplified)", source: "Public domain: Grieg, Peer Gynt (1875)",
    level: "Beginner", bpm: 84, beatsPerBar: 3,
    tip: "Gentle and flowing, like a sunrise. Keep it soft.",
    notes: [[1, 3, 0], [1, 0, 0.5], [2, 3, 1], [2, 1, 1.5], [2, 3, 2], [1, 0, 2.5], [1, 3, 3], [1, 0, 3.5], [2, 3, 4], [2, 1, 4.5], [2, 3, 5], [1, 0, 5.5], [2, 3, 6], [1, 0, 6.5], [1, 3, 7], [1, 0, 7.5], [1, 3, 8], [1, 5, 8.5, 1.5]],
  },
  {
    id: "jingle-bells", title: "Jingle Bells", source: "Public domain: James Lord Pierpont (1857)",
    level: "Beginner", bpm: 120, beatsPerBar: 4,
    tip: "Repeated notes: pick down-up-down so your hand stays relaxed.",
    notes: [[1, 0, 0], [1, 0, 1], [1, 0, 2, 2], [1, 0, 4], [1, 0, 5], [1, 0, 6, 2], [1, 0, 8], [1, 3, 9], [2, 1, 10, 1.5], [2, 3, 11.5, 0.5], [1, 0, 12, 4]],
  },
  {
    id: "frere-jacques", title: "Frère Jacques", source: "Public domain: traditional French round",
    level: "Beginner", bpm: 110, beatsPerBar: 4,
    tip: "Play it while a friend starts 2 bars later: it's a round!",
    notes: [[2, 1, 0], [2, 3, 1], [1, 0, 2], [2, 1, 3], [2, 1, 4], [2, 3, 5], [1, 0, 6], [2, 1, 7], [1, 0, 8], [1, 1, 9], [1, 3, 10, 2], [1, 0, 12], [1, 1, 13], [1, 3, 14, 2]],
  },
  {
    id: "romance", title: "Spanish Romance (opening)", source: "Public domain: Romance Anónimo, traditional Spanish guitar piece",
    level: "Intermediate", bpm: 66, beatsPerBar: 3,
    tip: "Triplets: melody on the high e with your ring finger (a), then the open B and G strings. Low E rings under it.",
    notes: (() => {
      const mel = [7, 7, 7, 7, 5, 3, 3, 2, 0, 0, 3, 7];
      const out = [];
      mel.forEach((f, beat) => {
        if (beat % 3 === 0) out.push([6, 0, beat, 3]);
        out.push([1, f, beat, 1 / 3], [2, 0, beat + 1 / 3, 1 / 3], [3, 0, beat + 2 / 3, 1 / 3]);
      });
      return out;
    })(),
  },
  {
    id: "boogie-shuffle", title: "Boogie shuffle in A", source: "Original: the classic blues boogie pattern (a shared idiom, no song copied)",
    level: "Beginner", bpm: 100, beatsPerBar: 4, swing: true,
    tip: "Two strings at once. Keep the index on fret 2 and reach the pinky (or ring) to fret 4. Swing it: long-short, long-short.",
    notes: [[5, 0, 0], [4, 2, 0], [5, 0, 1], [4, 2, 1], [5, 0, 2], [4, 4, 2], [5, 0, 3], [4, 4, 3],
      [4, 0, 4], [3, 2, 4], [4, 0, 5], [3, 2, 5], [4, 0, 6], [3, 4, 6], [4, 0, 7], [3, 4, 7]],
  },
  {
    id: "blues-turnaround", title: "Blues turnaround in E", source: "Original, in the style of Delta blues (a standard blues move)",
    level: "Intermediate", bpm: 80, beatsPerBar: 4,
    tip: "The high e rings open while your finger walks down the G string one fret at a time, then land on B7.",
    notes: [[1, 0, 0], [3, 4, 0], [1, 0, 1], [3, 3, 1], [1, 0, 2], [3, 2, 2], [1, 0, 3], [3, 1, 3], [6, 0, 4, 2], [5, 2, 6, 2], [4, 1, 6, 2], [3, 2, 6, 2], [2, 0, 6, 2], [1, 2, 6, 2]],
  },
  {
    id: "penta-lick-a", title: "First pentatonic lick", source: "Original, in the style of classic rock solos (A minor pentatonic, 5th position)",
    level: "Intermediate", bpm: 90, beatsPerBar: 4,
    tip: "Index finger stays on fret 5, ring finger plays fret 7 or 8. End on the A and add a little vibrato.",
    notes: [[1, 8, 0, 0.5], [1, 5, 0.5, 0.5], [2, 8, 1, 0.5], [2, 5, 1.5, 0.5], [3, 7, 2, 0.5], [3, 5, 2.5, 0.5], [4, 7, 3, 1], [4, 5, 4, 0.5], [3, 5, 4.5, 0.5], [3, 7, 5, 1], [4, 7, 6, 2]],
  },
  {
    id: "em-penta-run", title: "Open E minor pentatonic run", source: "Original exercise (E minor pentatonic in open position)",
    level: "Beginner", bpm: 90, beatsPerBar: 4,
    tip: "Two notes per string, all the way up and back. Alternate down-up picking.",
    notes: [[6, 0, 0], [6, 3, 0.5], [5, 0, 1], [5, 2, 1.5], [4, 0, 2], [4, 2, 2.5], [3, 0, 3], [3, 2, 3.5], [2, 0, 4], [2, 3, 4.5], [1, 0, 5], [1, 3, 5.5], [1, 0, 6], [2, 3, 6.5], [2, 0, 7], [3, 2, 7.5, 0.5]],
  },
  {
    id: "country-walkup", title: "Country walk-up in G", source: "Original, in the style of country boom-chick (bass walk-up idiom)",
    level: "Beginner", bpm: 110, beatsPerBar: 4,
    tip: "Bass note, then a thinner string: boom, chick. Walk up A-B-C to arrive at the C chord.",
    notes: [[6, 3, 0], [3, 0, 1], [4, 0, 2], [3, 0, 3], [6, 3, 4], [5, 0, 5], [5, 2, 6], [5, 3, 7], [3, 0, 7.5, 0.5], [2, 1, 8, 2]],
  },
  {
    id: "gallop", title: "Metal gallop", source: "Original, in the style of 80s heavy metal (E5 - C5 - D5 power chords)",
    level: "Intermediate", bpm: 100, beatsPerBar: 4,
    tip: "Gallop = one long, two short (da-da-dum). Rest the side of your picking hand on the strings by the bridge for a tight, chunky sound.",
    notes: (() => {
      const out = [];
      const chords = [[[6, 0], [5, 2]], [[6, 0], [5, 2]], [[5, 3], [4, 5]], [[5, 5], [4, 7]]];
      chords.forEach((ch, bar) => {
        [0, 0.5, 0.75, 1, 1.5, 1.75].forEach((t) => ch.forEach(([s, f]) => out.push([s, f, bar * 2 + t, t % 1 === 0 ? 0.5 : 0.25])));
      });
      return out;
    })(),
  },
  {
    id: "funk-e", title: "Funky E groove", source: "Original, in the style of 70s funk (single notes on the low strings)",
    level: "Intermediate", bpm: 96, beatsPerBar: 4,
    tip: "Short and choppy: lift your fretting finger right after each note so it doesn't ring.",
    notes: [[6, 0, 0, 0.5], [6, 0, 0.75, 0.25], [6, 3, 1.5, 0.25], [6, 0, 2, 0.25], [5, 2, 2.5, 0.25], [5, 0, 2.75, 0.25], [6, 3, 3.25, 0.25], [6, 2, 3.5, 0.5]],
  },
  {
    id: "desert-twang", title: "Desert highway twang", source: "Original, in the style of spaghetti-western guitar",
    level: "Beginner", bpm: 76, beatsPerBar: 4,
    tip: "Pick near the bridge for that twangy sound and let the low notes ring.",
    notes: [[6, 0, 0, 1.5], [6, 3, 1.5, 0.5], [5, 2, 2], [5, 0, 3], [6, 3, 4, 1.5], [6, 2, 5.5, 0.5], [6, 0, 6, 2]],
  },
  {
    id: "folk-hammer", title: "Folk hammer-ons in C", source: "Original, in the style of folk fingerpicking",
    level: "Intermediate", bpm: 90, beatsPerBar: 4,
    tip: "Pick the open D string, then hammer your middle finger down on fret 2 without picking again.",
    notes: [[5, 3, 0], [3, 0, 0.5], [4, 0, 1, 0.25], [4, 2, 1.25, 0.25], [2, 1, 1.5], [3, 0, 2], [5, 3, 2.5], [4, 2, 3], [2, 1, 3.5],
      [5, 3, 4], [3, 0, 4.5], [4, 0, 5, 0.25], [4, 2, 5.25, 0.25], [2, 1, 5.5], [1, 0, 6, 2]],
  },
  {
    id: "pop-arpeggio", title: "Pop ballad arpeggio", source: "Original picking pattern over G - Em - C - D",
    level: "Beginner", bpm: 96, beatsPerBar: 4,
    tip: "Bass note with your thumb, then the next three strings with your fingers (p-i-m-a).",
    notes: [[6, 3, 0], [4, 0, 0.5], [3, 0, 1], [2, 0, 1.5], [6, 0, 2], [4, 2, 2.5], [3, 0, 3], [2, 0, 3.5],
      [5, 3, 4], [4, 2, 4.5], [3, 0, 5], [2, 1, 5.5], [4, 0, 6], [3, 2, 6.5], [2, 3, 7], [1, 2, 7.5, 0.5]],
  },
  {
    id: "reggae-bass", title: "Island bass line", source: "Original, in the style of roots reggae (one-drop feel)",
    level: "Beginner", bpm: 76, beatsPerBar: 4,
    tip: "Leave the first beat empty: reggae bass lines often rest on \"1\" and land on beat 3.",
    notes: [[5, 0, 0.5, 0.5], [5, 0, 1], [4, 2, 1.5, 0.5], [6, 3, 2, 1.5], [5, 0, 3.5, 0.5], [4, 0, 4.5, 0.5], [4, 0, 5], [5, 3, 5.5, 0.5], [5, 2, 6, 1.5], [5, 0, 7.5, 0.5]],
  },
];

// Tab events ({ string: 0 = low E, fret, start, dur }) for tabSvg().
function riffEvents(riff) {
  return riff.notes.map(([s, fret, start, dur]) => ({ string: 6 - s, fret, start, dur: dur ?? 1 }));
}

export { RIFFS, riffEvents };
