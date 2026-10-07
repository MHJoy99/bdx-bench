import { z } from "zod";

/**
 * S1 (CSP) fix: run before any client-side schema parse.
 *
 * Zod 4.6's JIT compiler feature-detects `new Function` support with a
 * try/catch probe (`allowsEval` in `zod/v4/core/util.js`). Under an enforced
 * Content-Security-Policy without `unsafe-eval`, the caught probe still
 * fires a `securitypolicyviolation` event (blockedURI `eval`) — zod swallows
 * the error and falls back to the runtime parser, but the violation is real
 * and breaks the zero-violation bar. Setting `jitless` makes zod skip the
 * probe entirely, so no `eval` is ever attempted. No `unsafe-eval` needed.
 */
z.config({ jitless: true });
