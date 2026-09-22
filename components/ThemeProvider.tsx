"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Two palettes: `light` (paper) and `dark` (true black). `system` follows the
 * device. `value` maps an `oled` left in storage by an earlier version onto
 * `dark`. An untouched install is dark.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      themes={["light", "dark"]}
      value={{ light: "light", dark: "dark", oled: "dark" }}
    >
      {children}
    </NextThemesProvider>
  );
}
