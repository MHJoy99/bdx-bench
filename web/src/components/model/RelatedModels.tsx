import Link from "next/link";
import { formatScore } from "@/lib/format";
import { getRelatedModels } from "@/lib/model-pages-demo";
import { DemoBadge } from "./DemoBadge";

/**
 * Related models: same family first, then nearest demo composite.
 * Owner: SUB-AGENT 5/10 MODEL PAGES.
 */

export function RelatedModels({ slug }: { slug: string }) {
  const related = getRelatedModels(slug, 3);
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="model-related-heading">
      <h2
        id="model-related-heading"
        className="text-lg font-semibold text-foreground"
      >
        Related models <DemoBadge />
      </h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {related.map((m) => (
          <li key={m.slug}>
            <Link
              href={`/models/${m.slug}`}
              className="block rounded-lg border border-border bg-card p-3 hover:border-bdx-accent/50"
            >
              <span className="font-medium text-foreground">{m.name}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {m.family} · BDX (demo){" "}
                <span className="font-mono">{formatScore(m.bdxScore)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
