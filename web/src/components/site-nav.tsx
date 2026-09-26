"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompactMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

/**
 * Site chrome.
 *
 * This is a developer tool, so the nav behaves like one: opaque, dense, and
 * quiet. The active section is marked with `aria-current="page"` plus a 2px
 * accent rule flush with the header border — no pill, no bounce, no spring.
 * Motion budget here is hover/focus colour only.
 *
 * The previous version used `animate-ping` for the "live" dots. Those are
 * decorative infinite loops, which the motion doctrine forbids and which
 * reduced-motion users were still served (the global reduced-motion kill is not
 * wired into the live stylesheet). They are static dots now: a solid 2px
 * accent mark means "this is the active/verified state", nothing more.
 *
 * Focus: every control relies on the global `:focus-visible` outline in the
 * global stylesheet, so keyboard focus looks identical across the whole app
 * instead of being re-specified per element.
 */

const NAV = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/eval", label: "Live Eval", live: true },
  { href: "/models", label: "Models" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/compare", label: "Compare" },
  { href: "/price-performance", label: "Price/Perf" },
  { href: "/trends", label: "Trends" },
  { href: "/methodology", label: "Methodology" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Top nav: brand B/ + section links + Search / GitHub / Theme toggle. */
export function SiteNav({ onSearch }: { onSearch?: () => void }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menuOpen]);

  // Close the mobile sheet on route change.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const openSearch = () => {
    setMenuOpen(false);
    onSearch?.();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="container flex h-14 min-w-0 items-center justify-between gap-3 sm:gap-4">
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--elevated)] hover:text-[var(--text)] lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="bdx-mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
          </button>

          <Link href="/" className="group flex items-center gap-2.5 rounded-[6px]">
            <CompactMark className="size-6" />
            <span className="flex items-center gap-1.5 font-display text-[14px] font-bold tracking-tight text-[var(--text)]">
              <span>BDX</span>
              <span className="font-semibold text-[var(--accent-ink)]">Bench</span>
            </span>
            <span className="hidden items-center gap-1 rounded-[5px] border border-[var(--border)] bg-[var(--elevated)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--text-secondary)] sm:inline-flex">
              <span className="size-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
              Showdown v2
            </span>
          </Link>
        </div>

        {/* Center: Desktop nav */}
        <nav className="hidden items-stretch self-stretch lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                data-testid={item.href === "/leaderboard" ? "nav-leaderboard" : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-1.5 px-2.5 text-[13px] transition-colors duration-150",
                  active
                    ? "font-semibold text-[var(--text)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]",
                )}
              >
                {item.label}
                {item.live ? (
                  <span className="size-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                ) : null}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-1.5 bottom-0 h-0.5 rounded-full bg-[var(--accent)]"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Right: Search + GitHub + Theme */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSearch}
            className="hidden h-8 items-center justify-between gap-2 rounded-[6px] border border-[var(--border)] px-2.5 text-xs text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--elevated)] hover:text-[var(--text)] sm:flex lg:w-48"
            aria-label="Search models and benchmarks (Press Cmd+K)"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="size-3.5 text-[var(--text-tertiary)]" aria-hidden />
              <span className="truncate">Search models…</span>
            </span>
            <kbd className="rounded-[4px] border border-[var(--border-strong)] bg-[var(--elevated)] px-1 font-mono text-[10px] leading-[14px] text-[var(--text-secondary)]">
              ⌘K
            </kbd>
          </button>

          <a
            href="https://github.com/MHJoy99/bdx-bench"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub Repository"
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--border)] px-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--elevated)] hover:text-[var(--text)]"
          >
            <span>GitHub</span>
            <ArrowUpRight className="size-3 text-[var(--text-tertiary)]" aria-hidden />
          </a>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div
          id="bdx-mobile-menu"
          className="bdx-mobile-menu border-t border-[var(--border)] bg-[var(--surface)] p-4 lg:hidden"
        >
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search models & benchmarks"
            className="mb-3 flex h-9 w-full items-center justify-between gap-2 rounded-[6px] border border-[var(--border)] bg-[var(--elevated)] px-3 text-xs text-[var(--text-secondary)]"
          >
            <span className="flex items-center gap-2">
              <Search size={14} className="text-[var(--text-tertiary)]" aria-hidden />
              <span>Search models &amp; benchmarks…</span>
            </span>
            <kbd className="rounded-[4px] border border-[var(--border-strong)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] leading-[14px]">
              ⌘K
            </kbd>
          </button>

          <nav aria-label="Mobile" className="flex flex-col gap-px">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  data-testid={item.href === "/leaderboard" ? "nav-mobile-leaderboard" : undefined}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex h-9 items-center justify-between rounded-[6px] px-3 text-[13px] transition-colors duration-150",
                    active
                      ? "bg-[var(--elevated)] font-semibold text-[var(--text)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--elevated)]/60 hover:text-[var(--text)]",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-3.5 w-0.5 shrink-0 rounded-full",
                        active ? "bg-[var(--accent)]" : "bg-transparent",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.live ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                    ) : null}
                  </span>
                  {active ? <span className="sr-only">Current page</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
