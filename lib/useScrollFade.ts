"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Whether a scrollable list still has content below its visible edge, so it
 * can fade that edge out (the `fade-bottom` class). Tracks scrolling, resizes
 * and the list's items changing. `active` is whether the list is mounted.
 *
 * `useScrollFades` reports the top edge too; see `fadeClass`.
 */
export function useScrollFade(ref: RefObject<HTMLElement | null>, active: boolean) {
  return useScrollFades(ref, active).bottom;
}

/** Which edges of a scrollable list have more content beyond them. */
export function useScrollFades(ref: RefObject<HTMLElement | null>, active: boolean) {
  const [fade, setFade] = useState({ top: false, bottom: false });

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) {
      setFade({ top: false, bottom: false });
      return;
    }

    const update = () => {
      const top = el.scrollTop > 1;
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      // Same values keep the same object, so scrolling mid-list re-renders nothing.
      setFade((f) => (f.top === top && f.bottom === bottom ? f : { top, bottom }));
    };

    update();
    const resize = new ResizeObserver(update);
    resize.observe(el);
    const mutation = new MutationObserver(update);
    mutation.observe(el, { childList: true, subtree: true });
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      resize.disconnect();
      mutation.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [ref, active]);

  return fade;
}

/** The mask class for the edges `useScrollFades` reports. */
export function fadeClass({ top, bottom }: { top: boolean; bottom: boolean }) {
  if (top && bottom) return "fade-y";
  if (top) return "fade-top";
  if (bottom) return "fade-bottom";
  return "";
}
