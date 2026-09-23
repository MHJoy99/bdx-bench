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
curl -sf https://bench.bdx.market/
curl -sf https://bench.bdx.market/play/pyro-vs-zombies > /dev/null
curl -sf https://bench.bdx.market/play/pyroclasm-inferno > /dev/null
curl -sf https://bench.bdx.market/play/pyre-burn-horde > /dev/null
curl -sf https://bench.bdx.market/play/space-bunny > /dev/null
curl -sf https://bench.bdx.market/play/emberfall > /dev/null
curl -sf https://bench.bdx.market/play/cinderline > /dev/null
curl -sf https://bench.bdx.market/play/firebreak-night-shift > /dev/null
echo "DEPLOY OK: $(git rev-parse HEAD)"
