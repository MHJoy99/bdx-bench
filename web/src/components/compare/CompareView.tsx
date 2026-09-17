"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { CompareTable } from "./CompareTable";
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

const PLAY_LINKS: Record<string, string> = {
  "muse-spark-1-3": "/play/pyro-vs-zombies",
  "gemini-3-8-flash": "/play/pyroclasm-inferno",
};

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
        <h1 className="text-2xl font-bold tracking-tight">Compare models</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Side-by-side metrics for up to {COMPARE_MAX_MODELS} models. URLs are shareable:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">/compare?{COMPARE_URL_PARAM}=a,b</code> —{" "}
          opening a shared link reproduces the exact selection. Per-metric highlights only; no overall winner is
          declared.
        </p>
      </header>

      <CompareTray catalog={catalog} selected={selected} onChange={handleChange} max={COMPARE_MAX_MODELS} />

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

      {models.length > 0 ? (
        <div className="flex flex-wrap gap-3 text-sm">
          {models.map((m) => {
            const play = PLAY_LINKS[m.slug];
            return play ? (
              <Link key={m.slug} href={play} className="underline underline-offset-4">
                Play {m.name}
              </Link>
            ) : null;
          })}
        </div>
      ) : null}

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
            Add models from the tray above — or start from the current pair. Selections persist in this browser and sync to
            the URL.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => handleChange(["muse-spark-1-3", "gemini-3-8-flash"])}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F7A00] dark:focus-visible:outline-[#B8FF5A]"
            >
              Compare Spark vs Flash
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
