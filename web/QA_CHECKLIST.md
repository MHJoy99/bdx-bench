# BDX Bench — QA Checklist (responsive / a11y / perf / states)

Owner: QA/PERF/A11Y (sub-agent 9/10). Scope: tests, configs, checklists, a11y/perf
fixes. Do NOT rebuild the app here — app scaffold + pages belong to Agents 1–8, 10.
Zero-dep rule holds at repo root: this `web/` dir is the ONLY place where
opt-in devDeps (vitest/playwright) may ever be installed, and only with Lead approval.

Status legend: `[ ]` todo · `[x]` done · `[B]` blocked · `[S]` skipped with reason.
Automated coverage: `node --test tests/` (scores + API contract) and
`node tests/a11y-audit.js` (static a11y/perf scan). This file is the MANUAL pass.

## 0. Blockers (updated 2026-09-17)

- [B] `public/` UI files are deleted in the working tree (only `.gitkeep` remains);
  `GET /` returns JSON 404. The a11y component pass + all browser checks below are
  BLOCKED until the UI agent restores `index.html`/`app.js`/`styles.css`
  (or Agent 1 lands the `web/` app + serving route). Tracked by the intentional
  failure in `tests/api-contract.test.js` ("static serving" suite) and by
  `node tests/a11y-audit.js` exiting `2/BLOCKED`.
- [ ] SPEC-vs-code deviations (code wins; docs agent should reconcile SPEC):
  D1 `GET /api/health` → `{ok, version}` (SPEC says `{ok, mode, time}`).
  D2 `GET /api/tasks` without `?suite=` → `400 {error, suites}` (SPEC says 200 all).
  D3 `GET /api/tasks?suite=unknown` → `404` (SPEC says `200 {tasks:[]}`).
  D4 `GET /api/leaderboard` → `{leaderboard, manual, arena}` (three boards, one call).
  All four are asserted in `tests/api-contract.test.js`. Do NOT "fix" server to
  match SPEC without Lead + server-agent sign-off.

## 1. Responsive breakpoints (resize + real devices where possible)

Test every page (home, leaderboard, model, compare, prompts, arena) at:
`320 / 375 / 768 / 1024 / 1440 / 1920` px widths.

- [ ] 320px: no horizontal scroll (`document.scrollingElement.scrollWidth <= innerWidth`
  on every route); tables degrade (horizontal scroll container with sticky first
  column, or card transform) — never clipped text.
- [ ] 375px (baseline mobile): tap targets ≥ 44×44 CSS px; nav collapses to
  menu button with `aria-expanded`; leaderboard top-3 readable without zoom.
- [ ] 768px (tablet): two-column where designed; charts keep aspect ratio,
  canvas has explicit `width`/`height` attributes (no layout shift).
- [ ] 1024/1440/1920: max-width container (≈1100–1200px) centered; no
  full-bleed text lines > 80ch; sticky table headers (`position: sticky; top: 0`)
  on leaderboard/compare with visible background (opaque, not transparent).
- [ ] Sticky headers do not cover skip-link target or anchored headings
  (`scroll-margin-top` ≥ header height on `main :target`, headings, table captions).
- [ ] Zoom 200% at 1024px: no clipped controls, no overlapping sticky elements.
- [ ] Viewport notes per width recorded in PR (screenshot or width × route matrix).

## 2. Accessibility (WCAG 2.2 AA target)

Automated first: `node tests/a11y-audit.js` must exit `0` (currently `2/BLOCKED`).
Then this manual pass:

- [ ] Landmarks: exactly one `<main>` (or `role="main"`); `<header>/<nav>/<footer>`
  present; no nested `<main>`.
- [ ] Skip link: first focusable element, `href="#main"` (target `id="main"` exists,
  has `tabindex="-1"`), visible on `:focus-visible`, not covered by sticky header.
- [ ] Focus rings: `:focus-visible` outline ≥ 2px with ≥ 3:1 contrast against
  adjacent colors on EVERY interactive element (links, buttons, inputs, table
  sort headers, menu, dialog close, theme toggle, CmdK items). Test with keyboard
  only, mouse unplugged: full loop reachable, no traps, focus never drops to `body`
  after dialog close (return focus to trigger).
