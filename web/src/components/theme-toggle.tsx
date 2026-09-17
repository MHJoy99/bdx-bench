"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/** Theme toggle — next-themes, dark default per brand. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" aria-hidden />;
  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      data-testid="theme-toggle"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)]/50 text-[var(--text-secondary)] transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.95] hover:border-[var(--border-strong)] hover:bg-[var(--elevated)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      {dark ? <Sun size={15} className="transition-transform duration-200 hover:rotate-45" aria-hidden /> : <Moon size={15} className="transition-transform duration-200 hover:-rotate-12" aria-hidden />}
    </button>
  );
}
