import { z } from "zod";
import { getDatasetMeta, MODELS } from "@/lib/data";
import { blendedPricePer1M } from "@/lib/scores";
import { jsonError, jsonOk, parseQuery } from "@/lib/http";

/**
 * GET /api/models — list demo models with filters.
 * Query: provider, openWeights (true/false), q, sort, limit.
 * DEMO DATA. Cached at the edge (dataset profile).
 */
const ModelsQuerySchema = z.object({
  provider: z.string().min(1).max(40).optional(),
  openWeights: z.enum(["true", "false"]).optional(),
  q: z.string().max(120).optional(),
  sort: z.enum(["bdxScore", "overall", "price", "speed", "recent"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(req: Request) {
  const parsed = parseQuery(ModelsQuerySchema, req.url);
  if (!parsed.ok) return jsonError("invalid query", 400, parsed.issues);
  const { provider, openWeights, q, sort = "bdxScore", limit } = parsed.data;

  const query = q?.trim().toLowerCase() ?? "";
  const filtered = MODELS.filter(
    (m) =>
      (provider == null || m.provider === provider) &&
      (openWeights == null || m.openWeights === (openWeights === "true")) &&
      (query === "" ||
        m.name.toLowerCase().includes(query) ||
        m.family.toLowerCase().includes(query) ||
        m.slug.includes(query)),
  );

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "overall":
        return b.scores.overall - a.scores.overall;
      case "price":
        return (
          blendedPricePer1M(a.prices.inputPer1M, a.prices.outputPer1M) -
          blendedPricePer1M(b.prices.inputPer1M, b.prices.outputPer1M)
        );
      case "speed":
        return (b.speed?.tps ?? -1) - (a.speed?.tps ?? -1);
      case "recent":
        return a.released < b.released ? 1 : -1;
      case "bdxScore":
      default:
        return (b.scores.bdxScore ?? 0) - (a.scores.bdxScore ?? 0);
    }
  });

  return jsonOk({
    models: limit != null ? sorted.slice(0, limit) : sorted,
    meta: getDatasetMeta(),
  });
}
