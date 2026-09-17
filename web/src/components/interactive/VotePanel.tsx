"use client";

// VotePanel — showdown vote for match m-001 (A = muse-spark-1-3 Muse,
// B = gemini-3-8-flash Gemini, status open). One vote per visitor; changing
// sides moves the vote. Optimistic UI, skeleton/error states, aria-live
// counts. Copy: "Showdown vote — match m-001, open".

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

export interface VotePanelProps {
  matchId?: string;
  className?: string;
}

type Status = "loading" | "ready" | "error";
type Side = "A" | "B";

interface MatchPayload {
  id: string;
  sideA: string;
  sideB: string;
  status: string;
  counts: { A: number; B: number };
  total: number;
  userVote: Side | null;
}

interface VotesResponse {
  match: MatchPayload;
}

const DEFAULT_MATCH_ID = "m-001";

export default function VotePanel({ matchId = DEFAULT_MATCH_ID, className }: VotePanelProps) {
  const [match, setMatch] = useState<MatchPayload | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [pendingSide, setPendingSide] = useState<Side | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/votes?matchId=${encodeURIComponent(matchId)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as VotesResponse;
      setMatch(data.match);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const vote = useCallback(
    async (side: Side) => {
      if (pendingSide !== null || match?.userVote === side) return;
      const prev = match;
      // Optimistic update.
      setMatch((m) =>
        m === null
          ? m
          : {
              ...m,
              counts: {
                A: m.counts.A + (side === "A" ? 1 : m.userVote === "A" ? -1 : 0),
                B: m.counts.B + (side === "B" ? 1 : m.userVote === "B" ? -1 : 0),
              },
              total:
                m.userVote === null
                  ? m.total + 1
                  : m.userVote === side
                    ? m.total
                    : m.total,
              userVote: side,
            },
      );
      setPendingSide(side);
      try {
        const res = await fetch("/api/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, side }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as VotesResponse;
        setMatch(data.match);
      } catch {
        setMatch(prev);
        setStatus((s) => (prev === null ? "error" : s));
      } finally {
        setPendingSide(null);
      }
    },
    [match, matchId, pendingSide],
  );

  if (status === "loading" || match === null) {
    if (status === "error" && match === null) {
      return (
        <div className={className}>
          <p role="alert" className="text-sm text-destructive">
            Couldn&apos;t load the showdown vote.
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
      <div className={className} aria-label="Loading showdown vote">
        <span
          aria-hidden="true"
          className="block h-28 w-full animate-pulse rounded-md bg-muted"
        />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  const pctA = match.total > 0 ? Math.round((match.counts.A / match.total) * 100) : 0;
  const pctB = match.total > 0 ? Math.round((match.counts.B / match.total) * 100) : 0;

  return (
    <section aria-label={`Showdown vote ${match.id}`} className={className}>
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">Showdown vote</h2>
        <span className="font-mono text-[11px] rounded-full border border-[var(--border-strong)] bg-[var(--elevated)] px-2 py-0.5 text-[var(--text-secondary)]">
          match {match.id} · {match.status}
        </span>
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        {(
          [
            { side: "A" as Side, slug: match.sideA, count: match.counts.A, pct: pctA },
            { side: "B" as Side, slug: match.sideB, count: match.counts.B, pct: pctB },
          ]
        ).map((row) => (
          <div
            key={row.side}
            className={`relative rounded-[10px] border p-3.5 transition-[border-color,background-color] duration-200 ${
              match.userVote === row.side
                ? "border-[var(--accent)] bg-[var(--accent-muted)]/15 shadow-[0_0_12px_rgba(184,255,90,0.1)]"
                : "border-[var(--border)] bg-[var(--surface)]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">
                <span className="mr-2 font-mono rounded-[4px] border border-[var(--border-strong)] bg-[var(--elevated)] px-1.5 py-0.5 text-xs font-bold text-[var(--text)]">
                  Side {row.side}
                </span>
                {row.slug}
              </p>
              <p className="font-mono text-sm tabular-nums font-semibold text-[var(--text)]">
                {row.count} ({row.pct}%)
              </p>
            </div>
            <div
              role="progressbar"
              aria-valuenow={row.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Side ${row.side} vote share`}
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--elevated)] border border-[var(--border)]"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[#8be320] transition-[width] duration-500 ease-out shadow-[0_0_8px_rgba(184,255,90,0.4)]"
                style={{ width: `${row.pct}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => void vote(row.side)}
              disabled={pendingSide !== null}
              aria-pressed={match.userVote === row.side}
              aria-label={`Vote for side ${row.side} (${row.slug})`}
              className={`mt-3 inline-flex items-center justify-center gap-1.5 w-full rounded-[6px] border px-3 py-1.5 text-sm font-semibold transition-[background-color,border-color,transform] active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                match.userVote === row.side
                  ? "border-[var(--accent-border)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
                  : "border-[var(--border-strong)] bg-[var(--elevated)] text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--elevated)]/80"
              }`}
            >
              {match.userVote === row.side ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  <span>Your pick ✓</span>
                </>
              ) : pendingSide === row.side ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  <span>Voting…</span>
                </>
              ) : (
                `Vote ${row.side}`
              )}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {match.total === 0
          ? "No votes yet."
          : `${match.total} community vote${match.total === 1 ? "" : "s"} · ${match.counts.A}-${match.counts.B}`}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Showdown vote — match m-001, open</p>
    </section>
  );
}
