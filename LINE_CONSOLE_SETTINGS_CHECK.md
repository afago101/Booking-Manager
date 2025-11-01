# LINE Developers Console 設定檢查指南

## 📋 您的設定資訊

根據您提供的截圖：

### ✅ 已設定的項目

1. **Permissions（權限）**
   - ✅ `PROFILE`
   - ✅ `OPENID_CONNECT`
   - **狀態：正確** ✅

2. **Channel secret**
   - 值：`72d215ffbb617b49cb4fdaa28b6701b3`
   - **需要確認：** 是否已設定到 Worker secrets

3. **Your user ID**
   - 值：`Ua4a4aea4db548a85400f7c3b171c5d50`
   - **說明：** 這是您的開發者 User ID，不是 Channel ID

4. **Assertion Signing Key**
   - ⚠️ 顯示「Register a public key」（未設定）
   - **問題：** 需要確認是否需要設定

---

## 🔍 需要檢查和設定的項目

### 1. Channel Secret 確認（重要）

**需要確認：** Worker 中的 `LINE_CHANNEL_SECRET` 是否與 Console 中的值一致

**檢查方法：**

```powershell
cd worker
npx wrangler secret list | Select-String "LINE_CHANNEL_SECRET"
```

**如果 Channel Secret 不一致，需要更新：**

```powershell
cd worker
npx wrangler secret put LINE_CHANNEL_SECRET
# 輸入: 72d215ffbb617b49cb4fdaa28b6701b3
```

然後重新部署：
```powershell
npm run deploy
```

---

### 2. Assertion Signing Key（通常不需要）

**說明：**
- Assertion Signing Key 通常用於 **JWT assertion** 流程
- 對於 **LIFF** 和標準的 **OAuth** 流程，**不需要設定**
- 只有在使用特定的服務間認證時才需要

**結論：** ✅ **不需要設定**（除非您有特殊需求）

---

### 3. Permissions（已正確）

您的設定：
- ✅ `PROFILE` - 取得使用者基本資訊
- ✅ `OPENID_CONNECT` - 取得 LINE User ID

**狀態：** 正確，無需修改 ✅

---

## 🔧 立即檢查步驟

### 步驟 1: 確認 Channel Secret

```powershell
cd worker
npx wrangler secret list
```

**應該看到：**
- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`

**如果 `LINE_CHANNEL_SECRET` 的值不是 `72d215ffbb617b49cb4fdaa28b6701b3`，需要更新！**

---

### 步驟 2: 更新 Channel Secret（如果需要）

```powershell
cd worker
npx wrangler secret put LINE_CHANNEL_SECRET
```

然後輸入新的值：`72d215ffbb617b49cb4fdaa28b6701b3`

---

### 步驟 3: 重新部署 Worker

```powershell
cd worker
npm run deploy
```

---

## 🧪 測試確認

### 測試 1: 檢查後端 API

```powershell
$config = Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/line/config"
Write-Host "Channel ID: $($config.channelId)"
```

**預期：** 應該返回 `2008398150`

---

### 測試 2: 從 LINE App 測試

1. 從 LINE App 開啟訂房頁面
2. 開啟開發者工具（F12）
3. 查看 Console 中的 `[LIFF]` 日誌

**如果看到錯誤：**
- `[LIFF] LIFF init failed` → 可能是 LIFF ID 錯誤
- `[LIFF] No LIFF ID` → 環境變數未設定

---

## 📋 完整檢查清單

### LINE Developers Console
- [x] Permissions: `PROFILE` 和 `OPENID_CONNECT` ✅
- [ ] **Channel Secret 是否與 Worker 一致** ⚠️
- [x] Assertion Signing Key: 不需要設定 ✅

### Cloudflare Worker
- [ ] **LINE_CHANNEL_SECRET 是否正確** ⚠️
- [x] LINE_CHANNEL_ID = `2008398150` ✅

### Cloudflare Pages
- [ ] **VITE_LINE_LIFF_ID = `2008398150-kRq2E2Ro`** ⚠️
- [ ] VITE_LINE_CHANNEL_ID = `2008398150` ⚠️

---

## ⚠️ 最可能的問題

根據您無法查看日誌的情況，最可能的問題是：

1. **環境變數未設定或錯誤**
   - `VITE_LINE_LIFF_ID` 可能未設定
   - 導致 LIFF 初始化失敗

2. **Channel Secret 不一致**
   - Worker 中的 Channel Secret 可能與 Console 不一致
   - 導致 OAuth 驗證失敗

---

## 🔧 快速修復

### 修復 1: 更新 Channel Secret（如果不同）

```powershell
cd worker
npx wrangler secret put LINE_CHANNEL_SECRET
# 貼上: 72d215ffbb617b49cb4fdaa28b6701b3
npm run deploy
```

### 修復 2: 確認環境變數

在 Cloudflare Pages Dashboard：
- `VITE_LINE_LIFF_ID` = `2008398150-kRq2E2Ro`
- `VITE_LINE_CHANNEL_ID` = `2008398150`

然後重新部署前端。

---

**請先執行「步驟 1」確認 Channel Secret 是否正確！**

