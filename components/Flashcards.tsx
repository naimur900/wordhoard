"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { VocabEntry } from "@/lib/types";
import { splitAroundWord, wordId } from "@/lib/vocab";
import { useSpeech } from "@/lib/useSpeech";
import { LAST_BOX, daysFor, useReview, type Rating } from "@/lib/useReview";
import WordImage from "@/components/WordImage";
import {
  Cards,
  ChevronLeft,
  ChevronRight,
  Close,
  Shuffle,
  Speaker,
  Stamp,
} from "@/components/icons";

/** How far a drag must go before it counts as turning the card over. */
const SWIPE_SLOP = 8;

/** Cards drawn behind the top one. Deeper than this and nothing shows. */
const STACK_DEPTH = 3;

/**
 * The resting tilt of a card waiting in the stack, in degrees. Taken from the
 * word so a card keeps the same angle every time it is drawn, rather than
 * jumping to a new one on each render.
 */
function tilt(word: string) {
  let hash = 0;
  for (const ch of word) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return ((hash % 11) - 5) * 0.8;
}

const RATINGS: { value: Rating; label: string; tone: string }[] = [
  {
    value: "again",
    label: "Again",
    tone: "text-stamp hover:bg-stamp/10 dark:text-stamp-dark dark:hover:bg-stamp-dark/10",
  },
  {
    value: "hard",
    label: "Hard",
    tone: "text-caution hover:bg-caution/10 dark:text-caution-dark dark:hover:bg-caution-dark/10",
  },
  {
    value: "good",
    label: "Good",
    tone: "text-ledger hover:bg-ledger/10 dark:text-ledger-dark dark:hover:bg-ledger-dark/10",
  },
];

