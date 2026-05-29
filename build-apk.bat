@echo off
chcp 65001 >nul
cd /d "%~dp0mobile"

echo ============================================
echo   BUILD APK - Cham cong khuon mat
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [LOI] Chua cai Node.js. Tai: https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dang cai npm packages...
  call npm install
  if errorlevel 1 exit /b 1
)

if not exist "android" (
  echo Tao project Android lan dau...
  call npx cap add android
  if errorlevel 1 exit /b 1
  powershell -ExecutionPolicy Bypass -File patch-android.ps1
)

echo Dong bo giao dien web...
powershell -ExecutionPolicy Bypass -File setup-env.ps1
call npx cap sync android
call powershell -ExecutionPolicy Bypass -File patch-android.ps1
if errorlevel 1 exit /b 1

echo.
echo Dang build APK...
powershell -ExecutionPolicy Bypass -File setup-env.ps1
cd android
if exist "gradlew.bat" (
  call gradlew.bat assembleDebug
) else (
  echo [LOI] Khong tim thay gradlew. Cai Android Studio va mo project:
  echo   mobile\android
  cd ..
  pause
  exit /b 1
)
cd ..

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
  copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "..\ChamCongKhuonMat.apk" >nul
  echo.
  echo ============================================
  echo   THANH CONG!
  echo   File APK: ChamCongKhuonMat.apk
  echo   (thu muc goc project)
  echo ============================================
) else (
  echo [LOI] Khong tao duoc APK. Mo Android Studio:
  echo   File - Open - mobile\android
  echo   Build - Build Bundle(s) / APK(s) - Build APK(s)
)

echo.
pause
