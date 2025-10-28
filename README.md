# Booking Manager V2

完整的無伺服器訂房管理系統，使用 Google Sheets 作為資料庫。

## 🌟 特色功能

- ✅ **無伺服器架構** - Cloudflare Workers + Pages
- ✅ **零成本資料庫** - Google Sheets API
- ✅ **前後端分離** - React + RESTful API
- ✅ **多語言支援** - 中文/英文切換
- ✅ **樂觀鎖機制** - 防止並發衝突
- ✅ **速率限制** - 60 req/min per IP
- ✅ **安全認證** - JWT + API Key
- ✅ **即時可訂檢查** - 自動計算房況
- ✅ **響應式設計** - 支援手機/平板/桌面

## 📋 關鍵資訊

- **Google Sheets ID**: `1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw`
- **Service Account**: `booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com`

## 🚀 快速開始

### 5 分鐘部署

```bash
# 1. 設定 Google Sheets（參考 GOOGLE_SHEETS_SETUP.md）

# 2. 部署 Worker
cd worker
npm install
wrangler login
# 設定環境變數（參考 QUICKSTART.md）
npm run deploy

# 3. 部署前端
cd ..
npm install
npm run build
npx wrangler pages deploy dist --project-name=booking-manager
```

完整指南：[QUICKSTART.md](./QUICKSTART.md)

## 📖 文件

| 文件 | 說明 |
|-----|------|
| [QUICKSTART.md](./QUICKSTART.md) | 5 分鐘快速部署指南 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 完整部署流程 |
| [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) | Google Sheets 設定詳解 |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | 專案架構說明 |
| [worker/README.md](./worker/README.md) | Worker API 文件 |
| [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) | 實作檢查清單 |

## 🏗️ 架構

```
前端 (React + Vite)
        ↓
Cloudflare Worker (Hono)
        ↓
Google Sheets API v4
        ↓
Google Sheets (資料庫)
├── Bookings   (訂單)
├── Inventory  (房況)
└── Settings   (設定)
```

## 🛠️ 技術棧

### 前端
- React 19
- React Router DOM 7
- Vite 6
- TypeScript

### 後端
- Cloudflare Workers
- Hono (Web Framework)
- Google Sheets API v4
- WebCrypto (JWT 簽名)

### 部署
- Cloudflare Pages (前端)
- Cloudflare Workers (後端)
- Google Sheets (資料庫)

## 📦 專案結構

```
V2/
├── components/         # React 元件
├── pages/             # 頁面元件
│   ├── BookingPage.tsx      # 前台訂房
│   ├── AdminDashboard.tsx   # 後台管理
│   └── ...
├── services/          # API 服務
│   └── apiService.ts        # API 呼叫封裝
├── worker/            # Cloudflare Worker
│   ├── src/
│   │   ├── handlers/        # API 處理器
│   │   ├── middleware/      # 中間件
│   │   ├── utils/           # 工具函數
│   │   └── index.ts         # Worker 入口
│   └── scripts/             # 測試腳本
├── types.ts           # 類型定義
└── App.tsx            # React 根元件
```

## 🔌 API 端點

### Public API

| 端點 | 方法 | 說明 |
|-----|------|------|
| `/api/availability` | GET | 查詢可訂日期 |
| `/api/quote` | POST | 計算報價 |
| `/api/bookings` | POST | 建立訂單 |

### Admin API（需 x-admin-key）

| 端點 | 方法 | 說明 |
|-----|------|------|
| `/api/admin/bookings` | GET | 查詢訂單 |
| `/api/admin/bookings/:id` | PATCH | 更新訂單 |
| `/api/admin/bookings/:id` | DELETE | 刪除訂單 |
| `/api/admin/inventory/:date` | PUT | 更新房況 |
| `/api/admin/settings` | GET/PUT | 管理設定 |

完整 API 文件：[worker/README.md](./worker/README.md)

## 🧪 測試

### Worker API 測試

**Linux/Mac**:
```bash
cd worker
./scripts/test-api.sh https://your-worker.workers.dev your-admin-key
```

**Windows**:
```powershell
cd worker
.\scripts\test-api.ps1 -WorkerUrl "https://your-worker.workers.dev" -AdminKey "your-admin-key"
```

### 本地開發

**終端 1 - Worker**:
```bash
cd worker
npm run dev  # http://localhost:8787
```

**終端 2 - Frontend**:
```bash
npm run dev  # http://localhost:5173
```

## 🔐 安全性

- ✅ Private Key 存於 Cloudflare Secrets
- ✅ Admin 端點需要 API Key
- ✅ 速率限制（60 req/min）
- ✅ CORS 限制
- ✅ 樂觀鎖機制
- ✅ 輸入驗證

## 💰 成本

| 服務 | 免費額度 | 預估成本 |
|-----|---------|---------|
| Cloudflare Workers | 100K req/day | $0/月 |
| Cloudflare Pages | 無限 | $0/月 |
| Google Sheets API | 500 req/day | $0/月 |
| 網域（可選） | - | ~$1/月 |

**總計**: **~$0-1/月** 🎉

## 📱 功能展示

### 前台（訂房頁面）
- 日曆選擇器（不可選日期自動禁用）
- 即時價格試算
- 表單驗證
- 多語言切換
- 訂單確認

### 後台（管理介面）
- 訂單列表（篩選、排序）
- 訂單狀態管理
- 房況管理（關房、調整容量）
- 價格設定
- 樂觀鎖衝突提示

## 🔄 更新部署

### 更新 Worker
```bash
cd worker
npm run deploy
```

### 更新前端
```bash
npm run build
npx wrangler pages deploy dist
```

## 📊 監控

### Worker 日誌
```bash
cd worker
wrangler tail
```

### 過濾錯誤
```bash
wrangler tail --status error
```

## 🐛 疑難排解

### Worker 無法連接 Google Sheets
1. 確認 Service Account 已加入 Sheets 共用
2. 檢查 Private Key 格式（包含 `\n`）
3. 確認 Sheets ID 正確

### 前端無法呼叫 API
1. 檢查 `VITE_API_BASE_URL` 設定
2. 確認 CORS_ORIGINS 包含前端網域
3. 查看瀏覽器開發者工具

### Admin API 回傳 401
1. 確認 `x-admin-key` header 正確
2. 檢查 Worker Secrets 設定
3. 確認前端 VITE_ADMIN_API_KEY 一致

完整疑難排解：[DEPLOYMENT.md#疑難排解](./DEPLOYMENT.md#疑難排解)

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📝 授權

MIT License - 可自由使用、修改、商用

## 🙏 致謝

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Hono](https://hono.dev/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)

## 📞 支援

- 📖 查看 [文件](./DEPLOYMENT.md)
- 🐛 提交 [Issue](https://github.com/your-repo/issues)
- 💬 討論 [Discussions](https://github.com/your-repo/discussions)

---

**建立日期**: 2024-01-01  
**版本**: 2.0.0  
**狀態**: ✅ Production Ready

⭐ 如果這個專案對你有幫助，請給個星星！
