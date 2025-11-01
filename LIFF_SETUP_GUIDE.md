# LIFF 設定完整指南

## 📋 LIFF 是什麼？

**LIFF (LINE Frontend Framework)** 是在 LINE App 內執行 Web App 的框架，可以：
- 自動取得 LINE 使用者資訊（不需要 OAuth）
- 直接在 LINE App 內執行，體驗更好
- 可以取得真正的 LINE User ID

---

## 🎯 LIFF App 設定步驟

### 步驟 1: 建立 LIFF App

1. **前往 LINE Developers Console**
   - 連結：https://developers.line.biz/
   - 登入您的帳號

2. **選擇 Provider 和 Channel**
   - 選擇您的 Provider
   - 選擇 **LINE Login Channel** (Channel ID: `2008398150`)

3. **進入 LIFF 設定**
   - 點擊左側選單的 **「LIFF」**
   - 如果沒有看到，可能需要先啟用 LINE Login

4. **建立新的 LIFF App**
   - 點擊 **「Add」** 按鈕
   - 填入以下資訊：

---

### 步驟 2: LIFF App 設定值

#### 📝 基本設定

**App name（應用程式名稱）：**
```
Booking Manager
```
或
```
祝福海灣訂房系統
```

**Size（大小）：**
```
Full（全螢幕）
```
⚠️ **建議選擇 Full**，提供最佳使用者體驗

**Endpoint URL（端點 URL）：**
```
https://blessing-haven.marcux.uk
```
⚠️ **重要：**
- 使用您的實際網域
- 必須是 **HTTPS**
- **不要包含** path（例如 `/booking` 或 `/#/booking`）
- **不要包含** hash (`#`)

**Scope（權限範圍）：**
勾選以下選項：
- ✅ **`profile`**（必選）- 取得使用者基本資訊
- ✅ **`openid`**（建議）- 取得 LINE User ID
- ⚠️ **`email`**（可選）- 如果需要 email 權限

**Bot link feature（機器人連結功能）：**
- 可選，根據需求決定

---

### 步驟 3: 取得 LIFF ID

設定完成後，您會看到：

**LIFF App ID：**
格式類似：`1234567890-abcdefgh` 或 `2008398150-abcdefgh`

⚠️ **請複製並保存這個 ID！**

---

## 🔧 前端設定

### 方法 A: Cloudflare Pages Dashboard（推薦）

1. **登入 Cloudflare Dashboard**
   - https://dash.cloudflare.com

2. **進入 Pages 專案設定**
   - 選擇「Pages」→ 專案「booking-manager」
   - 進入「Settings」→「Environment variables」

3. **新增環境變數**
   - 點擊「Add variable」
   - 設定：

**Production 環境：**
```
變數名稱: VITE_LINE_LIFF_ID
值: [您的 LIFF ID]
例如: 2008398150-abcdefgh
```

4. **儲存並重新部署**
   - 點擊「Save」
   - 前往「Deployments」標籤
   - 點擊「Retry deployment」或等待下次自動部署

---

### 方法 B: 使用 .env.production（本地建置）

在專案根目錄建立或編輯 `.env.production`：

```env
VITE_API_BASE_URL=https://booking-api-public.afago101.workers.dev/api
VITE_ADMIN_API_KEY=40lVHrWkepi2cOwZq7U19vIgNFaDoRXL
VITE_LINE_CHANNEL_ID=2008398150
VITE_LINE_LIFF_ID=2008398150-abcdefgh
```

然後重新建置和部署：
```powershell
npm run build
npx wrangler pages deploy dist --project-name=booking-manager
```

---

## ✅ 設定檢查清單

### LINE Developers Console
- [ ] 已建立 LIFF App
- [ ] App name 已設定
- [ ] Size 設定為 `Full`
- [ ] Endpoint URL 設定為 `https://blessing-haven.marcux.uk`（您的實際網域）
- [ ] Scope 包含 `profile` 和 `openid`
- [ ] 已複製 LIFF ID

