"use client";

import { useMemo } from "react";
import { getCategorySummaries } from "@/lib/categories";
import { wordId } from "@/lib/vocab";
import { useKnownWords } from "@/lib/useKnownWords";
import PageShell from "@/components/PageShell";
import JumpNav from "@/components/JumpNav";
import GroupRow from "@/components/GroupRow";

export default function CategoryIndexClient() {
  const categories = useMemo(() => getCategorySummaries(), []);
  const { ready, isKnown } = useKnownWords();

  return (
    <>
      <JumpNav backHref="/" backLabel="Back to sets" ready={ready} />

      <PageShell padTop={false} className="min-h-screen">
        <div className="-mt-2 rounded-2xl border border-hairline bg-card/70 p-4 sm:p-5 dark:border-hairline-dark dark:bg-card-dark/70">
          <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl dark:text-ink-dark">
            Categories
          </h1>
          <p className="mt-1.5 max-w-prose font-sans text-sm text-ink/60 dark:text-ink-dark/60">
            The same words, sorted by where they get used. Many words belong
            to more than one category.
          </p>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, i) => (
            <GroupRow
              key={category.slug}
              href={`/categories/${category.slug}`}
              title={category.name}
              sample={category.sample}
              count={category.count}
              accent
              known={category.words.filter((w) => isKnown(wordId(w))).length}
              ready={ready}
              index={i}
            />
          ))}
        </ul>
      </PageShell>
    </>
  );
}
