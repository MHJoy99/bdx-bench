# Command palette wiring (10/10 POLISH)

Additive integration for the ⌘K palette. No route files are touched.

## What was built (owned by polish agent)

| File | Purpose |
|---|---|
| `src/components/search/palette-items.ts` | Index builder, token-AND ranking, localStorage recents |
| `src/components/search/CommandPalette.tsx` | Controlled palette UI (models, benchmarks, providers, families, pages) |
| `src/components/search/CommandPaletteHost.tsx` | ⌘K/Ctrl+K toggle + nav trigger + palette, self-contained state |
| `src/components/motion/polish-motion.tsx` | DialogMotion used by the palette, reduced-motion config |
| `src/styles/polish.css` | `.bdx-kbd` chips, hover helpers, missing status tokens |

## Option A — standalone (recommended until nav lands data)

Render the host anywhere in the nav (it owns its open state, so layout
stays a server component). Pass live data when available; everything
except pages degrades to `[]` cleanly:

```tsx
import { CommandPaletteHost } from "@/components/search/CommandPaletteHost";
import { PolishMotionConfig } from "@/components/motion/polish-motion";

// data: map lib/data.ts models/benchmarks to { slug, name, family, provider }
// and { slug, name, category } — full Model/Benchmark objects satisfy the
// structural prop types, so `models={models}` works directly.
<CommandPaletteHost models={models} benchmarks={benchmarks} />
```

Wrap once (Providers or layout) for OS-level reduced-motion support:

```tsx
import { PolishMotionConfig } from "@/components/motion/polish-motion";

<PolishMotionConfig>{children}</PolishMotionConfig>
```

Import the polish stylesheet next to globals in `app/layout.tsx`:

```ts
import "@/styles/polish.css";
```

## Option B — replace the placeholder mount

`src/components/search-command.tsx` currently renders a placeholder dialog
and explicitly notes "search UI agent owns the palette". The nav agent can
swap it in `search-command-host.tsx`:

```tsx
// before
import { SearchCommand, useCmdK } from "@/components/search-command";
// after
import { CommandPalette } from "@/components/search/CommandPalette";
```

`CommandPalette` is controlled (`open` + `onOpenChange`), so it drops into
the existing `SiteNavWithSearch` state without changes. Keep `useCmdK` or
delete it once `CommandPaletteHost` owns the shortcut — do not register
both (double toggle).

## Deps (scaffold agent)

```powershell
npm i motion lucide-react
```

`motion/react` import path is the current Motion package (README stack
says "Motion"). `lucide-react` is already assumed by ui/* peers.

## Behavior contract

- Shortcut: ⌘K / Ctrl+K toggles; Esc closes; overlay click closes.
- Keys in palette: ↑↓/Home/End move, Enter selects, type filters.
- Empty query: Recent (localStorage `bdx-palette-recent-v1`, max 8) +
  model/page suggestions. Query: grouped results (Models, Benchmarks,
  Providers, Families, Pages), max 40.
- Destinations: models → `/models/[slug]`, benchmarks →
  `/benchmarks/[slug]`, providers/families → `/leaderboard?…`, pages → path.
- A11y: `role=dialog` + `aria-modal`, combobox/listbox/option wiring with
  `aria-activedescendant`, focus into input on open, body scroll lock.
- Motion: overlay fade 160ms, panel opacity + 8px rise 200ms, static under
  `prefers-reduced-motion` via `PolishMotionConfig`.
