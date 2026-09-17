"use client";

import { useState } from "react";
import type { VocabEntry } from "@/lib/types";
import { imageSrc } from "@/lib/vocab";

export default function WordImage({
  entry,
  className,
  variant = "thumb",
}: {
  entry: VocabEntry;
  className?: string;
  variant?: "thumb" | "card";
}) {
  const src = imageSrc(entry);
  const [errored, setErrored] = useState(false);
  const showFallback = !src || errored;

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {showFallback ? (
        <div className="absolute inset-0 flex items-center justify-center bg-card dark:bg-card-dark">
          <span
            className={`select-none font-serif italic text-ink/50 dark:text-ink-dark/50 ${
              variant === "card" ? "text-4xl" : "text-xl"
            }`}
          >
            {entry.word[0].toUpperCase()}
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setErrored(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}
