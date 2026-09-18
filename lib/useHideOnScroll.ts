"use client";

import { useEffect, useRef, useState } from "react";

// Scroll distance that counts as a deliberate change of direction, so small
// jitters (trackpad inertia, iOS bounce) don't flicker the bar.
const DIRECTION_THRESHOLD = 8;

// Only phones trade the bar for reading room; wider screens keep it pinned.
const PHONE = "(max-width: 639px)";

/**
 * Hide-on-scroll-down, show-on-scroll-up for a sticky bar, on phones only.
 *
 * `canHide` is checked every frame (e.g. "has the bar been scrolled past its
 * resting place?"); while it returns false, or while `pinned` is true (the
 * bar is in use), the bar stays shown.
 */
export function useHideOnScroll(canHide: () => boolean, pinned: boolean) {
  const [hidden, setHidden] = useState(false);
  const canHideRef = useRef(canHide);
  const pinnedRef = useRef(pinned);
  canHideRef.current = canHide;
  pinnedRef.current = pinned;

  useEffect(() => {
    if (pinned) setHidden(false);
  }, [pinned]);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    function update() {
      frame = 0;
      // Clamp so iOS overscroll bounce doesn't read as a direction change.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = Math.min(Math.max(window.scrollY, 0), Math.max(max, 0));

      const canHide = canHideRef.current(); // always run: callers track state in it
      if (!canHide || pinnedRef.current || !window.matchMedia(PHONE).matches) {
        setHidden(false);
        lastY = y;
      } else if (Math.abs(y - lastY) > DIRECTION_THRESHOLD) {
        setHidden(y > lastY);
        lastY = y;
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return hidden;
}
