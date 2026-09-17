import Link from "next/link";
import { MODELS } from "@/lib/data";

export default function ModelNotFound() {
  const known = MODELS.map((m) => ({ slug: m.slug, name: m.name }));

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
      <p className="font-mono text-[11px] uppercase leading-4 tracking-wide text-muted-foreground">
        BDX Bench
      </p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">
        Model not found
      </h1>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
        That address does not match a known build. Slugs use lowercase
        letters, numbers, and single hyphens. Try one of the evaluated builds
        below, or search from the leaderboard.
      </p>

      {known.length > 0 ? (
        <nav aria-label="Known models" className="mt-6">
          <p className="text-xs text-muted-foreground">
            Evaluated builds:
          </p>
          <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
            {known.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/models/${m.slug}`}
                  className="inline-block rounded-md border border-border bg-card px-2.5 py-1 text-[13px] leading-5 hover:border-bdx-accent/50"
                >
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="mt-6 flex justify-center gap-4 text-[13px] leading-5">
        <Link href="/leaderboard" className="underline underline-offset-2">
          Leaderboard
        </Link>
        <Link href="/" className="underline underline-offset-2">
          Home
        </Link>
      </div>
    </main>
  );
}
