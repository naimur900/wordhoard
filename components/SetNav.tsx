"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSetSummaries } from "@/lib/vocab";
import { useKnownWords } from "@/lib/useKnownWords";
import { SHELL_WIDTH } from "@/components/PageShell";
import { ChevronLeft, ChevronDown, Stamp } from "@/components/icons";

/**
 * Sticky glass bar for a set page: back link on the left, set switcher on the
 * right. The bar itself is full-bleed so the veil spans the viewport, while
 * its row sits on the shared content grid.
 */
export default function SetNav({ setId }: { setId: number }) {
  const sets = useMemo(() => getSetSummaries(), []);
  const { ready, countForSet } = useKnownWords();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef<HTMLAnchorElement | null>(null);

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
    if (open) currentRef.current?.scrollIntoView({ block: "center" });
  }, [open]);

  return (
    <div className="veil sticky top-0 z-30 w-full">
      <span className="veil-layers" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>

      <div
        className={`relative flex items-center justify-between gap-3 ${SHELL_WIDTH} pb-8 pt-[max(0.85rem,env(safe-area-inset-top))]`}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-sans text-sm text-ink/70 hover:text-ink dark:text-ink-dark/70 dark:hover:text-ink-dark"
        >
          <ChevronLeft className="h-4 w-4" /> Back to sets
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card/80 py-1.5 pl-3.5 pr-2.5 font-sans text-sm font-medium text-ink/80 transition-colors hover:border-ink/25 hover:text-ink dark:border-hairline-dark dark:bg-card-dark/80 dark:text-ink-dark/80 dark:hover:border-ink-dark/25 dark:hover:text-ink-dark"
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
              <ul className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain py-1">
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
  );
}
