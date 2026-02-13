$ErrorActionPreference = "Stop"

Write-Host "[metro] Setting adb reverse ports..."
adb reverse tcp:8081 tcp:8081 | Out-Null
adb reverse tcp:19000 tcp:19000 | Out-Null
adb reverse tcp:19001 tcp:19001 | Out-Null
adb reverse tcp:19002 tcp:19002 | Out-Null

Write-Host "[metro] Starting Expo dev client on localhost..."
npx expo start --dev-client --localhost -c
