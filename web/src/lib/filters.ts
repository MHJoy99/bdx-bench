import { z } from "zod";

/**
 * URL-persisted filter schemas (nuqs-compatible).
 * Pages must parse searchParams with these — no ad-hoc query parsing.
 */

export const LeaderboardFiltersSchema = z.object({
  provider: z.string().optional(),
  family: z.string().optional(),
  openWeights: z.enum(["all", "open", "closed"]).default("all"),
  sort: z
    .enum(["bdxScore", "overall", "price", "speed"])
    .default("bdxScore"),
  query: z.string().max(120).default(""),
});

export const CompareFiltersSchema = z.object({
  models: z.array(z.string()).max(6).default([]),
  benchmark: z.string().default("overall"),
});

export const TrendsFiltersSchema = z.object({
  range: z.enum(["30d", "90d", "1y", "all"]).default("90d"),
  family: z.string().optional(),
});

export type LeaderboardFilters = z.infer<typeof LeaderboardFiltersSchema>;
export type CompareFilters = z.infer<typeof CompareFiltersSchema>;
export type TrendsFilters = z.infer<typeof TrendsFiltersSchema>;

/** Parse Next.js searchParams (Record of string|string[]|undefined) safely. */
export function parseSearchParams<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  params: Record<string, string | string[] | undefined>,
): z.infer<T> {
  const flat: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    flat[k] = Array.isArray(v) ? v : v;
  }
  // nuqs-style: comma-joined "models=a,b" -> array
  if (typeof flat["models"] === "string" && "models" in schema.shape) {
    flat["models"] = (flat["models"] as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const parsed = schema.safeParse(flat);
  if (parsed.success) return parsed.data;
  return schema.parse({});
}
