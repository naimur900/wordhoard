/*
 * Wordhoard offline support.
 *
 * On install, every page (home, test, each set) is saved along with the
 * scripts, styles and fonts those pages reference, so the whole app opens
 * without a connection from then on. Pictures are saved as they are viewed,
 * or all at once from Settings → "Download for offline" (see lib/offline.ts,
 * which writes into the same IMAGES cache).
 *
 * Bump VERSION to force every installed copy to re-save its pages.
 */
const VERSION = "v1";
const PAGES = `wordhoard-pages-${VERSION}`;
const ASSETS = `wordhoard-assets-${VERSION}`;
const FONTS = "wordhoard-fonts";
const IMAGES = "wordhoard-images";
const CURRENT = [PAGES, ASSETS, FONTS, IMAGES];

const STATIC_FILES = [
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // A failed precache must not block the worker: pages still get saved as
  // they are visited, and the next install tries again.
  event.waitUntil(precache().catch(() => {}));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("wordhoard-") && !CURRENT.includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// Sent by the page on each load. Re-saving every page is a few hundred KB,
// so it runs at most twice a day: often enough that a deploy reaches the
// offline copies of pages nobody has revisited.
const REFRESH_EVERY = 12 * 60 * 60 * 1000;
const STAMP = "/__precached-at";

self.addEventListener("message", (event) => {
  if (event.data !== "precache") return;
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGES);
      const stamp = await pages.match(STAMP);
      if (stamp && Date.now() - Number(await stamp.text()) < REFRESH_EVERY) return;
      await precache();
    })().catch(() => {})
  );
});

/** Saves every page, then everything those pages load. */
async function precache() {
  const pages = await caches.open(PAGES);
  const home = await fetch("/", { cache: "reload" });
  if (!home.ok) throw new Error("home page unavailable");
  const homeHtml = await home.clone().text();
  await pages.put("/", home);

  // The home page links every set, so the list never needs maintaining here.
  const paths = new Set(["/test"]);
  for (const [, path] of homeHtml.matchAll(/href="(\/sets\/\d+)"/g)) paths.add(path);

  const htmls = [homeHtml];
  let complete = true;
  await Promise.all(
    [...paths].map(async (path) => {
      try {
        const res = await fetch(path, { cache: "reload" });
        if (!res.ok) throw new Error(path);
        htmls.push(await res.clone().text());
        await pages.put(path, res);
      } catch {
        complete = false;
      }
    })
  );

  // Next's scripts and styles, as referenced by the pages — both the tags and
  // the chunk lists in the inline RSC payload, whose escaped quotes the
  // backslash in the character class stops the match short of.
  const assets = new Set(STATIC_FILES);
  for (const html of htmls) {
    for (const [url] of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) assets.add(url);
  }
  const assetCache = await caches.open(ASSETS);
  await Promise.all(
    [...assets].map(async (url) => {
      try {
        const res = (await assetCache.match(url)) ?? (await fetch(url));
        if (!res.ok) return;
        // Stylesheets pull in their own files (self-hosted fonts and the like).
        if (url.endsWith(".css")) {
          const css = await res.clone().text();
          for (const [, ref] of css.matchAll(/url\((\/_next\/static\/[^)"']+)\)/g)) {
            assets.add(ref);
            await cacheFirst(new Request(ref), ASSETS).catch(() => {});
          }
        }
        await assetCache.put(url, res);
      } catch {}
    })
  );

  // With every page just re-saved, build files none of them reference are
  // left over from an earlier deploy. Skipped after a partial run, since a
  // page that failed to refresh may still be pointing at them.
  if (complete) {
    for (const request of await assetCache.keys()) {
      if (!assets.has(new URL(request.url).pathname)) await assetCache.delete(request);
    }
  }
  await pages.put(STAMP, new Response(String(Date.now())));

  // Google Fonts: the stylesheet the layout links, then the font files in it.
  const fontCss = homeHtml.match(/href="(https:\/\/fonts\.googleapis\.com\/[^"]+)"/);
  if (fontCss) {
    const url = fontCss[1].replace(/&amp;/g, "&");
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      const css = await res.clone().text();
      const fonts = await caches.open(FONTS);
      await fonts.put(url, res);
      await Promise.all(
        [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(([, font]) =>
          cacheFirst(new Request(font, { mode: "cors" }), FONTS).catch(() => {})
        )
      );
    }
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    // In-app navigations fetch an RSC payload rather than HTML. Left to the
    // network: offline, the fetch fails and Next falls back to a full page
    // load, which the navigate branch below then serves from the cache.
    if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

    if (request.mode === "navigate") {
      event.respondWith(networkFirstPage(request, url));
    } else if (url.pathname.startsWith("/_next/static/")) {
      event.respondWith(cacheFirst(request, ASSETS));
    } else if (url.pathname.startsWith("/images/")) {
      event.respondWith(cacheFirst(request, IMAGES));
    } else if (STATIC_FILES.includes(url.pathname)) {
      event.respondWith(staleWhileRevalidate(request, ASSETS));
    }
  } else if (url.hostname === "fonts.googleapis.com") {
    event.respondWith(staleWhileRevalidate(request, FONTS));
  } else if (url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request, FONTS));
  }
});

/**
 * Pages: fresh from the network when online (so a deploy shows up straight
 * away), the saved copy when not. Saved by path, so `/sets/3?open=12` still
 * finds `/sets/3`.
 */
async function networkFirstPage(request, url) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(url.pathname, res.clone());
    return res;
  } catch {
    return (
      (await cache.match(url.pathname)) ??
      (await cache.match("/")) ??
      new Response("You are offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
}

/** Hashed build files and pictures never change under the same URL. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  // Cross-origin fonts arrive as CORS responses (ok); opaque ones are skipped.
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const update = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit ?? Response.error());
  return hit ?? update;
}
