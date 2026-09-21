@echo off
setlocal EnableExtensions
cd /d "%~dp0"

net session >nul 2>&1
if not "%errorlevel%"=="0" (
  echo PyreWall Web deployment requires Administrator privileges.
  echo Requesting elevation...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

where python >nul 2>&1
if not "%errorlevel%"=="0" (
  echo [ERROR] Python was not found in PATH.
  echo Install Python 3 and enable "Add Python to PATH", then run this installer again.
  pause
  exit /b 1
)

for /f "delims=" %%P in ('where python') do (
  set "PYTHON_EXE=%%P"
  goto :python_found
)

:python_found
echo.
echo [1/4] Installing PyreWall Web dependencies...
"%PYTHON_EXE%" -m pip install --upgrade pip
if errorlevel 1 goto :fail
"%PYTHON_EXE%" -m pip install -r requirements-web.txt
if errorlevel 1 goto :fail

echo.
echo [2/4] Creating production launcher...
(
  echo @echo off
  echo cd /d "%~dp0"
  echo set "PYREWALL_WEB_HOST=127.0.0.1"
  echo set "PYREWALL_WEB_PORT=8765"
  echo "%PYTHON_EXE%" "%~dp0production_server.py"
) > "%~dp0start_production.bat"

echo.
echo [3/4] Registering Windows scheduled task...
schtasks /Delete /TN "PyreWall Web Firewall" /F >nul 2>&1
schtasks /Create /TN "PyreWall Web Firewall" /TR ""%~dp0start_production.bat"" /SC ONLOGON /RL HIGHEST /F
if errorlevel 1 goto :fail

echo.
echo [4/4] Starting PyreWall Web Firewall...
schtasks /Run /TN "PyreWall Web Firewall" >nul 2>&1

timeout /t 3 /nobreak >nul
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 http://127.0.0.1:8765/healthz; if($r.StatusCode -eq 200){exit 0}else{exit 1} } catch { exit 1 }"
if errorlevel 1 (
  echo.
  echo PyreWall was installed, but the health check did not respond yet.
  echo Open http://127.0.0.1:8765 manually after a few seconds.
) else (
  echo.
  echo ============================================
  echo PyreWall Web Firewall is DEPLOYED locally.
  echo URL: http://127.0.0.1:8765
  echo It will start automatically when you log in.
  echo ============================================
)

echo.
echo Keep this repository folder in its current location.
echo Moving or deleting it will break the scheduled deployment.
pause
exit /b 0

:fail
echo.
echo [ERROR] Deployment failed. Review the messages above.
pause
exit /b 1
