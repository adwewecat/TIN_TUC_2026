@echo off
chcp 65001 >nul
title CỔNG TIN TỨC 2026 - MÁY CHỦ BẢN TIN AUDIO 48H
color 0A

echo ========================================================
echo       🎙️ KHỞI ĐỘNG HỆ THỐNG TIN TỨC 2026 ^& AUDIO 48H
echo ========================================================
echo.

cd /d "%~dp0"

:: Kiểm tra cài đặt Node.js trên máy tính
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Không tìm thấy Node.js trên máy tính!
    echo Vui lòng tải và cài đặt Node.js từ https://nodejs.org/ rồi thử lại.
    pause
    exit /b 1
)

:: Tự động kiểm tra và cài đặt thư viện nếu chưa có node_modules
if not exist "node_modules\" (
    echo [CÀI ĐẶT] Đang tự động tải các thư viện cần thiết...
    call npm install
    echo.
)

echo [1/2] Đang tự động mở trình duyệt web...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo [2/2] Đang khởi động máy chủ tại http://localhost:3000 ...
echo 👉 Bạn có thể đóng cửa sổ này hoặc nhấn Ctrl + C để dừng server.
echo ========================================================
echo.

node server/index.js

pause
