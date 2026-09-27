@echo off
echo ===================================================
echo Starting BugRadar AI System (Backend + Frontend)
echo ===================================================

echo Starting FastAPI Backend on http://localhost:8000 ...
start "BugRadar Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Starting React + Vite Frontend on http://localhost:5173 ...
start "BugRadar Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ===================================================
echo BugRadar is launching!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000/docs
echo ===================================================
