param(
    [string]$Version = "v1.0.0"
)

# 直近 Event_ID 取得
$EventId = git config mocka.eventId
if (-not $EventId) {
    Write-Host "ERROR: mocka.eventId not set. Commit with EV-YYYYMMDD-NNNN first."
    exit 1
}

$Date = Get-Date -Format "yyyy-MM-dd"

# ステージ済みの .py ファイル取得
$Files = git diff --cached --name-only | Where-Object { $_ -like "*.py" }

foreach ($File in $Files) {

    if (-not (Test-Path $File)) { continue }

    $Content = Get-Content $File -Raw

    $Header = "# MoCKA-REV: $Version $Date`n# Event-ID: $EventId`n# Purpose: (see commit message)`n"

    # 既存ヘッダがあれば置換
    if ($Content -match "^# MoCKA-REV:") {
        $Content = $Content -replace "(?s)^# MoCKA-REV:.*?\n# Purpose:.*?\n", $Header
    }
    else {
        $Content = $Header + $Content
    }

    Set-Content $File $Content -Encoding UTF8
    git add $File
}

Write-Host "MoCKA-REV header updated for staged .py files."
