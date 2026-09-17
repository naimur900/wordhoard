"use client";

import Link from "next/link";
import type { SetSummary } from "@/lib/types";
import { ChevronRight } from "@/components/icons";

export default function SetRow({
  set,
  known,
  ready,
}: {
  set: SetSummary;
  known: number;
  ready: boolean;
}) {
  const pad = String(set.id).padStart(2, "0");
  const complete = ready && known === set.count;
  const progress = ready ? known / set.count : 0;

  return (
    <li className="min-w-0">
      <Link
        href={`/sets/${set.id}`}
        className={`flex h-full items-center gap-3.5 rounded-2xl border bg-card/80 p-3.5 transition-colors sm:gap-4 sm:p-4 dark:bg-card-dark/80 ${
          complete
            ? "border-ledger/35 dark:border-ledger-dark/30"
            : "border-hairline hover:border-ink/25 dark:border-hairline-dark dark:hover:border-ink-dark/25"
        }`}
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-serif text-base ${
            complete
              ? "border-ledger/40 bg-ledger/10 text-ledger dark:border-ledger-dark/40 dark:bg-ledger-dark/10 dark:text-ledger-dark"
              : "border-stamp/30 bg-stamp/5 text-stamp dark:border-stamp-dark/40 dark:bg-stamp-dark/10 dark:text-stamp-dark"
          }`}
        >
          {pad}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-serif text-lg font-semibold text-ink dark:text-ink-dark">
              Set {set.id}
            </span>
            <span className="shrink-0 font-sans text-xs tabular-nums text-ink/50 dark:text-ink-dark/50">
              {ready ? `${known}/${set.count}` : "\u00A0"}
            </span>
          </span>
          <span className="mt-0.5 block truncate font-sans text-sm text-ink/55 dark:text-ink-dark/55">
            {set.sample.join(", ")}…
          </span>
          <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-hairline dark:bg-hairline-dark">
            <span
              className="block h-full rounded-full bg-ledger transition-[width] duration-500 dark:bg-ledger-dark"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </span>
        </span>

        <ChevronRight className="h-4 w-4 shrink-0 text-ink/25 dark:text-ink-dark/25" />
      </Link>
    </li>
  );
}
