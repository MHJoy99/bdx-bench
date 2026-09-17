"use client";

// LikeButton — community like toggle for one canonical model slug.
// Optimistic UI, skeleton/error states, keyboard-accessible <button>,
// aria-live count. Copy: "Community likes — stored on this server".

import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";

export interface LikeButtonProps {
  modelSlug: string;
  initialCount?: number;
  initialLiked?: boolean;
  className?: string;
}

type Status = "loading" | "ready" | "error";

interface LikesGetResponse {
  likes: Record<string, { count: number; liked: boolean }>;
}

interface LikesPostResponse {
  modelSlug: string;
  count: number;
  liked: boolean;
}

export default function LikeButton({
  modelSlug,
  initialCount,
  initialLiked,
  className,
}: LikeButtonProps) {
  const [count, setCount] = useState<number>(initialCount ?? 0);
  const [liked, setLiked] = useState<boolean>(initialLiked ?? false);
  const [status, setStatus] = useState<Status>(
    initialCount !== undefined ? "ready" : "loading",
  );
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/likes?modelSlug=${encodeURIComponent(modelSlug)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as LikesGetResponse;
      const entry = data.likes[modelSlug];
      setCount(entry?.count ?? 0);
      setLiked(entry?.liked ?? false);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [modelSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(async () => {
    if (pending) return;
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!prevLiked);
    setCount(prevCount + (prevLiked ? -1 : 1));
    setPending(true);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelSlug }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as LikesPostResponse;
      setCount(data.count);
      setLiked(data.liked);
    } catch {
      // Roll back the optimistic update on failure.
      setLiked(prevLiked);
      setCount(prevCount);
      setStatus("error");
    } finally {
      setPending(false);
    }
  }, [count, liked, modelSlug, pending]);

  if (status === "loading") {
    return (
      <div className={className} aria-label="Loading like count">
        <span
          aria-hidden="true"
          className="inline-block h-9 w-24 animate-pulse rounded-md bg-muted"
        />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (status === "error" && initialCount === undefined) {
    return (
      <div className={className}>
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t load likes.
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

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={pending}
        aria-pressed={liked}
        aria-label={`${liked ? "Unlike" : "Like"} ${modelSlug}`}
        className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-[background-color,border-color,transform,box-shadow] duration-150 active:scale-[0.96] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
          liked
            ? "border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--elevated)] hover:text-[var(--text)]"
        }`}
      >
        <Heart
          className={`size-4 transition-[transform,color] duration-200 group-hover:scale-110 motion-reduce:transform-none ${
            liked ? "fill-rose-500 text-rose-500 animate-in zoom-in-75 duration-200" : "text-[var(--text-tertiary)]"
          }`}
          aria-hidden="true"
        />
        <span>{liked ? "Liked" : "Like"}</span>
        <span aria-live="polite" aria-label={`${count} community likes`} className="font-mono text-xs font-semibold tabular-nums">
          {count}
        </span>
      </button>
      <p className="mt-1 text-xs text-muted-foreground">
        Community likes — stored on this server
      </p>
    </div>
  );
}