- [ ] Names & labels: every `<button>` has text or `aria-label`; every
  `<input>/<select>/<textarea>` has `<label for>` or `aria-label`; icon-only
  buttons named; sort buttons expose `aria-sort` on the `<th>`.
- [ ] Contrast (verified 2026-09-17 with WCAG relative-luminance calc):
  `#B8FF5A` on `#080A0D` = **16.51** ✓ · `#080A0D` on `#B8FF5A` = **16.51** ✓ ·
  `#080A0D` on `#FFFFFF` = **19.82** ✓ · `#FFFFFF` on `#080A0D` = **19.82** ✓ ·
  ⚠️ `#B8FF5A` on `#FFFFFF` = **1.20 ✗ — NEVER use accent as text in light mode.**
  Light-mode rule: body/link/small text uses dark ink (`#080A0D` or
  `--accent-ink: #3E6B00`, which is 6.35 on white); `#B8FF5A` in light mode is
  decoration/focus-ring only (large graphics ≥ 3:1 where it counts, e.g. `#558000`
  at 4.69 on white if a mid-lime is needed).
- [ ] Chart text alternatives: every canvas/SVG chart has `role="img"` + `aria-label`
  summarizing the takeaway AND a data table or `<details>` with the numbers
  (leaderboard bars, Elo history, score distributions). No information by color alone
  (add labels/patterns; check deuteranopia simulation).
- [ ] Keyboard widgets: menu (`Esc` closes, arrows move), dialog/tray
  (`role="dialog" aria-modal="true" aria-label`, focus trap, `Esc` closes),
  tables (sortable headers operable via `Enter/Space`, announced via `aria-sort`),
  CmdK palette (opens with `Ctrl/⌘+K`, arrows + `Enter`, `Esc`, `aria-activedescendant`
  on `role="listbox/option"`, input has `aria-label`).
- [ ] Reduced motion: `@media (prefers-reduced-motion: reduce)` disables
  transitions/animations/auto-playing effects; no vestibular triggers; audit CSS
  check in `tests/a11y-audit.js` must pass. Verify with OS reduced-motion ON.
- [ ] No positive `tabindex`; `autofocus` only in CmdK input while open;
  `aria-hidden="true"` only on pure decoration (never on focusable content).
- [ ] Light + dark mode both pass the full list above (theme toggle reachable,
  `aria-pressed` or `aria-label` announces state, choice persisted, no flash of
  wrong theme — `color-scheme` meta + early inline script).

## 3. URL state, share & compare

- [ ] Leaderboard state in URL: suite, sort column/dir, model filter
  (e.g. `?suite=swe-mini&sort=avgScore&dir=desc`); reload reproduces the view;
  back/forward navigates state (no dead `pushState` loops).
- [ ] Share: copy-link button copies the full stateful URL; pasted link renders
  identical view on a fresh profile (no localStorage dependency for core state).
- [ ] Compare: 2-model compare route encodes both models in the URL; unknown model
  id → friendly empty state (not blank page, not 500); identical A/B → inline
  notice, not a verdict.
- [ ] Arena match links (`/arena/:id`) hide models/answers until verdict unless
  `?reveal=1` (server enforces; UI must not leak via prefetch/logs/titles).

## 4. Empty / error / loading states (every data view)

- [ ] Loading: skeleton components (shared `.skeleton` block, `aria-busy="true"`,
  `aria-live` polite status "Loading leaderboard…"); no layout shift when data
  lands (reserve heights); skeletons reused across routes (one implementation).
- [ ] Empty: zero runs / zero prompts / zero matches each get an illustrated-empty
  state with a next action ("Run mock suite", "Seed demo", "Create prompt") —
  never a blank table or bare `[]`.
- [ ] Error: API failure (server down, 500, malformed JSON) → `role="alert"`
  banner with retry button; per-route `error` rendering + global fallback;
  404 routes → friendly not-found page linking home/leaderboard.
