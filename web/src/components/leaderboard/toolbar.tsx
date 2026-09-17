"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { LeaderboardTableRow } from "./columns";
import {
  CATEGORY_TABS,
  LEADERBOARD_COLUMN_ORDER,
  downloadCSV,
  type LeaderboardColumnId,
} from "./columns";
import type { CategoryId } from "./columns";

export type ColumnVisibility = Record<string, boolean>;

const COLUMN_LABELS: Record<string, string> = {
  rank: "Rank",
  model: "Model",
  provider: "Provider",
  overall: "Overall",
  reasoning: "Reasoning",
  coding: "Coding",
  math: "Math",
  knowledge: "Knowledge",
  vision: "Vision",
  agentic: "Agentic",
  speed: "Speed",
  inputPrice: "Input Price",
  outputPrice: "Output Price",
  context: "Context",
  released: "Released",
};

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

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                    : "rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--elevated)] hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                }
              >
                {t.label}
              </button>
            );
          })}
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
              title="Download the currently filtered + sorted rows as CSV"
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
                  className="absolute right-0 z-30 mt-1 w-48 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg"
                >
                  {LEADERBOARD_COLUMN_ORDER.filter(
                    (c) => c !== "rank" && c !== "model",
                  ).map((id) => (
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
                      {COLUMN_LABELS[id] ?? id}
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

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
        <Badge variant="default" aria-live="polite">
          {filteredCount} of {totalCount} models
        </Badge>
        <span>
          Sorted by{" "}
          <strong className="text-[var(--text)]">
            {COLUMN_LABELS[activeSortId] ?? activeSortId}
          </strong>
          . Click any column header to re-sort.
        </span>
      </div>
    </div>
  );
}
