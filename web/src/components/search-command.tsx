"use client";

import { useEffect } from "react";

/**
 * CmdK hook placeholder — search UI agent owns the palette.
 * Registers Cmd/Ctrl+K and calls `onOpen`. No-op UI here.
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

/** Minimal search-command mount point (palette implemented by search agent). */
export function SearchCommand({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="mt-24 w-full max-w-lg rounded-lg border border-border bg-card p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-muted-foreground">
          Search palette placeholder — search agent implements model/benchmark lookup here.
        </p>
      </div>
    </div>
  );
}
