export interface VocabEntry {
  set: number;
  number: number;
  word: string;
  meaning: string;
  image: string | null;
  commonly_confused_with: string[] | null;
  synonyms: string[];
  antonyms: string[];
}

export interface SetSummary {
  id: number;
  count: number;
  words: VocabEntry[];
  sample: string[];
}
