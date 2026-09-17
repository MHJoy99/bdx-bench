/**
 * Test doubles for `zod` and `next/server` — Owner: SUB-AGENT 8/10 BACKEND+DATA.
 *
 * Used ONLY by web/scripts/smoke-*.mjs so route/data logic can execute under
 * plain Node (no node_modules installed). The zod double is intentionally
 * permissive: schema builders return an inert chain, and safeParse/parse echo
 * the input. That means these smokes verify OUR logic (filtering, sorting,
 * envelopes, status codes) — not Zod itself. Real validation runs in Next.
 */

// ---- zod double ------------------------------------------------------------
function makeChain() {
  const fn = (...args) => chain;
  const chain = new Proxy(fn, {
    get(target, prop) {
      if (prop === "safeParse") return (data) => ({ success: true, data });
      if (prop === "parse") return (data) => data;
      if (prop === Symbol.toPrimitive) return () => 0;
      if (prop === "then") return undefined;
      return chain;
    },
    apply() {
      return chain;
    },
  });
  return chain;
}
const chain = makeChain();
export const z = new Proxy(
  {},
  {
    // Every builder (object, string, coerce, enum, …) is the inert chain:
    // callable, infinitely chainable, echoes input on safeParse/parse.
    get(target, prop) {
      if (prop === "then") return undefined;
      return chain;
    },
  },
);

// ---- next/server double ----------------------------------------------------
export class NextResponse {
  static json(data, init = {}) {
    return {
      status: init.status ?? 200,
      headers: new Headers(init.headers ?? {}),
      body: data,
    };
  }
}
