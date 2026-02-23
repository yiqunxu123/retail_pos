Write-Output 'test-start'
$serial='192.168.1.27:43447'
adb -s $serial shell dumpsys window | Select-String -Pattern 'mCurrentFocus' | Select-Object -First 1
Write-Output 'test-end'
