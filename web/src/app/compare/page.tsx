import { Suspense } from "react";
import type { Metadata } from "next";
import { COMPARE_URL_PARAM, parseModelsParam } from "@/components/compare/compare-data";
import { CompareView } from "@/components/compare/CompareView";
import { CompareSkeleton } from "@/components/compare/CompareSkeleton";

export const metadata: Metadata = {
  title: "Compare Builds",
  description:
    "Per-dimension Showdown Score matrix for verified game builds: five audited dimensions, verified findings, and the playable artifact behind every number. No overall winner is declared.",
};

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

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
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <Suspense fallback={<CompareSkeleton />}>
        <CompareView initialModels={initialModels} />
      </Suspense>
    </main>
  );
}
