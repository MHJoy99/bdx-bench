"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="container flex h-14 min-w-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border hover:bg-muted lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="bdx-mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>
        <Link href="/" className="flex min-w-0 items-center gap-2 font-mono font-bold">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#B8FF5A] font-mono text-sm font-bold text-black">
            B/
          </span>
          <span className="truncate">BDX Bench</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                  active ? "bg-muted font-medium" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSearch}
            className="hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted sm:inline-flex"
            aria-label="Search (Cmd+K)"
          >
            <span>Search</span>
            <kbd className="rounded border border-border px-1 font-mono text-[11px]">⌘K</kbd>
          </button>
          <a
            href="https://github.com/MHJoy99/bdx-bench"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>
      {menuOpen && (
        <div id="bdx-mobile-menu" className="bdx-mobile-menu border-t border-border lg:hidden">
          <nav aria-label="Mobile" className="container flex flex-col gap-1 py-3">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                    active ? "bg-muted font-medium" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search (Cmd+K)"
              className="mt-1 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
            >
              <Search size={16} aria-hidden />
              <span>Search</span>
              <kbd className="ml-auto rounded border border-border px-1 font-mono text-[11px]">⌘K</kbd>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
