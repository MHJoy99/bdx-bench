"use client";

import { useEffect } from "react";
import { CommandPalette } from "@/components/search/CommandPalette";
import {
  CANONICAL_BENCHMARKS,
  CANONICAL_MODELS,
  CANONICAL_PAGES,
} from "@/components/search/palette-items";

/**
 * CmdK hook — registers Cmd/Ctrl+K and calls `onOpen`.
 */
export function useCmdK(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
}

/**
 * Search palette mount — renders the real CommandPalette with the canonical
 * index (2 models + 1 benchmark + pages). Keyboard: type to filter,
 * ArrowUp/ArrowDown/Home/End to move, Enter to jump, Esc to close.
 * Recent selections persist via `bdx-palette-recent-v1`.
 */
export function SearchCommand({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
  return (
    <CommandPalette
      models={CANONICAL_MODELS}
      benchmarks={CANONICAL_BENCHMARKS}
      pages={CANONICAL_PAGES}
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    />
  );
}
