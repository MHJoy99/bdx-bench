"use client";

import { CommandPalette } from "@/components/search/CommandPalette";
import {
  CANONICAL_BENCHMARKS,
  CANONICAL_MODELS,
  CANONICAL_PAGES,
} from "@/components/search/palette-items";

/**
 * Lazy boundary for the palette and its canonical index. Loaded through
 * `next/dynamic` from `search-command.tsx`, so neither the dialog code nor the
 * ~10 KB index is part of the root bundle every route downloads.
 */
export function PaletteHost({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <CommandPalette
      models={CANONICAL_MODELS}
      benchmarks={CANONICAL_BENCHMARKS}
      pages={CANONICAL_PAGES}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
