"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { flexRender } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import type {
  ColumnVisibilityState,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/table-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LeaderboardTableRow } from "./columns";
import {
  CATEGORY_SORT_KEY,
  LEADERBOARD_COLUMN_ORDER,
  getLeaderboardColumns,
  type CategoryId,
} from "./columns";
import {
  applyLeaderboardFilters,
  categoryScore,
  parseFilterParams,
  serializeFilterParams,
  type LeaderboardFilterParams,
} from "./filters";
import { LeaderboardToolbar } from "./toolbar";
import {
  LeaderboardFiltersPanel,
  countActiveFilters,
} from "./filters-panel";
import { LeaderboardMobileList } from "./mobile-card";
import { useLeaderboardData } from "./use-leaderboard-data";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading leaderboard rows">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-12 w-full animate-pulse rounded-[6px] bg-[var(--elevated)]"
        />
      ))}
    </div>
  );
}

function finiteOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function sortValue(row: LeaderboardTableRow, sortId: string): number | null {
  switch (sortId) {
    case "reasoning":
      return finiteOrNull(row.scores.reasoning);
    case "coding":
      return finiteOrNull(row.scores.coding);
    case "math":
      return finiteOrNull(row.scores.math);
    case "knowledge":
      return finiteOrNull(row.scores.knowledge);
    case "vision":
      return finiteOrNull(row.scores.vision);
    case "agentic":
      return finiteOrNull(row.scores.agentic);
    case "speed":
      return finiteOrNull(row.speed?.tps);
    case "inputPrice":
      return finiteOrNull(row.prices.inputPer1M as unknown as number);
    case "outputPrice":
      return finiteOrNull(row.prices.outputPer1M as unknown as number);
    case "context":
      return finiteOrNull(row.context);
    case "released":
      return row.released ? new Date(row.released).getTime() : null;
    case "overall":
    default: {
      const bdx = finiteOrNull((row.scores as { bdxScore?: unknown }).bdxScore);
      if (bdx !== null) return bdx;
      return finiteOrNull(row.scores.overall);
    }
  }
}

