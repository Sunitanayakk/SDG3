param([string]$Architectures = 'arm64-v8a')
$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
& node (Join-Path $PSScriptRoot 'sync-panda-media.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Could not synchronize the panda animation assets.' }
$buildTemp = Join-Path $project '.tmp'
New-Item -ItemType Directory -Force $buildTemp | Out-Null
# Keep caches on the project drive, particularly on machines with a small C: drive.
$env:TEMP = $buildTemp
$env:TMP = $buildTemp
$env:GRADLE_USER_HOME = Join-Path $project '.gradle-user'
$env:JAVA_TOOL_OPTIONS = "-Djava.io.tmpdir=$buildTemp"
if (Test-Path (Join-Path $project '.android-sdk')) {
    $env:ANDROID_HOME = Join-Path $project '.android-sdk'
} elseif (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
if (-not $env:JAVA_HOME) {
    $jdk = Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory -Filter 'jdk-21*' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($jdk) { $env:JAVA_HOME = $jdk.FullName }
}
if (-not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    throw 'Set JAVA_HOME to a JDK 17 or 21 installation.'
}
$demoKeystore = Join-Path $project 'apps\mobile\android\app\debug.keystore'
if (-not (Test-Path $demoKeystore)) {
    # Signing keys stay local. These public passwords are for demo signing only.
    & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -keystore $demoKeystore -storepass android -alias androiddebugkey -keypass android -dname 'CN=Android Debug,O=Android,C=US' -keyalg RSA -keysize 2048 -validity 10000
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the local demo signing key.' }
}
# This standalone APK deliberately uses labeled synthetic workflows.
# A live build needs a publicly reachable HTTPS API first.
$env:EXPO_PUBLIC_DEMO_MODE = 'true'
$env:NODE_ENV = 'production'
# SDK 54 export:embed resolves Gradle entry paths relative to the app workspace.
$env:EXPO_NO_METRO_WORKSPACE_ROOT = '1'
Push-Location (Join-Path $project 'apps\mobile\android')
try {
    & .\gradlew.bat :app:assembleRelease "-PreactNativeArchitectures=$Architectures" --no-daemon --max-workers 2 --console=plain
    if ($LASTEXITCODE -ne 0) { throw "Android build failed ($LASTEXITCODE)." }
    $destination = Join-Path $project 'artifacts\SwasthyaSetu-AI-demo-arm64.apk'
    New-Item -ItemType Directory -Force (Split-Path $destination -Parent) | Out-Null
    Copy-Item -LiteralPath 'app\build\outputs\apk\release\app-release.apk' -Destination $destination
    Write-Output "Created standalone demo APK: $destination"
} finally {
    Pop-Location
}
