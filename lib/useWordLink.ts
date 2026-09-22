"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { getCategory } from "@/lib/categories";
import type { VocabEntry } from "@/lib/types";

/**
 * Where a word opens from here: while browsing categories it stays among
 * them (the category on screen if the word is in it, else its main one);
 * everywhere else it opens in its set. `?open=` puts the page on the word.
 */
export function useWordLink() {
  const pathname = usePathname() ?? "";

  return useCallback(
    (entry: VocabEntry): { href: string; label: string } => {
      const [, section, current] = pathname.split("/");
      if (section === "categories") {
        const slug =
          current && entry.categories.includes(current) ? current : entry.categories[0];
        const category = getCategory(slug);
        if (category) {
          return {
            href: `/categories/${slug}?open=${encodeURIComponent(entry.word)}`,
            label: category.name,
          };
        }
      }
      return { href: `/sets/${entry.set}?open=${entry.number}`, label: `Set ${entry.set}` };
    },
    [pathname]
  );
}