export function LeaderboardTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const data = useLeaderboardData();

  const urlKey = searchParams?.toString() ?? "";
  const filters: LeaderboardFilterParams = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => parseFilterParams(searchParams),
    [urlKey],
  );

  const replaceFilters = useCallback(
    (patch: Partial<LeaderboardFilterParams>) => {
      const next: LeaderboardFilterParams = { ...filters, ...patch };
      const sp = serializeFilterParams(next);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const [draftQuery, setDraftQuery] = useState(filters.q);
  const lastUrlQuery = useRef(filters.q);
  useEffect(() => {
    if (filters.q !== lastUrlQuery.current) {
      lastUrlQuery.current = filters.q;
      setDraftQuery(filters.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);
  const debouncedQuery = useDebouncedValue(draftQuery, 250);
  useEffect(() => {
    if (debouncedQuery !== lastUrlQuery.current) {
      lastUrlQuery.current = debouncedQuery;
      replaceFilters({ q: debouncedQuery, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const columns = useMemo(() => getLeaderboardColumns(), []);

  const filtered = useMemo(
    () => applyLeaderboardFilters(data.rows, filters),
    [data.rows, filters],
  );

  const ranked = useMemo(() => {
    const sortId = filters.sort || CATEGORY_SORT_KEY[filters.category] || "overall";
    const dir = filters.dir === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      if (sortId === "model" || sortId === "provider") {
        const av = sortId === "model" ? a.name : a.provider;
        const bv = sortId === "model" ? b.name : b.provider;
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""));
        if (cmp !== 0) return cmp * dir;
      } else if (sortId !== "rank") {
        const av = sortValue(a, sortId);
        const bv = sortValue(b, sortId);
        if (av === null && bv === null) {
          // both missing: fall through to tiebreakers
        } else if (av === null) {
          return 1;
        } else if (bv === null) {
          return -1;
        } else {
          const d = (av - bv) * dir;
          if (d !== 0) return d;
        }
      }
      const cat = categoryScore(b, filters.category) - categoryScore(a, filters.category);
      if (Number.isFinite(cat) && cat !== 0) return cat;
      return a.slug.localeCompare(b.slug);
    });
    return sorted.map((r, i) => ({ ...r, rank: i + 1 }) as LeaderboardTableRow);
  }, [filtered, filters.sort, filters.dir, filters.category]);

  const sorting: SortingState = useMemo(
    () => [{ id: filters.sort, desc: filters.dir !== "asc" }],
    [filters.sort, filters.dir],
  );

  const visibility: ColumnVisibilityState = useMemo(() => {
    const hidden = new Set(
      filters.cols ? filters.cols.split(",").map((s) => s.trim()).filter(Boolean) : [],
    );
    const v: ColumnVisibilityState = {};
    for (const id of LEADERBOARD_COLUMN_ORDER) {
      if (hidden.has(id)) v[id] = false;
    }
    return v;
  }, [filters.cols]);

  const table = useLegacyTable({
    data: ranked,
    columns,
    state: {
      sorting,
      columnVisibility: visibility,
      pagination: {
        pageIndex: Math.max(0, filters.page - 1),
        pageSize: filters.pageSize,
      },
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      if (!first) return;
      const patch: Partial<LeaderboardFilterParams> = {
        sort: first.id,
        dir: first.desc ? "desc" : "asc",
        page: 1,
      };
      const catEntry = Object.entries(CATEGORY_SORT_KEY).find(([, col]) => col === first.id);
      if (catEntry && catEntry[0]) patch.category = catEntry[0] as CategoryId;
      replaceFilters(patch);
    },
    onColumnVisibilityChange: (updater: Updater<ColumnVisibilityState>) => {
      const next =
        typeof updater === "function"
          ? (updater as (old: ColumnVisibilityState) => ColumnVisibilityState)(visibility)
          : (updater as ColumnVisibilityState);
      const hidden = LEADERBOARD_COLUMN_ORDER.filter((id) => next[id] === false);
      replaceFilters({ cols: hidden.join(",") });
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const cur = { pageIndex: Math.max(0, filters.page - 1), pageSize: filters.pageSize };
      const next = typeof updater === "function" ? updater(cur) : updater;
      replaceFilters({ page: next.pageIndex + 1, pageSize: next.pageSize });
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    enableSortingRemoval: false,
  });

  const pageRows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
  const activeCategory = filters.category as CategoryId;
  const activeSortId = sorting[0]?.id ?? "overall";
  const activeFilterCount = countActiveFilters(filters);

  const resetAll = useCallback(() => {
    setDraftQuery("");
    lastUrlQuery.current = "";
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const toggleColumn = useCallback(
    (id: string) => {
      const hidden = new Set(
        filters.cols ? filters.cols.split(",").map((s) => s.trim()).filter(Boolean) : [],
      );
      if (hidden.has(id)) hidden.delete(id);
      else hidden.add(id);
      replaceFilters({ cols: [...hidden].join(",") });
    },
    [filters.cols, replaceFilters],
  );

  return (
    <div className="space-y-4">
      <LeaderboardToolbar
        category={activeCategory}
        activeSortId={activeSortId}
        query={draftQuery}
        onQuery={(q) => setDraftQuery(q)}
        onCategory={(c) =>
          replaceFilters({
            category: c,
            sort: CATEGORY_SORT_KEY[c] ?? "overall",
            dir: "desc",
            page: 1,
          })
        }
        visibility={visibility}
        onToggleColumn={toggleColumn}
        onResetColumns={() => replaceFilters({ cols: "" })}
        exportRows={ranked}
        filteredCount={filtered.length}
        totalCount={data.rows.length}
      />

      <LeaderboardFiltersPanel
        filters={filters}
        allRows={data.rows}
        onChange={replaceFilters}
        onReset={resetAll}
        activeCount={activeFilterCount}
      />

      {!data.isLoading && data.rows.length > 0 ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)]"
        >
          <Badge variant="default">
            {filtered.length} of {data.rows.length} builds
          </Badge>
          <span>
            Ranked by Showdown Score (manual game-build evaluation) on Zombie
            Flamethrower Showdown. Other dimensions show as Not evaluated.
          </span>
          {data.error ? <span>Could not refresh live data; showing stored rows.</span> : null}
        </div>
      ) : null}

      {data.isLoading ? (
        <SkeletonRows />
      ) : data.rows.length === 0 ? (
        <div
          role="alert"
          className="rounded-[10px] border border-dashed border-[var(--border-strong)] p-8 text-center text-[13px] text-[var(--text-secondary)]"
        >
          No leaderboard data available.
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={data.reload}>
              Retry
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-[var(--border-strong)] p-8 text-center">
          <p className="text-[13px] font-medium text-[var(--text)]">
            No models match these filters
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Try widening price / context / date ranges or clearing search.
          </p>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={resetAll}>
              Reset all filters
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="hidden max-h-[68vh] overflow-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)] md:block"
            role="region"
            aria-label="Leaderboard table, scrollable"
          >
            <table className="w-full min-w-[1180px] border-collapse text-left text-[13px]">
              <thead className="sticky top-0 z-20">
                {table.getHeaderGroups().map((hg) => (
                  <tr
                    key={hg.id}
                    className="border-b border-[var(--border)] bg-[var(--surface)]"
                  >
                    {hg.headers.map((header) => {
                      const isModel = header.column.id === "model";
                      const isSorted = activeSortId === header.column.id;
                      const sortable = header.column.getCanSort();
                      return (
                        <th
                          key={header.id}
                          aria-sort={
                            isSorted
                              ? filters.dir === "asc"
                                ? "ascending"
                                : "descending"
                              : sortable
                                ? "none"
                                : undefined
                          }
                          className={
                            (isModel
                              ? "sticky left-0 z-10 bg-[var(--surface)] shadow-[1px_0_0_0_var(--border)] "
                              : "") +
                            "whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]"
                          }
                        >
                          {header.isPlaceholder ? null : sortable ? (
                            <button
                              onClick={header.column.getToggleSortingHandler()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  header.column.getToggleSortingHandler()?.(e as never);
                                }
                              }}
                              aria-label={`Sort by ${header.column.id}`}
                              className={`inline-flex items-center gap-1 rounded px-1 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                                isSorted
                                  ? "text-[var(--text)] underline decoration-[var(--accent)]/60 underline-offset-4"
                                  : "hover:text-[var(--text)]"
                              }`}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <span aria-hidden="true" className="text-[10px]">
                                {isSorted ? (filters.dir === "asc" ? "▲" : "▼") : "↕"}
                              </span>
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr
                    key={row.id}
                    aria-label={`Rank ${row.original.rank}: ${row.original.name}`}
                    className="border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--elevated)]/60"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isModel = cell.column.id === "model";
                      return (
                        <td
                          key={cell.id}
                          className={
                            (isModel
                              ? "sticky left-0 z-10 bg-[var(--surface)] shadow-[1px_0_0_0_var(--border)] "
                              : "") + "px-3 py-2 align-middle"
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <LeaderboardMobileList
            rows={pageRows.map((r) => r.original)}
            activeCategory={activeCategory}
          />

          <nav
            aria-label="Leaderboard pages"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <p
              className="tnum text-xs text-[var(--text-secondary)]"
              aria-live="polite"
            >
              Page {filters.page} of {Math.max(1, pageCount)} · {pageRows.length} row
              {pageRows.length === 1 ? "" : "s"} shown · {filtered.length} matched
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!canPrev}
                aria-label="First page"
              >
                «
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!canPrev}
                aria-label="Previous page"
              >
                ‹ Prev
              </Button>
              <span className="tnum px-1 text-xs text-[var(--text-secondary)]">
                {filters.page} / {Math.max(1, pageCount)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!canNext}
                aria-label="Next page"
              >
                Next ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(Math.max(0, pageCount - 1))}
                disabled={!canNext}
                aria-label="Last page"
              >
                »
              </Button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
