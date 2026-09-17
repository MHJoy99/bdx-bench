"use client";

import { useId, useMemo, useState } from "react";
import type { Model } from "@/lib/types";
import { cn } from "@/lib/utils";
import { COMPARE_MAX_MODELS } from "./compare-data";

export interface CompareTrayProps {
  /** All models the picker can offer (demo catalog ∪ fetched rows). */
  catalog: readonly Model[];
  /** Currently selected slugs (max 4). */
  selected: readonly string[];
  /** Replace the selection (already cleaned by the caller). */
  onChange: (slugs: string[]) => void;
  max?: number;
  /** Show the DEMO badge (demo fixtures until the live catalog lands). */
  demo?: boolean;
}

/**
 * SUB-AGENT 6/10 COMPARE — owned: compare tray.
 *
 * Tray behavior:
 * - Add/remove toggles per model (`aria-pressed`), capped at `max` (Add
 *   disables when full unless the row is already selected).
 * - "Clear" empties the selection. Search filters the catalog by
 *   name/slug/family/id. All controls are native buttons/inputs (keyboard
 *   accessible, visible focus rings).
 * - Persistence + URL sync live in CompareView (single writer): every change is
 *   saved to localStorage (`bdx-compare-tray-v1`) and pushed to
 *   `/compare?models=a,b` via `router.replace` (shareable, no history spam).
 *   On load the URL wins when present; otherwise the tray restores storage.
 */
export function CompareTray({ catalog, selected, onChange, max = COMPARE_MAX_MODELS, demo = true }: CompareTrayProps) {
  const [query, setQuery] = useState("");
  const headingId = useId();
  const searchId = useId();

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...catalog];
    return catalog.filter((m) => `${m.name} ${m.slug} ${m.family} ${m.id}`.toLowerCase().includes(q));
  }, [catalog, query]);

  const toggle = (slug: string) => {
    if (selectedSet.has(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else if (selected.length < max) {
      onChange([...selected, slug]);
    }
  };

  const full = selected.length >= max;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-border bg-card p-4 text-card-foreground"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={headingId} className="text-sm font-semibold">
          Compare tray
        </h2>
        {demo ? (
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Demo
          </span>
        ) : null}
        <span aria-live="polite" className="text-xs text-muted-foreground">
          {selected.length}/{max} selected
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => onChange([])}
          disabled={selected.length === 0}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F7A00] disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:outline-[#B8FF5A]"
        >
          Clear
        </button>
      </div>

      <div className="mt-3">
        <label htmlFor={searchId} className="mb-1 block text-xs font-medium text-muted-foreground">
          Find models
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name, slug, or family…"
          autoComplete="off"
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3F7A00] dark:focus-visible:outline-[#B8FF5A]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No models match “{query.trim()}”.</p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {filtered.map((m) => {
            const active = selectedSet.has(m.slug);
            const disabled = !active && full;
            return (
              <li
                key={m.slug}
                className={cn(
                  "flex items-center gap-2 rounded-md border p-2",
                  active ? "border-[#3F7A00]/50 bg-[#B8FF5A]/10 dark:border-[#B8FF5A]/50" : "border-border",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{m.name}</span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {m.slug} · {m.family}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => toggle(m.slug)}
                  disabled={disabled}
                  aria-pressed={active}
                  aria-label={active ? `Remove ${m.name} from comparison` : `Add ${m.name} to comparison`}
                  title={disabled ? `Tray is full (${max} max)` : undefined}
                  className={cn(
                    "shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F7A00] dark:focus-visible:outline-[#B8FF5A]",
                    active
                      ? "border-[#3F7A00]/60 bg-[#B8FF5A] text-[#101600] hover:brightness-95 dark:border-[#B8FF5A]/60"
                      : "border-border text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                >
                  {active ? "Remove" : "Add"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Saved in this browser (localStorage) and synced to the URL — copy the link to share this exact comparison.
      </p>
    </section>
  );
}
