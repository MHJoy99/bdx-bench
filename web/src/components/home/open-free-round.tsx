"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RoundEntry = {
  model: string;
  ok: boolean;
  status: number | null;
  answerLen: number;
  matchId: string | null;
  note: string;
};

type FreeModel = { id: string; context: number | null; description: string };

const TABS = [
  "Linked matches",
  "Captured answers",
  "Rate-limited",
  "Harness-only",
  "Free catalog",
  "Coding free",
  "Long context",
] as const;

type Tab = (typeof TABS)[number];

function pill(note: string) {
  return (
    <span className="rounded-full border border-bdx-border bg-bdx-elevated px-2 py-0.5 text-[11px] text-bdx-muted">
      {note}
    </span>
  );
}

export function OpenFreeRound() {
  const [tab, setTab] = useState<Tab>("Linked matches");
  const [q, setQ] = useState("");
  const [round, setRound] = useState<{ entries: RoundEntry[]; baseline: string } | null>(null);
  const [free, setFree] = useState<FreeModel[]>([]);
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch("/api/free-round").then((r) => r.json()).then((j) => {
      if (Array.isArray(j.entries)) setRound({ entries: j.entries, baseline: j.baseline || "" });
    }).catch(() => {});
    fetch("/api/openrouter-free").then((r) => r.json()).then((j) => {
      if (Array.isArray(j.models)) setFree(j.models);
    }).catch(() => {});
  }, []);

  const entries = useMemo(() => {
    const list = (round?.entries || []).filter((e) => !q || e.model.toLowerCase().includes(q.toLowerCase()));
    return list.slice().sort((a, b) => (sortAsc ? a.answerLen - b.answerLen : b.answerLen - a.answerLen));
  }, [round, q, sortAsc]);

  const catalog = useMemo(() => {
    let list = free.filter((m) => !q || m.id.toLowerCase().includes(q.toLowerCase()));
    if (tab === "Coding free") list = list.filter((m) => /code|laguna|north|deepseek|glm|qwen/i.test(m.id));
    if (tab === "Long context") list = list.filter((m) => (m.context || 0) >= 500000);
    return list.slice().sort((a, b) => (b.context || 0) - (a.context || 0)).slice(0, 50);
  }, [free, q, tab]);

  const linked = entries.filter((e) => e.matchId);
  const captured = entries.filter((e) => e.ok);
  const limited = entries.filter((e) => e.note === "rate-limited");
  const harnessOnly = entries.filter((e) => e.note === "harness-only");

  return (
    <section aria-labelledby="home-free-round-heading">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle id="home-free-round-heading" className="text-lg font-semibold tracking-tight">
              Open free-model round
            </CardTitle>
            <p className="mt-1 text-sm text-bdx-muted">
              Flamethrower prompt <span className="font-mono">p-001</span> across OpenRouter free models.
              Captures link as blind arena matches vs baseline — vote on the leaderboard. No fake scores.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter models…"
              aria-label="Filter free-model tables"
              className="rounded-[8px] border border-bdx-border bg-bdx-bg px-3 py-1.5 text-sm text-bdx-ink"
            />
            <button
              type="button"
              onClick={() => setSortAsc((v) => !v)}
              className="rounded-[8px] border border-bdx-border bg-bdx-elevated px-3 py-1.5 text-xs text-bdx-muted"
            >
              {sortAsc ? "Shortest first" : "Longest first"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList aria-label="Free-round views" className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className={t === tab
                    ? "rounded-full border border-bdx-accent bg-bdx-accent px-3 py-1.5 text-xs font-semibold text-black"
                    : "rounded-full border border-bdx-border bg-bdx-elevated px-3 py-1.5 text-xs text-bdx-muted"}
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {(tab === "Linked matches" || tab === "Captured answers" || tab === "Rate-limited" || tab === "Harness-only") && (
            <div className="mt-4 overflow-x-auto rounded-[10px] border border-bdx-border">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <caption className="sr-only">OpenRouter free-model flamethrower round results.</caption>
                <thead>
                  <tr className="border-b border-bdx-border bg-bdx-elevated text-xs uppercase tracking-wider text-bdx-muted">
                    <th scope="col" className="px-4 py-3 font-medium">Model</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Answer chars</th>
                    <th scope="col" className="px-4 py-3 font-medium">Arena</th>
                  </tr>
                </thead>
                <tbody>
                  {(tab === "Linked matches" ? linked : tab === "Captured answers" ? captured : tab === "Rate-limited" ? limited : harnessOnly).map((e) => (
                    <tr key={e.model} className="border-b border-bdx-border/60 last:border-0 hover:bg-bdx-elevated/60">
                      <td className="px-4 py-3 font-mono text-xs text-bdx-ink">{e.model}</td>
                      <td className="px-4 py-3">{pill(e.note)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-bdx-ink">{e.answerLen || "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        {e.matchId ? (
                          <Link href={`/leaderboard`} className="text-bdx-accent underline-offset-4 hover:underline">
                            {e.matchId} — vote
                          </Link>
                        ) : (
                          <span className="text-bdx-muted">pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(tab === "Free catalog" || tab === "Coding free" || tab === "Long context") && (
            <div className="mt-4 overflow-x-auto rounded-[10px] border border-bdx-border">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <caption className="sr-only">OpenRouter free model catalog.</caption>
                <thead>
                  <tr className="border-b border-bdx-border bg-bdx-elevated text-xs uppercase tracking-wider text-bdx-muted">
                    <th scope="col" className="px-4 py-3 font-medium">Model</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Context</th>
                    <th scope="col" className="px-4 py-3 font-medium">Round status</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((m) => {
                    const hit = (round?.entries || []).find((e) => e.model === m.id);
                    return (
                      <tr key={m.id} className="border-b border-bdx-border/60 last:border-0 hover:bg-bdx-elevated/60">
                        <td className="px-4 py-3 font-mono text-xs text-bdx-ink">{m.id}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-bdx-muted">{m.context ? m.context.toLocaleString() : "—"}</td>
                        <td className="px-4 py-3">{hit ? pill(hit.note + (hit.matchId ? ` · ${hit.matchId}` : "")) : pill("not in round")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-xs text-bdx-muted">
            Round: openrouter-free-sep-2026 · prompt p-001 · baseline {round?.baseline || "bdx-ai/go-muse-spark-1.3-contributor"} ·
            {" "}{linked.length} linked / {captured.length} captured / {entries.length} total. stealth/union-alpha retired → unbiased/pareto.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
