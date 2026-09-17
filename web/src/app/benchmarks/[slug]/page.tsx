import type { Metadata } from "next";
import { BENCHMARKS } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = BENCHMARKS.find((x) => x.slug === slug);
  return { title: b ? `${b.name} Benchmark` : "Benchmark" };
}

/** Placeholder — benchmarks agent owns this route. */
export default async function BenchmarkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="container py-12">
      <h1 className="font-mono text-3xl font-bold">{slug}</h1>
      <p className="mt-2 text-muted-foreground">
        Scaffold only. Data: <code className="font-mono text-sm">GET /api/benchmarks/{slug}</code>.
      </p>
    </div>
  );
}
