@echo off
chcp 65001 >nul
title TIN TUC 2026 - MAY CHU AUDIO 48H

echo ========================================================
echo       KHOI DONG HE THONG TIN TUC 2026 VA AUDIO 48H
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Kiem tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js tren may tinh!
    echo Vui long cai dat Node.js tu https://nodejs.org/ roi thu lai.
    pause
    exit /b 1
)

:: 2. Giai phong cong 3000 neu dang bi chiem dung
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>nul

:: 3. Tu dong cai thu vien neu thieu
if not exist "node_modules\" (
    echo [CAI DAT] Dang tai thu vien can thiet...
    call npm install
    echo.
)

:: 4. Mo trinh duyet web
start http://localhost:3000

echo ========================================================
echo [OK] Dang mo trinh duyet: http://localhost:3000
echo Nhan Ctrl + C hoac dong cua so de dung may chu.
echo ========================================================
echo.

node server/index.js

pause
