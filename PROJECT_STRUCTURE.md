# 專案架構說明

本專案為完整的無伺服器訂房管理系統，採用前後端分離架構。

## 技術棧

### 前端
- **框架**: React 19
- **路由**: React Router DOM 7
- **建置工具**: Vite 6
- **語言**: TypeScript
- **UI**: 自訂 CSS（可擴充為 Tailwind CSS）

### 後端
- **平台**: Cloudflare Workers
- **框架**: Hono (輕量級 Web 框架)
- **語言**: TypeScript
- **認證**: JWT (RS256) for Google Service Account

### 資料庫
- **主要**: Google Sheets (作為 Single Source of Truth)
- **優點**:
  - 零成本
  - 視覺化編輯
  - 版本控制（內建）
  - 易於備份
  - 無需資料庫伺服器

## 專案結構

```
V2/
├── components/              # React 元件
│   ├── BookingForm.tsx     # 訂房表單
│   ├── Calendar.tsx        # 日曆選擇器
│   └── ...
├── contexts/               # React Context
│   └── LanguageContext.tsx # 多語言支援
├── pages/                  # 頁面元件
│   ├── BookingPage.tsx     # 前台訂房頁
│   ├── AdminDashboard.tsx  # 後台管理
│   ├── AdminLoginPage.tsx  # 後台登入
│   ├── ConfirmationPage.tsx# 訂單確認
│   └── LookupPage.tsx      # 訂單查詢
├── services/               # API 服務層
│   ├── apiService.ts       # API 呼叫封裝
│   └── mockDb.ts          # Mock 資料（開發用）
├── utils/                  # 工具函數
├── worker/                 # Cloudflare Worker 後端
│   ├── src/
│   │   ├── handlers/       # API 端點處理器
│   │   │   ├── public.ts   # 公開 API
│   │   │   └── admin.ts    # 管理 API
│   │   ├── middleware/     # 中間件
│   │   │   ├── auth.ts     # 認證
│   │   │   ├── cors.ts     # CORS
│   │   │   └── rateLimit.ts# 速率限制
│   │   ├── utils/          # 工具函數
│   │   │   ├── jwt.ts      # JWT 簽名
│   │   │   ├── sheets.ts   # Google Sheets API
│   │   │   └── helpers.ts  # 輔助函數
│   │   ├── types.ts        # 類型定義
│   │   └── index.ts        # Worker 入口
│   ├── scripts/            # 測試腳本
│   │   ├── test-api.sh     # Unix/Linux
│   │   └── test-api.ps1    # Windows
│   ├── package.json
│   ├── tsconfig.json
│   ├── wrangler.toml       # Cloudflare 設定
│   └── README.md
├── server/                 # 舊版 Express 伺服器（已淘汰）
├── App.tsx                 # React 根元件
├── types.ts                # 共用類型定義
├── index.tsx               # 前端入口
├── vite.config.ts          # Vite 設定
├── package.json
├── tsconfig.json
├── DEPLOYMENT.md           # 完整部署指南
├── QUICKSTART.md           # 快速開始指南
├── GOOGLE_SHEETS_SETUP.md  # Google Sheets 設定
└── PROJECT_STRUCTURE.md    # 本文件
```

## 資料流

```
使用者
  ↓
前端 (React SPA)
  ↓ fetch API
Cloudflare Worker
  ↓ Google Sheets API v4
Google Sheets
  ├── Bookings (訂單)
  ├── Inventory (房況)
  └── Settings (設定)
```

## API 架構

### Public API（無認證）
- `GET /api/availability` - 查詢可訂日期
- `POST /api/quote` - 計算報價
- `POST /api/bookings` - 建立訂單

### Admin API（需 x-admin-key）
- `GET /api/admin/bookings` - 查詢訂單
- `PATCH /api/admin/bookings/:id` - 更新訂單
- `DELETE /api/admin/bookings/:id` - 刪除訂單
- `GET /api/admin/inventory` - 查詢房況
- `PUT /api/admin/inventory/:date` - 更新房況
- `GET /api/admin/settings` - 查詢設定
- `PUT /api/admin/settings` - 更新設定

## 安全機制

### 1. 認證與授權
- **Public API**: 無需認證，但有速率限制
- **Admin API**: 需要 `x-admin-key` header
- **Service Account**: 使用 JWT (RS256) 認證 Google API

### 2. 速率限制
- 每 IP 每分鐘 60 次請求
- 使用 Worker 內建的 in-memory store
- 可升級為 Cloudflare Durable Objects

### 3. 樂觀鎖 (Optimistic Locking)
- 所有更新操作需提供 `updatedAt`
- 防止並發更新覆蓋資料
- 衝突時回傳 409 CONFLICT

### 4. CORS
- 可設定允許的來源網域
- 支援 preflight requests
- 開發環境可設為 `*`

