[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $RootDir 'frontend'
$LogDir = Join-Path $RootDir '.dist'
$OutLog = Join-Path $LogDir 'frontend-autostart.out.log'
$ErrLog = Join-Path $LogDir 'frontend-autostart.err.log'
$ServerOutLog = Join-Path $LogDir 'frontend-server.out.log'
$ServerErrLog = Join-Path $LogDir 'frontend-server.err.log'

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

if (Test-TcpPort -HostName '127.0.0.1' -Port 4173 -TimeoutMs 500) {
    Write-AppLog 'Frontend is already reachable on http://127.0.0.1:4173/.'
    exit 0
}

if (-not (Test-Path $FrontendDir)) {
    Write-AppLog "Frontend folder not found at $FrontendDir" $ErrLog
    exit 1
}

$NpmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $NpmCmd) {
    Write-AppLog 'npm.cmd was not found on PATH. Install Node.js or add it to PATH.' $ErrLog
    exit 1
}

Set-Location $FrontendDir

if (-not (Test-Path (Join-Path $FrontendDir 'node_modules'))) {
    Write-AppLog 'node_modules not found. Running npm install once.'
    & $NpmCmd install >> $OutLog 2>> $ErrLog
    if ($LASTEXITCODE -ne 0) {
        Write-AppLog "npm install failed with exit code $LASTEXITCODE. See $ErrLog." $ErrLog
        exit $LASTEXITCODE
    }
}

Write-AppLog 'Starting React frontend at http://127.0.0.1:4173/.'
$FrontendProcess = Start-Process `
    -FilePath $NpmCmd `
    -ArgumentList 'run dev -- --host 127.0.0.1 --port 4173' `
    -WorkingDirectory $FrontendDir `
    -RedirectStandardOutput $ServerOutLog `
    -RedirectStandardError $ServerErrLog `
    -WindowStyle Hidden `
    -PassThru

Write-AppLog "React frontend process started with PID $($FrontendProcess.Id)."
$FrontendProcess.WaitForExit()
$ExitCode = $FrontendProcess.ExitCode
Write-AppLog "React frontend stopped with exit code $ExitCode." $ErrLog
exit $ExitCode
