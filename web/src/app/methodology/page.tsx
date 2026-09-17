import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How BDX Bench evaluates game builds: suites, prompts, playability checks, scoring, community signals, freshness, and limitations.",
};

export default function MethodologyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Methodology</h1>
      <p className="mt-2 text-muted-foreground">
        How current rankings are produced, what they cover, and where they
        fall short.
      </p>

      <section aria-labelledby="m-suites" className="mt-8">
        <h2 id="m-suites" className="text-xl font-semibold">Suites</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The active suite is Zombie Flamethrower Showdown. Each build is
          evaluated as a complete playable game, not as isolated text answers.
          The suite stays fixed within a round so builds face the same bar.
        </p>
      </section>

      <section aria-labelledby="m-prompt" className="mt-8">
        <h2 id="m-prompt" className="text-xl font-semibold">Prompt</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Both builds start from the same game-build brief: a flamethrower
          survival round against waves of zombies. The brief fixes the theme,
          controls, and win/lose shape while leaving art, tuning, and feel to
          each build.
        </p>
      </section>

      <section aria-labelledby="m-checks" className="mt-8">
        <h2 id="m-checks" className="text-xl font-semibold">Playability checks</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
          <li>Loads and starts without errors on desktop and mobile widths.</li>
          <li>Movement, aiming, and firing respond to keyboard, mouse, and touch.</li>
          <li>Waves advance, scoring updates, and game-over plus restart work.</li>
          <li>No blocking audio, layout, or input faults during a full run.</li>
        </ul>
      </section>

      <section aria-labelledby="m-scoring" className="mt-8">
        <h2 id="m-scoring" className="text-xl font-semibold">Scoring</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Judges assign a Showdown Score from 0 to 100 for each build. Muse
          Spark 1.3 scored 92 and Gemini 3.8 Flash scored 88 in the September
          2026 round. The score reflects build quality, feel, and completeness
          observed during hands-on review. Dimensions outside this round, such
          as reasoning or coding subscores, show as Not evaluated. Pricing and
          speed show as Not measured until dedicated measurements land.
        </p>
      </section>

      <section aria-labelledby="m-signals" className="mt-8">
        <h2 id="m-signals" className="text-xl font-semibold">Votes, likes, and ratings</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Community signals sit alongside judge scores. Votes pick a preferred
          build in a head-to-head matchup, likes mark a build worth replaying,
          and ratings give a 1 to 5 star view on fun and polish. Signals never
          rewrite a published Showdown Score; they provide context on which
          builds players return to.
        </p>
      </section>

      <section aria-labelledby="m-fresh" className="mt-8">
        <h2 id="m-fresh" className="text-xl font-semibold">Freshness</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The current snapshot is the September 2026 round. Each round records
          its evaluation date on model and benchmark pages. When a new round
          ships, prior scores stay visible with their dates so movement can be
          traced.
        </p>
      </section>

      <section aria-labelledby="m-limits" className="mt-8">
        <h2 id="m-limits" className="text-xl font-semibold">Limitations</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
          <li>Two builds only — results do not generalize to other models.</li>
          <li>Game-build quality only — no claims about chat, code, or reasoning strength.</li>
          <li>Judge review includes human judgment and carries taste variance.</li>
          <li>No price or speed claims in this round; those pages state Not measured.</li>
        </ul>
      </section>

      <section aria-labelledby="m-change" className="mt-8">
        <h2 id="m-change" className="text-xl font-semibold">Why rankings change</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Rankings move when a new round is published, when a build is updated
          and re-evaluated, or when review standards are tightened and noted.
          Dates on every score make it clear whether movement came from a new
          build or a new round.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/benchmarks/zombie-flamethrower-showdown" className="underline underline-offset-2">
            See the current benchmark results
          </Link>
          {" · "}
          <Link href="/leaderboard" className="underline underline-offset-2">
            Open the leaderboard
          </Link>
        </p>
      </section>
    </div>
  );
}
