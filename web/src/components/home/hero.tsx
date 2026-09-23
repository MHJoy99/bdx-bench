import Link from "next/link";
import { ArrowRight, Flame, Gamepad2, GitCompare } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-6 py-12 sm:px-10 sm:py-16 lg:px-12 shadow-[var(--shadow-card)]"
    >
      {/* Ambient background glow & subtle technical grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-[var(--accent-muted)] blur-[80px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#222a33_1px,transparent_1px)] [background-size:24px_24px] opacity-25"
      />

      <div className="relative z-10 max-w-3xl">
        {/* Top badge pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--elevated)]/80 px-3 py-1 text-xs text-[var(--text-secondary)] shadow-sm backdrop-blur-sm transition-colors hover:border-[var(--accent-border)]">
          <span className="flex h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden="true" />
          <span className="font-semibold text-[var(--text)]">⚡ Independent AI Intelligence</span>
          <span className="text-[var(--text-tertiary)]" aria-hidden="true">·</span>
          <span className="text-[var(--text-secondary)]">Zombie Showdown Round (Sep 2026)</span>
        </div>

        {/* Headline */}
        <h1
          id="home-hero-heading"
          className="mt-5 font-display text-4xl font-extrabold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl text-balance leading-[1.08]"
        >
          AI models,{" "}
          <span className="text-[var(--accent-ink)]">measured.</span>
        </h1>

        {/* Subtitles with high readability */}
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
          Independent benchmarks, pricing, speed, capability, and model
          intelligence in one place.
        </p>

        <div className="mt-3.5 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Flame className="size-4 shrink-0 text-[#ffc53d]" aria-hidden="true" />
          <span>
            Latest Game-Build Showdown: <strong className="font-semibold text-[var(--text)]">DeepSeek V4.1 Flash (94)</strong> vs{" "}
            <strong className="font-semibold text-[var(--text)]">Space Bunny Free (93.5)</strong> vs{" "}
            <strong className="font-semibold text-[var(--text)]">Muse Spark 1.3 (92)</strong> vs{" "}
            <strong className="font-semibold text-[var(--text)]">GPT 6 Sol (91.5)</strong> vs{" "}
            <strong className="font-semibold text-[var(--text)]">GPT Luna 5.6 (91)</strong> vs{" "}
            <strong className="font-semibold text-[var(--text)]">GPT Luna 6 (89.5)</strong> vs{" "}
            <strong className="font-semibold text-[var(--text)]">Gemini 3.8 Flash (88)</strong>
          </span>
        </div>

        {/* High-impact CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/leaderboard"
            className={cn(
              buttonVariants({ size: "lg" }),
              "group relative overflow-hidden font-semibold shadow-[0_0_20px_-3px_rgba(184,255,90,0.35)] hover:shadow-[0_0_28px_-2px_rgba(184,255,90,0.5)] transition-all",
            )}
          >
            <span>Explore Leaderboard</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link
            href="/compare?models=muse-spark-1-3,gemini-3-8-flash"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "border-[var(--border-strong)] hover:border-[var(--accent-border)] transition-colors",
            )}
          >
            <GitCompare className="size-4 text-[var(--text-tertiary)]" aria-hidden="true" />
            <span>Compare Models</span>
          </Link>
          <Link
            href="/eval"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "border-[var(--border-strong)] hover:border-[var(--accent-border)] transition-colors",
            )}
          >
            <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden="true" />
            <span>Live Telemetry</span>
          </Link>
        </div>

        {/* Playable builds micro-badges */}
        <div className="mt-7 flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Play Interactive Builds:</span>
          <Link
            href="/play/pyro-vs-zombies"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--elevated)]/80 px-2.5 py-1 font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent-ink)]"
          >
            <Gamepad2 className="size-3.5 text-[var(--accent)]" aria-hidden="true" />
            <span>Pyro vs Zombies (Muse Spark · 92)</span>
          </Link>
          <Link
            href="/play/pyre-burn-horde"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--elevated)]/80 px-2.5 py-1 font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent-ink)]"
          >
            <Gamepad2 className="size-3.5 text-[#ff7847]" aria-hidden="true" />
            <span>DeepSeek V4.1 Flash (94)</span>
          </Link>
          <Link
            href="/play/space-bunny"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--elevated)]/80 px-2.5 py-1 font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent-ink)]"
          >
            <Gamepad2 className="size-3.5 text-[#ff9b38]" aria-hidden="true" />
            <span>Space Bunny Free (93.5)</span>
          </Link>
          <Link
            href="/play/cinderline"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--elevated)]/80 px-2.5 py-1 font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent-ink)]"
          >
            <Gamepad2 className="size-3.5 text-[#ffad45]" aria-hidden="true" />
            <span>GPT 6 Sol (91.5)</span>
          </Link>
          <Link
            href="/play/firebreak-night-shift"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--elevated)]/80 px-2.5 py-1 font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent-ink)]"
          >
            <Gamepad2 className="size-3.5 text-[#b8ff5a]" aria-hidden="true" />
            <span>GPT Luna 5.6 (91)</span>
          </Link>
          <Link
            href="/play/emberfall"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--elevated)]/80 px-2.5 py-1 font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent-ink)]"
          >
            <Gamepad2 className="size-3.5 text-[#d7ff79]" aria-hidden="true" />
            <span>GPT Luna 6 (89.5)</span>
          </Link>
          <Link
            href="/play/pyroclasm-inferno"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--elevated)]/80 px-2.5 py-1 font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent-ink)]"
          >
            <Gamepad2 className="size-3.5 text-[#7dd3fc]" aria-hidden="true" />
            <span>Pyroclasm Inferno (Gemini 3.8 · 88)</span>
          </Link>
        </div>

        <p className="mt-6 text-[11px] font-mono tracking-wide text-[var(--text-tertiary)]">
          TRANSPARENT METHODOLOGY · REPRODUCIBLE SCORING · PLAYABLE BUILDS
        </p>
      </div>
    </section>
  );
}
