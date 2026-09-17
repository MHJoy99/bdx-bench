import type { Metadata } from "next";

export const metadata: Metadata = { title: "Price / Performance" };

/** Placeholder — price/performance agent owns this route. */
export default function PricePerformancePage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold">Price / Performance</h1>
      <p className="mt-2 text-muted-foreground">
        Scaffold only. Data: <code className="font-mono text-sm">GET /api/leaderboard</code> (pricePer1MBlended)
        + <code className="font-mono text-sm">formatPrice</code> from{" "}
        <code className="font-mono text-sm">@/lib/format</code>.
      </p>
    </div>
  );
}
