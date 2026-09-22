"use client";

import WordImage from "@/components/WordImage";
import { Alert, Speaker } from "@/components/icons";
import type { VocabEntry } from "@/lib/types";
import type { ImageSize } from "@/lib/useImageSize";
import { useSpeech } from "@/lib/useSpeech";
import { findWord, splitAroundWord } from "@/lib/vocab";
import type { ReactNode } from "react";

/**
 * A word's picture, meaning, example and chips — everything a card shows
 * except the frame around it. The set page wraps it in a list card with the
 * known stamp; WordModal wraps it in a dialog panel with a close button, so a
 * synonym opens looking exactly like the card it was read from.
 */

function ChipRow({
  label,
  items,
  tone,
  self,
  onPick,
}: {
  label: string;
  items: string[];
  tone: "ledger" | "stamp";
  /** The headword these chips belong to; it never links back to itself. */
  self: string;
  onPick?: (entry: VocabEntry) => void;
}) {
  const fill =
    tone === "ledger"
      ? "bg-ledger/10 text-ledger dark:bg-ledger-dark/10 dark:text-ledger-dark"
      : "bg-stamp/10 text-stamp dark:bg-stamp-dark/10 dark:text-stamp-dark";
  // A plain chip keeps its solid hairline; one you can open wears a dotted one.
  // Both are drawn outside the box — a ring, then an inset outline — so the two
  // kinds of chip sit at exactly the same height in a row.
  const edge =
    tone === "ledger"
      ? "ring-1 ring-inset ring-ledger/20 dark:ring-ledger-dark/25"
      : "ring-1 ring-inset ring-stamp/20 dark:ring-stamp-dark/25";
  const dottedEdge =
    tone === "ledger"
      ? "outline-dotted outline-1 -outline-offset-1 outline-ledger/55 dark:outline-ledger-dark/60"
      : "outline-dotted outline-1 -outline-offset-1 outline-stamp/55 dark:outline-stamp-dark/60";
  // What a chip you can open looks like: a halo in its own hue, lit faintly at
  // rest so touch users can see it too, and brighter under the pointer. The
  // light values are the literal ledger/stamp hex; dark reads the live token,
  // so the dark theme glows in its own version of the hue.
  const glow =
    tone === "ledger"
      ? "shadow-[0_0_9px_-1px_rgba(62,92,78,0.45)] hover:bg-ledger/20 hover:shadow-[0_0_14px_0_rgba(62,92,78,0.6)] dark:shadow-[0_0_9px_-1px_rgb(var(--ledger-dark)/0.5)] dark:hover:bg-ledger-dark/20 dark:hover:shadow-[0_0_14px_0_rgb(var(--ledger-dark)/0.65)]"
      : "shadow-[0_0_9px_-1px_rgba(140,59,46,0.45)] hover:bg-stamp/20 hover:shadow-[0_0_14px_0_rgba(140,59,46,0.6)] dark:shadow-[0_0_9px_-1px_rgb(var(--stamp-dark)/0.5)] dark:hover:bg-stamp-dark/20 dark:hover:shadow-[0_0_14px_0_rgb(var(--stamp-dark)/0.65)]";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/35 dark:text-ink-dark/35">
        {label}
      </span>
      {items.map((item) => {
        const target = onPick ? findWord(item) : null;
        const linkable =
          target && target.word.toLowerCase() !== self.toLowerCase();
        const shape = `rounded-full px-2.5 py-0.5 font-sans text-xs ${fill}`;

        return linkable ? (
          <button
            key={item}
            type="button"
            onClick={() => onPick?.(target)}
            title={`Look up ${target.word}`}
            className={`${shape} ${dottedEdge} ${glow} transition duration-200`}
          >
            {item}
          </button>
        ) : (
          <span key={item} className={`${shape} ${edge}`}>
            {item}
          </span>
        );
      })}
    </div>
  );
}

/**
 * One accent hue per part of speech. `chip` colours the tag beside the word,
 * `bar` the rule down the left of the example sentence, so a card's grammar is
 * legible at a glance without another block of text.
 */
const POS_ACCENT: Record<string, { chip: string; bar: string; word: string }> =
  {
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

/**
 * Every step grows the picture but leaves the meaning a readable column.
 * The tightest case is the 640px breakpoint, where cards first go two-up and
 * are at their narrowest — so LG holds its phone size there and takes its
 * extra width only from `lg:` up, where the card has room to give.
 */
const THUMB_SIZE: Record<ImageSize, string> = {
  s: "h-14 w-14 sm:h-16 sm:w-16",
  md: "h-20 w-20 sm:h-24 sm:w-24",
  lg: "h-24 w-24 lg:h-32 lg:w-32",
};

export default function WordFace({
  entry,
  size = "lg",
  action,
  onPickWord,
}: {
  entry: VocabEntry;
  size?: ImageSize;
  /** Sits at the top right of the title row: the known stamp, or a close button. */
  action?: ReactNode;
  /** Given, synonym and antonym chips that are headwords become buttons. */
  onPickWord?: (entry: VocabEntry) => void;
}) {
  const confused = entry.commonly_confused_with ?? [];
  const pos = partsOfSpeech(entry.part_of_speech);
  const accent = POS_ACCENT[pos[0]] ?? POS_FALLBACK;
  const example = entry.example_sentence?.trim();
  const speech = useSpeech(entry.word);
  const hasDetail = entry.synonyms.length > 0 || entry.antonyms.length > 0;

  return (
    <>
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
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              {/* Two-up cards are narrowest just past 640px, where a long word
                  can outrun its column — hyphenate there rather than snapping a
                  letter onto its own line, and save the larger type for `lg:`. */}
              {/* The speaker rides with the word so it never wraps onto a line
                  of its own; its negative margin keeps the 28px tap target
                  from making the title row any taller. */}
              <div className="flex min-w-0 items-center gap-1">
                <h3 className="min-w-0 hyphens-auto break-words font-serif text-lg font-semibold leading-tight text-ink lg:text-xl dark:text-ink-dark">
                  {entry.word}
                </h3>
                {speech.supported && (
                  <button
                    type="button"
                    onClick={speech.speak}
                    aria-label={`Pronounce ${entry.word}`}
                    title="Pronounce"
                    className={`-my-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-ink/5 dark:hover:bg-ink-dark/5 ${
                      speech.speaking
                        ? accent.word
                        : "text-ink/35 hover:text-ink/70 dark:text-ink-dark/35 dark:hover:text-ink-dark/70"
                    }`}
                  >
                    <Speaker
                      className={`h-4 w-4 ${speech.speaking ? "animate-pulse" : ""}`}
                    />
                  </button>
                )}
              </div>
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
            {action}
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
                ),
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
            <ChipRow
              label="Syn"
              items={entry.synonyms}
              tone="ledger"
              self={entry.word}
              onPick={onPickWord}
            />
          )}
          {entry.antonyms.length > 0 && (
            <ChipRow
              label="Ant"
              items={entry.antonyms}
              tone="stamp"
              self={entry.word}
              onPick={onPickWord}
            />
          )}
        </div>
      )}
    </>
  );
}
