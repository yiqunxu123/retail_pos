$ErrorActionPreference='Stop'
$serial='192.168.1.27:43447'
function GetFirstRow([string]$file){
  $xml=[xml](Get-Content $file)
  $nodes=$xml.SelectNodes('//node[@clickable="true"]')
  foreach($n in $nodes){
    if($n.bounds -eq '[0,201][959,293]'){
      return [string]$n.'content-desc'
    }
  }
  return ''
}
for($i=1;$i -le 2;$i++){
  adb -s $serial shell am start -W -n com.anonymous.ititansapp/.MainActivity -a android.intent.action.VIEW -d "ititansapp://order/add-products" > $null
  Start-Sleep -Milliseconds 800
  adb -s $serial shell input tap 460 110
  Start-Sleep -Milliseconds 900
  adb -s $serial shell uiautomator dump /sdcard/ui.xml > $null
  adb -s $serial pull /sdcard/ui.xml .tmp_before.xml > $null
  $before=GetFirstRow '.tmp_before.xml'
  adb -s $serial shell input tap 295 1053
  Start-Sleep -Milliseconds 900
  adb -s $serial shell uiautomator dump /sdcard/ui.xml > $null
  adb -s $serial pull /sdcard/ui.xml .tmp_after.xml > $null
  $after=GetFirstRow '.tmp_after.xml'
  Write-Output "run=$i"
  Write-Output "before=$before"
  Write-Output "after=$after"
}
