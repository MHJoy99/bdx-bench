import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * BDX Bench wordmark + compact geometric mark.
 * - Pure SVG geometry (angled "B/" monogram). No robot / brain / sparkle.
 * - `currentColor` wordmark + lime tile so it works on dark AND light.
 */
function CompactMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="BDX Bench mark"
      className={cn("size-6 shrink-0", className)}
    >
      <rect x="1" y="1" width="30" height="30" rx="7" fill="#B8FF5A" />
      <path
        d="M10 8.5h5.2c2.9 0 4.8 1.4 4.8 3.9 0 1.7-1 2.9-2.6 3.4 2 .5 3.3 1.9 3.3 3.9 0 2.7-2.1 4.3-5.3 4.3H10V8.5Zm2.9 2.6v3.9h2.1c1.5 0 2.4-.7 2.4-2 0-1.2-.9-1.9-2.4-1.9h-2.1Zm0 6.4v4.2h2.5c1.6 0 2.6-.8 2.6-2.1 0-1.3-1-2.1-2.6-2.1h-2.5Z"
        fill="#101600"
      />
      <path d="M22.6 9.5 20.4 23.5h2.2l2.2-14h-2.2Z" fill="#101600" opacity="0.55" />
    </svg>
  );
}

function Logo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) return <CompactMark className={className} />;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <CompactMark />
      <span className="text-sm font-bold tracking-tight text-[var(--text)]">
        BDX<span className="text-[var(--accent-ink)]">&nbsp;Bench</span>
      </span>
    </span>
  );
}

export { Logo, CompactMark };
