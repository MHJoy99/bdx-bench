import { ALL_SOURCES, getDatasetMeta, getModel, getModelEvaluations } from "@/lib/data";
import { DATASET_FRESHNESS } from "@/lib/data";
import { jsonError, jsonOk, SlugSchema } from "@/lib/http";

/**
 * GET /api/models/[slug] — single demo model + evaluations + provenance.
 * DEMO DATA. Cached at the edge (dataset profile). 404 for unknown slugs.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const check = SlugSchema.safeParse(slug);
  if (!check.success) return jsonError("invalid slug", 400, check.error.issues);
  const model = getModel(check.data);
  if (!model) return jsonError("not found", 404);

  const evaluations = getModelEvaluations(model.slug);
  const usedSources = new Set(evaluations.map((e) => e.sourceId));
  usedSources.add(typeof model.prices.source === "string" ? model.prices.source : "demo-vendor-sheet");

  return jsonOk({
    model,
    evaluations,
    sources: ALL_SOURCES.filter((s) => usedSources.has(s.id)),
    freshness: DATASET_FRESHNESS,
    meta: getDatasetMeta(),
  });
}
