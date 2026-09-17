# Polish report — SUB-AGENT 10/10 POLISH

Scope kept: motion, palette/search, skeletons, number microinteractions,
state illustrations, consistency review. No page, route, API, backend, or
peer-component edits — `git status` shows zero modifications to tracked
files (the `public/` deletions pre-date this pass; UI agent's area).

## Files created (10, all additive)

| File | Bytes | Purpose |
|---|---|---|
| `src/components/search/palette-items.ts` | 7644 | Index builder, token-AND ranking, localStorage recents |
| `src/components/search/CommandPalette.tsx` | 10998 | Controlled ⌘K palette UI |
| `src/components/search/CommandPaletteHost.tsx` | 3105 | Shortcut toggle + trigger + palette, self-contained |
| `src/components/motion/polish-motion.tsx` | ~7100 | MotionConfig, FadeIn, Stagger, TabIndicator, ChartEntrance, DialogMotion, CompareTrayMotion |
| `src/components/ui/skeleton-variants.tsx` | 4777 | DataTable / leaderboard-row / model-card / chart skeletons |
| `src/components/ui/number-transition.tsx` | 3175 | NumberTransition + RankChange |
| `src/components/ui/state-illustrations.tsx` | 3713 | EmptyMark/ErrorMark geometric SVG + composed states |
| `src/styles/polish.css` | 3220 | Status-token completion, hover helpers, `.bdx-kbd` |
| `PALETTE_WIRING.md` | 3333 | Integration snippet (Options A/B), deps, behavior contract |
| `POLISH_NOTES.md` | — | This file |

Wiring: palette is NOT yet mounted in layout (nav agent owns
`search-command-host.tsx`; Option B documents the 3-line swap). Per
contract, no peer routes were overwritten — layout TODO lives in
`PALETTE_WIRING.md` instead of a stub that would rot.

## Motion decisions

- Entrances only: opacity + 4–8px Y, 120–220ms, ease-out. No loops, floats,
  parallax, marquee, or animated table rows. Tables render instantly;
  skeletons cover the loading interval.
- Spring (`stiffness 550, damping 40`) ONLY for `TabIndicator` layoutId
  sliding. Panels/tray use fixed ease-out cubic `[0.22,1,0.36,1]`.
- `motion/react` import path (README stack says "Motion", not framer-motion).
- Reduced motion: `PolishMotionConfig` → `MotionConfig reducedMotion="user"`;
  hook canonical home is `charts/theme.ts:37` (`usePrefersReducedMotion`) —
  re-exported from polish-motion, not duplicated. ECharts animation stays
  with charts agent's `animationFor()` (`charts/theme.ts:111`).
- Palette/dialog/tray: overlay fade 160ms + panel/tray rise 8px + fade
  200ms, with exit animations via keyed `AnimatePresence` children.
- Skeleton shimmer: peer-owned (app `globals.css:165-201`); left untouched.
  Pulse is transient (loading only) and globally disabled under
  reduced-motion (`globals.css:204-216`).

## Palette behavior

- Searches models (`/models/[slug]`), benchmarks (`/benchmarks/[slug]`),
  all 9 `Provider` enum values + derived families (`/leaderboard?…`),
  and the 7 README routes. Structural prop types accept full
  `Model`/`Benchmark` objects directly.
- Ranking: token-AND substring; title-prefix > title-substring >
  hint/keyword, stable, capped at 40 (`palette-items.ts`).
- Empty query: recents (localStorage `bdx-palette-recent-v1`, max 8,
  stale-id tolerant) + model/page suggestions. No-results state included.
- Keyboard: ↑↓/Home/End/Enter/Esc, `aria-activedescendant` combobox wiring,
  autofocus + body scroll lock on open, ⌘K/Ctrl+K toggle in host.
- ⚠️ Do not mount `CommandPaletteHost` alongside the placeholder
  `useCmdK` in `search-command.tsx:9` — double shortcut registration
  toggles twice. Remove one (wiring doc Option B).

## Skeletons

- Base `Skeleton`/`TableSkeleton` already existed (`ui/skeleton.tsx:5-27`,
  design-system agent) — reused, not forked. Added
  `DataTableSkeleton` (header + N×M grid), `LeaderboardRowSkeleton`
  (rank + name + score + price), `ModelCardSkeleton` (responsive card grid),
  `ChartSkeleton` (deterministic bar heights — no `Math.random`, SSR-safe).
- All expose `role="status"` + sr-only label; inner blocks `aria-hidden`.
- Minor pre-existing nit (not touched): base `Skeleton` stacks
  `.skeleton-shimmer` and `animate-pulse` (`ui/skeleton.tsx:10`) — two
  concurrent loading animations; design-system agent may drop one.

## Consistency review (reviewed, not overwritten)

| File:lines | Finding | Action |
|---|---|---|
| `ui/badge.tsx:17-19` | `fail`/`warn`/`info` variants use `--danger-muted`, `--warning-muted/border`, `--info-muted/border` — undefined in `app/globals.css`, so those badges render transparent fills | FIXED additively: token completion block in `src/styles/polish.css` (both themes, mirrors accent 12%/35% construction) |
| `src/app/layout.tsx:5` vs `src/app/globals.css` vs `src/styles/globals.css` | Layout imports `@/styles/globals.css` (34-line scaffold stub, HSL vars, no BDX tokens) while the real design-system globals (216 lines, tokens, focus ring, shimmer, reduced-motion) sits unimported at `src/app/globals.css` — buttons/cards/tabs resolve `var(--accent)` etc. to nothing at runtime | OPEN for scaffold/design agents: point the import at the real file or merge; polish components use `var(--x, fallback)`-safe classes where practical but assume the real globals |
| `src/app/page.tsx:43` | Hardcodes `bg-[#080A0D] text-[#E8ECEF]` instead of `var(--bg)/var(--text)`; `#E8ECEF` is a 4th near-white beside tokens `#F2F5F7`/`#F2F5F4` | OPEN for homepage agent |
| `tailwind.config.ts:18` (`bdx.border #232A35`) vs `lib/tokens.ts:34` (`border #222A33`) vs `charts/theme.ts:16` (`DARK_BORDER #232A35`) | Three near-identical border values across owners | OPEN for design-system agent to canonize (visual impact negligible) |
| `components/search-command.tsx:22-50` | Placeholder dialog overlaps this pass's palette (by design — file comments delegate palette to search agent) | Documented swap in `PALETTE_WIRING.md`; no edit made |
| `components/home/home-skeletons.tsx`, `components/leaderboard/leaderboard-table.tsx` | Feature-local skeletons reference base `Skeleton` — compatible with new variants, no fork detected | No action; feature teams may adopt `skeleton-variants.tsx` |
| `components/compare-tray-provider.tsx` | State + persistence only, no tray UI yet | `CompareTrayMotion` ready for tray-UI owner; no action |

Focus/hover state: global `:focus-visible` ring already exists
(`app/globals.css:99-103`); buttons/tabs/dialog-close carry their own rings
(`button.tsx:6`, `tabs.tsx:106`, `dialog.tsx:56,102`). Added flat
`.bdx-row-hover` / `.bdx-card-hover` (border/bg shifts only, hover-none
guarded) — no lift/shadow/scale anywhere in this pass.

## Remaining AI-slop watchlist

1. Import swap for real globals (above) — currently the largest visual risk.
2. `page.tsx:43` hardcoded colors; audit other feature files for hexLiteral
   drift (`rg "#[0-9A-Fa-f]{6}" src --glob '!*theme*' --glob '!*tokens*'`).
3. Duplicate `useCmdK` vs host toggle (above).
4. `animate-pulse` + shimmer stacking on base Skeleton (above).
5. `DemoDataBadge`/`MethodologyVersionTag` copy assumes demo context —
   fine, but every new surface must keep them (methodology rule, not slop).
6. No glow/gradient/blob/sparkle patterns found in reviewed peer files;
   shimmer keyframes in app globals use a neutral sweep (acceptable,
   transient, reduced-motion-gated).

## Deps required (scaffold agent owns `web/package.json`, currently zero deps)

```powershell
cd web; npm i motion lucide-react
```

Plus the peers' assumed set (clsx, tailwind-merge, class-variance-authority,
zod, date-fns, next-themes, nuqs, etc. per README stack). Nothing in this
pass was `npm install`ed or built — no `node_modules` in `web/`.

## Verification performed

- All 10 files present; zero tracked-file modifications (`git status`:
  only pre-existing `public/` deletions + untracked `web/`, `tests/`).
- `rg` over new files: no secrets (`BDX_AI_API_KEY`, tokens, auth headers);
  no `linear-gradient`/`glow`/`parallax`/`blur(`/slop except in comments.
- Every `@/` import in new files resolves to an existing module
  (`lib/utils`, `lib/types`, `lib/format`, `components/charts/theme`,
  `components/ui/skeleton`, `components/ui/button`); externals limited to
  `motion/react`, `lucide-react` (documented, stack-approved),
  `next/navigation`, `react`.
- Strict-TS hazards checked by review (`noUncheckedIndexedAccess`
  indexing guarded; `POLISH_EASE` typed as fixed tuple; no `any`).
- Full `tsc`/`next build` not run: no `node_modules` exists and dependency
  installation belongs to the scaffold agent; palette logic
  (`palette-items.ts`) is deliberately React-free for future unit tests.
- No live gateway calls; no key material touched. No commits made.
