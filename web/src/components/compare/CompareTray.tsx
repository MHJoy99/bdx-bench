"use client";

import { useId, useMemo, useState } from "react";
import type { Model } from "@/lib/types";
import { cn } from "@/lib/utils";
import { COMPARE_MAX_MODELS, COMPARE_TRAY_STORAGE_KEY } from "./compare-data";

export interface CompareTrayProps {
  catalog: readonly Model[];
  selected: readonly string[];
  onChange: (slugs: string[]) => void;
  max?: number;
}

const _trayKey: string = COMPARE_TRAY_STORAGE_KEY;

export function CompareTray({ catalog, selected, onChange, max = COMPARE_MAX_MODELS }: CompareTrayProps) {
  void _trayKey;
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
      return;
    }
    if (selected.length >= max) return;
    const next = [...selected, slug].filter((v, i, a) => a.indexOf(v) === i).slice(0, max);
    onChange(next);
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
        Saved in this browser and synced to the URL — copy the link to share this exact comparison.
      </p>
    </section>
  );
}
