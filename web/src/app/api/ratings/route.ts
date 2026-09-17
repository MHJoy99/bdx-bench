// GET /api/ratings — list community rating counts/avgs (+ caller's rating).
// POST /api/ratings — set caller's 1-5 rating for a canonical model slug.
// Copy: "Community ratings — stored on this server" (never verified/global).
// Limits: 1MB JSON body cap. Identity: anonymous bdx_voter cookie (hashed server-side).

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MODEL_SLUGS,
  applyVoterCookie,
  getRatingsStore,
  hashVoter,
  newVoterId,
  parseVoterId,
  ratingSummary,
  setRating,
} from "@/lib/store/json-store";

const NOTICE = "Community ratings — stored on this server";
const MAX_BODY_BYTES = 1_048_576;

const ModelSlugSchema = z.enum([MODEL_SLUGS[0] ?? "muse-spark-1-3", MODEL_SLUGS[1] ?? "gemini-3-8-flash"]);
const PostBodySchema = z.object({
  modelSlug: ModelSlugSchema,
  value: z.number().int().min(1).max(5),
});

function textBytes(s: string): number {
  return new TextEncoder().encode(s).length;
}

async function readCappedJson(
  req: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; status: number; error: string }> {
  const len = req.headers.get("content-length");
  if (len !== null && Number(len) > MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: "body too large (max 1MB)" };
  }
  const text = await req.text();
  if (textBytes(text) > MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: "body too large (max 1MB)" };
  }
  if (text.trim() === "") return { ok: false, status: 400, error: "empty body" };
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, error: "invalid JSON" };
  }
}

function withVoter(req: Request): { voterId: string; fresh: boolean } {
  const existing = parseVoterId(req);
  if (existing) return { voterId: existing, fresh: false };
  return { voterId: newVoterId(), fresh: true };
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const only = searchParams.get("modelSlug");
  if (only !== null && !MODEL_SLUGS.includes(only as (typeof MODEL_SLUGS)[number])) {
    return NextResponse.json({ error: "unknown modelSlug" }, { status: 400 });
  }

  const { voterId, fresh } = withVoter(req);
  const voterHash = hashVoter(voterId);
  const store = await getRatingsStore();

  const ratings: Record<string, { count: number; sum: number; avg: number; userRating: number | null }> = {};
  const slugs = only !== null ? [only] : [...MODEL_SLUGS];
  for (const slug of slugs) {
    ratings[slug] = ratingSummary(store, slug, voterHash);
  }

  const res = NextResponse.json({ ratings, scale: [1, 2, 3, 4, 5], notice: NOTICE });
  if (fresh) applyVoterCookie(res, voterId);
  return res;
}

export async function POST(req: Request): Promise<NextResponse> {
  const body = await readCappedJson(req);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });

  const parsed = PostBodySchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { voterId, fresh } = withVoter(req);
  const result = await setRating(
    parsed.data.modelSlug,
    hashVoter(voterId),
    parsed.data.value,
  );
  const res = NextResponse.json({
    modelSlug: parsed.data.modelSlug,
    count: result.count,
    sum: result.sum,
    avg: result.avg,
    userRating: result.userRating,
    notice: NOTICE,
  });
  if (fresh) applyVoterCookie(res, voterId);
  return res;
}
