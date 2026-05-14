[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir 'backend'
$PythonExe = Join-Path $RootDir '.venv\Scripts\python.exe'
$ManagePy = Join-Path $BackendDir 'manage.py'
$LogDir = Join-Path $RootDir '.dist'
$OutLog = Join-Path $LogDir 'backend-autostart.out.log'
$ErrLog = Join-Path $LogDir 'backend-autostart.err.log'
$ServerOutLog = Join-Path $LogDir 'backend-server.out.log'
$ServerErrLog = Join-Path $LogDir 'backend-server.err.log'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-AppLog {
    param(
        [Parameter(Mandatory = $true)][string]$Message,
        [string]$Path = $OutLog
    )

    $Line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Write-Host $Line
    Add-Content -Path $Path -Value $Line
}

function Get-DotEnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$DefaultValue
    )

    $EnvFile = Join-Path $RootDir '.env'
    if (-not (Test-Path $EnvFile)) {
        return $DefaultValue
    }

    foreach ($Line in Get-Content -Path $EnvFile) {
        if ($Line -match "^\s*$([regex]::Escape($Name))\s*=\s*(.*)\s*$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }

    return $DefaultValue
}

function Test-TcpPort {
    param(
        [Parameter(Mandatory = $true)][string]$HostName,
        [Parameter(Mandatory = $true)][int]$Port,
        [int]$TimeoutMs = 1000
    )

    $Client = [System.Net.Sockets.TcpClient]::new()
    try {
        $Async = $Client.BeginConnect($HostName, $Port, $null, $null)
        if (-not $Async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
            return $false
        }

        $Client.EndConnect($Async)
        return $true
    } catch {
        return $false
    } finally {
        $Client.Close()
        $Client.Dispose()
    }
}

function Test-BackendHealth {
    try {
        $Response = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health/' -TimeoutSec 2
        return $Response.status -eq 'ok'
    } catch {
        return $false
    }
}

if (-not (Test-Path $PythonExe)) {
    Write-AppLog "Python virtual environment not found at $PythonExe" $ErrLog
    exit 1
}

if (-not (Test-Path $ManagePy)) {
    Write-AppLog "Django manage.py not found at $ManagePy" $ErrLog
    exit 1
}

if (Test-BackendHealth) {
    Write-AppLog 'Backend is already healthy on http://127.0.0.1:8000/api/health/.'
    exit 0
}

if (Test-TcpPort -HostName '127.0.0.1' -Port 8000 -TimeoutMs 500) {
    Write-AppLog 'Port 8000 is already in use, but the backend health check did not pass. Leaving it unchanged.' $ErrLog
    exit 1
}

$DbHost = Get-DotEnvValue -Name 'POSTGRES_HOST' -DefaultValue '127.0.0.1'
$DbPort = [int](Get-DotEnvValue -Name 'POSTGRES_PORT' -DefaultValue '5432')

$PostgresService = Get-Service -Name 'postgresql*' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($PostgresService -and $PostgresService.Status -ne 'Running') {
    try {
        Write-AppLog "Starting PostgreSQL service $($PostgresService.Name)."
        Start-Service -Name $PostgresService.Name
    } catch {
        Write-AppLog "Could not start PostgreSQL service $($PostgresService.Name): $($_.Exception.Message)" $ErrLog
    }
}

Write-AppLog "Waiting for PostgreSQL at ${DbHost}:${DbPort}."
$DatabaseReady = $false
for ($Attempt = 1; $Attempt -le 90; $Attempt++) {
    if (Test-TcpPort -HostName $DbHost -Port $DbPort -TimeoutMs 1000) {
        $DatabaseReady = $true
        break
    }

    Start-Sleep -Seconds 1
}

if (-not $DatabaseReady) {
    Write-AppLog "PostgreSQL was not reachable at ${DbHost}:${DbPort} after 90 seconds." $ErrLog
    exit 1
}

Set-Location $BackendDir
$env:PYTHONUTF8 = '1'
$env:PYTHONUNBUFFERED = '1'

Write-AppLog 'Applying Django migrations before startup.'
& $PythonExe $ManagePy migrate --noinput >> $OutLog 2>> $ErrLog
if ($LASTEXITCODE -ne 0) {
    Write-AppLog "Django migrations failed with exit code $LASTEXITCODE. See $ErrLog." $ErrLog
    exit $LASTEXITCODE
}

Write-AppLog 'Starting Django backend at http://127.0.0.1:8000/.'
$RunserverArgs = "`"$ManagePy`" runserver 127.0.0.1:8000 --noreload"
$ServerProcess = Start-Process `
    -FilePath $PythonExe `
    -ArgumentList $RunserverArgs `
    -WorkingDirectory $BackendDir `
    -RedirectStandardOutput $ServerOutLog `
    -RedirectStandardError $ServerErrLog `
    -WindowStyle Hidden `
    -PassThru

Write-AppLog "Django backend process started with PID $($ServerProcess.Id)."
$ServerProcess.WaitForExit()
$ExitCode = $ServerProcess.ExitCode
Write-AppLog "Django backend stopped with exit code $ExitCode." $ErrLog
exit $ExitCode
