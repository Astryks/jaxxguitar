# Jaxx Guitar - Apple Search Ads plan and search checklist

Written 2026-10-07. App: **Jaxx Guitar** (com.jaxxguitar.app, App Store
app ID 6819445036). Free, no ads, no account, optional tip jar that
unlocks nothing.

**Start ads only after version 1.0 is approved and live.** Ads can't run
for an app that isn't on the store, and the first reviews/ratings make
every ad cheaper (better tap-through and conversion).

Apple has renamed Search Ads to **Apple Ads** (ads.apple.com); the
options below are the same. Everything about money here is a
suggestion: **the budget, bids and whether to advertise at all are the
owner's decision.**

---

## 1. Basic or Advanced?

| | Basic | Advanced |
|---|---|---|
| How it works | Set a monthly budget and a max cost per install; Apple picks the searches | You choose keywords, match types, bids, audiences and ad placements |
| Pay for | Installs | Taps (cost per tap), or impressions for Today/Search tab placements |
| Control | Almost none (no keywords, no negatives) | Full: exact match, negatives, custom product pages, per-country |
| Reporting | Installs and spend | Search terms, tap-through, conversion, cost per install by keyword |
| Best for | "Set and forget" with no time to manage | Learning which searches actually install a free guitar app |

**Recommendation:** **Advanced**, with a small daily cap. A free app
earns no money per install, so every dollar should go to searches that
prove they convert, and only Advanced shows that. If Basic is still
offered on the account and the owner prefers zero management, set a
small monthly budget and a low max cost per install and review monthly.

## 2. Suggested starting budget (owner's decision)

> **Owner to decide.** A cautious test: about **US$5-10 a day for 2-3
> weeks** across all campaigns, starting in the **US** and **Australia**
> (AU is usually cheaper per tap and is the owner's home market). Add
> the UK and Canada after the first read-out.

- Start with max cost-per-tap bids at or below Apple's suggested range
  (often around US$0.50-2.00 for music/education terms; Apple shows a
  live suggestion per keyword). "Guitar tuner" is a very high-volume,
  competitive search: bid low there at first.
- Set a **daily cap** on every campaign so nothing can overspend.
- Review after 7 days and again at 14-21 days: pause keywords with many
  taps and no installs; raise bids a little on keywords that install
  cheaply.
- A sensible target for a free app with no revenue: keep **cost per
  install (CPI)** under whatever the owner is comfortable paying to gain
  one learner (for example US$1-2). There is no revenue to pay it back.

## 3. Campaign structure (Advanced)

One campaign per keyword type, so budgets and results stay separate.
Keywords in the first three campaigns are **exact match**.

### Campaign A - Brand (exact)
```
jaxx guitar
jaxxguitar
jaxx
jax guitar
jacks guitar
```

### Campaign B - Generic, high intent (exact)

**Ad group B1: learn guitar**
```
learn guitar
learn guitar free
learn to play guitar
learn guitar app
how to play guitar
guitar learning app
```

**Ad group B2: lessons and beginners**
```
guitar lessons
free guitar lessons
guitar app for beginners
guitar for beginners
beginner guitar
acoustic guitar lessons
electric guitar lessons
```

**Ad group B3: chords and songs**
```
guitar chords
easy guitar songs
guitar songs
guitar chord app
learn guitar chords
barre chords
guitar strumming
```

**Ad group B4: tuner (separate, it behaves differently)**
```
guitar tuner
free guitar tuner
tuner for guitar
drop d tuner
dadgad tuner
```
People searching "tuner" often want only a tuner. Watch this group's
conversion: if installs are cheap, great (they discover the lessons); if
not, lower its bids first. Point it at the tuner custom product page
below.

**Ad group B5: features**
```
left handed guitar
guitar practice app
guitar tutor
guitar fretboard
capo chords
guitar tabs for beginners
```

### Campaign C - Competitor terms (exact, small cap, use with caution)
Apple allows bidding on other apps' names, but:
- people searching a brand usually want that app, so tap-through and
  installs are low and taps can be costly;
- the ad shows only Jaxx Guitar's own name, icon and metadata (never
  write another brand's name anywhere in the listing or a custom
  product page);
- some companies complain or bid back on your brand.

Keep this campaign to a small separate daily cap (for example a third
of the total), and pause it if CPI is far above Campaign B.
```
yousician
fender play
justin guitar
simply guitar
guitartuna
ultimate guitar
chordify
```
(Owner to decide whether to run this campaign at all.)

### Campaign D - Discovery (search match + broad)
- **Ad group D1:** Search Match ON, no keywords.
- **Ad group D2:** Broad match on a few seeds: `guitar`, `learn guitar`,
  `guitar lessons`, `guitar chords`, `guitar tuner`.
- Every week: open the **Search terms** report, move searches that
  installed cheaply into Campaign B as **exact** keywords, and add them
  as **negative exact** keywords in Campaign D so the two campaigns
  don't compete.

## 4. Negative keywords

