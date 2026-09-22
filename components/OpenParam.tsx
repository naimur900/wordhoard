"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Reports `?open=`. Kept in its own Suspense boundary because reading search
 * params opts whatever is above the nearest boundary out of static rendering —
 * this way only this empty component waits for the client, and the page's
 * cards still ship as prerendered HTML (which is what the offline cache holds).
 *
 * The value itself comes from `location`: on a prerendered page
 * `useSearchParams()` came back without `open`, but it still changes whenever
 * the URL does, so it serves as the signal to look again (a search result in
 * the page already open only changes `?open=`).
 */
function ReadOpenParam({ onChange }: { onChange: (open: string | null) => void }) {
  const params = useSearchParams();
  useEffect(() => {
    onChange(new URLSearchParams(window.location.search).get("open"));
  }, [params, onChange]);
  return null;
}

/** Reports the page's `?open=` value to `onChange`, now and on every change. */
export default function OpenParam({
  onChange,
}: {
  onChange: (open: string | null) => void;
}) {
  return (
    <Suspense fallback={null}>
      <ReadOpenParam onChange={onChange} />
    </Suspense>
  );
}
