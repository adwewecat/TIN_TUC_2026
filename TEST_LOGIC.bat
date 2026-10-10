@echo off
chcp 65001 >nul
title KIỂM THỬ TỰ ĐỘNG - TIN TỨC 2026
color 0B

echo ========================================================
echo     🧪 CHẠY BỘ KIỂM THỬ TỰ ĐỘNG (DIỄN BIẾN MỚI ^& AUDIO)
echo ========================================================
echo.

cd /d "%~dp0"

node server/test.js

echo.
echo ========================================================
echo Đã hoàn tất kiểm thử. Nhấn phím bất kỳ để đóng cửa sổ...
pause >nul
