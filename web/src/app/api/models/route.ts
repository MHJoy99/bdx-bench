import { z } from "zod";
import { getDatasetMeta, MODELS } from "@/lib/data";
import { blendedPricePer1M } from "@/lib/scores";
import { jsonError, jsonOk, parseQuery } from "@/lib/http";

/**
 * GET /api/models — list evaluated models with filters.
 * Query: provider, openWeights (true/false), q, sort, limit.
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
      case "price": {
        const pa =
          a.prices.inputPer1M != null && a.prices.outputPer1M != null
            ? blendedPricePer1M(a.prices.inputPer1M, a.prices.outputPer1M)
            : null;
        const pb =
          b.prices.inputPer1M != null && b.prices.outputPer1M != null
            ? blendedPricePer1M(b.prices.inputPer1M, b.prices.outputPer1M)
            : null;
        if (pa == null && pb == null) return 0;
        if (pa == null) return 1;
        if (pb == null) return -1;
        return pa - pb;
      }
      case "speed":
        return (b.speed?.tps ?? -1) - (a.speed?.tps ?? -1);
      case "recent":
        if (a.released == null && b.released == null) return 0;
        if (a.released == null) return 1;
        if (b.released == null) return -1;
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
