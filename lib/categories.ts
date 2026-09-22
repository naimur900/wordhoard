import { ALL_WORDS } from "@/lib/vocab";
import type { CategorySummary, VocabEntry } from "@/lib/types";

export interface Category {
  /** Used in the URL and in each entry's `categories` array. */
  slug: string;
  /** One word of at most 7 letters, for the switcher button on phones. */
  short: string;
  name: string;
  blurb: string;
}

/**
 * Where a word gets used. The first ten are subject areas, the rest describe
 * what the word is about; an entry can sit in several.
 */
export const CATEGORIES: Category[] = [
  { slug: "law", short: "Law", name: "Law, Crime & Justice", blurb: "Courts, wrongdoing, blame and rules." },
  { slug: "politics", short: "Power", name: "Politics, Power & Society", blurb: "Authority, rebellion and who holds the reins." },
  { slug: "money", short: "Money", name: "Money & Economics", blurb: "Spending, saving, greed and generosity." },
  { slug: "education", short: "Study", name: "Education & Intellect", blurb: "Learning, knowledge and the life of the mind." },
  { slug: "health", short: "Health", name: "Health, Body & Medicine", blurb: "Sickness, cures, energy and sleep." },
  { slug: "religion", short: "Faith", name: "Religion & Spirituality", blurb: "Faith, worship, devotion and doctrine." },
  { slug: "arts", short: "Arts", name: "Arts, Style & Aesthetics", blurb: "Taste, style, originality and performance." },
  { slug: "nature", short: "Nature", name: "Nature & Environment", blurb: "Land, weather, growth and sound." },
  { slug: "conflict", short: "War", name: "Conflict & War", blurb: "Aggression, courage, attack and defence." },
  { slug: "work", short: "Work", name: "Work & Effort", blurb: "Diligence, skill, laziness and toil." },
  { slug: "personality", short: "Traits", name: "Personality & Temperament", blurb: "The kind of person someone is." },
  { slug: "emotions", short: "Moods", name: "Emotions & Moods", blurb: "Joy, gloom, anger and worry." },
  { slug: "social", short: "Social", name: "Social Behaviour & Manners", blurb: "How people treat one another." },
  { slug: "morality", short: "Ethics", name: "Morality & Honesty", blurb: "Virtue, deceit, integrity and corruption." },
  { slug: "speech", short: "Speech", name: "Speech & Communication", blurb: "How much, and how well, people talk." },
  { slug: "argument", short: "Logic", name: "Argument & Reasoning", blurb: "Claims, evidence, logic and debate." },
  { slug: "criticism-praise", short: "Judging", name: "Criticism & Praise", blurb: "Scolding, mocking, honouring and acclaim." },
  { slug: "time", short: "Time", name: "Time & Change", blurb: "Duration, timing, beginnings and endings." },
  { slug: "quantity", short: "Amount", name: "Quantity & Degree", blurb: "Plenty, scarcity, growth and decline." },
  { slug: "clarity", short: "Clarity", name: "Clarity & Truth", blurb: "Plain or hidden, genuine or fake." },
  { slug: "helping-hindering", short: "Helping", name: "Helping & Hindering", blurb: "Easing, worsening, blocking and boosting." },
  { slug: "similarity", short: "Alike", name: "Similarity & Difference", blurb: "Alike, unlike, mixed and matched." },
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
