# LINE 部署診斷與修復指南

## ✅ 當前狀態檢查

### 1. Worker 部署狀態

**已部署成功：** ✅
- Worker URL: `https://booking-api-public.afago101.workers.dev`
- 部署時間: 剛剛完成
- Version ID: `b666336e-8fc5-425f-a0e3-2d3e8e2a8c6e`

### 2. Secrets 設定狀態

**已設定：** ✅
- ✅ `LINE_CHANNEL_ID` (2008396997)
- ✅ `LINE_CHANNEL_SECRET` (已設定)
- ✅ `GOOGLE_SHEETS_ID`
- ✅ `GOOGLE_CLIENT_EMAIL`
- ✅ `GOOGLE_PRIVATE_KEY`
- ✅ `ADMIN_API_KEY`
- ✅ `CORS_ORIGINS`

### 3. API 端點檢查

請測試以下端點確認是否正常：

```powershell
# 1. 健康檢查
Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/health"

# 2. LINE Config API
Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/line/config"

# 預期結果：
# {
#   "channelId": "2008396997"
# }
```

---

## 🔍 常見部署失敗原因與解決方法

### 問題 1: LINE Developers Console Callback URL 設定錯誤

**症狀：**
- 點擊「綁定 LINE」後出現 `400 Bad Request - Invalid redirect_uri value`
- OAuth callback 失敗

**解決方法：**

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇您的 Provider
3. 選擇 **LINE Login Channel** (Channel ID: 2008396997)
4. 進入 **「Channel settings」** → **「LINE Login settings」**
5. 在 **「Callback URL」** 欄位中，確認有以下三個 URL（每行一個，**不含 hash**）：

```
https://blessing-haven.marcux.uk/booking
https://blessing-haven.marcux.uk/confirmation
https://blessing-haven.marcux.uk/
```

**重要檢查事項：**
- ✅ URL **不含 hash** (`#`)
- ✅ 使用 **HTTPS**（不是 HTTP）
- ✅ 沒有多餘的斜線（除了根路徑 `/`）
- ✅ 沒有多餘的空格
- ✅ 完全匹配（大小寫、協議都一致）

### 問題 2: 前端環境變數未設定

**症狀：**
- 前端無法取得 LINE Channel ID
- Console 出現 `LINE Channel ID not configured` 錯誤

**解決方法：**

#### 方法 A：Cloudflare Pages Dashboard（推薦）

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇「Pages」→ 專案「booking-manager」
3. 進入 **「Settings」** → **「Environment variables」**
4. 新增以下變數：

**Production 環境：**
- `VITE_API_BASE_URL` = `https://booking-api-public.afago101.workers.dev/api`
- `VITE_ADMIN_API_KEY` = `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL`
- `VITE_LINE_CHANNEL_ID` = `2008396997`（可選，但建議設定）

**注意：** 設定後需要重新建置和部署前端。

#### 方法 B：重新建置前端

```powershell
# 1. 建立 .env.production（在專案根目錄）
@"
VITE_API_BASE_URL=https://booking-api-public.afago101.workers.dev/api
VITE_ADMIN_API_KEY=40lVHrWkepi2cOwZq7U19vIgNFaDoRXL
VITE_LINE_CHANNEL_ID=2008396997
"@ | Out-File -FilePath .env.production -Encoding utf8

# 2. 建置前端
npm run build

# 3. 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name=booking-manager
```

### 問題 3: Worker Secrets 設定錯誤

**症狀：**
- Worker 回應 `LINE configuration missing`
- API 回傳 500 錯誤

**解決方法：**

檢查 Secrets 是否正確設定：

```powershell
cd worker
npx wrangler secret list
```

如果 `LINE_CHANNEL_ID` 或 `LINE_CHANNEL_SECRET` 不存在，請設定：

```powershell
# 設定 LINE_CHANNEL_ID
npx wrangler secret put LINE_CHANNEL_ID
# 輸入: 2008396997

# 設定 LINE_CHANNEL_SECRET
npx wrangler secret put LINE_CHANNEL_SECRET
# 輸入您的 Channel Secret（從 LINE Developers Console 取得）

# 重新部署 Worker
npm run deploy
```

