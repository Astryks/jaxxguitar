# Jaxx Guitar — status

_Last updated 2026-10-06._ This file is the checklist of everything requested for Jaxx Guitar, so nothing gets missed. ✅ done · 🟡 in progress / waiting on something · ⬜ not started.

Repo: https://github.com/Astryks/jaxxguitar · Site: https://jaxxguitar.com (GitHub Pages) · iOS bundle: `com.jaxxguitar.app`

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
| ✅ | Advanced: Prince's solo in While My Guitar Gently Weeps | `lesson-wmggw`: the 2004 Hall of Fame story, the lament-bass chords, A minor pentatonic + Dorian/harmonic-minor colour notes, an original fast run; photos of Prince and George Harrison; official Rock Hall video. Also in the Songs library. |
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
| ✅ | Home: one step at a time (welcome box, then a fun fact with a single Start lesson button); no 1-5-6-4 jargon | |
| ✅ | Open chords vs barre chords, and the baby F (plus Fmaj7) early in Beginner | `lesson-open-barre` |
| ✅ | Mascot: Jaxx the kitten (top hat, green vest), a different pose per lesson and screen | `assets/mascot/*.webp` (23 poses) |
| ✅ | Animated mascots: sways while talking, bops while music plays, hops on celebrate, wiggles on fun facts | CSS, respects reduced-motion |
| ✅ | App icon from the mascot | `assets/icons/`, iOS AppIcon |
| ✅ | Not locked to landscape; works in portrait (the fretboard scrolls sideways); dismissible rotate tip | |
| ✅ | No iOS text inflation, no stuck zoom; sound plays with the ringer switch on silent | |
| ✅ | **Photos of every person mentioned** (Brian May, Les Paul, Hendrix, Segovia…) | 18 freely licensed Wikimedia Commons photos in `assets/people/`, author and licence under each one and in THIRD_PARTY_NOTICES. No free photo exists for Leo Fender or Gabby Pahinui; the Nino Rota image was skipped because its source was unclear. |
| ✅ | **Embed free YouTube videos** | 14 videos, IDs verified, mostly official channels (Led Zeppelin, Eagles, Guns N' Roses, Queen, Les Paul, Martin Guitar, Smithsonian…). Click-to-load: youtube-nocookie.com on the web, opens YouTube in the iOS app. Privacy policy updated. |

### Shipping
| | Item | Notes |
|---|---|---|
| ✅ | GitHub repo + Pages workflow; Pages enabled | |
| ✅ | Custom domain jaxxguitar.com | DNS set 2026-10-06 (4 A records + www CNAME); site is live. ⬜ Once GitHub's certificate is issued, tick **Enforce HTTPS** in Settings → Pages. |
| ✅ | iOS project, Info.plist (mic text, encryption = NO), icon, App Store screenshots, listing draft | `ios/` |
| ✅ | App Store Connect record "Jaxx Guitar" (`com.jaxxguitar.app`, SKU `jaxxguitar-ios-1`, app ID 6819445036) | Created 2026-10-06 |
| ✅ | Build 1.0 (1) uploaded to App Store Connect | It doesn't include the photos/videos added afterwards; upload build 2 before submitting |
| ✅ | Build 1.0 (2) with photos and videos uploaded | 2026-10-06 |
| ✅ | Store text entered in App Store Connect: promo text, description, keywords, support URL, subtitle, categories (Education / Music), privacy URL, price Free, all 175 countries | |
| ⬜ | Owner: upload the screenshots from `ios/screenshots/` (6.9", 6.5", iPad 13"), select build 2 on the version page, fill in Content Rights, Age Rating, App Privacy (Publish) and App Review contact | The browser pane can't upload files |
| ⬜ | Owner: App Privacy ("Data Not Collected"), age rating, App Review contact, TestFlight test; submit only when the owner says so | |
| ✅ | Privacy policy mentions the optional YouTube videos | `privacy.html` |

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

## 2026-10-07: upload, Guess the song (ShazamKit), song fixes
- **Upload:**
  - **Heading:** "Upload any song and we'll find the chords for you!" with a big 📂 Choose a song button, and the disclaimer as small bracketed text.
  - **Layout:** a big ▶ Play right above the fretboard, then chord shapes falling onto it in time.
  - **Settings in "⚙️ Customise" below the fretboard:** capo, sound (original / guitar / both), chord diagrams, Guess the song, and songs with the same chords.
  - **Chord timing:** follows the tempo, 1 beat per chord on slow songs and 2 on fast ones.
- **🔎 Guess the song (iPhone/iPad app):**
  - **How it works:** the same ShazamKit native plugin as Hayden Keys (`SongRecognizerPlugin.swift`, registered in `JGBridgeViewController.swift`). Opt-in button; shows "We think this is…" with Open in Apple Music and Learn the whole song.
  - **Privacy policy:** updated.
  - **⬜ Owner:** enable the ShazamKit App Service for **com.jaxxguitar.app** (developer.apple.com → Identifiers → com.jaxxguitar.app → App Services → ShazamKit → Save).
- **"These songs use the same chords":** the heard loop is compared with the library in any key; tap one to open it in Songs.
- **Song data fixes (shared with Hayden Keys):**
  - Viva La Vida, Just the Way You Are, Hey Soul Sister and Shallow corrected.
  - Can You Feel the Love Tonight and Mr. Brightside marked as close versions.
  - Let It Be and Perfect chorus chords fixed.
  - Teaching-key labels like "G major (original recording in Ab major)".
- **iOS build 5.**
