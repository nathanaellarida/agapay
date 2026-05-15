@echo off
title Agapay - Stopping...
echo.
echo  ================================================
echo   Agapay ^| eGovPH - Stopping all servers...
echo  ================================================
echo.

:: Kill the uvicorn process (backend)
echo [1/2] Stopping backend (uvicorn)...
taskkill /FI "WINDOWTITLE eq Agapay Backend" /T /F >nul 2>&1
:: Also kill any stray uvicorn python processes on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /T /F >nul 2>&1
)

:: Kill the Vite dev server (frontend)
echo [2/2] Stopping frontend (vite)...
taskkill /FI "WINDOWTITLE eq Agapay Frontend" /T /F >nul 2>&1
:: Also kill any stray node processes on port 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /T /F >nul 2>&1
)

echo.
echo  All Agapay servers stopped.
echo.
pause
