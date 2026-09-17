import type { Metadata } from "next";
import Link from "next/link";
import { DemoDataBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatScore } from "@/lib/format";
import { getAllModelSlugs, getModelPageData } from "@/lib/model-pages-demo";

export const metadata: Metadata = {
  title: "Models | BDX Bench",
  description:
    "Browse demo AI models tracked by BDX Bench with benchmark scores, pricing and speed. Synthetic placeholder data.",
};

export default function ModelsIndexPage() {
  const rows = getAllModelSlugs()
    .map((slug) => getModelPageData(slug))
    .filter((r): r is { ok: true; data: import("@/lib/model-pages-demo").ModelPageData } => r.ok)
    .map((r) => ({
      slug: r.data.model.slug,
      name: r.data.model.name.replace(/ \(demo\)$/i, ""),
      provider: r.data.model.provider,
      family: r.data.model.family,
      score: r.data.model.scores.bdxScore ?? r.data.model.scores.overall,
    }))
    .sort((a, b) => b.score - a.score);
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Models</h1>
          <p className="mt-1 text-sm text-bdx-muted">
            {rows.length} demo model profiles with full score breakdowns. The full 22-model demo
            dataset is ranked on the leaderboard — profiles below are the deep-dive set.
          </p>
        </div>
        <DemoDataBadge />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r, i) => (
          <Link key={r.slug} href={`/models/${r.slug}`}>
            <Card>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm text-bdx-muted">#{i + 1} · {r.provider} · {r.family}</p>
                  <p className="font-semibold">{r.name}</p>
                </div>
                <p className="text-xl font-bold tabular-nums">{formatScore(r.score)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
