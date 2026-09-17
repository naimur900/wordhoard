"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "wordhoard:known";

function readStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function useKnownWords() {
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setKnown(readStorage());
    setReady(true);
  }, []);

  const persist = useCallback((next: Set<string>) => {
    setKnown(next);
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(next))
      );
    } catch {
      // localStorage may be unavailable (private mode / quota) — fail quietly
    }
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setKnown((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(Array.from(next))
          );
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => {
    persist(new Set());
  }, [persist]);

  const isKnown = useCallback((id: string) => known.has(id), [known]);

  const countForSet = useCallback(
    (setId: number) => {
      let count = 0;
      const prefix = `${setId}-`;
      known.forEach((id) => {
        if (id.startsWith(prefix)) count += 1;
      });
      return count;
    },
    [known]
  );

  return { known, ready, toggle, reset, isKnown, countForSet };
}
