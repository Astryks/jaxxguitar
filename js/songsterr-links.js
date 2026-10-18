// "Full solo, note for note" links (owner, 2026-10-18). We don't bundle
// note-for-note transcriptions of copyrighted solos (no licence); Songsterr
// is a licensed tab site that pays publishers, so each song with a solo
// links to its Songsterr page. Direct tab URLs were looked up with
// Songsterr's song search and each page's title checked on 2026-10-18;
// songs without a matching tab use a Songsterr search link instead.
// Opens outside the app (a new tab on the web, the system browser on iOS),
// like the YouTube links.

const SONGSTERR = {
  "Africa": "https://www.songsterr.com/a/wsa/toto-africa-tab-s51025",
  "All of Me (jazz standard)": "https://www.songsterr.com/a/wsa/gerald-marks-seymour-simmons-all-of-me-tab-s1194583",
  "All the Things You Are": "https://www.songsterr.com/?pattern=Jerome%20Kern%20%28jazz%20standard%29%20All%20the%20Things%20You%20Are",
  "Almost Blue": "https://www.songsterr.com/?pattern=Elvis%20Costello%20%28famously%20covered%20by%20Chet%20Baker%29%20Almost%20Blue",
  "Autumn Leaves": "https://www.songsterr.com/?pattern=Joseph%20Kosma%20%28jazz%20standard%29%20Autumn%20Leaves",
  "Autumn Leaves (Chet Baker, simplified)": "https://www.songsterr.com/?pattern=Joseph%20Kosma%20-%20as%20recorded%20by%20Chet%20Baker%20Autumn%20Leaves",
  "Aïcha": "https://www.songsterr.com/a/wsa/cheb-khaled-aicha-tab-s173532",
  "Bamboléo": "https://www.songsterr.com/a/wsa/gipsy-kings-bamboleo-tab-s417147",
  "Beat It": "https://www.songsterr.com/a/wsa/michael-jackson-beat-it-tab-s10259",
  "Blue Bossa": "https://www.songsterr.com/?pattern=Kenny%20Dorham%20%28jazz%20standard%29%20Blue%20Bossa",
  "Blue Monk": "https://www.songsterr.com/a/wsa/thelonious-monk-blue-monk-tab-s12513",
  "Bohemian Rhapsody": "https://www.songsterr.com/a/wsa/queen-bohemian-rhapsody-tab-s270",
  "Cantaloupe Island": "https://www.songsterr.com/?pattern=Herbie%20Hancock%20%281964%29%20Cantaloupe%20Island",
  "Comfortably Numb": "https://www.songsterr.com/a/wsa/pink-floyd-comfortably-numb-tab-s271",
  "Crazy Train": "https://www.songsterr.com/a/wsa/ozzy-osbourne-crazy-train-tab-s61178",
  "Die With a Smile": "https://www.songsterr.com/a/wsa/lady-gaga-bruno-mars-die-with-a-smile-tab-s702803",
  "Don't Stop Believin'": "https://www.songsterr.com/a/wsa/journey-dont-stop-believin-tab-s10681",
  "Enter Sandman": "https://www.songsterr.com/a/wsa/metallica-enter-sandman-tab-s19",
  "Evidências": "https://www.songsterr.com/a/wsa/chitaozinho-xororo-evidencias-tab-s393305",
  "Fade to Black": "https://www.songsterr.com/a/wsa/metallica-fade-to-black-tab-s20",
  "Fear of the Dark": "https://www.songsterr.com/a/wsa/iron-maiden-fear-of-the-dark-tab-s492398",
  "Fly Me to the Moon": "https://www.songsterr.com/?pattern=Bart%20Howard%20%281954%29%20Fly%20Me%20to%20the%20Moon",
  "Fuel": "https://www.songsterr.com/a/wsa/metallica-fuel-tab-s12104",
  "Hotel California": "https://www.songsterr.com/a/wsa/eagles-hotel-california-tab-s447",
  "Iron Man": "https://www.songsterr.com/a/wsa/black-sabbath-iron-man-tab-s8",
  "La Bamba": "https://www.songsterr.com/a/wsa/ritchie-valens-la-bamba-tab-s1571276",
  "Let It Be": "https://www.songsterr.com/a/wsa/beatles-let-it-be-tab-s79",
  "Livin' on a Prayer": "https://www.songsterr.com/a/wsa/bon-jovi-livin-on-a-prayer-tab-s3131",
  "Love Yourself": "https://www.songsterr.com/a/wsa/justin-bieber-love-yourself-tab-s572727",
  "Man! I Feel Like a Woman!": "https://www.songsterr.com/a/wsa/shania-twain-man-i-feel-like-a-woman-tab-s32810",
  "Master of Puppets": "https://www.songsterr.com/a/wsa/metallica-master-of-puppets-tab-s455118",
  "Mr. Brightside": "https://www.songsterr.com/a/wsa/killers-mr-brightside-tab-s601",
  "No Woman No Cry": "https://www.songsterr.com/a/wsa/bob-marley-no-woman-no-cry-tab-s115",
  "Nothing Else Matters": "https://www.songsterr.com/a/wsa/metallica-nothing-else-matters-tab-s439171",
  "November Rain": "https://www.songsterr.com/a/wsa/guns-n-roses-november-rain-tab-s8452",
  "One": "https://www.songsterr.com/a/wsa/metallica-one-tab-s444",
  "Paranoid": "https://www.songsterr.com/a/wsa/black-sabbath-paranoid-tab-s296",
  "Parisienne Walkways": "https://www.songsterr.com/a/wsa/gary-moore-parisienne-walkways-tab-s5624146",
  "Plastic Love": "https://www.songsterr.com/a/wsa/mariya-takeuchi-plastic-love-tab-s454323",
  "Run to the Hills": "https://www.songsterr.com/a/wsa/iron-maiden-run-to-the-hills-tab-s453",
  "Sad but True": "https://www.songsterr.com/a/wsa/metallica-sad-but-true-tab-s317",
  "Satin Doll": "https://www.songsterr.com/a/wsa/duke-ellington-satin-doll-tab-s30536",
  "Seek & Destroy": "https://www.songsterr.com/a/wsa/metallica-seek-destroy-tab-s247",
  "Snuff": "https://www.songsterr.com/a/wsa/slipknot-snuff-tab-s35673",
  "So What": "https://www.songsterr.com/?pattern=Miles%20Davis%20%28Kind%20of%20Blue%29%20So%20What",
  "Someday": "https://www.songsterr.com/a/wsa/michael-learns-to-rock-someday-tab-s219793",
  "Stairway to Heaven": "https://www.songsterr.com/a/wsa/led-zeppelin-stairway-to-heaven-tab-s27",
  "Stella by Starlight": "https://www.songsterr.com/?pattern=Victor%20Young%20%28jazz%20standard%29%20Stella%20by%20Starlight",
  "Summer of '69": "https://www.songsterr.com/a/wsa/bryan-adams-summer-of-69-tab-s24235",
  "Summertime": "https://www.songsterr.com/?pattern=George%20Gershwin%20%28Porgy%20and%20Bess%2C%201935%29%20Summertime",
  "Sunny Day (Qíng Tiān)": "https://www.songsterr.com/?pattern=Jay%20Chou%20Sunny%20Day",
  "Sweet Child O' Mine": "https://www.songsterr.com/a/wsa/guns-n-roses-sweet-child-o-mine-tab-s23",
  "Sweet Home Alabama": "https://www.songsterr.com/a/wsa/lynyrd-skynyrd-sweet-home-alabama-tab-s58984",
  "Take Five": "https://www.songsterr.com/?pattern=Paul%20Desmond%20-%20Dave%20Brubeck%20Quartet%20%281959%29%20Take%20Five",
  "Take the A Train": "https://www.songsterr.com/?pattern=Billy%20Strayhorn%20%28jazz%20standard%29%20Take%20the%20A%20Train",
  "Tamally Maak": "https://www.songsterr.com/a/wsa/amr-diab-tamally-maak-tab-s2478455",
  "Tennessee Whiskey": "https://www.songsterr.com/a/wsa/chris-stapleton-tennessee-whiskey-tab-s482060",
  "The Trooper": "https://www.songsterr.com/a/wsa/iron-maiden-the-trooper-tab-s338",
  "The Unforgiven": "https://www.songsterr.com/a/wsa/metallica-the-unforgiven-tab-s19616",
  "There Will Never Be Another You": "https://www.songsterr.com/?pattern=Harry%20Warren%20%28jazz%20standard%29%20There%20Will%20Never%20Be%20Another%20You",
  "Thinking Out Loud": "https://www.songsterr.com/a/wsa/ed-sheeran-thinking-out-loud-tab-s393812",
  "What I've Done": "https://www.songsterr.com/a/wsa/linkin-park-what-ive-done-tab-s20544",
  "Wherever I May Roam": "https://www.songsterr.com/a/wsa/metallica-wherever-i-may-roam-tab-s3707",
  "While My Guitar Gently Weeps": "https://www.songsterr.com/a/wsa/beatles-while-my-guitar-gently-weeps-tab-s373",
  "Whiskey in the Jar": "https://www.songsterr.com/a/wsa/metallica-whiskey-in-the-jar-tab-s326",
  "Wonderful Tonight": "https://www.songsterr.com/a/wsa/eric-clapton-wonderful-tonight-tab-s1380",
  "Zombie": "https://www.songsterr.com/a/wsa/cranberries-zombie-tab-s431",
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function songsterrUrl(title, artist = "") {
  return SONGSTERR[title] || `https://www.songsterr.com/?pattern=${encodeURIComponent(`${artist.split(/ & | feat/)[0]} ${title.replace(/\s*\(.*?\)\s*/g, " ")}`.trim())}`;
}

function fullSoloLinkHtml(title, artist = "") {
  return `<a class="jg-fullsolo" href="${esc(songsterrUrl(title, artist))}" target="_blank" rel="noopener">Full solo, note for note › <small>on Songsterr (licensed tabs)</small></a>`;
}

export { SONGSTERR, songsterrUrl, fullSoloLinkHtml };
