import Link from "next/link";
import { DemoDataBadge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

/**
 * HERO — Server Component.
 * Exact copy contract (do not reword without owner approval):
 *   H1: "AI models, measured."
 *   Sub: "Independent benchmarks, pricing, speed, capability and model intelligence in one place."
 *   Meta: "Updated recently • Transparent methodology • Reproducible scoring"
 * Never claim live / real-time results here.
 * NOTE: Button has no asChild API — CTAs are Links styled with buttonVariants.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative overflow-hidden rounded-[10px] border border-bdx-border bg-bdx-surface px-6 py-12 sm:px-10 sm:py-16 lg:px-14"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-bdx-accent/10 blur-3xl"
      />
      <div className="relative max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <DemoDataBadge />
          <span className="text-xs text-bdx-muted">
            Homepage preview — illustrative only
          </span>
        </div>

        <h1
          id="home-hero-heading"
          className="mt-4 text-4xl font-bold tracking-tight text-bdx-ink sm:text-5xl lg:text-6xl"
        >
          AI models, measured.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-bdx-muted sm:text-lg">
          Independent benchmarks, pricing, speed, capability and model
          intelligence in one place.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/leaderboard"
            className={buttonVariants({ size: "lg" })}
          >
            Explore Leaderboard
          </Link>
          <Link
            href="/compare"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Compare Models
          </Link>
        </div>

        <p className="mt-6 text-xs tracking-wide text-bdx-muted">
          Updated recently • Transparent methodology • Reproducible scoring
        </p>
      </div>
    </section>
  );
}
