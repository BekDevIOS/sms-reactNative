# Metro bundler'ni ishga tushiradi (JS serveri). Buni ALOHIDA terminalda ochiq qoldiring.
# Ishlatish:  powershell -ExecutionPolicy Bypass -File .\start-metro.ps1
#   yoki PowerShell'da:  .\start-metro.ps1

$ErrorActionPreference = 'Stop'

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$jdk = Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory |
    Where-Object { $_.Name -like "jdk-17*" } | Select-Object -First 1
$env:JAVA_HOME = $jdk.FullName
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

Set-Location $PSScriptRoot

# .env o'zgargan bo'lsa keshni tozalash uchun -ResetCache parametri:  .\start-metro.ps1 -ResetCache
if ($args -contains '-ResetCache' -or $args -contains '--reset-cache') {
    Write-Host "Metro (reset cache)..." -ForegroundColor Cyan
    npx react-native start --reset-cache
} else {
    Write-Host "Metro..." -ForegroundColor Cyan
    npx react-native start
}
