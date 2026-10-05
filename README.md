# Jaxx Guitar

A free, gamified guitar course that runs entirely on your device: no account, no ads, no server.
It is the sibling of [Hayden Keys](https://haydenkeys.com) (piano).

- **Lessons, from first chord to CAGED**
  - Before you start: choosing a guitar, its parts, strings and tuning, the fretboard, and how to press a fret cleanly.
  - Beginner: G–D–Em–C (the 4 chords behind hundreds of songs), strumming, chord changes, major vs minor, the capo, reading tab, power chords, barre chords, and 7ths plus the 12-bar blues.
  - Just-for-fun stories: Les Paul's teenage amplifier hack and Brian May's Red Special.
  - Intermediate: pentatonic, major and minor scales, lead techniques, Hotel California and November Rain solo studies, and fingerpicking.
  - Advanced: CAGED, Greensleeves, and modes.
  - Song lessons for each level, plus optional World songs in 10 languages.
- **Falling notes onto a real fretboard.** Blocks land in the exact string and fret to play.
  - *Listen*: the app plays it for you.
  - *Wait for me*: it waits until the microphone hears your note or chord.
  - *Play in time*: single notes, scored.
- **Songs**: 169 songs with chord charts. Each shows its easiest capo position and chord diagrams, plus a play-along with a drum beat. Chord names only; no lyrics.
- **Practice tab**:
  - A chord-loop builder.
  - Scale boxes in any key and position.
  - A metronome with tap tempo.
  - **Upload a song**: works out the chords on your device (Spotify's basic-pitch, vendored) and shows the shapes in time with the music.
- **Tuner**: a per-string tuner that turns green within ±8 cents.
- **Daily habits**: XP, levels, 3 daily quests, stars, a streak with freezes, and a 2-minute spaced-repetition daily review.

## Run locally

```
python3 -m http.server 8766
```

Then open http://localhost:8766. There's no build step.

## Checks

`npm run check` validates every chord shape in the library: the notes must belong to the chord, the root and third must be present, and the lowest note must be the root or the bass note.

## iOS

The iOS app is a Capacitor wrapper (`com.jaxxguitar.app`). Build it with `npm install && npm run cap:sync && npm run cap:open:ios`; see `ios/SUBMISSION_CHECKLIST.md`.

## Legal

See THIRD_PARTY_NOTICES.md. Solo lessons teach the scales and techniques, not transcriptions of copyrighted solos.
