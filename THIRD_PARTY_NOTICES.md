# Third-Party Notices

Jaxx Guitar has one third-party runtime dependency, vendored in the repo
so the app never fetches code from a CDN and keeps working if the
upstream project is archived.

| Component | License | Use |
|---|---|---|
| `@spotify/basic-pitch` v1.0.1, vendored at `js/vendor/basic-pitch/` (code bundle + model weights `model/model.json`, `group1-shard1of1.bin`) | Apache-2.0, full text at `js/vendor/basic-pitch/LICENSE-basic-pitch.txt` | "Upload a song" in the Practice tab: audio → notes, on device, so the app can estimate the chords. Bundled with esbuild from the published npm tarball together with its runtime deps below. Unmodified. |
| ↳ `@tensorflow/tfjs` (inside the bundle) | Apache-2.0 | The ML runtime basic-pitch runs on. |
| ↳ `@tonejs/midi` (inside the bundle) | MIT, full text at `js/vendor/basic-pitch/LICENSE-tonejs-midi.txt` | basic-pitch-internal MIDI utilities. |
| Capacitor (`@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`) — iOS app wrapper only | MIT | Packages the web app as the iOS app. Not used by the website. |

Everything else — fretboard, chord diagrams, tab, falling notes, the
Karplus-Strong guitar synth, drums, metronome, pitch detection and tuner
— is plain DOM/SVG/Canvas/Web Audio written for this project or shared
with the sibling app Hayden Keys (same author).

## Song data

Chord names and progressions are musical facts cross-checked against at
least two independent sources (see `js/songs-data.js`). No lyrics, no
note-for-note transcriptions, nothing scraped from chord/tab databases.
Solo lessons (e.g. Hotel California, November Rain) teach the scales,
chords and techniques the solos use — they do not transcribe the solos.
Public-domain melodies (Ode to Joy, Greensleeves) are used in full.
