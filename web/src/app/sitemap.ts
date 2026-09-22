import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://bench.bdx.market";
  const now = new Date();

  const routes = [
    "",
    "/leaderboard",
    "/benchmarks",
    "/models",
    "/compare",
    "/methodology",
    "/trends",
    "/price-performance",
    "/eval",
    "/models/muse-spark-1-3",
    "/models/deepseek-v4-1-flash",
    "/models/gpt-5-6-luna",
    "/models/gpt-6-sol",
    "/models/gpt-6-luna",
    "/models/gemini-3-8-flash",
    "/play/pyro-vs-zombies",
    "/play/pyre-burn-horde",
    "/play/cinderline",
    "/play/emberfall",
    "/play/firebreak-night-shift",
    "/play/pyroclasm-inferno",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route.startsWith("/play") ? "monthly" : "daily",
    priority: route === "" ? 1.0 : route.startsWith("/play") ? 0.8 : 0.7,
  }));
}
