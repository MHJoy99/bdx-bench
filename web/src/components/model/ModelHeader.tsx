import Link from "next/link";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Model } from "@/lib/types";

const PROVIDER_LABELS: Record<string, string> = {
  "bdx-ai": "BDX AI",
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

const PLAY_LINKS: Record<string, string> = {
  "muse-spark-1-3": "/play/pyro-vs-zombies",
  "deepseek-v4-1-flash": "/play/pyre-burn-horde",
  "gemini-3-8-flash": "/play/pyroclasm-inferno",
};

export function ModelHeader({ model }: { model: Model }) {
  const caps = model.capabilities as unknown as Record<string, unknown>;
  const vision = caps["vision"] === true;
  const tools = caps["tools"] === true;
  const audio = caps["audio"] === true;
  const multimodal = caps["multimodal"] === true;
  const openWeights = (model as unknown as { openWeights?: unknown }).openWeights === true;

  // Only applicable capabilities render — absent ones are omitted, never
  // shown as present. Weights status always shows (open vs closed).
  const badges: { label: string; active: boolean }[] = [
    ...(vision ? [{ label: "Vision", active: true }] : []),
    ...(tools ? [{ label: "Tools", active: true }] : []),
    ...(audio ? [{ label: "Audio", active: true }] : []),
    ...(multimodal ? [{ label: "Multimodal", active: true }] : []),
    { label: openWeights ? "Open weights" : "Closed weights", active: openWeights },
  ];

  const play: string | undefined = PLAY_LINKS[model.slug];

  return (
    <header className="border-b border-border pb-6">
      <p className="font-mono text-xs text-muted-foreground">{model.id}</p>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {model.name}
      </h1>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px] leading-5 text-muted-foreground">
        <div className="flex gap-1.5">
          <dt className="font-medium text-foreground">Provider</dt>
          <dd>{PROVIDER_LABELS[model.provider] ?? model.provider}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium text-foreground">Family</dt>
          <dd>{model.family}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium text-foreground">Released</dt>
          <dd>
            {model.released ? (
              <time dateTime={model.released}>{formatDate(model.released)}</time>
            ) : (
              "Release date not published"
            )}
          </dd>
        </div>
      </dl>

      {play ? (
        <p className="mt-4">
          <Link
            href={play}
            className="inline-block rounded-md bg-bdx-accent px-4 py-2 text-sm font-semibold text-black"
          >
            Play this build
          </Link>
        </p>
      ) : null}

      <ul
        aria-label="Model capabilities"
        className="mt-4 flex flex-wrap gap-1.5"
      >
        {badges.map((b) => (
          <li key={b.label}>
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                b.active
                  ? "border-bdx-accent/40 bg-bdx-accent/10 text-foreground"
                  : "border-border bg-muted text-muted-foreground",
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
