import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Price and Performance",
  description:
    "Pricing and speed status for the current game-build round and what will be published next.",
};

export default function PricePerformancePage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Price and performance</h1>
      <p className="mt-2 text-muted-foreground">
        Pricing and speed were not measured for these builds.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Current status</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Muse Spark 1.3 and Gemini 3.8 Flash were evaluated for game-build
          quality only. There are no vendor price snapshots or throughput
          measurements attached to this round, so this page shows no price or
          speed rankings.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
            <Link href="/models/muse-spark-1-3" className="font-medium underline-offset-4 hover:underline">
              Muse Spark 1.3
            </Link>
            <span className="text-muted-foreground">Not measured</span>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
            <Link href="/models/gemini-3-8-flash" className="font-medium underline-offset-4 hover:underline">
              Gemini 3.8 Flash
            </Link>
            <span className="text-muted-foreground">Not measured</span>
          </li>
        </ul>
      </div>
      <div className="mt-4 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">What will be added</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Vendor price per 1M input and output tokens, with effective dates.</li>
          <li>Blended price per 1M tokens for cost comparison.</li>
          <li>Median output speed and time to first token, with harness notes.</li>
          <li>Price versus Showdown Score views once numbers are available.</li>
        </ul>
        <p className="mt-3 text-sm">
          <Link href="/methodology" className="underline underline-offset-2">
            How we will measure price and speed
          </Link>
        </p>
      </div>
    </div>
  );
}
