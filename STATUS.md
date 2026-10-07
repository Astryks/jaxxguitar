# Jaxx Guitar — status

_Last updated 2026-10-07._ This file is the checklist of everything requested for Jaxx Guitar, so nothing gets missed. ✅ done · 🟡 in progress / waiting on something · ⬜ not started.

Repo: https://github.com/Astryks/jaxxguitar · Site: https://jaxxguitar.com (GitHub Pages) · iOS bundle: `com.jaxxguitar.app`

---

## ▶ Start here: handoff summary (2026-10-07)

**Jaxx Guitar**, repo https://github.com/Astryks/jaxxguitar, site https://jaxxguitar.com, bundle `com.jaxxguitar.app` (App Store Connect app ID 6819445036). Sibling app: Hayden Keys (https://github.com/Astryks/haydenkeys).

**What's done (full history below):** pre-lessons (get a guitar → electric gear → tune it with the string tuner), Lesson 1 / Strumming / Changing chords as simple kitten cards, all the curriculum in the table below, animated orange kitten Jaxx with his guitar, falling-notes fretboard with Listen / Wait for me / Play in time, upload a song → chords, Guess the song (ShazamKit), Netflix-style song library (270 songs, incl. a new **Metal** row and International / Karaoke anthems) with album art, Main part / Whole song and the official YouTube video, How it works page, Astryks credit, App Store screenshots and listing text.

**Latest build:** 18 (see bottom). **Not submitted to App Review yet.**

### Next steps (in order)
1. **TestFlight:** check the latest build appears in App Store Connect → TestFlight (processing takes 5–30 min; Apple emails if a build fails processing). Add it to the internal tester group and install on the phone.
2. **Test on a phone:** Wait for me with the microphone, Guess the song with a real recording, Main/Whole song on a few new songs, landscape player.
3. **App Store version page (owner, signed in):** select the latest build, upload screenshots from `ios/screenshots/app-store/`, paste text from `ios/APP_STORE_LISTING.md`, Age Rating, App Privacy ("Data Not Collected") → Publish, Content Rights, App Review contact + notes. **Submit for Review only when the owner says so.**
4. Data clean-up: 15 older songs still have a placeholder instead of chords ("insufficient agreement…" — e.g. Wildest Dreams, Happy, Africa, Bohemian Rhapsody, Misty, Stella by Starlight, November Rain, Still D.R.E.). They rely on their notes/song map; research proper chords or hide them.
5. Later (not in v1): tip jar via Apple In-App Purchase (code existed in build 30/12, removed); left-handed fretboard (Jaxx).
6. Next apps after Hayden Keys and Jaxx Guitar: fitness, jiu jitsu, then public speaking, singing, investing & markets, dance.

### How to build and upload (both apps)
```
npm run cap:sync
# bump CURRENT_PROJECT_VERSION in ios/App/App.xcodeproj/project.pbxproj
cd ios/App && xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath /tmp/app.xcarchive -allowProvisioningUpdates DEVELOPMENT_TEAM=96H39GP2A4 CODE_SIGN_STYLE=Automatic archive
xcodebuild -exportArchive -archivePath /tmp/app.xcarchive -exportOptionsPlist ExportOptionsUpload.plist -exportPath /tmp/export -allowProvisioningUpdates
```
ExportOptionsUpload.plist: method `app-store-connect`, destination `upload`, teamID 96H39GP2A4. If Xcode says "Failed to Use Accounts", sign in again in Xcode → Settings → Accounts (owner only).

### Rules we keep
- Never print song lyrics or copyrighted melodies/tabs: chords, keys and song maps only. Videos are official uploads, verified with YouTube oEmbed.
- No tip jar / payments in v1. Don't submit for review until the owner says so. The owner types all passwords.

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

## 2026-10-06 — iOS build 6
- ShazamKit now enabled for com.jaxxguitar.app (new provisioning profile).
- Uploads decode natively on iPhone (AVFoundation, any format iOS plays incl. videos), web decoder as fallback.

## 2026-10-07 — iOS build 7
- Added Comfortably Numb (Pink Floyd, 1979): verse Bm A G Em Bm, chorus in D (D A D A C G D), song structure incl. both solo sections; solos not transcribed.
- Added Creep (Radiohead, 1992): G B C Cm loop (I III IV iv), song structure, official video (Radiohead channel, oEmbed-verified).
- New lesson "Looping: rhythm and lead" (after the minor pentatonic): rhythm vs lead with an Am G F G loop, with a friend (swap roles), on your own with the looping backing track, the loop pedal (Ed Sheeran: Boss RC-20XL first, later the custom "Chewie" rig by his tech Trevor Dawkins; NPR Tiny Desk video), and a beginner gear list (Ditto / RC-1 / RC-5 with Reverb prices, cables, amp, acoustic pickup, 9V power).

