@echo off
title Sales and Warehouse Management System (Full Stack)
echo ======================================================================
echo    KHOI DONG HE THONG SALES VA WAREHOUSE (FRONTEND + BACKEND)
echo ======================================================================
echo.

echo [1/2] Dang khoi dong Backend FastAPI (Port 8000)...
start "Backend API (Port 8000)" cmd /k "cd /d C:\Users\HP\Downloads\quang\Sales-Warehouse-System\backend && python main.py"

echo [2/2] Dang khoi dong Frontend Vite (Port 5173)...
start "Frontend Web (Port 5173)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ======================================================================
echo   HE THONG DA DUOC GOI KHOI CHAY!
echo.
echo   [+] Frontend Web : http://localhost:5173/
echo   [+] Backend API  : http://localhost:8000/
echo   [+] Swagger Docs : http://localhost:8000/docs
echo ======================================================================
echo.
pause
