"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CapabilityTrend() {
  return (
    <section aria-labelledby="home-trend-heading">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle
              id="home-trend-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Capability trend
            </CardTitle>
            <p className="mt-1 text-sm text-bdx-muted">
              Single snapshot — trends need at least two rounds.{" "}
              <Link href="/trends" className="text-bdx-accent underline-offset-4 hover:underline">
                Open trends
              </Link>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-bdx-border bg-bdx-bg px-6 py-10 text-center">
            <p className="text-sm font-semibold text-bdx-ink">
              September 2026: 94 · 93 · 91 · 88 · 86 · 82 · 79 · 55
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-bdx-muted">
              DeepSeek V4.1 Flash leads at 94.0, followed by Space Bunny Free at 93.0, GPT 6 Sol at
              91.0, GPT Luna 5.6 at 88.0, Gemini 3.8 Flash at 86.0, Muse Spark 1.3 at 82.0, GPT Luna 6 at 79.0, and Gemini Pro Agent at 55.0. The next
              round will draw the first trend line.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
