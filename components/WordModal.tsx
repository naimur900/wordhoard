"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { VocabEntry } from "@/lib/types";
import { useWordLink } from "@/lib/useWordLink";
import type { ImageSize } from "@/lib/useImageSize";
import WordFace from "@/components/WordFace";
import { ChevronLeft, Close } from "@/components/icons";

/**
 * A synonym or antonym opened from a card, wearing the card's own layout and
 * the entrance the settings and score modals use. Chips inside it are live
 * too, so one word leads to the next; `trail` keeps the way back.
 *
 * Rendered through a portal because a card is still mid-`card-in` for its
 * first 420ms, and a transformed ancestor would trap a `fixed` overlay
 * inside the card that spawned it.
 */
export default function WordModal({
  entry,
  size = "lg",
  onClose,
}: {
  entry: VocabEntry;
  size?: ImageSize;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [closing, setClosing] = useState(false);
  const [trail, setTrail] = useState<VocabEntry[]>([entry]);
  const current = trail[trail.length - 1];
  const home = useWordLink()(current);

  // Play the entrance in reverse, then let the parent unmount us.
  const requestClose = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    setClosing((already) => {
      if (!already) window.setTimeout(onClose, 200);
      return true;
    });
  }, [onClose]);

  const back = useCallback(() => setTrail((t) => t.slice(0, -1)), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [requestClose]);

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-3 backdrop-blur-sm sm:p-6 dark:bg-black/50 ${
        closing ? "overlay-out" : "overlay-in"
      }`}
      onClick={requestClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={current.word}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-full w-full max-w-md flex-col overflow-y-auto overscroll-contain rounded-2xl border border-hairline bg-card shadow-2xl shadow-black/20 focus:outline-none dark:border-hairline-dark dark:bg-card-dark ${
          closing ? "card-out" : "card-in"
        }`}
      >
        {/* Keying on the word replays `card-in` for each step of the trail, so
            following a chip feels like the next card arriving. */}
        <div key={current.word} className="card-in flex flex-1 flex-col">
          <WordFace
            entry={current}
            size={size}
            onPickWord={(next) => setTrail((t) => [...t, next])}
            action={
              <div className="-mr-1 -mt-1 flex shrink-0 items-center">
                {trail.length > 1 && (
                  <button
                    type="button"
                    onClick={back}
                    aria-label={`Back to ${trail[trail.length - 2].word}`}
                    title={`Back to ${trail[trail.length - 2].word}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-paper hover:text-ink dark:text-ink-dark/50 dark:hover:bg-paper-dark dark:hover:text-ink-dark"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={requestClose}
                  aria-label={`Close ${current.word}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-paper hover:text-ink dark:text-ink-dark/50 dark:hover:bg-paper-dark dark:hover:text-ink-dark"
                >
                  <Close className="h-4 w-4" />
                </button>
              </div>
            }
          />
        </div>

        {/* Where the word lives — its set, or a category while browsing
            those — for anyone who wants the rest of it. */}
        <Link
          href={home.href}
          onClick={onClose}
          className="border-t border-hairline/70 px-3.5 py-2.5 text-center font-sans text-xs font-semibold text-ink/50 transition-colors hover:bg-paper hover:text-ink sm:px-4 dark:border-hairline-dark/70 dark:text-ink-dark/50 dark:hover:bg-paper-dark dark:hover:text-ink-dark"
        >
          Open in {home.label}
        </Link>
      </div>
    </div>,
    document.body
  );
}
