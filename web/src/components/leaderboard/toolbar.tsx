"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { LeaderboardTableRow } from "./columns";
import {
  CATEGORY_TABS,
  LEADERBOARD_COLUMN_LABELS,
  LEADERBOARD_COLUMN_ORDER,
  LOCKED_COLUMN_IDS,
  SCORE_SCALE_CAPTION,
  downloadCSV,
  type LeaderboardColumnId,
} from "./columns";
import type { CategoryId } from "./columns";

export type ColumnVisibility = Record<string, boolean>;

const LOCKED = new Set<string>(LOCKED_COLUMN_IDS);

/** Evidence columns first in the menu, then the unevaluated catalog columns. */
const EVIDENCE_COLUMN_IDS = [
  "dimControls",
  "dimCombat",
  "dimContent",
  "dimAudio",
  "dimPolish",
] as const;

export function LeaderboardToolbar({
  category,
  activeSortId,
  query,
  onCategory,
  onQuery,
  visibility,
  onToggleColumn,
  onResetColumns,
  exportRows,
  filteredCount,
  totalCount,
  compareCount = 0,
  compareHref = "/compare",
  onClearCompare,
}: {
  category: CategoryId;
  activeSortId: string;
  query: string;
  onCategory: (c: CategoryId) => void;
  onQuery: (q: string) => void;
  visibility: ColumnVisibility;
  onToggleColumn: (id: LeaderboardColumnId) => void;
  onResetColumns: () => void;
  exportRows: LeaderboardTableRow[];
  filteredCount: number;
  totalCount: number;
  compareCount?: number;
  compareHref?: string;
  onClearCompare?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [colsOpen, setColsOpen] = useState(false);

  async function shareView() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy this view URL:", window.location.href);
    }
  }

  function onTabKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (index + dir + CATEGORY_TABS.length) % CATEGORY_TABS.length;
    const tab = CATEGORY_TABS[next];
    if (!tab) return;
    onCategory(tab.id);
    const tabId = tab.id;
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-cat-tab="${tabId}"]`)?.focus();
    });
  }

  const togglable = LEADERBOARD_COLUMN_ORDER.filter((c) => !LOCKED.has(c));
  const evidenceCols = togglable.filter((c) =>
    (EVIDENCE_COLUMN_IDS as readonly string[]).includes(c),
  );
  const otherCols = togglable.filter(
    (c) => !(EVIDENCE_COLUMN_IDS as readonly string[]).includes(c),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <div
            role="tablist"
            aria-label="Ranking category"
            className="flex flex-wrap gap-1.5"
          >
            {CATEGORY_TABS.map((t, i) => {
              const active = category === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  data-cat-tab={t.id}
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => onCategory(t.id)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className={
                    active
                      ? "rounded-[6px] bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      : "rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--elevated)] hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="font-mono text-[10px] uppercase leading-[15px] tracking-wider text-[var(--text-tertiary)]">
            Showdown is the only category measured this round · the rest read
            Not evaluated
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 sm:w-64">
            <Input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search model, provider, family…"
              aria-label="Search leaderboard"
              type="search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={shareView}>
              {copied ? "Copied!" : "Share view"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCSV(
                  `bdx-leaderboard-${new Date().toISOString().slice(0, 10)}.csv`,
                  exportRows,
                )
              }
              disabled={exportRows.length === 0}
              title="Download the currently filtered + sorted rows as CSV, including the audit evidence"
            >
              Export CSV
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                aria-expanded={colsOpen}
                aria-haspopup="true"
                onClick={() => setColsOpen((v) => !v)}
              >
                Columns
              </Button>
              {colsOpen ? (
                <div
                  role="menu"
                  aria-label="Toggle columns"
                  className="absolute right-0 z-30 mt-1 max-h-[70vh] w-56 overflow-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg"
                >
                  <p className="px-1.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">
                    Audit evidence
                  </p>
                  {evidenceCols.map((id) => (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs text-[var(--text)] hover:bg-[var(--elevated)]"
                    >
                      <input
                        type="checkbox"
                        checked={visibility[id] !== false}
                        onChange={() => onToggleColumn(id)}
                        className="h-3.5 w-3.5 accent-current"
                      />
                      {LEADERBOARD_COLUMN_LABELS[id] ?? id}
                    </label>
                  ))}
                  <p className="mt-1.5 border-t border-[var(--border)] px-1.5 pt-1.5 pb-1 font-mono text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">
                    Catalog (unmeasured)
                  </p>
                  {otherCols.map((id) => (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs text-[var(--text)] hover:bg-[var(--elevated)]"
                    >
                      <input
                        type="checkbox"
                        checked={visibility[id] !== false}
                        onChange={() => onToggleColumn(id)}
                        className="h-3.5 w-3.5 accent-current"
                      />
                      {LEADERBOARD_COLUMN_LABELS[id] ?? id}
                    </label>
                  ))}
                  <div className="mt-1 border-t border-[var(--border)] pt-1">
                    <button
                      onClick={() => {
                        onResetColumns();
                        setColsOpen(false);
                      }}
                      className="w-full rounded px-1.5 py-1 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--elevated)] hover:text-[var(--text)]"
                    >
                      Reset columns
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[var(--text-secondary)]">
        <Badge variant="default" aria-live="polite" className="hidden sm:inline-flex">
          {filteredCount} of {totalCount} models
        </Badge>
        <span>
          Sorted by{" "}
          <strong className="font-medium text-[var(--text)]">
            {LEADERBOARD_COLUMN_LABELS[activeSortId] ?? activeSortId}
          </strong>
          . Click any column header to re-sort.
        </span>
        <Link
          href="/methodology"
          className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] underline-offset-2 hover:text-[var(--text-secondary)] hover:underline"
          title="How a Showdown Score is produced"
        >
          {SCORE_SCALE_CAPTION}
        </Link>
        {compareCount > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <Link
              href={compareHref}
              className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--accent-border)] bg-[var(--accent-muted)] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--accent-ink)] transition-colors hover:border-[var(--accent)]"
            >
              Compare {compareCount}
            </Link>
            {onClearCompare ? (
              <button
                type="button"
                onClick={onClearCompare}
                className="inline-flex items-center gap-0.5 rounded px-1 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] transition-colors hover:text-[var(--text)]"
              >
                <X className="size-3" aria-hidden="true" />
                clear
              </button>
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}
