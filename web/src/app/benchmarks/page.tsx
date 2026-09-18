import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Gamepad2, ArrowUpRight, Trophy, Zap, ShieldCheck } from "lucide-react";
import { getBenchmarkEvaluations, getModel } from "@/lib/data";

export const metadata: Metadata = {
  title: "Zombie Flamethrower Showdown — Interactive Builds & Benchmark Results",
  description:
    "Test prompt p-001 results: all models evaluated head-to-head on the zombie flamethrower game brief. Live scores, instant in-browser playable builds, and open arena voting.",
};

const SHOWDOWN_SLUG = "zombie-flamethrower-showdown";
const SHOWDOWN_NAME = "Zombie Flamethrower Showdown";
const PROMPT_BODY =
  "make me a video game where i am killing zombies with fire and all please? a nice wonderfull game i can play for fun okay?";

const PLAYABLE_BUILDS: Record<
  string,
  {
    title: string;
    playUrl: string;
    badge: string;
    tagline: string;
    features: string[];
    fps: string;
    tech: string;
  }
> = {
  "deepseek-v4-1-flash": {
    title: "PYRE — Burn the Horde",
    playUrl: "/play/pyre-burn-horde",
    badge: "WINNER · #1",
    tagline: "Thermodynamic chain reactions, 6 enemy classes, Titan bosses & 19 roguelite upgrades.",
    features: [
      "Dynamic heat contagion — burning zombies ignite their swarm neighbors",
      "6 enemy classes: Shamblers, Runners, Spitters, Bloaters, Brutes, Titans",
      "Titan boss every 5th wave with room-clearing blast",
      "19 selectable card upgrades across 4 rarity tiers",
      "Fuel recharge loop, flame nova (Space), fire dash (Shift)",
    ],
    fps: "60 FPS @ 120 zombies + 2,300 particles live",
    tech: "Pooled entity buffers · End-of-frame compaction pass · Web Audio synthesizer",
  },
  "muse-spark-1-3": {
    title: "PYRO vs ZOMBIES",
    playUrl: "/play/pyro-vs-zombies",
    badge: "RUNNER UP · #2",
    tagline: "Arcade-pure twin-stick survival. Lightning-fast pick up and play.",
    features: [
      "Pure arcade twin-stick loop, 0.5s time-to-first-flame",
      "4 zombie varieties: Normal, Fast, Tank, Spitter",
      "Fuel drain/regen loop with ground scorch marks",
      "Health & fuel drop pickups across the arena",
      "Procedural lowpass white-noise audio synthesis",
    ],
    fps: "60 FPS rock-solid on all hardware",
    tech: "26 KB ultra-lightweight Canvas 2D · Zero dependencies",
  },
  "gemini-3-8-flash": {
    title: "PYROCLASM: Zombie Inferno",
    playUrl: "/play/pyroclasm-inferno",
    badge: "THIRD · #3",
    tagline: "High-particle arena survivor with secondary weapons and edge-spawning swarms.",
    features: [
      "Edge-spawned zombie waves with swarm AI",
      "Secondary unlockables: Fireball burst & Napalm Mines",
      "Screen-clearing Supernova room-blast",
      "Persistent localStorage high score tracking",
    ],
    fps: "50-60 FPS · Heavy particle canvas",
    tech: "40 KB Canvas 2D engine · Web Audio sound FX",
  },
};

