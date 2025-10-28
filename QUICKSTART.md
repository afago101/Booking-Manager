# 快速開始指南

從零開始建立訂房管理系統，5 步完成！

## 前置需求

- Node.js 18+
- Cloudflare 帳號
- Google Cloud 專案（已建立 Service Account）

## 🚀 5 分鐘快速部署

### 步驟 1：準備 Google Sheets（1 分鐘）

1. 開啟此 Google Sheets：
   ```
   https://docs.google.com/spreadsheets/d/1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw/edit
   ```

2. 建立三個工作表（分頁）：
   - `Bookings`
   - `Inventory`
   - `Settings`

3. 點擊「共用」，新增：
   ```
   booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com
   ```
   權限設為「編輯者」

📖 詳細設定請參考：[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)

### 步驟 2：部署 Worker（2 分鐘）

```bash
# 1. 安裝依賴
cd worker
npm install

# 2. 登入 Cloudflare
wrangler login

# 3. 設定環境變數
wrangler secret put GOOGLE_SHEETS_ID
# 輸入: 1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw

wrangler secret put GOOGLE_CLIENT_EMAIL
# 輸入: booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com

wrangler secret put GOOGLE_PRIVATE_KEY
# 貼上完整的 private key

wrangler secret put ADMIN_API_KEY
# 輸入: 自己產生的強密碼

wrangler secret put CORS_ORIGINS
# 輸入: *

# 4. 部署
npm run deploy

# 5. 初始化 Sheets
curl -X POST https://your-worker-url.workers.dev/api/admin/initialize \
  -H "x-admin-key: your-admin-key"
```

### 步驟 3：設定前端（1 分鐘）

在專案根目錄建立 `.env.production`：

```env
VITE_API_BASE_URL=https://your-worker-url.workers.dev/api
VITE_ADMIN_API_KEY=your-admin-key
```

### 步驟 4：建置前端（30 秒）

```bash
cd ..
npm install
npm run build
```

### 步驟 5：部署前端（30 秒）

```bash
npx wrangler pages deploy dist --project-name=booking-manager
```

## ✅ 完成！

訪問您的網站：
- 前台：`https://booking-manager.pages.dev`
- 後台：`https://booking-manager.pages.dev/#/admin/login`

## 🧪 測試 API

```bash
# 健康檢查
curl https://your-worker-url.workers.dev/api/health

# 查詢可訂日期
curl "https://your-worker-url.workers.dev/api/availability?from=2024-01-01&to=2024-01-31"

# 計算報價
curl -X POST https://your-worker-url.workers.dev/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-17",
    "numberOfGuests": 2,
    "useCoupon": true
  }'

# 建立測試訂單
curl -X POST https://your-worker-url.workers.dev/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "測試用戶",
    "contactPhone": "0912345678",
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-17",
    "numberOfGuests": 2,
    "useCoupon": false,
    "totalPrice": 10000
  }'
```

## 📚 更多資源

- [完整部署指南](./DEPLOYMENT.md) - 詳細的部署步驟
- [Google Sheets 設定](./GOOGLE_SHEETS_SETUP.md) - 試算表設定說明
- [Worker API 文件](./worker/README.md) - API 端點說明

## 🐛 常見問題

### Worker 無法連接 Google Sheets

確認：
1. Service Account 已加入 Sheets 共用
2. Private Key 格式正確（包含 `\n`）
3. 等待 1-2 分鐘讓權限生效

### 前端無法呼叫 API

確認：
1. `VITE_API_BASE_URL` 正確
2. CORS_ORIGINS 包含前端網址或設為 `*`
3. 瀏覽器開發者工具查看錯誤訊息

### Admin 登入失敗

確認：
1. `x-admin-key` header 正確
2. Worker 的 ADMIN_API_KEY 已設定
3. 前端 VITE_ADMIN_API_KEY 與 Worker 一致

## 🔧 本地開發

### Worker 本地開發

```bash
cd worker

# 建立 .dev.vars
cat > .dev.vars << EOF
GOOGLE_SHEETS_ID=1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw
GOOGLE_CLIENT_EMAIL=booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_API_KEY=test-key
CORS_ORIGINS=*
EOF

# 啟動開發伺服器
npm run dev
```

### 前端本地開發

```bash
# 建立 .env.local
cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:8787/api
VITE_ADMIN_API_KEY=test-key
EOF

# 啟動開發伺服器
npm run dev
```

同時開啟兩個終端，Worker 在 `http://localhost:8787`，前端在 `http://localhost:5173`。

## 🎯 下一步

1. **自訂網域**：在 Cloudflare 設定自己的網域
2. **調整價格**：在 Google Sheets Settings 修改房價
3. **設定房況**：在 Inventory 新增關房日期
4. **測試訂單**：建立測試訂單並在後台管理
5. **備份資料**：設定定期匯出 Google Sheets

## 💡 技巧

### 快速更新 Worker

```bash
cd worker && npm run deploy && cd ..
```

### 快速更新前端

```bash
npm run build && npx wrangler pages deploy dist
```

### 查看 Worker 即時日誌

```bash
cd worker && wrangler tail
```

### 生成強密碼（Admin Key）

```bash
openssl rand -hex 32
```

---

有問題？檢查完整的 [DEPLOYMENT.md](./DEPLOYMENT.md) 或 Worker 日誌。

