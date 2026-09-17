"use client";

import { DemoDataBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrends } from "@/lib/data";

/**
 * CAPABILITY TREND — Client Component (SVG line chart, no chart dep).
 * Renders the canonical trend series (getTrends): average BDX Bench Score
 * with model counts. Placeholder data — always DEMO-labeled.
 */
export function CapabilityTrend() {
  const series = getTrends();
  const W = 560;
  const H = 220;
  const PAD = 32;
  const vals = series.map((s) => s.avgBdxScore);
  const min = Math.min(...vals, 70) - 2;
  const max = Math.max(...vals, 80) + 2;
  const x = (i: number) => PAD + (i / Math.max(1, series.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);
  const line = series.map((s, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(s.avgBdxScore)}`).join(" ");

  return (
    <section aria-labelledby="home-trend-heading">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle
              id="home-trend-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Capability trend
            </CardTitle>
            <p className="mt-1 text-sm text-bdx-muted">
              Average BDX Bench Score over time — illustrative trajectory, not
              a live result.
            </p>
          </div>
          <DemoDataBadge />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg
              role="img"
              aria-label="Demo capability trend chart"
              viewBox={`0 0 ${W} ${H}`}
              className="min-w-[520px] w-full rounded-lg bg-bdx-bg"
            >
              <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#333D47" />
              <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#333D47" />
              <path d={line} fill="none" stroke="#B8FF5A" strokeWidth={2.5} />
              {series.map((s, i) => (
                <g key={s.date}>
                  <circle cx={x(i)} cy={y(s.avgBdxScore)} r={4} fill="#B8FF5A" />
                  <text x={x(i) - 10} y={H - 10} fill="#6B7684" fontSize="11">
                    {s.date.slice(0, 7)}
                  </text>
                  <text
                    x={x(i) - 14}
                    y={y(s.avgBdxScore) - 10}
                    fill="#F2F5F7"
                    fontSize="11"
                  >
                    {s.avgBdxScore.toFixed(1)} · n={s.modelCount}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-bdx-muted">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-0.5 w-6 bg-bdx-accent" /> Avg score (demo)
            </span>
            <span>n = models in placeholder set per month</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
