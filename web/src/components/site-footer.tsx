/** Footer with required disclaimer. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container flex flex-col gap-2 text-sm text-muted-foreground">
        <p>
          <span className="font-mono font-bold text-foreground">B/</span> BDX Bench — independent AI model benchmarks.
        </p>
        <p>
          Scores are informational and methodology-dependent; verify against primary sources before
          procurement decisions. Prices change frequently — check vendor pages for current pricing.
        </p>
      </div>
    </footer>
  );
}
