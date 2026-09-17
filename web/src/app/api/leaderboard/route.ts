import { z } from "zod";
import { getDatasetMeta, getLeaderboard } from "@/lib/data";
import { jsonError, jsonOk, parseQuery } from "@/lib/http";

/**
 * GET /api/leaderboard — ranked demo rows (BDX Bench Score desc).
 * Query: provider, openWeights (true/false), limit.
 * DEMO DATA. Cached at the edge (dataset profile).
 */
const LeaderboardQuerySchema = z.object({
  provider: z.string().min(1).max(40).optional(),
  openWeights: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(req: Request) {
  const parsed = parseQuery(LeaderboardQuerySchema, req.url);
  if (!parsed.ok) return jsonError("invalid query", 400, parsed.issues);
  const { provider, openWeights, limit } = parsed.data;

  return jsonOk({
    leaderboard: getLeaderboard({
      provider,
      openWeights: openWeights == null ? undefined : openWeights === "true",
      limit,
    }),
    meta: getDatasetMeta(),
  });
}
