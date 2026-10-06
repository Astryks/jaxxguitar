import { kittenSvg } from "./kitten.js";
// About tab: what Jaxx Guitar is, how it works, and its honest limits.

function renderAbout(panel) {
  panel.innerHTML = `
    <div class="jg-card">
      <div class="jg-hero-mascot">${kittenSvg("wave")}</div>
      <h2 style="margin:4px 0">About Jaxx Guitar</h2>
      <p>Hi, I'm <strong>Jaxx</strong> — a kitten in a top hat who loves guitars. I'll be with you through every lesson!</p>
      <p>A free, gamified guitar course that runs entirely on your device — no account, no ads, no tracking. Your progress is saved in this browser/app only.</p>
      <h3>How it works</h3>
      <ul>
        <li><strong>Lessons</strong> go from holding the guitar and pressing a fret cleanly, through the four chords behind hundreds of songs, to barre chords, scales, solos, CAGED and modes.</li>
        <li><strong>Falling notes</strong> drop onto the fretboard in the exact string and fret to play — colored by string — and land when it's time to play them.</li>
        <li><strong>Wait for me</strong> listens through your microphone and waits for you. The mic hears single notes reliably; for chords it moves on when it hears a note from the chord you're strumming (no phone mic can reliably pick out six strings at once).</li>
        <li><strong>Songs</strong> show each song's main chord loop and the easiest capo position. Chord names and progressions only — no lyrics or note-for-note transcriptions.</li>
        <li><strong>Upload a song</strong> works out the chords from a recording you own, on your device, with the open-source <em>basic-pitch</em> model (bundled with the app — nothing is sent anywhere). It's a best guess, labelled as one.</li>
        <li><strong>The tuner</strong> listens to each string and goes green within ±8 cents.</li>
      </ul>
      <h3>Daily habits</h3>
      <p>Three daily quests, XP and levels, stars for each practice piece, a streak (with freezes you earn every 7 days), and a 2-minute daily review that brings back what you're likely to forget.</p>
      <h3>Credits</h3>
      <p>Note detection: Spotify's basic-pitch (Apache-2.0), bundled locally. Guitar sounds are synthesized (Karplus-Strong), no samples. See <a href="https://github.com/Astryks/jaxxguitar/blob/main/THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener">third-party notices</a>.</p>
      <p>Jaxx Guitar is the sibling of <a href="https://haydenkeys.com" target="_blank" rel="noopener">Hayden Keys</a>, which teaches piano the same way.</p>
      <p><a href="privacy.html">Privacy policy</a></p>
    </div>`;
}

export { renderAbout };
