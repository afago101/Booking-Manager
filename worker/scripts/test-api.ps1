# API 測試腳本 (PowerShell)
# 使用方式: .\scripts\test-api.ps1 -WorkerUrl "https://your-worker.workers.dev" -AdminKey "your-admin-key"

param(
    [Parameter(Mandatory=$true)]
    [string]$WorkerUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$AdminKey = ""
)

$BaseUrl = "$WorkerUrl/api"

Write-Host "🧪 測試 Booking Manager API" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Worker URL: $WorkerUrl"
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Description,
        [string]$Data = "",
        [bool]$Admin = $false
    )

    Write-Host "📍 測試: $Description" -ForegroundColor Yellow
    Write-Host "   $Method $Endpoint"

    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($Admin -and $AdminKey -ne "") {
        $headers["x-admin-key"] = $AdminKey
    }

    $uri = "$BaseUrl$Endpoint"

    try {
        if ($Data -ne "") {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $Data -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -ErrorAction Stop
        }
        
        Write-Host "   ✓ 成功" -ForegroundColor Green
        Write-Host "   Response: $($response | ConvertTo-Json -Compress)"
    } catch {
        Write-Host "   ✗ 失敗: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "   HTTP Status: $statusCode" -ForegroundColor Red
        }
    }

    Write-Host ""
}

# === PUBLIC API 測試 ===

Write-Host "📖 Public API 測試" -ForegroundColor Cyan
Write-Host "---"

Test-Endpoint -Method "GET" -Endpoint "/health" -Description "健康檢查"

Test-Endpoint -Method "GET" -Endpoint "/availability?from=2024-01-01&to=2024-01-31" -Description "查詢可訂日期"

Test-Endpoint -Method "POST" -Endpoint "/quote" -Description "計算報價" -Data @'
{
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-17",
  "numberOfGuests": 2,
  "useCoupon": true
}
'@

Test-Endpoint -Method "POST" -Endpoint "/bookings" -Description "建立訂單" -Data @'
{
  "guestName": "測試用戶",
  "contactPhone": "0912345678",
  "checkInDate": "2024-02-01",
  "checkOutDate": "2024-02-03",
  "numberOfGuests": 2,
  "useCoupon": false,
  "totalPrice": 10000
}
'@

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# === ADMIN API 測試 ===

if ($AdminKey -ne "") {
    Write-Host "🔐 Admin API 測試" -ForegroundColor Cyan
    Write-Host "---"

    Test-Endpoint -Method "GET" -Endpoint "/admin/bookings" -Description "取得所有訂單" -Admin $true

    Test-Endpoint -Method "GET" -Endpoint "/admin/bookings?status=pending" -Description "取得 pending 訂單" -Admin $true

    Test-Endpoint -Method "GET" -Endpoint "/admin/settings" -Description "取得設定" -Admin $true

    Test-Endpoint -Method "PUT" -Endpoint "/admin/settings" -Description "更新設定" -Data @'
{
  "key": "nightlyPriceDefault",
  "value": "5000"
}
'@ -Admin $true

    Test-Endpoint -Method "GET" -Endpoint "/admin/inventory" -Description "取得房況" -Admin $true

    Test-Endpoint -Method "PUT" -Endpoint "/admin/inventory/2024-12-25" -Description "更新房況" -Data @'
{
  "isClosed": true,
  "capacity": 1,
  "note": "聖誕節休息"
}
'@ -Admin $true

    Write-Host ""
    Write-Host "================================" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  未提供 Admin Key，跳過 Admin API 測試" -ForegroundColor Yellow
    Write-Host "   使用方式: .\scripts\test-api.ps1 -WorkerUrl '$WorkerUrl' -AdminKey 'your-admin-key'"
}

Write-Host ""
Write-Host "✅ 測試完成！" -ForegroundColor Green

