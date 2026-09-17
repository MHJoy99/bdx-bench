// GET /api/comments — list a thread (?scope=model|match&id=slug|m-001) or all threads.
// POST /api/comments — add a comment { scope, id, name (<=200), text (<=2000) }.
// Copy: "Community comments — stored on this server" (never verified/global).
// Limits: 1MB JSON body cap, 200-char names, 2000-char texts.
// Identity: anonymous bdx_voter cookie is set for consistent user state.

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MATCH_ID,
  MODEL_SLUGS,
  applyVoterCookie,
  commentKey,
  getCommentsStore,
  listComments,
  newVoterId,
  parseVoterId,
  addComment,
} from "@/lib/store/json-store";

const NOTICE = "Community comments — stored on this server";
const MAX_BODY_BYTES = 1_048_576;
const MAX_NAME = 200;
const MAX_TEXT = 2000;

const ScopeSchema = z.enum(["model", "match"]);
const SlugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const GetQuerySchema = z.object({
  scope: ScopeSchema.optional(),
  id: SlugSchema.optional(),
});

const PostBodySchema = z
  .object({
    scope: ScopeSchema,
    id: SlugSchema,
    name: z.string().trim().min(1, "name required").max(MAX_NAME, "name too long (max 200)"),
    text: z.string().trim().min(1, "text required").max(MAX_TEXT, "text too long (max 2000)"),
  })
  .superRefine((val, ctx) => {
    if (val.scope === "model" && !MODEL_SLUGS.includes(val.id as (typeof MODEL_SLUGS)[number])) {
      ctx.addIssue({ code: "custom", message: "unknown model id", path: ["id"] });
    }
    if (val.scope === "match" && val.id !== MATCH_ID) {
      ctx.addIssue({ code: "custom", message: "unknown match id", path: ["id"] });
    }
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

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const parsed = GetQuerySchema.safeParse({
    scope: url.searchParams.get("scope") ?? undefined,
    id: url.searchParams.get("id") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid query", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { scope, id } = parsed.data;
  if ((scope == null) !== (id == null)) {
    return NextResponse.json(
      { error: "scope and id are required together" },
      { status: 400 },
    );
  }

  const store = await getCommentsStore();
  const existingVoter = parseVoterId(req);
  const fresh = existingVoter === null;
  const voterId = existingVoter ?? newVoterId();

  if (scope != null && id != null) {
    const key = commentKey(scope, id);
    const res = NextResponse.json({
      key,
      scope,
      id,
      comments: listComments(store, key),
      notice: NOTICE,
    });
    if (fresh) applyVoterCookie(res, voterId);
    return res;
  }

  // No filter: list every thread (each capped to the latest 100 in the response).
  const threads: Record<string, ReturnType<typeof listComments>> = {};
  for (const key of Object.keys(store)) {
    const thread = listComments(store, key);
    threads[key] = thread.slice(Math.max(0, thread.length - 100));
  }
  const res = NextResponse.json({ threads, notice: NOTICE });
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

  const key = commentKey(parsed.data.scope, parsed.data.id);
  const { comment, count } = await addComment(key, parsed.data.name, parsed.data.text);

  const existingVoter = parseVoterId(req);
  const fresh = existingVoter === null;
  const res = NextResponse.json({
    key,
    scope: parsed.data.scope,
    id: parsed.data.id,
    comment,
    count,
    notice: NOTICE,
  });
  if (fresh) applyVoterCookie(res, existingVoter ?? newVoterId());
  return res;
}
