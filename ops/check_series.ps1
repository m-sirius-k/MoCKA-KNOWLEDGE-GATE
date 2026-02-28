param([string]$Base = "C:\Users\sirok")

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Fail([string]$m){ Write-Host $m; exit 1 }
function Pass([string]$m){ Write-Host $m }
function Lower([string]$p){ return $p.ToLowerInvariant() }

$kg = Join-Path $Base "mocka-knowledge-gate"
$pb = Join-Path $Base "mocka-pythonbridge"

if(-not (Test-Path $kg)){ Fail "missing repo: mocka-knowledge-gate" }
if(-not (Test-Path $pb)){ Fail "missing repo: mocka-pythonbridge" }

# Exact allowlist for env files
$allowEnv = @(
  (Join-Path $kg "gateway\.env"),
  (Join-Path $kg "gateway\.env.example"),
  (Join-Path $pb "mocka_orchestrator\.env"),
  (Join-Path $pb "browser-use-api\.env"),
  (Join-Path $pb "browser-use-poc\.env.poc")
  (Join-Path $pb "series.env")
) | ForEach-Object { Lower $_ } | Sort-Object -Unique

$foundEnv = @()
$foundEnv += @(Get-ChildItem -Path $kg -Recurse -Force -File -Filter ".env*" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
$foundEnv += @(Get-ChildItem -Path $pb -Recurse -Force -File -Filter ".env*" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
$foundEnv = $foundEnv | ForEach-Object { Lower $_ } | Sort-Object -Unique

$badEnv = @()
foreach($p in $foundEnv){
  if($allowEnv -notcontains $p){ $badEnv += $p }
}
if($badEnv.Count -gt 0){
  Write-Host "forbidden env files:"
  $badEnv | ForEach-Object { Write-Host $_ }
  Fail "env gate failed"
}
Pass "OK: env allowlist"

# Exact allowlist for venv dirs (pythonbridge)
$allowVenv = @(
  (Join-Path $pb "browser-use-api\.venv"),
  (Join-Path $pb "browser-use-poc\.venv"),
  (Join-Path $pb "mocka_orchestrator\.venv")
) | ForEach-Object { Lower $_ } | Sort-Object -Unique

$foundVenv = @(
  Get-ChildItem -Path $pb -Recurse -Force -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -in @(".venv","venv","env") -or $_.Name -like ".venv*" -or $_.Name -like "*.venv" } |
    Select-Object -ExpandProperty FullName
) | ForEach-Object { Lower $_ } | Sort-Object -Unique

$badVenv = @()
foreach($d in $foundVenv){
  if($allowVenv -notcontains $d){ $badVenv += $d }
}
if($badVenv.Count -gt 0){
  Write-Host "forbidden venv dirs:"
  $badVenv | ForEach-Object { Write-Host $_ }
  Fail "venv gate failed"
}
Pass "OK: venv allowlist"

Pass "DONE: series gate passed"
exit 0
