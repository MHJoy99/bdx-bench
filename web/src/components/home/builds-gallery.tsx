"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    score: 94,
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

const TABS = ["Playable builds", "How scoring works"] as const;
type Tab = (typeof TABS)[number];

export function BuildsGallery() {
  const [tab, setTab] = useState<Tab>("Playable builds");

  return (
    <section aria-labelledby="home-builds-heading">
      <Card>
        <CardHeader>
          <CardTitle id="home-builds-heading" className="text-lg font-semibold tracking-tight">
            Builds gallery
          </CardTitle>
            <p className="mt-1 text-sm text-bdx-muted">
              Every verified build in one place. Each one launches instantly in your browser.
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

          {tab === "How scoring works" && (
            <div className="mt-4 space-y-2 text-sm text-bdx-muted">
              <p>Same brief for every build in a round (prompt p-001), binary playability check + feature checklist, then judge review.</p>
              <p>Showdown Scores come only from direct hands-on review: 94 DeepSeek V4.1 Flash, 92 Muse Spark 1.3, 88 Gemini 3.8 Flash.</p>
              <p><Link href="/methodology" className="text-bdx-accent underline-offset-4 hover:underline">Read methodology</Link></p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