### 5. 私鑰保護
- Google Private Key 存於 Cloudflare Secrets
- 不會外洩到前端
- Worker 使用 WebCrypto 簽署 JWT

## 資料庫設計

### Bookings（訂單）
- **主鍵**: id (nanoid)
- **索引**: checkInDate, status
- **關聯**: 無（扁平結構）

### Inventory（房況）
- **主鍵**: date
- **用途**: 標記關房日期、調整容量
- **預設**: 未記錄的日期使用 Settings.defaultCapacity

### Settings（設定）
- **主鍵**: key
- **常用設定**:
  - `nightlyPriceDefault`: 平日房價
  - `weekendPriceDefault`: 週末房價
  - `couponDiscount`: 優惠券折扣
  - `defaultCapacity`: 預設容量

## 狀態管理

### 前端狀態
- **Local State**: React useState (表單、UI 狀態)
- **Context**: LanguageContext (多語言)
- **Server State**: 直接從 API fetch（無快取層）

### 後端狀態
- **無狀態**: Worker 本身無狀態
- **資料來源**: Google Sheets（唯一真相）
- **快取**: Access Token 快取（58 分鐘）

## 並發控制

### 訂單建立
1. 檢查日期可用性
2. 計算已訂數量
3. 比對容量
4. 寫入（若未超額）
5. 回傳結果或 409 CONFLICT

### 訂單更新
1. 讀取現有資料
2. 檢查 `updatedAt` 是否匹配
3. 更新資料
4. 更新 `updatedAt`
5. 回傳結果或 409 CONFLICT

## 效能考量

### 前端
- **建置**: Vite 快速建置
- **路由**: Hash Router（適合靜態託管）
- **懶載入**: 可在 Route 層級加入（未實作）

### 後端
- **冷啟動**: < 50ms（Cloudflare Workers）
- **回應時間**: < 200ms（含 Google API）
- **並發**: 無限制（Cloudflare 自動擴展）

### 資料庫
- **讀取**: 100-200ms (Google Sheets API)
- **寫入**: 200-300ms
- **配額**: 每日 500 次請求（Service Account）

## 部署策略

### 前端
- **主機**: Cloudflare Pages
- **CDN**: 全球邊緣節點
- **SSL**: 自動 HTTPS
- **建置**: Git push 自動觸發

### 後端
- **主機**: Cloudflare Workers
- **部署**: `wrangler deploy`
- **版本**: 支援多版本 rollback
- **監控**: `wrangler tail` 即時日誌

## 擴展性

### 垂直擴展（功能）
- [ ] 多房型支援
- [ ] 動態定價（Prices 工作表）
- [ ] Email 通知（SendGrid/Resend）
- [ ] LINE 通知整合
- [ ] 付款整合（Stripe/綠界）
- [ ] 多語言完整支援

### 水平擴展（效能）
- [ ] 資料快取（Cloudflare KV）
- [ ] 全文搜尋（Algolia/Meilisearch）
- [ ] Audit Log（專屬工作表）
- [ ] 分析儀表板（Google Analytics）

### 資料庫遷移（若需要）
- [ ] 遷移至 Cloudflare D1（SQLite）
- [ ] 遷移至 Supabase（PostgreSQL）
- [ ] 遷移至 Airtable（類 Sheets）

## 開發工作流

### 本地開發
```bash
# Terminal 1: Worker
cd worker
npm run dev  # http://localhost:8787

# Terminal 2: Frontend
npm run dev  # http://localhost:5173
```

### 測試
```bash
# Worker API 測試
cd worker
./scripts/test-api.sh http://localhost:8787 test-key

# 或 Windows
.\scripts\test-api.ps1 -WorkerUrl "http://localhost:8787" -AdminKey "test-key"
```

### 部署
```bash
# Worker
cd worker && npm run deploy

# Frontend
npm run build && npx wrangler pages deploy dist
```

## 監控與維護

### 日誌
```bash
# Worker 即時日誌
cd worker && wrangler tail

# 過濾錯誤
wrangler tail --status error
```

### 備份
- Google Sheets 版本記錄（自動）
- 手動匯出 Excel（每週）
- Git 版本控制（程式碼）

### 更新
- Cloudflare Workers: 無中斷更新
- Cloudflare Pages: 原子性部署
- Google Sheets: 即時生效

## 成本分析

| 服務 | 免費額度 | 收費標準 | 預估成本（小型民宿） |
|-----|---------|---------|-------------------|
| Cloudflare Workers | 100K req/day | $5/10M req | $0/月 |
| Cloudflare Pages | 無限 | $0 | $0/月 |
| Google Sheets API | 500 req/day | N/A | $0/月 |
| 網域 | - | $10-15/年 | $1.25/月 |
| **總計** | - | - | **~$1.25/月** |

## 授權

MIT License - 可自由使用、修改、商用

---

**更新日期**: 2024-01-01
**版本**: 2.0.0
**作者**: Booking Manager Team

