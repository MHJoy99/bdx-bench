import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Model } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";

/**
 * Model page header: name, provider, release date, family + capability badges.
 * Owner: SUB-AGENT 5/10 MODEL PAGES.
 * TODO(@ui): swap Badge spans for `@/components/ui/badge` when it lands.
 */

const PROVIDER_LABELS: Record<Model["provider"], string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  meta: "Meta",
  mistral: "Mistral",
  deepseek: "DeepSeek",
  qwen: "Qwen",
  xai: "xAI",
  other: "BDX AI Gateway",
};

interface CapabilityBadge {
  label: string;
  active: boolean;
  title: string;
}

export function ModelHeader({
  model,
  reasoningModel,
}: {
  model: Model;
  /** Demo-only flag driving the Reasoning badge (see model-pages-demo). */
  reasoningModel: boolean;
}) {
  const badges: CapabilityBadge[] = [
    {
      label: "Reasoning",
      active: reasoningModel,
      title: reasoningModel
        ? "Demo flag: marketed as a reasoning model (placeholder)"
        : "Demo flag: not marked as a reasoning model (placeholder)",
    },
    {
      label: "Vision",
      active: model.capabilities.vision,
      title: "Demo flag: image/chart input support (placeholder)",
    },
    {
      label: "Tools",
      active: model.capabilities.tools,
      title: "Demo flag: function-calling / tool use (placeholder)",
    },
    {
      label: "Audio",
      active: model.capabilities.audio,
      title: "Demo flag: audio input support (placeholder)",
    },
    {
      label: "Multimodal",
      active: model.capabilities.multimodal,
      title: "Demo flag: multiple input modalities (placeholder)",
    },
    {
      label: "Open Weights",
      active: model.openWeights,
      title: model.openWeights
        ? "Demo flag: weights publicly available (placeholder)"
        : "Demo flag: closed weights (placeholder)",
    },
  ];

  return (
    <header className="border-b border-border pb-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <DemoBadge />
        <span className="font-mono">{model.id}</span>
      </div>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {model.name}
      </h1>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px] leading-5 text-muted-foreground">
        <div className="flex gap-1.5">
          <dt className="font-medium text-foreground">Provider</dt>
          <dd>{PROVIDER_LABELS[model.provider]}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium text-foreground">Family</dt>
          <dd>{model.family}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium text-foreground">Released</dt>
          <dd>
            <time dateTime={model.released}>{formatDate(model.released)}</time>{" "}
            <span className="text-muted-foreground/70">(demo date)</span>
          </dd>
        </div>
      </dl>

      <ul
        aria-label="Model capabilities (demo flags)"
        className="mt-4 flex flex-wrap gap-1.5"
      >
        {badges.map((b) => (
          <li key={b.label}>
            <span
              title={b.title}
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                b.active
                  ? "border-bdx-accent/40 bg-bdx-accent/10 text-foreground"
                  : "border-border bg-muted text-muted-foreground line-through decoration-muted-foreground/50",
              )}
            >
              {b.label}
            </span>
          </li>
        ))}
      </ul>
    </header>
  );
}
