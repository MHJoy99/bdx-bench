# BDX Bench — Web App (`web/`)

Next.js 16 / React 19 site behind <https://bench.bdx.market>. This is the public
face of the benchmark. The zero-dep harness in `server/` is a separate concern
— see `SPEC.md` for that.

## 1. What this app is

It renders two things:

1. **The Showdown Score v2 leaderboard** — 8 models ranked by a strict
   implementation-level audit of the playable game builds they generated from one
   shared prompt. See `METHODOLOGY.md`.
2. **The 10 audited builds themselves** — every build is playable in-browser at
   `/play/<buildId>`, and is embedded as a *live* canvas preview across the site.

Everything is statically generated. Data is seeded from `src/lib/demo-data.ts`
and `src/lib/audit-data.ts`; there is no database and no write path for scores.

## 2. Golden rules for this app

These are not optional. They exist because each one was learned the hard way.

1. **One stylesheet.** `src/styles/globals.css` is the only imported CSS, via
   `src/app/layout.tsx`. There was previously an orphaned `src/app/globals.css`
   that duplicated the tokens and had drifted; it is gone. Do not add a second
   global sheet — if you think you need one, you probably need a Tailwind class.
2. **Declare font tokens.** `tailwind.config.ts` routes `font-sans` /
   `font-display` / `font-mono` through `var(--font-sans|--font-display|--font-mono)`.
   A `var()` with no fallback that is undefined invalidates the **entire**
   `font-family` declaration at computed-value time — it does *not* fall through
   to the rest of the stack. Those three variables must exist in
   `src/styles/globals.css` or every mono label silently renders in Inter.
3. **Density is 13px/20px.** Body text is a dense dashboard, not a landing page.
   That contract lives in the `body` rule of the live stylesheet.
4. **Motion tokens only.** Durations, easings, springs and staggers come from
   `src/lib/motion-tokens.ts`. Never invent a duration inline.
5. **transform / opacity / border-color only.** Never animate `width`, `height`,
   `margin`, or grid position — it causes layout thrash. Use
   `transform: scaleX()` for bars and `translateY()` for FLIP.
6. **No decorative motion.** No infinite loops, floating cards, parallax,
   ambient particles, pulsing badges, or confetti. Motion must originate from
   computation, evidence, or artifact behaviour. The live game canvases *are* the
   ambient layer; the chrome around them stays quiet.
7. **Never fake live data.** The audit is one static round. Count a score up once
   on mount. Do not animate an incoming "new score" event, and do not use FLIP to
   simulate a data refresh — FLIP is for real user-initiated sort/filter changes.
8. **Verify against `prefers-reduced-motion`.** `PolishMotionConfig` wraps the app
   with `MotionConfig reducedMotion="user"`, and the stylesheet sets
   `animation: none` globally. Do not bypass either. Reduced-motion users still
   get the artifact (static first frame, click to play) because the game is
   content, not decoration.
9. **Colour discipline.** Lime `--accent` only for verified score / active state
   / success, ~5% of screen area max. Warning yellow only for "known issue" /
   "partial pass". Danger red only for failure. Never decorative.

## 3. Layout

| Path | Purpose | Owner scope |
|---|---|---|
| `src/app/page.tsx` | Home — factual hero, builds grid, audit credibility | home |
| `src/app/leaderboard/` | Evidence table + FLIP rank reordering | leaderboard |
| `src/app/models/`, `src/app/models/[slug]/` | Directory + artifact-first detail pages | model |
| `src/app/benchmarks/` | The audit: 5 × 8 dimension matrix | benchmarks |
| `src/app/compare/` | Per-dimension tradeoff matrix, no winner language | compare |
| `src/app/globals.css` | **Do not create.** See rule 1. | — |
| `src/styles/globals.css` | Tokens, base, reduced-motion | benchmarks/chrome |
| `src/lib/demo-data.ts` | Seeded leaderboard/models/snapshots for the API | data |
| `src/lib/audit-data.ts` | 10 audited builds, dimension scores, verified findings | data |
| `src/lib/motion-tokens.ts` | The motion contract | data |
| `src/components/motion/` | Motion primitives | data |
| `src/components/artifact/` | `ArtifactCard`, `ArtifactGrid`, `AuditFindings` | data |
| `src/components/site-nav.tsx`, `site-footer.tsx` | Chrome | benchmarks/chrome |
| `src/public/play/<buildId>/` | The playable builds, verbatim | benchmarks |

