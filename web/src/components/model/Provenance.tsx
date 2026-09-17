import { formatDate } from "@/lib/format";
import { getBenchmarkEvaluations } from "@/lib/data";

const SHOWDOWN_SLUG = "zombie-flamethrower-showdown";

export function Provenance({ modelSlug }: { modelSlug: string }) {
  const evals = getBenchmarkEvaluations(SHOWDOWN_SLUG).filter(
    (e) => e.modelSlug === modelSlug,
  );
  const latest = evals[0]?.evaluatedAt ?? "2026-09-12";

  const items: { label: string; value: string }[] = [
    { label: "Evaluated", value: formatDate(latest) },
    { label: "Suite", value: "Zombie Flamethrower Showdown" },
    { label: "Method", value: "Manual game-build review" },
    { label: "Round", value: "September 2026" },
  ];

  return (
    <section aria-labelledby="model-provenance-heading">
      <h2
        id="model-provenance-heading"
        className="text-lg font-semibold text-foreground"
      >
        Provenance and freshness
      </h2>
      <dl className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-border bg-card p-3 text-[13px] leading-5 sm:grid-cols-2 lg:grid-cols-4">
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
        Scores cover the September 2026 game-build round. See{" "}
        <a href="/methodology" className="underline underline-offset-2">
          Methodology
        </a>{" "}
        for scoring rules and limitations.
      </p>
    </section>
  );
}
