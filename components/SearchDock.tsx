"use client";

import { useRef, useState } from "react";
import { useHideOnScroll } from "@/lib/useHideOnScroll";
import { SHELL_WIDTH } from "@/components/PageShell";
import SearchBar from "@/components/SearchBar";

/**
 * The landing page's search bar: sits in the page flow, and once scrolled past
 * it sticks to the top of the viewport as a full-bleed glass bar, sliding away
 * while you scroll down and returning as soon as you scroll up.
 *
 * Render it as a direct child of <body>'s content (not inside PageShell), so
 * it stays stuck for the whole page and its veil spans the viewport.
 */
export default function SearchDock() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);
  const [focused, setFocused] = useState(false);

  const hidden = useHideOnScroll(() => {
    // Stuck once its resting place has scrolled above the viewport top.
    const isStuck = (sentinelRef.current?.getBoundingClientRect().top ?? 0) < 0;
    setStuck(isStuck);
    return isStuck;
  }, focused);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => setFocused(false)}
        // The bottom `pb-12` is the veil's fade, pulled back out of the flow so
        // it only covers content while the bar is stuck.
        className={`veil pointer-events-none sticky top-0 z-30 -mb-12 w-full [--veil-fade:3rem] transition-transform duration-300 ease-out ${
          hidden ? "-translate-y-full" : ""
        }`}
      >
        <span
          className={`veil-layers transition-opacity duration-200 ${
            stuck ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
          <i />
        </span>
        <div
          className={`relative ${SHELL_WIDTH} pb-12 pt-[max(1rem,env(safe-area-inset-top))]`}
        >
          <div className="pointer-events-auto">
            <SearchBar />
          </div>
        </div>
      </div>
    </>
  );
}
