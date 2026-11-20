$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot
$serverDir = Join-Path $projectRoot "server"
$clientDir = Join-Path $projectRoot "client"

function Test-HttpEndpoint {
    param([string] $Url)

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
    }
    catch {
        return $false
    }
}

Write-Host "Starting BloodLink..." -ForegroundColor Cyan

Push-Location $serverDir
try {
    npm run db:start
}
finally {
    Pop-Location
}

if (-not (Test-HttpEndpoint "http://localhost:4000/api/dashboard/summary")) {
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location `"$serverDir`"; npm run dev"
    )
}

if (-not (Test-HttpEndpoint "http://localhost:3000")) {
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location `"$clientDir`"; npm run dev"
    )
}

$deadline = (Get-Date).AddSeconds(30)
$apiReady = $false
$clientReady = $false

while ((Get-Date) -lt $deadline -and (-not $apiReady -or -not $clientReady)) {
    if (-not $apiReady) {
        $apiReady = Test-HttpEndpoint "http://localhost:4000/api/dashboard/summary"
    }
    if (-not $clientReady) {
        $clientReady = Test-HttpEndpoint "http://localhost:3000"
    }
    if (-not $apiReady -or -not $clientReady) {
        Start-Sleep -Seconds 1
    }
}

if ($apiReady -and $clientReady) {
    Write-Host "BloodLink is ready." -ForegroundColor Green
    Start-Process "http://localhost:3000"
}
else {
    if (-not $apiReady) {
        Write-Host "API did not start on http://localhost:4000" -ForegroundColor Red
    }
    if (-not $clientReady) {
        Write-Host "Client did not start on http://localhost:3000" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press Enter to close this window."
Read-Host
