# BDX Bench Security Notes

## Content-Security-Policy (S1)

The site sends an enforced `Content-Security-Policy` header (not report-only)
from `web/next.config.mjs` `headers()` on `/:path*`:

```
default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://c.clarity.ms https://c.bing.com; media-src 'self' data: blob:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'
```

Deviations from the previous report-only set (each removes a real,
browser-observed violation; nothing else changed):
- `script-src` adds `https://scripts.clarity.ms` — the first-party Clarity
  loader in `web/src/app/layout.tsx` pulls its payload from there; without it
  the payload load is blocked (`script-src-elem` violation).
- `img-src` adds `https://c.clarity.ms` — the Clarity beacon pixel; without
  it the pixel is blocked (`img-src` violation) — plus `https://c.bing.com`,
  which is the redirect target of that pixel (Clarity is Microsoft; the pixel
  302s to c.bing.com, and CSP checks the post-redirect hop).
- No `unsafe-eval`: the `/leaderboard` `eval` violation came from zod 4.6's
  JIT `new Function` feature probe (`allowsEval`), which fires a violation
  event even though zod catches it and falls back. Fixed in code instead:
  new `web/src/lib/zod-jitless.ts` calls `z.config({ jitless: true })` so the
  probe never runs; it is imported first in `providers.tsx` (client root),
  before any page-level `safeParse`. Verified: the `eval` event is gone and
  leaderboard data still parses (page renders rows).

Notes and limitations:

- `script-src 'unsafe-inline'` is retained. It is required by Next.js inline
  runtime payloads and the two first-party analytics snippets in
  `web/src/app/layout.tsx` (Google gtag inline config and Microsoft Clarity
  loader). Removing it without per-request nonces/hashes breaks the site, so
  it is kept and recorded here instead of silently dropped.
- `style-src 'unsafe-inline'` is retained for Next.js / styled-JSX runtime
  styles and the Google Fonts stylesheet import in `web/src/styles/globals.css`.
- `connect-src 'self' https:` is intentionally broad (analytics beacons to
  googletagmanager/clarity endpoints). Tightening it further is a follow-up,
  not claimed here.
- `X-Frame-Options` and `X-Content-Type-Options` are intentionally NOT set in
  Next.js; the VPS nginx/WordOps layer already sends them and duplicates
  cause misbehaviour.

Verified locally with `next build` + `next start -p 3110` and headless Chrome
(console + `securitypolicyviolation` events): 0 CSP violations on `/`,
`/models`, `/leaderboard`, `/play/claude-haiku-5-5`.

## Lockfiles and audit (S2)

- `web/package-lock.json` is committed; `cd web && npm audit` reports
  `found 0 vulnerabilities`.
- The repo root (`package.json`) declares no `dependencies` or
  `devDependencies` (scripts only: `start`, `mock`, `aggregate`, `seed`,
  `test`, `a11y`, `verify`), so no root lockfile is created. Root `npm audit`
  fails with `ENOLOCK` (`This command requires an existing lockfile`), which
  is expected for a dependency-free root and not a vulnerability signal.

## Secret scan (S6)

Tracked files and the last 3 commits were scanned with
`git grep -n -E "sk-[A-Za-z0-9]{20,}"`, `EAAB`, `tvly-`, `PRIVATE KEY`, and
case-insensitive `(token|password|secret)\s*[:=]`, plus
`git log -p -3` piped through the same patterns. No real secret values found
(the only `token` hits are the `moveToken: number` animation prop in the
leaderboard components, not credentials). No values are reproduced here.

## Public ports (decision record)

- **5050 — CLOSED.** Closed by the Meta bot removal. Verified on the VPS: no
  listener, no DNAT rule, outside connect fails. Nothing in this repo re-opens
  it. No fix is claimed beyond the recorded removal.
- **3000 (Chatwoot, docker-proxy on 0.0.0.0) — publicly reachable.
  Decision: ACCEPTED RISK PENDING OWNER.** Recommended fix (not applied here,
  owner action on the VPS): bind `127.0.0.1:3000` in the Chatwoot compose file
  on the VPS. Do not claim this port is fixed unless it is.
- **Port 80 ACME renewal — UNRESOLVED, OWNER DECISION.** Required for
  HTTP-01 renewal; any restriction (e.g. Cloudflare-only or challenge-path
  only) is an owner call. Left open pending that decision.
- **22 and Cloudflare-only 80/443 — KEPT.** SSH (22) stays restricted to the
  owner; 80/443 stay behind Cloudflare as configured. No change proposed.
