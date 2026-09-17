import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container grid gap-8 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p>
            <span className="font-mono font-bold text-foreground">B/</span>{" "}
            <span className="font-semibold text-foreground">BDX Bench</span>
          </p>
          <p className="mt-2 max-w-md leading-6 text-muted-foreground">
            About: BDX Bench evaluates game builds head to head. The current
            round covers Zombie Flamethrower Showdown with Showdown Scores for
            Muse Spark 1.3 and Gemini 3.8 Flash, plus links to play each build.
          </p>
        </div>
        <nav aria-label="Bench">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bench
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground">
                Leaderboard
              </Link>
            </li>
            <li>
              <Link href="/models" className="text-muted-foreground hover:text-foreground">
                Models
              </Link>
            </li>
            <li>
              <Link href="/benchmarks" className="text-muted-foreground hover:text-foreground">
                Benchmarks
              </Link>
            </li>
            <li>
              <Link href="/methodology" className="text-muted-foreground hover:text-foreground">
                Methodology
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contact
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <a
                href="https://github.com/MHJoy99/bdx-bench"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                GitHub
              </a>
            </li>
            <li>
              <Link href="/price-performance" className="text-muted-foreground hover:text-foreground">
                Price and performance
              </Link>
            </li>
            <li>
              <Link href="/compare" className="text-muted-foreground hover:text-foreground">
                Compare models
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mt-8 flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 BDX Bench. Scores are informational and methodology-dependent.</p>
        <p>Prices change frequently — check vendor pages for current pricing.</p>
      </div>
    </footer>
  );
}
