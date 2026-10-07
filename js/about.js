import { puppySvg } from "./puppy.js";
import { leftyToggleHtml, wireLeftyToggle } from "./settings.js";
// About tab: what Jaxx Guitar is, a couple of settings, and credits.

function renderAbout(panel) {
  panel.innerHTML = `
    <div class="jg-card">
      <div class="jg-hero-mascot">${puppySvg("wave")}</div>
      <h2 style="margin:4px 0">About Jaxx Guitar</h2>
      <p>Hi, I'm <strong>Jaxx</strong>, a beagle puppy who loves guitars. I'll be with you in every lesson!</p>
      <p>Jaxx Guitar is a free guitar course. No account, no ads, no tracking: your progress is saved on this device only.</p>
      <h3>Settings</h3>
      <p>${leftyToggleHtml()}</p>
      <p class="jg-note">For a left-handed guitar: every fretboard and chord box flips to match yours.</p>
      <h3>What's inside</h3>
      <ul>
        <li><strong>Lessons:</strong> from holding the guitar to chords, strumming, barre chords, scales and solos.</li>
        <li><strong>Falling notes</strong> land on the fretboard exactly where and when to play.</li>
        <li><strong>Wait for me</strong> listens to your guitar and waits for you. It hears single notes well; for chords it moves on when it hears a note from the chord.</li>
        <li><strong>Songs:</strong> each song's chords, the easiest capo and a play-along. Chords only, never lyrics.</li>
        <li><strong>Upload a song:</strong> we guess its chords right on your device. Nothing is sent anywhere.</li>
        <li><strong>Tuner:</strong> standard tuning plus Drop D, DADGAD and Open G.</li>
        <li><strong>Daily fun:</strong> XP, levels, a streak and a 2-minute review.</li>
      </ul>
      <h3>Credits</h3>
      <p>Note finding: Spotify's Basic Pitch (Apache-2.0), running on your device. Guitar sounds are made by the app itself (Karplus-Strong), no recordings. See the <a href="https://github.com/Astryks/jaxxguitar/blob/main/THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener">third-party notices</a>.</p>
      <p>Jaxx Guitar is the sibling of <a href="https://haydenkeys.com" target="_blank" rel="noopener">Hayden Keys</a>, which teaches piano the same way.</p>
      <p><a href="privacy.html">Privacy policy</a></p>
    </div>`;
  wireLeftyToggle(panel);
}

export { renderAbout };
