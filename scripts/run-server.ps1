param(
  [int]$Port = 8765
)

# Env override: BDX_BENCH_PORT takes precedence if set
if ($env:BDX_BENCH_PORT) {
  $Port = [int]$env:BDX_BENCH_PORT
}

# Check node exists
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Write-Error "node not found on PATH. Please install Node.js (v25) and retry."
  exit 1
}

$url = "http://127.0.0.1:$Port/"
Write-Host $url

# Run server in foreground (for managed background job use, run this script as the job command)
node server/server.js
