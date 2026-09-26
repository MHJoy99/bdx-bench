"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { LeaderboardTableRow } from "./columns";
import type { LeaderboardFilterParams } from "./filters";
import { getFilterOptions } from "./filters";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
      <span>{label}</span>
      {children}
    </label>
  );
}

const selectClass =
  "h-8 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-[13px] text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40";
const inputClass =
  "h-8 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-[13px] text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40";

/**
 * Evidence filters — the audit-scoped half of the panel.
 *
 * These are intentionally NOT part of the shared URL contract (`filters.ts` is
 * owned elsewhere and its Zod schema is fixed), so they live in component
 * state and always render their own active count, so the user can never be
 * misled into thinking a filter is applied when it is not.
 */
export interface EvidenceFilterState {
  audit: "all" | "audited" | "unaudited";
  status: "all" | "failing" | "clean";
  minScore: number;
  touch: "all" | "ready" | "none";
}

export const DEFAULT_EVIDENCE_FILTERS: EvidenceFilterState = {
  audit: "all",
  status: "all",
  minScore: 0,
  touch: "all",
};

export function countEvidenceFilters(f: EvidenceFilterState): number {
  let n = 0;
  if (f.audit !== "all") n += 1;
  if (f.status !== "all") n += 1;
  if (f.minScore > 0) n += 1;
  if (f.touch !== "all") n += 1;
  return n;
}

/**
 * Advanced filter panel. URL-persisted filters are controlled by the parent
 * table; evidence filters are local. Collapsible to keep the default view
 * compact — the table is the surface, not the form.
 */
