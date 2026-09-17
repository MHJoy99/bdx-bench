import { z } from "zod";
import { getDatasetMeta, getTrends, type TrendRange } from "@/lib/data";
import { jsonError, jsonOk, parseQuery } from "@/lib/http";

/**
 * GET /api/trends — monthly avg-BDX-Score trajectory (demo, illustrative).
 * Query: range = 30d | 90d | 1y | all (default all).
 * DEMO DATA. Cached at the edge (aggregate profile).
 */
const TrendsQuerySchema = z.object({
  range: z.enum(["30d", "90d", "1y", "all"]).optional(),
});

export async function GET(req: Request) {
  const parsed = parseQuery(TrendsQuerySchema, req.url);
  if (!parsed.ok) return jsonError("invalid query", 400, parsed.issues);
  const range: TrendRange = parsed.data.range ?? "all";
  return jsonOk({ trends: getTrends(range), meta: getDatasetMeta() }, "aggregate");
}
