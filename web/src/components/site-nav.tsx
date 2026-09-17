"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="container flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-mono font-bold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#B8FF5A] font-mono text-sm font-bold text-black">
            B/
          </span>
          <span>BDX Bench</span>
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
        <div className="ml-auto flex items-center gap-2">
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
    </header>
  );
}
