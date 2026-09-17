"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CornerDownLeft,
  Cpu,
  FileText,
  FlaskConical,
  History,
  Layers,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DialogMotion } from "@/components/motion/polish-motion";
import {
  PALETTE_GROUP_LABEL,
  PALETTE_GROUP_ORDER,
  buildPaletteIndex,
  filterPalette,
  loadRecentIds,
  resolveRecents,
  saveRecentId,
  type PaletteBenchmarkInput,
  type PaletteItem,
  type PaletteKind,
  type PaletteModelInput,
  type PalettePageDef,
} from "./palette-items";
import type { Provider } from "@/lib/types";

export interface CommandPaletteProps {
  models?: PaletteModelInput[];
  benchmarks?: PaletteBenchmarkInput[];
  providers?: Provider[];
  families?: string[];
  pages?: PalettePageDef[];
  /** Controlled open state (host owns it, mirrors ui/dialog pattern). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Override for tests/storybook; default is router.push. */
  onNavigate?: (href: string) => void;
  inputPlaceholder?: string;
}

const KIND_ICON: Record<PaletteKind, React.ComponentType<{ className?: string }>> = {
  model: Cpu,
  benchmark: FlaskConical,
  provider: Building2,
  family: Layers,
  page: FileText,
};

const LISTBOX_ID = "bdx-palette-listbox";
const INPUT_ID = "bdx-palette-input";

/**
 * ⌘K / Ctrl+K palette over models, benchmarks, providers, families, pages.
 * Keyboard: ↑↓/Home/End move, Enter selects, Esc closes. Recents surface
 * when the query is empty. Motion: fade + 8px rise via DialogMotion;
 * fully static under prefers-reduced-motion (MotionConfig reducedMotion="user").
 */
