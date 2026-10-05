# Jaxx Guitar — status

_Last updated 2026-10-06._ This file is the checklist of everything requested for Jaxx Guitar, so nothing gets missed. ✅ done · 🟡 in progress / waiting on something · ⬜ not started.

Repo: https://github.com/Astryks/jaxxguitar · Site: https://jaxxguitar.com (GitHub Pages; DNS still to be set up, see below) · iOS bundle: `com.jaxxguitar.app`

---

## Requests and where they stand

### Curriculum
| | Request | Where |
|---|---|---|
| ✅ | Lesson 1 = the 4 chords that play 100 songs (user said "G A C D"; the real progression is G–D–Em–C, and the lesson explains this) | `lesson-1` |
| ✅ | Tune before starting: a free tuner, all six strings one by one | `p-tune` (2nd pre-lesson); tune-up check at the start of Lesson 1; Tuner tab |
| ✅ | Buy a cheap guitar (Facebook Marketplace etc.) and what to check before paying | `p-guitar` |
| ✅ | Intro to strings, fretboard, acoustic vs electric vs classical vs **ukulele** vs other guitars | `p-guitar`, `p-parts`, `p-strings`, `p-fretboard` |
| ✅ | Best practice for pressing frets | `p-press`, plus a recap in the strumming lesson |
| ✅ | Strumming: how much pressure, wrist, pick grip | `lesson-strum` → "How hard should you strum?" |
| ✅ | Left-handed vs right-handed (the app focuses on right-handed for now) | `p-hands` |
| ✅ | When to use a pick vs fingers; pick thickness and grip | `p-pick` |
| ✅ | Wearing the guitar: sitting, standing, straps ("not around your neck") | `p-hold` |
| ✅ | Fun lesson: a street performer and the amplifier (fact-corrected: teenage Les Paul's drive-in rig; he didn't invent the amplifier) | `lesson-lespaul` |
| ✅ | Mid-course: the guitarist who built a guitar with his dad (fact-corrected: Brian May of Queen, not Led Zeppelin) | `lesson-redspecial` |
| ✅ | Kid-friendly "how a guitar is built" and "how acoustics vibrate" | `p-howitworks` + fun-fact cards |
| ✅ | Intermediate: scales | pentatonic, major, natural/harmonic minor, "How to practise scales", modes (Advanced) |
| ✅ | Learning all chords | `lesson-all-chords` + **Practice → All chords** (12 roots × 10 chord types, every one validated) |
| ✅ | Solos: November Rain, Hotel California (taught via chords, scales and techniques; no copyrighted transcriptions) | `lesson-hotel`, `lesson-november` |
| ✅ | Stairway to Heaven at intermediate level | `lesson-stairway` + Songs library |
| ✅ | Countries and styles: classical/Spanish guitar, fingerpicking technique | `lesson-classical` (p-i-m-a, rest vs free stroke, *Romance*, which is public domain) |
| ✅ | Godfather tune and its really fast picking | `lesson-world` → tremolo picking on an original melody (the Godfather theme is copyrighted, so it's described, not printed) |
| ✅ | More world styles | `lesson-world`: flamenco rasgueado (Andalusian cadence), bossa nova, Hawaiian slack key, Mali/Congo, India's Mohan veena |

### App and experience
| | Request | Notes |
|---|---|---|
| ✅ | Falling "tetris" notes on a real fretboard; Listen / Wait for me / Play in time | `practice-widget.js`, `guitar-player.js` |
| ✅ | Songs library with the easiest capo and chord diagrams, play-along with a beat | 170 songs |
| ✅ | Practice tab: chord loop, scales, all chords, metronome + tap tempo, upload a song → chords | `practice-ui.js` |
| ✅ | Gamification: XP, levels, 3 daily quests, stars, streak + freezes, 2-minute daily review | `storage.js`, `daily-review.js` |
| ✅ | Random "Did you know?" facts between lessons (kid-friendly) | `fun-facts.js` |
| ✅ | Celebration = tiny musical notes falling from the sky | `app.js` `confetti()` |
| ✅ | Mascot: Jaxx the kitten (top hat, green vest), a different pose per lesson and screen | `assets/mascot/*.webp` (23 poses) |
| ✅ | Animated mascots: sways while talking, bops while music plays, hops on celebrate, wiggles on fun facts | CSS, respects reduced-motion |
| ✅ | App icon from the mascot | `assets/icons/`, iOS AppIcon |
| ✅ | Not locked to landscape; works in portrait (the fretboard scrolls sideways); dismissible rotate tip | |
| ✅ | No iOS text inflation, no stuck zoom; sound plays with the ringer switch on silent | |
| 🟡 | **Photos of every person mentioned** (Brian May, Les Paul, Hendrix, Segovia…) | Code is ready (`media.js`, with credit + licence under each photo). Freely licensed Wikimedia Commons photos are being researched; they need the owner's OK to download and bundle into `assets/people/`. |
| 🟡 | **Embed free YouTube videos** | Code is ready: click-to-load, youtube-nocookie.com on the web, opens YouTube in the iOS app. Official video IDs are being researched and verified. |

### Shipping
| | Item | Notes |
|---|---|---|
| ✅ | GitHub repo + Pages workflow; Pages enabled | |
| 🟡 | **Custom domain jaxxguitar.com** | Pages is set to redirect there, but the domain has **no DNS records yet**. At the registrar add A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` for `@`, and a CNAME `www → astryks.github.io`. Until then the site is unreachable. |
| ✅ | iOS project, Info.plist (mic text, encryption = NO), icon, App Store screenshots, listing draft | `ios/` |
| ⬜ | Owner confirms the name "Jaxx Guitar" and bundle ID `com.jaxxguitar.app` → create the App Store Connect record | |
| ⬜ | Archive and upload to TestFlight; owner tests; App Privacy, age rating and review contact (owner); submit when told | `ios/SUBMISSION_CHECKLIST.md` |
| ⬜ | Update the privacy policy once videos ship (tapping a video contacts YouTube) | `privacy.html` |

### Ideas not yet requested
- A left-handed (mirrored) fretboard view setting.
- More original licks per solo study.
- A tuner for alternate tunings (DADGAD, open G for slack key).

---

## How it's tested
- Every lesson page is opened in headless Chrome: 220 pages, 0 errors.
- Wait mode is tested with simulated microphone input, for single notes and chords.
- Screenshots are checked on desktop, landscape phone and portrait phone.
- `npm run check` validates every chord shape: notes in the chord, root and 3rd present, correct bass.
- App Store screenshots: serve on :8766, then run `node ios/screenshots/shoot.mjs`.
