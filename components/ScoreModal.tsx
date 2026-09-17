"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Refresh } from "@/components/icons";

/** The line under the score. Ordered worst to best; the first match wins. */
const REMARKS: { upTo: number; title: string; note: string }[] = [
  { upTo: 0.34, title: "A rough one", note: "These words are still new. Another pass through the sets will do it." },
  { upTo: 0.59, title: "Getting there", note: "The shape is right — the edges of the meanings still need work." },
  { upTo: 0.79, title: "Solid", note: "Most of these are yours. A few near-misses left to tighten." },
  { upTo: 0.99, title: "Sharp", note: "Very nearly clean. Look at the one or two that slipped." },
  { upTo: 1, title: "Perfect", note: "Every question, every answer. Nothing left to review." },
];

export default function ScoreModal({
  score,
  total,
  onReview,
  onRetake,
  onClose,
}: {
  score: number;
  total: number;
  /** Dismiss the modal and read back the marked questions. */
  onReview: () => void;
  /** Start another test of the same length. */
  onRetake: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [closing, setClosing] = useState(false);

  const ratio = total > 0 ? score / total : 0;
  const percent = Math.round(ratio * 100);
  const remark = REMARKS.find((r) => ratio <= r.upTo) ?? REMARKS[REMARKS.length - 1];

  // Play the entrance in reverse, then let the parent unmount us.
  const requestClose = useCallback(
    (after: () => void) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        after();
        return;
      }
      setClosing((already) => {
        if (!already) window.setTimeout(after, 200);
        return true;
      });
    },
    []
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose(onClose);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [requestClose, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-3 backdrop-blur-sm sm:p-6 dark:bg-black/50 ${
        closing ? "overlay-out" : "overlay-in"
      }`}
      onClick={() => requestClose(onClose)}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="score-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-full w-full max-w-sm overflow-y-auto overscroll-contain rounded-2xl border border-hairline bg-card p-6 text-center shadow-2xl shadow-black/20 focus:outline-none dark:border-hairline-dark dark:bg-card-dark ${
          closing ? "card-out" : "card-in"
        }`}
      >
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 dark:text-ink-dark/40">
          Test complete
        </p>

        <p className="mt-3 font-serif text-5xl font-semibold tabular-nums text-ink dark:text-ink-dark">
          {score}
          <span className="text-ink/35 dark:text-ink-dark/35">/{total}</span>
        </p>

        <div className="mx-auto mt-4 h-1.5 w-full overflow-hidden rounded-full bg-hairline dark:bg-hairline-dark">
          <div
            className="h-full rounded-full bg-ledger transition-[width] duration-700 dark:bg-ledger-dark"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 font-sans text-xs tabular-nums text-ink/45 dark:text-ink-dark/45">
          {percent}% correct
        </p>

        <h2
          id="score-title"
          className="mt-5 font-serif text-2xl font-semibold text-ink dark:text-ink-dark"
        >
          {remark.title}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[26ch] font-sans text-sm leading-relaxed text-ink/60 dark:text-ink-dark/60">
          {remark.note}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => requestClose(onReview)}
            className="w-full rounded-xl bg-stamp px-4 py-3 font-sans text-sm font-semibold text-paper transition-colors hover:bg-stamp/90 dark:bg-stamp-dark dark:text-paper-dark dark:hover:bg-stamp-dark/90"
          >
            Review answers
          </button>
          <button
            type="button"
            onClick={() => requestClose(onRetake)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-hairline px-4 py-3 font-sans text-sm font-semibold text-ink/75 transition-colors hover:border-ink/25 hover:text-ink dark:border-hairline-dark dark:text-ink-dark/75 dark:hover:border-ink-dark/25 dark:hover:text-ink-dark"
          >
            <Refresh className="h-4 w-4" /> Take another
          </button>
        </div>
      </div>
    </div>
  );
}
