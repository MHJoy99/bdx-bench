"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoDataBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MODELS } from "@/lib/data";
import { formatPrice, formatScore, formatTokens, formatTps } from "@/lib/format";
import { bdxBenchScore, blendedPricePer1M } from "@/lib/scores";
import type { Model } from "@/lib/types";
// Local synthetic padding (TODO Agent8 canonical `@/lib/demo-data`):
import {
  DEMO_TOP_MODELS_BY_CATEGORY,
  type HomeModel,
} from "./home-demo-data";

export const TOP_MODEL_TABS = [
  "Overall",
  "Coding",
  "Reasoning",
  "Math",
  "Knowledge",
  "Vision",
  "Long Context",
  "Agentic",
  "Efficiency",
] as const;

type Tab = (typeof TOP_MODEL_TABS)[number];

/** ScoreSnapshot dimension behind each tab. */
function dimForTab(tab: Tab): keyof Model["scores"] {
  switch (tab) {
    case "Coding":
      return "coding";
    case "Reasoning":
      return "reasoning";
    case "Math":
      return "math";
    case "Knowledge":
      return "knowledge";
    case "Vision":
      return "vision";
    case "Long Context":
      return "longContext";
    case "Agentic":
      return "agentic";
    case "Efficiency":
      return "efficiency";
    case "Overall":
    default:
      return "overall";
  }
}

/** No canonical delta formatter exists — homepage-local, demo-safe. */
function formatDelta(v: number): string {
  const a = Math.abs(v).toFixed(1);
  if (v > 0) return `↑${a}`;
  if (v < 0) return `↓${a}`;
  return `→${a}`;
}

interface Row {
  id: string;
  name: string;
  provider: string;
  score: number;
  delta: number;
  priceLabel: string;
  speedLabel: string;
  contextLabel: string;
  demo: boolean;
}

/** Numeric subscore for a tab (guards optional/string snapshot fields). */
function tabScore(m: Model, tab: Tab): number {
  if (tab === "Overall") return m.scores.bdxScore ?? bdxBenchScore(m.scores);
  const v: unknown = m.scores[dimForTab(tab)];
  return typeof v === "number" ? v : 0;
}

function realRows(tab: Tab): Row[] {
  const sorted = [...MODELS].sort((a, b) => tabScore(b, tab) - tabScore(a, tab));
  const mean =
    sorted.reduce((s, m) => s + tabScore(m, tab), 0) / Math.max(1, sorted.length);
  return sorted.map((m) => {
    const score = tabScore(m, tab);
    return {
      id: m.slug,
      name: m.name.replace(/ \(demo\)$/i, ""),
      provider: m.provider,
      score,
      delta: Math.round((score - mean) * 10) / 10,
      priceLabel: formatPrice(
        blendedPricePer1M(m.prices.inputPer1M, m.prices.outputPer1M),
        m.prices.currency,
      ),
      speedLabel: m.speed ? formatTps(m.speed.tps) : "—",
      contextLabel: formatTokens(m.context),
      demo: true, // placeholder dataset is synthetic — always demo-labeled
    };
  });
}

function demoRows(tab: Tab): Row[] {
  const list: HomeModel[] = DEMO_TOP_MODELS_BY_CATEGORY[tab] ?? [];
  return list.map((r) => ({
    id: r.id,
    name: r.name,
    provider: r.provider,
    score: r.score,
    delta: r.delta,
    priceLabel: r.pricePer1M == null ? "—" : `$${r.pricePer1M}/1M`,
    speedLabel: r.speedTps == null ? "—" : `${r.speedTps} tok/s`,
    contextLabel: r.contextK == null ? "—" : `${r.contextK}k`,
    demo: true,
  }));
}

/**
 * TOP MODELS — Client Component (tabs only; table is static markup).
 * Columns: Rank | Model | Provider | Score | Price | Speed | Context.
 * Rows merge the real placeholder leaderboard (getLeaderboard) with clearly
 * labeled synthetic demo padding so every tab shows 5 rows. All DEMO DATA.
 */
export function TopModels() {
  const [tab, setTab] = useState<Tab>("Overall");
  // Overall ordering matches getLeaderboard(): bdxScore desc, then overall.
  const merged = [...realRows(tab), ...demoRows(tab)].slice(0, 5);

  return (
    <section aria-labelledby="home-top-models-heading">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle
              id="home-top-models-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Top models
            </CardTitle>
            <p className="mt-1 text-sm text-bdx-muted">
              Featured rankings preview.{" "}
              <Link
                href="/leaderboard"
                className="text-bdx-accent underline-offset-4 hover:underline"
              >
                Open full leaderboard
              </Link>
            </p>
          </div>
          <DemoDataBadge />
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList
              aria-label="Ranking categories"
              className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0"
            >
              {TOP_MODEL_TABS.map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className={
                    t === tab
                      ? "rounded-full border border-bdx-accent bg-bdx-accent px-3 py-1.5 text-xs font-semibold text-black"
                      : "rounded-full border border-bdx-border bg-bdx-elevated px-3 py-1.5 text-xs text-bdx-muted"
                  }
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {merged.length === 0 ? (
            <div
              role="status"
              className="mt-4 rounded-[10px] border border-dashed border-bdx-border px-6 py-10 text-center"
            >
              <p className="text-sm font-semibold text-bdx-ink">
                No demo models in {tab} yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-bdx-muted">
                This category has no rows in the current demo slice. Try
                another tab or open the full leaderboard.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-[10px] border border-bdx-border">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Top demo models for {tab}. Demo data only.
                </caption>
                <thead>
                  <tr className="border-b border-bdx-border bg-bdx-elevated text-xs uppercase tracking-wider text-bdx-muted">
                    <th scope="col" className="px-4 py-3 font-medium">Rank</th>
                    <th scope="col" className="px-4 py-3 font-medium">Model</th>
                    <th scope="col" className="px-4 py-3 font-medium">Provider</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Score</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Price</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Speed</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Context</th>
                  </tr>
                </thead>
                <tbody>
                  {merged.map((row, i) => (
                    <tr
                      key={`${tab}-${row.id}`}
                      className="border-b border-bdx-border/60 last:border-0 hover:bg-bdx-elevated/60"
                    >
                      <td className="px-4 py-3 tabular-nums text-bdx-muted">
                        #{i + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-bdx-ink">
                        {row.name}
                        {row.demo ? (
                          <span className="ml-2 rounded bg-bdx-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-bdx-accent">
                            demo
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 capitalize text-bdx-muted">
                        {row.provider}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-bdx-ink">
                        {formatScore(row.score)}{" "}
                        <span
                          className={
                            row.delta > 0
                              ? "text-bdx-accent"
                              : row.delta < 0
                                ? "text-red-400"
                                : "text-bdx-muted"
                          }
                        >
                          {formatDelta(row.delta)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-bdx-muted">
                        {row.priceLabel}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-bdx-muted">
                        {row.speedLabel}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-bdx-muted">
                        {row.contextLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-bdx-muted">
            Example: #1 Demo Model X 92.4 ↑1.2 — illustrative demo row, not a
            live result.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
