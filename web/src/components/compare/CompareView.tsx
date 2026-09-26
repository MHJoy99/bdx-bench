"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Play } from "lucide-react";
import { MODELS } from "@/lib/data";
import type { Model } from "@/lib/types";
import {
  COMPARE_MAX_MODELS,
  COMPARE_URL_PARAM,
  buildCompareHref,
  buildShareUrl,
  loadTray,
  parseModelsParam,
  saveTray,
} from "./compare-data";
import { CompareTray } from "./CompareTray";
import { CompareTable, auditForSlug } from "./CompareTable";
import { CompareCharts } from "./CompareCharts";
import { CompareSkeleton } from "./CompareSkeleton";
import VotePanel from "@/components/interactive/VotePanel";
import Comments from "@/components/interactive/Comments";

function CommunityShowdown() {
  return (
    <section aria-labelledby="community-showdown-heading" className="space-y-4">
      <h2 id="community-showdown-heading" className="text-lg font-semibold tracking-tight">
        Community showdown
      </h2>
      <VotePanel matchId="m-001" />
      <Comments scope="match" id="m-001" />
    </section>
  );
}

export interface CompareViewProps {
  initialModels: string[];
}

function selectModels(slugs: readonly string[]): Model[] {
  const wanted = parseModelsParam([...slugs]);
  const bySlug = new Map(MODELS.map((m) => [m.slug, m]));
  const out: Model[] = [];
  for (const slug of wanted) {
    const m = bySlug.get(slug);
    if (m) out.push(m);
  }
  return out;
}

export function CompareView({ initialModels }: CompareViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(() => parseModelsParam(initialModels));
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const lastPushed = useRef<string>("");

  useEffect(() => {
    if (initialModels.length === 0) {
      const saved = loadTray();
      if (saved.length > 0) {
        setSelected(saved);
      } else {
        setSelected(["muse-spark-1-3", "gemini-3-8-flash"]);
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveTray(selected);
    const href = buildCompareHref(selected);
    if (lastPushed.current !== href) {
      lastPushed.current = href;
      router.replace(href, { scroll: false });
    }
  }, [selected, hydrated, router]);

  const handleChange = useCallback((slugs: string[]) => {
    setSelected(parseModelsParam(slugs));
    setCopied(false);
  }, []);

  const models = useMemo(() => selectModels(selected), [selected]);

  const catalog = useMemo(() => [...MODELS], []);

  const unknownSlugs = useMemo(() => {
    const known = new Set(catalog.map((m) => m.slug));
    return selected.filter((s) => !known.has(s));
  }, [selected, catalog]);

  const shareHref = useMemo(() => buildCompareHref(selected), [selected]);

  // The playable build is part of the comparison, so surface it up front
  // rather than hiding the artifact behind a score.
  const builds = useMemo(
    () =>
      models
        .map((m) => ({ model: m, entry: auditForSlug(m) }))
        .filter((b) => b.entry),
    [models],
  );

  const copyLink = useCallback(async () => {
    const url =
      typeof window !== "undefined" ? buildShareUrl(selected, window.location.origin) : buildCompareHref(selected);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        return;
      }
      throw new Error("clipboard unavailable");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    }
  }, [selected]);

  const showEmpty = hydrated && selected.length < 2;
  const loading = !hydrated;

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Compare builds</h1>
        <p className="max-w-3xl text-[13px] text-muted-foreground">
          Up to {COMPARE_MAX_MODELS} builds side by side, cell by cell across
          the five audited Showdown Score dimensions — 20 points each, zero for a
          feature that is not implemented and reachable. This page is built for
          trade-offs: the matrix states each cell&apos;s own gap to the strongest
          value in its row, and nothing here declares an overall winner.
        </p>
        <p className="max-w-3xl text-[12px] text-muted-foreground">
          URLs are shareable:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            /compare?{COMPARE_URL_PARAM}=a,b
          </code>{" "}
          — opening a shared link reproduces the exact selection.
        </p>
      </header>

      <CompareTray catalog={catalog} selected={selected} onChange={handleChange} max={COMPARE_MAX_MODELS} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyLink}
          disabled={selected.length === 0}
          aria-live="polite"
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[13px] font-medium transition-[background-color,border-color,transform] active:scale-[0.98] hover:bg-[var(--elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? <Check className="size-4 text-[var(--accent-ink)]" /> : <Copy className="size-4 text-[var(--text-secondary)]" />}
          <span>{copied ? "Link copied ✓" : "Copy share link"}</span>
        </button>
        <span className="truncate font-mono text-[11px] text-muted-foreground">{shareHref}</span>
      </div>

      {builds.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Builds in this comparison">
          {builds.map(({ model, entry }) => (
            <li key={model.slug}>
              <Link
                href={entry?.playPath ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[11px] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent-ink)]"
              >
                <Play className="size-3" aria-hidden="true" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                  {entry?.buildId}
                </span>
                <span className="truncate">{entry?.buildName}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {unknownSlugs.length > 0 && selected.length >= 2 ? (
        <p role="note" className="rounded-lg border border-border bg-muted p-3 text-[13px] text-muted-foreground">
          Unknown model slug{unknownSlugs.length === 1 ? "" : "s"} ignored:{" "}
          <code className="font-mono text-xs">{unknownSlugs.join(", ")}</code>
        </p>
      ) : null}

      {loading ? (
        <CompareSkeleton />
      ) : showEmpty ? (
        <section
          data-testid="empty-state"
          aria-labelledby="compare-empty-heading"
          className="rounded-[10px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center"
        >
          <h2 id="compare-empty-heading" className="text-base font-semibold">
            Select at least two models
          </h2>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-muted-foreground">
            Add models from the tray above — or start from a known pair. Selections
            persist in this browser and sync to the URL.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => handleChange(["muse-spark-1-3", "gemini-3-8-flash"])}
              className="rounded-md border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F7A00] dark:focus-visible:outline-[#B8FF5A]"
            >
              Add Muse Spark 1.3 and Gemini 3.8 Flash
            </button>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          <CompareTable models={models} />
          <CompareCharts models={models} />
          <CommunityShowdown />
        </div>
      )}
    </div>
  );
}
