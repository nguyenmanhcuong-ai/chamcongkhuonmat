@echo off
chcp 65001 >nul
echo ========================================
echo  KIEM TRA KET NOI TABLET - PC
echo ========================================
echo.

echo [1] IP may PC (nhap vao tablet):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do echo   %%a
echo.

echo [2] Server port 8000:
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo   CHUA CHAY — can chay: python app.py
) else (
    echo   DANG CHAY OK
)
echo.

echo [3] Firewall rule port 8000:
netsh advfirewall firewall show rule name="ChamCongKhuonMat Port 8000" >nul 2>&1
if errorlevel 1 (
    echo   CHUA MO — chuot phai mo-firewall.bat ^> Run as administrator
) else (
    echo   DA MO OK
    netsh advfirewall firewall show rule name="ChamCongKhuonMat Port 8000" | findstr /i "Enabled Action"
)
echo.

echo [4] Test API tu PC:
powershell -NoProfile -Command "try { $r = Invoke-RestMethod 'http://127.0.0.1:8000/api/ping' -TimeoutSec 3; Write-Host '   OK:' $r.status } catch { Write-Host '   LOI:' $_.Exception.Message -ForegroundColor Red }"
echo.

echo ========================================
echo  TREN TABLET:
echo  1. Cung Wi-Fi voi PC
echo  2. Mo Chrome thu: http://IP-PC:8000/api/ping
echo     ^(thay IP-PC bang so o muc [1]^)
echo  3. Thay OK trong trinh duyet -> mo app, nhap IP, bam Kiem tra
echo ========================================
pause
