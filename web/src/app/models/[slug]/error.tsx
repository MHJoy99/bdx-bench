"use client";

import Link from "next/link";

export default function ModelPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
      <p className="font-mono text-[11px] uppercase leading-4 tracking-wide text-[#C22E2E] dark:text-[#FF7A72]">
        Something went wrong
      </p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">
        Could not load this model page
      </h1>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
        This profile could not be rendered
        {error?.digest ? (
          <>
            {" "}
            (ref <span className="font-mono">{error.digest}</span>)
          </>
        ) : null}
        . Try again, or return to the leaderboard.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-bdx-accent/50 bg-bdx-accent/15 px-4 py-1.5 text-[13px] font-medium leading-5 text-foreground"
        >
          Try again
        </button>
        <Link
          href="/leaderboard"
          className="rounded-md border border-border bg-card px-4 py-1.5 text-[13px] leading-5 text-muted-foreground hover:text-foreground"
        >
          Leaderboard
        </Link>
      </div>
    </main>
  );
}
