[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

foreach ($TaskName in @('InternshipPrototypeBackend', 'InternshipPrototypeFrontend')) {
    $Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($Task) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "Removed task: $TaskName"
    } else {
        Write-Host "Task not installed: $TaskName"
    }
}
