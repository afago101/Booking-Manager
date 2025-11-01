# OAuth 401 錯誤診斷與修復

## 🔴 錯誤訊息

```
POST /api/line/oauth/callback 401 (Unauthorized)
Error handling OAuth callback: Error: Failed to exchange OAuth code
```

## 🔍 可能的原因

### 原因 1: redirect_uri 不匹配（最常見）

**問題：** 前端發送的 `redirect_uri` 與 LINE Developers Console 設定的 Callback URL 不一致

**檢查步驟：**

1. **查看瀏覽器 Console 日誌**
   - 應該會看到 `[LINE OAuth] Sending callback request:` 日誌
   - 記錄實際發送的 `redirectUri`

2. **檢查 LINE Developers Console**
   - 前往 LINE Developers Console
   - Channel ID: `2008398150`
   - 進入「LINE Login settings」
   - 查看 Callback URL 列表

3. **確認匹配**
   - 前端發送的 `redirectUri` 必須**完全匹配** Callback URL 列表中的其中一個
   - 區分大小寫
   - 必須是 HTTPS

**常見不匹配情況：**
- ❌ 前端：`https://blessing-haven.marcux.uk/booking` 
- ✅ LINE Console：`https://blessing-haven.marcux.uk/booking`（應該匹配）

- ❌ 前端：`https://blessing-haven.marcux.uk/booking/`（多餘斜線）
- ✅ LINE Console：`https://blessing-haven.marcux.uk/booking`

- ❌ 前端：`http://blessing-haven.marcux.uk/booking`（HTTP 不是 HTTPS）
- ✅ LINE Console：`https://blessing-haven.marcux.uk/booking`

---

### 原因 2: LINE_CHANNEL_SECRET 錯誤

**檢查：**

```powershell
cd worker
npx wrangler secret list | Select-String "LINE"
```

確認 `LINE_CHANNEL_SECRET` 已正確設定。

---

### 原因 3: Channel ID 不匹配

**檢查：**

1. Worker 中的 `LINE_CHANNEL_ID` 應該是：`2008398150`
2. LINE Developers Console 使用的 Channel ID 也應該是：`2008398150`

---

### 原因 4: OAuth code 已過期

**問題：** OAuth code 只能在短時間內使用（通常幾分鐘）

**解決方法：** 重新觸發登入流程

---

## 🔧 修復步驟

### 步驟 1: 檢查實際發送的 redirectUri

在瀏覽器 Console 查看日誌：
```javascript
// 應該會看到類似這樣的日誌
[LINE OAuth] Sending callback request: {
  redirectUri: "https://blessing-haven.marcux.uk/booking",
  ...
}
```

### 步驟 2: 確認 LINE Developers Console 設定

在 LINE Developers Console 確認 Callback URL 包含：

```
https://blessing-haven.marcux.uk/booking
https://blessing-haven.marcux.uk/confirmation
https://blessing-haven.marcux.uk/
```

**重要：**
- ✅ 必須完全匹配（包括協議、網域、路徑）
- ✅ 必須是 HTTPS
- ✅ 不能有多餘的斜線（除了根路徑 `/`）
- ✅ 不能包含 hash (`#`)

### 步驟 3: 檢查 Worker 日誌

在 Worker 日誌中應該會看到詳細的錯誤訊息：

```powershell
cd worker
npx wrangler tail
```

查找 `LINE OAuth token exchange failed` 相關的日誌。

---

## 🧪 測試步驟

1. **清除瀏覽器快取和 sessionStorage**
   ```javascript
   sessionStorage.clear();
   localStorage.removeItem('lineUserId');
   ```

2. **重新測試 OAuth 登入**
   - 從一般瀏覽器開啟訂房頁面
   - 完成訂單後點擊「綁定 LINE」
   - 查看 Console 日誌

3. **檢查錯誤訊息**
   - 查看詳細的錯誤訊息
   - 確認 `redirectUri` 是否正確

---

## 📋 常見錯誤訊息對照

| 錯誤訊息 | 可能原因 | 解決方法 |
|---------|---------|---------|
| `invalid_grant` | redirect_uri 不匹配 | 確認 Callback URL 設定 |
| `invalid_client` | Channel ID/Secret 錯誤 | 確認 Secrets 設定 |
| `invalid_request` | 參數缺失或格式錯誤 | 檢查請求參數 |
| `unauthorized_client` | Channel ID 不匹配 | 確認使用正確的 Channel |

---

## ✅ 檢查清單

- [ ] LINE Developers Console Callback URL 已正確設定（三個 URL）
- [ ] Callback URL 與實際發送的 redirectUri 完全匹配
- [ ] 使用 HTTPS（不是 HTTP）
- [ ] 沒有多餘的斜線
- [ ] `LINE_CHANNEL_ID` 正確（`2008398150`）
- [ ] `LINE_CHANNEL_SECRET` 正確
- [ ] Worker 日誌檢查完成
- [ ] 瀏覽器 Console 日誌檢查完成

---

**請提供瀏覽器 Console 中 `[LINE OAuth] Sending callback request:` 的詳細日誌！**

