"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { AuditFindings } from "@/components/artifact/artifact-card";
import {
  DimensionBars,
  FlipList,
  RankChangeEdge,
  ScoreReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/polish-motion";
import { AUDIT_DIMENSIONS, type AuditEntry } from "@/lib/audit-data";
import { MOTION_STAGGER } from "@/lib/motion-tokens";
import { COMPARE_MAX_MODELS, buildCompareHref } from "@/components/compare/compare-data";
import {
  AUDIT_ROUND_LABEL,
  COLUMN_DIMENSION,
  CATEGORY_SORT_KEY,
  LEADERBOARD_COLUMN_LABELS,
  LEADERBOARD_COLUMN_ORDER,
  altEntryFor,
  auditEntryFor,
  dimPointsFor,
  getLeaderboardColumns,
  showdownScore,
  type CategoryId,
  type LeaderboardTableRow,
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
  DEFAULT_EVIDENCE_FILTERS,
  LeaderboardFiltersPanel,
  countActiveFilters,
  countEvidenceFilters,
  type EvidenceFilterState,
} from "./filters-panel";
import { LeaderboardMobileList } from "./mobile-card";
import { useLeaderboardData } from "./use-leaderboard-data";

/* ------------------------------------------------------------------ *
 * Dense grid geometry. The table is a data tool: fixed evidence tracks
 * so columns align, one optional fr track for the model name.
 * ------------------------------------------------------------------ */

const COLUMN_TRACKS: Record<string, string> = {
  rank: "44px",
  model: "minmax(220px, 1.5fr)",
  provider: "104px",
  overall: "120px",
  evidence: "238px",
  dimControls: "66px",
  dimCombat: "66px",
  dimContent: "66px",
  dimAudio: "66px",
  dimPolish: "66px",
  reasoning: "104px",
  coding: "100px",
  math: "100px",
  knowledge: "104px",
  vision: "100px",
  agentic: "100px",
  speed: "104px",
  inputPrice: "108px",
  outputPrice: "112px",
  context: "84px",
  released: "104px",
};

/** Columns pinned to the left edge while the table scrolls horizontally. */
const STICKY_CLASS: Record<string, string> = {
  rank: "sticky left-0 z-10 bg-inherit shadow-[1px_0_0_0_var(--border)]",
  model: "sticky left-11 z-10 bg-inherit shadow-[1px_0_0_0_var(--border)]",
};

const GRID_CELL =
  "px-2.5 py-2 min-w-0 flex items-center";

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
  const dimKey = COLUMN_DIMENSION[sortId];
  if (dimKey) return dimPointsFor(row.slug, dimKey, showdownScore(row));
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

  /* ---- evidence state (expanded audit trail, compare queue, evidence filters) ---- */

  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const toggleExpand = useCallback((slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const [compareSel, setCompareSel] = useState<readonly string[]>([]);
  const toggleCompare = useCallback((slug: string) => {
    setCompareSel((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= COMPARE_MAX_MODELS) return prev;
      return [...prev, slug];
    });
  }, []);
  const clearCompare = useCallback(() => setCompareSel([]), []);

  const [evidence, setEvidence] = useState<EvidenceFilterState>(
    DEFAULT_EVIDENCE_FILTERS,
  );
  const patchEvidence = useCallback((patch: Partial<EvidenceFilterState>) => {
    setEvidence((prev) => ({ ...prev, ...patch }));
  }, []);
  const resetEvidence = useCallback(
    () => setEvidence(DEFAULT_EVIDENCE_FILTERS),
    [],
  );
  const evidenceActiveCount = countEvidenceFilters(evidence);

  const columns = useMemo(
    () =>
      getLeaderboardColumns({
        expanded,
        onToggleExpand: toggleExpand,
        compareSelection: compareSel,
        onToggleCompare: toggleCompare,
      }),
    [expanded, toggleExpand, compareSel, toggleCompare],
  );

  /* ---- filter + rank ---- */

  const filtered = useMemo(() => {
    const base = applyLeaderboardFilters(data.rows, filters);
    return base.filter((r) => {
      const score = showdownScore(r);
      const entry = auditEntryFor(r.slug, score);
      if (evidence.audit === "audited" && !entry) return false;
      if (evidence.audit === "unaudited" && entry) return false;
      const failing = entry
        ? entry.findings.filter((f) => f.severity === "high").length
        : 0;
      if (evidence.status === "failing" && failing < 1) return false;
      if (evidence.status === "clean" && failing > 0) return false;
      if (
        evidence.minScore > 0 &&
        !(score !== null && score >= evidence.minScore)
      ) {
        return false;
      }
      if (evidence.touch === "ready" && !entry?.mobileReady) return false;
      if (evidence.touch === "none" && entry?.mobileReady) return false;
      return true;
    });
  }, [data.rows, filters, evidence]);

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

  const visibleColumnIds = useMemo(
    () => LEADERBOARD_COLUMN_ORDER.filter((id) => visibility[id] !== false),
    [visibility],
  );
  const visibleColumnSet = useMemo(
    () => new Set<string>(visibleColumnIds),
    [visibleColumnIds],
  );
  const gridTemplate = useMemo(
    () => visibleColumnIds.map((id) => COLUMN_TRACKS[id] ?? "auto").join(" "),
    [visibleColumnIds],
  );

  // Tight entrance stagger: a long page never feels sluggish because the total
  // delay is capped at MOTION_STAGGER.maxTotal.
  const entranceStagger = useMemo(
    () =>
      Math.min(
        MOTION_STAGGER.row,
        MOTION_STAGGER.maxTotal / Math.max(1, pageRows.length - 1),
      ),
    [pageRows.length],
  );

  const rowBySlug = useMemo(() => {
    const m = new Map<string, (typeof pageRows)[number]>();
    for (const r of pageRows) m.set(r.original.slug, r);
    return m;
  }, [pageRows]);

  /* ---- FLIP: physical row movement on real user-initiated reordering ----
   * The dataset is static, so nothing here invents a change. `flipOrder` is
   * held in state and only re-created when the visible order or the set of
   * expanded rows actually changes, which is what makes FlipList re-measure
   * and invert. Rows that genuinely moved get a one-shot left-border flash. */

  const pageIds = useMemo(() => pageRows.map((r) => r.original.slug), [pageRows]);
  const orderKey = pageIds.join("|");
  const expansionKey = useMemo(
    () => [...expanded].sort().join("|"),
    [expanded],
  );

  const [flipOrder, setFlipOrder] = useState<string[]>(pageIds);
  const [moveToken, setMoveToken] = useState(0);
  const [movedSlugs, setMovedSlugs] = useState<ReadonlySet<string>>(() => new Set());
  const prevOrder = useRef<readonly string[] | null>(null);

  const flipIndex = useMemo(() => {
    const m = new Map<string, number>();
    flipOrder.forEach((id, i) => m.set(id, i));
    return m;
  }, [flipOrder]);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setFlipOrder([...pageIds]);
    const before = prevOrder.current;
    prevOrder.current = pageIds;
    // No flash on first paint or on the initial data load: there is no
    // previous ordering to have moved away from.
    if (!before || before.length === 0 || pageIds.length === 0) return;
    const beforeIndex = new Map(before.map((s, i) => [s, i] as const));
    const moved = pageIds.filter(
      (s, i) => beforeIndex.has(s) && beforeIndex.get(s) !== i,
    );
    if (moved.length === 0) return;
    setMoveToken((t) => t + 1);
    setMovedSlugs(new Set(moved));
  }, [orderKey, expansionKey]);

  const resetAll = useCallback(() => {
    setDraftQuery("");
    lastUrlQuery.current = "";
    resetEvidence();
    router.replace(pathname, { scroll: false });
  }, [pathname, router, resetEvidence]);

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

  const matchedBuilds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of filtered) {
      const e = auditEntryFor(r.slug, showdownScore(r));
      if (e) ids.add(e.buildId);
    }
    return ids.size;
  }, [filtered]);

  const totalBuilds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of data.rows) {
      const e = auditEntryFor(r.slug, showdownScore(r));
      if (e) ids.add(e.buildId);
    }
    return ids.size;
  }, [data.rows]);

  const renderEvidencePanel = (entry: AuditEntry, slug: string, score: number | null) => {
    const alt = altEntryFor(slug, score);
    return (
      <div
        role="cell"
        aria-colindex={1}
        className="col-span-full border-y border-[var(--border)] bg-[var(--elevated)] px-2.5 py-3"
      >
        <div className="grid max-w-[1040px] gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              Per-dimension evidence · {AUDIT_DIMENSIONS.length} dimensions × 20 pts
            </p>
            <DimensionBars dims={entry.dims} className="mt-2" />
            <p className="mt-3 text-[12px] leading-[17px] text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text)]">
                Verified implemented in {entry.buildName}
              </span>{" "}
              · source audit {entry.generated} · build{" "}
              <span className="font-mono">{entry.buildId}</span> ·{" "}
              {entry.mobileReady ? "touch ready" : "no touch support"}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {entry.implements.map((line) => (
                <li
                  key={line}
                  className="flex gap-1.5 text-[11px] leading-[16px] text-[var(--text-secondary)]"
                >
                  <span aria-hidden="true" className="text-[var(--accent-ink)]">
                    +
                  </span>
                  <span className="min-w-0">{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              Showdown Score{" "}
              <ScoreReveal
                value={entry.total}
                decimals={2}
                className="text-[13px] font-semibold text-[var(--text)]"
              />{" "}
              / 100 · audited {entry.generated}
            </p>
            {alt ? (
              <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                Also shipped{" "}
                <span className="font-mono">{alt.buildId}</span> ({alt.buildName}) ·{" "}
                <span className="tnum">{alt.total.toFixed(2)}</span> / 100 ·{" "}
                {alt.findings.length} findings
              </p>
            ) : null}
          </div>
          <div className="min-w-0">
            <AuditFindings findings={entry.findings} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <a
                href={entry.playPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--accent-border)] bg-[var(--accent-muted)] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--accent-ink)] transition-colors hover:border-[var(--accent)]"
              >
                Inspect the build
              </a>
              <a
                href={`/models/${slug}`}
                className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--border)] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
              >
                Full evaluation
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        compareCount={compareSel.length}
        compareHref={buildCompareHref(compareSel)}
        onClearCompare={clearCompare}
      />

      <LeaderboardFiltersPanel
        filters={filters}
        allRows={data.rows}
        onChange={replaceFilters}
        onReset={resetAll}
        activeCount={countActiveFilters(filters)}
        evidence={evidence}
        evidenceActiveCount={evidenceActiveCount}
        onEvidenceChange={patchEvidence}
        onResetEvidence={resetEvidence}
      />

      {!data.isLoading && data.rows.length > 0 ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)]"
        >
          <Badge variant="default">
            {filtered.length} of {data.rows.length} models
          </Badge>
          <Badge variant="outline">
            {matchedBuilds} of {totalBuilds} builds
          </Badge>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            {AUDIT_ROUND_LABEL}
          </span>
          <span className="min-w-0">
            Every score is a strict implementation-level audit of one playable
            build. Open a row for the verified findings behind the number.
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
            Try widening the score floor, clearing the evidence filters, or
            resetting the search.
          </p>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={resetAll}>
              Reset all filters
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop evidence table. Div grid + ARIA table roles so the row
              list can be FLIP-animated (a real <tr> list cannot host the
              transform-based primitive). */}
          <div
            className="hidden max-h-[70vh] overflow-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)] md:block"
            role="region"
            aria-label="Leaderboard table, scrollable"
          >
            <StaggerGroup gap={entranceStagger}>
              <div
                role="table"
                aria-label="Showdown Score evidence table"
                aria-rowcount={ranked.length}
                aria-colcount={visibleColumnIds.length}
                className="min-w-[1180px]"
              >
                <div role="rowgroup">
                  <div
                    role="row"
                    className="sticky top-0 z-20 grid items-center gap-x-2 border-b border-[var(--border)] bg-[var(--surface)] px-0 shadow-[0_1px_0_0_var(--border)]"
                    style={{ gridTemplateColumns: gridTemplate }}
                  >
                    {table.getHeaderGroups().map((hg) =>
                      hg.headers.map((header) => {
                        const id = header.column.id;
                        if (!visibleColumnSet.has(id)) return null;
                        const isSorted = activeSortId === id;
                        const sortable = header.column.getCanSort();
                        return (
                          <div
                            key={header.id}
                            role="columnheader"
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
                              (STICKY_CLASS[id] ?? "") +
                              " min-w-0 flex-col items-start gap-0.5 px-2.5 py-2 text-left"
                            }
                          >
                            {sortable ? (
                              <button
                                onClick={header.column.getToggleSortingHandler()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    header.column.getToggleSortingHandler()?.(e as never);
                                  }
                                }}
                                aria-label={`Sort by ${LEADERBOARD_COLUMN_LABELS[id] ?? id}`}
                                className={`inline-flex items-center gap-1 rounded px-1 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                                  isSorted
                                    ? "text-[var(--text)] underline decoration-[var(--accent)]/60 underline-offset-4"
                                    : "text-[var(--text-tertiary)] hover:text-[var(--text)]"
                                }`}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                                <span aria-hidden="true" className="text-[10px]">
                                  {isSorted
                                    ? filters.dir === "asc"
                                      ? "▲"
                                      : "▼"
                                    : "↕"}
                                </span>
                              </button>
                            ) : (
                              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                              </span>
                            )}
                            {id === "overall" ? (
                              <ScoreScaleCaption />
                            ) : id === "dimControls" ? (
                              <span className="font-mono text-[9px] uppercase leading-[12px] tracking-wider text-[var(--text-tertiary)]">
                                20 pts
                              </span>
                            ) : null}
                          </div>
                        );
                      }),
                    )}
                  </div>
                </div>

                <div role="rowgroup">
                  <FlipList
                    className="contents"
                    ids={pageIds}
                    order={flipOrder}
                    itemClassName="w-full"
                    renderItem={(slug) => {
                      const cells = rowBySlug.get(slug);
                      if (!cells) return null;
                      const row = cells.original;
                      const cellById = new Map(
                        cells.getVisibleCells().map((c) => [c.column.id, c]),
                      );
                      const score = showdownScore(row);
                      const entry = auditEntryFor(row.slug, score);
                      const isOpen = expanded.has(slug);
                      const moved = movedSlugs.has(slug);
                      const visualIndex = flipIndex.get(slug) ?? 0;
                      return (
                        <StaggerItem y={4} className="w-full">
                          <div
                            role="row"
                            data-testid="leaderboard-row"
                            aria-label={`Rank ${row.rank}: ${row.name}`}
                            className={`relative grid w-full items-center gap-x-2 border-b border-[var(--border)]/70 transition-colors duration-150 hover:bg-[var(--elevated)] ${
                              isOpen || visualIndex % 2 === 0
                                ? "bg-[var(--surface)]"
                                : "bg-[var(--elevated)]"
                            }`}
                            style={{ gridTemplateColumns: gridTemplate }}
                          >
                            {visibleColumnIds.map((id) => {
                              const cell = cellById.get(id);
                              if (!cell) return null;
                              return (
                                <div
                                  key={id}
                                  role="cell"
                                  className={`${STICKY_CLASS[id] ?? ""} ${GRID_CELL}`}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </div>
                              );
                            })}
                            {moved ? <RankChangeEdge token={moveToken} /> : null}
                            {isOpen && entry
                              ? renderEvidencePanel(entry, row.slug, score)
                              : null}
                          </div>
                        </StaggerItem>
                      );
                    }}
                  />
                </div>
              </div>
            </StaggerGroup>
          </div>

          <LeaderboardMobileList
            rows={pageRows.map((r) => r.original)}
            order={flipOrder}
            movedSlugs={movedSlugs}
            moveToken={moveToken}
            expanded={expanded}
            onToggleExpand={toggleExpand}
            compareSelection={compareSel}
            onToggleCompare={toggleCompare}
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

/** The scale, stated at the column it explains. Precision creates trust. */
function ScoreScaleCaption() {
  return (
    <Link
      href="/methodology"
      title="Showdown Score v2: 5 dimensions x 20 pts, zero for absent features"
      className="font-mono text-[9px] font-normal uppercase leading-[12px] tracking-wider text-[var(--text-tertiary)] underline-offset-2 hover:text-[var(--text-secondary)] hover:underline"
    >
      v2 · 5 dims × 20 pts
    </Link>
  );
}
