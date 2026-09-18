"use client";

import { useEffect, useState } from "react";

type Entry = {
  model: string;
  ok: boolean;
  status: number | null;
  answerLen: number;
  matchId: string | null;
  note: string;
};

/**
 * Pending free-model evaluations for the leaderboard page.
 * Reads the static round snapshot (no scores invented): models with
 * captured answers show as "arena open, awaiting votes".
 */
export function PendingRound() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/free-round", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.entries)) setEntries(j.entries);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="mt-6 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4" aria-busy="true">
        <div className="h-6 w-1/3 animate-pulse rounded bg-[var(--elevated)]" />
      </div>
    );
  }
  if (entries.length === 0) return null;

  const linked = entries.filter((e) => e.matchId);
  return (
    <section aria-labelledby="pending-round-heading" className="mt-8">
      <h2 id="pending-round-heading" className="text-lg font-semibold tracking-tight text-[var(--text)]">
        Pending evaluations — open free-model round
      </h2>
      <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
        {linked.length} of {entries.length} free models captured on prompt p-001 and linked as blind arena
        matches. They have no Showdown Score yet — vote to build Elo. Rate-limited and harness-only
        models retry in the next round.
      </p>
      <div className="mt-4 overflow-x-auto rounded-[10px] border border-[var(--border)]">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <caption className="sr-only">Pending free-model evaluations with arena match status.</caption>
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              <th scope="col" className="px-4 py-3 font-medium">Model</th>
              <th scope="col" className="px-4 py-3 font-medium">Round status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Answer chars</th>
              <th scope="col" className="px-4 py-3 font-medium">Arena match</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.model} className="border-b border-[var(--border)]/60 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{e.model}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{e.note}</td>
                <td className="px-4 py-3 text-right tabular-nums">{e.answerLen || "—"}</td>
                <td className="px-4 py-3">{e.matchId ? <span className="font-mono text-xs">{e.matchId} · open</span> : <span className="text-[var(--text-secondary)]">pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