## 2026-10-07 — iOS build 8 (Hayden Keys feedback, ported to guitar)
- Clean home: tagline "Learn any song on the guitar for free!", four big tiles with our own icons (Lessons / Songs / Practice / Tuner; About moved to the footer), one Start/Continue card with Jaxx, and "Upload any song and we'll find the chords for you" (opens Practice → Upload). Level chip, quests, review and roadmap no longer on the home screen; footer only on About/Songs.
- Song screen: album artwork (iTunes Search, cached; privacy updated), key, chords section by section, official video (same verified list as Hayden Keys), Play "Main part (4 chords)" / "Whole song" (structure transposed to the capo shapes).
- Our own icons replace emoji in the practice controls (Listen / Wait for me / Play in time, Loop, Beat, Microphone) and the Practice/Upload screen; "Guess the song" without the Shazam name.
- Microphone wording everywhere (hint, Info.plist, privacy): "only to hear your guitar strings, nothing else".
- Upload disclaimer: same wording as Hayden Keys.
- Lesson 1 opens with: "In about a minute you'll learn 4 chords that play 100+ songs… bear with us while we cover the basics… Grab your guitar". Removed the "G, A, C, D" note.
- Chord pages: "I know it's hard to play a chord on the app… tap the notes one at a time; the real practice is on your guitar: press all the strings and strum them together."
- New lesson "Music has flavours: genres" (after 7th chords): pop (G D Em C), rock (D C G, Sweet Home Alabama), blues (12-bar A7 D7 E7), jazz (2-5-1 Dm7 G7 Cmaj7), reggae (off-beat upstrokes, Three Little Birds A D E), classical (fingerpicking).
- New final lesson "Chord Ear Gym": happy or sad, all 24 chords with 4 choices, then chords played different ways (strummed / picked / higher up); wrong answers compare both chords; shape shown on the fretboard.
- Fun fact #2 (always second): "Who invented the guitar?" — evolved from the lute and vihuela; Antonio de Torres shaped the modern guitar in the 1850s–60s (bigger body, thinner top, fan bracing); his papier-mâché guitar; photos: Torres (public domain) and a Torres guitar at the Museu de la Música de Barcelona (CC BY-SA 3.0, credited).

