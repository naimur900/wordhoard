"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchWords } from "@/lib/vocab";
import { useWordLink } from "@/lib/useWordLink";
import { useScrollFade } from "@/lib/useScrollFade";
import { Search, Close } from "@/components/icons";

/** `compact` is the slimmer variant that sits inside a nav row. */
export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const linkFor = useWordLink();

  const results = useMemo(() => searchWords(query, 8), [query]);
  const listRef = useRef<HTMLUListElement | null>(null);
  const showList = open && query.trim() !== "";
  const fade = useScrollFade(listRef, showList);

  function handleBlur() {
    closeTimeout.current = setTimeout(() => setOpen(false), 150);
  }

  function handleFocus() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpen(true);
  }

  function goTo(href: string) {
    setOpen(false);
    setQuery("");
    // Drop focus so the next search reopens the list (and mobile keyboards close).
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(href);
  }

  return (
    <div className="relative">
      <div
        className={`flex items-center rounded-xl border border-hairline bg-card dark:border-hairline-dark dark:bg-card-dark ${
          compact ? "gap-2 px-3 py-1.5" : "gap-3 px-3.5 py-3"
        }`}
      >
        <Search className="h-4 w-4 shrink-0 text-ink/40 dark:text-ink-dark/40" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          type="text"
          inputMode="search"
          placeholder={compact ? "Search words" : "Search a word or meaning"}
          aria-label="Search a word or meaning"
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

      {showList && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-hairline bg-card shadow-lg shadow-black/5 dark:border-hairline-dark dark:bg-card-dark">
          <ul
            ref={listRef}
            className={`max-h-[min(20rem,60vh)] overflow-y-auto overscroll-contain ${
              fade ? "fade-bottom" : ""
            }`}
          >
            {results.length === 0 ? (
              <li className="px-4 py-3 font-sans text-sm text-ink/50 dark:text-ink-dark/50">
                No words match “{query}”.
              </li>
            ) : (
              results.map((r) => {
                const link = linkFor(r);
                return (
                <li key={`${r.set}-${r.number}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goTo(link.href)}
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
                    <span className="max-w-[40%] shrink-0 truncate font-sans text-xs text-ink/35 dark:text-ink-dark/35">
                      {link.label}
                    </span>
                  </button>
                </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