### Cloudflare Pages
- [ ] 環境變數 `VITE_LINE_LIFF_ID` 已設定
- [ ] 值為正確的 LIFF ID（格式：`2008398150-xxxxxxx`）
- [ ] 已重新部署前端

---

## 🧪 測試 LIFF 設定

### 測試 1: 檢查環境變數

在瀏覽器 Console（從 LINE App 開啟）執行：

```javascript
console.log('LIFF ID:', import.meta.env.VITE_LINE_LIFF_ID);
console.log('Channel ID:', import.meta.env.VITE_LINE_CHANNEL_ID);
```

**預期結果：**
- LIFF ID 應該顯示您設定的值（不是空字串）
- Channel ID 應該是 `2008398150`

### 測試 2: 檢查 LIFF 初始化

在瀏覽器 Console 執行：

```javascript
// 等待 LIFF 載入
setTimeout(() => {
  console.log('LIFF 狀態:', {
    loaded: typeof window.liff !== 'undefined',
    inClient: window.liff?.isInClient?.() ?? false,
    loggedIn: window.liff?.isLoggedIn?.() ?? false
  });
}, 2000);
```

**預期結果：**
- `loaded`: `true`
- `inClient`: `true`（如果從 LINE App 開啟）
- `loggedIn`: `true` 或 `false`（取決於是否已登入）

### 測試 3: 測試取得使用者資訊

在訂房頁面從 LINE App 開啟時：
- ✅ 應該自動顯示 LINE 使用者資訊
- ✅ 應該自動同步客戶資料
- ✅ 應該顯示 LINE 使用者頭像

---

## 🔍 常見問題

### Q1: LIFF 初始化失敗

**錯誤訊息：** `LIFF init failed`

**可能原因：**
- LIFF ID 錯誤
- Endpoint URL 不正確
- 網路問題

**解決方法：**
1. 確認 LIFF ID 正確
2. 確認 Endpoint URL 是 HTTPS 且正確
3. 檢查瀏覽器 Console 的詳細錯誤訊息

---

### Q2: 無法取得使用者資訊

**錯誤訊息：** `LINE user not logged in`

**可能原因：**
- 使用者未登入 LINE
- Scope 權限不足

**解決方法：**
1. 確認 LIFF App 的 Scope 包含 `profile` 和 `openid`
2. 在 LINE App 中登入 LINE 帳號

---

### Q3: 環境變數沒有生效

**問題：** 設定了環境變數但前端沒有讀取到

**解決方法：**
1. 確認在 Cloudflare Pages Dashboard 設定的是 **Production 環境**
2. 重新部署前端（環境變數設定後不會自動更新，需要重新部署）
3. 清除瀏覽器快取

---

## 📊 完整的 LIFF 設定範例

### LINE Developers Console 設定

```
App name: Booking Manager
Size: Full
Endpoint URL: https://blessing-haven.marcux.uk
Scope: 
  ✅ profile
  ✅ openid
```

### Cloudflare Pages 環境變數設定

```
VITE_API_BASE_URL = https://booking-api-public.afago101.workers.dev/api
VITE_LINE_CHANNEL_ID = 2008398150
VITE_LINE_LIFF_ID = 2008398150-abcdefgh（您的實際 LIFF ID）
```

---

## 🎯 最佳實踐

1. **使用 Full Size**
   - 提供最佳的使用者體驗
   - 避免不必要的滾動

2. **正確的 Endpoint URL**
   - 使用實際網域（不是 Cloudflare Pages 預設網域）
   - 確保是 HTTPS

3. **完整的 Scope**
   - 至少包含 `profile` 和 `openid`
   - 如需 email 可加入 `email`

4. **測試不同情境**
   - 從 LINE App 開啟測試
   - 測試登入/登出流程
   - 測試權限請求

---

## 📞 需要協助？

如果設定後仍有問題，請提供：

1. **LIFF App 設定截圖**（LINE Developers Console）
2. **環境變數設定截圖**（Cloudflare Pages Dashboard）
3. **瀏覽器 Console 錯誤訊息**
4. **測試結果**（上述測試步驟的結果）

---

**設定完成後，請記得重新部署前端！** 🚀

