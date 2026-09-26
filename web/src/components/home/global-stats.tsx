import { Activity, Box, Cpu, Database, Layers } from "lucide-react";
import { BENCHMARKS, MODELS } from "@/lib/data";
import {
  FadeIn,
  ScoreReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/polish-motion";

/**
 * Dataset scope strip.
 *
 * Restyled from marketing tiles into one flat readout: a single bordered
 * surface, 1px internal dividers, no glow, no blur, no pulse. The counts are
 * unchanged — only how they are presented.
 */

function providerCount(slugs: string[]): number {
  return new Set(slugs).size;
}

export function GlobalStats() {
  const modelsTracked = MODELS.length;
  const benchmarks = BENCHMARKS.length;
  const providers = providerCount(MODELS.map((m) => m.provider));
  const evalRuns = MODELS.length * Math.max(1, BENCHMARKS.length);

  const items: {
    label: string;
    value: number | null;
    text: string;
    hint: string;
    icon: typeof Activity;
  }[] = [
    { label: "Models tracked", value: modelsTracked, text: "", hint: "Verified weights", icon: Cpu },
    { label: "Benchmarks", value: benchmarks, text: "", hint: "Standard mini suites", icon: Layers },
    { label: "Evaluation runs", value: evalRuns, text: "", hint: "Automated & manual", icon: Activity },
    { label: "Providers", value: providers, text: "", hint: "AI gateways & labs", icon: Box },
    { label: "Latest round", value: null, text: "Sep 2026", hint: "Methodology v1.0", icon: Database },
  ];

  return (
    <section aria-labelledby="home-stats-heading" className="scroll-mt-20">
      <FadeIn>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-[var(--border)] pb-2">
          <h2
            id="home-stats-heading"
            className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
          >
            Global benchmark telemetry
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            Dataset scope
          </span>
        </div>
      </FadeIn>

      <StaggerGroup className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--border)] md:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <StaggerItem key={item.label} className="bg-[var(--surface)] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                {item.label}
              </span>
              <item.icon className="size-3.5 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
            </div>
            <p className="tnum mt-1 text-[18px] font-semibold leading-[22px] text-[var(--text)]">
              {item.value === null ? item.text : <ScoreReveal value={item.value} decimals={0} />}
            </p>
            <p className="mt-0.5 text-[11px] leading-[15px] text-[var(--text-secondary)]">
              {item.hint}
            </p>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <p className="mt-2 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
        Counts reflect the current dataset: {modelsTracked}{" "}
        {modelsTracked === 1 ? "model" : "models"} · {benchmarks}{" "}
        {benchmarks === 1 ? "benchmark" : "benchmarks"} · {providers}{" "}
        {providers === 1 ? "provider" : "providers"}.
      </p>
    </section>
  );
}
