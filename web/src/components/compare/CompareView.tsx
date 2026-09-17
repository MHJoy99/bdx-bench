"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Model } from "@/lib/types";
import {
  COMPARE_MAX_MODELS,
  COMPARE_URL_PARAM,
  DEMO_COMPARE_MODELS,
  buildCompareHref,
  buildShareUrl,
  fetchCompareModels,
  loadTray,
  parseModelsParam,
  saveTray,
  type CompareSource,
} from "./compare-data";
import { CompareTray } from "./CompareTray";
import { CompareTable } from "./CompareTable";
import { CompareCharts } from "./CompareCharts";
import { CompareSkeleton } from "./CompareSkeleton";

export interface CompareViewProps {
  /** Slugs parsed server-side from `?models=` (max 4). */
  initialModels: string[];
}

/**
 * SUB-AGENT 6/10 COMPARE — owned: /compare client view.
 *
 * State precedence: URL `?models=` wins when present (shareable links
 * reproduce exactly); otherwise the tray restores localStorage on mount.
 * Every change is persisted to localStorage AND pushed to the URL via
 * `router.replace` (no history spam). Data resolves via
 * `fetchCompareModels` (`/api/compare?models=` with DEMO fallback).
 */
export function CompareView({ initialModels }: CompareViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(() => parseModelsParam(initialModels));
  const [hydrated, setHydrated] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [source, setSource] = useState<CompareSource>("demo");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const lastPushed = useRef<string>("");

  // Mount: URL wins when present, else restore the persisted tray.
  useEffect(() => {
    if (initialModels.length === 0) {
      const saved = loadTray();
      if (saved.length > 0) setSelected(saved);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist + sync URL on every change (single writer — see CompareTray docs).
  useEffect(() => {
    if (!hydrated) return;
    saveTray(selected);
    const href = buildCompareHref(selected);
    if (lastPushed.current !== href) {
      lastPushed.current = href;
      router.replace(href, { scroll: false });
    }
  }, [selected, hydrated, router]);

  // Resolve selection to models (<2 → empty state, no fetch).
  useEffect(() => {
    if (!hydrated) return;
    if (selected.length < 2) {
      setModels([]);
      setSource("demo");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCompareModels(selected).then((res) => {
      if (cancelled) return;
      setModels(res.models);
      setSource(res.source);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selected, hydrated]);

  const handleChange = useCallback((slugs: string[]) => {
    setSelected(parseModelsParam(slugs));
    setCopied(false);
  }, []);

  // Picker catalog: fetched rows first, then any demo rows not yet present.
  const catalog = useMemo(() => {
    const seen = new Set(models.map((m) => m.slug));
    return [...models, ...DEMO_COMPARE_MODELS.filter((m) => !seen.has(m.slug))];
  }, [models]);

  const unknownSlugs = useMemo(() => {
    const known = new Set(catalog.map((m) => m.slug));
    return selected.filter((s) => !known.has(s));
  }, [selected, catalog]);

  const shareHref = useMemo(() => buildCompareHref(selected), [selected]);

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

  const demo = source === "demo";
  const showEmpty = hydrated && !loading && selected.length < 2;

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Compare models</h1>
          <span
            className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            title={demo ? "Illustrative fixtures until live data lands" : "Resolved from the live API"}
          >
            {demo ? "Demo" : "Live API"}
          </span>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Side-by-side metrics for up to {COMPARE_MAX_MODELS} models. URLs are shareable:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">/compare?{COMPARE_URL_PARAM}=a,b</code> —{" "}
          opening a shared link reproduces the exact selection. Per-metric highlights only; no overall winner is
          declared.
        </p>
      </header>

      <CompareTray catalog={catalog} selected={selected} onChange={handleChange} max={COMPARE_MAX_MODELS} demo={demo} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyLink}
          disabled={selected.length === 0}
          aria-live="polite"
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F7A00] disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:outline-[#B8FF5A]"
        >
          {copied ? "Link copied ✓" : "Copy share link"}
        </button>
        <span className="truncate font-mono text-xs text-muted-foreground">{shareHref}</span>
      </div>

      {unknownSlugs.length > 0 && selected.length >= 2 ? (
        <p role="note" className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
          Unknown model slug{unknownSlugs.length === 1 ? "" : "s"} ignored:{" "}
          <code className="font-mono text-xs">{unknownSlugs.join(", ")}</code>
        </p>
      ) : null}

      {loading ? (
        <CompareSkeleton />
      ) : showEmpty ? (
        <section
          aria-labelledby="compare-empty-heading"
          className="rounded-lg border border-dashed border-border bg-card p-8 text-center"
        >
          <h2 id="compare-empty-heading" className="text-base font-semibold">
            Select at least two models
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Add models from the tray above — or start from a demo pair. Selections persist in this browser and sync to
            the URL.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => handleChange(["gpt-5-6-luna", "muse-spark-1-3"])}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F7A00] dark:focus-visible:outline-[#B8FF5A]"
            >
              Compare Luna vs Spark (Demo)
            </button>
            <button
              type="button"
              onClick={() => handleChange(["gemini-3-7-flash", "deepseek-v4-1-flash"])}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F7A00] dark:focus-visible:outline-[#B8FF5A]"
            >
              Compare Flash models (Demo)
            </button>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          <CompareTable models={models} demo={demo} />
          <CompareCharts models={models} demo={demo} />
        </div>
      )}
    </div>
  );
}
