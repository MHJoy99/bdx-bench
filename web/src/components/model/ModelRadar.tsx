import { formatScore } from "@/lib/format";
import type { Model } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";

/**
 * Compact capability RADAR (hand-rolled SVG — no ECharts here).
 * Owner: SUB-AGENT 5/10 MODEL PAGES.
 * TODO(Agent7/charts): replace with the shared `@/components/charts/*`
 * radar when it lands. Keep the textual fallback below in any replacement.
 */

const AXES = [
  { key: "reasoning", label: "Reasoning" },
  { key: "coding", label: "Coding" },
  { key: "math", label: "Math" },
  { key: "knowledge", label: "Knowledge" },
  { key: "vision", label: "Vision" },
  { key: "agentic", label: "Agentic" },
  { key: "efficiency", label: "Efficiency" },
] as const;

type AxisKey = (typeof AXES)[number]["key"];

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 28;

function pointFor(index: number, total: number, value01: number): [number, number] {
  // Start at top (-90deg), go clockwise.
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = Math.max(0, Math.min(1, value01)) * RADIUS;
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

export function ModelRadar({ model }: { model: Model }) {
  const values: Record<AxisKey, number> = {
    reasoning: model.scores.reasoning,
    coding: model.scores.coding,
    math: model.scores.math,
    knowledge: model.scores.knowledge,
    vision: model.scores.vision,
    agentic: model.scores.agentic,
    efficiency: model.scores.efficiency ?? model.scores.overall,
  };

  const polygon = AXES.map((a, i) =>
    pointFor(i, AXES.length, values[a.key] / 100).join(","),
  ).join(" ");

  const gridRings = [0.25, 0.5, 0.75, 1];

  return (
    <section aria-labelledby="model-radar-heading">
      <h2
        id="model-radar-heading"
        className="text-lg font-semibold text-foreground"
      >
        Capability radar <DemoBadge />
      </h2>

      <div className="mt-3 flex justify-center rounded-lg border border-border bg-card p-4">
        <svg
          role="img"
          aria-label={`Demo capability radar for ${model.name}: ${AXES.map((a) => `${a.label} ${formatScore(values[a.key])}`).join(", ")}.`}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-56 w-56"
        >
          {gridRings.map((ring) => (
            <polygon
              key={ring}
              points={AXES.map((_, i) => pointFor(i, AXES.length, ring).join(",")).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.18}
              strokeWidth={1}
            />
          ))}
          {AXES.map((a, i) => {
            const [x, y] = pointFor(i, AXES.length, 1);
            const [lx, ly] = pointFor(i, AXES.length, 1.22);
            return (
              <g key={a.key}>
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.18}
                  strokeWidth={1}
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill="currentColor"
                  opacity={0.75}
                >
                  {a.label}
                </text>
              </g>
            );
          })}
          <polygon
            points={polygon}
            fill="#B8FF5A"
            fillOpacity={0.22}
            stroke="#B8FF5A"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {AXES.map((a, i) => {
            const [x, y] = pointFor(i, AXES.length, values[a.key] / 100);
            return <circle key={a.key} cx={x} cy={y} r={2.5} fill="#B8FF5A" />;
          })}
        </svg>
      </div>

      {/* Textual fallback: readable without the chart, and for screen readers. */}
      <details className="mt-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px] leading-5">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          View radar values as a list
        </summary>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          {AXES.map((a) => (
            <li key={a.key} className="flex justify-between gap-4">
              <span>{a.label}</span>
              <span className="font-semibold">{formatScore(values[a.key])}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
