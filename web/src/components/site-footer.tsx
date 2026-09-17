import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CompactMark } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)]/80 bg-[var(--surface)]/40 py-12 text-sm text-[var(--text-secondary)]">
      <div className="container grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        {/* Col 1: Brand & Status */}
        <div className="sm:col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
            <CompactMark className="size-5" />
            <span className="font-display font-bold tracking-tight text-[var(--text)]">
              BDX<span className="text-[var(--accent-ink)]">&nbsp;Bench</span>
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-[var(--text-secondary)]">
            Independent benchmark harness evaluating LLM capabilities, reasoning, code-fix accuracy, and game-engine builds.
          </p>

          {/* Operational status indicator */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--elevated)]/70 px-2.5 py-1 font-mono text-[11px] text-[var(--text-secondary)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
            </span>
            <span>All Benchmarks Operational</span>
          </div>
        </div>

        {/* Col 2: Benchmark Suites */}
        <nav aria-label="Bench">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Bench
          </p>
          <ul className="mt-3 space-y-2 text-xs">
            <li>
              <Link href="/leaderboard" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
                Leaderboard
              </Link>
            </li>
            <li>
              <Link href="/models" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
                Models
              </Link>
            </li>
            <li>
              <Link href="/benchmarks" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
                Benchmarks
              </Link>
            </li>
            <li>
              <Link href="/compare" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
                Model Comparison
              </Link>
            </li>
          </ul>
        </nav>

        {/* Col 3: Research & Methodology */}
        <nav aria-label="Research">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Research
          </p>
          <ul className="mt-3 space-y-2 text-xs">
            <li>
              <Link href="/methodology" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
                Methodology
              </Link>
            </li>
            <li>
              <Link href="/trends" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
                Capability Trends
              </Link>
            </li>
            <li>
              <Link href="/price-performance" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
                Price / Performance
              </Link>
            </li>
          </ul>
        </nav>

        {/* Col 4: Resources & Links */}
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Connect
          </p>
          <ul className="mt-3 space-y-2 text-xs">
            <li>
              <a
                href="https://github.com/MHJoy99/bdx-bench"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
              >
                <span>GitHub Repository</span>
                <ArrowUpRight className="size-3 text-[var(--text-tertiary)]" aria-hidden />
              </a>
            </li>
            <li>
              <span className="text-[11px] text-[var(--text-tertiary)]">
                Command Palette: Press <kbd className="rounded border border-[var(--border-strong)] bg-[var(--elevated)] px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mt-10 flex flex-col gap-2 border-t border-[var(--border)]/60 pt-6 text-[11px] text-[var(--text-tertiary)] sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 BDX Bench. Independent evaluations conforming to SPEC v1.0.</p>
        <p className="font-mono">Scores are methodology-dependent · Updated Sep 2026</p>
      </div>
    </footer>
  );
}
