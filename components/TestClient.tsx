"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  QUESTION_COUNTS,
  buildQuiz,
  isCorrect,
  normalize,
  scoreQuiz,
  type QuestionCount,
  type QuizQuestion,
} from "@/lib/quiz";
import PageShell, { SHELL_WIDTH } from "@/components/PageShell";
import ConfirmModal, { type ConfirmRequest } from "@/components/ConfirmModal";
import ScoreModal from "@/components/ScoreModal";
import SiteFooter from "@/components/SiteFooter";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Cross,
  Quiz,
  Refresh,
} from "@/components/icons";

/** setup → the length picker, running → one question at a time, review → marked. */
type Phase = "setup" | "running" | "review";

const COUNT_HINTS: Record<QuestionCount, string> = {
  10: "A quick check",
  20: "A steady round",
  30: "The long haul",
};

/** Roughly six seconds a question, rounded to something a person would say. */
const COUNT_MINUTES: Record<QuestionCount, string> = {
  10: "~2 min",
  20: "~4 min",
  30: "~6 min",
};

const KIND_LABEL = {
  synonyms: {
    word: "synonyms",
    tone: "text-ledger dark:text-ledger-dark",
  },
  antonyms: {
    word: "antonyms",
    tone: "text-stamp dark:text-stamp-dark",
  },
} as const;

