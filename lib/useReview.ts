"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "wordhoard:review";

/**
 * Days until a card comes back, one entry per box. A card climbs a box each
 * time you get it right, so the gaps widen as the word sticks; the last box is
 * where a word counts as learned.
 */
export const BOX_DAYS = [1, 3, 7, 21, 45] as const;
export const LAST_BOX = BOX_DAYS.length - 1;

export type Rating = "again" | "hard" | "good";

export interface ReviewState {
  /** Position in BOX_DAYS. */
  box: number;
  /** Local date (YYYY-MM-DD) the card is next due on. */
  due: string;
}

type Store = Record<string, ReviewState>;

/** Local calendar date, so "due today" follows the device's own day. */
export function today(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function plusDays(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** How long a rating puts a card away for, in days. */
export function daysFor(state: ReviewState | undefined, rating: Rating): number {
  const box = state?.box ?? 0;
  if (rating === "again") return 0;
  if (rating === "hard") return Math.max(1, Math.round(BOX_DAYS[box] / 2));
  return BOX_DAYS[Math.min(box + 1, LAST_BOX)];
}

/** Where a rating moves a card to. "Again" drops it back to the first box. */
export function nextState(
  state: ReviewState | undefined,
  rating: Rating
): ReviewState {
  const box = state?.box ?? 0;
  const nextBox =
    rating === "again" ? 0 : rating === "hard" ? box : Math.min(box + 1, LAST_BOX);
  return { box: nextBox, due: plusDays(daysFor(state, rating)) };
}

function readStorage(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

/**
 * One copy of the schedule for the whole app, so a card rated inside
 * flashcards is immediately reflected by the page underneath it (both hold
 * their own `useReview`). `storage` events keep other tabs in step.
 */
const EMPTY: Store = {};
let cache: Store | null = null;
const listeners = new Set<() => void>();

function snapshot(): Store {
  if (!cache) cache = readStorage();
  return cache;
}

function publish(next: Store) {
  cache = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  function onStorage(e: StorageEvent) {
    if (e.key === STORAGE_KEY) publish(readStorage());
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The review schedule, kept on the device beside the known marks. A word with
 * no entry has never been seen, which counts as due.
 */
export function useReview() {
  const store = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  // The schedule is only knowable on the client; until this flips, callers
  // render the same blank state the server did.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const persist = useCallback((next: Store) => {
    publish(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable (private mode / quota) — fail quietly
    }
  }, []);

  /** Files the card by its rating and reports where it landed. */
  const rate = useCallback(
    (id: string, rating: Rating): ReviewState => {
      const next = nextState(store[id], rating);
      persist({ ...store, [id]: next });
      return next;
    },
    [store, persist]
  );

  const stateFor = useCallback((id: string) => store[id], [store]);

  const isDue = useCallback(
    (id: string) => {
      const state = store[id];
      return !state || state.due <= today();
    },
    [store]
  );

  const dueCount = useCallback(
    (ids: string[]) => ids.reduce((n, id) => n + (isDue(id) ? 1 : 0), 0),
    [isDue]
  );

  const reset = useCallback(() => persist({}), [persist]);

  return {
    ready,
    rate,
    stateFor,
    isDue,
    dueCount,
    reset,
    /** How many words have been rated at least once. */
    scheduled: Object.keys(store).length,
  };
}
