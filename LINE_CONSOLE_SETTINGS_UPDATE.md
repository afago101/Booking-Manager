# LINE Developers Console 設定確認與更新

## 📋 您的設定資訊

根據您的截圖：

### ✅ 已正確設定的項目

1. **Permissions（權限）**
   - ✅ `PROFILE` - 取得使用者基本資訊
   - ✅ `OPENID_CONNECT` - 取得 LINE User ID
   - **狀態：正確，無需修改** ✅

2. **Your user ID**
   - 值：`Ua4a4aea4db548a85400f7c3b171c5d50`
   - **說明：** 這是您的開發者 User ID，不是 Channel ID
   - **注意：** 您的 Channel ID 應該是 `2008398150`（用於 LIFF 和 OAuth）

---

### ⚠️ 需要確認的項目

1. **Channel Secret**
   - LINE Console 顯示：`72d215ffbb617b49cb4fdaa28b6701b3`
   - **需要確認：** Worker 中的 `LINE_CHANNEL_SECRET` 是否與此值一致

2. **Assertion Signing Key**
   - 顯示「Register a public key」（未設定）
   - **結論：不需要設定** ✅
   - **說明：** 這個功能只有在使用特定的服務間認證（JWT assertion）時才需要，對於 LIFF 和標準 OAuth 流程不需要

---

## 🔧 更新 Channel Secret（如果需要）

### 步驟 1: 檢查當前 Worker 的 Channel Secret

```powershell
cd worker
npx wrangler secret list
```

這會顯示所有 secrets，但**不會顯示實際值**（安全考量）。

### 步驟 2: 更新 Channel Secret（如果不一致）

```powershell
cd worker
npx wrangler secret put LINE_CHANNEL_SECRET
```

當提示時，輸入：`72d215ffbb617b49cb4fdaa28b6701b3`

### 步驟 3: 重新部署 Worker

```powershell
npm run deploy
```

---

## 🔍 為什麼看不到日誌？

### 可能原因 1: 環境變數未設定

如果 `VITE_LINE_LIFF_ID` 未設定，LIFF 初始化會失敗，無法顯示日誌。

**檢查方法：**

在瀏覽器 Console（F12）執行：
```javascript
console.log('環境變數檢查:');
console.log('VITE_LINE_LIFF_ID:', import.meta.env.VITE_LINE_LIFF_ID);
console.log('VITE_LINE_CHANNEL_ID:', import.meta.env.VITE_LINE_CHANNEL_ID);
```

**應該顯示：**
- `VITE_LINE_LIFF_ID`: `2008398150-kRq2E2Ro`（您的 LIFF ID）
- `VITE_LINE_CHANNEL_ID`: `2008398150`

### 可能原因 2: LIFF 初始化失敗

如果 LIFF ID 錯誤或未設定，會導致：
- 無法初始化 LIFF
- 看不到 `[LIFF]` 開頭的日誌
- 無法取得 LINE 使用者資訊

### 可能原因 3: 不是在 LINE 環境中測試

**確認方法：**

在瀏覽器 Console 執行：
```javascript
console.log('User Agent:', navigator.userAgent);
console.log('Is in LINE:', navigator.userAgent.includes('Line') || navigator.userAgent.includes('LINE'));
```

如果 `Is in LINE` 為 `false`，表示不是從 LINE App 開啟。

---

## 🧪 測試步驟

### 測試 1: 檢查後端 API

```powershell
$response = Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/line/config"
Write-Host "Channel ID: $($response.channelId)"
```

**預期結果：** 應該顯示 `2008398150`

### 測試 2: 檢查前端環境變數

1. 從 LINE App 開啟訂房頁面
2. 開啟開發者工具（F12）
3. 在 Console 執行：

```javascript
// 檢查環境變數
console.log('VITE_LINE_LIFF_ID:', import.meta.env.VITE_LINE_LIFF_ID);
console.log('VITE_LINE_CHANNEL_ID:', import.meta.env.VITE_LINE_CHANNEL_ID);

// 檢查是否在 LINE 環境
console.log('User Agent:', navigator.userAgent);
console.log('Is in LINE:', navigator.userAgent.includes('Line'));

// 檢查 LIFF 狀態（等待 2 秒後）
setTimeout(() => {
  console.log('LIFF Status:', {
    loaded: typeof window.liff !== 'undefined',
    inClient: window.liff?.isInClient?.() ?? false,
    loggedIn: window.liff?.isLoggedIn?.() ?? false,
  });
}, 2000);
```

### 測試 3: 查看 Worker 日誌

```powershell
cd worker
npx wrangler tail
```

然後從 LINE App 測試登入，應該會看到日誌輸出。

---

## 📋 完整檢查清單

### LINE Developers Console
- [x] Permissions: `PROFILE` 和 `OPENID_CONNECT` ✅
- [x] Channel Secret: `72d215ffbb617b49cb4fdaa28b6701b3` ✅
- [x] Assertion Signing Key: 不需要設定 ✅
- [ ] **LIFF App 已建立，LIFF ID: `2008398150-kRq2E2Ro`** ⚠️
- [ ] **Callback URL 已設定（三個 URL）** ⚠️

### Cloudflare Worker
- [x] LINE_CHANNEL_ID = `2008398150` ✅
- [ ] **LINE_CHANNEL_SECRET 是否與 Console 一致** ⚠️

### Cloudflare Pages
- [ ] **VITE_LINE_LIFF_ID = `2008398150-kRq2E2Ro`** ⚠️
- [ ] **VITE_LINE_CHANNEL_ID = `2008398150`** ⚠️

---

## 🎯 立即行動

1. **確認 Channel Secret**（最重要）
   - 執行 `npx wrangler secret put LINE_CHANNEL_SECRET`
   - 輸入：`72d215ffbb617b49cb4fdaa28b6701b3`
   - 重新部署 Worker

2. **確認環境變數**
   - 在 Cloudflare Pages Dashboard 檢查 `VITE_LINE_LIFF_ID`
   - 應該設定為：`2008398150-kRq2E2Ro`

3. **測試並查看日誌**
   - 從 LINE App 開啟訂房頁面
   - 開啟開發者工具
   - 查看 Console 日誌

---

**請先確認 Channel Secret 是否需要更新！**

