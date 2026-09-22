# Wordhoard

A mobile-first vocabulary web app built with Next.js. It turns the 810
words in `data/vocab.json` (27 sets of 30) into a browsable, searchable
deck of study cards with images, meanings, synonyms, antonyms, and
"often confused with" warnings — plus a swipeable flashcard mode with
per-word progress tracking saved on the device.

## Add your images

The data references image files like `images/abound.png`. Put your image
files in `public/images/` using those exact filenames — see
`public/images/README.md`. Any word whose image is missing just falls back
to a plain letter tile, so the app works fine before you add any images too.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — resize your browser or open dev tools'
device toolbar to see the phone layout, or open it on your phone using
your computer's local IP address on the same network.

## Build for production

```bash
npm run build
npm run start
```

## Deploy

This is a standard Next.js app, so it deploys to Vercel like any other
project: push it to a Git repo and import it at vercel.com/new, or run
`vercel` from this folder with the Vercel CLI.

## How it is organized

- `data/vocab.json` — the word data (copied from the file you uploaded).
- `lib/vocab.ts` — helpers for reading/searching/grouping the word data.
- `lib/useKnownWords.ts` — tracks which words you have marked "known" in
  `localStorage`, on the device only (nothing is sent anywhere).
- `components/Flashcards.tsx` — the full-screen flip-card mode opened from
  a set, with swipe, tap-to-flip, keyboard control, and Again/Hard/Good
  ratings.
- `lib/useReview.ts` — the review schedule those ratings write: one box and
  due date per word in `localStorage`, widening gaps of 1, 3, 7, 21 and 45
  days. A word that reaches the last box is marked known.
- `app/page.tsx` — the home screen: search plus the list of 27 sets.
- `app/sets/[setId]/page.tsx` — a single set's word list, and the entry
  point into study mode (jumps to your first not-yet-known word).
- `lib/categories.ts` — the 22 categories. Each entry in `data/vocab.json`
  lists its category slugs in `categories`, main one first.
- `app/categories/page.tsx` and `app/categories/[slug]/page.tsx` — the
  category list, and one category's words.

## Notes

- No backend, database, or API keys — everything runs client-side from
  the bundled JSON, so it works offline once loaded and costs nothing to
  host.
- Add it to your phone's home screen (Share → Add to Home Screen on iOS,
  or the install prompt on Android/Chrome) for a full-screen, app-like feel.
