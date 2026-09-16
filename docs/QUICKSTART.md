# QUICKSTART — BDX Bench in 5 Minutes

Zero-deps local benchmark: queue a mock run in the browser, then run one live task from the CLI.

## 0. Install (nothing)

No `npm install`. You need a working `node` only.

```powershell
node --version
```

## 1. Set the API key (live mode only)

Mock mode needs no key. For live mode, set it — never echo or commit it:

```powershell
$env:BDX_AI_API_KEY = "your-key-here"
# Do NOT run: echo $env:BDX_AI_API_KEY
```

Optional gateway override (default `https://gpt.bdx.market/v1`):

```powershell
$env:BDX_BASE_URL = "https://gpt.bdx.market/v1"
```

## 2. Start the server

Default port `8765`, override with `BDX_BENCH_PORT`:

```powershell
$env:BDX_BENCH_PORT = "8765"
node server/index.js  # see server source for exact entrypoint
```

Check health:

```powershell
curl http://127.0.0.1:8765/api/health
```

## 3. Open the browser

Go to:

```
http://127.0.0.1:8765
```

## 4. Queue a mock run (no key, no cost)

- In the GUI, pick a model + suite (`swe-mini` or `terminal-mini`).
- Choose mode `mock`, submit.
- Equivalent API call:
  ```powershell
  curl -X POST http://127.0.0.1:8765/api/runs `
    -H "Content-Type: application/json" `
    -d '{"model":"demo-model","suite":"swe-mini","mode":"mock"}'
  ```
- Watch it in `GET /api/runs/:id` or the GUI run list.

## 5. Run one live CLI task (uses key + quota)

Single-suite live run, output to a file:

```powershell
node runner/run.js --model <id> --suite swe-mini --mode live --out ./out.json
```

Replace `<id>` with a model id from `GET /api/models`. Start with `swe-mini` (faster to eyeball). Check `./out.json` for per-task pass/fail.

Terminal-suite variant:

```powershell
node runner/run.js --model <id> --suite terminal-mini --mode mock --out ./out-mock.json
```

Swap `--mode live` when you are ready to spend quota.

## 6. View the leaderboard

- GUI: leaderboard view in the browser.
- API:
  ```powershell
  curl http://127.0.0.1:8765/api/leaderboard
  ```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Server won't bind | Another process on `8765`? Set `$env:BDX_BENCH_PORT` to a free port and use that port in URLs. |
| `401` / gateway error in live mode | Key missing or wrong. Re-set `$env:BDX_AI_API_KEY`; never echo it to terminal logs. |
| Empty leaderboard | No finished runs yet — queue a mock run first. |
| Docs vs code disagree | Code wins (v0.1). Check `server/`, `runner/run.js`, `suites/`. |