/** "verb; noun" → ["verb", "noun"] */
function partsOfSpeech(value: string) {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function Prompt({ question }: { question: QuizQuestion }) {
  const kind = KIND_LABEL[question.kind];
  return (
    <>
      <p className="font-sans text-sm text-ink/55 dark:text-ink-dark/55">
        Choose every <span className={`font-semibold ${kind.tone}`}>{kind.word.slice(0, -1)}</span> of
      </p>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h2 className="hyphens-auto break-words font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl dark:text-ink-dark">
          {question.word}
        </h2>
        {partsOfSpeech(question.partOfSpeech).map((part) => (
          <span
            key={part}
            className="rounded-full bg-ink/5 px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/55 ring-1 ring-inset ring-ink/15 dark:bg-ink-dark/5 dark:text-ink-dark/55 dark:ring-ink-dark/15"
          >
            {part}
          </span>
        ))}
      </div>
    </>
  );
}

/** A tick box that reads as checked without relying on colour alone. */
function Box({
  state,
}: {
  state: "on" | "off" | "right" | "wrong" | "missed";
}) {
  if (state === "off") {
    return (
      <span className="h-5 w-5 shrink-0 rounded-md border border-ink/25 dark:border-ink-dark/25" />
    );
  }
  if (state === "wrong") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-stamp text-paper dark:bg-stamp-dark dark:text-paper-dark">
        <Cross className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (state === "missed") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-dashed border-ledger/70 text-ledger dark:border-ledger-dark/70 dark:text-ledger-dark">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-paper dark:text-paper-dark ${
        state === "right"
          ? "bg-ledger dark:bg-ledger-dark"
          : "bg-stamp dark:bg-stamp-dark"
      }`}
    >
      <Check className="h-3.5 w-3.5" />
    </span>
  );
}

export default function TestClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [count, setCount] = useState<QuestionCount>(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [index, setIndex] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const router = useRouter();

  const start = useCallback((length: QuestionCount) => {
    setCount(length);
    setQuestions(buildQuiz(length));
    setAnswers({});
    setIndex(0);
    setShowScore(false);
    setPhase("running");
    window.scrollTo({ top: 0 });
  }, []);

  const question = questions[index];
  const answered = questions.filter((q) => (answers[q.id] ?? []).length > 0).length;
  const score = useMemo(() => scoreQuiz(questions, answers), [questions, answers]);
  const last = index === questions.length - 1;

  // A half-finished test only lives in this component's state, so warn before
  // the tab takes it away. Navigating inside the app is guarded separately.
  useEffect(() => {
    if (phase !== "running") return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [phase]);

  function toggle(option: string) {
    if (!question) return;
    setAnswers((current) => {
      const selected = current[question.id] ?? [];
      const key = normalize(option);
      const next = selected.some((term) => normalize(term) === key)
        ? selected.filter((term) => normalize(term) !== key)
        : [...selected, option];
      return { ...current, [question.id]: next };
    });
  }

  function go(to: number) {
    setIndex(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finish() {
    setPhase("review");
    setShowScore(true);
    window.scrollTo({ top: 0 });
  }

  function submit() {
    const blank = questions.length - answered;
    if (blank === 0) {
      finish();
      return;
    }
    setConfirm({
      title: blank === 1 ? "One question is blank" : `${blank} questions are blank`,
      body: "A blank answer is marked wrong. Go back and fill them in, or submit the test as it stands.",
      confirmLabel: "Submit anyway",
      cancelLabel: "Keep going",
      onConfirm: finish,
    });
  }

  // The modal cannot answer in time for a click handler, so the Link's own
  // navigation is always cancelled and `router.push` replays it on confirm.
  function leave(e: React.MouseEvent) {
    if (phase !== "running") return;
    e.preventDefault();
    setConfirm({
      title: "Leave the test?",
      body: `You are ${index + 1} of ${questions.length} questions in. Nothing is saved, so this test will be gone.`,
      confirmLabel: "Leave test",
      cancelLabel: "Stay",
      onConfirm: () => router.push("/"),
    });
  }

  const progress =
    phase === "setup"
      ? 0
      : phase === "review"
        ? 1
        : questions.length
          ? (index + 1) / questions.length
          : 0;

  return (
    <>
      <div className="veil sticky top-0 z-30 w-full">
        <span className="veil-layers" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>

        <div
          className={`relative flex items-center justify-between gap-3 ${SHELL_WIDTH} pb-8 pt-[max(0.85rem,env(safe-area-inset-top))]`}
        >
          <Link
            href="/"
            onClick={leave}
            className="inline-flex items-center gap-1 font-sans text-sm text-ink/70 hover:text-ink dark:text-ink-dark/70 dark:hover:text-ink-dark"
          >
            <ChevronLeft className="h-4 w-4" /> Back to sets
          </Link>

          {phase === "running" && (
            <span className="font-sans text-sm tabular-nums text-ink/55 dark:text-ink-dark/55">
              {index + 1} of {questions.length}
            </span>
          )}
          {phase === "review" && (
            <button
              type="button"
              onClick={() => setShowScore(true)}
              className="rounded-full border border-hairline bg-card/80 px-3.5 py-1.5 font-sans text-sm font-medium tabular-nums text-ink/80 transition-colors hover:border-ink/25 hover:text-ink dark:border-hairline-dark dark:bg-card-dark/80 dark:text-ink-dark/80 dark:hover:border-ink-dark/25 dark:hover:text-ink-dark"
            >
              {score}/{questions.length}
            </button>
          )}
        </div>
      </div>

      <PageShell padTop={false}>
        {phase !== "setup" && (
          <div className="-mt-3 h-1 w-full overflow-hidden rounded-full bg-hairline dark:bg-hairline-dark">
            <div
              className="h-full rounded-full bg-ledger transition-[width] duration-300 dark:bg-ledger-dark"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}

        {phase === "setup" && (
          <div className="-mt-2 rounded-2xl border border-hairline bg-card/70 p-5 sm:p-6 dark:border-hairline-dark dark:bg-card-dark/70">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stamp/10 text-stamp dark:bg-stamp-dark/10 dark:text-stamp-dark">
              <Quiz className="h-6 w-6" />
            </span>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-ink-dark">
              Take a test
            </h1>
            <p className="mt-1.5 max-w-prose font-sans text-sm leading-relaxed text-ink/60 dark:text-ink-dark/60">
              A word, no picture, and six choices. Tick every synonym — or every
              antonym — that fits. More than one can be right, and a question only
              counts if you find them all.
            </p>

            <h2 className="mt-6 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 dark:text-ink-dark/40">
              How many questions
            </h2>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5">
              {QUESTION_COUNTS.map((option) => {
                const selected = option === count;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCount(option)}
                    aria-pressed={selected}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-4 transition-colors ${
                      selected
                        ? "border-stamp/50 bg-stamp/10 dark:border-stamp-dark/50 dark:bg-stamp-dark/10"
                        : "border-hairline hover:border-ink/25 dark:border-hairline-dark dark:hover:border-ink-dark/25"
                    }`}
                  >
                    <span
                      className={`font-serif text-3xl font-semibold tabular-nums ${
                        selected
                          ? "text-stamp dark:text-stamp-dark"
                          : "text-ink/75 dark:text-ink-dark/75"
                      }`}
                    >
                      {option}
                    </span>
                    <span className="text-center font-sans text-[11px] leading-tight text-ink/50 dark:text-ink-dark/50">
                      {COUNT_HINTS[option]}
                    </span>
                    <span className="font-sans text-[10px] tabular-nums text-ink/35 dark:text-ink-dark/35">
                      {COUNT_MINUTES[option]}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => start(count)}
              className="mt-5 w-full rounded-xl bg-stamp px-4 py-3.5 font-sans text-sm font-semibold text-paper transition-colors hover:bg-stamp/90 dark:bg-stamp-dark dark:text-paper-dark dark:hover:bg-stamp-dark/90"
            >
              Start {count}-question test
            </button>
          </div>
        )}

        {phase === "running" && question && (
          <>
            <div
              // Keyed by question, so each one arrives with the card entrance
              // instead of the text swapping in place.
              key={question.id}
              className="card-in mt-4 rounded-2xl border border-hairline bg-card/80 p-4 sm:p-5 dark:border-hairline-dark dark:bg-card-dark/80"
            >
              <Prompt question={question} />

              <p className="mt-4 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/35 dark:text-ink-dark/35">
                Select all that apply
              </p>

              <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {question.options.map((option) => {
                  const selected = (answers[question.id] ?? []).some(
                    (term) => normalize(term) === normalize(option)
                  );
                  return (
                    <li key={option}>
                      <button
                        type="button"
                        onClick={() => toggle(option)}
                        aria-pressed={selected}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left font-sans text-sm transition-colors ${
                          selected
                            ? "border-stamp/50 bg-stamp/10 text-ink dark:border-stamp-dark/50 dark:bg-stamp-dark/10 dark:text-ink-dark"
                            : "border-hairline text-ink/75 hover:border-ink/25 dark:border-hairline-dark dark:text-ink-dark/75 dark:hover:border-ink-dark/25"
                        }`}
                      >
                        <Box state={selected ? "on" : "off"} />
                        <span className="min-w-0 break-words">{option}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => go(index - 1)}
                disabled={index === 0}
                className="inline-flex items-center gap-1 rounded-xl border border-hairline px-4 py-3 font-sans text-sm font-semibold text-ink/70 transition-colors hover:border-ink/25 hover:text-ink disabled:pointer-events-none disabled:opacity-35 dark:border-hairline-dark dark:text-ink-dark/70 dark:hover:border-ink-dark/25 dark:hover:text-ink-dark"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              {last ? (
                <button
                  type="button"
                  onClick={submit}
                  className="flex-1 rounded-xl bg-stamp px-4 py-3 font-sans text-sm font-semibold text-paper transition-colors hover:bg-stamp/90 dark:bg-stamp-dark dark:text-paper-dark dark:hover:bg-stamp-dark/90"
                >
                  Submit test
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-ink px-4 py-3 font-sans text-sm font-semibold text-paper transition-colors hover:bg-ink/90 dark:bg-ink-dark dark:text-paper-dark dark:hover:bg-ink-dark/90"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <p className="mt-3 text-center font-sans text-xs text-ink/40 dark:text-ink-dark/40">
              {answered} of {questions.length} answered
            </p>
          </>
        )}

        {phase === "review" && (
          <>
            <div className="mt-4 rounded-2xl border border-hairline bg-card/70 p-4 sm:p-5 dark:border-hairline-dark dark:bg-card-dark/70">
              <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl dark:text-ink-dark">
                You scored {score} of {questions.length}
              </h1>
              <p className="mt-1 font-sans text-sm text-ink/55 dark:text-ink-dark/55">
                Ticks are the right answers; a dashed tick is one you missed.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => start(count)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-stamp px-4 py-2.5 font-sans text-sm font-semibold text-paper transition-colors hover:bg-stamp/90 dark:bg-stamp-dark dark:text-paper-dark dark:hover:bg-stamp-dark/90"
                >
                  <Refresh className="h-4 w-4" /> Take another
                </button>
                <button
                  type="button"
                  onClick={() => setPhase("setup")}
                  className="rounded-xl border border-hairline px-4 py-2.5 font-sans text-sm font-semibold text-ink/70 transition-colors hover:border-ink/25 hover:text-ink dark:border-hairline-dark dark:text-ink-dark/70 dark:hover:border-ink-dark/25 dark:hover:text-ink-dark"
                >
                  Change length
                </button>
              </div>
            </div>

            <ol className="mt-4 space-y-3">
              {questions.map((q, i) => {
                const selected = answers[q.id] ?? [];
                const right = isCorrect(q, selected);
                const kind = KIND_LABEL[q.kind];
                return (
                  <li
                    key={q.id}
                    className={`rounded-2xl border bg-card/80 p-4 sm:p-5 dark:bg-card-dark/80 ${
                      right
                        ? "border-ledger/35 dark:border-ledger-dark/30"
                        : "border-stamp/35 dark:border-stamp-dark/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-sans text-xs tabular-nums text-ink/40 dark:text-ink-dark/40">
                          Question {i + 1}
                        </p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <h3 className="hyphens-auto break-words font-serif text-xl font-semibold text-ink dark:text-ink-dark">
                            {q.word}
                          </h3>
                          <span className={`font-sans text-xs font-semibold ${kind.tone}`}>
                            {kind.word}
                          </span>
                        </div>
                        <p className="mt-1 font-sans text-sm leading-relaxed text-ink/60 dark:text-ink-dark/60">
                          {q.meaning}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 ${
                          right
                            ? "text-ledger dark:text-ledger-dark"
                            : "text-stamp dark:text-stamp-dark"
                        }`}
                      >
                        {right ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <Cross className="h-6 w-6" />
                        )}
                      </span>
                    </div>

                    <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {q.options.map((option) => {
                        const key = normalize(option);
                        const wasPicked = selected.some(
                          (term) => normalize(term) === key
                        );
                        const isAnswer = q.correct.some(
                          (term) => normalize(term) === key
                        );
                        const state = isAnswer
                          ? wasPicked
                            ? "right"
                            : "missed"
                          : wasPicked
                            ? "wrong"
                            : "off";
                        return (
                          <li
                            key={option}
                            className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 font-sans text-sm ${
                              state === "right"
                                ? "border-ledger/40 bg-ledger/10 text-ink dark:border-ledger-dark/40 dark:bg-ledger-dark/10 dark:text-ink-dark"
                                : state === "missed"
                                  ? "border-dashed border-ledger/45 text-ink/75 dark:border-ledger-dark/45 dark:text-ink-dark/75"
                                  : state === "wrong"
                                    ? "border-stamp/40 bg-stamp/10 text-ink dark:border-stamp-dark/40 dark:bg-stamp-dark/10 dark:text-ink-dark"
                                    : "border-hairline text-ink/40 dark:border-hairline-dark dark:text-ink-dark/40"
                            }`}
                          >
                            <Box state={state} />
                            <span className="min-w-0 break-words">{option}</span>
                          </li>
                        );
                      })}
                    </ul>

                    {!right && selected.length === 0 && (
                      <p className="mt-2.5 font-sans text-xs text-ink/45 dark:text-ink-dark/45">
                        You left this one blank.
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>

            <SiteFooter />
          </>
        )}

        {phase === "setup" && <SiteFooter />}
      </PageShell>

      {confirm && (
        <ConfirmModal request={confirm} onClose={() => setConfirm(null)} />
      )}

      {showScore && (
        <ScoreModal
          score={score}
          total={questions.length}
          onReview={() => setShowScore(false)}
          onRetake={() => start(count)}
          onClose={() => setShowScore(false)}
        />
      )}
    </>
  );
}
