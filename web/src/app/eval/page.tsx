import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Award,
  CheckCircle2,
  Cpu,
  EyeOff,
  Flame,
  Gamepad2,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { LiveEvalCockpit } from "@/components/eval/LiveEvalCockpit";
import { Badge, MethodologyVersionTag } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Live Model Evaluation Telemetry | BDX Bench",
  description:
    "Real-time evaluation dashboard and browser telemetry for the Zombie Flamethrower Showdown: strict double-blind benchmarking, 5-stage automated verification, and interactive game builds.",
};

export default function EvalPage() {
  return (
    <div className="container py-8 sm:py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="accent" className="font-mono text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Live Telemetry
            </Badge>
            <MethodologyVersionTag />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
            Live Model Evaluation Telemetry
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-2xl">
            Realtime multi-stage verification cockpit auditing model-generated game
            builds in an isolated single-file browser runtime.
          </p>
        </div>

        {/* Quick links to playable builds */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/play/pyro-vs-zombies"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--accent-border)] bg-[var(--accent-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          >
            <Gamepad2 className="size-3.5" />
            <span>Play Alpha (Pyro)</span>
          </Link>
          <Link
            href="/play/pyroclasm-inferno"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border-strong)] bg-[var(--elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--surface)]"
          >
            <Gamepad2 className="size-3.5" />
            <span>Play Beta (Pyroclasm)</span>
          </Link>
        </div>
      </div>

      {/* Main Interactive Live Eval Cockpit */}
      <LiveEvalCockpit />

      {/* Methodology & Verification Explanations */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 pt-2">
        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-[var(--accent-ink)]">
              <EyeOff className="size-4" />
              <CardTitle className="text-sm font-semibold">
                Strict Double-Blind Execution
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs leading-relaxed text-[var(--text-secondary)]">
            Prompts and candidate submissions are evaluated with stripped metadata.
            Candidate identifiers (&ldquo;Model Alpha&rdquo; and &ldquo;Model Beta&rdquo;) prevent
            brand familiarity bias across human evaluation and automated test stages.
            Reviewers inspect performance without prior knowledge of model lineage.
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-[var(--info)]">
              <ShieldCheck className="size-4" />
              <CardTitle className="text-sm font-semibold">
                Zero Cross-Contamination
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs leading-relaxed text-[var(--text-secondary)]">
            Every build executes in an unprivileged, sandboxed HTML5 Canvas container
            with zero external dependencies, CDN links, or persistent cross-origin
            cookies. Evaluation scripts analyze static AST structure, memory allocations,
            and 60 FPS fixed delta-time stability independently.
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-[var(--warning)]">
              <Layers className="size-4" />
              <CardTitle className="text-sm font-semibold">
                Multi-Stage Verification Rubric
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs leading-relaxed text-[var(--text-secondary)]">
            Evaluations synthesize five explicit dimensions: Architecture &amp; Dep Isolation
            (15%), Physics Loop &amp; Collision Math (20%), Weapon Balance &amp; Swarm AI (25%),
            Audio Synthesis &amp; Particle Shaders (20%), and Prompt Fidelity (20%).
          </CardContent>
        </Card>
      </div>

      {/* Showdown Context & Link to Methodology */}
      <div className="rounded-[8px] border border-[var(--border-strong)] bg-[var(--elevated)]/60 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Looking for full benchmark scoring rules?
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Read how Showdown Scores are calculated, how community votes factor in,
              and why scores move between rounds.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/benchmarks/zombie-flamethrower-showdown"
              className="text-xs font-semibold text-[var(--accent-ink)] hover:underline underline-offset-4"
            >
              Showdown Overview →
            </Link>
            <Link
              href="/methodology"
              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] hover:underline underline-offset-4"
            >
              Methodology Spec →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
