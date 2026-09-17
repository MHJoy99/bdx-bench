import type { ReactNode } from "react";
import { formatDate, formatRelative } from "@/lib/format";
import { METHODOLOGY_VERSION } from "@/lib/model-pages-demo";
import type { ModelPageData } from "@/lib/model-pages-demo";
import { DemoBadge } from "./DemoBadge";

/**
 * Provenance & freshness: eval date, source, version, runs, methodology.
 * Owner: SUB-AGENT 5/10 MODEL PAGES.
 */

export function Provenance({ data }: { data: ModelPageData }) {
  const { model, source } = data;
  const items: Array<{ label: string; value: ReactNode }> = [
    {
      label: "Evaluated",
      value: (
        <>
          <time dateTime={model.scores.evaluatedAt}>
            {formatDate(model.scores.evaluatedAt)}
          </time>{" "}
          <span className="text-muted-foreground">
            ({formatRelative(model.scores.evaluatedAt)})
          </span>
        </>
      ),
    },
    {
      label: "Source",
      value: (
        <span title={`Source kind: ${source.kind}; id: ${source.id}`}>
          {source.label}
        </span>
      ),
    },
    {
      label: "Snapshot version",
      value: (
        <span className="font-mono">
          {model.scores.benchmark ?? "bdx-bench-demo-v1"} · {model.id}
        </span>
      ),
    },
    {
      label: "Demo runs",
      value: <span className="font-mono">{data.demoRuns} mock runs</span>,
    },
    {
      label: "Methodology",
      value: <span className="font-mono">methodology {METHODOLOGY_VERSION}</span>,
    },
    {
      label: "Retrieved",
      value: (
        <time dateTime={data.retrievedAt}>{formatDate(data.retrievedAt)}</time>
      ),
    },
  ];

  return (
    <section aria-labelledby="model-provenance-heading">
      <h2
        id="model-provenance-heading"
        className="text-lg font-semibold text-foreground"
      >
        Provenance &amp; freshness <DemoBadge />
      </h2>
      <dl className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-border bg-card p-3 text-[13px] leading-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-[11px] uppercase leading-4 tracking-wide text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-0.5 text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">
        All figures on this page are synthetic demo placeholders rendered from
        local mock data. No live gateway calls, no vendor quotes, no real
        evaluation scores. See{" "}
        <a href="/methodology" className="underline underline-offset-2">
          Methodology
        </a>{" "}
        for how real runs are scored.
      </p>
    </section>
  );
}
