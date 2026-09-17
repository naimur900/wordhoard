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

const SUFFIXES = "(?:s|es|ed|d|ing|ly|ness|ment|al|ous|ive|ion|ity)?";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Matches the headword as it actually appears in a sentence: plain, suffixed
 * ("abound" → "abounds"), with the silent -e dropped ("abate" → "abated"), -y
 * turned to -i ("deify" → "deified"), or the final consonant doubled ("fret" →
 * "fretted"). Every one of the 810 example sentences matches one of these.
 */
function inflectionPattern(word: string) {
  const escaped = escapeRegExp(word);
  const alternatives = [escaped + SUFFIXES];
  const last = word[word.length - 1];

  if (last === "e") alternatives.push(`${escapeRegExp(word.slice(0, -1))}(?:ing|ed|es)`);
  if (last === "y") alternatives.push(`${escapeRegExp(word.slice(0, -1))}(?:ies|ied|ily|iness)`);
  if (/[a-z]/i.test(last) && !"aeiou".includes(last.toLowerCase())) {
    alternatives.push(`${escaped}${escapeRegExp(last)}(?:ed|ing|er|est|y)`);
  }

  return new RegExp(`\\b(?:${alternatives.join("|")})\\b`, "gi");
}

/** Splits a sentence into runs, flagging the ones that are the headword. */
export function splitAroundWord(
  sentence: string,
  word: string
): { text: string; isWord: boolean }[] {
  const parts: { text: string; isWord: boolean }[] = [];
  const pattern = inflectionPattern(word);
  let cursor = 0;

  for (const match of sentence.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) parts.push({ text: sentence.slice(cursor, start), isWord: false });
    parts.push({ text: match[0], isWord: true });
    cursor = start + match[0].length;
  }
  if (cursor < sentence.length) parts.push({ text: sentence.slice(cursor), isWord: false });

  return parts;
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
