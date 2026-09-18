"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Whether a scrollable list still has content below its visible edge, so it
 * can fade that edge out (the `fade-bottom` class). Tracks scrolling, resizes
 * and the list's items changing. `active` is whether the list is mounted.
 */
export function useScrollFade(ref: RefObject<HTMLElement | null>, active: boolean) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) {
      setFade(false);
      return;
    }

    const update = () =>
      setFade(el.scrollTop + el.clientHeight < el.scrollHeight - 1);

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
