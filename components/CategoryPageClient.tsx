"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCategorySummaries } from "@/lib/categories";
import { wordId } from "@/lib/vocab";
import type { VocabEntry } from "@/lib/types";
import { useKnownWords } from "@/lib/useKnownWords";
import { useImageSize } from "@/lib/useImageSize";
import PageShell from "@/components/PageShell";
import JumpNav from "@/components/JumpNav";
import OpenParam from "@/components/OpenParam";
import WordCard from "@/components/WordCard";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export default function CategoryPageClient({ slug }: { slug: string }) {
  const categories = useMemo(() => getCategorySummaries(), []);
  const index = categories.findIndex((c) => c.slug === slug);
  const category = index === -1 ? null : categories[index];
  const next = category ? categories[index + 1] ?? null : null;
  const { ready, isKnown, toggle } = useKnownWords();
  const { size } = useImageSize();
  const [open, setOpen] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  // A ?open=<word> link (from search or a word's modal) scrolls to that word
  // and flags it briefly.
  useEffect(() => {
    const entry = category?.words.find((w) => w.word === open);
    if (!entry) return;

    setHighlighted(entry.word);
    document
      .getElementById(`word-${wordId(entry)}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
    const timer = setTimeout(() => setHighlighted(null), 2200);
    return () => clearTimeout(timer);
  }, [category, open]);

  if (!category) {
    return (
      <PageShell className="min-h-screen">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 font-sans text-sm text-ink/60 dark:text-ink-dark/60"
        >
          <ChevronLeft className="h-4 w-4" /> All categories
        </Link>
        <p className="mt-6 font-sans text-sm text-ink/60 dark:text-ink-dark/60">
          There is no category called {slug}.
        </p>
      </PageShell>
    );
  }

  const words = category.words;
  const knownIn = (list: VocabEntry[]) => list.filter((w) => isKnown(wordId(w))).length;
  const known = knownIn(words);
  const progress = ready ? known / words.length : 0;

  return (
    <>
      <OpenParam onChange={setOpen} />
      <JumpNav
        backHref="/categories"
        backLabel="All categories"
        label={category.name}
        shortLabel={category.short}
        menuLabel="Jump to a category"
        ready={ready}
        items={categories.map((c) => ({
          href: `/categories/${c.slug}`,
          label: c.name,
          known: knownIn(c.words),
          count: c.count,
          current: c.slug === slug,
        }))}
      />

      <PageShell padTop={false}>
        <div className="-mt-2 rounded-2xl border border-hairline bg-card/70 p-4 sm:p-5 dark:border-hairline-dark dark:bg-card-dark/70">
          <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl dark:text-ink-dark">
            {category.name}
          </h1>
          <p className="mt-1 font-sans text-sm text-ink/60 dark:text-ink-dark/60">
            {category.blurb}
          </p>
          <p className="mt-1 font-sans text-sm text-ink/50 dark:text-ink-dark/50">
            {ready ? `${known} of ${words.length} known` : " "}
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
              highlighted={highlighted === w.word}
              size={size}
              onToggleKnown={() => toggle(wordId(w))}
            />
          ))}
        </ul>

        {next ? (
          <Link
            href={`/categories/${next.slug}`}
            className="group mt-4 flex items-center gap-4 rounded-2xl border border-hairline bg-card/80 p-4 transition-colors hover:border-stamp/40 sm:p-5 dark:border-hairline-dark dark:bg-card-dark/80 dark:hover:border-stamp-dark/40"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 dark:text-ink-dark/40">
                Up next
              </span>
              <span className="mt-0.5 block font-serif text-xl font-semibold text-ink dark:text-ink-dark">
                {next.name}
              </span>
              <span className="mt-0.5 block truncate font-sans text-sm text-ink/55 dark:text-ink-dark/55">
                {next.sample.join(", ")}…
              </span>
            </span>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stamp text-paper transition-transform group-hover:translate-x-0.5 dark:bg-stamp-dark dark:text-paper-dark">
              <ChevronRight className="h-5 w-5" />
            </span>
          </Link>
        ) : (
          <div className="mt-4 rounded-2xl border border-hairline bg-card/80 p-5 text-center dark:border-hairline-dark dark:bg-card-dark/80">
            <p className="font-serif text-lg font-semibold text-ink dark:text-ink-dark">
              That is the last category
            </p>
            <Link
              href="/categories"
              className="mt-2 inline-flex items-center gap-1 font-sans text-sm text-stamp hover:underline dark:text-stamp-dark"
            >
              <ChevronLeft className="h-4 w-4" /> Back to all categories
            </Link>
          </div>
        )}
      </PageShell>
    </>
  );
}
