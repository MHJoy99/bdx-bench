import type { ReactNode } from "react";
import type { Model } from "@/lib/types";
import { formatPrice, formatScore, formatTps } from "@/lib/format";
import { blendedPricePer1M } from "@/lib/scores";

export interface CompareChartsProps {
  models: readonly Model[];
  /** Show the DEMO badge (demo fixtures until live data lands). */
  demo?: boolean;
}

/**
 * SUB-AGENT 6/10 COMPARE — owned: comparison visualizations.
 *
 * These are DATA-WIRED SVG/CSS PLACEHOLDERS, not a chart library — do not
 * extend them into one. TODO(Agent7): replace each `data-chart` section with
 * the matching `@/components/charts/*` component, keeping the same props
 * (`models`) and the same data derivations noted per section:
 * - data-chart="radar": 6-dim capability profile (reasoning/coding/math/
 *   knowledge/vision/agentic, 0–100). Suggested: `@/components/charts/Radar`.
 * - data-chart="grouped-bars": same 6 dims, grouped bars. Suggested:
 *   `@/components/charts/GroupedBars`.
 * - data-chart="price": blended USD/1M per model (0.75·in + 0.25·out).
 *   Suggested: `@/components/charts/PriceBars`.
 * - data-chart="speed": tok/s per model (+TTFT caption). Suggested:
 *   `@/components/charts/SpeedBars`.
 * - data-chart="quality-vs-price": scatter overall vs blended price (log x).
 *   Suggested: `@/components/charts/Scatter`.
 * - data-chart="quality-vs-speed": scatter overall vs tok/s (linear x).
 *   Suggested: `@/components/charts/Scatter`.
 *
 * Accessibility: the CompareTable is the screen-reader source of truth; each
 * chart visual is `aria-hidden` with an adjacent sr-only summary. NEVER add an
 * overall-winner callout to any chart.
 */

const PALETTE = ["#B8FF5A", "#7DD3FC", "#FFC53D", "#FF7A72"] as const;

function palette(i: number): string {
  return PALETTE[i % PALETTE.length] ?? "#B8FF5A";
}

const RADAR_DIMS = [
  { key: "reasoning", label: "Reason" },
  { key: "coding", label: "Code" },
  { key: "math", label: "Math" },
  { key: "knowledge", label: "Know" },
  { key: "vision", label: "Vision" },
  { key: "agentic", label: "Agent" },
] as const;

type RadarKey = (typeof RADAR_DIMS)[number]["key"];

function radarValue(m: Model, key: RadarKey): number {
  const v = m.scores[key];
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0;
}

function polar(cx: number, cy: number, r: number, deg: number): readonly [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
}

function ChartCard({
  id,
  title,
  todo,
  summary,
  children,
  chart,
}: {
  id: string;
  title: string;
  todo: string;
  summary: string;
  children: ReactNode;
  chart: string;
}) {
  return (
    <section aria-labelledby={id} data-chart={chart} className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={id} className="text-sm font-semibold">
          {title}
        </h3>
        <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Placeholder
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">TODO(Agent7): {todo}</p>
      <div aria-hidden="true" className="mt-3">
        {children}
      </div>
      <p className="sr-only">{summary}</p>
    </section>
  );
}

function Legend({ models }: { models: readonly Model[] }) {
  return (
    <ul aria-hidden="true" className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {models.map((m, i) => (
        <li key={m.slug} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: palette(i) }} />
          <span className="font-medium text-foreground">{i + 1}</span> {m.name}
        </li>
      ))}
    </ul>
  );
}

