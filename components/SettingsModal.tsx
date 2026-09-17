"use client";

import { useEffect, useRef } from "react";
import {
  IMAGE_SIZES,
  IMAGE_SIZE_HINTS,
  IMAGE_SIZE_LABELS,
  type ImageSize,
} from "@/lib/useImageSize";
import { Close } from "@/components/icons";

/** Preview block, scaled the way the real thumbnail is. */
const PREVIEW: Record<ImageSize, string> = {
  s: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

export default function SettingsModal({
  size,
  onSelect,
  onClose,
}: {
  size: ImageSize;
  onSelect: (next: ImageSize) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-3 backdrop-blur-sm sm:items-center sm:p-6 dark:bg-black/50"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-hairline bg-card p-5 shadow-2xl shadow-black/20 focus:outline-none dark:border-hairline-dark dark:bg-card-dark"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="settings-title"
              className="font-serif text-xl font-semibold text-ink dark:text-ink-dark"
            >
              Image size
            </h2>
            <p className="mt-1 font-sans text-sm text-ink/55 dark:text-ink-dark/55">
              How large word pictures appear on set pages.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="-mr-1.5 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/50 hover:bg-paper hover:text-ink dark:text-ink-dark/50 dark:hover:bg-paper-dark dark:hover:text-ink-dark"
          >
            <Close className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {IMAGE_SIZES.map((option) => {
            const selected = option === size;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onSelect(option)}
                aria-pressed={selected}
                className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 transition-colors ${
                  selected
                    ? "border-stamp/50 bg-stamp/10 dark:border-stamp-dark/50 dark:bg-stamp-dark/10"
                    : "border-hairline hover:border-ink/25 dark:border-hairline-dark dark:hover:border-ink-dark/25"
                }`}
              >
                <span className="flex h-11 w-full items-center justify-center">
                  <span
                    className={`rounded-md ${PREVIEW[option]} ${
                      selected
                        ? "bg-stamp/45 dark:bg-stamp-dark/45"
                        : "bg-ink/20 dark:bg-ink-dark/20"
                    }`}
                  />
                </span>
                <span
                  className={`font-sans text-sm font-semibold ${
                    selected
                      ? "text-stamp dark:text-stamp-dark"
                      : "text-ink/70 dark:text-ink-dark/70"
                  }`}
                >
                  {IMAGE_SIZE_LABELS[option]}
                </span>
                <span className="text-center font-sans text-[11px] leading-tight text-ink/45 dark:text-ink-dark/45">
                  {IMAGE_SIZE_HINTS[option]}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 font-sans text-xs text-ink/40 dark:text-ink-dark/40">
          Applies to every set, and is remembered on this device.
        </p>
      </div>
    </div>
  );
}
