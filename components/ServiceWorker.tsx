"use client";

import { useEffect } from "react";

/** Registers public/sw.js, which makes the app work offline. */
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In development a cached page would hide your edits, so clear out any
    // worker left over from trying a production build on the same port.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()));
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      // Once it is running, ask it to refresh its saved pages; it skips this
      // when it did so recently, so a deploy still reaches offline copies.
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => reg.active?.postMessage("precache"))
      .catch(() => {});
  }, []);

  return null;
}
