import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const SHOWDOWN_SCORES = [
  { label: "Muse Spark 1.3", slug: "muse-spark-1-3", score: 92 },
  { label: "DeepSeek V4.1 Flash", slug: "deepseek-v4-1-flash", score: 94 },
  { label: "Gemini 3.8 Flash", slug: "gemini-3-8-flash", score: 88 },
];

export function CategoryLeaders() {
  return (
    <section aria-labelledby="home-category-leaders-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="home-category-leaders-heading"
          className="text-lg font-semibold tracking-tight text-bdx-ink"
        >
          Category leaders
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SHOWDOWN_SCORES.map((c) => (
          <Card key={c.slug}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-bdx-muted">
                Zombie Flamethrower Showdown
              </p>
              <p className="mt-2 truncate font-semibold text-bdx-ink">
                <Link href={`/models/${c.slug}`} className="underline-offset-4 hover:underline">
                  {c.label}
                </Link>
              </p>
              <p className="mt-2 text-xl font-bold tabular-nums text-bdx-accent">
                {c.score.toFixed(1)}
              </p>
              <p className="mt-1 text-[11px] text-bdx-muted">
                Showdown Score (manual game-build evaluation)
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs text-bdx-muted">
        Other categories show as Not evaluated until measured.
      </p>
    </section>
  );
}
