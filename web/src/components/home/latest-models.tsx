import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MODELS } from "@/lib/data";

const PLAY_LINKS: Record<string, string> = {
  "muse-spark-1-3": "/play/pyro-vs-zombies",
  "deepseek-v4-1-flash": "/play/pyre-burn-horde",
  "gpt-6-sol": "/play/cinderline",
  "gpt-6-luna": "/play/emberfall",
  "gpt-5-6-luna": "/play/firebreak-night-shift",
  "gemini-3-8-flash": "/play/pyroclasm-inferno",
};

export function LatestModels() {
  const cards = [...MODELS]
    .sort((a, b) => (b.released ?? "").localeCompare(a.released ?? ""))
    .slice(0, 4);

  return (
    <section aria-labelledby="home-latest-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="home-latest-heading"
          className="text-lg font-semibold tracking-tight text-bdx-ink"
        >
          Latest models
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((model) => {
          const play: string | undefined = PLAY_LINKS[model.slug];
          return (
            <Card key={model.slug}>
              <CardContent className="p-4">
                <p className="truncate font-semibold text-bdx-ink">
                  <Link href={`/models/${model.slug}`} className="underline-offset-4 hover:underline">
                    {model.name}
                  </Link>
                </p>
                <p className="mt-1 text-xs capitalize text-bdx-muted">
                  {model.provider} · {model.released ?? "release date not published"}
                </p>
                {play ? (
                  <p className="mt-3 text-sm">
                    <Link
                      href={play}
                      className="text-bdx-accent underline-offset-4 hover:underline"
                    >
                      Play this build
                    </Link>
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
