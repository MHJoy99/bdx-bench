import { DemoDataBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MODELS } from "@/lib/data";
import type { Model } from "@/lib/types";
// Local synthetic padding (TODO Agent8 canonical `@/lib/demo-data`):
import { DEMO_CATEGORY_LEADERS } from "./home-demo-data";

const DIMS: { key: keyof Model["scores"]; label: string }[] = [
  { key: "coding", label: "Coding" },
  { key: "reasoning", label: "Reasoning" },
  { key: "math", label: "Math" },
  { key: "knowledge", label: "Knowledge" },
  { key: "vision", label: "Vision" },
  { key: "longContext", label: "Long Context" },
  { key: "agentic", label: "Agentic" },
  { key: "efficiency", label: "Efficiency" },
];

/**
 * CATEGORY LEADERS — Server Component. DEMO DATA.
 * Leaders computed from the placeholder set via canonical scores; tiles the
 * placeholder set cannot fill come from the synthetic demo list.
 */
export function CategoryLeaders() {
  const tiles = DIMS.map((dim) => {
    const val = (m: Model): number => {
      const v: unknown = m.scores[dim.key];
      return typeof v === "number" ? v : 0;
    };
    const ranked = [...MODELS].sort((a, b) => val(b) - val(a));
    const top = ranked[0];
    if (top) {
      return {
        category: dim.label,
        model: top.name,
        provider: top.provider,
        score: val(top),
      };
    }
    const fb = DEMO_CATEGORY_LEADERS.find((d) => d.category === dim.label);
    return (
      fb ?? { category: dim.label, model: "—", provider: "—", score: 0 }
    );
  });

  return (
    <section aria-labelledby="home-category-leaders-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="home-category-leaders-heading"
          className="text-lg font-semibold tracking-tight text-bdx-ink"
        >
          Category leaders
        </h2>
        <DemoDataBadge />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((c) => (
          <Card key={c.category}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-bdx-muted">
                {c.category}
              </p>
              <p className="mt-2 truncate font-semibold text-bdx-ink">
                {c.model}
              </p>
              <p className="truncate text-xs capitalize text-bdx-muted">{c.provider}</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-bdx-accent">
                {c.score.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
