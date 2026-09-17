import { Suspense } from "react";
import type { Metadata } from "next";
import { COMPARE_URL_PARAM, parseModelsParam } from "@/components/compare/compare-data";
import { CompareView } from "@/components/compare/CompareView";
import { CompareSkeleton } from "@/components/compare/CompareSkeleton";

export const metadata: Metadata = {
  title: "Compare models — BDX Bench",
  description:
    "Side-by-side model comparison: quality, price, speed, and capabilities for up to 4 models. Shareable URL state (demo data).",
};

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * SUB-AGENT 6/10 COMPARE — owned route.
 * URL schema: /compare?models=<slug>,<slug>[,...] (1–4 slugs; unknown ignored;
 * fewer than 2 renders the empty state). Server parses once for the initial
 * selection; CompareView owns tray persistence + URL sync client-side.
 */
export default async function ComparePage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const sp: SearchParams =
    searchParams !== undefined &&
    typeof (searchParams as Promise<SearchParams>).then === "function"
      ? await (searchParams as Promise<SearchParams>)
      : ((searchParams ?? {}) as SearchParams);
  const initialModels = parseModelsParam(sp[COMPARE_URL_PARAM]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <Suspense fallback={<CompareSkeleton />}>
        <CompareView initialModels={initialModels} />
      </Suspense>
    </main>
  );
}
