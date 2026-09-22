"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSetIds, getSetSummaries, getSetWords, wordId } from "@/lib/vocab";
import { useKnownWords } from "@/lib/useKnownWords";
import { useReview } from "@/lib/useReview";
import { useImageSize } from "@/lib/useImageSize";
import PageShell from "@/components/PageShell";
import JumpNav from "@/components/JumpNav";
import OpenParam from "@/components/OpenParam";
import Flashcards from "@/components/Flashcards";
import WordCard from "@/components/WordCard";
import { Cards, ChevronLeft, ChevronRight } from "@/components/icons";

export default function SetPageClient({ setId: setIdParam }: { setId: string }) {
  const setId = Number(setIdParam);
  const words = useMemo(() => getSetWords(setId), [setId]);
  const nextSet = useMemo(() => {
    const next = getSetIds().find((id) => id > setId);
    return next === undefined
      ? null
      : { id: next, sample: getSetWords(next).slice(0, 3).map((w) => w.word) };
  }, [setId]);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const sets = useMemo(() => getSetSummaries(), []);
  const { ready, isKnown, toggle, countForSet } = useKnownWords();
  const review = useReview();
  const [cardsOpen, setCardsOpen] = useState(false);
  const { size } = useImageSize();
  const [open, setOpen] = useState<string | null>(null);

  // A ?open=<number> link (from search) scrolls to that word and flags it briefly.
  useEffect(() => {
    if (!open) return;
    const number = Number(open);
    if (!words.some((w) => w.number === number)) return;

    setHighlighted(number);
    document
      .getElementById(`word-${setId}-${number}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
    const timer = setTimeout(() => setHighlighted(null), 2200);
    return () => clearTimeout(timer);
    // Re-runs when a search result within this same set changes ?open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words.length, open]);

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
  const due = review.ready ? review.dueCount(words.map(wordId)) : 0;

  return (
    <>
      <OpenParam onChange={setOpen} />
      <JumpNav
        backHref="/"
        backLabel="Back to sets"
        label={`Set ${setId}`}
        menuLabel="Jump to a set"
        ready={ready}
        items={sets.map((s) => ({
          href: `/sets/${s.id}`,
          label: `Set ${s.id}`,
          known: countForSet(s.id),
          count: s.count,
          current: s.id === setId,
        }))}
      />

      <PageShell padTop={false}>
        <div className="-mt-2 rounded-2xl border border-hairline bg-card/70 p-4 sm:p-5 dark:border-hairline-dark dark:bg-card-dark/70">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl dark:text-ink-dark">
                Set {setId}
              </h1>
              <p className="mt-1 font-sans text-sm text-ink/50 dark:text-ink-dark/50">
                {ready ? `${known} of ${words.length} known` : "\u00A0"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCardsOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-hairline bg-card px-3 py-2 font-sans text-sm font-semibold text-ink/80 transition-colors hover:border-ink/25 hover:text-ink dark:border-hairline-dark dark:bg-card-dark dark:text-ink-dark/80 dark:hover:border-ink-dark/25 dark:hover:text-ink-dark"
            >
              <Cards className="h-4 w-4 text-stamp dark:text-stamp-dark" />
              Flashcards
              {due > 0 && (
                <span className="rounded-full bg-stamp/10 px-1.5 py-0.5 text-[11px] tabular-nums text-stamp dark:bg-stamp-dark/10 dark:text-stamp-dark">
                  {due} due
                </span>
              )}
            </button>
          </div>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-hairline dark:bg-hairline-dark">
            <div
              className="h-full rounded-full bg-ledger transition-[width] duration-500 dark:bg-ledger-dark"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {words.map((w, i) => (
            <WordCard
              key={wordId(w)}
              entry={w}
              index={i}
              known={isKnown(wordId(w))}
              highlighted={highlighted === w.number}
              size={size}
              onToggleKnown={() => toggle(wordId(w))}
            />
          ))}
        </ul>

        {cardsOpen && (
          <Flashcards
            title={`Set ${setId}`}
            words={words}
            isKnown={isKnown}
            onLearned={(id) => {
              if (!isKnown(id)) toggle(id);
            }}
            onClose={() => setCardsOpen(false)}
          />
        )}

        {nextSet ? (
          <Link
            href={`/sets/${nextSet.id}`}
            className="group mt-4 flex items-center gap-4 rounded-2xl border border-hairline bg-card/80 p-4 transition-colors hover:border-stamp/40 sm:p-5 dark:border-hairline-dark dark:bg-card-dark/80 dark:hover:border-stamp-dark/40"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 dark:text-ink-dark/40">
                Up next
              </span>
              <span className="mt-0.5 block font-serif text-xl font-semibold text-ink dark:text-ink-dark">
                Set {nextSet.id}
              </span>
              <span className="mt-0.5 block truncate font-sans text-sm text-ink/55 dark:text-ink-dark/55">
                {nextSet.sample.join(", ")}…
              </span>
            </span>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stamp text-paper transition-transform group-hover:translate-x-0.5 dark:bg-stamp-dark dark:text-paper-dark">
              <ChevronRight className="h-5 w-5" />
            </span>
          </Link>
        ) : (
          <div className="mt-4 rounded-2xl border border-hairline bg-card/80 p-5 text-center dark:border-hairline-dark dark:bg-card-dark/80">
            <p className="font-serif text-lg font-semibold text-ink dark:text-ink-dark">
              That is the last set
            </p>
            <Link
              href="/"
              className="mt-2 inline-flex items-center gap-1 font-sans text-sm text-stamp hover:underline dark:text-stamp-dark"
            >
              <ChevronLeft className="h-4 w-4" /> Back to all sets
            </Link>
          </div>
        )}
      </PageShell>
    </>
  );
}
