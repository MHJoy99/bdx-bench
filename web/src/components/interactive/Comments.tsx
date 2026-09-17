"use client";

// Comments — community thread for one scope+id (scope "model"|"match").
// Optimistic append, skeleton/error/empty states, native accessible form,
// aria-live thread count. Limits: 200-char names, 2000-char texts.
// Copy: "Community comments — stored on this server".

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, SendHorizontal } from "lucide-react";

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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0 || !parts[0]) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase() || "U";
}

const AVATAR_COLORS = [
  "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  "border-sky-500/40 bg-sky-500/10 text-sky-300",
  "border-amber-500/40 bg-amber-500/10 text-amber-300",
  "border-violet-500/40 bg-violet-500/10 text-violet-300",
  "border-rose-500/40 bg-rose-500/10 text-rose-300",
];

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
        <p className="mt-3 rounded-[8px] border border-dashed border-[var(--border-strong)] p-4 text-center text-sm text-[var(--text-secondary)]">
          No comments yet — start the discussion.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {comments.map((c) => {
            const colorClass = AVATAR_COLORS[Math.abs(c.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % AVATAR_COLORS.length];
            return (
              <li key={c.id} className="flex gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold ${colorClass}`}>
                  {getInitials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium text-[var(--text)]">{c.name}</p>
                    <time dateTime={c.createdAt} className="shrink-0 font-mono text-[11px] text-[var(--text-tertiary)]">
                      {c.createdAt.slice(0, 10)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-secondary)] leading-relaxed">{c.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div>
          <label htmlFor={`comment-name-${scope}-${id}`} className="text-xs font-mono font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Display name
          </label>
          <input
            id={`comment-name-${scope}-${id}`}
            type="text"
            value={name}
            maxLength={MAX_NAME}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. bench-reader"
            className="mt-1 w-full rounded-[6px] border border-[var(--border)] bg-[var(--elevated)] px-3 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
            {name.length}/{MAX_NAME}
          </p>
        </div>
        <div>
          <label htmlFor={`comment-text-${scope}-${id}`} className="text-xs font-mono font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Comment
          </label>
          <textarea
            id={`comment-text-${scope}-${id}`}
            value={text}
            maxLength={MAX_TEXT}
            rows={3}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your take…"
            className="mt-1 w-full rounded-[6px] border border-[var(--border)] bg-[var(--elevated)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
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
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-transparent bg-[var(--accent)] px-3.5 py-1.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-sm transition-[filter,transform] hover:brightness-105 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          {submitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              <span>Posting…</span>
            </>
          ) : (
            <>
              <SendHorizontal className="size-3.5" aria-hidden="true" />
              <span>Post comment</span>
            </>
          )}
        </button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        Community comments — stored on this server
      </p>
    </section>
  );
}
