"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Voices load asynchronously in most browsers, so this is resolved lazily on
 * each call rather than once at import. Prefers a local US English voice
 * (works offline), then any English voice, then the browser default.
 */
function englishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  return (
    english.find((v) => v.lang === "en-US" && v.localService) ??
    english.find((v) => v.lang === "en-US") ??
    english[0]
  );
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

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    // Cut off whatever another card was saying rather than queueing behind it.
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = englishVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "en-US";
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
  }, [text]);

  return { supported, speaking, speak };
}
