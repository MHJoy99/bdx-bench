"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "bdx-compare-tray";
const MAX_MODELS = 6;

type CompareTrayContextValue = {
  models: string[];
  add: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
  isFull: boolean;
};

const CompareTrayContext = createContext<CompareTrayContextValue | null>(null);

/** Compare tray: React context + localStorage persistence, max 6 models. */
export function CompareTrayProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setModels(parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_MODELS));
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
    } catch {
      // storage full / private mode — tray still works in-memory
    }
  }, [models]);

  const add = useCallback((slug: string) => {
    setModels((prev) =>
      prev.includes(slug) || prev.length >= MAX_MODELS ? prev : [...prev, slug],
    );
  }, []);
  const remove = useCallback((slug: string) => {
    setModels((prev) => prev.filter((s) => s !== slug));
  }, []);
  const clear = useCallback(() => setModels([]), []);
  const has = useCallback((slug: string) => models.includes(slug), [models]);

  const value = useMemo(
    () => ({ models, add, remove, clear, has, isFull: models.length >= MAX_MODELS }),
    [models, add, remove, clear],
  );
  return <CompareTrayContext.Provider value={value}>{children}</CompareTrayContext.Provider>;
}

export function useCompareTray(): CompareTrayContextValue {
  const ctx = useContext(CompareTrayContext);
  if (!ctx) throw new Error("useCompareTray must be used within CompareTrayProvider");
  return ctx;
}
