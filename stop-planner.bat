@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$pidFile = Join-Path '%~dp0' 'planner.pid'; if (Test-Path $pidFile) { $pid = Get-Content $pidFile | Select-Object -First 1; Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue; Remove-Item $pidFile -Force -ErrorAction SilentlyContinue } else { try { Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/shutdown -Method POST | Out-Null } catch {} }"
