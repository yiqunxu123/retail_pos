$serial='192.168.1.27:43447'
function GetFirstRow([string]$file){
  $xml=[xml](Get-Content $file)
  $n=$xml.SelectNodes('//node[@clickable="true"]') | Where-Object { $_.bounds -eq '[0,201][959,293]' } | Select-Object -First 1
  if($n){ return [string]$n.'content-desc' }
  return ''
}
$changed=0
for($i=1;$i -le 10;$i++){
  adb -s $serial shell am start -W -n com.anonymous.ititansapp/.MainActivity -a android.intent.action.VIEW -d "ititansapp://order/add-products" > $null
  Start-Sleep -Milliseconds 600
  adb -s $serial shell input tap 460 110
  Start-Sleep -Milliseconds 700
  adb -s $serial shell uiautomator dump /sdcard/ui.xml > $null
  adb -s $serial pull /sdcard/ui.xml .tmp_before.xml > $null
  $before=GetFirstRow '.tmp_before.xml'
  adb -s $serial shell input tap 295 1053
  Start-Sleep -Milliseconds 700
  adb -s $serial shell uiautomator dump /sdcard/ui.xml > $null
  adb -s $serial pull /sdcard/ui.xml .tmp_after.xml > $null
  $after=GetFirstRow '.tmp_after.xml'
  $ok = $before -ne $after
  if($ok){$changed++}
  Write-Output "run=$i changed=$ok"
}
Write-Output "changed_count=$changed"
