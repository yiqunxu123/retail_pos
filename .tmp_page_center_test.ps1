$serial='192.168.1.27:43447'
function GetFirstRow([string]$file){
  $xml=[xml](Get-Content $file)
  $n=$xml.SelectNodes('//node[@clickable="true"]') | Where-Object { $_.bounds -eq '[0,201][959,293]' } | Select-Object -First 1
  if($n){ return [string]$n.'content-desc' }
  return ''
}
function GetPage2Center([string]$file){
  $xml=[xml](Get-Content $file)
  $n=$xml.SelectNodes('//node[@clickable="true"]') | Where-Object { $_.'content-desc' -eq 'search-products-page-2' } | Select-Object -First 1
  if(-not $n){ return $null }
  if($n.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]'){
    $x=[int](($matches[1]+$matches[3])/2)
    $y=[int](($matches[2]+$matches[4])/2)
    return @($x,$y)
  }
  return $null
}

adb -s $serial shell am start -W -n com.anonymous.ititansapp/.MainActivity -a android.intent.action.VIEW -d "ititansapp://order/add-products" > $null
Start-Sleep -Milliseconds 700
adb -s $serial shell input tap 460 110
Start-Sleep -Milliseconds 700
adb -s $serial shell uiautomator dump /sdcard/ui.xml > $null
adb -s $serial pull /sdcard/ui.xml .tmp_before.xml > $null
$before=GetFirstRow '.tmp_before.xml'
$center=GetPage2Center '.tmp_before.xml'
Write-Output "before=$before"
Write-Output "center=$($center -join ',')"
if($center){
  adb -s $serial shell input tap $center[0] $center[1]
  Start-Sleep -Milliseconds 900
  adb -s $serial shell uiautomator dump /sdcard/ui.xml > $null
  adb -s $serial pull /sdcard/ui.xml .tmp_after.xml > $null
  $after=GetFirstRow '.tmp_after.xml'
  Write-Output "after=$after"
}