Add as campaign-level negatives (broad unless noted) to Campaigns B and
D:
```
ukulele
piano
bass
violin
drum
banjo
hero
guitar hero
rock band
game
amp
pedal
effects
garageband
recording
karaoke
ringtone
wallpaper
mp3
download
repair
hire
near me
```
Notes:
- The app teaches 6-string guitar only, so ukulele, bass and banjo
  searchers won't stay.
- `guitar hero` / `rock band` / `game` are rhythm games, not lessons.
- `amp` / `pedal` / `effects` / `garageband` / `recording` are gear and
  studio apps.
- Add competitor names (exact) as negatives in B and D, so competitor
  searches only go through Campaign C. Add `jaxx guitar` (exact) as a
  negative in B, C and D, so brand searches only go through Campaign A.

## 5. Custom product page ideas

In App Store Connect → the app → Custom Product Pages. In Advanced each
ad group can point at one.

1. **"Free guitar tuner"** for ad group B4. Screenshots: the tuner on
   Standard, then Drop D / DADGAD / Open G, then "now learn your first
   chord". Promo text: "A free mic tuner for Standard, Drop D, DADGAD
   and Open G, plus lessons and 270 songs when you're ready. No ads."
2. **"Easy songs with chords and capo"** for ad group B3. Screenshots:
   the library, a song page with whole-song chords and the capo, the
   falling-notes fretboard.
3. **"Left-handed guitar"** for the left-handed keyword. Screenshots:
   the mirrored fretboard and chord boxes. Lefties are underserved, and
   this is a clear reason to pick Jaxx.

## 6. Measure

- Apple Ads reports installs by keyword. In App Store Connect →
  Analytics, compare "App Store Search" vs "App Store Browse" vs "Web
  Referrer".
- No analytics SDK is needed (and adding one would change the "Data Not
  Collected" privacy answer).

---

## 7. Google and website SEO checklist (owner steps)

The site changes are already in the repo (`index.html` title,
description, canonical, Open Graph/Twitter cards, JSON-LD app + FAQ, the
Smart App Banner with app ID 6819445036, `robots.txt`, `sitemap.xml`).
They go live with the next push to `main` (GitHub Pages deploys the repo
root).

**Google Search Console (owner must do this, needs the owner's Google
account and the domain registrar login):**
1. Go to https://search.google.com/search-console and click **Add
   property**.
2. Choose **Domain** and enter `jaxxguitar.com`.
3. Google shows a **TXT record**. Add it in the DNS settings at the
   domain registrar, save, wait a few minutes, then click **Verify**.
   (Alternative: a **URL prefix** property for `https://jaxxguitar.com/`
   verified with an HTML tag; send the tag and it can be added to
   `index.html`.)
4. **Sitemaps** → enter `sitemap.xml` → Submit.
5. **URL inspection** → `https://jaxxguitar.com/` → **Request indexing**.
6. After a few days, check **Pages** and **Enhancements** for errors.
7. Optional: **Bing Webmaster Tools** → "Import from Google Search
   Console".

**Check the tags** after deploy:
- https://search.google.com/test/rich-results with `https://jaxxguitar.com/`
- https://validator.schema.org
- Paste the URL into a message app to check the preview card.
- Safari on an iPhone: the Smart App Banner appears at the top once the
  app is live on the store.

**Small wins that need the owner's call:**
- Add an "Download on the App Store" badge link on the site once the
  app is live.
- Ask a few friendly sites (guitar teachers, school newsletters, Reddit
  r/guitarlessons or r/beginnerguitar where self-promotion is allowed)
  to link to jaxxguitar.com.
- The site is one page that fills itself with JavaScript, so Google
  mostly sees the head tags and the short intro. If organic search
  becomes a goal, a few plain static pages would rank for long-tail
  searches: e.g. "Free online guitar tuner (Drop D, DADGAD, Open G)",
  "Guitar chord chart for beginners", "The 4 chords behind 100 songs",
  "Easy guitar songs with capo" (song titles and chord names only,
  never lyrics or tabs of copyrighted songs).

## 8. YouTube Shorts / TikTok / Reels ideas (15-45 s, vertical)

Film the phone on a stand next to the guitar with real hands. Use only
the app's own sounds or the owner's own playing, and never show lyrics
or copyrighted tabs.

1. **"4 chords, 100 songs"**: G, D, Em, C strummed in a loop, then song
   titles that use it (titles only).
2. **"Tune your guitar in 30 seconds, free"**: the mic tuner string by
   string; a second clip for Drop D.
3. **"The app waits for you"**: Wait for me on the falling-notes
   fretboard.
4. **"Left-handed? Flip it"**: toggle left-handed mode.
5. **"Barre chords without the pain"**: a tip from the barre chord
   lesson.
6. **"Strumming without a pick"**: from the teacher videos lesson.
7. **"The legendary guitar built by a father and son"**: a fun-fact
   short from the legendary guitars cards.
8. **"Jaxx the beagle reacts"**: Jaxx's celebration after a streak.

Every caption ends with "Free on the App Store and at jaxxguitar.com".
Hashtags: #learnguitar #guitarlessons #guitarforbeginners #guitarchords
#easyguitar #guitartuner.
