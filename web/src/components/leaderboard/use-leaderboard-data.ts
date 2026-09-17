"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { MODELS } from "@/lib/data";
import { LeaderboardRowSchema, ModelSchema } from "@/lib/types";
import type { LeaderboardTableRow } from "./columns";

const modelsResponseSchema = z.object({ models: z.array(ModelSchema) });
const leaderboardResponseSchema = z.object({
  leaderboard: z.array(LeaderboardRowSchema),
});

export type LeaderboardDataState = {
  rows: LeaderboardTableRow[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

export function useLeaderboardData(): LeaderboardDataState {
  const [rows, setRows] = useState<LeaderboardTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [modelsRes, boardRes] = await Promise.all([
          fetch("/api/models", { cache: "no-store" }),
          fetch("/api/leaderboard", { cache: "no-store" }),
        ]);
        if (!modelsRes.ok) throw new Error(`GET /api/models -> ${modelsRes.status}`);
        if (!boardRes.ok) throw new Error(`GET /api/leaderboard -> ${boardRes.status}`);

        const modelsParsed = modelsResponseSchema.safeParse(await modelsRes.json());
        const boardParsed = leaderboardResponseSchema.safeParse(await boardRes.json());
        if (!modelsParsed.success) throw new Error("Unexpected /api/models shape");
        if (!boardParsed.success) throw new Error("Unexpected /api/leaderboard shape");
        if (cancelled) return;

        const rankBySlug = new Map(
          boardParsed.data.leaderboard.map((r) => [r.modelSlug, r.rank] as const),
        );
        const tableRows: LeaderboardTableRow[] = modelsParsed.data.models.map((m) => ({
          ...m,
          rank: rankBySlug.get(m.slug) ?? 0,
          rankDelta: null,
        }));
        tableRows.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
        tableRows.forEach((r, i) => {
          if (!r.rank) r.rank = i + 1;
        });
        setRows(tableRows);
      } catch (e) {
        if (cancelled) return;
        setRows(
          MODELS.map((m, i) => ({
            ...m,
            rank: i + 1,
            rankDelta: null,
          })),
        );
        setError(e instanceof Error ? e.message : "Failed to load leaderboard");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return {
    rows,
    isLoading,
    error,
    reload: () => setNonce((n) => n + 1),
  };
}
