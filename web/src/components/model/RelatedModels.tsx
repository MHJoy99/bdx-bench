import Link from "next/link";
import { MODELS } from "@/lib/data";

const SHOWDOWN_SCORES: Record<string, number> = {
  "deepseek-v4-1-flash": 94,
  "space-bunny-free": 93.5,
  "muse-spark-1-3": 92,
  "gpt-6-sol": 91.5,
  "gpt-5-6-luna": 91,
  "gemini-pro-agent": 90.5,
  "gpt-6-luna": 89.5,
  "gemini-3-8-flash": 88,
};

export function RelatedModels({ slug }: { slug: string }) {
  const related = MODELS.filter((m) => m.slug !== slug).slice(0, 3);
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="model-related-heading">
      <h2
        id="model-related-heading"
        className="text-lg font-semibold text-foreground"
      >
        Related models
      </h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {related.map((m) => {
          const score = SHOWDOWN_SCORES[m.slug];
          const text =
            typeof score === "number" ? score.toFixed(1) : "Not evaluated";
          return (
            <li key={m.slug}>
              <Link
                href={`/models/${m.slug}`}
                className="block rounded-lg border border-border bg-card p-3 hover:border-bdx-accent/50"
              >
                <span className="font-medium text-foreground">{m.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {m.family} · Showdown Score{" "}
                  <span className="font-mono">{text}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
