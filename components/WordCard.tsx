"use client";

import { useState } from "react";
import type { VocabEntry } from "@/lib/types";
import type { ImageSize } from "@/lib/useImageSize";
import WordFace from "@/components/WordFace";
import WordModal from "@/components/WordModal";
import { Stamp } from "@/components/icons";

export default function WordCard({
  entry,
  known,
  highlighted = false,
  size = "lg",
  index = 0,
  onToggleKnown,
}: {
  entry: VocabEntry;
  known: boolean;
  highlighted?: boolean;
  size?: ImageSize;
  /** Position in the set, used to stagger the entrance animation. */
  index?: number;
  onToggleKnown: () => void;
}) {
  // The synonym or antonym being read in a modal, if any.
  const [peek, setPeek] = useState<VocabEntry | null>(null);

  return (
    <li
      id={`word-${entry.number}`}
      // Only the first screenful staggers; past that the delay would outlast
      // the scroll it was meant to accompany.
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
      className={`card-in flex min-w-0 scroll-mt-24 flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm shadow-black/[0.03] transition duration-300 ${
        highlighted
          ? "border-stamp/50 ring-2 ring-stamp/40 dark:border-stamp-dark/50 dark:ring-stamp-dark/40"
          : known
            ? "border-ledger/35 dark:border-ledger-dark/30"
            : "border-hairline dark:border-hairline-dark"
      } dark:bg-card-dark/80`}
    >
      <WordFace
        entry={entry}
        size={size}
        onPickWord={setPeek}
        action={
          <button
            type="button"
            onClick={onToggleKnown}
            aria-pressed={known}
            aria-label={known ? `Mark ${entry.word} as not known` : `Mark ${entry.word} as known`}
            className={`-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
              known
                ? "border-ledger/40 bg-ledger/10 text-ledger dark:border-ledger-dark/40 dark:bg-ledger-dark/10 dark:text-ledger-dark"
                : "border-hairline text-ink/25 hover:border-ledger/40 hover:text-ledger dark:border-hairline-dark dark:text-ink-dark/25 dark:hover:border-ledger-dark/40 dark:hover:text-ledger-dark"
            }`}
          >
            <Stamp className="h-4 w-4" />
          </button>
        }
      />

      {peek && (
        <WordModal entry={peek} size={size} onClose={() => setPeek(null)} />
      )}
    </li>
  );
}
