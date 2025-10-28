# Booking Manager - Cloudflare Worker Backend

這是訂房管理系統的 Cloudflare Worker 後端，使用 Google Sheets 作為資料庫。

## 功能特色

- ✅ Google Sheets API 整合（使用 Service Account）
- ✅ JWT 簽名認證（WebCrypto）
- ✅ RESTful API（Public 和 Admin 端點）
- ✅ CORS 支援
- ✅ 速率限制
- ✅ 樂觀鎖（Optimistic Locking）
- ✅ 並發控制

## 前置需求

1. **Cloudflare 帳號** - [註冊](https://dash.cloudflare.com/sign-up)
2. **Node.js** - v18 或以上
3. **Google Cloud 專案** - 已建立 Service Account

## Google Sheets 設定

### 1. 建立 Google Sheets

在 Google Sheets 建立新試算表，ID 為：`1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw`

### 2. 建立三個工作表

**Bookings（訂單）**
| 欄位名稱 | 說明 |
|---------|------|
| id | 訂單 ID（nanoid） |
| guestName | 顧客姓名 |
| contactPhone | 聯絡電話 |
| lineName | LINE ID（可選） |
| checkInDate | 入住日期（YYYY-MM-DD） |
| checkOutDate | 退房日期（YYYY-MM-DD） |
| numberOfGuests | 人數 |
| useCoupon | 是否使用優惠（TRUE/FALSE） |
| arrivalTime | 抵達時間（HH:mm） |
| totalPrice | 總價 |
| status | 狀態（pending/confirmed/cancelled） |
| createdAt | 建立時間（ISO 8601） |
| updatedAt | 更新時間（ISO 8601） |

**Inventory（存量）**
| 欄位名稱 | 說明 |
|---------|------|
| date | 日期（YYYY-MM-DD） |
| isClosed | 是否關房（TRUE/FALSE） |
| capacity | 容量 |
| note | 備註 |

**Settings（設定）**
| 欄位名稱 | 說明 |
|---------|------|
| key | 設定鍵 |
| value | 設定值 |
| updatedAt | 更新時間（ISO 8601） |

### 3. 共用權限

將 Service Account email 加入 Google Sheets 的共用清單：
```
booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com
```

權限至少需要「編輯者」。

## 安裝

```bash
cd worker
npm install
```

## 環境變數設定

### 開發環境（.dev.vars）

建立 `.dev.vars` 檔案：

```env
GOOGLE_SHEETS_ID=1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw
GOOGLE_CLIENT_EMAIL=booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...your-key-here...\n-----END PRIVATE KEY-----\n"
ADMIN_API_KEY=your-secure-random-key-here
CORS_ORIGINS=http://localhost:5173,https://your-domain.com
```

**注意：** Private Key 需要保留換行符號 `\n`。

### 生產環境（Cloudflare Secrets）

使用 Wrangler CLI 設定 secrets：

```bash
# 設定 Google Sheets ID
wrangler secret put GOOGLE_SHEETS_ID
# 輸入: 1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw

# 設定 Google Client Email
wrangler secret put GOOGLE_CLIENT_EMAIL
# 輸入: booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com

# 設定 Google Private Key（重要：需包含換行符號）
wrangler secret put GOOGLE_PRIVATE_KEY
# 貼上完整的 private key，包含 BEGIN 和 END 標記

# 設定 Admin API Key（建議使用強密碼生成器）
wrangler secret put ADMIN_API_KEY
# 輸入: 一個強隨機字串

# 設定 CORS Origins（可選）
wrangler secret put CORS_ORIGINS
# 輸入: https://your-frontend-domain.com,https://admin.your-domain.com
```

## 本地開發

```bash
npm run dev
```

Worker 會在 `http://localhost:8787` 啟動。

## 部署

```bash
npm run deploy
```

## API 端點

### Public API（無需認證）

#### GET `/api/availability`
查詢可訂日期

**Query Parameters:**
- `from`: 開始日期（YYYY-MM-DD）
- `to`: 結束日期（YYYY-MM-DD）

**Response:**
```json
[
  {
    "date": "2024-01-01",
    "isClosed": false,
    "capacity": 1,
    "bookedCount": 0,
    "available": true
  }
]
```

#### POST `/api/quote`
計算報價

**Body:**
```json
{
  "checkInDate": "2024-01-01",
  "checkOutDate": "2024-01-03",
  "numberOfGuests": 2,
  "useCoupon": true
}
```

**Response:**
```json
{
  "nights": 2,
  "basePrice": 10000,
  "discount": 500,
  "total": 9500
}
```

#### POST `/api/bookings`
建立訂單

**Body:**
```json
{
  "guestName": "王小明",
  "contactPhone": "0912345678",
  "lineName": "wangxiaoming",
  "checkInDate": "2024-01-01",
  "checkOutDate": "2024-01-03",
  "numberOfGuests": 2,
  "useCoupon": true,
  "arrivalTime": "15:00",
  "totalPrice": 9500
}
```

**Response:**
```json
{
  "id": "booking_abc123",
  "status": "pending"
}
```

### Admin API（需要 x-admin-key header）

所有 Admin API 都需要在 header 加入：
```
x-admin-key: your-admin-api-key
```

#### GET `/api/admin/bookings`
取得訂單列表

**Query Parameters:**
- `from`: 開始日期（可選）
- `to`: 結束日期（可選）
- `status`: pending/confirmed/cancelled（可選）

#### PATCH `/api/admin/bookings/:id`
更新訂單

**Body:**
```json
{
  "status": "confirmed",
  "totalPrice": 10000,
  "arrivalTime": "16:00",
  "updatedAt": "2024-01-01T10:00:00.000Z"
}
```

**注意：** `updatedAt` 必須提供，用於樂觀鎖檢查。

#### DELETE `/api/admin/bookings/:id`
刪除訂單

#### GET `/api/admin/inventory`
取得房況

#### PUT `/api/admin/inventory/:date`
更新房況

**Body:**
```json
{
  "isClosed": false,
  "capacity": 1,
  "note": "維護中"
}
```

#### GET `/api/admin/settings`
取得設定

#### PUT `/api/admin/settings`
更新設定

**Body:**
```json
{
  "key": "nightlyPriceDefault",
  "value": "6000"
}
```

### 初始化

#### POST `/api/admin/initialize`
初始化 Google Sheets（建立表頭和預設設定）

需要 Admin 認證。首次部署後執行一次。

## 錯誤處理

所有錯誤回應格式：
```json
{
  "error": "錯誤訊息",
  "code": "ERROR_CODE"
}
```

錯誤代碼：
- `BAD_REQUEST` - 400：請求參數錯誤
- `UNAUTHORIZED` - 401：未授權
- `NOT_FOUND` - 404：資源不存在
- `CONFLICT` - 409：資料衝突（日期已滿、樂觀鎖失敗）
- `INTERNAL_ERROR` - 500：伺服器錯誤

## 安全性

1. **私鑰保護**：Private Key 只存在 Cloudflare Secrets，不會外洩到前端
2. **Admin 認證**：所有寫入操作需要 API Key
3. **速率限制**：每 IP 每分鐘 60 次請求
4. **樂觀鎖**：防止並發更新衝突
5. **CORS**：限制允許的來源網域

## 監控

```bash
# 查看 Worker 日誌
wrangler tail

# 查看部署狀態
wrangler deployments list
```

## 疑難排解

### 認證失敗

確認：
1. Private Key 格式正確，包含 `\n` 換行符號
2. Service Account 有 Google Sheets 的編輯權限
3. Sheets ID 正確

### CORS 錯誤

設定 `CORS_ORIGINS` 包含前端網域，或使用 `*` 允許所有來源（不建議正式環境）。

### 速率限制

調整 `worker/src/middleware/rateLimit.ts` 中的限制參數。

## 授權

MIT License

