import { format, formatDistanceToNow, parseISO } from "date-fns";

/** USD per 1M tokens, e.g. 3 -> "$3.00/1M". */
export function formatPrice(per1M: number, currency = "USD"): string {
  const symbol = currency === "USD" ? "$" : `${currency} `;
  if (per1M === 0) return `${symbol}0.00/1M`;
  if (per1M < 0.01) return `${symbol}${per1M.toFixed(4)}/1M`;
  return `${symbol}${per1M.toFixed(2)}/1M`;
}

/** Compact token counts, e.g. 128000 -> "128K", 1000000 -> "1M". */
export function formatTokens(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}K`;
  }
  return String(n);
}

/** Throughput, e.g. 85.4 -> "85.4 tok/s". */
export function formatTps(tps: number): string {
  if (!Number.isFinite(tps)) return "—";
  return `${tps.toFixed(1)} tok/s`;
}

/** ISO date -> "Sep 17, 2026". */
export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

/** ISO date -> "3d ago" style relative label. */
export function formatRelative(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

/** 0-100 score with one decimal. */
export function formatScore(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(1);
}
