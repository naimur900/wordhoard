"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ALL_WORDS, getSetSummaries } from "@/lib/vocab";
import { CATEGORIES } from "@/lib/categories";
import { useKnownWords } from "@/lib/useKnownWords";
import { useImageSize } from "@/lib/useImageSize";
import PageShell, { SHELL_WIDTH } from "@/components/PageShell";
import SearchDock from "@/components/SearchDock";
import GroupRow from "@/components/GroupRow";
import SettingsModal from "@/components/SettingsModal";
import SiteFooter from "@/components/SiteFooter";
import { ChevronRight, Gear, Quiz, Tag } from "@/components/icons";

export default function HomePage() {
  const sets = useMemo(() => getSetSummaries(), []);
  const { known, ready, countForSet, reset } = useKnownWords();
  const { size, setSize } = useImageSize();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const total = ALL_WORDS.length;
  const knownTotal = known.size;
  const progress = ready && total > 0 ? knownTotal / total : 0;

  function handleReset() {
    if (window.confirm("Clear every word you have marked as known?")) {
      reset();
    }
  }

  return (
    <>
      <div
        className={`${SHELL_WIDTH} pt-[max(1.25rem,env(safe-area-inset-top))]`}
      >
        <div className="rounded-2xl border border-hairline bg-card/70 p-4 sm:p-5 dark:border-hairline-dark dark:bg-card-dark/70">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-ink-dark">
              Wordhoard
            </h1>
            <div className="-mr-1 -mt-1 flex shrink-0 items-center gap-0.5">
              <Link
                href="/test"
                aria-label="Take a test"
                title="Take a test"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink/45 transition-colors hover:bg-paper hover:text-stamp focus-visible:text-stamp dark:text-ink-dark/45 dark:hover:bg-paper-dark dark:hover:text-stamp-dark dark:focus-visible:text-stamp-dark"
              >
                <Quiz className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Settings"
                aria-haspopup="dialog"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink/45 transition-colors hover:bg-paper hover:text-ink focus-visible:text-ink dark:text-ink-dark/45 dark:hover:bg-paper-dark dark:hover:text-ink-dark dark:focus-visible:text-ink-dark"
              >
                <Gear className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="mt-1.5 max-w-prose font-sans text-sm text-ink/60 dark:text-ink-dark/60">
            A working vocabulary of {total} words, gathered into {sets.length}{" "}
            sets of {sets[0]?.count ?? 30}.
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

        <Link
          href="/categories"
          // Mirrors the search bar below it: same padding, type size and icon.
          className="group mt-4 flex items-center gap-3 rounded-xl border border-hairline bg-card px-3.5 py-3 transition-colors hover:border-ink/25 dark:border-hairline-dark dark:bg-card-dark dark:hover:border-ink-dark/25"
        >
          <Tag className="h-4 w-4 shrink-0 text-stamp dark:text-stamp-dark" />
          <span className="min-w-0 flex-1 truncate font-sans text-base text-ink dark:text-ink-dark">
            Browse by category
          </span>
          <span className="shrink-0 font-sans text-xs tabular-nums text-ink/45 dark:text-ink-dark/45">
            {CATEGORIES.length} topics
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink/25 transition-transform group-hover:translate-x-0.5 dark:text-ink-dark/25" />
        </Link>
      </div>

      <SearchDock />

      <PageShell padTop={false} className="min-h-screen">
        <h2 className="mt-7 font-serif text-lg font-semibold text-ink dark:text-ink-dark">
          Sets
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sets.map((set, i) => (
            <GroupRow
              key={set.id}
              href={`/sets/${set.id}`}
              badge={String(set.id).padStart(2, "0")}
              title={`Set ${set.id}`}
              sample={set.sample}
              count={set.count}
              index={i}
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

        <SiteFooter />

        {settingsOpen && (
          <SettingsModal
            size={size}
            onSelect={setSize}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </PageShell>
    </>
  );
}