- [ ] Stale/slow: >3s fetch shows progress hint; abort on route change
  (no setState-after-unmount warnings, no leaked timers).
- [ ] Console-error-free: zero console errors/warnings through the full flow
  home → leaderboard → model → compare → arena → prompts on a cold load.

## 5. E2E flows (Playwright specs in `web/tests/e2e/`, opt-in — §7)

- [ ] home → leaderboard → model → compare completes with mock/seed data.
- [ ] CmdK: open, filter, jump to model/route, `Esc` closes, focus restored.
- [ ] Theme toggle persists across reload; both themes screenshot-compared.
- [ ] Viewport sweep 320/375/768/1024/1440/1920 asserts no horizontal overflow.
- [ ] Empty DB (temp `data/` + `results/` fixtures): empty states render, no 500s.
- [ ] Verdict flow: create match → post answers → 2-vote majority → Elo updates,
  blind views never expose models pre-verdict.

## 6. Perf notes (no Next.js in this repo — vanilla + node:http)

- [ ] No framework/bundler at root: UI ships as static files under `public/`
  (server streams them; keep total first-load JS < 100 KB uncompressed, CSS < 30 KB).
- [ ] Images: explicit dimensions, `loading="lazy"` below the fold, SVG preferred;
  no remote fonts without `font-display: swap` + system-font fallback.
- [ ] Server advisory (owner: server agent, WARN-only in `tests/a11y-audit.js`):
  `serveStatic` sets no `Cache-Control`/`ETag`/`Last-Modified`/`Content-Length`
  on static files — every `.js/.css` re-downloads each load. Suggested: immutable
  `Cache-Control: public, max-age=31536000` for hashed assets (or at least
  `ETag` + `Content-Length`); add `X-Content-Type-Options: nosniff`.
  Do NOT change server code from QA — file an INFO post for the server agent.
- [ ] VPS second-drive deploy: unchanged (`deploy/` + `npm run aggregate`);
  no build step introduced by QA files (all QA assets are plain node/markdown).
- [ ] Metadata: each HTML route has `<title>`, `meta[name=description]`,
  `theme-color` matching active theme; no title duplication across routes.
- [ ] Lighthouse (run post-restore, mobile + desktop on `/` and `/leaderboard`):
  target Perf ≥ 90, A11y = 100, Best Practices ≥ 95, SEO ≥ 90. Record run date +
  scores in the PR; file issues for any red metric with owner tags.

## 7. Test inventory (what runs where)

| Command | Deps | Status 2026-09-17 |
|---|---|---|
| `node --test tests/scores.test.js` | none | ✅ 46/46 pass |
| `node --test tests/api-contract.test.js` | none (spawns server on `:18765`) | 22/23 — 1 intentional FAIL = UI-missing blocker (§0) |
| `node tests/smoke.js` | none | ✅ untouched, still passes (run via `node --test tests/` glob) |
| `node tests/a11y-audit.js` | none | exit 2/BLOCKED until `public/*.html` restored |
| `npm run verify` (scripts/verify.ps1) | none | Lead-owned; QA files don't affect it |
| vitest (`web/vitest.config.ts`, `web/src/lib/scores.test.ts`) | `vitest` in `web/` only, NOT installed | dormant spec mirror — install only with Lead approval |
| playwright (`web/playwright.config.ts`, `web/tests/e2e/`) | `@playwright/test` in `web/` only, NOT installed | dormant — install only with Lead approval |

Shared semantics both suites assert: `avgScore = Σ(points·pass)/Σ(points)`,
`passRate = Σ(pass)/N`, normalized weights sum to 100%, BDX Score label
thresholds `Elite ≥0.8 / Strong ≥0.6 / Competitive ≥0.4 / Developing ≥0.2 / Early >0`
(`Unranked` for non-numbers). Any UI (vanilla or Next.js) MUST reuse these —
see `tests/scores.test.js` (source of truth) and `web/src/lib/scores.test.ts` (mirror).
