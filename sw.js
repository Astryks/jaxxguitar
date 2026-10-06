// Minimal app-shell service worker — not a full offline-first
// architecture, but real enough that "Add to Home Screen" gives a
// genuine standalone launch and a second visit (even offline) can
// serve the shell from cache. Network-first for the app's own static
// files, with the cache as the offline fallback (song/lesson data is
// bundled in these same JS files, so no separate data-fetching to
// worry about). Bump CACHE_NAME on every
// deploy that changes shell files so old caches are dropped on activate.
const CACHE_NAME = "jaxx-guitar-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./privacy.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/about.js",
  "./js/app.js",
  "./js/chord-utils.js",
  "./js/daily-review.js",
  "./js/drums.js",
  "./js/fret-highway.js",
  "./js/fretboard.js",
  "./js/fun-facts.js",
  "./js/guitar-audio.js",
  "./js/guitar-player.js",
  "./js/guitar-theory.js",
  "./js/input-hub.js",
  "./js/lessons-data.js",
  "./js/lessons-ui.js",
  "./js/pitch.js",
  "./js/practice-ui.js",
  "./js/practice-widget.js",
  "./js/song-plan.js",
  "./js/songs-data.js",
  "./js/songs-ui.js",
  "./js/storage.js",
  "./js/transcribe.js",
  "./js/tuner.js",
  "./js/world-songs.js",
  "./assets/mascot/big-pen.webp",
  "./assets/mascot/cello.webp",
  "./assets/mascot/chef.webp",
  "./assets/mascot/happy-guitar.webp",
  "./assets/mascot/juggling-picks.webp",
  "./assets/mascot/keyhole.webp",
  "./assets/mascot/map-glasses.webp",
  "./assets/mascot/music-scrolls.webp",
  "./assets/mascot/painter.webp",
  "./assets/mascot/playing-guitar.webp",
  "./assets/mascot/quill-scroll.webp",
  "./assets/mascot/running-guitar.webp",
  "./assets/mascot/sheet-music-jump.webp",
  "./assets/mascot/singing-mic.webp",
  "./assets/mascot/singing-stage.webp",
  "./assets/mascot/sleep-in-hat.webp",
  "./assets/mascot/sleeping-guitar.webp",
  "./assets/mascot/strumming.webp",
  "./assets/mascot/tangled-strings.webp",
  "./assets/mascot/teacup-books.webp",
  "./assets/mascot/top-hat-shelf.webp",
  "./assets/mascot/trumpet.webp",
  "./assets/mascot/wrenches.webp",
  "./assets/people/ali-farka-toure.webp",
  "./assets/people/bb-king.webp",
  "./assets/people/brian-may.webp",
  "./assets/people/cf-martin.webp",
  "./assets/people/django.webp",
  "./assets/people/don-felder.webp",
  "./assets/people/eddie-van-halen.webp",
  "./assets/people/jimi-hendrix.webp",
  "./assets/people/jimmy-page.webp",
  "./assets/people/joao-gilberto.webp",
  "./assets/people/joe-walsh.webp",
  "./assets/people/les-paul.webp",
  "./assets/people/merle-travis.webp",
  "./assets/people/paco-de-lucia.webp",
  "./assets/people/robert-plant.webp",
  "./assets/people/segovia.webp",
  "./assets/people/slash.webp",
  "./assets/people/tarrega.webp",
  "./js/media.js",
  "./js/media-data.js",
  "./assets/icons/icon-16.png",
  "./assets/icons/icon-32.png",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Never intercept cross-origin requests — those always go to the network.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;

  // Network-first (falling back to cache when offline). This used to be
  // cache-first, which meant every deploy showed returning visitors the
  // previous version until a second reload.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