**Never patch a build in `src/public/play/`.** Those are model output under
benchmark. Fixing them would score the fixer, not the model. Document defects in
`audit-data.ts` instead — the site surfaces them as first-class credibility
content.

## 4. Build registry

Ten audited builds, eight models. Two models shipped two builds each, so **never
look a model up by slug alone** — `AUDIT_BY_SLUG` resolves to the strongest
audited build and `SECONDARY_BUILDS` holds the alternates by canonical build id.

| Build | Model | Score | Route |
|---|---|---:|---|
| `ember-dead` | Space Bunny Free | 91.0 | `/play/ember-dead` |
| `pyre-burn-horde` | DeepSeek V4.1 Flash | 80.0 | `/play/pyre-burn-horde` |
| `firebreak-night-shift` | GPT Luna 5.6 | 62.0 | `/play/firebreak-night-shift` |
| `cinderline` | GPT 6 Sol | 58.0 | `/play/cinderline` |
| `inferno-dead` | DeepSeek V4.1 Flash | 61.0 | `/play/inferno-dead` |
| `pyro-vs-zombies` | Muse Spark 1.3 | 52.0 | `/play/pyro-vs-zombies` |
| `emberfall` | GPT Luna 6 | 51.0 | `/play/emberfall` |
| `pyroclasm-inferno` | Gemini 3.8 Flash | 43.0 | `/play/pyroclasm-inferno` |
| `zombie-fire-survival` | Gemini Pro Agent | 24.0 | `/play/zombie-fire-survival` |
| `space-bunny` | Space Bunny Free (superseded) | 49.0 | `/play/space-bunny` |

### Multi-file builds need a redirect, not a rewrite

`ember-dead` is four files (`index.html` + `style.css` + `game.js` + `audio.js`)
and loads its siblings with **relative** paths. A `rewrites()` entry serves the
right bytes but leaves the browser URL at `/play/ember-dead`, so `style.css`
resolves against `/play/` and 404s — the game ships unstyled and dead. A
trailing-slash rewrite destination 404s outright.

The fix is a `redirects()` entry to the full `index.html` path, which restores
`/play/ember-dead/` as the base. If you add another multi-file build, do the same
and add all its asset paths to the smoke checks in `deploy/deploy.sh`.

## 5. Verify before you claim done

```powershell
cd web
npm run lint      # tsc --noEmit — this IS the lint gate; ESLint is not configured
npm run build     # must end with the static/SSG route table
```

`npm run check` runs both. There is no ESLint in this project and `next lint` was
removed in Next 16 — do not re-add a script that pretends otherwise.

Then confirm the deploy smoke checks still pass, and that `/play/<newBuild>` and
each of its assets return 200.

## 6. Deploy

`deploy/deploy.sh` runs on the `racknerd` host against
`/srv/bot-storage/sites/bench.bdx.market`: `git pull`, `npm ci`, `npm run build`,
copy the standalone output, copy `data/*.json`, restart the service, then curl a
smoke list. It **must** stay green — including the leaderboard API assertion.

`data/*.json` is gitignored, so score-journal changes do not travel with `git
push`. After changing the journal, `scp` it to the host explicitly:

```powershell
scp data/scores.json racknerd:/srv/bot-storage/sites/bench.bdx.market/data/scores.json
ssh racknerd "bash /srv/bot-storage/sites/bench.bdx.market/deploy/deploy.sh"
```
