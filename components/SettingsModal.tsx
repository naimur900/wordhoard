"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  IMAGE_SIZES,
  IMAGE_SIZE_HINTS,
  IMAGE_SIZE_LABELS,
  type ImageSize,
} from "@/lib/useImageSize";
import {
  clearImages,
  countSavedImages,
  downloadImages,
  imageUrls,
  offlineSupported,
} from "@/lib/offline";
import { useReview } from "@/lib/useReview";
import { fadeClass, useScrollFades } from "@/lib/useScrollFade";
import VoicePicker from "@/components/VoicePicker";
import { Close } from "@/components/icons";

const THEMES = [
  {
    value: "dark",
    label: "Dark",
    hint: "True black",
    swatch: "bg-black",
  },
  {
    value: "light",
    label: "Light",
    hint: "Warm paper",
    swatch: "bg-[#efe9da]",
  },
  {
    value: "system",
    label: "Automatic",
    hint: "Follows your device",
    swatch: "bg-gradient-to-br from-[#efe9da] via-[#efe9da] to-black",
  },
] as const;

/** Every label the download button can show; see the button for why. */
const DOWNLOAD_LABELS = {
  idle: "Download all",
  downloading: "Saving…",
  failed: "Retry",
} as const;

/**
 * A clear button that asks first. Both labels share one grid cell, so the
 * button keeps the width of the longer one and the text beside it never
 * reflows; the labels cross-fade instead of snapping. The border stays put
 * too — only its colour changes — so arming it shifts nothing.
 */
