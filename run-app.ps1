# Ilovani telefonga build qilib o'rnatadi, ishga tushiradi va USB tunnellarni sozlaydi.
# Oldindan: telefon USB orqali ulangan (USB debugging ON) va start-metro.ps1 boshqa terminalda ishlab tursin.
# Ishlatish:  powershell -ExecutionPolicy Bypass -File .\run-app.ps1
#   yoki PowerShell'da:  .\run-app.ps1

$ErrorActionPreference = 'Stop'

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$jdk = Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory |
    Where-Object { $_.Name -like "jdk-17*" } | Select-Object -First 1
$env:JAVA_HOME = $jdk.FullName
$adb = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"
$pkg = "com.smssender"

# 1) Telefon ulanganini tekshirish
$attached = (& $adb devices) | Select-String "`tdevice$"
if (-not $attached) {
    Write-Host "XATO: hech qanday telefon ulanmagan. USB + USB debugging tekshiring (adb devices)." -ForegroundColor Red
    exit 1
}
Write-Host "Telefon ulangan." -ForegroundColor Green

# 2) USB tunnellar: Metro (8081) + backend (4008)
& $adb reverse tcp:8081 tcp:8081 | Out-Null
& $adb reverse tcp:4008 tcp:4008 | Out-Null
Write-Host "Tunnellar: 8081 (Metro) + 4008 (backend) sozlandi." -ForegroundColor Green

# 3) Build + install
Set-Location (Join-Path $PSScriptRoot "android")
Write-Host "Build + install (gradlew installDebug)..." -ForegroundColor Cyan
.\gradlew.bat installDebug --console=plain
if ($LASTEXITCODE -ne 0) { Write-Host "Build muvaffaqiyatsiz." -ForegroundColor Red; exit 1 }

# 4) Ishga tushirish
& $adb shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 | Out-Null
Write-Host "Ilova ishga tushdi. Telefonni qarang." -ForegroundColor Green