function RadarPlaceholder({ models }: { models: readonly Model[] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const R = 92;
  const n = RADAR_DIMS.length;
  const rings = [25, 50, 75, 100];
  const angle = (i: number) => (360 / n) * i;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block max-w-full" role="presentation">
      {rings.map((pct) => {
        const pts = RADAR_DIMS.map((_, i) => {
          const [x, y] = polar(cx, cy, (R * pct) / 100, angle(i));
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");
        return <polygon key={pct} points={pts} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeWidth={1} />;
      })}
      {RADAR_DIMS.map((d, i) => {
        const [x2, y2] = polar(cx, cy, R, angle(i));
        const [lx, ly] = polar(cx, cy, R + 18, angle(i));
        return (
          <g key={d.key}>
            <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={0.18} strokeWidth={1} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="currentColor" opacity={0.7}>
              {d.label}
            </text>
          </g>
        );
      })}
      {models.map((m, mi) => {
        const pts = RADAR_DIMS.map((d, i) => {
          const [x, y] = polar(cx, cy, (R * radarValue(m, d.key)) / 100, angle(i));
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");
        const color = palette(mi);
        return (
          <g key={m.slug}>
            <polygon points={pts} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={2} strokeLinejoin="round" />
            {RADAR_DIMS.map((d, i) => {
              const [x, y] = polar(cx, cy, (R * radarValue(m, d.key)) / 100, angle(i));
              return <circle key={d.key} cx={x} cy={y} r={2.5} fill={color} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

function GroupedBarsPlaceholder({ models }: { models: readonly Model[] }) {
  return (
    <div className="space-y-3">
      {RADAR_DIMS.map((d) => (
        <div key={d.key}>
          <p className="mb-1 text-xs font-medium text-muted-foreground">{d.label} (0–100)</p>
          <div className="space-y-1.5">
            {models.map((m, mi) => {
              const v = radarValue(m, d.key);
              return (
                <div key={m.slug} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-center text-[11px] font-semibold">{mi + 1}</span>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: palette(mi) }} />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[11px]">{formatScore(v)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function PriceBarsPlaceholder({ models }: { models: readonly Model[] }) {
  const prices = models.map((m) => blendedPricePer1M(m.prices.inputPer1M, m.prices.outputPer1M));
  const max = Math.max(0, ...prices);
  return (
    <div className="space-y-2">
      {models.map((m, i) => {
        const p = prices[i] ?? 0;
        const width = max > 0 ? (p / max) * 100 : 0;
        return (
          <div key={m.slug}>
            <div className="mb-0.5 flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate font-medium">
                {i + 1}. {m.name}
              </span>
              <span className="shrink-0 font-mono">{formatPrice(p, m.prices.currency)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: palette(i) }} />
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-[11px] text-muted-foreground">Blended = 0.75·input + 0.25·output per 1M. Lower is better.</p>
    </div>
  );
}

function SpeedBarsPlaceholder({ models }: { models: readonly Model[] }) {
  const speeds = models.map((m) => {
    const t = m.speed?.tps ?? m.scores.speed ?? null;
    return typeof t === "number" && Number.isFinite(t) ? t : 0;
  });
  const max = Math.max(0, ...speeds);
  return (
    <div className="space-y-2">
      {models.map((m, i) => {
        const t = speeds[i] ?? 0;
        const width = max > 0 ? (t / max) * 100 : 0;
        const ttft = m.speed?.ttftMs;
        return (
          <div key={m.slug}>
            <div className="mb-0.5 flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate font-medium">
                {i + 1}. {m.name}
              </span>
              <span className="shrink-0 font-mono">
                {formatTps(t)}
                {typeof ttft === "number" && Number.isFinite(ttft) ? ` · ${Math.round(ttft)} ms TTFT` : ""}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: palette(i) }} />
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-[11px] text-muted-foreground">Higher tok/s is better; TTFT (first token) lower is better.</p>
    </div>
  );
}

function ScatterPlaceholder({
  models,
  xLabel,
  getX,
  logX,
}: {
  models: readonly Model[];
  xLabel: string;
  getX: (m: Model) => number | null;
  logX: boolean;
}) {
  const W = 340;
  const H = 220;
  const padL = 40;
  const padR = 14;
  const padT = 12;
  const padB = 30;
  const xs = models.map(getX);
  const ys = models.map((m) => m.scores.overall);
  const validX = xs.filter((x): x is number => typeof x === "number" && Number.isFinite(x) && x > 0);
  const validY = ys.filter((y) => Number.isFinite(y));
  const minY = validY.length > 0 ? Math.min(...validY) : 0;
  const maxY = validY.length > 0 ? Math.max(...validY) : 100;
  const loY = Math.min(minY - 3, maxY - 5);
  const hiY = 100;
  const toLog = (x: number) => Math.log10(Math.max(x, 1e-9));
  const loLX = validX.length > 0 ? Math.min(...validX.map(toLog)) : 0;
  const hiLX = validX.length > 0 ? Math.max(...validX.map(toLog)) : 1;
  const loX = validX.length > 0 ? Math.min(...validX) : 0;
  const hiX = validX.length > 0 ? Math.max(...validX) : 1;

  const px = (x: number | null): number => {
    if (x === null || !Number.isFinite(x)) return padL + (W - padL - padR) / 2;
    const t = logX ? (hiLX > loLX ? (toLog(x) - loLX) / (hiLX - loLX) : 0.5) : hiX > loX ? (x - loX) / (hiX - loX) : 0.5;
    return padL + t * (W - padL - padR);
  };
  const py = (y: number): number => {
    const t = hiY > loY ? (y - loY) / (hiY - loY) : 0.5;
    return H - padB - t * (H - padT - padB);
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block max-w-full" role="presentation">
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="currentColor" strokeOpacity={0.25} />
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="currentColor" strokeOpacity={0.25} />
      <text x={padL + (W - padL - padR) / 2} y={H - 8} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.7}>
        {xLabel}
        {logX ? " (log scale)" : ""}
      </text>
      <text
        x={12}
        y={padT + (H - padT - padB) / 2}
        textAnchor="middle"
        fontSize={10}
        fill="currentColor"
        opacity={0.7}
        transform={`rotate(-90 12 ${padT + (H - padT - padB) / 2})`}
      >
        Overall
      </text>
      {models.map((m, i) => {
        const cx = px(xs[i] ?? null);
        const cy = py(Number.isFinite(m.scores.overall) ? m.scores.overall : loY);
        return (
          <g key={m.slug}>
            <circle cx={cx} cy={cy} r={9} fill={palette(i)} fillOpacity={0.9} />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700} fill="#101600">
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function CompareCharts({ models, demo = true }: CompareChartsProps) {
  if (models.length < 2) return null;
  const names = models.map((m) => m.name).join(", ");
  const radarSummary = `Radar placeholder for ${names} across reasoning, coding, math, knowledge, vision, and agentic scores. See the table for exact values.`;
  const barsSummary = `Grouped bar placeholder for ${names} across the same six capability scores. See the table for exact values.`;
  const priceSummary = `Price bar placeholder for ${names}: ${models
    .map((m) => `${m.name} ${formatPrice(blendedPricePer1M(m.prices.inputPer1M, m.prices.outputPer1M), m.prices.currency)}`)
    .join("; ")}. Lower is better.`;
  const speedSummary = `Speed bar placeholder for ${names}: ${models
    .map((m) => {
      const t = m.speed?.tps ?? m.scores.speed ?? null;
      return `${m.name} ${typeof t === "number" ? formatTps(t) : "unknown"}`;
    })
    .join("; ")}. Higher is better.`;
  const qpSummary = `Quality versus price scatter placeholder for ${names}, overall score against blended price per 1M tokens.`;
  const qsSummary = `Quality versus speed scatter placeholder for ${names}, overall score against output tokens per second.`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Visual comparison</h2>
        {demo ? (
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Demo
          </span>
        ) : null}
        <span className="flex-1" />
        <p className="text-[11px] text-muted-foreground">Same data as the table above. Points are numbered per model.</p>
      </div>
      <Legend models={models} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          id="compare-chart-radar"
          title="Radar — capability profile"
          chart="radar"
          todo="replace with `@/components/charts/Radar` (props: `models`); feed reasoning/coding/math/knowledge/vision/agentic (0–100)."
          summary={radarSummary}
        >
          <RadarPlaceholder models={models} />
        </ChartCard>
        <ChartCard
          id="compare-chart-bars"
          title="Grouped bars — capability scores"
          chart="grouped-bars"
          todo="replace with `@/components/charts/GroupedBars` (props: `models`); same six dims as the radar."
          summary={barsSummary}
        >
          <GroupedBarsPlaceholder models={models} />
        </ChartCard>
        <ChartCard
          id="compare-chart-price"
          title="Price — blended $/1M"
          chart="price"
          todo="replace with `@/components/charts/PriceBars` (props: `models`); value = blendedPricePer1M(input, output) from `@/lib/scores`."
          summary={priceSummary}
        >
          <PriceBarsPlaceholder models={models} />
        </ChartCard>
        <ChartCard
          id="compare-chart-speed"
          title="Speed — tok/s"
          chart="speed"
          todo="replace with `@/components/charts/SpeedBars` (props: `models`); value = speed.tps with TTFT caption."
          summary={speedSummary}
        >
          <SpeedBarsPlaceholder models={models} />
        </ChartCard>
        <ChartCard
          id="compare-chart-qp"
          title="Quality vs price"
          chart="quality-vs-price"
          todo="replace with `@/components/charts/Scatter` (props: `models`); x = blended $/1M (log), y = scores.overall."
          summary={qpSummary}
        >
          <ScatterPlaceholder
            models={models}
            xLabel="Blended $/1M"
            logX
            getX={(m) => blendedPricePer1M(m.prices.inputPer1M, m.prices.outputPer1M)}
          />
        </ChartCard>
        <ChartCard
          id="compare-chart-qs"
          title="Quality vs speed"
          chart="quality-vs-speed"
          todo="replace with `@/components/charts/Scatter` (props: `models`); x = speed.tps (linear), y = scores.overall."
          summary={qsSummary}
        >
          <ScatterPlaceholder
            models={models}
            xLabel="tok/s"
            logX={false}
            getX={(m) => {
              const t = m.speed?.tps ?? m.scores.speed ?? null;
              return typeof t === "number" && Number.isFinite(t) ? t : null;
            }}
          />
        </ChartCard>
      </div>
    </div>
  );
}
