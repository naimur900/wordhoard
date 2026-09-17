"use client";

import { useCallback, useEffect, useState } from "react";

export const IMAGE_SIZES = ["s", "md", "lg"] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];

export const IMAGE_SIZE_LABELS: Record<ImageSize, string> = {
  s: "S",
  md: "MD",
  lg: "LG",
};

export const IMAGE_SIZE_HINTS: Record<ImageSize, string> = {
  s: "Compact",
  md: "Standard",
  lg: "Large",
};

const STORAGE_KEY = "wordhoard:image-size";
const CHANGE_EVENT = "wordhoard:image-size-change";
const DEFAULT_SIZE: ImageSize = "lg";

function readStorage(): ImageSize {
  if (typeof window === "undefined") return DEFAULT_SIZE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return IMAGE_SIZES.includes(raw as ImageSize) ? (raw as ImageSize) : DEFAULT_SIZE;
  } catch {
    return DEFAULT_SIZE;
  }
}

export function useImageSize() {
  const [size, setSizeState] = useState<ImageSize>(DEFAULT_SIZE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSizeState(readStorage());
    setReady(true);

    // Keep every mounted copy in step — other components this tab, other tabs.
    const sync = () => setSizeState(readStorage());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setSize = useCallback((next: ImageSize) => {
    setSizeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage may be unavailable (private mode / quota) — fail quietly
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { size, setSize, ready };
}
