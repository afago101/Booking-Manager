# Cloudflare Pages 環境變數設定腳本
# 使用 Cloudflare API 設定環境變數

$projectName = "booking-manager"
$accountId = "4ee4319e9beac38eb85a3216645c34cd"  # 從之前的部署資訊取得

# 需要設定的環境變數
$envVars = @{
    "VITE_LINE_LIFF_ID" = "2008398150-kRq2E2Ro"
    "VITE_LINE_CHANNEL_ID" = "2008398150"
    "VITE_API_BASE_URL" = "https://booking-api-public.afago101.workers.dev/api"
    "VITE_ADMIN_API_KEY" = "40lVHrWkepi2cOwZq7U19vIgNFaDoRXL"
}

Write-Host "=== Cloudflare Pages 環境變數設定 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "注意：此腳本需要 Cloudflare API Token" -ForegroundColor Yellow
Write-Host ""
Write-Host "需要設定的環境變數：" -ForegroundColor Cyan
$envVars.GetEnumerator() | ForEach-Object {
    Write-Host "  - $($_.Key) = $($_.Value)" -ForegroundColor White
}
Write-Host ""
Write-Host "⚠️  無法透過 CLI 直接設定，請使用以下方法之一：" -ForegroundColor Yellow
Write-Host ""
Write-Host "方法 1: Cloudflare Dashboard（推薦）" -ForegroundColor Green
Write-Host "  1. https://dash.cloudflare.com" -ForegroundColor Gray
Write-Host "  2. Pages → booking-manager → Settings → Environment variables" -ForegroundColor Gray
Write-Host "  3. 手動新增上述四個變數（Production 環境）" -ForegroundColor Gray
Write-Host ""
Write-Host "方法 2: 使用本地 .env.production 檔案 + 重新部署" -ForegroundColor Green
Write-Host "  此方法會在本機建立 .env.production，然後重新部署" -ForegroundColor Gray

