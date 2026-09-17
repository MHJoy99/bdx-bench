import Link from "next/link";
import { getAllModelSlugs, getModelPageData } from "@/lib/model-pages-demo";

/**
 * 404 for /models/[slug] — unknown or malformed slugs.
 * Owner: SUB-AGENT 5/10 MODEL PAGES.
 */
export default function ModelNotFound() {
  const known = getAllModelSlugs().flatMap((slug) => {
    const r = getModelPageData(slug);
    return r.ok ? [{ slug: r.data.model.slug, name: r.data.model.name }] : [];
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
      <p className="font-mono text-[11px] uppercase leading-4 tracking-wide text-[#9A6200] dark:text-[#FFC53D]">
        Demo catalogue
      </p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">
        Model not found
      </h1>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
        That slug is not in the demo catalogue. It may be malformed (lowercase
        letters, numbers and single hyphens only) or simply unknown.
      </p>

      {known.length > 0 ? (
        <nav aria-label="Known demo models" className="mt-6">
          <p className="text-xs text-muted-foreground">
            Available demo models:
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
