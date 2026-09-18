import { jsonError, jsonOk } from "@/lib/http";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const revalidate = 300;

/**
 * Static snapshot of the Sep 2026 OpenRouter free-model flamethrower round.
 * GET /api/free-round -> { promptId, round, baseline, entries[] }
 * Source: web/data/openrouter-free-p001.json (no answers, no keys).
 */
export async function GET() {
  try {
    const fp = path.join(process.cwd(), "data", "openrouter-free-p001.json");
    const raw = await readFile(fp, "utf8");
    return jsonOk(JSON.parse(raw));
  } catch {
    return jsonError("round snapshot unavailable", 503);
  }
}
