"use client";

import { ALL_WORDS, imageSrc } from "@/lib/vocab";

/** Must match IMAGES in public/sw.js, which serves pictures from this cache. */
const IMAGES_CACHE = "wordhoard-images";
const CONCURRENCY = 6;

export function offlineSupported() {
  return typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;
}

/** Every picture in the deck, once each. */
export function imageUrls(): string[] {
  return Array.from(
    new Set(ALL_WORDS.map(imageSrc).filter((src): src is string => Boolean(src)))
  );
}

/** How many of `urls` are already saved on this device. */
export async function countSavedImages(urls: string[]): Promise<number> {
  const cache = await caches.open(IMAGES_CACHE);
  const saved = new Set(
    (await cache.keys()).map((request) => new URL(request.url).pathname)
  );
  return urls.filter((url) => saved.has(url)).length;
}

/**
 * Forgets every saved picture, freeing the space back up. Pictures are saved
 * again as they are viewed, or all at once from Settings.
 */
export async function clearImages(): Promise<void> {
  await caches.delete(IMAGES_CACHE);
}

/**
 * Saves every picture not already saved, a few at a time. Resolves with how
 * many failed, so the caller can offer a retry for those.
 */
export async function downloadImages(
  urls: string[],
  onProgress: (saved: number) => void
): Promise<number> {
  // Ask the browser not to evict this under storage pressure. Granted
  // silently for installed apps on Chrome; a no-op where unsupported.
  await navigator.storage?.persist?.().catch(() => false);

  const cache = await caches.open(IMAGES_CACHE);
  const have = new Set(
    (await cache.keys()).map((request) => new URL(request.url).pathname)
  );
  let saved = urls.filter((url) => have.has(url)).length;
  let failed = 0;
  const queue = urls.filter((url) => !have.has(url));
  onProgress(saved);

  async function worker() {
    for (let url = queue.shift(); url; url = queue.shift()) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(url);
        await cache.put(url, res);
        saved += 1;
        onProgress(saved);
      } catch {
        failed += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return failed;
}
