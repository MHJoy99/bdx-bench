import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Gamepad2, ArrowUpRight, Zap, ShieldCheck } from "lucide-react";
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
    altPlayUrl?: string;
    altPlayLabel?: string;
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
    altPlayUrl: "/play/inferno-dead",
    altPlayLabel: "INFERNO DEAD — newer build (strict audit 61.0)",
    badge: "SCORE 80.0 · #2",
    tagline: "PYRE — five interlocking fire systems and a real 20-upgrade card draft. Deepest systems, no touch support.",
    features: [
      "Dynamic heat contagion — burning zombies ignite their swarm neighbors",
      "6 enemy classes: Shamblers, Runners, Spitters, Bloaters, Brutes, Titans",
      "Titan boss every 5th wave with room-clearing blast",
      "19 selectable card upgrades across 4 rarity tiers",
      "Fuel recharge loop, flame nova (Space), fire dash (Shift)",
    ],
    fps: "Zero-allocation 11-array particle SoA, 4200 cap, 120 Hz fixed step · 1915 lines",
    tech: "Single file · 20 DOM card upgrades with rarity weighting and a score-gated reroll",
  },
  "gpt-6-sol": {
    title: "GPT 6 Sol",
    playUrl: "/play/cinderline",
    badge: "SCORE 58.0 · #4",
    tagline: "Cinderline — proven continuous flame cone, working touch layer, functional combo. No boss, no knockback, no upgrades.",
    features: [
      "Twin-stick controls with WASD movement, mouse aim, and flamethrower cone",
      "Firebomb lob ability (F / RMB) creating lasting ground fire pools",
      "Evasive dash (Space), heat chain combo multiplier, and vital fuel pickups",
      "3 enemy archetypes: swift runners, shambling walkers, and high-health brutes",
      "Procedural audio synthesizer with mute toggle, touch controls, and local high score",
    ],
    fps: "653 lines / 501 JS, zero global pollution",
    tech: "Knockback is entirely absent; enemies have no velocity field",
  },
  "gpt-5-6-luna": {
    title: "GPT Luna 5.6",
    playUrl: "/play/firebreak-night-shift",
    badge: "SCORE 62.0 · #3",
    tagline: "Firebreak: Night Shift — four genuinely distinct enemy behaviours, real contagion, working pointer-event touch.",
    features: [
      "4 enemy classes: Shambler, Runner, Brute, and ranged Spitter",
      "Spreading fire, fuel reserve, health/ash pickups, and obstacle field",
      "Solar Burst (E), fire dash (Shift), pause/restart, and endless waves",
      "Pointer-based touch controls and local best-run persistence",
      "Self-contained Canvas 2D build with procedural Web Audio",
    ],
    fps: "1229 lines, single file, no external resources",
    tech: "No boss, no combo, no music · reachable pause-hang defect documented in the audit",
  },
  "gpt-6-luna": {
    title: "GPT Luna 6",
    playUrl: "/play/emberfall",
    badge: "SCORE 51.0 · #6",
    tagline: "Emberfall — correct normalized directional knockback and a fully working pointer-event touch layer.",
    features: [
      "Twin-stick WASD + mouse aim / hold Space or click to spray fire",
      "2 zombie tiers: standard horde + armored tough zombies",
      "Dynamic fuel drain & recharge loop with fuel pickups",
      "Touch joystick and touch burn button for mobile",
      "Procedural Web Audio sound effects with mute toggle",
    ],
    fps: "604 lines, 447 JS, zero global pollution",
    tech: "One enemy archetype, one pickup, no boss, no combo, no music",
  },
  "space-bunny-free": {
    title: "Space Bunny Free",
    playUrl: "/play/ember-dead",
    altPlayUrl: "/play/space-bunny",
    altPlayLabel: "Earlier build (strict audit 49.0)",
    badge: "SCORE 91.0 · #1",
    tagline: "EMBER DEAD — six enemy roles, five fire abilities with i-frames, and a 142 BPM procedural soundtrack. Highest-scoring build in the set.",
    features: [
      "6 enemy types with real role separation: Walker, Runner, Brute, Spitter, Ember suicide-bomber, and the Inferno Behemoth boss every 5th wave",
      "5 abilities on independent cooldowns: flamethrower cone, fireball w/ recoil, ballistic Molotov, Blaze Dash (0.3s i-frames), and a pickup-gated Inferno nuke",
      "Full WebAudio engine: 15 synthesized SFX, a live flame bed, and a 142 BPM five-layer step sequencer (kick/snare/hats/bass/lead)",
      "Six damage channels funnelled through one resolver: burn DoT with a 1.12x burning vulnerability, ignite stacking, fire pools, dash contact, passive ember aura",
      "Layered game feel: slow-motion, hit-stop, per-event screen shake, regenerating heat shield, out-of-combat regen, 3 pickup types, combo to x13, ?wave= jump, working touch controls",
    ],
    fps: "Zero-allocation 1500-particle pool, two-pass additive batching · 79 KB across 4 files · ~80k frames driven, 0 runtime errors",
    tech: "Multi-file (index.html + style.css + game.js + audio.js) · no dependencies, no assets, no network",
  },
  "gemini-pro-agent": {
    title: "Gemini Pro Agent",
    playUrl: "/play/zombie-fire-survival",
    badge: "SCORE 24.0 · #8",
    tagline: "Zombie Fire Survival — a clean 507-line prototype with a well-tuned burn DoT and nothing else.",
    features: [
      "Dynamic cone spread with multi-layered additive flame glow and dissipate physics",
      "Charred zombie states with burn damage-over-time and randomized smoke trails",
      "Responsive WASD movement with diagonal vector normalization",
      "Dynamic player heat glow reacting to sustained flamethrower discharge",
      "Fiery gore explosion particles and screen-damage feedback vignette",
    ],
    fps: "507 lines / 415 JS · zero audio, one enemy type, no fuel economy, no touch",
    tech: "Audio verified at absolute zero (0/6 probes, 0 AudioContext constructions at runtime)",
  },
  "muse-spark-1-3": {
    title: "PYRO vs ZOMBIES",
    playUrl: "/play/pyro-vs-zombies",
    badge: "SCORE 52.0 · #5",
    tagline: "PYRO vs ZOMBIES — real contagion cascades and tank chain-explosions in 238 lines of JS.",
    features: [
      "Pure arcade twin-stick loop, 0.5s time-to-first-flame",
      "4 zombie varieties: Normal, Fast, Tank, Spitter",
      "Fuel drain/regen loop with ground scorch marks",
      "Health & fuel drop pickups across the arena",
      "Procedural lowpass white-noise audio synthesis",
    ],
    fps: "319 lines total, 238 JS, one IIFE, zero globals",
    tech: "No boss, no combo, no card draft, no music · touchcancel fuel-bleed lockout",
  },
  "gemini-3-8-flash": {
    title: "PYROCLASM: Zombie Inferno",
    playUrl: "/play/pyroclasm-inferno",
    badge: "SCORE 43.0 · #7",
    tagline: "PYROCLASM: Zombie Inferno — a real 1/2/3 weapon system with three distinct mechanics.",
    features: [
      "Edge-spawned zombie waves with swarm AI",
      "Secondary unlockables: Fireball burst & Napalm Mines",
      "Screen-clearing Supernova room-blast",
      "Persistent localStorage high score tracking",
    ],
    fps: "1327 lines · no delta time (sim runs 2.67x fast at 160fps) · 1.9M-op/frame O(n2) cliff at ~644 zombies",
    tech: "Advertised dash, lingering pools and touch are all absent from the code",
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
            8 Evaluated Models
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
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
                  {build?.altPlayUrl ? (
                    <Link
                      href={build.altPlayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent-ink)]"
                    >
                      <Gamepad2 className="size-3.5" />
                      <span>{build.altPlayLabel}</span>
                      <ArrowUpRight className="size-3 opacity-70" />
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
