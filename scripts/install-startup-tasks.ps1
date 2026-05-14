[CmdletBinding()]
param(
    [switch]$StartNow
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$PowerShellExe = (Get-Command powershell.exe).Source
$CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -Hidden `
    -MultipleInstances IgnoreNew `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable

$Principal = New-ScheduledTaskPrincipal `
    -UserId $CurrentUser `
    -LogonType Interactive `
    -RunLevel Limited

function Register-AppTask {
    param(
        [Parameter(Mandatory = $true)][string]$TaskName,
        [Parameter(Mandatory = $true)][string]$ScriptPath,
        [Parameter(Mandatory = $true)][string]$Description
    )

    $Action = New-ScheduledTaskAction `
        -Execute $PowerShellExe `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`"" `
        -WorkingDirectory $RootDir

    $Trigger = New-ScheduledTaskTrigger -AtLogOn -User $CurrentUser

    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Principal $Principal `
        -Settings $Settings `
        -Description $Description `
        -Force | Out-Null

    Write-Host "Registered task: $TaskName"
}

Register-AppTask `
    -TaskName 'InternshipPrototypeBackend' `
    -ScriptPath (Join-Path $ScriptDir 'start-backend.ps1') `
    -Description 'Starts the Internship Prototype Django backend at user logon.'

Register-AppTask `
    -TaskName 'InternshipPrototypeFrontend' `
    -ScriptPath (Join-Path $ScriptDir 'start-frontend.ps1') `
    -Description 'Starts the Internship Prototype React frontend at user logon.'

if ($StartNow) {
    Start-ScheduledTask -TaskName 'InternshipPrototypeBackend'
    Start-ScheduledTask -TaskName 'InternshipPrototypeFrontend'
    Write-Host 'Startup tasks started for this session.'
}
