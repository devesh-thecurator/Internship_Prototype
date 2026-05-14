[CmdletBinding()]
param()

$ErrorActionPreference = 'SilentlyContinue'

function Test-Backend {
    try {
        $Response = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health/' -TimeoutSec 2
        return $Response.status -eq 'ok'
    } catch {
        return $false
    }
}

function Test-Frontend {
    try {
        $Response = Invoke-WebRequest -Uri 'http://127.0.0.1:4173/' -UseBasicParsing -TimeoutSec 2
        return $Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500
    } catch {
        return $false
    }
}

$BackendStatus = if (Test-Backend) { 'reachable' } else { 'not reachable' }
$FrontendStatus = if (Test-Frontend) { 'reachable' } else { 'not reachable' }

Write-Host "Backend:  $BackendStatus  http://127.0.0.1:8000/api/health/"
Write-Host "Frontend: $FrontendStatus http://127.0.0.1:4173/"

foreach ($TaskName in @('InternshipPrototypeBackend', 'InternshipPrototypeFrontend')) {
    $Task = Get-ScheduledTask -TaskName $TaskName
    if ($Task) {
        Write-Host "Task:     $TaskName $($Task.State)"
    } else {
        Write-Host "Task:     $TaskName not installed"
    }
}
