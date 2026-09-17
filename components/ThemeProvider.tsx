"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * `light` / `dark` are the paper palette following the device; `oled` is the
 * true-black variant. Default is `system`, so an untouched install behaves
 * exactly as it did before a theme could be chosen at all.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={["light", "dark", "oled"]}
    >
      {children}
    </NextThemesProvider>
  );
}