export default function BenchmarksPage() {
  const evals = getBenchmarkEvaluations(SHOWDOWN_SLUG);
  const display = [...evals].sort((a, b) => b.raw - a.raw);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero: The One Test */}
      <section className="relative overflow-hidden rounded-[14px] border border-[var(--border-strong)] bg-gradient-to-b from-[var(--surface)] to-[var(--bg)] p-6 sm:p-10 shadow-[var(--shadow-card)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--accent-muted)] blur-[90px]" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            <Flame className="size-3.5 text-[#ff7847]" />
            <span className="font-semibold text-[var(--text)]">Benchmark Suite: p-001</span>
            <span>·</span>
            <span>Zombie Flamethrower Survival</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl lg:text-5xl">
            One prompt. Every model. <span className="text-[var(--accent-ink)]">Play the builds.</span>
          </h1>
          <p className="mt-3 text-base text-[var(--text-secondary)] sm:text-lg leading-relaxed">
            Every model below was given the exact same brief with zero priming. Test the actual games, inspect the scores, and see which AI creates the best software.
          </p>
          <div className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--bg)]/80 p-3.5 font-mono text-xs text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
              Shared Prompt Brief:
            </span>
            &ldquo;{PROMPT_BODY}&rdquo;
          </div>
        </div>
      </section>

      {/* Primary Section: Tested & Scored Builds (Playable Now) */}
      <section className="mt-10" aria-labelledby="scored-builds-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="scored-builds-heading" className="text-2xl font-bold tracking-tight text-[var(--text)]">
              Verified Playable Builds
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Human-evaluated, fully debugged, 100% in-browser. Click <strong className="text-[var(--text)]">Play Now</strong> to test in your browser instantly.
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
            3 Evaluated Models
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {display.map((e, idx) => {
            const m = getModel(e.modelSlug);
            const build = PLAYABLE_BUILDS[e.modelSlug];
            const isFirst = idx === 0;

            return (
              <div
                key={e.modelSlug}
                className={`relative flex flex-col justify-between rounded-[14px] border p-6 transition-all duration-200 ${
                  isFirst
                    ? "border-[var(--accent-border)] bg-[var(--surface)] shadow-[0_0_30px_-5px_rgba(184,255,90,0.2)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div>
                  {/* Top Bar: Rank + Score */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                        isFirst
                          ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                          : "border border-[var(--border)] bg-[var(--elevated)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {build?.badge ?? `#${idx + 1}`}
                    </span>
                    <div className="text-right">
                      <span className="font-mono text-3xl font-black text-[var(--text)]">
                        {e.raw.toFixed(1)}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                        Showdown Score
                      </span>
                    </div>
                  </div>

                  {/* Model & Game Title */}
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                      {m?.name ?? e.modelSlug}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-extrabold text-[var(--text)]">
                      {build?.title ?? "Game Build"}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                      {build?.tagline}
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  {build?.features && (
                    <ul className="mt-4 space-y-1.5 border-t border-[var(--border)]/60 pt-4 text-xs text-[var(--text-secondary)]">
                      {build.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="mt-0.5 text-[var(--accent)]">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Performance metric */}
                  {build?.fps && (
                    <div className="mt-4 rounded-[8px] bg-[var(--elevated)]/60 p-2 text-[11px] font-mono text-[var(--text-tertiary)]">
                      <Zap className="inline mr-1 size-3 text-[#ffc53d]" />
                      {build.fps}
                    </div>
                  )}
                </div>

                {/* Big Action: PLAY NOW */}
                <div className="mt-6 pt-4 border-t border-[var(--border)]/60 flex flex-col gap-2">
                  {build?.playUrl ? (
                    <Link
                      href={build.playUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-2 rounded-[8px] py-3 text-sm font-bold tracking-wide transition-all ${
                        isFirst
                          ? "bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-110 shadow-[0_0_18px_rgba(184,255,90,0.35)]"
                          : "bg-[var(--elevated)] text-[var(--text)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent-ink)] border border-[var(--border-strong)]"
                      }`}
                    >
                      <Gamepad2 className="size-4" />
                      <span>PLAY THIS BUILD</span>
                      <ArrowUpRight className="size-3.5 opacity-70" />
                    </Link>
                  ) : null}
                  <Link
                    href={`/models/${e.modelSlug}`}
                    className="text-center text-xs text-[var(--text-tertiary)] hover:text-[var(--text)] underline-offset-4 hover:underline"
                  >
                    View model profile & metrics →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Methodology Guarantee Footer */}
      <section className="mt-12 rounded-[12px] border border-[var(--border)] bg-[var(--elevated)]/40 p-6 text-xs text-[var(--text-secondary)] leading-relaxed">
        <div className="flex items-center gap-2 font-semibold text-[var(--text)] text-sm">
          <ShieldCheck className="size-4 text-[var(--accent)]" />
          <span>Evaluation Integrity Guarantee</span>
        </div>
        <p className="mt-2">
          Zero cherry-picking. Every score comes from a real human playing the generated build in an isolated browser environment. The prompt is never tuned per-model. All builds are hosted statically with zero trackers or analytics inserted.
        </p>
      </section>
    </div>
  );
}
