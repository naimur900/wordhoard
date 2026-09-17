"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchWords } from "@/lib/vocab";
import { Search, Close } from "@/components/icons";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const results = useMemo(() => searchWords(query, 8), [query]);

  function handleBlur() {
    closeTimeout.current = setTimeout(() => setOpen(false), 150);
  }

  function handleFocus() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpen(true);
  }

  function goTo(setId: number, number: number) {
    setOpen(false);
    setQuery("");
    router.push(`/sets/${setId}?open=${number}`);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-hairline bg-card px-3.5 py-3 dark:border-hairline-dark dark:bg-card-dark">
        <Search className="h-4 w-4 shrink-0 text-ink/40 dark:text-ink-dark/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          type="text"
          inputMode="search"
          placeholder="Search a word or meaning"
          className="w-full bg-transparent font-sans text-base text-ink placeholder:text-ink/40 focus:outline-none dark:text-ink-dark dark:placeholder:text-ink-dark/40"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setQuery("")}
            className="shrink-0 text-ink/40 hover:text-ink/70 dark:text-ink-dark/40 dark:hover:text-ink-dark/70"
          >
            <Close className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <ul className="absolute inset-x-0 top-full z-30 mt-2 max-h-[min(20rem,60vh)] overflow-y-auto overscroll-contain rounded-xl border border-hairline bg-card shadow-lg shadow-black/5 dark:border-hairline-dark dark:bg-card-dark">
          {results.length === 0 ? (
            <li className="px-4 py-3 font-sans text-sm text-ink/50 dark:text-ink-dark/50">
              No words match “{query}”.
            </li>
          ) : (
            results.map((r) => (
              <li key={`${r.set}-${r.number}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goTo(r.set, r.number)}
                  className="flex w-full items-center gap-3 border-b border-hairline px-4 py-2.5 text-left last:border-b-0 hover:bg-paper/70 dark:border-hairline-dark dark:hover:bg-paper-dark/70"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-base font-semibold text-ink dark:text-ink-dark">
                      {r.word}
                    </span>
                    <span className="block truncate font-sans text-xs text-ink/55 dark:text-ink-dark/55">
                      {r.meaning}
                    </span>
                  </span>
                  <span className="shrink-0 font-sans text-xs text-ink/35 dark:text-ink-dark/35">
                    Set {r.set}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
