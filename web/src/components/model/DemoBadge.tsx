/**
 * Demo badge — marks every synthetic placeholder value on model pages.
 * Owner: SUB-AGENT 5/10 MODEL PAGES.
 * Colors are arbitrary values pinned to `@/lib/tokens` warning hexes so the
 * badge renders correctly without depending on other agents' Tailwind edits.
 */
export function DemoBadge({ label = "Demo" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-sm bg-[#FFC53D]/15 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase leading-4 tracking-wide text-[#9A6200] dark:text-[#FFC53D]">
      {label}
    </span>
  );
}