### 問題 4: CORS 設定問題

**症狀：**
- 前端呼叫 API 時出現 CORS 錯誤
- 瀏覽器 Console 顯示 `Access-Control-Allow-Origin` 錯誤

**解決方法：**

檢查 `CORS_ORIGINS` secret：

```powershell
# 設定 CORS_ORIGINS（包含所有前端網域）
cd worker
npx wrangler secret put CORS_ORIGINS
# 輸入: https://blessing-haven.marcux.uk,https://068d675d.booking-manager-pil.pages.dev
```

或使用 `*` 允許所有來源（開發時）：

```powershell
npx wrangler secret put CORS_ORIGINS
# 輸入: *
```

然後重新部署：

```powershell
npm run deploy
```

---

## 🧪 完整測試流程

### 步驟 1: 測試後端 API

```powershell
# 健康檢查
$health = Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/health"
Write-Host "Health Check: $($health.status)"

# LINE Config
$config = Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/line/config"
Write-Host "LINE Channel ID: $($config.channelId)"
```

**預期結果：**
- Health Check 應返回 `{ "status": "ok", ... }`
- LINE Config 應返回 `{ "channelId": "2008396997" }`

### 步驟 2: 測試前端 LINE Login

1. 開啟瀏覽器開發者工具（F12）
2. 前往：`https://blessing-haven.marcux.uk/#/booking`
3. 檢查 Console 是否有錯誤
4. 嘗試點擊「綁定 LINE」按鈕（如果有的話）
5. 確認是否正確跳轉到 LINE Login 頁面

### 步驟 3: 測試 OAuth Callback

1. 完成 LINE Login 授權後
2. 檢查是否正確回調到 `https://blessing-haven.marcux.uk/booking?code=...`
3. 確認前端是否成功處理 callback 並取得 token
4. 檢查 Console 日誌是否有錯誤

---

## 📋 部署檢查清單

完成以下檢查項目：

### 後端檢查
- [ ] Worker 已成功部署
- [ ] `LINE_CHANNEL_ID` secret 已設定
- [ ] `LINE_CHANNEL_SECRET` secret 已設定
- [ ] `/api/line/config` API 正常回應
- [ ] `/api/health` API 正常回應

### LINE Developers Console 檢查
- [ ] Callback URL 已設定（三個 URL：`/booking`, `/confirmation`, `/`）
- [ ] Callback URL **不含 hash** (`#`)
- [ ] 使用 HTTPS
- [ ] Scope 設定為 `profile`（不需要 `openid`）
- [ ] 未啟用 OpenID Connect（除非需要）

### 前端檢查
- [ ] 前端已部署到 Cloudflare Pages
- [ ] 環境變數已設定（`VITE_API_BASE_URL`, `VITE_LINE_CHANNEL_ID`）
- [ ] 可以正常訪問訂房頁面
- [ ] Console 沒有錯誤訊息

---

## 🔧 快速修復指令

如果部署失敗，按順序執行以下指令：

```powershell
# 1. 切換到 worker 目錄
cd "D:\File\Cursor\Developing\Booking Manager\V2\worker"

# 2. 檢查 Secrets
npx wrangler secret list

# 3. 如果缺少 LINE Secrets，設定它們
# npx wrangler secret put LINE_CHANNEL_ID
# npx wrangler secret put LINE_CHANNEL_SECRET

# 4. 重新部署 Worker
npm run deploy

# 5. 切換回專案根目錄
cd ..

# 6. 檢查前端環境變數（如果需要）
# 確認 .env.production 存在且正確

# 7. 重新建置和部署前端
npm run build
npx wrangler pages deploy dist --project-name=booking-manager
```

---

## 📞 需要更多協助？

如果問題仍未解決，請提供：

1. **錯誤訊息**（從瀏覽器 Console 或 Worker 日誌）
2. **失敗的 API 請求**（URL 和回應）
3. **LINE Developers Console 設定截圖**（Callback URL 部分）
4. **Worker 部署日誌**

---

**最後更新：** 2025-01-XX

