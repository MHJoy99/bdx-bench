"use client";

// Comments — community thread for one scope+id (scope "model"|"match").
// Optimistic append, skeleton/error/empty states, native accessible form,
// aria-live thread count. Limits: 200-char names, 2000-char texts.
// Copy: "Community comments — stored on this server".

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

export interface CommentsProps {
  scope: "model" | "match";
  id: string;
  className?: string;
}

type Status = "loading" | "ready" | "error";

interface CommentItem {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

interface CommentsGetResponse {
  key: string;
  comments: CommentItem[];
}

interface CommentsPostResponse {
  key: string;
  comment: CommentItem;
  count: number;
}

const MAX_NAME = 200;
const MAX_TEXT = 2000;

export default function Comments({ scope, id, className }: CommentsProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/comments?scope=${encodeURIComponent(scope)}&id=${encodeURIComponent(id)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CommentsGetResponse;
      setComments(data.comments);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [id, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const cleanName = name.trim();
      const cleanText = text.trim();
      if (cleanName.length === 0) {
        setFormError("Please enter a display name.");
        return;
      }
      if (cleanName.length > MAX_NAME) {
        setFormError(`Name is too long (max ${MAX_NAME} characters).`);
        return;
      }
      if (cleanText.length === 0) {
        setFormError("Please enter a comment.");
        return;
      }
      if (cleanText.length > MAX_TEXT) {
        setFormError(`Comment is too long (max ${MAX_TEXT} characters).`);
        return;
      }
      if (submitting) return;
      setFormError(null);
      setSubmitting(true);
      const optimistic: CommentItem = {
        id: `pending-${Date.now()}`,
        name: cleanName,
        text: cleanText,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, optimistic]);
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope, id, name: cleanName, text: cleanText }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as CommentsPostResponse;
        setComments((prev) =>
          prev.map((c) => (c.id === optimistic.id ? data.comment : c)),
        );
        setName("");
        setText("");
      } catch {
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
        setFormError("Couldn't post your comment. Please retry.");
      } finally {
        setSubmitting(false);
      }
    },
    [id, name, scope, submitting, text],
  );

  return (
    <section aria-label={`Comments for ${scope} ${id}`} className={className}>
      <h2 className="text-base font-semibold">Comments</h2>
      <p aria-live="polite" className="mt-1 text-sm text-muted-foreground">
        {status === "loading"
          ? "Loading comments…"
          : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
      </p>

      {status === "loading" ? (
        <div aria-label="Loading comments" className="mt-3 space-y-2">
          {[0, 1].map((n) => (
            <span
              key={n}
              aria-hidden="true"
              className="block h-14 w-full animate-pulse rounded-md bg-muted"
            />
          ))}
          <span className="sr-only">Loading…</span>
        </div>
      ) : status === "error" ? (
        <div className="mt-3">
          <p role="alert" className="text-sm text-destructive">
            Couldn&apos;t load comments.
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-1 rounded-md border px-3 py-1.5 text-sm underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      ) : comments.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No comments yet — start the discussion.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{c.name}</p>
                <time
                  dateTime={c.createdAt}
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  {c.createdAt.slice(0, 10)}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{c.text}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-2">
        <div>
          <label htmlFor={`comment-name-${scope}-${id}`} className="text-sm font-medium">
            Display name
          </label>
          <input
            id={`comment-name-${scope}-${id}`}
            type="text"
            value={name}
            maxLength={MAX_NAME}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. bench-reader"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-0.5 text-xs text-muted-foreground">
            {name.length}/{MAX_NAME}
          </p>
        </div>
        <div>
          <label htmlFor={`comment-text-${scope}-${id}`} className="text-sm font-medium">
            Comment
          </label>
          <textarea
            id={`comment-text-${scope}-${id}`}
            value={text}
            maxLength={MAX_TEXT}
            rows={3}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your take…"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-0.5 text-xs text-muted-foreground">
            {text.length}/{MAX_TEXT}
          </p>
        </div>
        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          {submitting ? "Posting…" : "Post comment"}
        </button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        Community comments — stored on this server
      </p>
    </section>
  );
}
