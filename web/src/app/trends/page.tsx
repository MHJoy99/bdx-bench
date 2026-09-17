import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trends" };

/** Placeholder — trends agent owns this route. */
export default function TrendsPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold">Trends</h1>
      <p className="mt-2 text-muted-foreground">
        Scaffold only. Data: <code className="font-mono text-sm">GET /api/trends</code> + ECharts.
      </p>
    </div>
  );
}
