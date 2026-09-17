"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/icons";

/** `danger` stamps the confirming button red; `neutral` leaves it ink. */
export type ConfirmTone = "danger" | "neutral";

export interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
}

/**
 * The in-app stand-in for `window.confirm`, wearing the same panel, entrance
 * and exit as the settings and score modals. Mount it with a request object
 * and clear that object when it closes.
 */
export default function ConfirmModal({
  request,
  onClose,
}: {
  request: ConfirmRequest;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const [closing, setClosing] = useState(false);
  const tone = request.tone ?? "danger";

  // Play the entrance in reverse, then hand back to the parent.
  const requestClose = useCallback((after: () => void) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      after();
      return;
    }
    setClosing((already) => {
      if (!already) window.setTimeout(after, 200);
      return true;
    });
  }, []);

  const cancel = useCallback(() => requestClose(onClose), [requestClose, onClose]);

  const confirm = useCallback(
    () =>
      requestClose(() => {
        onClose();
        request.onConfirm();
      }),
    [requestClose, onClose, request]
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Land on Cancel, so a stray Enter or Space backs out rather than commits.
    cancelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") cancel();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [cancel]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-3 backdrop-blur-sm sm:p-6 dark:bg-black/50 ${
        closing ? "overlay-out" : "overlay-in"
      }`}
      onClick={cancel}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-full w-full max-w-sm overflow-y-auto overscroll-contain rounded-2xl border border-hairline bg-card p-6 text-center shadow-2xl shadow-black/20 focus:outline-none dark:border-hairline-dark dark:bg-card-dark ${
          closing ? "card-out" : "card-in"
        }`}
      >
        <span
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            tone === "danger"
              ? "bg-stamp/10 text-stamp dark:bg-stamp-dark/10 dark:text-stamp-dark"
              : "bg-caution/10 text-caution dark:bg-caution-dark/10 dark:text-caution-dark"
          }`}
        >
          <Alert className="h-6 w-6" />
        </span>

        <h2
          id="confirm-title"
          className="mt-4 font-serif text-2xl font-semibold text-ink dark:text-ink-dark"
        >
          {request.title}
        </h2>
        <p
          id="confirm-body"
          className="mx-auto mt-2 max-w-[32ch] font-sans text-sm leading-relaxed text-ink/60 dark:text-ink-dark/60"
        >
          {request.body}
        </p>

        {/* Cancel first in the DOM so it takes focus and the Tab order, but
            painted second on anything wider than a phone, where the committing
            button belongs on the right. */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
          <button
            type="button"
            onClick={confirm}
            className={`w-full rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-colors ${
              tone === "danger"
                ? "bg-stamp text-paper hover:bg-stamp/90 dark:bg-stamp-dark dark:text-paper-dark dark:hover:bg-stamp-dark/90"
                : "bg-ink text-paper hover:bg-ink/90 dark:bg-ink-dark dark:text-paper-dark dark:hover:bg-ink-dark/90"
            }`}
          >
            {request.confirmLabel}
          </button>
          <button
            ref={cancelRef}
            type="button"
            onClick={cancel}
            className="w-full rounded-xl border border-hairline px-4 py-3 font-sans text-sm font-semibold text-ink/75 transition-colors hover:border-ink/25 hover:text-ink dark:border-hairline-dark dark:text-ink-dark/75 dark:hover:border-ink-dark/25 dark:hover:text-ink-dark"
          >
            {request.cancelLabel ?? "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
