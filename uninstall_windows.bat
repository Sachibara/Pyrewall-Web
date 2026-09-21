@echo off
setlocal
cd /d "%~dp0"

net session >nul 2>&1
if not "%errorlevel%"=="0" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

schtasks /End /TN "PyreWall Web Firewall" >nul 2>&1
schtasks /Delete /TN "PyreWall Web Firewall" /F >nul 2>&1
if exist "%~dp0start_production.bat" del /q "%~dp0start_production.bat"

echo PyreWall Web automatic deployment has been removed.
echo Your source code and databases were not deleted.
pause
