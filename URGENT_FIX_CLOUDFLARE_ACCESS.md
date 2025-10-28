# ⚠️ 緊急修復：關閉 Cloudflare Access

## 🔴 問題

Worker 被 Cloudflare Access 保護，導致：
- ❌ 前端無法呼叫 API
- ❌ 所有請求被重定向到登入頁面  
- ❌ Google Sheets 資料無法載入

## ✅ 解決方法（2 分鐘）

### 方法 1：完全關閉 Access（推薦）

1. **登入 Cloudflare Dashboard**
   https://dash.cloudflare.com

2. **前往 Zero Trust**
   - 左側選單 → **Zero Trust**

3. **關閉 Worker Access 保護**
   - 選擇 **Access** → **Applications**
   - 找到 `booking-manager-worker`
   - 點擊 **···** (更多) → **Delete** 刪除這個應用程式

4. **確認刪除**
   - 點擊 **Delete** 確認

5. **測試**
   ```powershell
   Invoke-RestMethod -Uri "https://booking-manager-worker.afago101.workers.dev/api/health"
   ```
   
   應該看到：
   ```json
   {
     "status": "ok",
     "timestamp": "..."
   }
   ```

---

### 方法 2：設定例外規則（進階）

如果您需要保護某些端點但開放 API：

1. **編輯 Access Application**
   - Zero Trust → Access → Applications
   - 選擇 `booking-manager-worker`
   - 點擊 **Edit**

2. **修改 Application Domain**
   改為只保護特定路徑，例如：
   - `booking-manager-worker.afago101.workers.dev/admin/*`
   
   這樣只有 `/admin/*` 路徑需要認證

3. **儲存變更**

---

## 🎯 完成後

### 1. 測試 API

```powershell
# Health Check
Invoke-RestMethod -Uri "https://booking-manager-worker.afago101.workers.dev/api/health"

# 查詢可訂日期
Invoke-RestMethod -Uri "https://booking-manager-worker.afago101.workers.dev/api/availability?from=2024-11-01&to=2024-11-05"

# 查詢設定 (需要 Admin Key)
Invoke-RestMethod -Uri "https://booking-manager-worker.afago101.workers.dev/api/admin/settings" `
  -Headers @{"x-admin-key"="40lVHrWkepi2cOwZq7U19vIgNFaDoRXL"}
```

### 2. 測試前端

1. 開啟 https://88b5a047.booking-manager-pil.pages.dev
2. 選擇日期範圍
3. 檢查是否能看到可訂日期
4. 嘗試提交訂單

### 3. 測試後台

1. 開啟 https://88b5a047.booking-manager-pil.pages.dev/#/admin/login
2. 輸入密碼：`40lVHrWkepi2cOwZq7U19vIgNFaDoRXL`
3. 檢查是否能看到訂單列表

---

## 📊 為什麼會啟用 Access？

Cloudflare 可能在您的帳號有以下設定：
- Zero Trust 免費試用自動啟用
- Worker 子網域自動套用 Access 規則
- 之前建立的 Access Application 包含此 Worker

---

## 🔒 替代安全方案

關閉 Access 後，Worker 仍然有以下安全保護：

1. **Admin API Key**
   - 所有寫入操作需要 `x-admin-key` header
   - 防止未授權修改

2. **CORS 限制**
   - 可配置允許的網域
   - 防止跨站請求

3. **速率限制**
   - 60 req/min per IP
   - 防止 DDoS 攻擊

4. **輸入驗證**
   - 所有 API 都有資料驗證
   - 防止注入攻擊

---

## ⏰ 預計完成時間

- 關閉 Access：**2 分鐘**
- 測試驗證：**3 分鐘**
- **總計：5 分鐘**

---

## 💡 需要幫助？

如果刪除 Access Application 後仍然看到登入頁面：

1. **清除瀏覽器快取**
   - Ctrl+Shift+Delete → 清除快取
   - 或使用無痕模式測試

2. **等待 DNS 傳播**
   - 最多需要 2-3 分鐘

3. **檢查是否有其他 Access 規則**
   - Zero Trust → Access → Applications
   - 確認沒有其他規則包含 `*.workers.dev`

---

## ✅ 完成清單

- [ ] 登入 Cloudflare Dashboard
- [ ] 前往 Zero Trust → Access → Applications
- [ ] 刪除 `booking-manager-worker` 應用程式
- [ ] 測試 API health 端點
- [ ] 測試前端頁面載入
- [ ] 測試後台登入

---

**關閉 Access 後，系統就能正常從 Google Sheets 讀取資料了！** 🎉

