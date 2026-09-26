"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Theme toggle — next-themes, dark default per brand.
 *
 * The icon no longer spins on hover (`hover:rotate-45` / `hover:-rotate-12` were
 * decorative motion with no informational value, and the motion doctrine allows
 * only transform/opacity/border-color for state responses). The press
 * affordance stays: a 0.95 scale on `:active` is a direct response to the
 * user's own click, not an ambient loop.
 *
 * The mount placeholder matches the rendered size (h-8 w-8) so swapping the
 * placeholder for the button does not shift the header. Focus uses the global
 * `:focus-visible` outline like every other control in the chrome.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-8 shrink-0" aria-hidden="true" />;
  }

  const dark = resolvedTheme === "dark";
  const next = dark ? "light" : "dark";

  return (
    <button
      type="button"
      data-testid="theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[var(--border)] text-[var(--text-secondary)] transition-[background-color,border-color,color,transform] duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--elevated)] hover:text-[var(--text)] active:scale-95"
    >
      {dark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
    </button>
  );
}
