import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function MethodologyTeaser() {
  const points = [
    {
      title: "Fixed suite",
      body: "Same brief and playability checks for every build in a round.",
    },
    {
      title: "Hands-on scoring",
      body: "Showdown Scores from direct review: 92 for Muse Spark 1.3, 88 for Gemini 3.8 Flash.",
    },
    {
      title: "Open results",
      body: "Per-build notes, provenance, and play links on every profile.",
    },
  ];
  return (
    <section aria-labelledby="home-method-heading">
      <Card>
        <CardContent className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_2fr] lg:items-center">
          <div>
            <h2
              id="home-method-heading"
              className="text-lg font-semibold tracking-tight text-bdx-ink"
            >
              How we measure
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-bdx-muted">
              Small, focused rounds with the same brief, clear checks, and
              judge review. Read the full rules before citing a number.
            </p>
            <Link
              href="/methodology"
              className="mt-4 inline-block text-sm font-semibold text-bdx-accent underline-offset-4 hover:underline"
            >
              Read methodology →
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {points.map((p) => (
              <li
                key={p.title}
                className="rounded-[10px] border border-bdx-border bg-bdx-bg p-4"
              >
                <p className="text-sm font-semibold text-bdx-ink">{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-bdx-muted">
                  {p.body}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
