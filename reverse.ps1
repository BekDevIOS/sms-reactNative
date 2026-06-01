# USB tunnellarni (qayta) sozlaydi: 8081 (Metro) + 4008 (backend).
# Telefon har uzilib-ulanganda adb reverse o'chadi — app "connect bo'lmayapti" desa shuni ishga tushiring.
# Ishlatish:  .\reverse.ps1

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$adb = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"

$attached = (& $adb devices) | Select-String "`tdevice$"
if (-not $attached) {
    Write-Host "Telefon ulanmagan (adb devices bo'sh)." -ForegroundColor Red
    exit 1
}
& $adb reverse tcp:8081 tcp:8081 | Out-Null
& $adb reverse tcp:4008 tcp:4008 | Out-Null
Write-Host "Tunnellar sozlandi:" -ForegroundColor Green
& $adb reverse --list
