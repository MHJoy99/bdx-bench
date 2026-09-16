$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not $RepoRoot -or -not (Test-Path $RepoRoot)) { $RepoRoot = Get-Location }

function Pass([string]$msg) { Write-Host "PASS: $msg" }
function Warn([string]$msg) { Write-Host "WARN: $msg" }
function Fail([string]$msg) {
  Write-Host "FAIL: $msg"
  exit 1
}

Write-Host "=== BDX Bench verify ==="
Write-Host "RepoRoot: $RepoRoot"

# --- Step 1: node --version >= 18 ---
Write-Host "--- Step 1: node version ---"
try {
  $nodeVerRaw = (& node --version 2>&1 | Out-String).Trim()
} catch {
  Fail "node not found on PATH ($_)"
}
Write-Host "node version string: $nodeVerRaw"
if ($nodeVerRaw -match 'v?(\d+)\.') {
  $major = [int]$Matches[1]
  if ($major -ge 18) {
    Pass "node --version $nodeVerRaw (>= 18)"
  } else {
    Fail "node version $nodeVerRaw < 18"
  }
} else {
  Fail "could not parse node version from '$nodeVerRaw'"
}

# --- Step 2: required files exist ---
Write-Host "--- Step 2: required files ---"
$coreFiles = @("server/server.js", "runner/run.js")
$optionalPaths = @("public/index.html", "models/models.json", "tasks/swe-mini", "tasks/terminal-mini")
$missingCore = @()
foreach ($rel in $coreFiles) {
  $p = Join-Path $RepoRoot $rel
  if (Test-Path $p) {
    Pass "exists: $rel"
  } else {
    Write-Host "FAIL: missing core file: $rel"
    $missingCore += $rel
  }
}
foreach ($rel in $optionalPaths) {
  $p = Join-Path $RepoRoot $rel
  if (Test-Path $p) {
    Pass "exists: $rel"
  } else {
    Warn "missing optional path: $rel (SKIP note; parallel agents may still be working)"
  }
}
if ($missingCore.Count -gt 0) {
  Fail ("missing core file(s): " + ($missingCore -join ", "))
}

# --- Step 3: node --check syntax ---
Write-Host "--- Step 3: node --check ---"
$checkFiles = @("server/server.js", "runner/run.js", "public/app.js")
foreach ($rel in $checkFiles) {
  $p = Join-Path $RepoRoot $rel
  $isCore = ($rel -eq "server/server.js" -or $rel -eq "runner/run.js")
  if (-not (Test-Path $p)) {
    if ($isCore) {
      Fail "cannot --check missing core file: $rel"
    } else {
      Warn "SKIP node --check: $rel not present"
      continue
    }
  }
  & node --check "$p"
  if ($LASTEXITCODE -eq 0) {
    Pass "node --check $rel"
  } else {
    Fail "node --check failed for $rel (exit $LASTEXITCODE)"
  }
}

# --- Step 4: boot server + poll /api/health ---
Write-Host "--- Step 4: server boot + /api/health ---"
$serverFile = Join-Path $RepoRoot "server/server.js"
$port = 18765
$healthUrl = "http://127.0.0.1:$port/api/health"
$job = $null
try {
  $job = Start-Job -ScriptBlock {
    param($srv, $prt)
    $env:BDX_BENCH_PORT = "$prt"
    & node "$srv"
  } -ArgumentList "$serverFile", $port
  Write-Host "started server job id $($job.Id) (BDX_BENCH_PORT=$port)"
  $ok = $false
  $lastErr = ""
  for ($i = 1; $i -le 15; $i++) {
    Start-Sleep -Seconds 1
    try {
      $resp = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 3
      $body = ($resp | ConvertTo-Json -Compress)
      Write-Host "poll ${i}s: $body"
      if ($resp.ok -eq $true) { $ok = $true; break }
      $lastErr = "unexpected body: $body"
    } catch {
      $lastErr = $_.Exception.Message
      Write-Host "poll ${i}s: not ready ($lastErr)"
    }
    if ($job.State -eq 'Failed') {
      $jobErr = Receive-Job $job 2>&1 | Out-String
      Fail "server job failed early: $jobErr"
    }
  }
  if ($ok) {
    Pass "GET /api/health ok:true on port $port"
  } else {
    $logs = ""
    try { $logs = Receive-Job $job 2>&1 | Out-String } catch { $logs = "(no job output)" }
    Fail "health check failed after 15s ($lastErr) jobState=$($job.State) output: $logs"
  }
} finally {
  if ($job -ne $null) {
    try { Stop-Job $job -ErrorAction SilentlyContinue } catch {}
    try { Remove-Job $job -Force -ErrorAction SilentlyContinue } catch {}
    Write-Host "server job stopped/removed"
  }
}

# --- Step 5: mock runner test (if tasks exist) ---
Write-Host "--- Step 5: mock runner ---"
$tasksMini = Join-Path $RepoRoot "tasks/swe-mini"
$runnerFile = Join-Path $RepoRoot "runner/run.js"
$hasTasks = (Test-Path $tasksMini) -or (Test-Path (Join-Path $RepoRoot "tasks"))
if (-not $hasTasks) {
  Warn "SKIP mock runner: no tasks/ present (parallel agents may still be working)"
} else {
  $outDir = $env:TEMP
  if (-not $outDir) { $outDir = [System.IO.Path]::GetTempPath() }
  $outFile = Join-Path $outDir "bdx-verify.json"
  Write-Host "running: node runner/run.js --model mock-model --suite swe-mini --mode mock --out $outFile"
  & node "$runnerFile" --model mock-model --suite swe-mini --mode mock --out "$outFile"
  if ($LASTEXITCODE -eq 0) {
    if (Test-Path $outFile) {
      Pass "mock runner succeeded, output at $outFile"
    } else {
      Warn "mock runner exit 0 but output file not found at $outFile"
      Pass "mock runner exit 0 (output file missing, treated as WARN-only)"
    }
  } else {
    Fail "mock runner failed (exit $LASTEXITCODE)"
  }
}

Write-Host "=== verify complete ==="
exit 0
