# 實作檢查清單

使用此清單確保系統已正確實作所有需求。

## ✅ 核心功能

### 資料表設計
- [x] Bookings 工作表（13 個欄位）
- [x] Inventory 工作表（4 個欄位）
- [x] Settings 工作表（3 個欄位）
- [x] 所有必要欄位都已包含
- [x] updatedAt 欄位用於樂觀鎖

### API 規格

#### Public API
- [x] `GET /api/availability` - 查詢可訂日期
- [x] `POST /api/quote` - 試算價格
- [x] `POST /api/bookings` - 建立訂單（pending 狀態）
- [x] 所有端點回傳正確的資料格式
- [x] 錯誤回應包含 error 和 code

#### Admin API
- [x] `GET /api/admin/bookings` - 查詢訂單（支援過濾）
- [x] `PATCH /api/admin/bookings/:id` - 更新訂單
- [x] `DELETE /api/admin/bookings/:id` - 刪除訂單
- [x] `GET /api/admin/inventory` - 查詢房況
- [x] `PUT /api/admin/inventory/:date` - 更新房況
- [x] `GET /api/admin/settings` - 查詢設定
- [x] `PUT /api/admin/settings` - 更新設定
- [x] 所有端點都需要 x-admin-key

### 架構原則
- [x] 前端不直連 Google API
- [x] 後端使用 Service Account JWT 認證
- [x] REST API 供前後台共用
- [x] 樂觀鎖機制（比對 updatedAt）
- [x] Public / Admin 端點分離

### 安全性
- [x] Private Key 不外洩到前端
- [x] Admin 端點需要 API Key
- [x] 速率限制（60 req/min）
- [x] CORS 設定
- [x] 樂觀鎖防止併發覆蓋

## 🎯 驗收標準

### 1. 前台可訂性檢查
- [ ] 能選擇日期並看到可選/不可選
- [ ] 關房日期正確標示為不可選
- [ ] 已滿日期正確標示為不可選
- [ ] 日期選擇器禁用過去日期

### 2. 訂單建立
- [ ] POST /api/bookings 成功建立 pending 訂單
- [ ] 資料正確寫入 Bookings 工作表
- [ ] 包含所有必要欄位
- [ ] createdAt 和 updatedAt 為 ISO 8601 格式
- [ ] 衝突日期回傳 409

### 3. 後台管理
- [ ] 能載入訂單清單
- [ ] 能依日期區間過濾
- [ ] 能依狀態過濾
- [ ] 修改狀態後正確回寫
- [ ] 修改 totalPrice 後正確回寫
- [ ] 修改 arrivalTime 後正確回寫

### 4. 房況管理
- [ ] 能調整 isClosed 狀態
- [ ] 能調整 capacity
- [ ] 設定後立即影響前台可訂檢核

### 5. 併發測試
- [ ] 同時建立多張同日訂單
- [ ] 最多只允許 capacity 數量
- [ ] 超過者回傳 409 CONFLICT
- [ ] 同時更新同一訂單
- [ ] updatedAt 不符時回傳 409

### 6. 環境設定
- [ ] GOOGLE_SHEETS_ID 已設定
- [ ] GOOGLE_CLIENT_EMAIL 已設定
- [ ] GOOGLE_PRIVATE_KEY 已設定（含換行符號）
- [ ] ADMIN_API_KEY 已設定
- [ ] CORS_ORIGINS 已設定
- [ ] Service Account 已加入 Sheets 共用

## 📋 部署檢查清單

### Google Sheets
- [ ] 試算表已建立
- [ ] 三個工作表已建立（Bookings, Inventory, Settings）
- [ ] 表頭列已設定
- [ ] 預設設定已填入 Settings
- [ ] Service Account 已加入共用（編輯權限）

### Cloudflare Worker
- [ ] Worker 已部署
- [ ] 所有 Secrets 已設定
- [ ] 初始化端點已執行
- [ ] Health check 端點回傳 200
- [ ] API 測試腳本通過

### 前端
- [ ] 前端已建置
- [ ] 部署到 Cloudflare Pages
- [ ] 環境變數已設定
- [ ] 可正常訪問前台
- [ ] 可正常訪問後台

### 網域與 SSL
- [ ] 自訂網域已設定（可選）
- [ ] SSL 憑證已啟用
- [ ] DNS 解析正常

## 🧪 測試案例

