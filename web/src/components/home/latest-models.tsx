import { DemoDataBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MODELS } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { bdxBenchScore, blendedPricePer1M } from "@/lib/scores";
// Local synthetic padding (TODO Agent8 canonical `@/lib/demo-data`):
import { DEMO_LATEST_MODELS } from "./home-demo-data";

/**
 * LATEST MODELS — Server Component. DEMO DATA.
 * Newest placeholder models first (by release date), padded with synthetic
 * demo cards so the grid stays full while the dataset is small.
 */
export function LatestModels() {
  const real = [...MODELS]
    .sort((a, b) => b.released.localeCompare(a.released))
    .map((m) => ({
      id: m.slug,
      name: m.name,
      provider: m.provider,
      released: m.released,
      score: m.scores.bdxScore ?? bdxBenchScore(m.scores),
      priceLabel: formatPrice(
        blendedPricePer1M(m.prices.inputPer1M, m.prices.outputPer1M),
        m.prices.currency,
      ),
      isNew: false,
    }));
  const demo = DEMO_LATEST_MODELS.filter(
    (d) => !real.some((r) => r.id === d.id),
  ).map((d) => ({
    id: d.id,
    name: d.name,
    provider: d.provider,
    released: d.releasedAt ?? "date TBD (demo)",
    score: d.score,
    priceLabel: d.pricePer1M == null ? "—" : `$${d.pricePer1M}/1M`,
    isNew: d.isNew ?? false,
  }));
  const cards = [...real, ...demo].slice(0, 4);

  return (
    <section aria-labelledby="home-latest-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="home-latest-heading"
          className="text-lg font-semibold tracking-tight text-bdx-ink"
        >
          Latest models
        </h2>
        <DemoDataBadge />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((model) => (
          <Card key={model.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold text-bdx-ink">
                  {model.name}
                </p>
                {model.isNew ? (
                  <span className="shrink-0 rounded-full bg-bdx-accent px-2 py-0.5 text-[11px] font-bold text-black">
                    NEW
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs capitalize text-bdx-muted">
                {model.provider} · {model.released}
              </p>
              <p className="mt-3 text-sm tabular-nums text-bdx-ink">
                Score{" "}
                <span className="font-bold text-bdx-accent">
                  {model.score.toFixed(1)}
                </span>
                <span className="ml-2 text-xs text-bdx-muted">
                  {model.priceLabel}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
