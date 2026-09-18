"use client";

import { useCallback, useEffect, useState } from "react";

export const VOICE_GENDERS = ["female", "male"] as const;
export type VoiceGender = (typeof VOICE_GENDERS)[number];

const STORAGE_KEY = "wordhoard:voice";
const CHANGE_EVENT = "wordhoard:voice-change";
const DEFAULT_GENDER: VoiceGender = "female";

/**
 * The Web Speech API exposes no gender, so it is inferred from the voice name.
 * These cover the stock voices on macOS/iOS, Windows, Android/Chrome and the
 * espeak-ng variants Linux browsers get through speech-dispatcher.
 */
const NAMES: Record<VoiceGender, string[]> = {
  female: [
    "samantha", "victoria", "karen", "moira", "tessa", "fiona", "veena", "kate",
    "serena", "allison", "ava", "susan", "zoe", "nicky", "zira", "aria", "jenny",
    "hazel", "libby", "sonia", "emma", "michelle", "catherine", "natasha", "clara",
    "heera", "hortense", "flo", "sandy", "shelley", "kathy",
    // espeak-ng variants (Linux)
    "alicia", "andrea", "annie", "anika", "auntie", "belinda", "grandma", "linda",
    "steph",
    "google us english",
  ],
  male: [
    "alex", "tom", "oliver", "arthur", "aaron", "rishi", "gordon",
    "lee", "david", "mark", "guy", "george", "ryan", "james", "eric", "christopher",
    "william", "liam", "roger", "eddy", "rocko", "grandpa", "junior", "ralph",
    // Named so the voice list can label them, but kept out of the automatic
    // choice (see AVOID).
    "fred", "daniel",
    // espeak-ng variants (Linux)
    "adam", "andy", "benjamin", "caleb", "denis", "ed", "edward", "gene", "ian",
    "john", "marco", "max", "michael", "mike", "paul", "quincy", "reed", "rob",
    "robert", "travis", "victor", "zac",
  ],
};

function genderOf(voice: SpeechSynthesisVoice): VoiceGender | null {
  const name = voice.name.toLowerCase();
  // "female" contains "male", so it has to be checked first. The digits and
  // underscore catch espeak-ng's numbered variants ("female3", "male_whisper").
  if (/\bfemale(\d|_|\b)/.test(name)) return "female";
  if (/\bmale(\d|_|\b)/.test(name)) return "male";
  for (const gender of VOICE_GENDERS) {
    if (NAMES[gender].some((n) => new RegExp(`\\b${n}\\b`).test(name))) return gender;
  }
  return null;
}

/**
 * What the user picked: an automatic choice by gender (the best voice of that
 * gender on whatever device this is), or one exact voice by its `voiceURI`.
 * Plain "female"/"male" is also what earlier versions saved.
 */
export type VoicePref = VoiceGender | `voice:${string}`;

export function readVoicePref(): VoicePref {
  if (typeof window === "undefined") return DEFAULT_GENDER;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && (VOICE_GENDERS.includes(raw as VoiceGender) || raw.startsWith("voice:"))) {
      return raw as VoicePref;
    }
  } catch {}
  return DEFAULT_GENDER;
}

/**
 * The best voice of each gender on each platform, most natural first. Matched
 * against the voice name, so one list covers every browser: whichever the
 * device has comes first wins.
 *
 *   Edge (any OS)       Microsoft "… Online (Natural)" neural voices
 *   Chrome desktop      Google's cloud voices (need a connection)
 *   macOS / iOS         Apple's built-in voices
 *   Windows             Microsoft's built-in (SAPI) voices
 *   Linux               espeak-ng variants via speech-dispatcher
 */
const PREFERRED: Record<VoiceGender, string[]> = {
  female: [
    "microsoft aria online", "microsoft jenny online", "microsoft ava online",
    "microsoft emma online", "microsoft michelle online",
    "google us english",
    "samantha", "ava", "allison", "susan",
    "microsoft zira",
    "google uk english female",
    "karen", "moira", "tessa", "serena", "kate", "fiona", "victoria",
    "microsoft hazel",
    "annie", "female2", "female3", "steph",
  ],
  male: [
    "microsoft guy online", "microsoft andrew online", "microsoft christopher online",
    "microsoft eric online", "microsoft brian online",
    // Fred (muddy) and Daniel (heavy) are left out on purpose, although
    // both ship with every Mac. Alex, Aaron and Tom are optional downloads;
    // without them Safari lands on Rishi, then Apple's clear US voices
    // Eddy and Reed.
    "alex", "aaron", "tom",
    "microsoft david", "microsoft mark",
    "google uk english male",
    "oliver", "arthur", "gordon", "rishi", "eddy", "reed",
    "microsoft george",
    "michael", "male2", "male3", "david",
  ],
};

/** Muddy or heavy-sounding; still listed, but never chosen automatically. */
const AVOID = ["fred", "daniel"];

const matches = (voice: SpeechSynthesisVoice, name: string) =>
  new RegExp(`\\b${name}\\b`).test(voice.name.toLowerCase());

/**
 * Voices load asynchronously in most browsers, so this is resolved on each
 * call rather than once at import. Walks the preferred list first; failing
 * that, any English voice whose name marks it as the right gender, US first.
 * `null` means the device has none (Android names voices by locale only), and
 * the caller shifts the default voice's pitch instead.
 */
