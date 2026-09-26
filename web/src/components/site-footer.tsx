import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CompactMark } from "@/components/ui/logo";
import { AUDIT_DIMENSIONS, AUDIT_TRAIL } from "@/lib/audit-data";
import { SHOWDOWN } from "@/lib/demo-data";

/**
 * Site footer — a data sheet, not a marketing footer.
 *
 * Every count and range below is derived from `AUDIT_TRAIL` and `SHOWDOWN`, so
 * the footer cannot drift from the audit it describes. The previous version
 * claimed "All Benchmarks Operational" behind an `animate-ping` dot: an
 * unverified status claim rendered as an infinite decorative loop. The loop is
 * gone and the claim is replaced with what is actually verifiable — how many
 * builds were audited, over what window, under what method.
 */

const LABEL = "font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]";
/** Group heading: one step up from the micro-label, still mono. */
const LABEL_STRONG =
  "font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]";

const FINDINGS = AUDIT_TRAIL.flatMap((e) => e.findings);

const WINDOW = {
  from: AUDIT_TRAIL.reduce((min, e) => (e.generated < min ? e.generated : min), AUDIT_TRAIL[0]?.generated ?? ""),
  to: AUDIT_TRAIL.reduce((max, e) => (e.generated > max ? e.generated : max), AUDIT_TRAIL[0]?.generated ?? ""),
};

const MODEL_COUNT = new Set(AUDIT_TRAIL.map((e) => e.modelSlug)).size;

const FACTS: Array<[string, string]> = [
  ["Score", SHOWDOWN.scoreLabel],
  ["Method", "Implementation-level source audit"],
  ["Scales", `${AUDIT_DIMENSIONS.length} dimensions × 20 points`],
  ["Coverage", `${AUDIT_TRAIL.length} builds · ${MODEL_COUNT} models`],
  ["Verified defects", `${FINDINGS.length} (${FINDINGS.filter((f) => f.severity === "high").length} failing)`],
  ["Audit window", `${WINDOW.from} → ${WINDOW.to}`],
  ["Provenance", "Local manual audit · source id local-manual-eval"],
];

const LINK_GROUPS: Record<string, { label: string; href: string }[]> = {
  Bench: [{ label: "Audit matrix", href: "/benchmarks" }],
  Scores: [
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Compare models", href: "/compare" },
    { label: "Price / performance", href: "/price-performance" },
    { label: "Capability trends", href: "/trends" },
  ],
  Models: [
    { label: "All models", href: "/models" },
    { label: "Live eval telemetry", href: "/eval" },
  ],
  Method: [{ label: "Methodology", href: "/methodology" }],
};

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-[var(--border)] bg-[var(--surface)] py-8 text-[12px] text-[var(--text-secondary)]">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
          {/* What this site is. */}
          <div className="min-w-0">
            <Link href="/" className="flex items-center gap-2 rounded-[6px]">
              <CompactMark className="size-5" />
              <span className="font-display font-bold tracking-tight text-[var(--text)]">
                BDX&nbsp;Bench
              </span>
            </Link>
            <p className="mt-2.5 max-w-md text-[12px] leading-[18px]">
              A public record of AI-generated software artifacts and the audits run
              against them. One shared prompt is sent to{" "}
              {MODEL_COUNT} models; every build is then read at implementation level and
              scored across {AUDIT_DIMENSIONS.length} dimensions, with the verified
              defects published against the build that carries them.
            </p>
            <p className="mt-2.5 max-w-md text-[12px] leading-[18px] text-[var(--text-tertiary)]">
              Scores here are a strict code audit, not vendor claims. A feature that is
              advertised in a build&apos;s own UI but absent from its source scores zero,
              and the defect is listed in public.
            </p>
          </div>

          {/* The audit, as data. */}
          <div className="min-w-0">
            <h2 className={LABEL}>Audit record</h2>
            <dl className="mt-2.5">
              {FACTS.map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] py-1 last:border-b-0"
                >
                  <dt className={LABEL}>{k}</dt>
                  <dd className="tnum text-right text-[11px] leading-[15px] text-[var(--text-secondary)]">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Navigation. */}
          <nav aria-label="Footer" className="min-w-0">
            <h2 className={LABEL}>Sections</h2>
            <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-2">
              {Object.entries(LINK_GROUPS).map(([title, items]) => (
                <div key={title}>
                  <p className={LABEL_STRONG}>{title}</p>
                  <ul className="mt-1.5 space-y-1">
                    {items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-[12px] text-[var(--text-secondary)] underline-offset-2 transition-colors hover:text-[var(--text)] hover:underline"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <p className={LABEL_STRONG}>Source</p>
                <ul className="mt-1.5 space-y-1">
                  <li>
                    <a
                      href="https://github.com/MHJoy99/bdx-bench"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] text-[var(--text-secondary)] underline-offset-2 transition-colors hover:text-[var(--text)] hover:underline"
                    >
                      GitHub repository
                      <ArrowUpRight className="size-3 text-[var(--text-tertiary)]" aria-hidden />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-1.5 border-t border-[var(--border)] pt-4 text-[11px] text-[var(--text-tertiary)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 BDX Bench. Independent audit, not affiliated with any model vendor.</p>
          <p className="font-mono">
            {SHOWDOWN.scoreLabel} · {AUDIT_TRAIL.length} builds · audited {WINDOW.from} → {WINDOW.to}
          </p>
        </div>
      </div>
    </footer>
  );
}
