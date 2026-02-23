$serial='192.168.1.27:43447'
adb -s $serial shell am start -W -n com.anonymous.ititansapp/.MainActivity -a android.intent.action.VIEW -d "ititansapp://order/add-products" > $null
Start-Sleep -Milliseconds 700
adb -s $serial shell input tap 460 110
Start-Sleep -Milliseconds 900
adb -s $serial logcat -c
adb -s $serial shell input tap 295 1053
Start-Sleep -Milliseconds 700
adb -s $serial logcat -d | Select-String -Pattern "SearchProductModal #|search-products-page|SearchProductModalController" | Select-Object -Last 50