export function pickVoice(gender: VoiceGender): SpeechSynthesisVoice | null {
  const english = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("en"));

  for (const name of PREFERRED[gender]) {
    const found = english.filter((v) => matches(v, name));
    if (found.length) return found.find((v) => v.lang === "en-US") ?? found[0];
  }

  const ofGender = english.filter(
    (v) => genderOf(v) === gender && !AVOID.some((n) => matches(v, n))
  );
  return (
    ofGender.find((v) => v.lang === "en-US" && v.localService) ??
    ofGender.find((v) => v.lang === "en-US") ??
    ofGender[0] ??
    null
  );
}

/** Says `text` in the saved voice, cutting off anything already being said. */
export function speak(
  text: string,
  handlers: { onStart?: () => void; onEnd?: () => void } = {}
) {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const pref = readVoicePref();
  // A voice picked on another device, or one since uninstalled, falls back
  // to the automatic choice of the same gender (female if unknown).
  const chosen = pref.startsWith("voice:")
    ? window.speechSynthesis.getVoices().find((v) => `voice:${v.voiceURI}` === pref)
    : undefined;
  const gender: VoiceGender = pref === "male" ? "male" : "female";
  const voice = chosen ?? pickVoice(gender);
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "en-US";
    // Most unnamed defaults (Android's included) are female, so the
    // female nudge is slight and the male one does the heavy lifting.
    utterance.pitch = gender === "female" ? 1.1 : 0.7;
  }
  utterance.rate = 0.9;
  utterance.onstart = () => handlers.onStart?.();
  utterance.onend = () => handlers.onEnd?.();
  utterance.onerror = () => handlers.onEnd?.();
  synth.speak(utterance);
}

/** The saved voice preference, kept in step across components and tabs. */
export function useVoicePref() {
  const [pref, setPrefState] = useState<VoicePref>(DEFAULT_GENDER);

  useEffect(() => {
    setPrefState(readVoicePref());
    const sync = () => setPrefState(readVoicePref());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setPref = useCallback((next: VoicePref) => {
    setPrefState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage may be unavailable (private mode / quota) — fail quietly
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { pref, setPref };
}

/** macOS/iOS novelty voices (sound effects and songs, not speech). */
const NOVELTY = new Set([
  "albert", "bad news", "bahh", "bells", "boing", "bubbles", "cellos",
  "good news", "jester", "organ", "superstar", "trinoids", "whisper", "wobble",
  "zarvox", "deranged", "hysterical", "pipe organ", "princess",
]);

export type VoiceOption = {
  /** Stored as the preference when this voice is picked. */
  id: `voice:${string}`;
  name: string;
  /** Accent, e.g. "United States"; voices are grouped under it. */
  region: string;
  gender: VoiceGender | null;
  /** Cloud voices (Google, Edge "Natural") need a connection to speak. */
  online: boolean;
};

const REGION_ORDER = ["US", "GB", "AU", "CA", "IE", "IN", "NZ", "ZA"];

/**
 * Every English voice worth offering on this device, grouped by accent in a
 * sensible order (US, UK, … then the rest alphabetically). Linux's espeak-ng
 * pairs each accent with ~100 variants, so there only the US and British
 * accents with the recommended variants are kept.
 */
export function listVoices(): VoiceOption[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const regionName = new Intl.DisplayNames(["en"], { type: "region" });
  const espeakKeep = new Set(
    [...PREFERRED.female, ...PREFERRED.male].filter((n) => !n.includes(" "))
  );

  const options = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("en"))
    .filter((v) => !NOVELTY.has(v.name.toLowerCase().replace(/\s*\(.*\)$/, "")))
    .filter((v) => {
      const [base, variant] = v.name.split("+");
      if (variant === undefined) return true;
      return /\((America|Great[ _]Britain)\)/.test(base) && espeakKeep.has(variant.toLowerCase());
    })
    .map((v): VoiceOption & { code: string } => {
      const code = v.lang.replace("_", "-").split("-")[1]?.toUpperCase() ?? "";
      let region = "English";
      try {
        region = (code && regionName.of(code)) || "English";
      } catch {}
      return {
        id: `voice:${v.voiceURI}`,
        // The accent is already the group heading, so drop it from the name:
        // "Eddy (English (US))" → "Eddy", "English (America)+Annie" → "Annie".
        name: v.name.includes("+")
          ? v.name.split("+")[1]
          : v.name.replace(/\s*\(English \(.*\)\)$/, ""),
        region,
        gender: genderOf(v),
        online: !v.localService,
        code,
      };
    });

  const rank = (code: string) => {
    const i = REGION_ORDER.indexOf(code);
    return i === -1 ? REGION_ORDER.length : i;
  };
  return options
    .sort(
      (a, b) =>
        rank(a.code) - rank(b.code) ||
        a.region.localeCompare(b.region) ||
        a.name.localeCompare(b.name)
    )
    .map(({ code: _code, ...option }) => option);
}

/** Speaks a word with the browser's built-in speech synthesis. */
export function useSpeech(text: string) {
  // Unknown until mount, so the server render and first client render agree.
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setSupported(true);
    // Some browsers (Chrome) only populate getVoices() after this fires.
    window.speechSynthesis.getVoices();
  }, []);

  const say = useCallback(() => {
    speak(text, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    });
  }, [text]);

  return { supported, speaking, speak: say };
}
