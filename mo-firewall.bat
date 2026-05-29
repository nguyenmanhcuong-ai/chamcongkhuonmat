@echo off
chcp 65001 >nul
echo ========================================
echo  MO PORT 8000 — CAN QUYEN ADMIN
echo ========================================
echo.
echo Neu khong thay cua so UAC (Yes/Co), hay:
echo   Chuot phai file nay ^> Run as administrator
echo.

net session >nul 2>&1
if %errorlevel%==0 (
    powershell -ExecutionPolicy Bypass -File "%~dp0mo-firewall.ps1"
) else (
    powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -Wait -ArgumentList '-ExecutionPolicy Bypass -File \"\"%~dp0mo-firewall.ps1\"\"'"
)

echo.
echo Chay kiem-tra-mang.bat de xem da OK chua.
pause
