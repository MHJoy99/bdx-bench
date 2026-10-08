"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/*
 * The palette (dialog, filtering, recent-selection storage, motion, canonical
 * index) is only needed after Cmd/Ctrl+K or a nav click. Loading it on demand
 * keeps it out of the shared root chunk that every route downloads and parses.
 */
const PaletteHost = dynamic(
  () => import("@/components/search/palette-host").then((m) => m.PaletteHost),
  { ssr: false, loading: () => null },
);

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
  // Mount the palette on first open; keep it mounted afterwards so its close transition runs.
  const [everOpened, setEverOpened] = useState(open);
  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
  if (!everOpened) return null;
  return (
    <PaletteHost
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    />
  );
}
