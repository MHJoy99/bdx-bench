import { jsonError, jsonOk } from "@/lib/http";

export const revalidate = 3600;

type FreeEntry = {
  id: string;
  context: number | null;
  description: string;
};

let cache: { at: number; payload: { models: FreeEntry[]; total: number; updatedAt: string } } | null = null;

/**
 * Public OpenRouter catalog proxy (no keys).
 * GET /api/openrouter-free -> { models: FreeEntry[], total, updatedAt }
 * Free = $0 in/out or :free suffix. Cached 1h in-memory.
 */
export async function GET() {
  if (cache && Date.now() - cache.at < 3600_000) {
    return jsonOk(cache.payload);
  }
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "bdx-bench-web" },
    });
    if (!r.ok) {
      return jsonError("catalog unavailable", 502);
    }
    const j = (await r.json()) as { data?: Array<{ id?: string; context_length?: number; description?: string; pricing?: { prompt?: string; completion?: string } }> };
    const all = j.data || [];
    const models: FreeEntry[] = all
      .filter((m) => {
        const p = m.pricing || {};
        const freePrice = parseFloat(p.prompt || "1") === 0 && parseFloat(p.completion || "1") === 0;
        return freePrice || String(m.id || "").endsWith(":free");
      })
      .map((m) => ({
        id: String(m.id || ""),
        context: typeof m.context_length === "number" ? m.context_length : null,
        description: String(m.description || "").slice(0, 160),
      }))
      .filter((m) => m.id && m.id !== "openrouter/free");
    const payload = { models, total: all.length, updatedAt: new Date().toISOString() };
    cache = { at: Date.now(), payload };
    return jsonOk(payload);
  } catch {
    return jsonError("catalog fetch failed", 502);
  }
}
