import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PricePerformance() {
  return (
    <section aria-labelledby="home-price-heading">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle
              id="home-price-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Intelligence vs. price
            </CardTitle>
            <p className="mt-1 text-sm text-bdx-muted">
              Pricing and speed were not measured for these builds.{" "}
              <Link
                href="/price-performance"
                className="text-bdx-accent underline-offset-4 hover:underline"
              >
                See status
              </Link>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-bdx-border bg-bdx-bg px-6 py-10 text-center">
            <p className="text-sm font-semibold text-bdx-ink">
              Not measured in this round
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-bdx-muted">
              Muse Spark 1.3 and Gemini 3.8 Flash were evaluated for game-build
              quality only. Price and speed charts will appear once vendor
              pricing and throughput measurements are published.
            </p>
            <p className="mt-4 text-sm">
              <Link
                href="/compare?models=muse-spark-1-3,gemini-3-8-flash"
                className="text-bdx-accent underline-offset-4 hover:underline"
              >
                Compare the two builds
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
