"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { CompareTrayProvider } from "@/components/compare-tray-provider";
import { PolishMotionConfig } from "@/components/motion/polish-motion";

/** Single source of truth for theme persistence. */
export const THEME_STORAGE_KEY = "bdx-bench-theme";

/**
 * Mirrors the resolved theme to `html` class, `data-theme`, and
 * `style.colorScheme` — and mirrors external class changes back to
 * `color-scheme`/`data-theme`. next-themes owns the class write;
 * this keeps color-scheme in sync both directions.
 */
function ThemeSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme !== "dark" && resolvedTheme !== "light") return;
    const el = document.documentElement;
    el.dataset.theme = resolvedTheme;
    el.style.colorScheme = resolvedTheme;
    el.classList.toggle("dark", resolvedTheme === "dark");
    el.classList.toggle("light", resolvedTheme === "light");
  }, [resolvedTheme]);

  useEffect(() => {
    const el = document.documentElement;
    const syncFromClass = () => {
      const isDark = el.classList.contains("dark");
      const isLight = el.classList.contains("light");
      if (isDark && !isLight) {
        el.style.colorScheme = "dark";
        if (el.dataset.theme !== "dark") el.dataset.theme = "dark";
      } else if (isLight && !isDark) {
        el.style.colorScheme = "light";
        if (el.dataset.theme !== "light") el.dataset.theme = "light";
      }
    };
    syncFromClass();
    const obs = new MutationObserver(syncFromClass);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return null;
}

/** Client-side providers: theme + React Query + compare tray. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <CompareTrayProvider>
          <PolishMotionConfig>
            <ThemeSync />
            {children}
          </PolishMotionConfig>
        </CompareTrayProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
