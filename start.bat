@echo off
title Agapay - Starting...
echo.
echo  ================================================
echo   Agapay ^| eGovPH - MSME Regulatory Navigator
echo  ================================================
echo.

:: ── Backend ──────────────────────────────────────────────────────────────────
echo [1/2] Starting FastAPI backend on http://localhost:8000 ...
start "Agapay Backend" cmd /k "cd /d %~dp0backend && call .venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Small delay so the backend gets a head start
timeout /t 3 /nobreak >nul

:: ── Frontend ─────────────────────────────────────────────────────────────────
echo [2/2] Starting Vite frontend on http://localhost:5173 ...
start "Agapay Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo  Both servers are starting in separate windows.
echo  Backend  ^> http://localhost:8000
echo  Frontend ^> http://localhost:5173
echo.
echo  Run stop.bat to shut everything down.
echo.
pause
