# LINE 選單設定檢查清單

## 📋 當前程式碼邏輯

### 從 LINE 選單進入訂房頁的流程

當用戶從 LINE 選單點擊連結進入 `https://blessing-haven.marcux.uk/booking` 時：

1. **自動檢測 LINE 環境** (`pages/BookingPage.tsx:214-215`)
   ```typescript
   const userAgent = navigator.userAgent || '';
   const inLineEnv = userAgent.includes('Line') || userAgent.includes('LINE');
   ```

2. **初始化 LIFF** (`pages/BookingPage.tsx:223`)
   ```typescript
   await initLineLogin();  // 載入 LIFF SDK
   ```

3. **取得 LINE User ID** (`pages/BookingPage.tsx:230`)
   ```typescript
   const lineUser = await getLineProfile();
   // 會自動觸發登入（如果未登入）
   ```

4. **同步客戶資料** (`pages/BookingPage.tsx:246`)
   ```typescript
   await syncCustomerProfile(lineUser.lineUserId, lineUser.name, lineUser.picture);
   ```

## ✅ 程式碼已正確設定

根據代碼分析，**程式邏輯已經正確**，會自動：
- 檢測 LINE 環境
- 初始化 LIFF
- 取得 LINE User ID
- 同步到 Google Sheets

## ⚙️ LINE 選單需要確認的設定

### 1. **LIFF 應用程式設定**（最重要）

#### 步驟 1: 登入 LINE Developers Console
- 前往 https://developers.line.biz/console/
- 選擇您的 Provider
- 進入您的 **LINE Login Channel**

#### 步驟 2: 建立 LIFF 應用程式
- 在左側選單選擇 **「LIFF」**
- 點擊 **「Add」** 或 **「新增」**

#### 步驟 3: 設定 LIFF App
填入以下資訊：

| 欄位 | 設定值 |
|------|--------|
| **LIFF app name** | `Blessing Haven Booking` (或任意名稱) |
| **Size** | `Tall` (建議) 或 `Full` |
| **Endpoint URL** | `https://blessing-haven.marcux.uk/booking` |
| **Scope** | ✅ `profile` (必須)<br>✅ `openid` (可選，如果需要真正的 LINE User ID) |
| **Bot link feature** | `On(Normal)` (建議開啟，可綁定到 LINE 官方帳號) |

#### 步驟 4: 取得 LIFF ID
- 建立後會得到一個 **LIFF ID**（格式如：`1234567890-abcdefgh`）
- **重要**：這個 LIFF ID 必須設定到環境變數 `VITE_LINE_LIFF_ID`

### 2. **環境變數設定**

確保以下環境變數已正確設定：

#### Frontend (Cloudflare Pages)
- `VITE_LINE_LIFF_ID`: LIFF 應用程式的 ID
- `VITE_LINE_CHANNEL_ID`: LINE Login Channel ID
- `VITE_API_BASE_URL`: 後端 API 網址

#### Backend (Cloudflare Workers)
- `LINE_CHANNEL_ID`: LINE Login Channel ID
- `LINE_CHANNEL_SECRET`: LINE Login Channel Secret

### 3. **LINE 選單設定**

#### 方法 A: 使用 LIFF URL（推薦）

在 LINE 官方帳號後台設定選單時：

1. 進入 **「圖文選單」** 或 **「Rich Menu」**
2. 建立新的選單
3. 在按鈕動作選擇 **「開啟 LIFF 應用程式」**
4. 選擇剛才建立的 LIFF 應用程式
   - 或直接填入 LIFF URL：`https://liff.line.me/{LIFF_ID}/booking`
     - 例如：`https://liff.line.me/1234567890-abcdefgh/booking`

#### 方法 B: 使用一般連結（會自動偵測）

如果使用一般連結 `https://blessing-haven.marcux.uk/booking`：
- 程式碼會自動檢測是否在 LINE 環境中
- 會自動初始化 LIFF（如果有設定 `VITE_LINE_LIFF_ID`）
- **但建議使用 LIFF URL**，這樣可以確保在 LINE App 內打開