## Where things stand (2026-10-07)
- **TestFlight:** **build 8 uploaded** (2026-10-07: Hayden Keys feedback adapted for guitar, on top of build 7's Comfortably Numb, Creep and looping lesson).
- **ShazamKit:** enabled for com.jaxxguitar.app (from build 6); the button says "Guess the song".
- **App Store submission:** not submitted. Screenshots, content rights, age rating, App Privacy and review contact are still to do in App Store Connect.
- **Sibling app:** Hayden Keys (piano) has the same changes (its build 24).

## Next up
- After Hayden Keys and Jaxx Guitar: a **fitness app** and a **jiu jitsu app**.
- More app ideas after those: **public speaking**, **singing**, **investing and markets**, and **dance**.

## 2026-10-07 — iOS build 9
- **Songs tab, Netflix-style:** genre rows stacked vertically, each scrolling sideways with album-cover cards (165/188 covers from iTunes Search, looked up at build time; letter tile otherwise); search and level filters kept; tapping a card opens the song and starts the play-along right away.
- **Chord fact-check** (same corrections as Hayden Keys build 27) plus Comfortably Numb: the first solo is over the chorus chords (D A D A C G C G).
- **Uploads:** 2 MB pieces to the native decoder; real error shown if it fails.
- **Sound:** audio session re-activated on return to the app and kept on the loudspeaker after microphone use.
- Upload card uses a drawn cassette icon.
- Build 10: a note played while iOS has the audio engine paused now waits for it to wake up instead of being lost.
- Build 11: "Supported by the Astryks Group (astryks.com)" at the bottom of the home page; phone note on chord pages fixed (it wrapped into columns). App Store: 12 new screenshots (iPhone 6.9", iPad 13") in ios/screenshots/app-store/; listing, App Privacy, review notes and content rights updated in ios/APP_STORE_LISTING.md.
- Build 12: **How it works & support us** (link at the bottom of the home page): technology tour (Basic Pitch on the phone, ShazamKit, Wait for me listening, Karplus–Strong guitar sound, all on device) and the **tip jar** (app only): consumables `com.jaxxguitar.app.tip.small` / `.medium` / `.large` via the native StoreKit 2 plugin (ios/App/App/TipJarPlugin.swift). Tips unlock nothing.
  - **To do in App Store Connect (Sid):** create the three Consumable IAPs with those Product IDs ($2.99 / $4.99 / $9.99 suggested), review screenshot, Paid Applications Agreement + tax + banking, attach them to the version at submission.
- Build 13: tip jar removed for the first version (no In-App Purchases, no StoreKit plugin). The home link now just says "How it works" (technology tour kept).
- Build 14:
  - **Jaxx the kitten, animated** (js/kitten.js): a flat orange tabby drawn in SVG with a teal bowtie and his own guitar; cat-only moves (slow cat blink, tail swish, ear flick, idle strum, bobbing guitar). Poses idle/wave/cheer/think/oops/play/sing/sleep; tricks for right answers (spin, rock-out headbang, sparkly leap, batting yarn, fishy snack) and wrong ones (tangled in strings, oops). Replaces the old pictures everywhere (header, home, lessons, tuner, review, fun facts, About).
  - **Simple cards** (js/cards.js) for Lesson 1, Strumming and Changing chords: one message + one action, orange "tap to keep going" bubbles, the fretboard lights up each finger in turn then "Strum it!", quizzes, auto-advance, Back, and "Use my guitar (microphone)" so a card moves on when it hears your strings. Lesson 1: welcome (bear 🐻 with us), tuning check, the fretboard explained (strings along, frets across, long necks, like tab), string numbers, pressing a fret (only as hard as needed), Em, G, C, D, a quiz, then the G D Em C loop with Wait for me.
  - **Tuning right after getting a guitar:** "Get yourself a guitar" now ends with "Going electric? Keep it simple" (acoustic vs electric, starter gear with Sweetwater prices) and "Now that you have your guitar, let's make sure it's in tune" (tuner). Tapping a string in the tuner plays its note.
  - **Easy tricks:** fast scales (slow first + metronome, alternate picking, small movements, bursts, hammer-ons/pull-offs, one finger per fret) in How to practise scales; Spanish plucking (thumb first, rest stroke, planting, one-finger rasgueado flick) in Classical guitar, followed by **Bamboléo** (Gipsy Kings, F#m; easy: capo 2, Em B7 Am C) with the official video; also added to the song library and recommended from the flamenco section.
- Build 15: cassette icon on the Practice upload buttons, matching the home card.
- Build 16: Main part / Whole song on every song with 85 new song maps ("our best guide"); official videos for 187 of 188 songs; microphone switches to play-and-record while listening (iOS refused it in "playback"), fixing Wait for me / tuner microphone errors.
- Build 17: re-sent (build 16 did not appear in TestFlight); library rows "International" (non-English songs) and "Karaoke anthems".
- Build 18:
  - **Metal genre row** (between Rock & alternative and Folk & country) with **26 songs**: Metallica's 12 most-streamed on Spotify (Kworb): Enter Sandman, Nothing Else Matters, Master of Puppets, One, For Whom the Bell Tolls, The Unforgiven, Whiskey in the Jar, Sad but True, Fade to Black, Fuel, Seek & Destroy, Wherever I May Roam; plus Paranoid, Iron Man, Crazy Train, Breaking the Law, Run to the Hills, The Trooper, Fear of the Dark, In the End, Numb, What I've Done, Bring Me to Life, Snuff, The Sound of Silence (Disturbed), Drown. Each has chords, a whole-song map and the official video. Skipped (sources disagreed): Chop Suey!, Hail to the King, Walk, Ace of Spades, Symphony of Destruction, A Tout le Monde, Down with the Sickness, Duality, Freak on a Leash.
  - **55 more songs** (same as Hayden Keys build 34: classical, pop, Radiohead, karaoke, international, Nelly/Nelly Furtado/Colbie Caillat/Corinne Bailey Rae). Chords the fretboard can't draw were simplified (Dadd9→D, Eadd9→E, Bbadd9→Bb, G7sus4→G7, Ab7sus4→Ab7, Abaug→Ab). Total 270 songs.
