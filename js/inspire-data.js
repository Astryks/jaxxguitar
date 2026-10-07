// "Get inspired": legendary live performances on official channels, picked
// as the most-watched official upload of each (checked with YouTube oEmbed,
// 2026-10-07). SONGS is matched to library songs; GENERAL is by style.
const INSPIRE_SONGS = {
 "Master of Puppets": {
  "id": "2f1Ny74_ou0",
  "title": "Metallica: Master of Puppets (Québec City, Québec - October 31, 2009) [Quebec Magnetic]",
  "author_name": "Metallica",
  "views": "48M",
  "blurb": "Watch Kirk and James race through those famous fast riffs together, then slow it down for a beautiful clean guitar middle section."
 },
 "One": {
  "id": "r3hCgDg4XAA",
  "title": "Metallica: One (Slane Castle - Meath, Ireland - June 8, 2019)",
  "author_name": "Metallica",
  "views": "12M",
  "blurb": "It starts soft and gentle, then builds into one of the most famous fast guitar solos ever, played for a giant crowd at a castle in Ireland."
 },
 "While My Guitar Gently Weeps": {
  "id": "6SFNW5F8K9Y",
  "title": "Prince, Tom Petty, Steve Winwood, & More \"While My Guitar Gently Weeps\" | Rock Hall 2004 Induction",
  "author_name": "Rock & Roll Hall of Fame",
  "views": "142M",
  "blurb": "Prince steps forward at the end and plays a solo so full of feeling that the whole room of rock legends can only smile and watch."
 },
 "Bohemian Rhapsody": {
  "id": "vbvyNnw8Qjg",
  "title": "Queen - Bohemian Rhapsody (Live Aid 1985)",
  "author_name": "Live Aid",
  "views": "311M",
  "blurb": "Brian May and Queen played this for the whole world at Live Aid, one of the most famous concerts in history."
 },
 "Enter Sandman": {
  "id": "87by1DjfxLw",
  "title": "Metallica - Enter Sandman (Live in Mexico City) [Orgullo, Pasión, y Gloria]",
  "author_name": "Metallica",
  "views": "149M",
  "blurb": "That creepy, catchy opening riff gets a whole stadium in Mexico City jumping and singing along."
 },
 "For Whom the Bell Tolls": {
  "id": "HNybmS3xNAQ",
  "title": "Metallica - For Whom the Bell Tolls (Live in Mexico City) [Orgullo, Pasión, y Gloria]",
  "author_name": "Metallica",
  "views": "62M",
  "blurb": "Listen to how the guitars and bass lock together like a giant clock ticking before the big riff crashes in."
 },
 "The Unforgiven": {
  "id": "bm117uI96lE",
  "title": "The Unforgiven (Edmonton, Alberta - August 16, 2017)",
  "author_name": "Metallica",
  "views": "27M",
  "blurb": "A great lesson in mixing gentle acoustic picking with heavy, powerful chords in the same song."
 },
 "Fade to Black": {
  "id": "FcoUvu0mGog",
  "title": "Metallica: Fade to Black (Lincoln, NE - September 6, 2018)",
  "author_name": "Metallica",
  "views": "36M",
  "blurb": "Kirk Hammett starts on a soft acoustic guitar and the song slowly grows into a huge, emotional solo."
 },
 "Fuel": {
  "id": "9ntSDjbkvoM",
  "title": "Metallica: Fuel (Gothenburg, Sweden - June 16, 2023)",
  "author_name": "Metallica",
  "views": "4.3M",
  "blurb": "Pure energy from start to finish, with fast downpicking that shows how tight and strong a rhythm player can be."
 },
 "Wherever I May Roam": {
  "id": "4U7aF6h_iwA",
  "title": "Metallica: Wherever I May Roam (Denver, CO - June 7, 2017)",
  "author_name": "Metallica",
  "views": "4.7M",
  "blurb": "The mysterious opening sounds almost like it comes from another country, then the giant riff kicks in."
 },
 "Paranoid": {
  "id": "cen1SvpTsYk",
  "title": "BLACK SABBATH - \"Paranoid\" Birmingham 2012 (Live Video)",
  "author_name": "Black Sabbath",
  "views": "107M",
  "blurb": "Tony Iommi plays one of the simplest and most famous riffs in rock history in front of his hometown crowd in Birmingham."
 },
 "Iron Man": {
  "id": "7-thChxjcVw",
  "title": "BLACK SABBATH - \"Iron Man\" from The End (Live Video)",
  "author_name": "Black Sabbath",
  "views": "14M",
  "blurb": "Tony Iommi's heavy, stomping riff from Black Sabbath's final concert ever is a true piece of guitar history."
 },
 "Run to the Hills": {
  "id": "bEjGuDcDJjU",
  "title": "Iron Maiden - Run To The Hills (Live from the Legacy Of The Beast Tour)",
  "author_name": "Iron Maiden",
  "views": "7.8M",
  "blurb": "Iron Maiden's three guitarists gallop together like horses running, with matching harmonies and big smiles."
 },
 "The Trooper": {
  "id": "ogsv6T_Pg3k",
  "title": "Iron Maiden - The Trooper (The Book Of Souls: Live Chapter)",
  "author_name": "Iron Maiden",
  "views": "1.4M",
  "blurb": "Two guitars play the same melody in harmony, which is Iron Maiden's famous trick that makes the sound feel twice as big."
 },
 "Fear of the Dark": {
  "id": "2VgOjY-TPUo",
  "title": "Iron Maiden - Fear Of The Dark (The Book Of Souls: Live Chapter)",
  "author_name": "Iron Maiden",
  "views": "73M",
  "blurb": "Watch a whole stadium sing the guitar melody back to the band, which shows how much a good tune can unite people."
 },
 "Comfortably Numb": {
  "id": "eHKG7EMxWW8",
  "title": "David Gilmour - Comfortably Numb (Live At Pompeii)",
  "author_name": "David Gilmour",
  "views": "51M",
  "blurb": "David Gilmour plays one of the most beautiful and emotional guitar solos ever, under the stars in an ancient Roman amphitheatre at Pompeii."
 },
 "Bamboléo": {
  "id": "659fYhZcmKk",
  "title": "Gipsy Kings - Bamboléo (Live US Tour '90)",
  "author_name": "gipsykingsVEVO",
  "views": "11M",
  "blurb": "Fast strumming Spanish guitars and clapping hands create a happy party sound that makes everyone want to dance."
 },
 "Stairway to Heaven": {
  "id": "Ly6ZhQVnVow",
  "title": "Led Zeppelin - Stairway To Heaven (Live at Earl's Court 1975) [Official Video]",
  "author_name": "Led Zeppelin",
  "views": "82M",
  "blurb": "Jimmy Page plays a double neck guitar, starting with a gentle melody and building to an epic solo."
 },
 "Sweet Home Alabama": {
  "id": "Zup5Pg98m5U",
  "title": "Lynyrd Skynyrd 'Sweet Home Alabama' (Live In Atlantic City)",
  "author_name": "earMUSIC",
  "views": "34M",
  "blurb": "That bright, friendly guitar riff is instantly recognisable, and the live crowd sings along to every bit."
 },
 "Hotel California": {
  "id": "09839DpTctU",
  "title": "Eagles - Hotel California (Live 1977) (Official Video) [HD]",
  "author_name": "Eagles",
  "views": "933M",
  "blurb": "Don Felder and Joe Walsh trade solos back and forth before finishing together in one of the greatest guitar duets ever."
 },
 "Wonderwall": {
  "id": "Ve1EbKsNCdw",
  "title": "Oasis - Wonderwall (Live at Knebworth, 10 August ’96)",
  "author_name": "Oasis",
  "views": "9.7M",
  "blurb": "A huge crowd at Knebworth sings every word over Noel Gallagher's simple, strummed guitar part."
 },
 "Livin' on a Prayer": {
  "id": "Ba4bLJnj6MI",
  "title": "Bon Jovi - Livin’ On A Prayer (Live 8 2005)",
  "author_name": "Live 8",
  "views": "85M",
  "blurb": "Richie Sambora uses a talk box to make his guitar sound like it is talking, and the whole park sings the chorus."
 },
 "Mr. Brightside": {
  "id": "QVlfINuDdKE",
  "title": "The Killers - Mr Brightside | Glastonbury 2019",
  "author_name": "BBC Music",
  "views": "28M",
  "blurb": "That driving guitar riff gets a massive Glastonbury crowd bouncing from the very first notes."
 },
 "Africa": {
  "id": "_yyrIXrj0Lc",
  "title": "Toto - Africa (Night Of The Proms - Belgium, 2023)",
  "author_name": "Night of the Proms",
  "views": "624K",
  "blurb": "Toto's Steve Lukather adds tasty guitar touches to one of the most loved songs ever, backed by a full orchestra."
 },
 "Let Her Go": {
  "id": "8dBkRh2Kca8",
  "title": "Passenger - Let Her Go (Live at Pinkpop)",
  "author_name": "Sony Music Netherlands",
  "views": "67M",
  "blurb": "Just one man with a guitar and a gentle voice can hold a festival crowd in the palm of his hand."
 },
 "A Horse With No Name": {
  "id": "Xxh9Da_EJB4",
  "title": "America - A Horse With No Name (America In Concert, May 24,1973)",
  "author_name": "America",
  "views": "13M",
  "blurb": "Just two chords on acoustic guitar can make a whole song, and this classic proves it."
 },
 "Banana Pancakes": {
  "id": "tH5Q9-M6t8c",
  "title": "Jack Johnson - Banana Pancakes (Kokua Festival 2010)",
  "author_name": "JackJohnsonVEVO",
  "views": "6.8M",
  "blurb": "Jack Johnson's relaxed, bouncy acoustic strumming sounds like a sunny morning in Hawaii."
 },
 "Shape of You": {
  "id": "Svtr-p4mrQ8",
  "title": "Ed Sheeran - Shape of You (The Biggest Weekend)",
  "author_name": "BBC Radio 1",
  "views": "49M",
  "blurb": "Ed Sheeran builds a whole band sound live using just his guitar and a loop pedal."
 },
 "Karma Police": {
  "id": "uEk_mtJ_ssM",
  "title": "Radiohead - Karma Police (Glastonbury 1997)",
  "author_name": "BBC Music",
  "views": "869K",
  "blurb": "A slow, beautiful song where gentle piano and guitar build into a moving, noisy ending at Glastonbury."
 },
 "La Bamba": {
  "id": "g6T85X1ClmI",
  "title": "Los Lobos - La Bamba | Live at Watsonville High School Football Field (1989)",
  "author_name": "Wolfgang's Jam & Psych ",
  "views": "14M",
  "blurb": "Los Lobos tear through this party classic with quick, joyful Mexican folk style guitar that never stops moving."
 }
};
const INSPIRE_GENERAL = [
 {
  "id": "bm03wqLY3Nc",
  "title": "Prince and The Revolution - Purple Rain (Live in Syracuse, March 30, 1985)",
  "author_name": "Prince",
  "views": "84M",
  "blurb": "Prince plays a long, crying guitar solo that shows how a guitar can sound almost like a human voice.",
  "style": "rock"
 },
 {
  "id": "8Pa9x9fZBtY",
  "title": "Dire Straits - Sultans Of Swing (Alchemy Live)",
  "author_name": "DireStraitsVEVO",
  "views": "279M",
  "blurb": "Mark Knopfler plays with just his fingers, no pick, and his flowing solo at the end is pure magic.",
  "style": "rock"
 },
 {
  "id": "D5bzrb-v9Y0",
  "title": "Queen - Hammer To Fall (Live Aid 1985)",
  "author_name": "Live Aid",
  "views": "33M",
  "blurb": "Brian May's big, crunchy riff powers Queen through one of the most famous rock shows in history.",
  "style": "rock"
 },
 {
  "id": "qFfnlYbFEiE",
  "title": "The Jimi Hendrix Experience - Voodoo Child (Slight Return) (Live In Maui, 1970)",
  "author_name": "JimiHendrixVEVO",
  "views": "67M",
  "blurb": "Jimi Hendrix, maybe the most famous guitarist ever, makes his guitar roar and sing in ways nobody had heard before.",
  "style": "rock"
 },
 {
  "id": "SgXSomPE_FY",
  "title": "B.B. King - The Thrill Is Gone [Crossroads 2010] (Official Live Video)",
  "author_name": "RHINO",
  "views": "166M",
  "blurb": "B.B. King makes every single note count, proving you don't need to play fast to play beautifully.",
  "style": "blues"
 },
 {
  "id": "KC5H9P4F5Uk",
  "title": "Stevie Ray Vaughan - Texas Flood (Live at the El Mocambo)",
  "author_name": "stevierayvaughnVEVO",
  "views": "24M",
  "blurb": "Stevie Ray Vaughan plays slow blues with so much power and feeling it feels like the guitar is on fire.",
  "style": "blues"
 },
 {
  "id": "x_ZeDn-hHGE",
  "title": "Gary Clark Jr. - Bright Lights",
  "author_name": "CrossroadsGuitar",
  "views": "29M",
  "blurb": "Gary Clark Jr. mixes old school blues with a modern rock sound, and his fuzzy guitar tone is huge.",
  "style": "blues"
 },
 {
  "id": "S33tWZqXhnk",
  "title": "Classical Gas [Mason Williams] | Tommy Emmanuel",
  "author_name": "Tommy Emmanuel, CGP",
  "views": "30M",
  "blurb": "Tommy Emmanuel plays bass, chords and melody all at once on one acoustic guitar, like a one man band.",
  "style": "acoustic"
 },
 {
  "id": "tUU1GLMdnkM",
  "title": "Eric Clapton - Tears In Heaven [Unplugged...Over 30 Years Later] (Official Live Video)",
  "author_name": "Eric Clapton",
  "views": "14M",
  "blurb": "Eric Clapton plays a gentle, heartfelt acoustic song that shows how quiet playing can be the most powerful.",
  "style": "acoustic"
 },
 {
  "id": "OXWDijCxjxs",
  "title": "Paco De Lucía - Full Concert [IMPROVED AUDIO] | Live at North Sea Jazz Festival 2006",
  "author_name": "North Sea Jazz Archive",
  "views": "889K",
  "blurb": "Paco de Lucía, the king of flamenco guitar, plays with fingers so fast they almost become a blur.",
  "style": "flamenco"
 },
 {
  "id": "PMpGjox3TBs",
  "title": "Rodrigo y Gabriela: Tiny Desk (Home) Concert",
  "author_name": "NPR Music",
  "views": "1.4M",
  "blurb": "Rodrigo y Gabriela play two acoustic guitars like a whole rock band, with Gabriela tapping drum beats right on her guitar body.",
  "style": "world"
 },
 {
  "id": "inBKFMB-yPg",
  "title": "Ana Vidovic plays Asturias by Isaac Albéniz on a Jim Redgate classical guitar",
  "author_name": "SiccasGuitars",
  "views": "52M",
  "blurb": "Ana Vidović plays the dramatic Spanish piece Asturias on classical guitar with amazing speed and grace.",
  "style": "classical"
 },
 {
  "id": "0Id5_85mTv0",
  "title": "Pat Metheny - Kin - Live At The Five Angels Theater, New York / 2014",
  "author_name": "PatMethenyVEVO",
  "views": "934K",
  "blurb": "Pat Metheny, one of jazz's greatest guitarists, leads his band through a soaring, joyful piece full of surprises.",
  "style": "jazz"
 },
 {
  "id": "vWLJeqLPfSU",
  "title": "Khruangbin: NPR Music Tiny Desk Concert",
  "author_name": "NPR Music",
  "views": "22M",
  "blurb": "Khruangbin's guitarist plays smooth, catchy melodies inspired by music from all over the world in a tiny office.",
  "style": "world"
 }
];

export { INSPIRE_SONGS, INSPIRE_GENERAL };
