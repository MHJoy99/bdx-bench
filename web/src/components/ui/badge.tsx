import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { FlaskConical, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { methodologyVersion } from "@/lib/tokens";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-[6px] border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider leading-4 transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[var(--border-strong)] bg-[var(--elevated)] text-[var(--text-secondary)]",
        accent:
          "border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent-ink)]",
        pass: "border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent-ink)]",
        fail: "border-[var(--danger-muted)] bg-[var(--danger-muted)] text-[var(--danger)]",
        warn: "border-[var(--warning-border)] bg-[var(--warning-muted)] text-[var(--warning)]",
        info: "border-[var(--info-border)] bg-[var(--info-muted)] text-[var(--info)]",
        outline: "border-[var(--border-strong)] bg-transparent text-[var(--text-secondary)]",
        gold: "border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.15)]",
        silver: "border-slate-300/40 bg-slate-300/10 text-slate-200",
        bronze: "border-amber-700/40 bg-amber-700/15 text-amber-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Required: pins which scoring rules produced a number. */
function MethodologyVersionTag({
  version = methodologyVersion,
  className,
}: {
  version?: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" title="Scoring methodology version (see docs/METHODOLOGY.md)" className={className}>
      <Info className="size-3" aria-hidden />
      Methodology {version}
    </Badge>
  );
}

export { Badge, MethodologyVersionTag, badgeVariants };
