# Cloudflare Worker Secrets 設定腳本
# 請在 worker 目錄執行此腳本

Write-Host "🔐 設定 Cloudflare Worker Secrets" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 確認在 worker 目錄
if (-not (Test-Path "wrangler.toml")) {
    Write-Host "❌ 錯誤：請在 worker 目錄執行此腳本" -ForegroundColor Red
    Write-Host "   執行：cd worker" -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 步驟 1: 登入 Cloudflare" -ForegroundColor Yellow
Write-Host "執行以下命令：" -ForegroundColor White
Write-Host "wrangler login" -ForegroundColor Green
Write-Host ""
Read-Host "按 Enter 繼續下一步"

Write-Host ""
Write-Host "📍 步驟 2: 設定 GOOGLE_SHEETS_ID" -ForegroundColor Yellow
Write-Host "執行以下命令並貼上提供的值：" -ForegroundColor White
Write-Host "wrangler secret put GOOGLE_SHEETS_ID" -ForegroundColor Green
Write-Host ""
Write-Host "請複製以下值：" -ForegroundColor Cyan
Write-Host "1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw" -ForegroundColor White
Write-Host ""
Read-Host "按 Enter 繼續下一步"

Write-Host ""
Write-Host "📍 步驟 3: 設定 GOOGLE_CLIENT_EMAIL" -ForegroundColor Yellow
Write-Host "執行以下命令並貼上提供的值：" -ForegroundColor White
Write-Host "wrangler secret put GOOGLE_CLIENT_EMAIL" -ForegroundColor Green
Write-Host ""
Write-Host "請複製以下值：" -ForegroundColor Cyan
Write-Host "booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com" -ForegroundColor White
Write-Host ""
Read-Host "按 Enter 繼續下一步"

Write-Host ""
Write-Host "📍 步驟 4: 設定 GOOGLE_PRIVATE_KEY" -ForegroundColor Yellow
Write-Host "⚠️  重要：Private Key 包含多行，請完整複製" -ForegroundColor Red
Write-Host "執行以下命令並貼上提供的值：" -ForegroundColor White
Write-Host "wrangler secret put GOOGLE_PRIVATE_KEY" -ForegroundColor Green
Write-Host ""
Write-Host "請從 gen-lang-client-*.json 檔案複製 'private_key' 的值" -ForegroundColor Cyan
Write-Host "（包含 -----BEGIN PRIVATE KEY----- 和 -----END PRIVATE KEY-----）" -ForegroundColor Yellow
Write-Host ""
Read-Host "按 Enter 繼續下一步"

Write-Host ""
Write-Host "📍 步驟 5: 設定 ADMIN_API_KEY" -ForegroundColor Yellow
Write-Host "執行以下命令並輸入您自己的強密碼：" -ForegroundColor White
Write-Host "wrangler secret put ADMIN_API_KEY" -ForegroundColor Green
Write-Host ""
Write-Host "建議使用以下命令生成強密碼（需要 OpenSSL）：" -ForegroundColor Cyan
Write-Host "openssl rand -hex 32" -ForegroundColor White
Write-Host ""
Write-Host "或使用任何強密碼生成器" -ForegroundColor Yellow
Write-Host "⚠️  請記住這個密碼，稍後需要設定到 GitHub Secrets" -ForegroundColor Red
Write-Host ""
Read-Host "按 Enter 繼續下一步"

Write-Host ""
Write-Host "📍 步驟 6: 設定 CORS_ORIGINS" -ForegroundColor Yellow
Write-Host "執行以下命令並貼上提供的值：" -ForegroundColor White
Write-Host "wrangler secret put CORS_ORIGINS" -ForegroundColor Green
Write-Host ""
Write-Host "開發環境請複製：" -ForegroundColor Cyan
Write-Host "*" -ForegroundColor White
Write-Host ""
Write-Host "（生產環境建議改為您的實際網域，如：https://yourdomain.pages.dev）" -ForegroundColor Yellow
Write-Host ""
Read-Host "按 Enter 完成"

Write-Host ""
Write-Host "✅ Secrets 設定完成！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：" -ForegroundColor Cyan
Write-Host "1. 部署 Worker：npm run deploy" -ForegroundColor White
Write-Host "2. 初始化 Sheets：" -ForegroundColor White
Write-Host "   curl -X POST https://your-worker.workers.dev/api/admin/initialize -H 'x-admin-key: YOUR_KEY'" -ForegroundColor Gray
Write-Host ""

