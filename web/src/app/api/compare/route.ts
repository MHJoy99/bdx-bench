import { z } from "zod";
import { getDatasetMeta, getModel, getModelEvaluations } from "@/lib/data";
import { jsonError, jsonOk, parseQuery, splitSlugs } from "@/lib/http";

/**
 * GET /api/compare?models=a,b[,c...] — side-by-side demo models (1-6).
 * Unknown slugs -> 400 listing them (fail fast, no silent drops).
 * DEMO DATA. Cached at the edge (aggregate profile).
 */
const CompareQuerySchema = z.object({
  models: z.string().min(1, "models required, e.g. ?models=a,b").max(600),
  benchmark: z.string().min(1).max(80).optional(),
});

const MAX_COMPARE_MODELS = 6;

export async function GET(req: Request) {
  const parsed = parseQuery(CompareQuerySchema, req.url);
  if (!parsed.ok) return jsonError("invalid query", 400, parsed.issues);

  const slugs = splitSlugs(parsed.data.models, MAX_COMPARE_MODELS);
  if (slugs.length === 0) {
    return jsonError("models required, e.g. ?models=a,b", 400);
  }
  const unknown = slugs.filter((s) => getModel(s) == null);
  if (unknown.length > 0) {
    return jsonError("unknown model slug(s)", 400, { unknown });
  }

  const models = slugs.map((s) => getModel(s));
  const evaluations: Record<string, ReturnType<typeof getModelEvaluations>> = {};
  for (const s of slugs) evaluations[s] = getModelEvaluations(s);

  return jsonOk(
    { models, evaluations, meta: getDatasetMeta() },
    "aggregate",
  );
}
