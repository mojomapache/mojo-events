# Run this from inside the project folder (E:\MOJOMAPACHE\tech_rnd\mojo-events)
# after placing manifest.txt in that same folder.
#
# Usage:  .\verify-files.ps1

$manifestPath = ".\manifest.txt"
if (-not (Test-Path -LiteralPath $manifestPath)) {
    Write-Host "manifest.txt not found in this folder. Download it and place it here first." -ForegroundColor Red
    exit 1
}

$lines = Get-Content -LiteralPath $manifestPath
$ok = @()
$missing = @()
$mismatched = @()

foreach ($line in $lines) {
    if ($line -match '^([0-9a-fA-F]{64})\s+(.+)$') {
        $expectedHash = $matches[1].ToLower()
        $relPath = $matches[2] -replace '/', '\'

        if (-not (Test-Path -LiteralPath $relPath)) {
            $missing += $relPath
        } else {
            $actualHash = (Get-FileHash -LiteralPath $relPath -Algorithm SHA256).Hash.ToLower()
            if ($actualHash -eq $expectedHash) {
                $ok += $relPath
            } else {
                $mismatched += $relPath
            }
        }
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host " FILE VERIFICATION RESULTS" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "OK (matches expected):  $($ok.Count)" -ForegroundColor Green

if ($missing.Count -gt 0) {
    Write-Host "`nMISSING (not found at all): $($missing.Count)" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

if ($mismatched.Count -gt 0) {
    Write-Host "`nMISMATCHED (exists but wrong content): $($mismatched.Count)" -ForegroundColor Yellow
    $mismatched | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

if ($missing.Count -eq 0 -and $mismatched.Count -eq 0) {
    Write-Host "`nEverything matches. Your local project is fully in sync." -ForegroundColor Green
} else {
    Write-Host "`nSend the MISSING and MISMATCHED file list above back to Claude to get corrected copies of exactly those files." -ForegroundColor Yellow
}
