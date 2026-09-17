/**
 * BDX Bench — Design Tokens (single source of truth)
 * Owner: SUB-AGENT 2/10 DESIGN SYSTEM
 *
 * Contract colors:
 *   dark bg #080A0D / surface #0F1217 / elevated #151920
 *   borders subtle neutral gray / primary near-white / secondary cool muted gray
 *   accent electric lime #B8FF5A
 * Light mode fully supported via next-themes (class) + CSS vars (see globals.css).
 *
 * TAILWIND CONFIG EXTENSION — paste into web/tailwind.config.{js,ts}
 * (owned by scaffold agent; duplicated here so the contract is unambiguous):
 *
 * ```ts
 * import type { Config } from "tailwindcss";
 * import { tailwindExtend } from "@/lib/tokens";
 *
 * const config: Config = {
 *   darkMode: "class",
 *   content: ["./src/app/**", "./src/components/**", "./src/lib/**"],
 *   theme: { extend: tailwindExtend },
 *   plugins: [],
 * };
 * export default config;
 * ```
 */

export const colors = {
  dark: {
    bg: "#080A0D",
    surface: "#0F1217",
    elevated: "#151920",
    overlay: "rgba(4,6,8,0.72)",
    border: "#222A33",
    borderStrong: "#333D47",
    text: "#F2F5F7",
    textSecondary: "#9AA4B2",
    textTertiary: "#6B7684",
    accent: "#B8FF5A",
    accentForeground: "#101600",
    accentMuted: "rgba(184,255,90,0.12)",
    accentBorder: "rgba(184,255,90,0.35)",
    accentInk: "#B8FF5A",
    success: "#B8FF5A",
    warning: "#FFC53D",
    warningMuted: "rgba(255,197,61,0.12)",
    warningBorder: "rgba(255,197,61,0.4)",
    danger: "#FF7A72",
    dangerMuted: "rgba(255,122,114,0.15)",
    info: "#7DD3FC",
    infoMuted: "rgba(125,211,252,0.12)",
    infoBorder: "rgba(125,211,252,0.4)",
    ring: "#B8FF5A",
    ringSoft: "rgba(184,255,90,0.4)",
  },
  light: {
    bg: "#F6F7F9",
    surface: "#FFFFFF",
    elevated: "#FFFFFF",
    overlay: "rgba(12,16,21,0.45)",
    border: "#E2E7ED",
    borderStrong: "#C9D1DB",
    text: "#0C1015",
    textSecondary: "#5B6675",
    textTertiary: "#8A94A3",
    accent: "#B8FF5A",
    accentForeground: "#101600",
    accentMuted: "rgba(101,163,13,0.10)",
    accentBorder: "rgba(101,163,13,0.35)",
    /** Darkened lime for text/links on white (AA). Fills still use #B8FF5A. */
    accentInk: "#3F7A00",
    success: "#2F7A0B",
    warning: "#9A6200",
    warningMuted: "rgba(154,98,0,0.12)",
    warningBorder: "rgba(154,98,0,0.4)",
    danger: "#C22E2E",
    dangerMuted: "rgba(194,46,46,0.12)",
    info: "#0369A1",
    infoMuted: "rgba(3,105,161,0.12)",
    infoBorder: "rgba(3,105,161,0.4)",
    ring: "#3F7A00",
    ringSoft: "rgba(63,122,0,0.35)",
  },
} as const;

export const radius = {
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "10px", // MAX — no giant radius anywhere
} as const;

export const spacing = {
  base: 4,
  scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const,
} as const;

export const typography = {
  fontSans:
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  body: "13px", // dense dashboard
  bodyLg: "14px",
  caption: "12px",
  micro: "11px",
} as const;

export const methodologyVersion = "v1" as const;

/** Status → color key mapping shared by badges / tables / freshness. */
export const statusColor: Record<string, "pass" | "fail" | "warn" | "info" | "neutral"> = {
  pass: "pass",
  passed: "pass",
  done: "pass",
  live: "pass",
  fresh: "pass",
  fail: "fail",
  failed: "fail",
  error: "fail",
  stale: "warn",
  mock: "warn",
  demo: "warn",
  running: "info",
  pending: "info",
};

/**
 * Spread into tailwind.config `theme.extend`.
 * All colors resolve to CSS vars so next-themes class switching is instant
 * with zero Tailwind rebuild.
 */
export const tailwindExtend = {
  colors: {
    bg: "var(--bg)",
    surface: "var(--surface)",
    elevated: "var(--elevated)",
    border: "var(--border)",
    "border-strong": "var(--border-strong)",
    foreground: "var(--text)",
    muted: "var(--text-secondary)",
    faint: "var(--text-tertiary)",
    accent: {
      DEFAULT: "var(--accent)",
      foreground: "var(--accent-foreground)",
      muted: "var(--accent-muted)",
      ink: "var(--accent-ink)",
    },
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    info: "var(--info)",
    ring: "var(--ring)",
  },
  borderRadius: {
    xs: radius.xs,
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
  },
  fontFamily: {
    sans: [typography.fontSans],
    mono: [typography.fontMono],
  },
  fontSize: {
    micro: ["11px", { lineHeight: "16px" }],
    caption: ["12px", { lineHeight: "16px" }],
    body: ["13px", { lineHeight: "20px" }],
    "body-lg": ["14px", { lineHeight: "20px" }],
  },
} as const;

export type ThemeName = keyof typeof colors;
