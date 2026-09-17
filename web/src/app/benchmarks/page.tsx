import type { Metadata } from "next";

export const metadata: Metadata = { title: "Benchmarks" };

/** Placeholder — benchmarks agent owns this route. */
export default function BenchmarksPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold">Benchmarks</h1>
      <p className="mt-2 text-muted-foreground">
        Scaffold only. Data: <code className="font-mono text-sm">GET /api/benchmarks</code>.
      </p>
    </div>
  );
}
