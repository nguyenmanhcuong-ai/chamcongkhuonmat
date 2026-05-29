# Sau "npx cap add android" — HTTP LAN + camera
$manifest = "android\app\src\main\AndroidManifest.xml"
if (-not (Test-Path $manifest)) { exit 0 }

$xml = Get-Content $manifest -Raw
if ($xml -notmatch "usesCleartextTraffic") {
  $xml = $xml -replace "<application", '<application android:usesCleartextTraffic="true"'
}
if ($xml -notmatch "networkSecurityConfig") {
  $xml = $xml -replace "<application", '<application android:networkSecurityConfig="@xml/network_security_config"'
}
Set-Content $manifest $xml -Encoding UTF8

$resDir = "android\app\src\main\res\xml"
New-Item -ItemType Directory -Force -Path $resDir | Out-Null
Copy-Item "android-network-security.xml" "$resDir\network_security_config.xml" -Force

$xml = Get-Content $manifest -Raw
if ($xml -notmatch "permission.CAMERA") {
  $cam = '    <uses-permission android:name="android.permission.CAMERA" />'
  $xml = $xml -replace "</manifest>", "$cam`n</manifest>"
  Set-Content $manifest $xml -Encoding UTF8
}

Write-Host "Android manifest patched (HTTP + camera)."
