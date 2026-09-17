import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trends",
  description:
    "Single-snapshot Showdown Scores for the current round and how trends will be tracked.",
};

export default function TrendsPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Trends</h1>
      <p className="mt-2 text-muted-foreground">
        Single snapshot — no trend line yet.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">September 2026 snapshot</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Only one evaluation round exists so far. A trend needs at least two
          dated rounds.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
            <Link href="/models/muse-spark-1-3" className="font-medium underline-offset-4 hover:underline">
              Muse Spark 1.3
            </Link>
            <span className="tabular-nums font-semibold">92.0</span>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
            <Link href="/models/gemini-3-8-flash" className="font-medium underline-offset-4 hover:underline">
              Gemini 3.8 Flash
            </Link>
            <span className="tabular-nums font-semibold">88.0</span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Showdown Score (manual game-build evaluation) · Zombie Flamethrower
          Showdown.
        </p>
      </div>
      <div className="mt-4 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">What comes next</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Future rounds will append dated snapshots here, with per-build lines
          and notes on what changed between rounds.
        </p>
      </div>
    </div>
  );
}
