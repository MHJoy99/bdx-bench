"use client";

export function ModelHistoryChart({
  slug,
  modelName,
}: {
  slug: string;
  modelName: string;
}) {
  const score =
    slug === "muse-spark-1-3"
      ? 92
      : slug === "deepseek-v4-1-flash"
        ? 94
        : slug === "space-bunny-free"
          ? 93.5
        : slug === "gpt-6-sol"
          ? 91.5
        : slug === "gpt-5-6-luna"
          ? 91
          : slug === "gemini-pro-agent"
            ? 90.5
          : slug === "gpt-6-luna"
            ? 89.5
          : slug === "gemini-3-8-flash"
            ? 88
            : null;
  return (
    <section aria-labelledby="model-history-heading">
      <h2
        id="model-history-heading"
        className="text-lg font-semibold uppercase tracking-wide text-foreground"
      >
        Model history
      </h2>
      <div className="mt-3 rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm font-semibold text-foreground">
          {score === null ? "No history yet" : `Single snapshot: ${score.toFixed(1)}`}
        </p>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-muted-foreground">
          {modelName} has one evaluated round (September 2026). History will
          appear here once a second round is published.
        </p>
      </div>
    </section>
  );
}
