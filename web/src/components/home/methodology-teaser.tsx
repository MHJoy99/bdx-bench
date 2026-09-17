import Link from "next/link";
import { MethodologyVersionTag } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BDX_WEIGHTS } from "@/lib/scores";

/**
 * METHODOLOGY teaser — Server Component.
 * Weights read from the SINGLE scoring contract (@/lib/scores BDX_WEIGHTS),
 * never hard-coded. Links to full methodology; never claims live scoring.
 */
export function MethodologyTeaser() {
  const top = (Object.entries(BDX_WEIGHTS) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const points = [
    {
      title: "Transparent methodology",
      body: `Fixed suites and identical prompts. Top weights: ${top
        .map(([k, w]) => `${k} ${Math.round(w * 100)}%`)
        .join(" · ")}.`,
    },
    {
      title: "Reproducible scoring",
      body: "Points-weighted averages with auditable per-task checks.",
    },
    {
      title: "Honest modes",
      body: "Mock runs are always labeled demo; live runs require a key and are never mixed silently.",
    },
  ];
  return (
    <section aria-labelledby="home-method-heading">
      <Card>
        <CardContent className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_2fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="home-method-heading"
                className="text-lg font-semibold tracking-tight text-bdx-ink"
              >
                How we measure
              </h2>
              <MethodologyVersionTag />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-bdx-muted">
              BDX Bench runs small, deterministic suites with binary checks and
              points-weighted scoring. Read the full rules before citing a
              number.
            </p>
            <Link
              href="/methodology"
              className="mt-4 inline-block text-sm font-semibold text-bdx-accent underline-offset-4 hover:underline"
            >
              Read methodology →
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {points.map((p) => (
              <li
                key={p.title}
                className="rounded-[10px] border border-bdx-border bg-bdx-bg p-4"
              >
                <p className="text-sm font-semibold text-bdx-ink">{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-bdx-muted">
                  {p.body}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
