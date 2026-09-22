import { ALL_WORDS } from "@/lib/vocab";
import type { CategorySummary, VocabEntry } from "@/lib/types";

export interface Category {
  /** Used in the URL and in each entry's `categories` array. */
  slug: string;
  name: string;
  blurb: string;
}

/**
 * Where a word gets used. The first ten are subject areas, the rest describe
 * what the word is about; an entry can sit in several.
 */
export const CATEGORIES: Category[] = [
  { slug: "law", name: "Law, Crime & Justice", blurb: "Courts, wrongdoing, blame and rules." },
  { slug: "politics", name: "Politics, Power & Society", blurb: "Authority, rebellion and who holds the reins." },
  { slug: "money", name: "Money & Economics", blurb: "Spending, saving, greed and generosity." },
  { slug: "education", name: "Education & Intellect", blurb: "Learning, knowledge and the life of the mind." },
  { slug: "health", name: "Health, Body & Medicine", blurb: "Sickness, cures, energy and sleep." },
  { slug: "religion", name: "Religion & Spirituality", blurb: "Faith, worship, devotion and doctrine." },
  { slug: "arts", name: "Arts, Style & Aesthetics", blurb: "Taste, style, originality and performance." },
  { slug: "nature", name: "Nature & Environment", blurb: "Land, weather, growth and sound." },
  { slug: "conflict", name: "Conflict & War", blurb: "Aggression, courage, attack and defence." },
  { slug: "work", name: "Work & Effort", blurb: "Diligence, skill, laziness and toil." },
  { slug: "personality", name: "Personality & Temperament", blurb: "The kind of person someone is." },
  { slug: "emotions", name: "Emotions & Moods", blurb: "Joy, gloom, anger and worry." },
  { slug: "social", name: "Social Behaviour & Manners", blurb: "How people treat one another." },
  { slug: "morality", name: "Morality & Honesty", blurb: "Virtue, deceit, integrity and corruption." },
  { slug: "speech", name: "Speech & Communication", blurb: "How much, and how well, people talk." },
  { slug: "argument", name: "Argument & Reasoning", blurb: "Claims, evidence, logic and debate." },
  { slug: "criticism-praise", name: "Criticism & Praise", blurb: "Scolding, mocking, honouring and acclaim." },
  { slug: "time", name: "Time & Change", blurb: "Duration, timing, beginnings and endings." },
  { slug: "quantity", name: "Quantity & Degree", blurb: "Plenty, scarcity, growth and decline." },
  { slug: "clarity", name: "Clarity & Truth", blurb: "Plain or hidden, genuine or fake." },
  { slug: "helping-hindering", name: "Helping & Hindering", blurb: "Easing, worsening, blocking and boosting." },
  { slug: "similarity", name: "Similarity & Difference", blurb: "Alike, unlike, mixed and matched." },
];

export function getCategory(slug: string): Category | null {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

/**
 * A category's words, alphabetically. "cumbersome" sits in two sets; like
 * `findWord`, the first entry stands for both so it is not listed twice.
 */
export function getCategoryWords(slug: string): VocabEntry[] {
  const seen = new Set<string>();
  return ALL_WORDS.filter((w) => {
    if (!w.categories.includes(slug) || seen.has(w.word)) return false;
    seen.add(w.word);
    return true;
  }).sort((a, b) => a.word.localeCompare(b.word));
}

export function getCategorySummaries(): CategorySummary[] {
  return CATEGORIES.map((category) => {
    const words = getCategoryWords(category.slug);
    return {
      ...category,
      count: words.length,
      words,
      sample: words.slice(0, 3).map((w) => w.word),
    };
  });
}
