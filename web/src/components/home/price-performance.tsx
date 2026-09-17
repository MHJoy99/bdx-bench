import Link from "next/link";
import { DemoDataBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MODELS } from "@/lib/data";
import { bdxBenchScore, blendedPricePer1M } from "@/lib/scores";
// Local synthetic padding (TODO Agent8 canonical `@/lib/demo-data`):
import { DEMO_PRICE_POINTS } from "./home-demo-data";

/**
 * INTELLIGENCE VS PRICE preview — Server Component.
 * Pure SVG scatter (no chart dep). Real placeholder models via canonical
 * scoring (bdxBenchScore + blendedPricePer1M) plus synthetic demo padding.
 * All points DEMO DATA. Links out; never duplicates /compare logic.
 */
export function PricePerformance() {
  const real = MODELS.map((m) => ({
    id: m.slug,
    name: m.name,
    score: m.scores.bdxScore ?? bdxBenchScore(m.scores),
    pricePer1M: blendedPricePer1M(m.prices.inputPer1M, m.prices.outputPer1M),
  }));
  const pts = [...real, ...DEMO_PRICE_POINTS].slice(0, 7);
  const W = 560;
  const H = 260;
  const PAD = 36;
  const maxPrice = Math.max(...pts.map((p) => p.pricePer1M), 8);
  const minScore = Math.min(...pts.map((p) => p.score), 80) - 2;
  const maxScore = Math.max(...pts.map((p) => p.score), 95) + 1;

  const x = (price: number) => PAD + (price / maxPrice) * (W - PAD * 2);
  const y = (score: number) =>
    H - PAD - ((score - minScore) / (maxScore - minScore)) * (H - PAD * 2);

  return (
    <section aria-labelledby="home-price-heading">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle
              id="home-price-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Intelligence vs. price
            </CardTitle>
            <p className="mt-1 text-sm text-bdx-muted">
              Higher is smarter, left is cheaper. Preview only —{" "}
              <Link
                href="/compare"
                className="text-bdx-accent underline-offset-4 hover:underline"
              >
                compare models
              </Link>
            </p>
          </div>
          <DemoDataBadge />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg
              role="img"
              aria-label="Demo scatter of model score versus price"
              viewBox={`0 0 ${W} ${H}`}
              className="min-w-[520px] w-full rounded-lg bg-bdx-bg"
            >
              <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#333D47" />
              <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#333D47" />
              <text x={PAD} y={H - 10} fill="#6B7684" fontSize="11">
                $/1M → cheaper left
              </text>
              <text x={8} y={PAD - 8} fill="#6B7684" fontSize="11">
                score ↑
              </text>
              {pts.map((p) => (
                <g key={p.id}>
                  <circle cx={x(p.pricePer1M)} cy={y(p.score)} r={7} fill="#B8FF5A" opacity={0.9} />
                  <text
                    x={x(p.pricePer1M) + 10}
                    y={y(p.score) + 4}
                    fill="#F2F5F7"
                    fontSize="11"
                  >
                    {p.name} · {p.score.toFixed(1)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <p className="mt-3 text-xs text-bdx-muted">
            Demo points only. Pricing and scores are synthetic placeholders for
            layout.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
