# LINE 部署失敗修復總結

## ✅ Worker 後端狀態

**已成功部署！** ✅

- Worker URL: `https://booking-api-public.afago101.workers.dev`
- Secrets 已設定：
  - ✅ `LINE_CHANNEL_ID`
  - ✅ `LINE_CHANNEL_SECRET`
  - ✅ 其他必要 secrets

## 🔍 可能導致「部署失敗」的原因

根據您的描述，可能的問題點：

### 1. LINE Developers Console 設定（最常見）

**問題：** Callback URL 未正確設定

**解決步驟：**

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 登入後選擇您的 Provider
3. 選擇 **LINE Login Channel** (Channel ID: 2008398150)
4. 點擊 **「Channel settings」** → **「LINE Login settings」**
5. 找到 **「Callback URL」** 欄位
6. 確認有這三個 URL（每行一個，**不含 hash**）：

```
https://blessing-haven.marcux.uk/booking
https://blessing-haven.marcux.uk/confirmation
https://blessing-haven.marcux.uk/
```

**⚠️ 重要：**
- ❌ 不要包含 `#` 符號
- ✅ 必須是 HTTPS（不是 HTTP）
- ✅ 沒有多餘的斜線（除了根路徑 `/`）

### 2. 前端環境變數未設定

**問題：** 前端無法取得 LINE Channel ID

**解決方法：**

#### 方法 A：在 Cloudflare Dashboard 設定（推薦）

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 前往「Pages」→ 選擇您的專案
3. 進入「Settings」→「Environment variables」
4. 新增：
   - `VITE_API_BASE_URL` = `https://booking-api-public.afago101.workers.dev/api`
   - `VITE_LINE_CHANNEL_ID` = `2008398150`（可選，建議設定）
5. 儲存後觸發重新部署

#### 方法 B：重新建置並部署

```powershell
# 在專案根目錄
# 1. 建立或更新 .env.production
@"
VITE_API_BASE_URL=https://booking-api-public.afago101.workers.dev/api
VITE_ADMIN_API_KEY=40lVHrWkepi2cOwZq7U19vIgNFaDoRXL
VITE_LINE_CHANNEL_ID=2008398150
"@ | Out-File -FilePath .env.production -Encoding utf8

# 2. 建置
npm run build

# 3. 部署
npx wrangler pages deploy dist --project-name=booking-manager
```

### 3. CORS 設定問題

**問題：** 前端無法呼叫 Worker API

**解決方法：**

```powershell
cd worker

# 設定 CORS_ORIGINS（包含所有前端網域）
npx wrangler secret put CORS_ORIGINS
# 輸入: https://blessing-haven.marcux.uk,https://068d675d.booking-manager-pil.pages.dev

# 或允許所有來源（開發時）
# 輸入: *

# 重新部署
npm run deploy
```

---

## 🧪 測試步驟

### 測試 1：後端 API

```powershell
# 測試健康檢查
$health = Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/health"
Write-Host "Health: $($health.status)"

# 測試 LINE Config
$config = Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/line/config"
Write-Host "Channel ID: $($config.channelId)"
```

**預期結果：**
- Health 應返回 `ok`
- Channel ID 應返回 `2008398150`

### 測試 2：前端 LINE Login

1. 開啟瀏覽器（F12 開啟開發者工具）
2. 前往：`https://blessing-haven.marcux.uk/#/booking`
3. 檢查 Console 是否有錯誤
4. 嘗試 LINE 登入功能
5. 確認是否正確跳轉

---

## 📋 快速檢查清單

完成以下項目：

- [ ] **Worker 已部署**（已完成 ✅）
- [ ] **LINE Secrets 已設定**（已完成 ✅）
- [ ] **LINE Developers Console Callback URL 已設定**
  - [ ] 三個 URL 都已加入（`/booking`, `/confirmation`, `/`）
  - [ ] URL 不含 hash
  - [ ] 使用 HTTPS
- [ ] **前端環境變數已設定**
  - [ ] `VITE_API_BASE_URL`
  - [ ] `VITE_LINE_CHANNEL_ID`（可選）
- [ ] **CORS_ORIGINS 已設定**（包含前端網域）
- [ ] **前端已重新部署**（如果修改了環境變數）

---

## 🔧 立即修復指令

如果確定是某個問題，執行以下對應指令：

### 修復 Callback URL（必須手動在 LINE Console 設定）

請前往 LINE Developers Console 手動設定。

### 修復前端環境變數

```powershell
# 方法 1: 在 Cloudflare Dashboard 設定（推薦）

# 方法 2: 重新建置部署
npm run build
npx wrangler pages deploy dist --project-name=booking-manager
```

### 修復 CORS

```powershell
cd worker
npx wrangler secret put CORS_ORIGINS
# 輸入: https://blessing-haven.marcux.uk,https://068d675d.booking-manager-pil.pages.dev
npm run deploy
```

---

## 📞 需要協助？

如果問題仍未解決，請提供：

1. **具體錯誤訊息**（瀏覽器 Console 或 Worker 日誌）
2. **失敗的操作**（例如：點擊「綁定 LINE」按鈕後發生什麼？）
3. **LINE Developers Console 截圖**（Callback URL 設定部分）

---

**最後更新：** 2025-01-XX

