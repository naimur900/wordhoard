"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSetSummaries } from "@/lib/vocab";
import { useKnownWords } from "@/lib/useKnownWords";
import { useHideOnScroll } from "@/lib/useHideOnScroll";
import { useScrollFade } from "@/lib/useScrollFade";
import { SHELL_WIDTH } from "@/components/PageShell";
import SearchBar from "@/components/SearchBar";
import { ChevronLeft, ChevronDown, Stamp } from "@/components/icons";

/**
 * Sticky glass bar for a set page: back link, search and set switcher in one
 * row. The bar itself is full-bleed so the veil spans the
 * viewport, while its rows sit on the shared content grid.
 */
export default function SetNav({ setId }: { setId: number }) {
  const sets = useMemo(() => getSetSummaries(), []);
  const { ready, countForSet } = useKnownWords();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef<HTMLAnchorElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const fade = useScrollFade(listRef, open);

  // On phones the bar slides away on scroll-down and returns on scroll-up,
  // but never while the set menu is open or search is in use.
  const [focused, setFocused] = useState(false);
  const hidden = useHideOnScroll(
    () => window.scrollY > (barRef.current?.offsetHeight ?? 0),
    open || focused
  );

  // Close on outside press or Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Open the list already scrolled to the set you are on.
  useEffect(() => {
    // Scroll only the list: scrollIntoView would also nudge the page itself.
    const list = listRef.current;
    const item = currentRef.current;
    if (!open || !list || !item) return;
    list.scrollTop = item.offsetTop - (list.clientHeight - item.offsetHeight) / 2;
  }, [open]);

  return (
    <div
      ref={barRef}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      className={`veil sticky top-0 z-30 w-full [--veil-fade:3rem] transition-transform duration-300 ease-out ${
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
        className={`relative ${SHELL_WIDTH} pb-12 pt-[max(0.85rem,env(safe-area-inset-top))]`}
      >
        {/* Phone: back icon, search filling the middle, set switcher. Wider
            screens: equal side columns so the search sits truly centred. */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[1fr_minmax(0,26rem)_1fr] sm:gap-4">
          <Link
            href="/"
            aria-label="Back to sets"
            className="-ml-2 inline-flex h-9 min-w-9 items-center justify-center gap-1 justify-self-start rounded-full font-sans text-sm text-ink/70 hover:text-ink sm:ml-0 sm:min-w-0 dark:text-ink-dark/70 dark:hover:text-ink-dark"
          >
            <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back to sets</span>
          </Link>

          <SearchBar compact />

          <div className="relative justify-self-end" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-haspopup="menu"
              className="inline-flex h-[38px] items-center gap-1.5 rounded-xl border border-hairline bg-card/80 pl-3.5 pr-2.5 font-sans text-sm font-medium text-ink/80 transition-colors hover:border-ink/25 hover:text-ink dark:border-hairline-dark dark:bg-card-dark/80 dark:text-ink-dark/80 dark:hover:border-ink-dark/25 dark:hover:text-ink-dark"
            >
              Set {setId}
              <ChevronDown
                className={`h-4 w-4 text-ink/45 transition-transform duration-200 dark:text-ink-dark/45 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {open && (
              <div
                role="menu"
                aria-label="Jump to a set"
                className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-56 overflow-hidden rounded-xl border border-hairline bg-card shadow-xl shadow-black/10 dark:border-hairline-dark dark:bg-card-dark"
              >
                <ul
                  ref={listRef}
                  className={`relative max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain py-1 ${
                    fade ? "fade-bottom" : ""
                  }`}
                >
                  {sets.map((s) => {
                    const known = countForSet(s.id);
                    const current = s.id === setId;
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/sets/${s.id}`}
                          ref={current ? currentRef : undefined}
                          role="menuitem"
                          aria-current={current ? "page" : undefined}
                          onClick={() => setOpen(false)}
                          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 font-sans text-sm transition-colors ${
                            current
                              ? "bg-stamp/10 text-stamp dark:bg-stamp-dark/10 dark:text-stamp-dark"
                              : "text-ink/75 hover:bg-paper/70 dark:text-ink-dark/75 dark:hover:bg-paper-dark/70"
                          }`}
                        >
                          <span className="font-medium">Set {s.id}</span>
                          <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-ink/45 dark:text-ink-dark/45">
                            {ready && known === s.count && (
                              <Stamp className="h-3.5 w-3.5 text-ledger dark:text-ledger-dark" />
                            )}
                            {ready ? `${known}/${s.count}` : " "}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
