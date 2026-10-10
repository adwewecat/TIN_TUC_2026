@echo off
chcp 65001 >nul
title KIEM THU TU DONG - TIN TUC 2026

echo ========================================================
echo     CHAY BO KIEM THU TU DONG (DIEN BIEN MOI VA AUDIO)
echo ========================================================
echo.

cd /d "%~dp0"

node server/test.js

echo.
echo ========================================================
echo Da hoan tat kiem thu. Nhan phim bat ky de dong cua so...
pause >nul
