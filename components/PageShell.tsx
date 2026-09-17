import type { ReactNode } from "react";

/**
 * The single source of truth for page width and gutters, so every screen
 * lines up at the same measure on the same device. Phone-first: a narrow
 * gutter and full-bleed content, widening only once there is room for it.
 *
 * Full-bleed elements (the sticky bar) apply SHELL_WIDTH to their own inner
 * wrapper instead, so their background spans the viewport while their content
 * still sits on this grid.
 */
export const SHELL_WIDTH = "mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8";

export default function PageShell({
  children,
  className,
  padTop = true,
}: {
  children: ReactNode;
  className?: string;
  /** Set false when the page opens with a sticky bar that owns the top edge. */
  padTop?: boolean;
}) {
  return (
    <main
      className={`${SHELL_WIDTH} pb-[max(3rem,env(safe-area-inset-bottom))] ${
        padTop ? "pt-[max(1.25rem,env(safe-area-inset-top))]" : ""
      } ${className ?? ""}`}
    >
      {children}
    </main>
  );
}
