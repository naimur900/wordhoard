"use client";

import { useMemo } from "react";
import { ALL_WORDS, getSetSummaries } from "@/lib/vocab";
import { useKnownWords } from "@/lib/useKnownWords";
import PageShell from "@/components/PageShell";
import SearchBar from "@/components/SearchBar";
import SetRow from "@/components/SetRow";

export default function HomePage() {
  const sets = useMemo(() => getSetSummaries(), []);
  const { known, ready, countForSet, reset } = useKnownWords();
  const total = ALL_WORDS.length;
  const knownTotal = known.size;
  const progress = ready && total > 0 ? knownTotal / total : 0;

  function handleReset() {
    if (window.confirm("Clear every word you have marked as known?")) {
      reset();
    }
  }

  return (
    <PageShell className="min-h-screen">
      <div className="rounded-2xl border border-hairline bg-card/70 p-4 sm:p-5 dark:border-hairline-dark dark:bg-card-dark/70">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-ink-dark">
          Wordhoard
        </h1>
        <p className="mt-1.5 max-w-prose font-sans text-sm text-ink/60 dark:text-ink-dark/60">
          A working vocabulary of {total} words, gathered into {sets.length} sets of{" "}
          {sets[0]?.count ?? 30}.
        </p>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-hairline dark:bg-hairline-dark">
          <div
            className="h-full rounded-full bg-ledger transition-[width] duration-500 dark:bg-ledger-dark"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="mt-1.5 font-sans text-xs text-ink/45 dark:text-ink-dark/45">
          {ready ? `${knownTotal} of ${total} words known` : "\u00A0"}
        </p>
      </div>

      <div className="mt-4">
        <SearchBar />
      </div>

      <h2 className="mt-7 font-serif text-lg font-semibold text-ink dark:text-ink-dark">
        Sets
      </h2>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            known={countForSet(set.id)}
            ready={ready}
          />
        ))}
      </ul>

      {knownTotal > 0 && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={handleReset}
            className="font-sans text-xs text-ink/35 underline decoration-ink/20 underline-offset-2 hover:text-ink/60 dark:text-ink-dark/35 dark:decoration-ink-dark/20 dark:hover:text-ink-dark/60"
          >
            Reset progress
          </button>
        </div>
      )}
    </PageShell>
  );
}
