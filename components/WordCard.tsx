"use client";

import type { VocabEntry } from "@/lib/types";
import type { ImageSize } from "@/lib/useImageSize";
import { splitAroundWord } from "@/lib/vocab";
import WordImage from "@/components/WordImage";
import { Stamp, Alert } from "@/components/icons";

function ChipRow({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "ledger" | "stamp";
}) {
  const chip =
    tone === "ledger"
      ? "bg-ledger/10 text-ledger ring-ledger/20 dark:bg-ledger-dark/10 dark:text-ledger-dark dark:ring-ledger-dark/25"
      : "bg-stamp/10 text-stamp ring-stamp/20 dark:bg-stamp-dark/10 dark:text-stamp-dark dark:ring-stamp-dark/25";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/35 dark:text-ink-dark/35">
        {label}
      </span>
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full px-2.5 py-0.5 font-sans text-xs ring-1 ring-inset ${chip}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/**
 * Every step grows the picture but leaves the meaning a readable column.
 * The tightest case is the 640px breakpoint, where cards first go two-up and
 * are at their narrowest — so LG holds its phone size there and takes its
 * extra width only from `lg:` up, where the card has room to give.
 */
/**
 * One accent hue per part of speech. `chip` colours the tag beside the word,
 * `bar` the rule down the left of the example sentence, so a card's grammar is
 * legible at a glance without another block of text.
 */
const POS_ACCENT: Record<string, { chip: string; bar: string; word: string }> = {
  noun: {
    chip: "bg-azure/10 text-azure ring-azure/25 dark:bg-azure-dark/10 dark:text-azure-dark dark:ring-azure-dark/30",
    bar: "border-azure/35 dark:border-azure-dark/35",
    word: "text-azure dark:text-azure-dark",
  },
  verb: {
    chip: "bg-plum/10 text-plum ring-plum/25 dark:bg-plum-dark/10 dark:text-plum-dark dark:ring-plum-dark/30",
    bar: "border-plum/35 dark:border-plum-dark/35",
    word: "text-plum dark:text-plum-dark",
  },
  adjective: {
    chip: "bg-teal/10 text-teal ring-teal/25 dark:bg-teal-dark/10 dark:text-teal-dark dark:ring-teal-dark/30",
    bar: "border-teal/35 dark:border-teal-dark/35",
    word: "text-teal dark:text-teal-dark",
  },
  adverb: {
    chip: "bg-honey/10 text-honey ring-honey/25 dark:bg-honey-dark/10 dark:text-honey-dark dark:ring-honey-dark/30",
    bar: "border-honey/35 dark:border-honey-dark/35",
    word: "text-honey dark:text-honey-dark",
  },
};

const POS_FALLBACK = {
  chip: "bg-ink/5 text-ink/60 ring-ink/15 dark:bg-ink-dark/5 dark:text-ink-dark/60 dark:ring-ink-dark/15",
  bar: "border-hairline dark:border-hairline-dark",
  word: "text-ink dark:text-ink-dark",
};

/** "verb; noun" → ["verb", "noun"] */
function partsOfSpeech(value: string | undefined) {
  return (value ?? "")
    .split(";")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

const THUMB_SIZE: Record<ImageSize, string> = {
  s: "h-14 w-14 sm:h-16 sm:w-16",
  md: "h-20 w-20 sm:h-24 sm:w-24",
  lg: "h-24 w-24 lg:h-32 lg:w-32",
};

export default function WordCard({
  entry,
  known,
  highlighted = false,
  size = "md",
  index = 0,
  onToggleKnown,
}: {
  entry: VocabEntry;
  known: boolean;
  highlighted?: boolean;
  size?: ImageSize;
  /** Position in the set, used to stagger the entrance animation. */
  index?: number;
  onToggleKnown: () => void;
}) {
  const confused = entry.commonly_confused_with ?? [];
  const pos = partsOfSpeech(entry.part_of_speech);
  const accent = POS_ACCENT[pos[0]] ?? POS_FALLBACK;
  const example = entry.example_sentence?.trim();
  const hasDetail =
    entry.synonyms.length > 0 || entry.antonyms.length > 0 || confused.length > 0;

  return (
    <li
      id={`word-${entry.number}`}
      // Only the first screenful staggers; past that the delay would outlast
      // the scroll it was meant to accompany.
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
      className={`card-in flex min-w-0 scroll-mt-24 flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm shadow-black/[0.03] transition duration-300 ${
        highlighted
          ? "border-stamp/50 ring-2 ring-stamp/40 dark:border-stamp-dark/50 dark:ring-stamp-dark/40"
          : known
            ? "border-ledger/35 dark:border-ledger-dark/30"
            : "border-hairline dark:border-hairline-dark"
      } dark:bg-card-dark/80`}
    >
      <div className="flex gap-3.5 p-3.5 sm:gap-4 sm:p-4">
        <div className="relative shrink-0">
          <WordImage
            entry={entry}
            variant="card"
            className={`rounded-xl ring-1 ring-hairline dark:ring-hairline-dark ${THUMB_SIZE[size]}`}
          />
          <span className="absolute -left-1.5 -top-1.5 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border border-hairline bg-paper px-1.5 font-sans text-[11px] tabular-nums text-ink/55 dark:border-hairline-dark dark:bg-paper-dark dark:text-ink-dark/55">
            {entry.number}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              {/* Two-up cards are narrowest just past 640px, where a long word
                  can outrun its column — hyphenate there rather than snapping a
                  letter onto its own line, and save the larger type for `lg:`. */}
              <h3 className="min-w-0 hyphens-auto break-words font-serif text-lg font-semibold leading-tight text-ink lg:text-xl dark:text-ink-dark">
                {entry.word}
              </h3>
              {pos.map((part) => (
                <span
                  key={part}
                  className={`shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] ring-1 ring-inset ${
                    (POS_ACCENT[part] ?? POS_FALLBACK).chip
                  }`}
                >
                  {part}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={onToggleKnown}
              aria-pressed={known}
              aria-label={known ? `Mark ${entry.word} as not known` : `Mark ${entry.word} as known`}
              className={`-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                known
                  ? "border-ledger/40 bg-ledger/10 text-ledger dark:border-ledger-dark/40 dark:bg-ledger-dark/10 dark:text-ledger-dark"
                  : "border-hairline text-ink/25 hover:border-ledger/40 hover:text-ledger dark:border-hairline-dark dark:text-ink-dark/25 dark:hover:border-ledger-dark/40 dark:hover:text-ledger-dark"
              }`}
            >
              <Stamp className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-1 font-sans text-sm leading-relaxed text-ink/70 dark:text-ink-dark/70">
            {entry.meaning}
          </p>

          {example && (
            <p
              className={`mt-2 border-l-2 pl-2.5 font-serif text-[13px] italic leading-snug text-ink/60 dark:text-ink-dark/60 ${accent.bar}`}
            >
              {splitAroundWord(example, entry.word).map((part, i) =>
                part.isWord ? (
                  <strong
                    key={i}
                    className={`font-semibold not-italic ${accent.word}`}
                  >
                    {part.text}
                  </strong>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </p>
          )}

          {confused.length > 0 && (
            <p className="mt-2.5 flex items-start gap-1.5 font-sans text-xs leading-relaxed text-caution dark:text-caution-dark">
              <Alert className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>Often confused with {confused.join(", ")}</span>
            </p>
          )}
        </div>
      </div>

      {hasDetail && (
        <div className="mt-auto space-y-2 border-t border-hairline/70 bg-paper/40 px-3.5 py-3 sm:px-4 dark:border-hairline-dark/70 dark:bg-paper-dark/30">
          {entry.synonyms.length > 0 && (
            <ChipRow label="Syn" items={entry.synonyms} tone="ledger" />
          )}
          {entry.antonyms.length > 0 && (
            <ChipRow label="Ant" items={entry.antonyms} tone="stamp" />
          )}
        </div>
      )}
    </li>
  );
}
