# Docker image regression smoke tests (Phase 4 test matrix)
# ใช้หลัง docker compose up -d — ต้องมี Docker daemon + containers รันอยู่
# ตัวอย่าง: pwsh -File scripts/docker-regression-smoke.ps1

$ErrorActionPreference = "Stop"

$FrontendBase = if ($env:SMOKE_FRONTEND_URL) { $env:SMOKE_FRONTEND_URL } else { "http://localhost:8404" }
$BackendBase = if ($env:SMOKE_BACKEND_URL) { $env:SMOKE_BACKEND_URL } else { "http://localhost:8405/api" }

function Assert-Status {
    param([string]$Name, [int]$Expected, [int]$Actual)
    if ($Actual -ne $Expected) {
        throw "$Name expected HTTP $Expected got $Actual"
    }
    Write-Host "[PASS] $Name ($Actual)"
}

Write-Host "=== TC-FE-01 GET /login ==="
$r = Invoke-WebRequest -Uri "$FrontendBase/login" -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
if ($r.StatusCode -eq 200) { Write-Host "[PASS] TC-FE-01 ($($r.StatusCode))" }
else { throw "TC-FE-01 expected 200 got $($r.StatusCode)" }

Write-Host "=== TC-FE-03 GET /dashboard (no auth) ==="
try {
    $r = Invoke-WebRequest -Uri "$FrontendBase/dashboard" -UseBasicParsing -MaximumRedirection 0
    if ($r.StatusCode -ge 300 -and $r.StatusCode -lt 400) {
        Write-Host "[PASS] TC-FE-03 redirect $($r.StatusCode)"
    } else {
        throw "TC-FE-03 expected redirect got $($r.StatusCode)"
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ge 300) {
        Write-Host "[PASS] TC-FE-03 redirect"
    } else { throw }
}

Write-Host "=== TC-FE-05 GET /fonts/Sarabun-Regular.ttf ==="
$r = Invoke-WebRequest -Uri "$FrontendBase/fonts/Sarabun-Regular.ttf" -UseBasicParsing
Assert-Status "TC-FE-05" 200 $r.StatusCode

Write-Host "=== TC-BE-01 backend reachable ==="
try {
    $r = Invoke-WebRequest -Uri "$BackendBase" -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "[PASS] TC-BE-01 backend responded $($r.StatusCode)"
} catch {
    if ($_.Exception.Response) {
        Write-Host "[PASS] TC-BE-01 backend responded $($_.Exception.Response.StatusCode.value__)"
    } else {
        throw "TC-BE-01 backend not reachable: $_"
    }
}

Write-Host ""
Write-Host "Smoke tests passed. Manual: login (TC-FE-02), PDF (TC-BE-02/INT-01), ci-runner parity (TC-CI-03)."
