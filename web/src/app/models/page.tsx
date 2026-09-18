import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BuildsGallery } from "@/components/home";
import { MODELS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Models",
  description:
    "Profiles for four verified game-build models with Showdown Scores and instant play links.",
};

const SHOWDOWN_SCORES: Record<string, number> = {
  "deepseek-v4-1-flash": 94,
  "muse-spark-1-3": 92,
  "gpt-5-6-luna": 91,
  "gemini-3-8-flash": 88,
};

const PLAY_LINKS: Record<string, string> = {
  "muse-spark-1-3": "/play/pyro-vs-zombies",
  "deepseek-v4-1-flash": "/play/pyre-burn-horde",
  "gpt-5-6-luna": "/play/firebreak-night-shift",
  "gemini-3-8-flash": "/play/pyroclasm-inferno",
};

function showdownFor(slug: string, fallback: number): string {
  const v = SHOWDOWN_SCORES[slug] ?? fallback;
  return Number.isFinite(v) ? v.toFixed(1) : "Not evaluated";
}

export default function ModelsIndexPage() {
  const rows = [...MODELS]
    .map((m) => {
      const rec = m as unknown as {
        slug: string;
        name: string;
        provider: string;
        family: string;
        scores?: { overall?: unknown; bdxScore?: unknown };
      };
      const rawOverall =
        typeof rec.scores?.overall === "number" ? rec.scores.overall : NaN;
      const rawBdx =
        typeof rec.scores?.bdxScore === "number" ? rec.scores.bdxScore : NaN;
      const fallback = Number.isFinite(rawBdx)
        ? (rawBdx as number)
        : Number.isFinite(rawOverall)
          ? (rawOverall as number)
          : NaN;
      return {
        slug: m.slug,
        name: m.name,
        provider: m.provider,
        family: m.family,
        scoreText: showdownFor(m.slug, fallback),
        play: PLAY_LINKS[m.slug],
      };
    })
    .sort((a, b) => {
      const sa = SHOWDOWN_SCORES[a.slug] ?? 0;
      const sb = SHOWDOWN_SCORES[b.slug] ?? 0;
      return sb - sa;
    });

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Models</h1>
        <p className="mt-1 text-sm text-bdx-muted">
          {rows.length} evaluated builds. Scores shown are Showdown Score
          (manual game-build evaluation). Other dimensions show as Not
          evaluated until measured.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r, i) => (
          <Card key={r.slug}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm text-bdx-muted">
                  #{i + 1} · {r.provider} · {r.family}
                </p>
                <Link
                  href={`/models/${r.slug}`}
                  className="font-semibold underline-offset-4 hover:underline"
                >
                  {r.name}
                </Link>
                {r.play ? (
                  <p className="mt-1 text-sm">
                    <Link
                      href={r.play}
                      className="text-bdx-accent underline-offset-4 hover:underline"
                    >
                      Play this build
                    </Link>
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xl font-bold tabular-nums">{r.scoreText}</p>
                <p className="text-[11px] text-bdx-muted">Showdown Score</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <BuildsGallery />
    </main>
  );
}
