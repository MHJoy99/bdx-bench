"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";
import type {
  PaletteBenchmarkInput,
  PaletteModelInput,
  PalettePageDef,
} from "./palette-items";
import type { Provider } from "@/lib/types";

export interface CommandPaletteHostProps {
  models?: PaletteModelInput[];
  benchmarks?: PaletteBenchmarkInput[];
  providers?: Provider[];
  families?: string[];
  pages?: PalettePageDef[];
  onNavigate?: (href: string) => void;
  className?: string;
  /** Compact icon-only trigger for mobile nav. */
  compact?: boolean;
}

/**
 * Additive palette wiring: ⌘K/Ctrl+K toggle + nav trigger button + palette.
 * Render anywhere inside <body> (e.g. next to SiteNav). Owns its own open
 * state, so layout stays a server component. Does not touch routes.
 *
 * NOTE for nav agent: `SiteNavWithSearch` (components/search-command-host.tsx)
 * can swap its placeholder `SearchCommand` for this host (see PALETTE_WIRING.md).
 */
export function CommandPaletteHost({
  models,
  benchmarks,
  providers,
  families,
  pages,
  onNavigate,
  className,
  compact = false,
}: CommandPaletteHostProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <PaletteTriggerButton
        onClick={() => setOpen(true)}
        className={className}
        compact={compact}
      />
      <CommandPalette
        models={models}
        benchmarks={benchmarks}
        providers={providers}
        families={families}
        pages={pages}
        open={open}
        onOpenChange={setOpen}
        onNavigate={onNavigate}
      />
    </>
  );
}

export function PaletteTriggerButton({
  onClick,
  className,
  compact = false,
}: {
  onClick: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open search (Control or Command K)"
      title="Search (⌘K / Ctrl+K)"
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-secondary)] transition-colors",
        "hover:border-[var(--border-strong)] hover:text-[var(--text)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        compact ? "w-8 justify-center px-0" : "min-w-0 px-2.5 sm:w-52",
        className,
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      {!compact && (
        <>
          <span className="ellipsis flex-1 text-left">Search…</span>
          <kbd className="bdx-kbd hidden shrink-0 sm:inline-flex" aria-hidden>
            ⌘K
          </kbd>
        </>
      )}
    </button>
  );
}
