import { ALL_WORDS } from "@/lib/vocab";
import type { VocabEntry } from "@/lib/types";

export const QUESTION_COUNTS = [10, 20, 30] as const;
export type QuestionCount = (typeof QUESTION_COUNTS)[number];

/** Which of the word's two lists the question asks for. */
export type QuizKind = "synonyms" | "antonyms";

export interface QuizQuestion {
  /** `${set}-${number}` of the word being asked about. */
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  kind: QuizKind;
  /** Every choice on screen, already shuffled. */
  options: string[];
  /** The subset of `options` that counts as right. */
  correct: string[];
}

/** How many options each question shows, correct ones included. */
const OPTIONS_PER_QUESTION = 6;

/** A list has to be at least this long to be worth asking about. */
const MIN_POOL = 2;

/**
 * How many of the options are right. Two is the common case — one keeps the
 * multi-select honest (you cannot just tick a fixed number), three stretches it.
 */
const CORRECT_WEIGHTS = [1, 2, 2, 2, 3, 3];

function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Options are compared by this, so casing and stray spaces never decide a mark. */
export function normalize(term: string): string {
  return term.trim().toLowerCase();
}

function poolFor(entry: VocabEntry, kind: QuizKind): string[] {
  return kind === "synonyms" ? entry.synonyms : entry.antonyms;
}

function oppositePool(entry: VocabEntry, kind: QuizKind): string[] {
  return kind === "synonyms" ? entry.antonyms : entry.synonyms;
}

/** Every term the word itself claims — none of these can be a wrong answer. */
function ownTerms(entry: VocabEntry): Set<string> {
  const terms = new Set<string>([normalize(entry.word)]);
  for (const t of entry.synonyms) terms.add(normalize(t));
  for (const t of entry.antonyms) terms.add(normalize(t));
  for (const t of entry.commonly_confused_with ?? []) terms.add(normalize(t));
  return terms;
}

interface Candidate {
  term: string;
  /** The entry the term was borrowed from, so related words can be skipped. */
  source: VocabEntry;
}

/**
 * Every synonym and antonym in the deck, flattened once and reused for every
 * question. Building this per question would walk all 810 entries each time.
 */
let candidatePool: Candidate[] | null = null;

function getCandidatePool(): Candidate[] {
  if (candidatePool) return candidatePool;
  const seen = new Set<string>();
  const pool: Candidate[] = [];
  for (const entry of ALL_WORDS) {
    for (const term of [...entry.synonyms, ...entry.antonyms]) {
      const key = normalize(term);
      if (seen.has(key)) continue;
      seen.add(key);
      pool.push({ term, source: entry });
    }
  }
  candidatePool = pool;
  return pool;
}

/**
 * Two words that share a synonym sit in the same corner of the language, so a
 * term borrowed from one of them could well be a fair answer for the other.
 * Distractors have to be unambiguously wrong, so those sources are skipped.
 */
function isRelated(target: Set<string>, source: VocabEntry): boolean {
  for (const term of [...source.synonyms, ...source.antonyms]) {
    if (target.has(normalize(term))) return true;
  }
  return false;
}

function buildQuestion(entry: VocabEntry): QuizQuestion | null {
  const kinds: QuizKind[] = [];
  if (entry.synonyms.length >= MIN_POOL) kinds.push("synonyms");
  if (entry.antonyms.length >= MIN_POOL) kinds.push("antonyms");
  if (!kinds.length) return null;

  const kind = pick(kinds);
  const answers = poolFor(entry, kind);
  const wanted = Math.min(pick(CORRECT_WEIGHTS), answers.length);
  const correct = shuffle(answers).slice(0, wanted);

  const taken = new Set(correct.map(normalize));
  const forbidden = ownTerms(entry);
  const distractors: string[] = [];

  function add(term: string) {
    const key = normalize(term);
    if (taken.has(key)) return;
    taken.add(key);
    distractors.push(term);
  }

  // The word's own opposite list first: a plain antonym sitting among the
  // synonyms is the wrong answer a reader learns something from.
  const opposites = shuffle(oppositePool(entry, kind)).slice(0, 2);
  for (const term of opposites) add(term);

  const needed = OPTIONS_PER_QUESTION - correct.length;
  for (const candidate of shuffle(getCandidatePool())) {
    if (distractors.length >= needed) break;
    if (candidate.source === entry) continue;
    if (forbidden.has(normalize(candidate.term))) continue;
    if (isRelated(forbidden, candidate.source)) continue;
    add(candidate.term);
  }

  return {
    id: `${entry.set}-${entry.number}`,
    word: entry.word,
    meaning: entry.meaning,
    partOfSpeech: entry.part_of_speech,
    kind,
    options: shuffle([...correct, ...distractors.slice(0, needed)]),
    correct,
  };
}

/** A fresh random test. Returns fewer questions only if the deck runs out. */
export function buildQuiz(count: number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  for (const entry of shuffle(ALL_WORDS)) {
    if (questions.length >= count) break;
    const question = buildQuestion(entry);
    if (question) questions.push(question);
  }
  return questions;
}

/** Multi-select is all-or-nothing: every right answer, and nothing else. */
export function isCorrect(question: QuizQuestion, selected: string[]): boolean {
  if (selected.length !== question.correct.length) return false;
  const answer = new Set(question.correct.map(normalize));
  return selected.every((term) => answer.has(normalize(term)));
}

export function scoreQuiz(
  questions: QuizQuestion[],
  answers: Record<string, string[]>
): number {
  return questions.reduce(
    (total, question) =>
      total + (isCorrect(question, answers[question.id] ?? []) ? 1 : 0),
    0
  );
}
