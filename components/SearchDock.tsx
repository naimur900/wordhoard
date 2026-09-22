"use client";

import { useRef, useState } from "react";
import { HIDE_TRANSITION, useHideOnScroll } from "@/lib/useHideOnScroll";
import { SHELL_WIDTH } from "@/components/PageShell";
import SearchBar from "@/components/SearchBar";

// Scroll distance past its resting place over which the glass fades in.
const VEIL_RAMP = 48;

/**
 * The landing page's search bar: sits in the page flow, and once scrolled past
 * it sticks to the top of the viewport as a full-bleed glass bar, sliding away
 * while you scroll down and returning as soon as you scroll up.
 *
 * Render it as a direct child of <body>'s content (not inside PageShell), so
 * it stays stuck for the whole page and its veil spans the viewport.
 */
export default function SearchDock() {
  const dockRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);

  const hidden = useHideOnScroll(() => {
    // How far its resting place has scrolled above the viewport top.
    const past = -(sentinelRef.current?.getBoundingClientRect().top ?? 0);
    // Glass strength follows the scroll directly (no timed transition): an
    // opacity fade would switch the backdrop blur off in one step, since
    // Chrome drops backdrop-filter under any ancestor with opacity < 1.
    const strength = Math.min(Math.max(past / VEIL_RAMP, 0), 1);
    dockRef.current?.style.setProperty("--veil-k", strength.toFixed(3));
    return past > 0;
  }, focused);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div
        ref={dockRef}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => setFocused(false)}
        // The bottom `pb-8` is the veil's fade, pulled back out of the flow so
        // it only covers content while the bar is stuck. `--veil-k` starts at
        // 0 (no glass at rest) and is driven by the scroll above.
        className={`veil pointer-events-none sticky top-0 z-30 -mb-8 w-full [--veil-k:0] ${HIDE_TRANSITION} ${
          hidden ? "-translate-y-full" : ""
        }`}
      >
        <span className="veil-layers" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <div
          className={`relative ${SHELL_WIDTH} pb-8 pt-[max(1rem,env(safe-area-inset-top))]`}
        >
          <div className="pointer-events-auto">
            <SearchBar />
          </div>
        </div>
      </div>
    </>
  );
}
