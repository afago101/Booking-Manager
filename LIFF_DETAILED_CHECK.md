# LIFF 詳細檢查報告

## 📋 已確認的 LIFF 資訊

根據您提供的截圖：

- ✅ **LIFF ID**: `2008398150-kRq2E2Ro`
- ✅ **LIFF URL**: `https://liff.line.me/2008398150-kRq2E2Ro`

---

## 🔍 需要檢查的 LIFF 設定項目

### 1. Endpoint URL（最重要！）

**需要檢查：**
- 在 LINE Developers Console 中，LIFF App 的 **Endpoint URL** 設定值是什麼？

**正確設定應該是：**
```
https://blessing-haven.marcux.uk
```

**⚠️ 常見錯誤：**
- ❌ `https://blessing-haven.marcux.uk/booking`（包含 path）
- ❌ `https://blessing-haven.marcux.uk/#/booking`（包含 hash）
- ❌ `https://xxx.pages.dev/booking`（使用 Cloudflare Pages 預設網域）

**檢查方法：**
1. 前往 LINE Developers Console
2. 選擇 Provider → LINE Login Channel (2008398150) → LIFF
3. 點擊您的 LIFF App
4. 查看 **Endpoint URL** 欄位

**如果設定錯誤，需要修改：**
1. 點擊 **Edit** 或 **編輯**
2. 將 Endpoint URL 改為：`https://blessing-haven.marcux.uk`
3. **不要包含任何 path 或 hash**
4. 點擊 **Save** 或 **儲存**

---

### 2. Scope（權限範圍）

**需要檢查：**
- Scope 是否包含 `profile`？
- Scope 是否包含 `openid`？（建議）

**正確設定應該是：**
- ✅ **`profile`**（必選）- 取得使用者基本資訊（姓名、頭像）
- ✅ **`openid`**（建議）- 取得真正的 LINE User ID

**檢查方法：**
1. 在 LIFF App 設定頁面
2. 查看 **Scope** 或 **權限範圍** 區塊
3. 確認至少勾選了 `profile`

**如果缺少 scope，需要修改：**
1. 點擊 **Edit**
2. 勾選 `profile` 和 `openid`
3. 點擊 **Save**

---

### 3. Size（應用程式大小）

**建議設定：**
- ✅ **`Full`**（全螢幕）- 提供最佳使用者體驗

**其他選項：**
- `Tall` - 高版型（較小視窗）
- `Compact` - 緊湊型（最小視窗）

**檢查方法：**
在 LIFF App 設定頁面查看 **Size** 欄位

---

### 4. Bot link feature（機器人連結功能）

**選項：**
- **On (Normal)** - 開啟（正常）- 可以與 LINE 官方帳號綁定
- **Off** - 關閉

**建議：**
- 如果使用 LINE 官方帳號選單，建議開啟

---

## 🔧 環境變數檢查

### 需要確認的環境變數

**在 Cloudflare Pages Dashboard 中檢查：**

1. 前往：https://dash.cloudflare.com
2. 選擇「Pages」→「booking-manager」
3. 進入「Settings」→「Environment variables」
4. 確認以下環境變數：

| 環境變數 | 應該的值 | 狀態 |
|---------|---------|------|
| `VITE_LINE_LIFF_ID` | `2008398150-kRq2E2Ro` | ⚠️ 需要確認 |
| `VITE_LINE_CHANNEL_ID` | `2008398150` | ⚠️ 需要確認 |
| `VITE_API_BASE_URL` | `https://booking-api-public.afago101.workers.dev/api` | ⚠️ 需要確認 |

**如果 `VITE_LINE_LIFF_ID` 未設定或值不正確：**
1. 點擊「Add variable」或編輯現有變數
2. Name: `VITE_LINE_LIFF_ID`
3. Value: `2008398150-kRq2E2Ro`
4. Environment: **Production**（重要！）
5. 點擊「Save」
6. **必須重新部署前端才會生效**

---

## 💻 代碼檢查

### 已確認的代碼邏輯

