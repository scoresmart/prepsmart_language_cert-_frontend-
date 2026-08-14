# Restarts the realtime bridge, killing any stale instance first.
#
# `pkill` does not reach node processes from Git Bash on Windows, so a stale
# bridge silently keeps port 8787 and the new one dies with EADDRINUSE — which
# looks exactly like "my code change did nothing".
#
#   powershell -ExecutionPolicy Bypass -File server/restart-bridge.ps1 [-LogPath ...] [-Debug1]

param(
  [string]$LogPath = "$env:TEMP\realtime-bridge.log",
  [switch]$Debug1
)

Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*realtime-bridge*' } |
  ForEach-Object {
    Write-Host "stopping stale bridge PID $($_.ProcessId)"
    Stop-Process -Id $_.ProcessId -Force
  }

$deadline = (Get-Date).AddSeconds(10)
while ((Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) {
  Start-Sleep -Milliseconds 250
}
if (Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue) {
  Write-Error "port 8787 is still held; not starting a second bridge"
  exit 1
}

if ($Debug1) { $env:REALTIME_DEBUG = "1" } else { Remove-Item Env:REALTIME_DEBUG -ErrorAction SilentlyContinue }

Start-Process -FilePath "node" -ArgumentList "server/realtime-bridge.mjs" `
  -RedirectStandardOutput $LogPath -RedirectStandardError "$LogPath.err" `
  -WindowStyle Hidden

Start-Sleep -Seconds 3
try {
  $h = Invoke-RestMethod -Uri "http://localhost:8787/health" -TimeoutSec 5
  Write-Host "bridge up: model=$($h.model) voice=$($h.voice) log=$LogPath"
} catch {
  Write-Error "bridge did not come up. See $LogPath and $LogPath.err"
  exit 1
}
