# LINE 會員資料沒有同步 - 問題診斷與解決

## 🔍 可能的問題

### 問題 1: LIFF 設定缺失

**症狀：** 從 LINE 進入時無法取得使用者資訊

**原因：**
- `VITE_LINE_LIFF_ID` 環境變數未設定
- LIFF 初始化失敗，fallback 到 OAuth 但 OAuth 也需要正確設定

**解決方法：**

#### 方法 A: 設定 LIFF App（推薦）

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇 Channel ID `2008398150`
3. 進入 **「LIFF」** 標籤
4. 點擊 **「Add」** 建立新的 LIFF App
5. 設定：
   - **App name**: `Booking Manager`
   - **Size**: `Full`
   - **Endpoint URL**: `https://blessing-haven.marcux.uk`
   - **Scope**: `profile`, `openid`（如果需要 email）
6. 取得 **LIFF ID**（格式：`1234567890-abcdefgh`）

7. 在 Cloudflare Pages Dashboard 設定環境變數：
   - `VITE_LINE_LIFF_ID` = 您的 LIFF ID

#### 方法 B: 使用 OAuth（如果不想設定 LIFF）

1. 確認 `VITE_LINE_CHANNEL_ID` 已設定（`2008398150`）
2. 確認 LINE Developers Console 的 Callback URL 已正確設定

---

### 問題 2: LINE Developers Console Callback URL 未設定

**症狀：** OAuth 登入失敗

**檢查步驟：**

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇 Channel ID `2008398150`
3. 進入 **「LINE Login settings」**
4. 確認 **「Callback URL」** 有以下三個 URL（每行一個）：

```
https://blessing-haven.marcux.uk/booking
https://blessing-haven.marcux.uk/confirmation
https://blessing-haven.marcux.uk/
```

**⚠️ 重要：**
- URL **不能包含 hash** (`#`)
- 必須是 **HTTPS**
- 沒有多餘的斜線（除了根路徑 `/`）

---

### 問題 3: 前端環境變數未設定

**症狀：** 前端無法取得 Channel ID

**檢查步驟：**

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇「Pages」→ 專案「booking-manager」
3. 進入 **「Settings」** → **「Environment variables」**
4. 確認有以下變數：

**Production 環境：**
- `VITE_API_BASE_URL` = `https://booking-api-public.afago101.workers.dev/api`
- `VITE_LINE_CHANNEL_ID` = `2008398150`
- `VITE_LINE_LIFF_ID` = （如果有 LIFF App，填入 LIFF ID）

5. **重要：** 設定後需要**重新建置和部署**前端

---

### 問題 4: Google Sheets 權限問題

**症狀：** API 呼叫成功但資料沒有寫入 Sheets

**檢查步驟：**

1. 開啟 Google Sheets
2. 確認 Service Account email 有編輯權限：
   - `booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com`
3. 確認 `Customer_Profile` 工作表存在
4. 檢查工作表欄位是否正確：
   ```
   lineUserId | guestName | contactPhone | email | lineName | totalNights | totalBookings | createdAt | updatedAt
   ```

---

### 問題 5: 瀏覽器 Console 錯誤

**診斷步驟：**

1. 開啟瀏覽器開發者工具（F12）
2. 進入 **Console** 標籤
3. 從 LINE 進入訂房頁面
4. 查看是否有錯誤訊息

**常見錯誤：**
- `LIFF init failed` → LIFF ID 錯誤或未設定
- `LINE Channel ID not configured` → 環境變數未設定
- `Failed to exchange OAuth code` → Callback URL 未設定
- `CORS error` → CORS_ORIGINS 未設定

---

## 🧪 診斷測試

### 測試 1: 檢查後端 API

```powershell
# 測試健康檢查
$health = Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/health"
Write-Host "Health: $($health.status)"

# 測試 LINE Config
$config = Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/line/config"
Write-Host "Channel ID: $($config.channelId)"
```

**預期結果：**
- Health 應返回 `ok`
- Channel ID 應返回 `2008398150`

### 測試 2: 檢查前端環境變數

在瀏覽器 Console 執行：
```javascript
console.log('Channel ID:', import.meta.env.VITE_LINE_CHANNEL_ID);
console.log('LIFF ID:', import.meta.env.VITE_LINE_LIFF_ID);
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
```

### 測試 3: 手動測試同步 API

```powershell
$body = @{
    lineUserId = "test_user_123"
    name = "測試使用者"
    picture = "https://example.com/picture.jpg"
    guestName = "測試姓名"
    contactPhone = "0912345678"
    email = "test@example.com"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "https://booking-api-public.afago101.workers.dev/api/line/sync-profile" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing

Write-Host "Status: $($response.StatusCode)"
$response.Content
```

---

## 🔧 快速修復步驟

### 步驟 1: 檢查並設定 LINE Developers Console

1. ✅ 確認 Callback URL 已設定（三個 URL）
2. ✅ 確認使用的是 Channel ID `2008398150`
3. ✅ 建立 LIFF App（可選，但建議）

### 步驟 2: 設定前端環境變數

在 Cloudflare Pages Dashboard：
1. ✅ `VITE_API_BASE_URL` = `https://booking-api-public.afago101.workers.dev/api`
2. ✅ `VITE_LINE_CHANNEL_ID` = `2008398150`
3. ✅ `VITE_LINE_LIFF_ID` = （如果有 LIFF App）
4. ✅ **觸發重新建置**

### 步驟 3: 檢查 Google Sheets

1. ✅ Service Account 有編輯權限
2. ✅ `Customer_Profile` 工作表存在
3. ✅ 欄位結構正確

### 步驟 4: 檢查瀏覽器 Console

1. 開啟開發者工具（F12）
2. 查看 Console 是否有錯誤
3. 記錄錯誤訊息以便進一步診斷

---

## 📋 檢查清單

- [ ] LINE Developers Console Callback URL 已設定（三個 URL）
- [ ] 使用正確的 Channel ID (`2008398150`)
- [ ] 前端環境變數已設定：
  - [ ] `VITE_API_BASE_URL`
  - [ ] `VITE_LINE_CHANNEL_ID`
  - [ ] `VITE_LINE_LIFF_ID`（如果有 LIFF App）
- [ ] 前端已重新建置和部署（設定環境變數後）
- [ ] Google Sheets Service Account 有編輯權限
- [ ] `Customer_Profile` 工作表存在
- [ ] 瀏覽器 Console 沒有錯誤

---

## 🔍 需要提供的資訊

如果問題仍未解決，請提供：

1. **瀏覽器 Console 錯誤訊息**（F12 → Console）
2. **Network 標籤**中的 API 請求回應（F12 → Network）
3. **LINE Developers Console 設定截圖**（Callback URL 和 LIFF 設定）
4. **Cloudflare Pages 環境變數設定截圖**
5. **測試流程**：
   - 從哪裡進入（LINE App 或一般瀏覽器）
   - 執行了什麼操作
   - 預期看到什麼
   - 實際看到什麼

---

**最後更新：** 2025-01-XX

