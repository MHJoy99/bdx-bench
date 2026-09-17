import type { Metadata } from "next";
import { BDX_WEIGHTS } from "@/lib/scores";

export const metadata: Metadata = { title: "Methodology" };

/** Methodology: documents the SINGLE weighting contract (arch-owned). */
export default function MethodologyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Methodology</h1>
      <p className="mt-2 text-muted-foreground">
        How the BDX Bench Score is computed. Weighting is defined once in{" "}
        <code className="font-mono text-sm">@/lib/scores.ts</code> (BDX_WEIGHTS).
      </p>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2">Dimension</th>
            <th className="py-2 text-right">Weight</th>
          </tr>
        </thead>
        <tbody>
          {(Object.entries(BDX_WEIGHTS) as [string, number][]).map(([k, w]) => (
            <tr key={k} className="border-b border-border">
              <td className="py-2 font-mono capitalize">{k}</td>
              <td className="py-2 text-right">{Math.round(w * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-sm text-muted-foreground">
        Normalization: <code className="font-mono">normalizedScore = (raw − min) / (max − min)</code>.
        Composite: weighted sum of subscores (0–100). Missing longContext/efficiency fall back to the
        mean of present dimensions.
      </p>
    </div>
  );
}
