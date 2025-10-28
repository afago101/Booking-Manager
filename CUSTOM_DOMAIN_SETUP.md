# 🌐 設定自訂網域：api.marcus.uk

## 📊 當前狀態

✅ **新 Worker 已部署**：`booking-api-public`  
✅ **可以正常訪問**：https://booking-api-public.afago101.workers.dev/api/health  
✅ **Google Sheets 已連接**  
⏳ **待設定**：自訂網域 `api.marcus.uk`

---

## 🎯 為什麼需要自訂網域？

- ✅ 繞過 `*.workers.dev` 的 Cloudflare Access 保護
- ✅ 更專業的 API URL
- ✅ 完全控制網域設定

---

## 📋 設定步驟（10 分鐘）

### 步驟 1：確認網域在 Cloudflare

1. **登入 Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/
   ```

2. **檢查 marcus.uk 是否在您的帳號**
   - 在首頁應該能看到 `marcus.uk`
   - 如果沒有，需要先將網域加入 Cloudflare

---

### 步驟 2：設定 DNS 記錄

1. **進入網域管理**
   - 點擊 `marcus.uk`

2. **前往 DNS 設定**
   - 左側選單 → **DNS** → **Records**

3. **新增 CNAME 記錄**
   
   點擊 **+ Add record**，填入：
   
   | 欄位 | 值 |
   |------|-------------|
   | **Type** | CNAME |
   | **Name** | `api` |
   | **Target** | `booking-api-public.afago101.workers.dev` |
   | **Proxy status** | ✅ Proxied（橘色雲朵圖示） |
   | **TTL** | Auto |
   
4. **儲存**
   - 點擊 **Save**

---

### 步驟 3：新增 Worker 自訂網域

1. **前往 Workers & Pages**
   - 左側選單 → **Workers & Pages**
   - 或直接訪問：https://dash.cloudflare.com/:account/workers-and-pages

2. **選擇 Worker**
   - 點擊 `booking-api-public`

3. **設定自訂網域**
   - 切換到 **Settings** 標籤
   - 找到 **Triggers** 區塊
   - 在 **Custom Domains** 區域點擊 **Add Custom Domain**

4. **輸入網域**
   ```
   api.marcus.uk
   ```

5. **確認並新增**
   - 點擊 **Add Custom Domain**
   - Cloudflare 會自動驗證並設定

---

### 步驟 4：等待 DNS 傳播

- **時間**：通常 2-5 分鐘
- **最長**：最多 24 小時（罕見）

---

## 🧪 測試自訂網域

### PowerShell 測試

```powershell
# 測試 1: Health Check
Invoke-RestMethod -Uri "https://api.marcus.uk/api/health"

# 應該看到：
# status    : ok
# timestamp : 2024-10-28T...

# 測試 2: 查詢可訂日期
Invoke-RestMethod -Uri "https://api.marcus.uk/api/availability?from=2024-11-01&to=2024-11-05"

# 測試 3: Admin API (需要 API Key)
Invoke-RestMethod -Uri "https://api.marcus.uk/api/admin/settings" `
  -Headers @{"x-admin-key"="40lVHrWkepi2cOwZq7U19vIgNFaDoRXL"}
```

### 瀏覽器測試

直接訪問：
```
https://api.marcus.uk/api/health
```

應該看到 JSON 回應：
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

## 🔄 更新前端 API URL

### 方法 1：更新環境變數（推薦）

```powershell
cd D:\檔案\Cursor\開發中\Booking Manager\V2

# 更新 .env.production
@"
VITE_API_BASE_URL=https://api.marcus.uk/api
VITE_ADMIN_API_KEY=40lVHrWkepi2cOwZq7U19vIgNFaDoRXL
"@ | Out-File -FilePath .env.production -Encoding utf8

# 重新建置並部署前端
npm run build
npx wrangler pages deploy dist --project-name=booking-manager
```

### 方法 2：直接使用暫時 URL（先測試）

在前端可以先手動測試：
```
https://booking-api-public.afago101.workers.dev/api
```

---

## 📊 完成後的架構

```
使用者
   ↓
前端 (Cloudflare Pages)
https://88b5a047.booking-manager-pil.pages.dev
   ↓
後端 API（兩個 URL 都可用）
├── https://api.marcus.uk/api ✨ 自訂網域（推薦）
└── https://booking-api-public.afago101.workers.dev/api（備用）
   ↓
Google Sheets (資料庫)
```

---

## ❓ 常見問題

### Q: DNS 設定後多久生效？

**A:** 通常 2-5 分鐘，最長 24 小時。可以用以下命令檢查：

```powershell
# 檢查 DNS 記錄
nslookup api.marcus.uk
```

應該看到指向 Cloudflare 的 IP。

---

### Q: 如果看到 "DNS resolution error"？

**A:** 表示 DNS 還沒生效，等待幾分鐘後再試。

---

### Q: 自訂網域和 workers.dev 網域的差別？

| 特性 | workers.dev | 自訂網域 |
|------|-------------|----------|
| **Access 保護** | ❌ 可能被保護 | ✅ 不受影響 |
| **URL 美觀** | 一般 | ✅ 專業 |
| **SSL 憑證** | ✅ 自動 | ✅ 自動 |
| **速度** | 快 | 快 |

---

### Q: 兩個 URL 都會繼續work嗎？

**A:** 是的！
- ✅ `api.marcus.uk` - 推薦使用
- ✅ `booking-api-public.afago101.workers.dev` - 備用

---

## 🎯 下一步

### 1. 完成 DNS 設定（您需要做的）
- ✅ 在 Dashboard 新增 DNS 記錄
- ✅ 新增 Worker 自訂網域

### 2. 測試自訂網域
```powershell
Invoke-RestMethod -Uri "https://api.marcus.uk/api/health"
```

### 3. 更新前端（自動化）

完成 DNS 設定並確認測試通過後，告訴我，我會立即更新前端並重新部署。

---

## 🚨 如果遇到問題

### 錯誤 1: "This site can't be reached"

**原因**：DNS 還沒設定或還沒生效  
**解決**：
1. 檢查是否完成步驟 2（DNS CNAME 記錄）
2. 等待 2-5 分鐘
3. 清除瀏覽器快取

---

### 錯誤 2: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

**原因**：SSL 憑證還在生成中  
**解決**：等待 5-10 分鐘讓 Cloudflare 生成憑證

---

### 錯誤 3: "Cloudflare Error 1000"

**原因**：Worker 自訂網域設定不正確  
**解決**：檢查步驟 3，確保已在 Worker Settings 新增自訂網域

---

## ✨ 成功標準

完成設定後，應該能看到：

```powershell
PS> Invoke-RestMethod -Uri "https://api.marcus.uk/api/health"

status    : ok
timestamp : 2024-10-28T...
```

**表示成功！** 🎉

---

**現在請前往 Cloudflare Dashboard 完成步驟 2 和步驟 3！**

完成後告訴我，我會測試並更新前端。

