param(
  [string]$DeviceSerial = "192.168.1.27:40595",
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$SkipScrcpy,
  [switch]$ForceRestart
)

$ErrorActionPreference = "Stop"

function Resolve-AdbPath {
  $candidate = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
  if (Test-Path $candidate) {
    return $candidate
  }
  $cmd = Get-Command adb -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }
  throw "adb.exe not found. Install Android platform-tools first."
}

function Invoke-Adb {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )
  & $script:AdbPath @Args
}

function Test-DeviceConnected {
  param([string]$Serial)
  $devices = Invoke-Adb devices
  $escapedSerial = [regex]::Escape($Serial)
  foreach ($line in $devices) {
    if ($line -match "^$escapedSerial\s+device\b") {
      return $true
    }
  }
  return $false
}

function Test-ReverseMapping {
  param(
    [string]$Serial,
    [string]$LocalSpec,
    [string]$RemoteSpec
  )

  $reverseList = Invoke-Adb -s $Serial reverse --list
  if (-not $reverseList) {
    return $false
  }

  $escapedLocal = [regex]::Escape($LocalSpec)
  $escapedRemote = [regex]::Escape($RemoteSpec)

  foreach ($line in $reverseList) {
    if ($line -match "^\S+\s+$escapedLocal\s+$escapedRemote$") {
      return $true
    }
  }
  return $false
}

function Ensure-ReverseMapping {
  param(
    [string]$Serial,
    [string]$LocalSpec,
    [string]$RemoteSpec,
    [switch]$Force
  )

  if (-not $Force -and (Test-ReverseMapping -Serial $Serial -LocalSpec $LocalSpec -RemoteSpec $RemoteSpec)) {
    Write-Host "[reverse] $LocalSpec -> $RemoteSpec already ready, skipping."
    return
  }

  Write-Host "[reverse] Setting $LocalSpec -> $RemoteSpec"
  Invoke-Adb -s $Serial reverse $LocalSpec $RemoteSpec | Out-Host
}

function Test-MetroReady {
  try {
    $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8081/status" -UseBasicParsing -TimeoutSec 3
    $content = $resp.Content
    if ($content -is [byte[]]) {
      $content = [System.Text.Encoding]::UTF8.GetString($content)
    }
    return ([string]$content) -match "packager-status:running"
  } catch {
    return $false
  }
}

function Start-Metro {
  param([string]$Root)
  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $metroLog = Join-Path $Root ".tmp_expo_restart_$stamp.log"
  $metroErr = Join-Path $Root ".tmp_expo_restart_$stamp.err.log"

  Start-Process -FilePath "npx.cmd" `
    -WorkingDirectory $Root `
    -ArgumentList "expo start --dev-client --clear" `
    -RedirectStandardOutput $metroLog `
    -RedirectStandardError $metroErr | Out-Null

  for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 2
    if (Test-MetroReady) {
      Write-Host "[metro] Ready on http://localhost:8081"
      if (Test-Path $metroLog) {
        Write-Host "---- metro log tail ----"
        Get-Content $metroLog -Tail 20 | Out-Host
        Write-Host "------------------------"
      }
      return
    }
  }

  Write-Host "[metro] Started but readiness check timed out. Check latest .tmp_expo_restart_*.log"
}

$script:AdbPath = Resolve-AdbPath

Write-Host "[1/5] Ensuring adb server..."
if ($ForceRestart) {
  taskkill /F /IM adb.exe 2>$null | Out-Null
  Start-Sleep -Milliseconds 500
}
Invoke-Adb start-server | Out-Host

Write-Host "[2/5] Ensuring device connection..."
if (-not (Test-DeviceConnected -Serial $DeviceSerial) -and $DeviceSerial -match ":\d+$") {
  Write-Host "[2/5] Connecting to device $DeviceSerial ..."
  Invoke-Adb connect $DeviceSerial | Out-Host
}

if (-not (Test-DeviceConnected -Serial $DeviceSerial)) {
  $devicesOutput = Invoke-Adb devices -l
  $devicesText = ($devicesOutput | Out-String)
  Write-Host $devicesText
  throw "Device $DeviceSerial is not connected."
}

Write-Host "[3/5] Setting adb reverse ports (8081/8082)..."
Ensure-ReverseMapping -Serial $DeviceSerial -LocalSpec "tcp:8081" -RemoteSpec "tcp:8081" -Force:$ForceRestart
Ensure-ReverseMapping -Serial $DeviceSerial -LocalSpec "tcp:8082" -RemoteSpec "tcp:8082" -Force:$ForceRestart

$diagDevice = Test-DeviceConnected -Serial $DeviceSerial
$diagReverse8081 = Test-ReverseMapping -Serial $DeviceSerial -LocalSpec "tcp:8081" -RemoteSpec "tcp:8081"
$diagReverse8082 = Test-ReverseMapping -Serial $DeviceSerial -LocalSpec "tcp:8082" -RemoteSpec "tcp:8082"
$diagMetro = Test-MetroReady
Write-Host "[diag] chain device=$diagDevice reverse8081=$diagReverse8081 reverse8082=$diagReverse8082 metro=$diagMetro"

Write-Host "[4/5] Ensuring Expo/Metro..."
if ($ForceRestart -or -not (Test-MetroReady)) {
  $nodeTargets = Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq "node.exe" -and
    $_.CommandLine -match [regex]::Escape($ProjectRoot) -and
    $_.CommandLine -notmatch "kapp\\client\\tenant"
  }
  if ($nodeTargets) {
    $nodeTargets.ProcessId | Sort-Object -Unique | ForEach-Object {
      Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
  }
  Start-Metro -Root $ProjectRoot
} else {
  Write-Host "[metro] Already ready, skipping restart."
}

if (-not $SkipScrcpy) {
  Write-Host "[5/5] Ensuring scrcpy..."
  $scrcpyRunning = Get-Process scrcpy -ErrorAction SilentlyContinue
  if ($ForceRestart -or -not $scrcpyRunning) {
    if ($scrcpyRunning) {
      $scrcpyRunning | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    Start-Process -FilePath "scrcpy.exe" -ArgumentList "--tcpip=$DeviceSerial", "--window-title", "BLAZE" | Out-Null
  } else {
    Write-Host "[scrcpy] Already running, skipping launch."
  }
}

Write-Host "Done."
