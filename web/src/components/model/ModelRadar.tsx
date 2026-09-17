import { formatScore } from "@/lib/format";
import type { Model } from "@/lib/types";

const AXES = [
  { key: "reasoning", label: "Reasoning" },
  { key: "coding", label: "Coding" },
  { key: "math", label: "Math" },
  { key: "knowledge", label: "Knowledge" },
  { key: "vision", label: "Vision" },
  { key: "agentic", label: "Agentic" },
] as const;

type AxisKey = (typeof AXES)[number]["key"];

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 28;

function pointFor(index: number, total: number, value01: number): [number, number] {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = Math.max(0, Math.min(1, value01)) * RADIUS;
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function ModelRadar({ model }: { model: Model }) {
  const rec = model.scores as unknown as Record<string, unknown>;
  const values: Record<AxisKey, number | null> = {
    reasoning: num(rec["reasoning"]),
    coding: num(rec["coding"]),
    math: num(rec["math"]),
    knowledge: num(rec["knowledge"]),
    vision: num(rec["vision"]),
    agentic: num(rec["agentic"]),
  };
  const hasAny = Object.values(values).some((v) => v !== null);
  const polygon = hasAny
    ? AXES.map((a, i) =>
        pointFor(i, AXES.length, (values[a.key] ?? 0) / 100).join(","),
      ).join(" ")
    : "";

  const gridRings = [0.25, 0.5, 0.75, 1];

  return (
    <section aria-labelledby="model-radar-heading">
      <h2
        id="model-radar-heading"
        className="text-lg font-semibold text-foreground"
      >
        Capability radar
      </h2>

      {hasAny ? (
        <div className="mt-3 flex justify-center rounded-lg border border-border bg-card p-4">
          <svg
            role="img"
            aria-label={`Capability radar for ${model.name}`}
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
              const v = values[a.key] ?? 0;
              const [x, y] = pointFor(i, AXES.length, v / 100);
              return <circle key={a.key} cx={x} cy={y} r={2.5} fill="#B8FF5A" />;
            })}
          </svg>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Capability dimensions are Not evaluated for this build.
        </p>
      )}

      <details className="mt-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px] leading-5">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          View radar values as a list
        </summary>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          {AXES.map((a) => (
            <li key={a.key} className="flex justify-between gap-4">
              <span>{a.label}</span>
              <span className="font-semibold">
                {values[a.key] === null ? "Not evaluated" : formatScore(values[a.key] as number)}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
