# 訂房管理系統 - 完整部署指南

本系統包含前端（React + Vite）和後端（Cloudflare Worker），使用 Google Sheets 作為資料庫。

## 系統架構

```
前端（React SPA）
    ↓
Cloudflare Worker（API）
    ↓
Google Sheets（資料庫）
```

## 部署步驟

### 第一步：Google Sheets 設定

#### 1. 建立 Google Sheets

1. 開啟 [Google Sheets](https://sheets.google.com)
2. 使用現有的 Sheet ID：`1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw`

#### 2. 建立三個工作表

在試算表中建立三個分頁（Sheet），名稱必須完全一致：

**Bookings** - 第一列為表頭：
```
id | guestName | contactPhone | lineName | checkInDate | checkOutDate | numberOfGuests | useCoupon | arrivalTime | totalPrice | status | createdAt | updatedAt
```

**Inventory** - 第一列為表頭：
```
date | isClosed | capacity | note
```

**Settings** - 第一列為表頭：
```
key | value | updatedAt
```

第二列開始新增預設設定：
```
nightlyPriceDefault | 5000 | 2024-01-01T00:00:00.000Z
weekendPriceDefault | 7000 | 2024-01-01T00:00:00.000Z
couponDiscount | 500 | 2024-01-01T00:00:00.000Z
defaultCapacity | 1 | 2024-01-01T00:00:00.000Z
```

#### 3. 共用權限

1. 點擊右上角「共用」按鈕
2. 新增以下 email：
   ```
   booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com
   ```
3. 權限設為「編輯者」
4. 取消勾選「通知使用者」
5. 點擊「完成」

### 第二步：部署 Cloudflare Worker

#### 1. 安裝 Wrangler CLI

```bash
npm install -g wrangler
```

#### 2. 登入 Cloudflare

```bash
wrangler login
```

會開啟瀏覽器進行認證。

#### 3. 設定環境變數

進入 worker 目錄：
```bash
cd worker
npm install
```

設定 Cloudflare Secrets：

```bash
# Google Sheets ID
wrangler secret put GOOGLE_SHEETS_ID
# 輸入: 1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw

# Google Service Account Email
wrangler secret put GOOGLE_CLIENT_EMAIL
# 輸入: booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com

# Google Private Key（需要完整的 private key）
wrangler secret put GOOGLE_PRIVATE_KEY
# 貼上: -----BEGIN PRIVATE KEY-----\n...(完整內容)...\n-----END PRIVATE KEY-----\n

# Admin API Key（自己生成一個強密碼）
wrangler secret put ADMIN_API_KEY
# 輸入: 例如使用 openssl rand -hex 32 生成

# CORS Origins（前端網址，逗號分隔）
wrangler secret put CORS_ORIGINS
# 輸入: https://your-frontend.pages.dev,https://your-custom-domain.com
```

#### 4. 部署 Worker

```bash
npm run deploy
```

部署完成後，會顯示 Worker URL，例如：
```
https://booking-manager-worker.your-subdomain.workers.dev
```

#### 5. 初始化 Sheets

使用 curl 或 Postman 呼叫初始化端點（只需執行一次）：

```bash
curl -X POST https://your-worker-url.workers.dev/api/admin/initialize \
  -H "x-admin-key: your-admin-api-key"
```

### 第三步：部署前端

#### 1. 設定環境變數

在專案根目錄建立 `.env.production`：

```env
VITE_API_BASE_URL=https://your-worker-url.workers.dev/api
VITE_ADMIN_API_KEY=your-admin-api-key
```

#### 2. 建置前端

```bash
npm install
npm run build
```

#### 3. 部署到 Cloudflare Pages

**方法 A：使用 Wrangler**

```bash
npx wrangler pages deploy dist --project-name=booking-manager
```

**方法 B：使用 Cloudflare Dashboard**

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇「Pages」
3. 點擊「建立專案」
4. 選擇「上傳資產」
5. 上傳 `dist` 資料夾
6. 設定環境變數（在 Settings > Environment variables）：
   - `VITE_API_BASE_URL`
   - `VITE_ADMIN_API_KEY`

**方法 C：連接 Git Repository**

1. 將程式碼推送到 GitHub
2. 在 Cloudflare Pages 選擇「連接 Git」
3. 選擇 repository
4. 建置設定：
   - 建置命令：`npm run build`
   - 建置輸出目錄：`dist`
   - 環境變數：設定 `VITE_API_BASE_URL` 和 `VITE_ADMIN_API_KEY`

### 第四步：測試

#### 1. 測試 Worker API

```bash
# 健康檢查
curl https://your-worker-url.workers.dev/api/health

# 測試可訂日期查詢
curl "https://your-worker-url.workers.dev/api/availability?from=2024-01-01&to=2024-01-31"

# 測試報價
curl -X POST https://your-worker-url.workers.dev/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2024-01-01",
    "checkOutDate": "2024-01-03",
    "numberOfGuests": 2,
    "useCoupon": true
  }'
```

#### 2. 測試前端

開啟瀏覽器，訪問：
- 前台：`https://your-site.pages.dev`
- 後台：`https://your-site.pages.dev/#/admin/login`

## 環境變數總覽

### Worker（Cloudflare Secrets）

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| GOOGLE_SHEETS_ID | Google Sheets ID | 1MdxsHfS... |
| GOOGLE_CLIENT_EMAIL | Service Account Email | xxx@xxx.iam.gserviceaccount.com |
| GOOGLE_PRIVATE_KEY | Service Account Private Key | -----BEGIN PRIVATE KEY-----\n... |
| ADMIN_API_KEY | Admin API 驗證金鑰 | 強隨機字串 |
| CORS_ORIGINS | 允許的前端網域 | https://domain1.com,https://domain2.com |

### Frontend（.env.production）

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| VITE_API_BASE_URL | Worker API 網址 | https://xxx.workers.dev/api |
| VITE_ADMIN_API_KEY | Admin API 金鑰 | 與 Worker 的 ADMIN_API_KEY 相同 |

## 自訂網域

### Worker 自訂網域

1. 在 Cloudflare Workers 設定中選擇「Triggers」
2. 點擊「Add Custom Domain」
3. 輸入網域（需要在 Cloudflare 託管）
4. 等待 DNS 設定完成

### Pages 自訂網域

1. 在 Cloudflare Pages 專案設定中選擇「Custom domains」
2. 點擊「Set up a custom domain」
3. 輸入網域
4. 按照指示設定 DNS

## 更新部署

### 更新 Worker

```bash
cd worker
npm run deploy
```

### 更新前端

```bash
npm run build
npx wrangler pages deploy dist --project-name=booking-manager
```

或者如果使用 Git 連接，直接推送到 repository：
```bash
git add .
git commit -m "Update frontend"
git push
```

Cloudflare Pages 會自動重新建置和部署。

## 監控與日誌

### Worker 日誌

```bash
cd worker
wrangler tail
```

### Pages 部署日誌

在 Cloudflare Dashboard > Pages > 專案 > 查看建置歷史

## 備份

Google Sheets 本身就有版本歷史功能：
1. 開啟 Google Sheets
2. 檔案 > 版本記錄 > 查看版本記錄
3. 可隨時還原到先前版本

建議定期匯出 CSV 備份：
1. 檔案 > 下載 > Microsoft Excel (.xlsx)

## 疑難排解

### Worker 無法連接 Google Sheets

1. 檢查 Service Account email 是否已加入 Sheets 共用
2. 確認 Private Key 格式正確（包含 `\n` 換行符號）
3. 檢查 Sheets ID 是否正確

### 前端無法呼叫 API

1. 檢查 CORS_ORIGINS 是否包含前端網域
2. 確認 VITE_API_BASE_URL 設定正確
3. 檢查瀏覽器開發者工具的 Network 頁面

### Admin API 回傳 401

確認 `x-admin-key` header 正確，且與 Worker 的 ADMIN_API_KEY 一致。

### 並發訂單衝突

系統會自動檢查並回傳 409 CONFLICT，前端應提示使用者重新整理並重試。

## 成本估算

- **Cloudflare Workers**：免費方案每天 100,000 次請求
- **Cloudflare Pages**：免費方案無限次請求
- **Google Sheets API**：每天 300 次讀取配額（Service Account）

對於小型民宿，完全可以使用免費方案。

## 安全性檢查清單

- [ ] Google Service Account Private Key 已設為 Cloudflare Secret
- [ ] ADMIN_API_KEY 使用強隨機字串
- [ ] CORS_ORIGINS 只包含信任的網域
- [ ] Google Sheets 只分享給 Service Account
- [ ] 前端 .env 檔案不要提交到 Git
- [ ] 定期更換 ADMIN_API_KEY

## 支援

如有問題，請檢查：
1. Worker 日誌：`wrangler tail`
2. Google Sheets API 配額：[Google Cloud Console](https://console.cloud.google.com)
3. Cloudflare Workers 狀態：[Cloudflare Status](https://www.cloudflarestatus.com)

---

**部署完成！** 🎉

您現在有一個完全無伺服器的訂房管理系統。

