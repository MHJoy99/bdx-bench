"use client";

// StarRating — community 1-5 rating for one canonical model slug.
// Optimistic UI, skeleton/error/empty states, radiogroup keyboard support
// (arrows/Home/End + Enter/Space), aria-live average.
// Copy: "Community ratings — stored on this server".

import { useCallback, useEffect, useState } from "react";
import type { KeyboardEvent } from "react";

export interface StarRatingProps {
  modelSlug: string;
  initialAvg?: number;
  initialCount?: number;
  initialUserRating?: number | null;
  className?: string;
}

type Status = "loading" | "ready" | "error";

interface RatingsGetResponse {
  ratings: Record<
    string,
    { count: number; sum: number; avg: number; userRating: number | null }
  >;
}

interface RatingsPostResponse {
  modelSlug: string;
  count: number;
  sum: number;
  avg: number;
  userRating: number;
}

export default function StarRating({
  modelSlug,
  initialAvg,
  initialCount,
  initialUserRating,
  className,
}: StarRatingProps) {
  const [avg, setAvg] = useState<number>(initialAvg ?? 0);
  const [count, setCount] = useState<number>(initialCount ?? 0);
  const [userRating, setUserRating] = useState<number | null>(initialUserRating ?? null);
  const [focusStar, setFocusStar] = useState<number>(initialUserRating ?? 0);
  const [status, setStatus] = useState<Status>(
    initialCount !== undefined ? "ready" : "loading",
  );
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    setFailed(false);
    try {
      const res = await fetch(
        `/api/ratings?modelSlug=${encodeURIComponent(modelSlug)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as RatingsGetResponse;
      const entry = data.ratings[modelSlug];
      setAvg(entry?.avg ?? 0);
      setCount(entry?.count ?? 0);
      setUserRating(entry?.userRating ?? null);
      setFocusStar(entry?.userRating ?? 0);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [modelSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (value: number) => {
      if (pending || value < 1 || value > 5) return;
      const prevUser = userRating;
      setUserRating(value);
      setFailed(false);
      setPending(true);
      try {
        const res = await fetch("/api/ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelSlug, value }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as RatingsPostResponse;
        setAvg(data.avg);
        setCount(data.count);
        setUserRating(data.userRating);
      } catch {
        setUserRating(prevUser);
        setFailed(true);
      } finally {
        setPending(false);
      }
    },
    [modelSlug, pending, userRating],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      let next: number | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(5, (focusStar || 0) + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown")
        next = Math.max(1, (focusStar || 0) - 1 || 1);
      else if (e.key === "Home") next = 1;
      else if (e.key === "End") next = 5;
      else if ((e.key === "Enter" || e.key === " ") && focusStar >= 1) {
        e.preventDefault();
        void submit(focusStar);
        return;
      } else return;
      e.preventDefault();
      if (next !== null) {
        setFocusStar(next);
        document.getElementById(`star-${modelSlug}-${next}`)?.focus();
      }
    },
    [focusStar, modelSlug, submit],
  );

  if (status === "loading") {
    return (
      <div className={className} aria-label="Loading rating">
        <span
          aria-hidden="true"
          className="inline-block h-9 w-48 animate-pulse rounded-md bg-muted"
        />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={className}>
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t load ratings.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-1 rounded-md border px-3 py-1.5 text-sm underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const display = userRating ?? focusStar;

  return (
    <div className={className}>
      <div
        role="radiogroup"
        aria-label={`Rate ${modelSlug} from 1 to 5 stars`}
        onKeyDown={onKeyDown}
        className="inline-flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            id={`star-${modelSlug}-${n}`}
            type="button"
            role="radio"
            aria-checked={userRating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            disabled={pending}
            onClick={() => void submit(n)}
            onFocus={() => setFocusStar(n)}
            onMouseEnter={() => setFocusStar(n)}
            className="rounded p-1 text-xl leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <span aria-hidden="true">{n <= display ? "★" : "☆"}</span>
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-1 text-sm text-muted-foreground">
        {count === 0
          ? "No community ratings yet — be the first."
          : `Average ${avg.toFixed(1)} from ${count} community rating${count === 1 ? "" : "s"}`}
        {userRating !== null ? ` · you rated ${userRating}` : ""}
      </p>
      {failed ? (
        <p role="alert" className="mt-1 text-sm text-destructive">
          Couldn&apos;t save your rating.{" "}
          <button type="button" onClick={() => userRating !== null && void submit(userRating)} className="underline underline-offset-2">
            Retry
          </button>
        </p>
      ) : null}
      <p className="mt-1 text-xs text-muted-foreground">
        Community ratings — stored on this server
      </p>
    </div>
  );
}
