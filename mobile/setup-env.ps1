# Tu dong tim JDK (Android Studio) va Android SDK
$jbr = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path "$jbr\bin\java.exe") {
  $env:JAVA_HOME = $jbr
  $env:PATH = "$jbr\bin;$env:PATH"
}

$sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$localProps = "android\local.properties"
if ((Test-Path $sdk) -and (Test-Path "android")) {
  $escaped = $sdk -replace "\\", "\\\\"
  "sdk.dir=$escaped" | Set-Content $localProps -Encoding ASCII
  Write-Host "SDK: $sdk"
}
