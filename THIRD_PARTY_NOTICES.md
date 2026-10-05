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

## Photos of people

Freely licensed images from Wikimedia Commons, resized to small WebP portraits (that resizing is the only change), and credited in the app under each photo.

| Person | Author | Licence | Source |
|---|---|---|---|
| Ali Farka Touré | Tagles | Public domain | https://commons.wikimedia.org/wiki/File:Ali_Farka_Toure.jpg |
| B.B. King | Marco Tambara / Lightversus | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Bbking.jpg |
| Brian May | Gage Skidmore | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Brian_May_(54760284093).jpg |
| Christian Frederick Martin (C. F. Martin & Company founder) | Unknown author | Public domain | https://commons.wikimedia.org/wiki/File:Christian_Frederick_Martin.jpg |
| Django Reinhardt | William P. Gottlieb / Adam Cuerden | Public domain | https://commons.wikimedia.org/wiki/File:Django_Reinhardt_(Gottlieb_07301).jpg |
| Don Felder | TaurusEmerald | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Don_Felder_Auto_Club_2023.jpg |
| Eddie Van Halen | Carl Lender | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Eddie_Van_Halen_at_the_New_Haven_Coliseum.jpg |
| Jimi Hendrix | Original photographer unknown | Public domain | https://commons.wikimedia.org/wiki/File:Jimi_Hendrix_(1967)_(cropped).jpg |
| Jimmy Page | Avda | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Jimmy_Page_at_the_Echo_music_award_2013.jpg |
| João Gilberto | Tuca Vieira from São Paulo, Brazil | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Jo%C3%A3o_Gilberto.jpg |
| Joe Walsh | Derek Russell | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Joe_Walsh_2019.jpg |
| Les Paul | William P. Gottlieb | Public domain | https://commons.wikimedia.org/wiki/File:Les_Paul,_ca._Jan._1947_(William_P._Gottlieb_07001).jpg |
| Merle Travis | Film screenshot (Sutton Pictures) | Public domain | https://commons.wikimedia.org/wiki/File:Merle_Travis_in_Five_Minutes_to_Live_(1961).jpg |
| Paco de Lucía | Cornel Putan | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Paco_de_Luc%C3%ADa_4.jpg |
| Robert Plant | Raph_PH | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:RPlantSavGraceIpswich140324_(5_of_12)_(53589044022)_(cropped).jpg |
| Andrés Segovia | Erling Mandelmann | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Andr%C3%A9s_Segovia_(1963)_by_Erling_Mandelmann.jpg |
| Slash (musician) | Kreepin Deth | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Slash_live_in_London_2022_(Cropped_-_upright).jpg |
| Francisco Tárrega | Unknown | Public domain | https://commons.wikimedia.org/wiki/File:Francisco_tarrega_retrato.jpg |

## Videos

Some lessons link to YouTube videos (mostly from the artists' or labels' official channels). They're embedded click-to-load from youtube-nocookie.com and aren't redistributed by this app.

## Mascot

Jaxx the kitten artwork was supplied by the project owner (`assets/mascot/`).
