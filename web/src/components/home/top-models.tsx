"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MODELS } from "@/lib/data";
import { formatScore } from "@/lib/format";

export const TOP_MODEL_TABS = ["Overall", "Showdown"] as const;

type Tab = (typeof TOP_MODEL_TABS)[number];

const SHOWDOWN_SCORES: Record<string, number> = {
  "deepseek-v4-1-flash": 94,
  "muse-spark-1-3": 92,
  "gpt-6-sol": 91.5,
  "gpt-5-6-luna": 91,
  "gpt-6-luna": 89.5,
  "gemini-3-8-flash": 88,
};

const SHOWDOWN_LABEL = "Showdown Score (manual game-build evaluation)";

function showdownOf(slug: string, fallbackOverall: number): number | null {
  const v = SHOWDOWN_SCORES[slug];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return Number.isFinite(fallbackOverall) ? fallbackOverall : null;
}

interface Row {
  id: string;
  name: string;
  provider: string;
  score: number | null;
}

function rowsFor(): Row[] {
  return [...MODELS]
    .map((m) => {
      const rec = m as unknown as { scores?: { overall?: unknown } };
      const overall =
        typeof rec.scores?.overall === "number" ? rec.scores.overall : NaN;
      return {
        id: m.slug,
        name: m.name,
        provider: m.provider,
        score: showdownOf(m.slug, overall),
      };
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

export function TopModels() {
  const [tab, setTab] = useState<Tab>("Overall");
  const rows = rowsFor();

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
              Ranked by {SHOWDOWN_LABEL}.{" "}
              <Link
                href="/leaderboard"
                className="text-bdx-accent underline-offset-4 hover:underline"
              >
                Open full leaderboard
              </Link>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList
              aria-label="Ranking views"
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

          {rows.length === 0 ? (
            <div
              role="status"
              className="mt-4 rounded-[10px] border border-dashed border-bdx-border px-6 py-10 text-center"
            >
              <p className="text-sm font-semibold text-bdx-ink">
                No models yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-bdx-muted">
                The dataset is empty. Check back after the next round.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-[10px] border border-bdx-border">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Top models by Showdown Score.
                </caption>
                <thead>
                  <tr className="border-b border-bdx-border bg-bdx-elevated text-xs uppercase tracking-wider text-bdx-muted">
                    <th scope="col" className="px-4 py-3 font-medium">Rank</th>
                    <th scope="col" className="px-4 py-3 font-medium">Model</th>
                    <th scope="col" className="px-4 py-3 font-medium">Provider</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Showdown Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.id}
                      className="border-b border-bdx-border/60 last:border-0 hover:bg-bdx-elevated/60"
                    >
                      <td className="px-4 py-3 tabular-nums text-bdx-muted">
                        #{i + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-bdx-ink">
                        <Link
                          href={`/models/${row.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize text-bdx-muted">
                        {row.provider}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-bdx-ink">
                        {row.score === null ? "Not evaluated" : formatScore(row.score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-bdx-muted">
            Other dimensions show as Not evaluated until measured.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
