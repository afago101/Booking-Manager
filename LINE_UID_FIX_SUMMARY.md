# LINE UID 取得與記錄修復總結

## 🔧 已修復的問題

### 問題 1: 從 LINE 進入時無法取得參數

**修復內容：**

1. **改進 LIFF 初始化** (`utils/lineLogin.ts`)
   - ✅ 加入詳細的日誌輸出（`[LIFF]` 前綴）
   - ✅ 改進腳本載入檢測（避免重複載入）
   - ✅ 增加重試機制和超時處理
   - ✅ 更準確的錯誤處理

2. **改進 getLineProfile** (`utils/lineLogin.ts`)
   - ✅ 加入詳細的日誌追蹤
   - ✅ 增加等待機制（等待 LIFF SDK 完全載入）
   - ✅ 改進登入狀態檢查
   - ✅ 記錄所有步驟的狀態

3. **改進 BookingPage 載入邏輯** (`pages/BookingPage.tsx`)
   - ✅ 直接使用 userAgent 檢測（更可靠）
   - ✅ 增加等待時間（1秒）確保 LIFF 完全初始化
   - ✅ 加入詳細日誌（`[BookingPage]` 前綴）
   - ✅ 確保同步客戶資料時有錯誤處理

---

### 問題 2: LINE UID 未正確記錄

**修復內容：**

1. **確保同步流程**
   - ✅ 取得 LINE 使用者資訊後立即同步到 Sheets
   - ✅ 加入錯誤處理，確保同步失敗也會記錄錯誤
   - ✅ 驗證 `lineUserId` 存在後才進行同步

2. **後端記錄邏輯**
   - ✅ `handleSyncCustomerProfile` 正確處理 lineUserId
   - ✅ `createOrUpdateCustomerProfile` 正確寫入 lineUserId 欄位
   - ✅ 確保 lineUserId 作為主鍵正確儲存

---

## 📊 新增的日誌

### 前端日誌

在瀏覽器 Console 中，您會看到：

```
[LIFF] Starting initialization...
[LIFF] LINE_LIFF_ID: 2008398150-...
[LIFF] LINE_CHANNEL_ID: 2008398150
[LIFF] User agent: ...
[LIFF] Is in LINE app: true
[LIFF] Loading LIFF SDK...
[LIFF] LIFF SDK script loaded
[LIFF] Initializing with LIFF ID: 2008398150-...
[LIFF] LIFF initialized successfully
[LIFF] Starting getLineProfile...
[LIFF] LIFF loaded, checking login status...
[LIFF] isInClient: true
[LIFF] isLoggedIn: true/false
[LIFF] Getting profile...
[LIFF] Profile received: { userId: "...", displayName: "...", ... }

[BookingPage] Loading LINE user, inLineEnv: true
[BookingPage] Initializing LIFF...
[BookingPage] Getting LINE profile...
[BookingPage] LINE user loaded: { lineUserId: "...", name: "..." }
[BookingPage] Syncing customer profile to Sheets...
[BookingPage] Customer profile synced successfully
```

### 後端日誌

在 Worker 日誌中（`wrangler tail`），您會看到：

```
LINE OAuth exchange request: { redirectUri: "...", channelId: "...", ... }
Customer profile synced successfully
```

---

## 🧪 測試步驟

### 測試 1: 從 LINE App 進入

1. 從 LINE App 開啟：
   ```
   https://blessing-haven.marcux.uk/#/booking
   ```

2. 開啟瀏覽器開發者工具（F12）
3. 查看 Console 標籤，應該會看到：
   - `[LIFF]` 開頭的初始化日誌
   - `[BookingPage]` 開頭的載入日誌
   - 如果成功，會看到 `LINE user loaded` 和 `Customer profile synced successfully`

4. 檢查 Google Sheets：
   - 開啟 `Customer_Profile` 工作表
   - 確認有新的記錄或更新
   - 確認 `lineUserId` 欄位有正確的 UID

---

## 🔍 診斷

如果還是無法取得參數，請檢查：

### 1. 環境變數檢查

在瀏覽器 Console 執行：
```javascript
console.log('VITE_LINE_LIFF_ID:', import.meta.env.VITE_LINE_LIFF_ID);
console.log('VITE_LINE_CHANNEL_ID:', import.meta.env.VITE_LINE_CHANNEL_ID);
```

**應該顯示：**
- `VITE_LINE_LIFF_ID`: `2008398150-kRq2E2Ro`（或您的 LIFF ID）
- `VITE_LINE_CHANNEL_ID`: `2008398150`

### 2. LIFF 狀態檢查

在瀏覽器 Console 執行：
```javascript
setTimeout(() => {
  console.log('LIFF Status:', {
    loaded: typeof window.liff !== 'undefined',
    inClient: window.liff?.isInClient?.() ?? false,
    loggedIn: window.liff?.isLoggedIn?.() ?? false,
  });
}, 2000);
```

### 3. 檢查 Console 日誌

查看是否有錯誤訊息或警告：
- ❌ `[LIFF] LIFF init failed` → LIFF ID 錯誤或未設定
- ❌ `[LIFF] No LIFF ID or Channel ID` → 環境變數未設定
- ❌ `[LIFF] Failed to load LIFF SDK script` → 網路問題

---

## ✅ 檢查清單

- [x] LIFF 初始化改進（詳細日誌）
- [x] getLineProfile 改進（重試機制）
- [x] BookingPage 載入邏輯改進
- [x] 客戶資料同步邏輯確認
- [x] 錯誤處理改進
- [x] Worker 已部署
- [x] 前端已部署
- [ ] **環境變數 `VITE_LINE_LIFF_ID` 已設定**
- [ ] **測試從 LINE App 進入**

---

**已部署！請測試並查看 Console 日誌以診斷問題。** 🔍

