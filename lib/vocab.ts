import raw from "@/data/vocab.json";
import type { SetSummary, VocabEntry } from "@/lib/types";

export const ALL_WORDS = raw as VocabEntry[];

export function wordId(entry: Pick<VocabEntry, "set" | "number">): string {
  return `${entry.set}-${entry.number}`;
}

export function getSetIds(): number[] {
  const ids = new Set(ALL_WORDS.map((w) => w.set));
  return Array.from(ids).sort((a, b) => a - b);
}

export function getSetSummaries(): SetSummary[] {
  return getSetIds().map((id) => {
    const words = ALL_WORDS.filter((w) => w.set === id).sort(
      (a, b) => a.number - b.number
    );
    return {
      id,
      count: words.length,
      words,
      sample: words.slice(0, 3).map((w) => w.word),
    };
  });
}

export function getSetWords(setId: number): VocabEntry[] {
  return ALL_WORDS.filter((w) => w.set === setId).sort(
    (a, b) => a.number - b.number
  );
}

export function imageSrc(entry: VocabEntry): string | null {
  if (!entry.image) return null;
  return `/${entry.image}`;
}

export function searchWords(query: string, limit = 40): VocabEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: VocabEntry[] = [];
  const contains: VocabEntry[] = [];
  for (const entry of ALL_WORDS) {
    const word = entry.word.toLowerCase();
    if (word.startsWith(q)) {
      starts.push(entry);
    } else if (
      word.includes(q) ||
      entry.meaning.toLowerCase().includes(q) ||
      entry.synonyms.some((s) => s.toLowerCase().includes(q))
    ) {
      contains.push(entry);
    }
    if (starts.length + contains.length >= limit * 3) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
