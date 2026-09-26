#!/usr/bin/env bash
# BDX Bench pull-deploy — run as root on VPS
# App: /srv/bot-storage/sites/bench.bdx.market (second drive, 36G free)
# Never touches other vhosts. Preserves data/*.json and interactive JSON store.
set -euo pipefail
APP=/srv/bot-storage/sites/bench.bdx.market
cd "$APP"
git fetch origin main
git pull --ff-only origin main
cd web
NEXT_PUBLIC_SITE_URL=https://bench.bdx.market npm run build
mkdir -p .next/standalone/.next .next/standalone/public .next/standalone/data/interactive
cp -r .next/static .next/standalone/.next/static
cp -r public/* .next/standalone/public/ 2>/dev/null || true
cp data/*.json .next/standalone/data/ 2>/dev/null || true
chown -R bench:bench "$APP"
systemctl restart bdx-bench
for i in $(seq 1 15); do curl -sf http://127.0.0.1:8766/api/leaderboard && break || sleep 1; done

# --- static pages (every public route must render) ---------------------
for p in / /leaderboard /models /models/space-bunny-free /benchmarks /compare \
         /trends /methodology /price-performance; do
  curl -sf "https://bench.bdx.market$p" > /dev/null
done

# --- playable builds ---------------------------------------------------
# Single-file builds: the /play/<id> rewrite serves them directly.
for p in /play/pyro-vs-zombies /play/pyroclasm-inferno /play/pyre-burn-horde \
         /play/space-bunny /play/zombie-fire-survival /play/emberfall \
         /play/cinderline /play/firebreak-night-shift /play/inferno-dead; do
  curl -sf "https://bench.bdx.market$p" > /dev/null
done
# EMBER DEAD is multi-file: it needs the redirect (-L follows it) AND every
# sibling asset must resolve, or the game ships unstyled and dead.
curl -sfL https://bench.bdx.market/play/ember-dead > /dev/null
for a in style.css game.js audio.js; do
  curl -sf "https://bench.bdx.market/play/ember-dead/$a" > /dev/null
done

# --- data integrity ----------------------------------------------------
# The leaderboard must actually carry the audited v2 scores.
curl -sf https://bench.bdx.market/api/leaderboard \
  | grep -q '"methodologyVersion":"v2"' \
  || { echo "FAIL: leaderboard is not methodology v2"; exit 1; }
curl -sf https://bench.bdx.market/api/leaderboard \
  | grep -q '"modelSlug":"space-bunny-free","modelName":"Space Bunny Free","provider":"opencode","bdxScore":91' \
  || { echo "FAIL: Space Bunny Free is not ranked 91 in the live leaderboard"; exit 1; }

echo "DEPLOY OK: $(git rev-parse HEAD)"
