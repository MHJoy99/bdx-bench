"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompactMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/models", label: "Models" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/compare", label: "Compare" },
  { href: "/price-performance", label: "Price/Performance" },
  { href: "/trends", label: "Trends" },
  { href: "/methodology", label: "Methodology" },
];

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
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)]/70 bg-[var(--surface)]/85 backdrop-blur-md backdrop-saturate-150 transition-colors duration-200">
      <div className="container flex h-14 min-w-0 items-center justify-between gap-3 sm:gap-4">
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)]/60 text-[var(--text-secondary)] transition-colors hover:bg-[var(--elevated)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="bdx-mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
          </button>

          <Link href="/" className="group flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
            <CompactMark className="size-6 transition-transform duration-200 group-hover:scale-105" />
            <span className="flex items-center gap-1.5 font-display text-[14px] font-bold tracking-tight text-[var(--text)]">
              <span>BDX</span>
              <span className="text-[var(--accent-ink)] font-semibold">Bench</span>
            </span>
            <span className="hidden items-center gap-1 rounded-full border border-[var(--accent-border)] bg-[var(--accent-muted)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--accent-ink)] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden />
              Live v1.0
            </span>
          </Link>
        </div>

        {/* Center: Desktop nav */}
        <nav className="hidden items-center gap-1 xl:gap-1.5 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                data-testid={item.href === "/leaderboard" ? "nav-leaderboard" : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-[6px] px-2.5 py-1 text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  active
                    ? "bg-[var(--elevated)] text-[var(--text)] border border-[var(--border-strong)] shadow-sm font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--elevated)]/60 hover:text-[var(--text)] border border-transparent",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Search + GitHub + Theme */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSearch}
            className="group hidden h-8 w-44 sm:flex lg:w-48 items-center justify-between rounded-[6px] border border-[var(--border)] bg-[var(--surface)]/70 px-2.5 text-xs text-[var(--text-secondary)] shadow-sm backdrop-blur-sm transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--elevated)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label="Search models and benchmarks (Press Cmd+K)"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="size-3.5 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text)]" aria-hidden />
              <span className="truncate">Search models…</span>
            </span>
            <kbd className="rounded border border-[var(--border-strong)] bg-[var(--elevated)] px-1 font-mono text-[10px] text-[var(--text-secondary)]">⌘K</kbd>
          </button>

          <a
            href="https://github.com/MHJoy99/bdx-bench"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub Repository"
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--surface)]/50 px-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--elevated)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <span>GitHub</span>
            <ArrowUpRight className="size-3 text-[var(--text-tertiary)]" aria-hidden />
          </a>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div id="bdx-mobile-menu" className="bdx-mobile-menu border-t border-[var(--border)] bg-[var(--surface)]/95 p-4 backdrop-blur-lg lg:hidden">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search models & benchmarks"
            className="mb-3 flex h-9 w-full items-center justify-between rounded-[6px] border border-[var(--border)] bg-[var(--elevated)] px-3 text-xs text-[var(--text-secondary)] shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Search size={14} className="text-[var(--text-tertiary)]" aria-hidden />
              <span>Search models & benchmarks…</span>
            </span>
            <kbd className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>

          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  data-testid={item.href === "/leaderboard" ? "nav-leaderboard" : undefined}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex h-9 items-center justify-between rounded-[6px] px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--elevated)] text-[var(--text)] border border-[var(--border-strong)] font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-[var(--elevated)]/60 hover:text-[var(--text)]",
                  )}
                >
                  <span>{item.label}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
