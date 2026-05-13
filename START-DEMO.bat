@echo off
title Uzimatek MVP Demo
color 0A

echo.
echo  ██╗   ██╗███████╗██╗███╗   ███╗ █████╗ ████████╗███████╗██╗  ██╗
echo  ██║   ██║╚══███╔╝██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██║ ██╔╝
echo  ██║   ██║  ███╔╝ ██║██╔████╔██║███████║   ██║   █████╗  █████╔╝
echo  ██║   ██║ ███╔╝  ██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  ██╔═██╗
echo  ╚██████╔╝███████╗██║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗██║  ██╗
echo   ╚═════╝ ╚══════╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
echo.
echo  Health Kenya - AI Revenue Cycle Management
echo  ============================================
echo.

echo [1/4] Starting Docker services (PostgreSQL + Redis)...
docker compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Docker failed. Make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo [2/4] Installing dependencies...
call pnpm install --frozen-lockfile
if %errorlevel% neq 0 (
    echo ERROR: pnpm install failed.
    pause
    exit /b 1
)

echo [3/4] Setting up database...
call pnpm db:push
call pnpm db:seed

echo [4/4] Starting development servers...
echo.
echo  Frontend: http://localhost:3000
echo  API:      http://localhost:3001
echo  Health:   http://localhost:3001/health
echo.
echo  Demo login: wanjiku@aiclitein.or.ke / Demo@2026!
echo.

start "Uzimatek Frontend" cmd /k "pnpm --filter @uzimatek/web dev"
timeout /t 3 /nobreak > nul
start "Uzimatek API" cmd /k "pnpm --filter @uzimatek/api dev"

echo Servers starting... Opening browser in 8 seconds...
timeout /t 8 /nobreak > nul
start http://localhost:3000
