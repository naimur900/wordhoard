"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  VOICE_GENDERS,
  listVoices,
  pickVoice,
  speak,
  useVoicePref,
  type VoiceGender,
  type VoiceOption,
  type VoicePref,
} from "@/lib/useSpeech";
import { useScrollFade } from "@/lib/useScrollFade";
import { ChevronDown, Speaker, Stamp } from "@/components/icons";

const GENDER_LABELS: Record<VoiceGender, string> = {
  female: "Female",
  male: "Male",
};

type Row = { id: VoicePref; title: string; detail: string };
type Group = { label: string; rows: Row[] };

function describe(option: VoiceOption) {
  return [
    option.gender && GENDER_LABELS[option.gender],
    option.online && "Online",
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Pronunciation voice switcher, built like the set switcher in SetNav. The
 * two "Automatic" rows pick the best voice of that gender on whatever device
 * this is; below them, every English voice this device has, by accent.
 */
export default function VoicePicker() {
  const { pref, setPref } = useVoicePref();
  // Voices arrive asynchronously (Chrome fills them in after first ask), so
  // they are read on mount and again on every `voiceschanged`.
  const [voices, setVoices] = useState<VoiceOption[] | null>(null);
  const [auto, setAuto] = useState<Record<VoiceGender, string | null>>({
    female: null,
    male: null,
  });
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const fade = useScrollFade(listRef, open);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const update = () => {
      setVoices(listVoices());
      setAuto({
        female: pickVoice("female")?.name ?? null,
        male: pickVoice("male")?.name ?? null,
      });
    };
    update();
    synth.addEventListener("voiceschanged", update);
    return () => synth.removeEventListener("voiceschanged", update);
  }, []);

  const groups = useMemo<Group[]>(() => {
    const automatic: Group = {
      label: "Automatic",
      rows: VOICE_GENDERS.map((g) => ({
        id: g,
        title: `Automatic · ${GENDER_LABELS[g]}`,
        detail: auto[g] ?? "Default voice, re-pitched",
      })),
    };
    const byRegion = new Map<string, Row[]>();
    for (const v of voices ?? []) {
      const rows = byRegion.get(v.region) ?? [];
      rows.push({ id: v.id, title: v.name, detail: describe(v) });
      byRegion.set(v.region, rows);
    }
    return [
      automatic,
      ...[...byRegion].map(([label, rows]) => ({ label, rows })),
    ];
  }, [voices, auto]);

  // A voice saved on another device (or since removed) isn't listed here;
  // speak() then uses the female automatic choice, so show that instead.
  const rows = groups.flatMap((g) => g.rows);
  const current = rows.find((r) => r.id === pref) ?? rows[0];

  // Close on outside press or Escape. Escape is caught on the way down so it
  // closes only this list, not the settings modal listening further up.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  // Open the list already scrolled to the voice in use.
  useEffect(() => {
    const list = listRef.current;
    const item = currentRef.current;
    if (!open || !list || !item) return;
    list.scrollTop =
      item.offsetTop - (list.clientHeight - item.offsetHeight) / 2;
  }, [open]);

  function choose(id: VoicePref) {
    setPref(id);
    setOpen(false);
    // setPref has already saved it, so this plays in the new voice.
    speak("Pronunciation");
  }

  // Hidden entirely (heading too) where the browser has no speech.
  if (!voices) return null;

  return (
    <>
      <h3 className="mt-5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 dark:text-ink-dark/40">
        Pronunciation voice
      </h3>
      <div className="relative mt-2" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex h-[46px] w-full items-center gap-2.5 rounded-xl border border-hairline bg-card/80 pl-3 pr-2.5 text-left font-sans transition-colors hover:border-ink/25 dark:border-hairline-dark dark:bg-card-dark/80 dark:hover:border-ink-dark/25"
        >
          <Speaker className="h-[18px] w-[18px] shrink-0 text-stamp dark:text-stamp-dark" />
          <span className="min-w-0 flex-1 truncate text-sm">
            <span className="font-medium text-ink/80 dark:text-ink-dark/80">
              {current.title}
            </span>
            {current.detail && (
              <span className="text-ink/45 dark:text-ink-dark/45">
                {" "}
                · {current.detail}
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink/45 transition-transform duration-200 dark:text-ink-dark/45 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          // Opens upward: this sits at the foot of the settings panel, where a
          // downward list would run past the bottom and scroll the panel.
          <div className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-xl border border-hairline bg-card shadow-xl shadow-black/10 dark:border-hairline-dark dark:bg-card-dark">
            <ul
              ref={listRef}
              role="listbox"
              aria-label="Pronunciation voice"
              className={`relative max-h-[min(20rem,55vh)] overflow-y-auto overscroll-contain pb-1 ${
                fade ? "fade-bottom" : ""
              }`}
            >
              {groups.map((group) => (
                <li key={group.label} role="presentation">
                  <p className="sticky top-0 z-10 bg-card px-3.5 pb-1 pt-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40 dark:bg-card-dark dark:text-ink-dark/40">
                    {group.label}
                  </p>
                  <ul role="group" aria-label={group.label}>
                    {group.rows.map((row) => {
                      const selected = row.id === current.id;
                      return (
                        <li key={row.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            ref={selected ? currentRef : undefined}
                            onClick={() => choose(row.id)}
                            className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left font-sans text-sm transition-colors ${
                              selected
                                ? "bg-stamp/10 text-stamp dark:bg-stamp-dark/10 dark:text-stamp-dark"
                                : "text-ink/75 hover:bg-paper/70 dark:text-ink-dark/75 dark:hover:bg-paper-dark/70"
                            }`}
                          >
                            <span className="min-w-0 truncate font-medium">
                              {row.title}
                            </span>
                            <span className="flex min-w-0 shrink-0 items-center gap-1 text-xs text-ink/45 dark:text-ink-dark/45">
                              <span className="max-w-[9rem] truncate">
                                {row.detail}
                              </span>
                              {selected && (
                                <Stamp className="h-3.5 w-3.5 text-stamp dark:text-stamp-dark" />
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
