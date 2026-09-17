import { NextResponse } from "next/server";
import { getEvaluationState, startLiveEvaluation } from "@/lib/eval/bdx-eval";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = getEvaluationState();
  return NextResponse.json(state, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(req: Request) {
  try {
    let body: { force?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // body optional
    }
    const state = await startLiveEvaluation(body.force ?? true);
    return NextResponse.json(state, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to trigger evaluation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
