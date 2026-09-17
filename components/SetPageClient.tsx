"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSetWords, wordId } from "@/lib/vocab";
import { useKnownWords } from "@/lib/useKnownWords";
import PageShell from "@/components/PageShell";
import SetNav from "@/components/SetNav";
import WordCard from "@/components/WordCard";
import { ChevronLeft } from "@/components/icons";

export default function SetPageClient({ setId: setIdParam }: { setId: string }) {
  const setId = Number(setIdParam);
  const words = useMemo(() => getSetWords(setId), [setId]);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const { ready, isKnown, toggle, countForSet } = useKnownWords();

  // A ?open=<number> link (from search) scrolls to that word and flags it briefly.
  useEffect(() => {
    const open = new URLSearchParams(window.location.search).get("open");
    if (!open) return;
    const number = Number(open);
    if (!words.some((w) => w.number === number)) return;

    setHighlighted(number);
    document
      .getElementById(`word-${number}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
    const timer = setTimeout(() => setHighlighted(null), 2200);
    return () => clearTimeout(timer);
    // Only run once, when the word list for this set is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words.length]);

  if (!words.length) {
    return (
      <PageShell className="min-h-screen">
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-sans text-sm text-ink/60 dark:text-ink-dark/60"
        >
          <ChevronLeft className="h-4 w-4" /> Back to sets
        </Link>
        <p className="mt-6 font-sans text-sm text-ink/60 dark:text-ink-dark/60">
          There is no set numbered {setIdParam}.
        </p>
      </PageShell>
    );
  }

  const known = countForSet(setId);
  const progress = ready ? known / words.length : 0;

  return (
    <>
      <SetNav setId={setId} />

      <PageShell padTop={false}>
        <div className="-mt-2 rounded-2xl border border-hairline bg-card/70 p-4 sm:p-5 dark:border-hairline-dark dark:bg-card-dark/70">
          <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl dark:text-ink-dark">
            Set {setId}
          </h1>
          <p className="mt-1 font-sans text-sm text-ink/50 dark:text-ink-dark/50">
            {ready ? `${known} of ${words.length} known` : "\u00A0"}
          </p>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-hairline dark:bg-hairline-dark">
            <div
              className="h-full rounded-full bg-ledger transition-[width] duration-500 dark:bg-ledger-dark"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {words.map((w) => (
            <WordCard
              key={wordId(w)}
              entry={w}
              known={isKnown(wordId(w))}
              highlighted={highlighted === w.number}
              onToggleKnown={() => toggle(wordId(w))}
            />
          ))}
        </ul>
      </PageShell>
    </>
  );
}
