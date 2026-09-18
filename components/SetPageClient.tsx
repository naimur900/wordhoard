"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSetIds, getSetWords, wordId } from "@/lib/vocab";
import { useKnownWords } from "@/lib/useKnownWords";
import { useImageSize } from "@/lib/useImageSize";
import PageShell from "@/components/PageShell";
import SetNav from "@/components/SetNav";
import WordCard from "@/components/WordCard";
import { ChevronLeft, ChevronRight } from "@/components/icons";

/**
 * Reports `?open=`. Kept in its own Suspense boundary because reading search
 * params opts whatever is above the nearest boundary out of static rendering —
 * this way only this empty component waits for the client, and the set's
 * cards still ship as prerendered HTML (which is what the offline cache holds).
 *
 * The value itself comes from `location`: on a prerendered page
 * `useSearchParams()` came back without `open`, but it still changes whenever
 * the URL does, so it serves as the signal to look again (a search result in
 * the set already open only changes `?open=`).
 */
function OpenParam({ onChange }: { onChange: (open: string | null) => void }) {
  const params = useSearchParams();
  useEffect(() => {
    onChange(new URLSearchParams(window.location.search).get("open"));
  }, [params, onChange]);
  return null;
}

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
  const { ready, isKnown, toggle, countForSet } = useKnownWords();
  const { size } = useImageSize();
  const [open, setOpen] = useState<string | null>(null);

  // A ?open=<number> link (from search) scrolls to that word and flags it briefly.
  useEffect(() => {
    if (!open) return;
    const number = Number(open);
    if (!words.some((w) => w.number === number)) return;

    setHighlighted(number);
    document
      .getElementById(`word-${number}`)
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

  return (
    <>
      <Suspense fallback={null}>
        <OpenParam onChange={setOpen} />
      </Suspense>
      <SetNav setId={setId} />

      <PageShell padTop={false}>
        <div className="-mt-6 rounded-2xl border border-hairline bg-card/70 p-4 sm:p-5 dark:border-hairline-dark dark:bg-card-dark/70">
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