function ClearButton({
  armed,
  onClick,
}: {
  armed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={armed ? "Tap again to confirm clearing" : "Clear"}
      className={`grid shrink-0 rounded-full border px-3.5 py-1.5 text-center font-sans text-xs font-semibold transition-colors ${
        armed
          ? "border-stamp bg-stamp text-paper dark:border-stamp-dark dark:bg-stamp-dark dark:text-paper-dark"
          : "border-hairline text-ink/70 hover:border-stamp/40 hover:text-stamp dark:border-hairline-dark dark:text-ink-dark/70 dark:hover:border-stamp-dark/40 dark:hover:text-stamp-dark"
      }`}
    >
      {[
        { label: "Clear", shown: !armed },
        { label: "Confirm?", shown: armed },
      ].map(({ label, shown }) => (
        <span
          key={label}
          aria-hidden={!shown}
          className={`col-start-1 row-start-1 transition-opacity duration-200 ${
            shown ? "opacity-100" : "opacity-0"
          }`}
        >
          {label}
        </span>
      ))}
    </button>
  );
}

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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fades = useScrollFades(scrollRef, true);
  const { theme, setTheme } = useTheme();
  const review = useReview();
  // Clearing asks first, in the button itself rather than a second dialog
  // stacked on this one; the question withdraws if it goes unanswered.
  const [confirm, setConfirm] = useState<"images" | "review" | null>(null);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  // Play the entrance in reverse, then let the parent unmount us.
  const requestClose = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    setClosing((already) => {
      if (!already) window.setTimeout(onClose, 200);
      return true;
    });
  }, [onClose]);

  // The stored theme is only knowable on the client; wait for mount so the
  // selected state never disagrees with the server-rendered markup.
  useEffect(() => setMounted(true), []);

  const [offline, setOffline] = useState<{
    total: number;
    saved: number;
    status: "idle" | "downloading" | "failed";
  } | null>(null);

  useEffect(() => {
    if (!offlineSupported()) return;
    const urls = imageUrls();
    countSavedImages(urls)
      .then((saved) => setOffline({ total: urls.length, saved, status: "idle" }))
      .catch(() => {});
  }, []);

  async function saveForOffline() {
    const urls = imageUrls();
    setOffline((o) => o && { ...o, status: "downloading" });
    try {
      const failed = await downloadImages(urls, (saved) =>
        setOffline((o) => o && { ...o, saved })
      );
      setOffline((o) => o && { ...o, status: failed ? "failed" : "idle" });
    } catch {
      setOffline((o) => o && { ...o, status: "failed" });
    }
  }

  const currentTheme = !mounted
    ? null
    : THEMES.some((t) => t.value === theme)
      ? theme
      : "dark";

  function chooseTheme(next: string) {
    const root = document.documentElement;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (still) {
      setTheme(next);
      return;
    }

    root.classList.add("theme-animating");
    setTheme(next);
    window.setTimeout(() => root.classList.remove("theme-animating"), 450);
  }

  useEffect(() => {
    if (!confirm) return;
    const timer = window.setTimeout(() => setConfirm(null), 4000);
    return () => window.clearTimeout(timer);
  }, [confirm]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [requestClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-3 backdrop-blur-sm sm:p-6 dark:bg-black/50 ${
        closing ? "overlay-out" : "overlay-in"
      }`}
      onClick={requestClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        // Centred at every width; capped so a short viewport (a phone in
        // landscape) can still reach the bottom of the panel, which scrolls
        // inside its frame. `card-in` is the same entrance the word cards use,
        // so the modal arrives the way the rest of the app does — and leaves
        // in reverse.
        className={`flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border border-hairline bg-card shadow-2xl shadow-black/20 focus:outline-none dark:border-hairline-dark dark:bg-card-dark ${
          closing ? "card-out" : "card-in"
        }`}
      >
        <div
          ref={scrollRef}
          // Settings dissolve into whichever edge has more beyond it, the way
          // the dropdown lists do.
          className={`overflow-y-auto overscroll-contain p-5 ${fadeClass(fades)}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="settings-title"
                className="font-serif text-xl font-semibold text-ink dark:text-ink-dark"
              >
                Settings
              </h2>
              <p className="mt-1 font-sans text-sm text-ink/55 dark:text-ink-dark/55">
                Remembered on this device.
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close settings"
              className="-mr-1.5 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/50 hover:bg-paper hover:text-ink dark:text-ink-dark/50 dark:hover:bg-paper-dark dark:hover:text-ink-dark"
            >
              <Close className="h-4 w-4" />
            </button>
          </div>

          <h3 className="mt-5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 dark:text-ink-dark/40">
            Image size
          </h3>
          <div className="mt-2 grid grid-cols-3 gap-2.5">
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

          <h3 className="mt-5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 dark:text-ink-dark/40">
            Theme
          </h3>
          <div className="mt-2 grid grid-cols-3 gap-2.5">
            {THEMES.map((option) => {
              const selected = currentTheme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => chooseTheme(option.value)}
                  aria-pressed={selected}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors ${
                    selected
                      ? "border-stamp/50 bg-stamp/10 dark:border-stamp-dark/50 dark:bg-stamp-dark/10"
                      : "border-hairline hover:border-ink/25 dark:border-hairline-dark dark:hover:border-ink-dark/25"
                  }`}
                >
                  <span
                    className={`h-9 w-9 shrink-0 rounded-lg ring-1 ring-inset ring-ink/15 dark:ring-ink-dark/20 ${option.swatch}`}
                  />
                  <span className="min-w-0">
                    <span
                      className={`block font-sans text-sm font-semibold ${
                        selected
                          ? "text-stamp dark:text-stamp-dark"
                          : "text-ink/75 dark:text-ink-dark/75"
                      }`}
                    >
                      {option.label}
                    </span>
                    <span className="block font-sans text-[11px] leading-tight text-ink/45 dark:text-ink-dark/45">
                      {option.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {offline && (
            <>
              <h3 className="mt-5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 dark:text-ink-dark/40">
                Offline
              </h3>
              <div className="mt-2 rounded-xl border border-hairline p-3 dark:border-hairline-dark">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-semibold tabular-nums text-ink/75 dark:text-ink-dark/75">
                      {offline.saved === offline.total
                        ? "All pictures saved"
                        : `${offline.saved} of ${offline.total} pictures saved`}
                    </p>
                    <p className="font-sans text-[11px] leading-tight text-ink/45 dark:text-ink-dark/45">
                      {offline.status === "failed"
                        ? "Some didn't download. Check your connection and try again."
                        : offline.saved === offline.total
                          ? "Every set works without a connection."
                          : "Words work offline already; this adds every picture."}
                    </p>
                  </div>
                  {offline.saved === offline.total ? (
                    <ClearButton
                      armed={confirm === "images"}
                      onClick={async () => {
                        if (confirm !== "images") return setConfirm("images");
                        await clearImages();
                        setOffline((o) => o && { ...o, saved: 0, status: "idle" });
                        setConfirm(null);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={saveForOffline}
                      disabled={offline.status === "downloading"}
                      // All labels share one grid cell, so the button is always
                      // as wide as the longest; swapping labels mid-download
                      // would otherwise resize it and reflow the text beside it.
                      className="grid shrink-0 rounded-full bg-stamp px-3.5 py-1.5 font-sans text-xs font-semibold text-paper transition-opacity disabled:opacity-60 dark:bg-stamp-dark dark:text-paper-dark"
                    >
                      {Object.entries(DOWNLOAD_LABELS).map(([status, label]) => (
                        <span
                          key={status}
                          className={`col-start-1 row-start-1 ${
                            status === offline.status ? "" : "invisible"
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </button>
                  )}
                </div>
                <div
                  className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-hairline dark:bg-hairline-dark"
                  role="progressbar"
                  aria-label="Pictures saved for offline use"
                  aria-valuemin={0}
                  aria-valuemax={offline.total}
                  aria-valuenow={offline.saved}
                >
                  <div
                    className="h-full rounded-full bg-ledger transition-[width] duration-300 dark:bg-ledger-dark"
                    style={{ width: `${(offline.saved / offline.total) * 100}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {review.ready && review.scheduled > 0 && (
            <>
              <h3 className="mt-5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 dark:text-ink-dark/40">
                Flashcards
              </h3>
              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-hairline p-3 dark:border-hairline-dark">
                <div className="min-w-0">
                  <p className="font-sans text-sm font-semibold tabular-nums text-ink/75 dark:text-ink-dark/75">
                    {review.scheduled} {review.scheduled === 1 ? "word" : "words"} scheduled
                  </p>
                  <p className="font-sans text-[11px] leading-tight text-ink/45 dark:text-ink-dark/45">
                    Clearing forgets when each word is next due. Words you have
                    marked known stay marked.
                  </p>
                </div>
                <ClearButton
                  armed={confirm === "review"}
                  onClick={() => {
                    if (confirm !== "review") return setConfirm("review");
                    review.reset();
                    setConfirm(null);
                  }}
                />
              </div>
            </>
          )}

          <VoicePicker />
        </div>
      </div>
    </div>
  );
}
