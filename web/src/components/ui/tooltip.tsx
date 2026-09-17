import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * CSS-only tooltip: hover + keyboard-focus reveals. No JS lib needed,
 * respects reduced-motion, positions above by default.
 */
function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 w-max max-w-[240px] -translate-x-1/2 rounded-[6px] border border-[var(--border-strong)] bg-[var(--elevated)] px-2 py-1 text-[12px] leading-4 text-[var(--text)] shadow-md",
          "opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100",
          side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]",
        )}
      >
        {content}
      </span>
    </span>
  );
}

export { Tooltip };
