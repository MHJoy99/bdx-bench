// GET /api/votes — showdown match m-001 counts (+ caller's vote).
// POST /api/votes — cast/move caller's vote (side A or B) on match m-001.
// Production starts 1-0: one pre-seeded community vote for side A.
// Copy: "Showdown vote — match m-001, open" (never verified/global).
// Limits: 1MB JSON body cap. Identity: anonymous bdx_voter cookie (hashed server-side).

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MATCH_ID,
  MATCH_SIDE_A_SLUG,
  MATCH_SIDE_B_SLUG,
  MATCH_STATUS,
  applyVoterCookie,
  castVote,
  getVotesStore,
  hashVoter,
  newVoterId,
  parseVoterId,
  voteSummary,
} from "@/lib/store/json-store";

const NOTICE = "Showdown vote — match m-001, open";
const MAX_BODY_BYTES = 1_048_576;

const PostBodySchema = z.object({
  matchId: z.literal(MATCH_ID),
  side: z.enum(["A", "B"]),
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

function matchPayload(
  summary: { A: number; B: number; total: number; userVote: "A" | "B" | null },
) {
  return {
    id: MATCH_ID,
    sideA: MATCH_SIDE_A_SLUG,
    sideB: MATCH_SIDE_B_SLUG,
    status: MATCH_STATUS,
    counts: { A: summary.A, B: summary.B },
    total: summary.total,
    userVote: summary.userVote,
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId") ?? MATCH_ID;
  if (matchId !== MATCH_ID) {
    return NextResponse.json({ error: "unknown matchId" }, { status: 404 });
  }

  const { voterId, fresh } = withVoter(req);
  const store = await getVotesStore();
  const summary = voteSummary(store, MATCH_ID, hashVoter(voterId));
  const res = NextResponse.json({ match: matchPayload(summary), notice: NOTICE });
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
  const result = await castVote(MATCH_ID, hashVoter(voterId), parsed.data.side);
  const res = NextResponse.json({
    match: matchPayload({ ...result, userVote: parsed.data.side }),
    notice: NOTICE,
  });
  if (fresh) applyVoterCookie(res, voterId);
  return res;
}
