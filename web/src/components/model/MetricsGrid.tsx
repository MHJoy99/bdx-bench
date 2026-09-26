import {
  formatPrice,
  formatScore,
  formatTokens,
  formatTps,
} from "@/lib/format";
import { scoreLabel } from "@/lib/scores";
import type { Model } from "@/lib/types";

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function scoreOr(v: unknown): string {
  const n = num(v);
  return n === null ? "Not evaluated" : formatScore(n);
}

const SHOWDOWN_SCORES: Record<string, number> = {
  "space-bunny-free": 91,
  "deepseek-v4-1-flash": 80,
  "gpt-5-6-luna": 62,
  "gpt-6-sol": 58,
  "muse-spark-1-3": 52,
  "gpt-6-luna": 51,
  "gemini-3-8-flash": 43,
  "gemini-pro-agent": 24
};

const SHOWDOWN_LABEL = "Showdown Score (manual game-build evaluation)";

export function MetricsGrid({ model }: { model: Model }) {
  const rec = model as unknown as {
    scores?: Record<string, unknown>;
    prices?: { inputPer1M?: unknown; outputPer1M?: unknown; currency?: string };
    speed?: { tps?: unknown };
    context?: unknown;
  };
  const showdown = SHOWDOWN_SCORES[model.slug] ?? num(rec.scores?.["overall"]);
  const showdownText =
    typeof showdown === "number" && Number.isFinite(showdown)
      ? `${formatScore(showdown)} · ${scoreLabel(showdown)}`
      : "Not evaluated";

  const metrics: { label: string; value: string }[] = [
    { label: "Showdown Score", value: showdownText },
    { label: "Reasoning", value: scoreOr(rec.scores?.["reasoning"]) },
    { label: "Coding", value: scoreOr(rec.scores?.["coding"]) },
    { label: "Math", value: scoreOr(rec.scores?.["math"]) },
    { label: "Knowledge", value: scoreOr(rec.scores?.["knowledge"]) },
    { label: "Vision", value: scoreOr(rec.scores?.["vision"]) },
    { label: "Agentic", value: scoreOr(rec.scores?.["agentic"]) },
    {
      label: "Speed",
      value:
        num(rec.speed?.tps) === null
          ? "Not measured"
          : formatTps(num(rec.speed?.tps) as number),
    },
    {
      label: "Input price",
      value:
        num(rec.prices?.inputPer1M) === null
          ? "Not measured"
          : formatPrice(
              num(rec.prices?.inputPer1M) as number,
              typeof rec.prices?.currency === "string" ? rec.prices.currency : "USD",
            ),
    },
    {
      label: "Output price",
      value:
        num(rec.prices?.outputPer1M) === null
          ? "Not measured"
          : formatPrice(
              num(rec.prices?.outputPer1M) as number,
              typeof rec.prices?.currency === "string" ? rec.prices.currency : "USD",
            ),
    },
    {
      label: "Context",
      value:
        num(rec.context) === null
          ? "Not measured"
          : formatTokens(num(rec.context) as number),
    },
  ];

  return (
    <section aria-labelledby="model-metrics-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="model-metrics-heading"
          className="text-lg font-semibold text-foreground"
        >
          Key metrics
        </h2>
        <p className="text-xs text-muted-foreground">{SHOWDOWN_LABEL}</p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-border bg-card p-3"
          >
            <dt className="text-[11px] uppercase leading-4 tracking-wide text-muted-foreground">
              {m.label}
            </dt>
            <dd className="mt-0.5 font-mono text-sm font-semibold text-foreground">
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