function shuffled(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** "in 3 days", as the rating buttons label themselves. */
function whenLabel(days: number) {
  if (days === 0) return "now";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function Face({ entry, back }: { entry: VocabEntry; back: boolean }) {
  const speech = useSpeech(entry.word);
  const example = entry.example_sentence?.trim();

  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-y-auto overscroll-contain rounded-2xl border border-hairline bg-card p-5 [backface-visibility:hidden] dark:border-hairline-dark dark:bg-card-dark ${
        back ? "[transform:rotateY(180deg)]" : ""
      }`}
    >
      {back ? (
        <>
          <p className="font-serif text-xl font-semibold text-ink dark:text-ink-dark">
            {entry.word}
          </p>
          <p className="mt-2 font-sans text-base leading-relaxed text-ink/80 dark:text-ink-dark/80">
            {entry.meaning.split(" ").map((part, i) => (
              <span
                key={i}
                className="word-in inline-block"
                style={{ animationDelay: `${Math.min(i, 14) * 24}ms` }}
              >
                {part}&nbsp;
              </span>
            ))}
          </p>
          {example && (
            <p className="mt-3 border-l-2 border-hairline pl-3 font-serif text-sm italic leading-snug text-ink/60 dark:border-hairline-dark dark:text-ink-dark/60">
              {splitAroundWord(example, entry.word).map((part, i) =>
                part.isWord ? (
                  <strong key={i} className="font-semibold not-italic text-ink/80 dark:text-ink-dark/80">
                    {part.text}
                  </strong>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </p>
          )}
          {entry.synonyms.length > 0 && (
            <p className="mt-3 font-sans text-sm text-ink/60 dark:text-ink-dark/60">
              <span className="font-semibold uppercase tracking-[0.12em] text-[10px] text-ledger dark:text-ledger-dark">
                Like
              </span>{" "}
              {entry.synonyms.join(", ")}
            </p>
          )}
          {entry.antonyms.length > 0 && (
            <p className="mt-1 font-sans text-sm text-ink/60 dark:text-ink-dark/60">
              <span className="font-semibold uppercase tracking-[0.12em] text-[10px] text-stamp dark:text-stamp-dark">
                Unlike
              </span>{" "}
              {entry.antonyms.join(", ")}
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <WordImage
            entry={entry}
            variant="card"
            className="h-32 w-32 rounded-2xl ring-1 ring-hairline sm:h-40 sm:w-40 dark:ring-hairline-dark"
          />
          <div className="flex items-center gap-1">
            <h2 className="hyphens-auto break-words font-serif text-3xl font-semibold text-ink dark:text-ink-dark">
              {entry.word}
            </h2>
            {speech.supported && (
              <button
                type="button"
                // The card turns on click; this button must not turn it.
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  speech.speak();
                }}
                aria-label={`Pronounce ${entry.word}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink/35 hover:bg-ink/5 hover:text-ink/70 dark:text-ink-dark/35 dark:hover:bg-ink-dark/5 dark:hover:text-ink-dark/70"
              >
                <Speaker className={`h-5 w-5 ${speech.speaking ? "animate-pulse" : ""}`} />
              </button>
            )}
          </div>
          <p className="font-sans text-xs uppercase tracking-[0.14em] text-ink/35 dark:text-ink-dark/35">
            {entry.part_of_speech}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Flashcard mode: the set as a swipeable carousel of cards you turn over and
 * then rate. The rating files the word in the review schedule (see
 * `useReview`), and a word that reaches the last box is marked known, so the
 * set's progress bar keeps counting the same thing it always did.
 */
export default function Flashcards({
  title,
  words,
  isKnown,
  onLearned,
  onClose,
}: {
  title: string;
  words: VocabEntry[];
  isKnown: (id: string) => boolean;
  /** Called when a word graduates, so the page can mark it known. */
  onLearned: (id: string) => void;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<number[]>(() => words.map((_, i) => i));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [rated, setRated] = useState<Record<string, Rating>>({});
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const gesture = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const { rate, stateFor } = useReview();

  const last = order.length - 1;
  const entry = words[order[index]];
  const still = typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const go = useCallback(
    (to: number) => setIndex((i) => Math.min(Math.max(to, 0), last)),
    [last]
  );

  const flip = useCallback(
    () => setFlipped((f) => ({ ...f, [index]: !f[index] })),
    [index]
  );

  const answer = useCallback(
    (rating: Rating) => {
      const id = wordId(entry);
      const next = rate(id, rating);
      setRated((r) => ({ ...r, [id]: rating }));
      if (next.box === LAST_BOX && !isKnown(id)) onLearned(id);
      if (index === last) setDone(true);
      else go(index + 1);
    },
    [entry, rate, isKnown, onLearned, index, last, go]
  );

  // Escape closes; the rest is the same deck handled from a keyboard.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") return onClose();
      if (done) return;
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
      } else if (e.key >= "1" && e.key <= "3") {
        answer(RATINGS[Number(e.key) - 1].value);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, go, flip, answer, index, done]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = { x: e.clientX, y: e.clientY, moved: false };
    // Without capture a mouse drag stops the moment the pointer leaves the
    // card, which is why dragging never worked with a mouse.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    if (!g.moved && Math.abs(dx) < SWIPE_SLOP) return;
    // A first move that is mostly vertical is a scroll of the card's own text.
    if (!g.moved && Math.abs(dx) <= Math.abs(e.clientY - g.y)) {
      gesture.current = null;
      setDragging(false);
      return;
    }
    g.moved = true;
    // The ends give, so it is obvious the deck has run out rather than stuck.
    const resisted = (index === 0 && dx > 0) || (index === last && dx < 0);
    setDrag(resisted ? dx * 0.35 : dx);
  }

  function onPointerUp() {
    const g = gesture.current;
    gesture.current = null;
    setDragging(false);
    if (!g) return;
    if (!g.moved) {
      flip();
    } else {
      const width = viewportRef.current?.clientWidth ?? 320;
      const threshold = Math.min(90, width * 0.22);
      if (drag < -threshold) go(index + 1);
      else if (drag > threshold) go(index - 1);
    }
    setDrag(0);
  }

  const counts = RATINGS.map((r) => ({
    ...r,
    n: Object.values(rated).filter((v) => v === r.value).length,
  }));

  return createPortal(
    <div className="overlay-in fixed inset-0 z-50 flex flex-col bg-ink/25 backdrop-blur-md dark:bg-black/50">
      <div className="flex items-center gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close flashcards"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-card hover:text-ink dark:text-ink-dark/50 dark:hover:bg-card-dark dark:hover:text-ink-dark"
        >
          <Close className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate font-sans text-sm font-semibold text-ink dark:text-ink-dark">
            {title}
          </p>
          <p className="font-sans text-xs tabular-nums text-ink/45 dark:text-ink-dark/45">
            {done ? `${order.length} of ${order.length}` : `${index + 1} of ${order.length}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOrder(shuffled(words.length));
            setIndex(0);
            setFlipped({});
            setDone(false);
          }}
          aria-label="Shuffle the deck"
          title="Shuffle"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-card hover:text-ink dark:text-ink-dark/50 dark:hover:bg-card-dark dark:hover:text-ink-dark"
        >
          <Shuffle className="h-5 w-5" />
        </button>
      </div>

      <div className="h-1 w-full overflow-hidden bg-hairline dark:bg-hairline-dark">
        <div
          className="h-full bg-ledger transition-[width] duration-300 dark:bg-ledger-dark"
          style={{ width: `${((done ? order.length : index) / order.length) * 100}%` }}
        />
      </div>

      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <Cards className="h-10 w-10 text-ledger dark:text-ledger-dark" />
          <div>
            <p className="font-serif text-2xl font-semibold text-ink dark:text-ink-dark">
              Deck finished
            </p>
            <p className="mt-1 font-sans text-sm text-ink/55 dark:text-ink-dark/55">
              {counts.map((c) => `${c.n} ${c.label.toLowerCase()}`).join(" · ")}
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIndex(0);
                setFlipped({});
                setDone(false);
              }}
              className="rounded-xl border border-hairline px-4 py-2.5 font-sans text-sm font-semibold text-ink/80 hover:border-ink/25 dark:border-hairline-dark dark:text-ink-dark/80 dark:hover:border-ink-dark/25"
            >
              Go again
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-stamp px-4 py-2.5 font-sans text-sm font-semibold text-paper dark:bg-stamp-dark dark:text-paper-dark"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={viewportRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDragStart={(e) => e.preventDefault()}
            className="relative flex flex-1 touch-pan-y items-center overflow-hidden px-4 py-3 [perspective:1600px] sm:px-5"
          >
            <div className="relative mx-auto h-full max-h-[24rem] w-full max-w-[17rem] sm:max-w-sm">
            {/* A dealt stack: the word you are on sits square on top, the ones
                waiting lean behind it, and the one you just did is thrown off
                to the left — so the deck's depth is visible at a glance. */}
            <div className="relative h-full w-full [transform-style:preserve-3d]">
              {order.map((wordIndex, i) => {
                const card = words[wordIndex];
                const depth = i - index;
                if (depth < -1 || depth > STACK_DEPTH) return null;

                const angle = tilt(card.word);
                let transform: string;
                let opacity = 1;

                if (depth === 0) {
                  // The top card follows the finger and tips as it goes.
                  // Solid all the way: fading it under the drag lets the card
                  // behind show through its face.
                  transform = `translate3d(${drag}px, 0, 0) rotate(${drag / 26}deg)`;
                } else if (depth < 0) {
                  // Thrown off to the left, and dragged back into play from there.
                  transform = `translate3d(calc(-115% + ${Math.max(drag, 0)}px), 0, 60px) rotate(${-angle - 8}deg) scale(0.92)`;
                  opacity = drag > 0 ? Math.min(1, drag / 140) : 0;
                } else {
                  // Each waiting card sits a little lower and smaller, so the
                  // depth of the deck shows under the card you are reading.
                  transform = `translate3d(0, ${depth * 16}px, ${depth * -60}px) rotate(${angle}deg) scale(${1 - depth * 0.06})`;
                  opacity = depth > STACK_DEPTH - 1 ? 0 : 0.75;
                }

                return (
                  <div
                    key={wordId(card)}
                    className="absolute inset-0 origin-bottom"
                    style={{
                      transform,
                      opacity,
                      zIndex: STACK_DEPTH + 2 - Math.abs(depth),
                      // Only the top card takes the pointer, so a tap never
                      // turns over a card leaning behind it.
                      pointerEvents: depth === 0 ? "auto" : "none",
                      transition:
                        dragging || still
                          ? "none"
                          : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease-out",
                    }}
                  >
                    <div
                      className="relative h-full w-full cursor-pointer select-none [transform-style:preserve-3d]"
                      style={{
                        transform: flipped[i] ? "rotateY(180deg)" : "none",
                        transition: still
                          ? "none"
                          : "transform 460ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                      role="button"
                      tabIndex={-1}
                      aria-label={`${card.word}, tap to turn over`}
                    >
                      <Face entry={card} back={false} />
                      <Face entry={card} back />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Either side of the card, so the deck can be walked without a
                swipe. They sit above the deck, and must not start a drag. */}
            {[
              { dir: -1, at: "-left-10 sm:-left-12", Icon: ChevronLeft, label: "Previous card" },
              { dir: 1, at: "-right-10 sm:-right-12", Icon: ChevronRight, label: "Next card" },
            ].map(({ dir, at, Icon, label }) => (
              <button
                key={label}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => go(index + dir)}
                disabled={dir < 0 ? index === 0 : index === last}
                aria-label={label}
                className={`absolute top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink/45 transition-colors hover:bg-card hover:text-ink disabled:pointer-events-none disabled:opacity-0 dark:text-ink-dark/45 dark:hover:bg-card-dark dark:hover:text-ink-dark ${at}`}
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
            </div>
          </div>

          <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            <div className="mx-auto flex max-w-xs items-center gap-1 rounded-full border border-hairline bg-card p-1 shadow-lg shadow-black/10 dark:border-hairline-dark dark:bg-card-dark">
              {RATINGS.map((r, i) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => answer(r.value)}
                  className={`flex flex-1 flex-col items-center rounded-full py-2 transition-colors ${r.tone}`}
                >
                  <span className="font-sans text-[13px] font-semibold leading-none">
                    {r.label}
                  </span>
                  <span className="mt-1 font-sans text-[10px] leading-none text-ink/35 dark:text-ink-dark/35">
                    {whenLabel(daysFor(stateFor(wordId(entry)), r.value))}
                  </span>
                  <span className="sr-only">Press {i + 1}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-center font-sans text-[11px] text-ink/35 dark:text-ink-dark/35">
              {isKnown(wordId(entry)) ? (
                <span className="inline-flex items-center gap-1 text-ledger dark:text-ledger-dark">
                  <Stamp className="h-3.5 w-3.5" /> known
                </span>
              ) : (
                "Tap the card to turn it over"
              )}
            </p>
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
