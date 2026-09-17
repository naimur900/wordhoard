export interface VocabEntry {
  set: number;
  number: number;
  word: string;
  meaning: string;
  /** One or more parts of speech, separated by "; " (e.g. "verb; noun"). */
  part_of_speech: string;
  example_sentence: string;
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