✅ **LIFF 初始化邏輯** (`utils/lineLogin.ts:18-184`)
- 正確讀取 `VITE_LINE_LIFF_ID` 環境變數
- 正確檢測 LINE 環境
- 正確載入 LIFF SDK
- 正確初始化 LIFF

✅ **取得 LINE Profile 邏輯** (`utils/lineLogin.ts:207-303`)
- 正確檢查登入狀態
- 正確觸發自動登入
- 正確取得使用者資訊

✅ **訂房頁整合** (`pages/BookingPage.tsx:239-342`)
- 正確檢測 LINE 環境
- 正確初始化 LIFF
- 正確同步客戶資料

### 代碼邏輯沒有問題 ✅

---

## 🧪 測試檢查清單

### 測試 1: 從 LINE App 打開訂房頁

**步驟：**
1. 在 LINE App 中打開您的官方帳號
2. 點擊選單中的訂房連結
3. 應該自動打開訂房頁面

**預期行為：**
- ✅ 頁面正常載入
- ✅ 自動顯示 LINE 使用者資訊（如果已授權）
- ✅ 自動同步客戶資料到 Google Sheets

**檢查後台日誌：**
在後台「服務日誌」中應該看到：
- `liff_init_start`
- `liff_init_success`
- `liff_profile_received`
- `booking_page_liff_success`
- `booking_page_profile_synced`

### 測試 2: 檢查 Console 日誌（如果可能）

**從 LINE App 打開訂房頁時，Console 應該顯示：**

```
[LIFF] Starting initialization...
[LIFF] LINE_LIFF_ID: 2008398150...（應該是這個值，不能是 "not set"）
[LIFF] LINE_CHANNEL_ID: 2008398150
[LIFF] User agent: ...（應該包含 "Line" 或 "LINE"）
[LIFF] Is in LINE app: true
[LIFF] Loading LIFF SDK...
[LIFF] LIFF SDK script loaded
[LIFF] Initializing with LIFF ID: 2008398150...
[LIFF] LIFF initialized successfully
[LIFF] Starting getLineProfile...
[LIFF] LIFF loaded, checking login status...
[LIFF] isInClient: true
[LIFF] isLoggedIn: true（或 false）
[LIFF] Getting profile...
[LIFF] Profile received: { userId: "...", displayName: "..." }
[BookingPage] LINE user loaded: { lineUserId: "...", name: "..." }
[BookingPage] Syncing customer profile to Sheets...
[BookingPage] Customer profile synced successfully
```

### 測試 3: 檢查 Google Sheets

**步驟：**
1. 打開 Google Sheets
2. 進入 `Customer_Profile` 工作表
3. 查看是否有新的記錄

**確認項目：**
- ✅ 有新的記錄
- ✅ `lineUserId` 欄位有值（不是空的）
- ✅ `lineName` 欄位有值
- ✅ `updatedAt` 欄位是最新的時間戳記

---

## 🔴 常見問題診斷

### 問題 1: LIFF 初始化失敗

**錯誤訊息：**
```
[LIFF] LIFF init failed: ...
```

**可能原因：**
1. **Endpoint URL 設定錯誤**（最常見）
   - Endpoint URL 包含 path（例如 `/booking`）
   - Endpoint URL 包含 hash（例如 `#/booking`）
   - Endpoint URL 使用錯誤的網域

2. **LIFF ID 錯誤**
   - `VITE_LINE_LIFF_ID` 環境變數值不正確
   - 環境變數未設定

**解決方法：**
1. 檢查並修正 Endpoint URL（必須是 `https://blessing-haven.marcux.uk`）
2. 檢查 `VITE_LINE_LIFF_ID` 環境變數（必須是 `2008398150-kRq2E2Ro`）
3. 重新部署前端

---

### 問題 2: 無法取得使用者資訊

**錯誤訊息：**
```
[LIFF] Not logged in and not in LINE client
```

**可能原因：**
1. **Scope 設定不完整**
   - 沒有勾選 `profile` scope
   - 使用者未授權

