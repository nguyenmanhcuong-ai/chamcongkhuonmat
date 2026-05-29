@echo off
chcp 65001 >nul
echo.
echo ============================================================
echo   CHAM CONG TABLET — KIEM TRA MANG
echo ============================================================
echo.

echo [A] IP may PC (nhap vao tablet / Chrome):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do echo      %%a
echo.

echo [B] Loai mang PC:
powershell -NoProfile -Command "$p=Get-NetConnectionProfile|Select-Object -First 1; Write-Host ('     ' + $p.Name + ' — ' + $p.NetworkCategory)"
echo.

echo [C] PC co Wi-Fi khong:
powershell -NoProfile -Command "$w=Get-NetAdapter|Where-Object {$_.Status -eq 'Up' -and $_.Name -match 'Wi-Fi|WLAN'}; if($w){Write-Host '     CO Wi-Fi:' $w.Name}else{Write-Host '     KHONG CO Wi-Fi (chi co day mang)' -ForegroundColor Yellow}"
echo.

echo [D] Server python app.py:
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if errorlevel 1 (echo      CHUA CHAY — mo terminal: python app.py) else (echo      DANG CHAY OK)
echo.

echo [E] Firewall port 8000:
netsh advfirewall firewall show rule name="ChamCongKhuonMat Port 8000" >nul 2>&1
if errorlevel 1 (echo      CHUA MO — chay mo-firewall.bat ^(Admin^)) else (echo      DA MO OK)
echo.

echo ============================================================
echo   NGUYEN NHAN THUONG GAP (Chrome tablet cung timeout)
echo ============================================================
echo.
echo   PC dung DAY MANG (Ethernet), tablet dung Wi-Fi cong ty.
echo   Mang icool.local thuong CHAN may Wi-Fi noi voi may day.
echo   ^=&gt; Khong phai loi app, khong phai loi firewall PC.
echo.
echo ============================================================
echo   CACH SUA — CHON 1 TRONG 3
echo ============================================================
echo.
echo   CACH 1 — Hotspot dien thoai ^(nhanh nhat^)
echo   --------------------------------
echo   1. Bat Wi-Fi hotspot tren dien thoai
echo   2. Tablet ket noi Wi-Fi hotspot dien thoai
echo   3. PC cam cap USB vao dien thoai, bat USB tethering
echo      ^(Chia se mang / USB tethering^)
echo   4. Tren PC chay lai: ipconfig  — lay IP moi ^(vd 192.168.43.x^)
echo   5. Tablet Chrome thu: http://IP-MOI:8000/api/ping
echo.
echo   CACH 2 — Router Wi-Fi rieng ^(on dinh^)
echo   --------------------------------
echo   Mua router nho, cam day mang PC vao LAN router,
echo   tablet ket noi Wi-Fi cua router do.
echo   Ca hai cung mang — tablet vao duoc PC.
echo.
echo   CACH 3 — Nho IT mo mang
echo   --------------------------------
echo   Yeu cau IT cho phep tablet Wi-Fi truy cap
echo   port 8000 toi IP PC: 192.168.10.206
echo.
echo ============================================================
pause
