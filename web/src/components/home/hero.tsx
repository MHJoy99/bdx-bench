import Link from "next/link";
import { ArrowRight, BookOpen, Gamepad2, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AUDIT_DIMENSIONS, AUDIT_TRAIL, type AuditEntry } from "@/lib/audit-data";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/polish-motion";

/**
 * Homepage hero — a data-tool header, not a marketing banner.
 *
 * Creative direction (GPT Orchestrator, 2026-09-26): the rejected version was a
 * 6xl "AI models, measured." headline on a glowing gradient. Most AI benchmarks
 * lead with the number and engineers distrust them. This one leads with the
 * facts a reviewer needs to decide whether to keep reading:
 *
 *   what was tested · how much · under which prompt · against which dimensions
 *
 * Every figure in the strip is derived from `@/lib/audit-data`, so the header
 * can never drift from the grid it labels. The one obvious way to play is the
 * top-scoring build; the 8-chip play row is gone because the builds grid owns
 * that job now.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** "2026-09-26" -> "Sep 2026". */
function monthYear(iso: string): string {
  const month = MONTHS[Number(iso.slice(5, 7)) - 1];
  return month ? `${month} ${iso.slice(0, 4)}` : iso;
}

function heroFacts(): {
  round: string;
  models: number;
  builds: number;
  dimensions: number;
  top: AuditEntry;
} {
  const newest = AUDIT_TRAIL.reduce((a, b) => (a.generated >= b.generated ? a : b));
  const top = AUDIT_TRAIL.reduce((a, b) => (b.total > a.total ? b : a));
  return {
    round: monthYear(newest.generated),
    models: new Set(AUDIT_TRAIL.map((e) => e.modelSlug)).size,
    builds: AUDIT_TRAIL.length,
    dimensions: AUDIT_DIMENSIONS.length,
    top,
  };
}

export function Hero() {
  const facts = heroFacts();

  const strip: { label: string; value: string }[] = [
    { label: "Round", value: facts.round },
    { label: "Models", value: String(facts.models) },
    { label: "Audited builds", value: String(facts.builds) },
    { label: "Shared prompts", value: "1" },
    { label: "Audit dimensions", value: String(facts.dimensions) },
  ];

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
    >
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <FadeIn>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
            BDX Bench
          </p>
          <h1
            id="home-hero-heading"
            className="mt-1.5 max-w-3xl text-[17px] font-semibold leading-[24px] tracking-tight text-[var(--text)] text-balance sm:text-[19px] sm:leading-[26px]"
          >
            AI coding models tested on one prompt. Real playable builds.
            Transparent scoring.
          </h1>
        </FadeIn>

        {/* Factual scope strip. Divider-only, flat, 1px. */}
        <StaggerGroup
          className="mt-3.5 grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3 lg:grid-cols-5"
        >
          {strip.map((s) => (
            <StaggerItem key={s.label} className="bg-[var(--surface)] px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                {s.label}
              </p>
              <p className="tnum mt-0.5 text-[13px] font-medium text-[var(--text)]">
                {s.value}
              </p>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link href="#builds" className={cn(buttonVariants({ size: "default" }))}>
            <Gamepad2 aria-hidden="true" />
            Explore builds
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link
            href="/methodology"
            className={cn(buttonVariants({ variant: "secondary", size: "default" }))}
          >
            <BookOpen aria-hidden="true" />
            Methodology
          </Link>
          <Link
            href={facts.top.playPath}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "secondary", size: "default" }),
              "hover:border-[var(--accent-border)]",
            )}
          >
            <Gamepad2 aria-hidden="true" />
            Play {facts.top.buildName}
            <span className="tnum text-[var(--text-tertiary)]">{facts.top.total}</span>
          </Link>
        </div>

        <p className="mt-3 flex max-w-3xl flex-wrap items-baseline gap-x-2 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
          <span className="inline-flex items-center gap-1 font-mono uppercase tracking-wider">
            <ShieldCheck className="size-3 text-[var(--text-secondary)]" aria-hidden="true" />
            Showdown Score v2
          </span>
          <span>
            Re-audited at implementation level, not by keyword scan:{" "}
            {facts.dimensions} dimensions × 20 points, zero for absent features.
            Every verified defect stays published.{" "}
            <Link
              href="/methodology"
              className="text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text)] hover:underline"
            >
              How scores are produced
            </Link>
          </span>
        </p>
      </div>
    </section>
  );
}
