# LINE 設定診斷報告

## 📊 程式碼邏輯檢查

### ✅ 已確認：程式碼邏輯正確

**從 LINE 選單進入訂房頁的流程** (`pages/BookingPage.tsx:211-275`)

1. ✅ **自動檢測 LINE 環境**
   ```typescript
   const userAgent = navigator.userAgent || '';
   const inLineEnv = userAgent.includes('Line') || userAgent.includes('LINE');
   ```

2. ✅ **自動初始化 LIFF**
   ```typescript
   await initLineLogin();  // 會載入 LIFF SDK
   ```

3. ✅ **自動取得 LINE User ID**
   ```typescript
   const lineUser = await getLineProfile();  // 會自動登入（如需要）
   ```

4. ✅ **自動同步到 Google Sheets**
   ```typescript
   await syncCustomerProfile(lineUser.lineUserId, lineUser.name, lineUser.picture);
   ```

**結論**：程式碼邏輯已正確設定，**會自動取得 LINE UID**。

---

## ⚙️ 需要檢查的設定項目

### 1. LIFF 應用程式設定

**檢查位置**：LINE Developers Console
- URL: https://developers.line.biz/console/
- 路徑：Provider → LINE Login Channel (2008398150) → LIFF

**需要確認**：
- [ ] 是否已建立 LIFF 應用程式？
- [ ] LIFF ID 是什麼？（格式：`2008398150-xxxxxxx`）
- [ ] Endpoint URL 是否設定為 `https://blessing-haven.marcux.uk/booking`？
- [ ] Scope 是否包含 `profile`？

### 2. 環境變數設定

**檢查位置**：Cloudflare Pages Dashboard
- URL: https://dash.cloudflare.com
- 路徑：Pages → booking-manager → Settings → Environment variables

**需要確認**：
- [ ] `VITE_LINE_LIFF_ID` 是否已設定？
- [ ] `VITE_LINE_CHANNEL_ID` 是否已設定？（應該是 `2008398150`）
- [ ] 是否已重新部署？（環境變數設定後需要重新部署）

### 3. LINE 選單設定

**檢查位置**：LINE Official Account Manager
- URL: https://manager.line.biz/

**需要確認**：
- [ ] 選單連結是否使用 LIFF URL？（推薦）
- [ ] 或使用一般連結 `https://blessing-haven.marcux.uk/booking`？

---

## 🔍 實際檢查步驟

### 步驟 1: 檢查 Console 日誌

1. **從 LINE App 打開訂房頁**
   - 打開您的 LINE 官方帳號
   - 點擊選單中的訂房按鈕

2. **打開開發者工具**
   - 如果是在手機上，可以使用 [Chrome Remote Debugging](https://developer.chrome.com/docs/devtools/remote-debugging/)
   - 或在桌面版 LINE 測試

3. **查看 Console 日誌**

應該看到以下日誌（按順序）：

```
[BookingPage] Loading LINE user, inLineEnv: true
[BookingPage] Initializing LIFF...
[LIFF] Starting initialization...
[LIFF] LINE_LIFF_ID: 2008398150... (應該要有顯示，不能是 "not set")
[LIFF] LINE_CHANNEL_ID: 2008398150
[LIFF] User agent: ... (應該包含 "Line" 或 "LINE")
[LIFF] Is in LINE app: true
[LIFF] Loading LIFF SDK...
[LIFF] LIFF SDK script loaded
[LIFF] Initializing with LIFF ID: 2008398150...
[LIFF] LIFF initialized successfully
[BookingPage] Getting LINE profile...
[LIFF] LIFF loaded, checking login status...
[LIFF] isInClient: true
[LIFF] isLoggedIn: true (或 false，如果是 false 會自動觸發登入)
[LIFF] Getting profile...
[LIFF] Profile received: { userId: "...", displayName: "..." }
[BookingPage] LINE user loaded: { lineUserId: "...", name: "..." }
[BookingPage] Syncing customer profile to Sheets...
[BookingPage] Customer profile synced successfully
```

### 步驟 2: 檢查錯誤訊息

如果看到以下錯誤，表示有問題：

**錯誤 1**: `[LIFF] LINE_LIFF_ID: not set`
- **原因**：環境變數未設定
- **解決**：在 Cloudflare Pages 設定 `VITE_LINE_LIFF_ID` 並重新部署

**錯誤 2**: `[LIFF] No LIFF ID or Channel ID, skipping initialization`
- **原因**：LIFF ID 和 Channel ID 都未設定
- **解決**：至少設定 `VITE_LINE_CHANNEL_ID`

**錯誤 3**: `[LIFF] LIFF init failed`
- **原因**：LIFF ID 錯誤或網路問題
- **解決**：檢查 LIFF ID 是否正確，確認網路連線

**錯誤 4**: `[BookingPage] Not in LINE environment`
- **原因**：從一般瀏覽器打開（不是從 LINE App）
- **解決**：必須從 LINE App 的選單進入

### 步驟 3: 檢查 Google Sheets

1. 打開 Google Sheets 的 `Customer_Profile` 工作表
2. 確認是否有新的記錄
3. 確認 `lineUserId` 欄位有值（不是空的）

---

## 🛠️ 診斷工具

我已經創建了一個檢查腳本 `check_line_setup.js`，您可以在瀏覽器 Console 中執行來診斷問題。

### 使用方法：

1. 從 LINE App 打開訂房頁
2. 打開瀏覽器開發者工具（Console）
3. 執行以下代碼：

```javascript
// 複製 check_line_setup.js 的內容到 Console 執行
```

或者直接檢查環境變數：

```javascript
// 檢查環境變數（需要在構建後的頁面）
console.log('VITE_LINE_LIFF_ID:', import.meta.env.VITE_LINE_LIFF_ID);
console.log('VITE_LINE_CHANNEL_ID:', import.meta.env.VITE_LINE_CHANNEL_ID);
```

---

## 📝 快速檢查清單

### ✅ 程式碼
- [x] 已正確設定自動檢測 LINE 環境
- [x] 已正確設定 LIFF 初始化
- [x] 已正確設定取得 LINE User ID
- [x] 已正確設定同步到 Google Sheets

### ⚙️ 設定（需要您確認）
- [ ] LIFF 應用程式已建立
- [ ] `VITE_LINE_LIFF_ID` 環境變數已設定
- [ ] `VITE_LINE_CHANNEL_ID` 環境變數已設定（應該是 `2008398150`）
- [ ] 前端已重新部署（環境變數設定後）
- [ ] LINE 選單已設定並發布

---

## 🎯 下一步行動

1. **從 LINE App 打開訂房頁**
2. **檢查 Console 日誌**
3. **如果看到 "LINE_LIFF_ID: not set"**：
   - 前往 Cloudflare Pages Dashboard
   - 設定 `VITE_LINE_LIFF_ID` 環境變數
   - 重新部署前端

4. **如果看到其他錯誤**：
   - 請提供 Console 的完整錯誤訊息
   - 我會幫您進一步診斷

