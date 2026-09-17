import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

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
        <p className="text-xs text-bdx-muted">
          Zombie Flamethrower Showdown · September 2026 round
        </p>

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
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bdx-muted">
          Current round: Muse Spark 1.3 scores 92 and Gemini 3.8 Flash scores
          88 — Showdown Score (manual game-build evaluation). Play both builds
          and compare.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/leaderboard"
            className={buttonVariants({ size: "lg" })}
          >
            Explore Leaderboard
          </Link>
          <Link
            href="/compare?models=muse-spark-1-3,gemini-3-8-flash"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Compare Models
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href="/play/pyro-vs-zombies"
            className="underline underline-offset-4"
          >
            Play Muse build
          </Link>
          <Link
            href="/play/pyroclasm-inferno"
            className="underline underline-offset-4"
          >
            Play Gemini build
          </Link>
        </div>

        <p className="mt-6 text-xs tracking-wide text-bdx-muted">
          Transparent methodology · Reproducible scoring · Playable builds
        </p>
      </div>
    </section>
  );
}