2. **使用者未登入 LINE**
   - 在 LINE App 中需要登入 LINE 帳號

**解決方法：**
1. 確認 LIFF App 的 Scope 包含 `profile`
2. 確認使用者在 LINE App 中已登入
3. 嘗試重新授權

---

### 問題 3: 環境變數未生效

**症狀：**
- 設定了 `VITE_LINE_LIFF_ID` 但前端顯示 "not set"

**可能原因：**
1. **環境變數設定在錯誤的環境**
   - 設定在 Preview 而不是 Production
   - 設定在 Development 而不是 Production

2. **未重新部署**
   - 環境變數設定後需要重新部署才會生效

**解決方法：**
1. 確認環境變數設定在 **Production** 環境
2. 重新部署前端：
   - 在 Cloudflare Pages Dashboard → Deployments → Retry deployment
   - 或使用命令列重新部署

---

### 問題 4: LIFF ID 顯示 "not set"

**錯誤訊息：**
```
[LIFF] LINE_LIFF_ID: not set
```

**可能原因：**
1. `VITE_LINE_LIFF_ID` 環境變數未設定
2. 環境變數名稱錯誤（應該是 `VITE_LINE_LIFF_ID`）
3. 環境變數設定在錯誤的環境

**解決方法：**
1. 檢查 Cloudflare Pages 環境變數
2. 確認變數名稱是 `VITE_LINE_LIFF_ID`
3. 確認值為 `2008398150-kRq2E2Ro`
4. 確認設定在 **Production** 環境
5. 重新部署

---

## ✅ 完整檢查清單

### LINE Developers Console 設定
- [ ] LIFF ID: `2008398150-kRq2E2Ro` ✅（已確認）
- [ ] Endpoint URL: `https://blessing-haven.marcux.uk`（不含 path，不含 hash）⚠️ **需要確認**
- [ ] Scope: 包含 `profile` ⚠️ **需要確認**
- [ ] Scope: 包含 `openid`（建議）⚠️ **需要確認**
- [ ] Size: `Full`（建議）⚠️ **需要確認**

### Cloudflare Pages 環境變數
- [ ] `VITE_LINE_LIFF_ID` = `2008398150-kRq2E2Ro` ⚠️ **需要確認**
- [ ] `VITE_LINE_CHANNEL_ID` = `2008398150` ⚠️ **需要確認**
- [ ] `VITE_API_BASE_URL` = `https://booking-api-public.afago101.workers.dev/api` ⚠️ **需要確認**
- [ ] 所有變數設定在 **Production** 環境 ⚠️ **需要確認**

### 部署狀態
- [ ] 環境變數設定後已重新部署前端 ⚠️ **需要確認**

### 測試結果
- [ ] 從 LINE App 打開訂房頁能正常載入
- [ ] 能自動取得 LINE 使用者資訊
- [ ] 能自動同步客戶資料到 Google Sheets
- [ ] 後台日誌顯示 LIFF 相關日誌正常

---

## 🎯 下一步行動

### 立即檢查項目：

1. **檢查 Endpoint URL**（最重要）
   - 在 LINE Developers Console 中確認
   - 必須是 `https://blessing-haven.marcux.uk`（不含 path）

2. **檢查環境變數**
   - 在 Cloudflare Pages Dashboard 中確認
   - `VITE_LINE_LIFF_ID` 必須是 `2008398150-kRq2E2Ro`

3. **如果修改了任何設定，必須重新部署前端**

4. **測試並檢查後台日誌**
   - 從 LINE App 打開訂房頁
   - 檢查後台「服務日誌」查看 LIFF 相關日誌

---

## 📞 如果需要進一步協助

請提供以下資訊：

1. **LIFF App 設定的完整截圖**（特別是 Endpoint URL 和 Scope）
2. **Cloudflare Pages 環境變數設定截圖**
3. **後台服務日誌中的 LIFF 相關日誌**（如果有）
4. **具體的錯誤訊息或異常行為描述**

---

**檢查報告生成時間：** 2025-11-01  
**LIFF ID：** `2008398150-kRq2E2Ro`