export function CommandPalette({
  models,
  benchmarks,
  providers,
  families,
  pages,
  open,
  onOpenChange,
  onNavigate,
  inputPlaceholder = "Search models, benchmarks, pages…",
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const rowRefs = React.useRef(new Map<string, HTMLButtonElement>());

  const index = React.useMemo(
    () => buildPaletteIndex({ models, benchmarks, providers, families, pages }),
    [models, benchmarks, providers, families, pages],
  );
  const byId = React.useMemo(() => new Map(index.map((i) => [i.id, i])), [index]);

  // Reset per opening; reload recents; lock body scroll; autofocus.
  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    setRecentIds(loadRecentIds());
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open ]);

  const trimmed = query.trim();
  const results = React.useMemo(
    () => (trimmed ? filterPalette(index, trimmed) : []),
    [index, trimmed],
  );

  const recents = React.useMemo(
    () => (trimmed ? [] : resolveRecents(recentIds, byId)),
    [trimmed, recentIds, byId],
  );

  const suggestions = React.useMemo(() => {
    if (trimmed) return [];
    const seen = new Set(recents.map((r) => r.id));
    const out: PaletteItem[] = [];
    for (const item of index) {
      if (out.length >= 6) break;
      if (!seen.has(item.id) && (item.kind === "model" || item.kind === "page")) {
        seen.add(item.id);
        out.push(item);
      }
    }
    return out;
  }, [trimmed, index, recents]);

  /** Flat selectable order (headers excluded) for arrow-key nav. */
  const flat: PaletteItem[] = React.useMemo(() => {
    if (trimmed) return results;
    return [...recents, ...suggestions];
  }, [trimmed, results, recents, suggestions]);

  React.useEffect(() => {
    setActive(0);
  }, [flat.length, trimmed]);

  React.useEffect(() => {
    const current = flat[active];
    if (!current) return;
    rowRefs.current.get(current.id)?.scrollIntoView({ block: "nearest" });
  }, [active, flat]);

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  const select = React.useCallback(
    (item: PaletteItem) => {
      setRecentIds(saveRecentId(item.id));
      onOpenChange(false);
      if (onNavigate) onNavigate(item.href);
      else router.push(item.href);
    },
    [onNavigate, onOpenChange, router],
  );

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(Math.max(flat.length - 1, 0));
    } else if (e.key === "Enter") {
      const current = flat[active];
      if (current) {
        e.preventDefault();
        select(current);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  const activeId = flat[active]?.id;
  let cursor = 0;

  const renderRow = (item: PaletteItem) => {
    const i = cursor;
    cursor += 1;
    const Icon = KIND_ICON[item.kind];
    const selected = i === active;
    return (
      <button
        key={item.id}
        ref={(el) => {
          if (el) rowRefs.current.set(item.id, el);
          else rowRefs.current.delete(item.id);
        }}
        type="button"
        role="option"
        id={`bdx-palette-opt-${i}`}
        aria-selected={selected}
        onMouseEnter={() => setActive(i)}
        onClick={() => select(item)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px]",
          "text-[var(--text)]",
          selected ? "bg-[var(--accent-muted)]" : "bg-transparent",
        )}
      >
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-[6px] border",
            selected
              ? "border-[var(--accent-border)] text-[var(--accent-ink)]"
              : "border-[var(--border)] text-[var(--text-secondary)]",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <span className="ellipsis min-w-0 flex-1 font-medium">{item.title}</span>
        {item.hint && (
          <span className="ellipsis hidden max-w-[40%] shrink-0 text-[12px] text-[var(--text-secondary)] sm:block">
            {item.hint}
          </span>
        )}
      </button>
    );
  };

  const renderGroup = (kind: PaletteKind, items: PaletteItem[]) => {
    if (items.length === 0) return null;
    return (
      <li key={kind} role="presentation" className="px-1.5 pb-1 pt-2 first:pt-0">
        <p
          role="presentation"
          className="px-1.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
        >
          {PALETTE_GROUP_LABEL[kind]}
        </p>
        <div className="flex flex-col gap-px">{items.map(renderRow)}</div>
      </li>
    );
  };

  return (
    <DialogMotion open={open} onClose={close} labelledBy={INPUT_ID}>
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
        <Search className="size-4 shrink-0 text-[var(--text-secondary)]" aria-hidden />
        <input
          ref={inputRef}
          id={INPUT_ID}
          role="combobox"
          aria-expanded="true"
          aria-controls={LISTBOX_ID}
          aria-activedescendant={activeId ? `bdx-palette-opt-${active}` : undefined}
          aria-label="Search models, benchmarks, providers, families, pages"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder={inputPlaceholder}
          autoComplete="off"
          spellCheck={false}
          className="h-11 w-full bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
        />
        <button
          type="button"
          onClick={close}
          aria-label="Close search"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--elevated)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="max-h-[46vh] overflow-y-auto p-1.5">
        {trimmed === "" ? (
          <ul role="listbox" id={LISTBOX_ID} aria-label="Suggestions" className="flex flex-col">
            {recents.length > 0 && (
              <li role="presentation" className="px-1.5 pb-1">
                <p
                  role="presentation"
                  className="flex items-center gap-1.5 px-1.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
                >
                  <History className="size-3" aria-hidden />
                  Recent
                </p>
                <div className="flex flex-col gap-px">{recents.map(renderRow)}</div>
              </li>
            )}
            {renderGroup("model", suggestions.filter((s) => s.kind === "model"))}
            {renderGroup("page", suggestions.filter((s) => s.kind === "page"))}
          </ul>
        ) : results.length > 0 ? (
          <ul role="listbox" id={LISTBOX_ID} aria-label="Results" className="flex flex-col">
            {PALETTE_GROUP_ORDER.map((kind) =>
              renderGroup(
                kind,
                results.filter((r) => r.kind === kind),
              ),
            )}
          </ul>
        ) : (
          <div role="presentation" className="px-3 py-8 text-center">
            <p className="text-[13px] font-medium text-[var(--text)]">
              No matches for &ldquo;{trimmed}&rdquo;
            </p>
            <p className="pt-1 text-[12px] text-[var(--text-secondary)]">
              Try a model name, family, provider, or page.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-[var(--border)] px-3 py-2 text-[11px] text-[var(--text-tertiary)]">
        <span className="flex items-center gap-1">
          <kbd className="bdx-kbd">↑↓</kbd> navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bdx-kbd">
            <CornerDownLeft className="size-3" aria-hidden />
          </kbd>
          select
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bdx-kbd">esc</kbd> close
        </span>
        <span className="ml-auto hidden sm:block">
          {flat.length > 0 ? `${flat.length} result${flat.length === 1 ? "" : "s"}` : ""}
        </span>
      </div>
    </DialogMotion>
  );
}
