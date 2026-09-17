#!/usr/bin/env bash
# BDX Bench pull-deploy — run as root on VPS
# App: /srv/bot-storage/sites/bench.bdx.market (second drive, 36G free)
# Never touches other vhosts. Preserves data/*.json + results/run-*.json (gitignored).
set -euo pipefail
APP=/srv/bot-storage/sites/bench.bdx.market
cd "$APP"
git rev-parse HEAD > /tmp/bench-prev-sha.txt || true
cat /tmp/bench-prev-sha.txt || true
git fetch origin main
git status --short --branch
git pull --ff-only origin main
node --check server/server.js
node --check runner/run.js || true
chown -R bench:bench "$APP"
systemctl restart bdx-bench
for i in $(seq 1 15); do curl -sf http://127.0.0.1:8766/api/health && break || sleep 1; done
curl -sf https://bench.bdx.market/api/health
curl -s https://bench.bdx.market/api/leaderboard | head -c 300; echo
git rev-parse HEAD