### Public API 測試

#### 1. 查詢可訂日期
```bash
curl "https://your-worker.workers.dev/api/availability?from=2024-01-01&to=2024-01-31"
```
**預期結果**: 回傳 30 天的可訂狀態

#### 2. 計算報價
```bash
curl -X POST https://your-worker.workers.dev/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-17",
    "numberOfGuests": 2,
    "useCoupon": true
  }'
```
**預期結果**: 回傳計算後的金額

#### 3. 建立訂單
```bash
curl -X POST https://your-worker.workers.dev/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "王小明",
    "contactPhone": "0912345678",
    "checkInDate": "2024-02-01",
    "checkOutDate": "2024-02-03",
    "numberOfGuests": 2,
    "useCoupon": false,
    "totalPrice": 10000
  }'
```
**預期結果**: 回傳訂單 ID 和狀態

### Admin API 測試

#### 4. 取得訂單列表
```bash
curl https://your-worker.workers.dev/api/admin/bookings \
  -H "x-admin-key: your-admin-key"
```
**預期結果**: 回傳所有訂單

#### 5. 更新訂單狀態
```bash
curl -X PATCH https://your-worker.workers.dev/api/admin/bookings/[booking-id] \
  -H "x-admin-key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }'
```
**預期結果**: 回傳更新後的訂單

#### 6. 更新房況
```bash
curl -X PUT https://your-worker.workers.dev/api/admin/inventory/2024-12-25 \
  -H "x-admin-key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "isClosed": true,
    "capacity": 1,
    "note": "聖誕節休息"
  }'
```
**預期結果**: 回傳更新後的房況

### 併發測試

#### 7. 並發訂單（Python 範例）
```python
import requests
import concurrent.futures

def create_booking():
    response = requests.post(
        'https://your-worker.workers.dev/api/bookings',
        json={
            "guestName": "測試用戶",
            "contactPhone": "0912345678",
            "checkInDate": "2024-03-01",
            "checkOutDate": "2024-03-03",
            "numberOfGuests": 2,
            "useCoupon": false,
            "totalPrice": 10000
        }
    )
    return response.status_code

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    results = list(executor.map(lambda _: create_booking(), range(5)))
    
print(f"成功: {results.count(200)}")
print(f"衝突: {results.count(409)}")
```
**預期結果**: 只有 capacity 數量成功，其餘 409

## 🔍 監控檢查清單

### 日誌
- [ ] Worker 日誌可正常查看（wrangler tail）
- [ ] 錯誤訊息清晰可讀
- [ ] 包含足夠的上下文資訊

### 效能
- [ ] API 回應時間 < 500ms
- [ ] 前端首屏載入 < 2s
- [ ] Google Sheets API 配額充足

### 錯誤處理
- [ ] 所有錯誤都有適當的 HTTP 狀態碼
- [ ] 錯誤訊息對使用者友善
- [ ] 前端正確顯示錯誤訊息

## 📚 文件檢查清單

- [x] DEPLOYMENT.md - 完整部署指南
- [x] QUICKSTART.md - 快速開始指南
- [x] GOOGLE_SHEETS_SETUP.md - Google Sheets 設定
- [x] PROJECT_STRUCTURE.md - 專案架構說明
- [x] worker/README.md - Worker API 文件
- [x] 測試腳本（test-api.sh / test-api.ps1）

## 🚀 上線前最終檢查

- [ ] 所有環境變數使用生產值
- [ ] ADMIN_API_KEY 使用強密碼
- [ ] CORS_ORIGINS 限制為信任網域
- [ ] Google Sheets 權限僅限 Service Account
- [ ] 前端 .env 檔案未提交到 Git
- [ ] 資料庫已備份
- [ ] 監控和日誌已設定
- [ ] 錯誤回報機制已設定
- [ ] 使用者文件已準備

## 📞 緊急應變

### Worker 故障
1. 檢查 Cloudflare 狀態頁面
2. 查看 Worker 日誌
3. 回滾到上一個版本

### Google Sheets API 配額用盡
1. 檢查 Google Cloud Console
2. 升級配額（若需要）
3. 實作快取層（Cloudflare KV）

### 資料遺失
1. 從 Google Sheets 版本記錄還原
2. 從手動備份還原
3. 聯絡支援

---

**所有項目完成後，系統即可正式上線！** 🎉

