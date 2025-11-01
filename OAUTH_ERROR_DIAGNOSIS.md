# OAuth 401 錯誤 - 立即診斷

## 🔴 錯誤分析

**錯誤訊息：** `401 (Unauthorized) - Failed to exchange OAuth code`

這通常是 **redirect_uri 不匹配** 造成的。

---

## 🔍 立即檢查步驟

### 步驟 1: 查看瀏覽器 Console 詳細日誌

重新測試一次 LINE 登入，然後在瀏覽器 Console（F12）中查找：

```
[LINE OAuth] Sending callback request: {
  redirectUri: "...",  ← 這是關鍵！
  codeLength: ...,
  state: "...",
  apiUrl: "..."
}
```

**請複製這裡的 `redirectUri` 值！**

---

### 步驟 2: 檢查 LINE Developers Console

1. 前往 https://developers.line.biz/
2. 選擇 Channel ID：`2008398150`
3. 進入「**Channel settings**」→「**LINE Login settings**」
4. 查看「**Callback URL**」列表

**確認列表中是否有：**
- `https://blessing-haven.marcux.uk/booking`
- `https://blessing-haven.marcux.uk/confirmation`
- `https://blessing-haven.marcux.uk/`

---

### 步驟 3: 比對 redirectUri

**前端發送的 redirectUri** 必須**完全匹配** LINE Console 中的 Callback URL。

**常見問題：**

❌ **多餘的斜線**
- 前端：`https://blessing-haven.marcux.uk/booking/`
- Console：`https://blessing-haven.marcux.uk/booking`
→ **解決：** 確保沒有多餘斜線

❌ **協議不匹配**
- 前端：`http://blessing-haven.marcux.uk/booking`
- Console：`https://blessing-haven.marcux.uk/booking`
→ **解決：** 必須是 HTTPS

❌ **網域不匹配**
- 前端：`https://xxx.pages.dev/booking`
- Console：`https://blessing-haven.marcux.uk/booking`
→ **解決：** 使用自訂網域，不是 Cloudflare Pages 預設網域

❌ **路徑不匹配**
- 前端：`https://blessing-haven.marcux.uk/`
- Console：只有 `https://blessing-haven.marcux.uk/booking`
→ **解決：** 確保所有可能的路徑都在 Callback URL 列表中

---

## 🔧 快速修復方法

### 方法 1: 在 LINE Console 添加所有可能的 redirectUri

在 LINE Developers Console 的 Callback URL 中，確保有以下三個：

```
https://blessing-haven.marcux.uk/booking
https://blessing-haven.marcux.uk/confirmation
https://blessing-haven.marcux.uk/
```

**⚠️ 注意：**
- 每行一個 URL
- 不要包含 hash (`#`)
- 使用 HTTPS
- 沒有多餘的斜線（除了根路徑 `/`）

### 方法 2: 檢查 Worker 日誌

查看 Worker 的詳細錯誤訊息：

```powershell
cd worker
npx wrangler tail
```

查找 `LINE OAuth token exchange failed` 相關的日誌，會顯示：
- 實際發送的 `redirectUri`
- LINE 返回的詳細錯誤訊息

---

## 📊 已更新的診斷功能

我已經更新了程式碼，現在會記錄：

1. **前端日誌：**
   - `[LINE OAuth] Sending callback request:` - 顯示實際發送的參數

2. **後端日誌：**
   - `LINE OAuth exchange request:` - 顯示接收到的參數
   - `LINE OAuth token exchange failed:` - 顯示詳細的錯誤資訊

---

## 🎯 下一步

**請提供以下資訊：**

1. **瀏覽器 Console 中的 `redirectUri` 值**
   - 查找 `[LINE OAuth] Sending callback request:` 日誌

2. **LINE Developers Console 的 Callback URL 列表**
   - 截圖或複製列表中的 URL

3. **Worker 日誌**（如果有）
   - 執行 `npx wrangler tail` 查看錯誤

有了這些資訊，我就能準確指出問題所在！

---

## ✅ 已部署的更新

- ✅ Worker 已部署（包含詳細錯誤日誌）
- ✅ 前端已部署（包含詳細診斷日誌）

**請重新測試並提供 Console 日誌！**

