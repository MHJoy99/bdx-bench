import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested BDX Bench page could not be found.",
};

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        BDX Bench
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        That address does not exist here. Try the leaderboard, or search for a
        model such as Muse Spark 1.3 or Gemini 3.8 Flash, or a benchmark such
        as Zombie Flamethrower Showdown.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
        <Link
          href="/"
          className="rounded-md border border-border bg-card px-4 py-1.5 hover:border-bdx-accent/50"
        >
          Home
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-md border border-bdx-accent/50 bg-bdx-accent/15 px-4 py-1.5 font-medium"
        >
          Leaderboard
        </Link>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Hint: use the search in the top bar to jump to models, benchmarks, and
        compare views.
      </p>
    </main>
  );
}
