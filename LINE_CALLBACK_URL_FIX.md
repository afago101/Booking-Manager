# LINE Callback URL 設定修正指南

## ⚠️ 問題診斷

目前收到的錯誤顯示：
- **發送的 redirect_uri**: `https://blessing-haven.marcux.uk/confirmation`
- **LINE 回應**: `400 Bad Request - Invalid redirect_uri value`

這表示 LINE Developers Console 中設定的 Callback URL **沒有包含** `/confirmation` 這個路徑。

## ✅ 正確的設定方式

### 重要：LINE OAuth Callback URL **不能包含 hash (#)**

即使您的網站使用 hash router (`#/booking`, `#/confirmation`)，LINE OAuth 的 Callback URL **必須是不含 hash 的實際路徑**。

### 步驟 1：前往 LINE Developers Console

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇您的 Provider
3. 選擇 **LINE Login Channel** (Channel ID: 2008398150)
4. 進入 **「Channel settings」** → **「LINE Login settings」**

### 步驟 2：檢查並更新 Callback URL

在 **「Callback URL」** 欄位中，確認是否有以下三個 URL（每行一個，**不含 hash**）：

```
https://blessing-haven.marcux.uk/booking
https://blessing-haven.marcux.uk/confirmation
https://blessing-haven.marcux.uk/
```

### 步驟 3：確認事項

請確認：
- ✅ **URL 不含 hash** (`#`) - 例如：`https://blessing-haven.marcux.uk/confirmation` ✅ 正確
- ❌ **URL 含 hash** - 例如：`https://blessing-haven.marcux.uk/#/confirmation` ❌ 錯誤

- ✅ **使用 HTTPS**（不是 HTTP）
- ✅ **沒有多餘的斜線**（除了根路徑 `/`）
- ✅ **沒有多餘的空格**
- ✅ **完全匹配**（大小寫、協議都一致）

### 步驟 4：儲存設定

1. 確認三個 URL 都已正確輸入
2. 點擊 **「Save」** 或 **「儲存」**
3. 等待幾秒鐘讓設定生效

## 🔍 驗證設定

設定完成後，可以透過以下方式驗證：

1. 回到 Callback URL 設定頁面，確認三個 URL 都顯示在列表中
2. 重新測試 LINE 綁定功能

## 📋 完整的 Callback URL 清單

您需要在 LINE Developers Console 中設定的完整列表：

```
https://blessing-haven.marcux.uk/booking
https://blessing-haven.marcux.uk/confirmation
https://blessing-haven.marcux.uk/
```

**注意：**
- 這些是實際的 HTTP 路徑，**不包含 hash**
- LINE OAuth 回調後，前端程式碼會自動處理並恢復到正確的 hash 路由（`#/booking`, `#/confirmation`）

## 🐛 常見問題

### Q: 為什麼 Callback URL 不能包含 hash？

A: LINE OAuth 規範中，redirect_uri 必須是實際的 HTTP 路徑。hash (`#`) 是前端路由使用的，不會被發送到伺服器。

### Q: 如果我的網站只有根路徑，可以只設定 `/` 嗎？

A: 可以，但建議同時設定所有可能使用的路徑（`/booking`, `/confirmation`）以確保功能正常。

### Q: 設定後還是出現錯誤怎麼辦？

A: 
1. 確認設定已儲存（重新整理頁面確認 URL 仍在列表中）
2. 等待 1-2 分鐘讓設定生效
3. 清除瀏覽器快取並重新測試
4. 檢查瀏覽器控制台的日誌，確認實際發送的 redirect_uri


