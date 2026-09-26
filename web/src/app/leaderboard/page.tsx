import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { SCORE_SCALE_CAPTION } from "@/components/leaderboard/columns";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Showdown Score v2 evidence table for eight verified builds on Zombie Flamethrower Showdown: five audited dimensions, verified findings, and the playable artifact behind every score.",
};

export default function LeaderboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
          Leaderboard
        </h1>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
          An evidence table, not a scoreboard. Every score below is a strict
          implementation-level audit of one playable build on Zombie
          Flamethrower Showdown. A feature earns points only when it is
          genuinely implemented and reachable — on-screen text, comments and
          dead code score zero.
        </p>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
          Open any row for the verified findings behind the number, or play the
          build and check the audit yourself. This round is dated and static:
          scores here do not move on their own.
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase leading-[16px] tracking-wider text-[var(--text-tertiary)]">
          <Link
            href="/methodology"
            className="underline-offset-2 hover:text-[var(--text-secondary)] hover:underline"
          >
            {SCORE_SCALE_CAPTION}
          </Link>
        </p>
      </header>

      <Suspense
        fallback={
          <div
            className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4"
            aria-busy="true"
            aria-label="Loading leaderboard"
          >
            <div className="h-10 w-1/3 animate-pulse rounded-[6px] bg-[var(--elevated)]" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-full animate-pulse rounded-[6px] bg-[var(--elevated)]"
                />
              ))}
            </div>
          </div>
        }
      >
        <LeaderboardTable />
      </Suspense>
    </div>
  );
}
