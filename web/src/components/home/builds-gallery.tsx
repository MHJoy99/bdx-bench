"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Entry = {
  model: string;
  ok: boolean;
  answerLen: number;
  matchId: string | null;
  note: string;
  excerpt: string;
};

const VERIFIED = [
  {
    name: "PYRO vs ZOMBIES",
    model: "Muse Spark 1.3",
    score: 92,
    href: "/play/pyro-vs-zombies",
    blurb: "Top-down survival arena. Burn waves with the flamethrower cone, dodge grabs, chain-burn combos, HP pickups, localStorage high-score.",
  },
  {
    name: "PYRE — Burn the Horde",
    model: "DeepSeek V4.1 Flash",
    score: 91,
    href: "/play/pyre-burn-horde",
    blurb: "Dark-arena wave survival built on chain reactions: ignited zombies spread fire, six enemy types, Titan boss every 5th wave, upgrades between waves. Verified 60 FPS with 120 zombies live.",
  },
  {
    name: "PYROCLASM: Zombie Inferno",
    model: "Gemini 3.8 Flash",
    score: 88,
    href: "/play/pyroclasm-inferno",
    blurb: "Arena survival plus unlockables (Fireball, Napalm Mines), edge-spawned waves, chain ignites, supernova room-clear blast.",
  },
];

const TABS = ["Playable builds", "Round captures", "How scoring works"] as const;
type Tab = (typeof TABS)[number];

export function BuildsGallery() {
  const [tab, setTab] = useState<Tab>("Playable builds");
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    fetch("/api/free-round", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.entries)) setEntries(j.entries.filter((e: Entry) => e.ok && e.excerpt));
      })
      .catch(() => {});
  }, []);

  return (
    <section aria-labelledby="home-builds-heading">
      <Card>
        <CardHeader>
          <CardTitle id="home-builds-heading" className="text-lg font-semibold tracking-tight">
            Builds gallery
          </CardTitle>
          <p className="mt-1 text-sm text-bdx-muted">
            Every playable build in one place. Verified builds launch instantly — round captures show
            answer previews with arena matches for voting until they pass playability review.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList aria-label="Builds views" className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
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

          {tab === "Playable builds" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {VERIFIED.map((b) => (
                <div key={b.href} className="rounded-[10px] border border-bdx-border bg-bdx-bg p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-bdx-ink">{b.name}</h3>
                    <span className="tabular-nums text-sm text-bdx-muted">{b.score} Showdown</span>
                  </div>
                  <p className="mt-1 text-sm text-bdx-muted">by {b.model}</p>
                  <p className="mt-2 text-sm text-bdx-ink">{b.blurb}</p>
                  <Link
                    href={b.href}
                    className="mt-3 inline-block rounded-[8px] bg-bdx-accent px-4 py-2 text-sm font-semibold text-black"
                  >
                    Play this build
                  </Link>
                </div>
              ))}
            </div>
          )}

          {tab === "Round captures" && (
            <div className="mt-4 grid gap-3">
              {entries.length === 0 && (
                <p className="text-sm text-bdx-muted">Loading captures…</p>
              )}
              {entries.map((e) => (
                <details key={e.model} className="rounded-[10px] border border-bdx-border bg-bdx-bg p-3">
                  <summary className="cursor-pointer text-sm font-medium text-bdx-ink">
                    <span className="font-mono text-xs">{e.model}</span>
                    <span className="ml-2 text-xs text-bdx-muted">
                      {e.answerLen} chars · {e.matchId ? `${e.matchId} open` : e.note}
                    </span>
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-bdx-muted">{e.excerpt}…</pre>
                  <p className="mt-2 text-xs text-bdx-muted">
                    Unverified capture — needs playability review before it becomes a playable build.{" "}
                    {e.matchId && <span className="font-mono">{e.matchId}: vote on the leaderboard.</span>}
                  </p>
                </details>
              ))}
            </div>
          )}

          {tab === "How scoring works" && (
            <div className="mt-4 space-y-2 text-sm text-bdx-muted">
              <p>Same brief for every build in a round (prompt p-001), binary playability check + feature checklist, then judge review.</p>
              <p>Showdown Scores come only from direct review: 92 Muse Spark 1.3, 88 Gemini 3.8 Flash. Automated captures never invent scores — they enter blind arena matches for community votes.</p>
              <p><Link href="/methodology" className="text-bdx-accent underline-offset-4 hover:underline">Read methodology</Link></p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