export function LeaderboardFiltersPanel({
  filters,
  allRows,
  onChange,
  onReset,
  activeCount,
  evidence = DEFAULT_EVIDENCE_FILTERS,
  evidenceActiveCount = 0,
  onEvidenceChange,
  onResetEvidence,
}: {
  filters: LeaderboardFilterParams;
  allRows: LeaderboardTableRow[];
  onChange: (patch: Partial<LeaderboardFilterParams>) => void;
  onReset: () => void;
  activeCount: number;
  evidence?: EvidenceFilterState;
  evidenceActiveCount?: number;
  onEvidenceChange?: (patch: Partial<EvidenceFilterState>) => void;
  onResetEvidence?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { providers, families } = getFilterOptions(allRows);
  const total = activeCount + evidenceActiveCount;

  return (
    <section
      aria-label="Leaderboard filters"
      className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)]"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 rounded px-1 py-1 text-[13px] font-medium text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <span aria-hidden="true">{open ? "▾" : "▸"}</span>
          Filters
          {total > 0 ? (
            <span className="rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-ink)]">
              {total} active
            </span>
          ) : (
            <span className="text-xs font-normal text-[var(--text-tertiary)]">
              evidence · provider · license · capabilities · price · context · date
            </span>
          )}
        </button>
        {total > 0 ? (
          <div className="flex items-center gap-1">
            {evidenceActiveCount > 0 && onResetEvidence ? (
              <Button variant="ghost" size="sm" onClick={onResetEvidence}>
                Clear evidence
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={onReset}>
              Reset all
            </Button>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="px-3 py-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Field label="Audit status">
              <select
                className={selectClass}
                value={evidence.audit}
                onChange={(e) =>
                  onEvidenceChange?.({
                    audit: e.target.value as EvidenceFilterState["audit"],
                  })
                }
                aria-label="Filter by audit status"
              >
                <option value="all">Any</option>
                <option value="audited">Audited</option>
                <option value="unaudited">Not audited</option>
              </select>
            </Field>

            <Field label="Verified defects">
              <select
                className={selectClass}
                value={evidence.status}
                onChange={(e) =>
                  onEvidenceChange?.({
                    status: e.target.value as EvidenceFilterState["status"],
                  })
                }
                aria-label="Filter by verified failure findings"
              >
                <option value="all">Any</option>
                <option value="failing">Has a failure</option>
                <option value="clean">No failures</option>
              </select>
            </Field>

            <Field label="Min Showdown Score">
              <select
                className={selectClass}
                value={String(evidence.minScore)}
                onChange={(e) =>
                  onEvidenceChange?.({ minScore: Number(e.target.value) || 0 })
                }
                aria-label="Minimum Showdown Score"
              >
                <option value="0">Any</option>
                <option value="25">25+</option>
                <option value="50">50+</option>
                <option value="60">60+</option>
                <option value="70">70+</option>
                <option value="85">85+</option>
              </select>
            </Field>

            <Field label="Touch support">
              <select
                className={selectClass}
                value={evidence.touch}
                onChange={(e) =>
                  onEvidenceChange?.({
                    touch: e.target.value as EvidenceFilterState["touch"],
                  })
                }
                aria-label="Filter by verified touch support"
              >
                <option value="all">Any</option>
                <option value="ready">Touch ready</option>
                <option value="none">No touch support</option>
              </select>
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3 sm:grid-cols-3 lg:grid-cols-5">
            <Field label="Provider">
              <select
                className={selectClass}
                value={filters.provider}
                onChange={(e) => onChange({ provider: e.target.value, page: 1 })}
                aria-label="Filter by provider"
              >
                <option value="all">All providers</option>
                {providers.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Family">
              <select
                className={selectClass}
                value={filters.family}
                onChange={(e) => onChange({ family: e.target.value, page: 1 })}
                aria-label="Filter by model family"
              >
                <option value="all">All families</option>
                {families.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Weights">
              <select
                className={selectClass}
                value={filters.openWeights}
                onChange={(e) =>
                  onChange({
                    openWeights: e.target.value as LeaderboardFilterParams["openWeights"],
                    page: 1,
                  })
                }
                aria-label="Filter by license"
              >
                <option value="all">Open + proprietary</option>
                <option value="open">Open-weights</option>
                <option value="closed">Proprietary</option>
              </select>
            </Field>

            <Field label="Reasoning">
              <select
                className={selectClass}
                value={filters.reasoning}
                onChange={(e) =>
                  onChange({
                    reasoning: e.target.value as LeaderboardFilterParams["reasoning"],
                    page: 1,
                  })
                }
                aria-label="Filter by reasoning capability"
              >
                <option value="all">All</option>
                <option value="yes">Scored</option>
                <option value="no">Unscored</option>
              </select>
            </Field>

            <Field label="Vision">
              <select
                className={selectClass}
                value={filters.vision}
                onChange={(e) =>
                  onChange({
                    vision: e.target.value as LeaderboardFilterParams["vision"],
                    page: 1,
                  })
                }
                aria-label="Filter by vision capability"
              >
                <option value="all">All</option>
                <option value="yes">Vision</option>
                <option value="no">No vision</option>
              </select>
            </Field>

            <Field label="Tool calling">
              <select
                className={selectClass}
                value={filters.tools}
                onChange={(e) =>
                  onChange({
                    tools: e.target.value as LeaderboardFilterParams["tools"],
                    page: 1,
                  })
                }
                aria-label="Filter by tool calling"
              >
                <option value="all">All</option>
                <option value="yes">Tool-calling</option>
                <option value="no">No tools</option>
              </select>
            </Field>

            <Field label="Min context">
              <select
                className={selectClass}
                value={String(filters.minContext)}
                onChange={(e) =>
                  onChange({ minContext: Number(e.target.value) || 0, page: 1 })
                }
                aria-label="Minimum context window"
              >
                <option value="0">Any</option>
                <option value="8000">8K+</option>
                <option value="32000">32K+</option>
                <option value="128000">128K+</option>
                <option value="200000">200K+</option>
                <option value="1000000">1M+</option>
              </select>
            </Field>

            <Field label="Max input price ($/1M)">
              <input
                className={inputClass}
                type="number"
                min={0}
                step="0.5"
                placeholder="Any"
                value={filters.maxPrice > 0 ? filters.maxPrice : ""}
                onChange={(e) =>
                  onChange({
                    maxPrice: e.target.value === "" ? 0 : Number(e.target.value),
                    page: 1,
                  })
                }
                aria-label="Maximum input price per million tokens"
              />
            </Field>

            <Field label="Released after">
              <input
                className={inputClass}
                type="date"
                value={filters.releasedAfter}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => onChange({ releasedAfter: e.target.value, page: 1 })}
                aria-label="Released after date"
              />
            </Field>

            <Field label="Page size">
              <select
                className={selectClass}
                value={String(filters.pageSize)}
                onChange={(e) =>
                  onChange({ pageSize: Number(e.target.value) || 25, page: 1 })
                }
                aria-label="Rows per page"
              >
                <option value="10">10 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
              </select>
            </Field>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Count non-default URL filters (for the "N active" badge). */
export function countActiveFilters(f: LeaderboardFilterParams): number {
  let n = 0;
  if (f.provider !== "all") n += 1;
  if (f.family !== "all") n += 1;
  if (f.openWeights !== "all") n += 1;
  if (f.reasoning !== "all") n += 1;
  if (f.vision !== "all") n += 1;
  if (f.tools !== "all") n += 1;
  if (f.minContext > 0) n += 1;
  if (f.maxPrice > 0) n += 1;
  if (f.releasedAfter) n += 1;
  if (f.q.trim()) n += 1;
  return n;
}