### 4. **LINE 官方帳號設定**

確保您的 LINE 官方帳號：
- 已綁定 LINE Login Channel
- 圖文選單已發布並啟用

## 🔍 檢查清單

### 檢查項目 1: LIFF ID 是否已設定
```bash
# 檢查環境變數
echo $VITE_LINE_LIFF_ID
```

或者在 Cloudflare Pages 設定中確認：
- Project Settings → Environment Variables
- 確認 `VITE_LINE_LIFF_ID` 有正確的值

### 檢查項目 2: 程式碼中的 LIFF 初始化
確認 `utils/lineLogin.ts` 會使用 LIFF ID：
```typescript
const liffId = LINE_LIFF_ID || LINE_CHANNEL_ID;
```

### 檢查項目 3: Console 日誌
打開瀏覽器開發者工具（Console），從 LINE 選單進入訂房頁時應該看到：
```
[BookingPage] Loading LINE user, inLineEnv: true
[BookingPage] Initializing LIFF...
[LIFF] Starting initialization...
[LIFF] LINE_LIFF_ID: 1234567890... (有顯示 LIFF ID)
[LIFF] LIFF initialized successfully
[BookingPage] Getting LINE profile...
[LIFF] Profile received: { userId: "...", displayName: "..." }
[BookingPage] LINE user loaded: { lineUserId: "...", name: "..." }
[BookingPage] Syncing customer profile to Sheets...
```

### 檢查項目 4: LINE User ID 是否正確記錄
檢查 Google Sheets 的 `Customer_Profile` 工作表：
- 確認有新的記錄
- 確認 `lineUserId` 欄位有值

## 🐛 常見問題

### 問題 1: 沒有自動登入
**原因**:
- LIFF ID 未設定或錯誤
- LIFF 應用程式的 Endpoint URL 不正確
- Scope 未勾選 `profile`

**解決方法**:
1. 確認 `VITE_LINE_LIFF_ID` 環境變數已設定
2. 確認 LIFF 應用程式的 Endpoint URL 是 `https://blessing-haven.marcux.uk/booking`
3. 確認 Scope 有勾選 `profile`

### 問題 2: 顯示「Not in LINE environment」
**原因**:
- 從一般瀏覽器打開（不是從 LINE App）
- User Agent 檢測失敗

**解決方法**:
- 確認是從 LINE App 的選單進入
- 檢查 Console 日誌中的 userAgent

### 問題 3: LIFF 初始化失敗
**原因**:
- LIFF ID 錯誤
- LIFF SDK 載入失敗
- 網路問題

**解決方法**:
1. 檢查 Console 錯誤訊息
2. 確認 LIFF ID 格式正確
3. 確認網路連線正常

## 📝 測試步驟

### 測試 1: 從 LINE 選單進入
1. 在 LINE App 中打開您的官方帳號
2. 點擊圖文選單中的訂房按鈕
3. 應該會自動打開訂房頁面
4. 檢查 Console 日誌確認有取得 LINE User ID
5. 檢查 Google Sheets 確認有同步資料

### 測試 2: 檢查自動登入
1. 如果用戶未授權，應該會自動彈出授權視窗
2. 授權後應該會自動取得 User ID
3. 不需要手動點擊登入按鈕

### 測試 3: 檢查資料同步
1. 確認 `lineUserId` 已正確設定到頁面狀態
2. 確認有顯示「已綁定 LINE 帳號」訊息
3. 確認 Google Sheets 中有客戶資料記錄

## 🎯 總結

### ✅ 程式碼邏輯
- **已正確設定**，會自動檢測 LINE 環境並取得 User ID

### ⚙️ 需要確認的設定
1. **LIFF 應用程式**是否已建立
2. **LIFF ID**是否已設定到環境變數
3. **LINE 選單**是否使用 LIFF URL 或一般連結
4. **Scope**是否已勾選 `profile`

### 📍 建議
**強烈建議使用 LIFF URL** (`https://liff.line.me/{LIFF_ID}/booking`)：
- 確保在 LINE App 內打開
- 更容易取得 LINE User ID
- 提供更好的用戶體驗

