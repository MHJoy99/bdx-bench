import { Suspense } from "react";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";

/**
 * Server Component wrapper for /leaderboard (route owned by 4/10 LEADERBOARD).
 * All interactivity lives in the client <LeaderboardTable />.
 * Suspense boundary is required because the table reads searchParams.
 */
export default function LeaderboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
          Leaderboard
        </h1>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
          Ranked model scores. Use category tabs to switch the sort key, filter
          by provider / capabilities / price, and share any view via URL.
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
