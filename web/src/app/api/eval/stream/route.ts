import { NextRequest } from "next/server";
import {
  getEvaluationState,
  subscribeToEvaluation,
  type EvaluationState,
  type EvalTelemetryLog,
} from "@/lib/eval/bdx-eval";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  let isClosed = false;
  let unsubscribe: (() => void) | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send current snapshot immediately
      const initial = getEvaluationState();
      controller.enqueue(
        encoder.encode(`event: state\ndata: ${JSON.stringify(initial)}\n\n`)
      );

      // Subscribe to real-time events
      unsubscribe = subscribeToEvaluation(
        (state: EvaluationState, log?: EvalTelemetryLog) => {
          if (isClosed) return;
          try {
            if (log) {
              controller.enqueue(
                encoder.encode(`event: log\ndata: ${JSON.stringify(log)}\n\n`)
              );
            }
            controller.enqueue(
              encoder.encode(`event: state\ndata: ${JSON.stringify(state)}\n\n`)
            );
          } catch {
            // Stream closed
          }
        }
      );

      // Heartbeat comment every 15s to keep connections alive
      heartbeatTimer = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          // Closed
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        if (unsubscribe) unsubscribe();
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
    cancel() {
      isClosed = true;
      if (unsubscribe) unsubscribe();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
