import Link from "next/link";

/**
 * HOME FOOTER — Server Component, homepage-owned.
 * NOTE: Agent1 layout owns the global NAVBAR (SiteNavWithSearch) and global
 * SiteFooter — this file renders NO nav duplication. This homepage footer
 * carries the product/resources links + verbatim disclaimer required by the
 * homepage contract. If Agent1 merges footers, keep HOME_DISCLAIMER_VERBATIM
 * wording intact.
 *
 * Disclaimer below is the homepage verbatim disclaimer (demo-safe, never
 * claims live). Keep wording intact when reusing.
 */
export const HOME_DISCLAIMER_VERBATIM =
  "BDX Bench is an independent evaluation project. Scores shown on this homepage are illustrative demo data for UI development and do not represent live benchmark results. See Methodology for scoring details.";

export function HomeFooter() {
  return (
    <footer
      aria-label="Homepage footer"
      className="rounded-[10px] border border-bdx-border bg-bdx-surface px-6 py-10 sm:px-10"
    >
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm font-bold tracking-tight text-bdx-ink">
            BDX Bench
          </p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-bdx-muted">
            Independent benchmarks, pricing, speed, capability and model
            intelligence in one place.
          </p>
        </div>
        <nav aria-label="Product">
          <p className="text-xs font-semibold uppercase tracking-wider text-bdx-muted">
            Product
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/leaderboard" className="text-bdx-muted hover:text-bdx-accent">
                Leaderboard
              </Link>
            </li>
            <li>
              <Link href="/compare" className="text-bdx-muted hover:text-bdx-accent">
                Compare Models
              </Link>
            </li>
            <li>
              <Link href="/methodology" className="text-bdx-muted hover:text-bdx-accent">
                Methodology
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Resources">
          <p className="text-xs font-semibold uppercase tracking-wider text-bdx-muted">
            Resources
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/benchmarks" className="text-bdx-muted hover:text-bdx-accent">
                Benchmarks
              </Link>
            </li>
            <li>
              <Link href="/models" className="text-bdx-muted hover:text-bdx-accent">
                Models
              </Link>
            </li>
            <li>
              <Link href="/methodology" className="text-bdx-muted hover:text-bdx-accent">
                Methodology
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="mt-8 border-t border-bdx-border pt-4 text-xs leading-relaxed text-bdx-muted">
        {HOME_DISCLAIMER_VERBATIM}
      </p>
    </footer>
  );
}
