# Cloudflare Pages 環境變數自動設定指南

## ✅ 已完成

1. **本地 `.env.production` 已建立**（用於手動部署）
2. **前端已建置並部署**（包含環境變數）
3. **GitHub Actions 已更新**（支援環境變數）

---

## 🎯 兩種部署方式

### 方式 1: 手動部署（當前完成）

使用 `wrangler pages deploy` 命令部署時，會讀取本地的 `.env.production` 檔案。

**狀態：** ✅ 已完成

- 環境變數已包含在構建中
- 前端已部署成功
- **但** 如果之後透過 Git 自動部署，需要設定 Dashboard 環境變數

---

### 方式 2: Git 自動部署

如果您的專案連接到 GitHub 並使用自動部署，需要：

1. **設定 GitHub Secrets**（用於 GitHub Actions）
2. **設定 Cloudflare Dashboard 環境變數**（用於 Cloudflare 的 Git 整合）

---

## 📝 需要設定的環境變數

### 在 Cloudflare Dashboard 中設定

**路徑：**
- Cloudflare Dashboard → Pages → booking-manager → Settings → Environment variables

**設定以下變數（Production 環境）：**

```
VITE_LINE_LIFF_ID = 2008398150-kRq2E2Ro
VITE_LINE_CHANNEL_ID = 2008398150
VITE_API_BASE_URL = https://booking-api-public.afago101.workers.dev/api
VITE_ADMIN_API_KEY = 40lVHrWkepi2cOwZq7U19vIgNFaDoRXL
```

### 在 GitHub Secrets 中設定（如果使用 GitHub Actions）

**路徑：**
- GitHub Repository → Settings → Secrets and variables → Actions

**新增以下 Secrets：**

```
VITE_LINE_LIFF_ID = 2008398150-kRq2E2Ro
VITE_LINE_CHANNEL_ID = 2008398150
```

（`VITE_API_BASE_URL` 和 `VITE_ADMIN_API_KEY` 應該已經存在）

---

## 🔧 使用 Cloudflare API 設定（進階）

如果需要透過 API 自動設定，可以使用以下方法：

### 需要的資訊

1. **Cloudflare API Token**
   - 建立：https://dash.cloudflare.com/profile/api-tokens
   - 權限：需要 Pages Edit 權限

2. **Account ID**
   - 可以在 Cloudflare Dashboard 右側邊欄找到

3. **Project Name**
   - `booking-manager`

### API 請求範例

```bash
# 設定環境變數（Production）
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}/env" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "VITE_LINE_LIFF_ID": {
        "value": "2008398150-kRq2E2Ro",
        "environments": ["production"]
      },
      "VITE_LINE_CHANNEL_ID": {
        "value": "2008398150",
        "environments": ["production"]
      },
      "VITE_API_BASE_URL": {
        "value": "https://booking-api-public.afago101.workers.dev/api",
        "environments": ["production"]
      },
      "VITE_ADMIN_API_KEY": {
        "value": "40lVHrWkepi2cOwZq7U19vIgNFaDoRXL",
        "environments": ["production"]
      }
    }
  }'
```

**⚠️ 注意：** Cloudflare Pages API 可能需要不同的端點格式，建議使用 Dashboard 手動設定。

---

## ✅ 驗證設定

### 步驟 1: 檢查部署方式

```powershell
# 檢查是否有 Git 連接
npx wrangler pages project list
```

### 步驟 2: 測試環境變數

在瀏覽器 Console 執行：

```javascript
console.log('VITE_LINE_LIFF_ID:', import.meta.env.VITE_LINE_LIFF_ID);
console.log('VITE_LINE_CHANNEL_ID:', import.meta.env.VITE_LINE_CHANNEL_ID);
```

**預期結果：**
- 應該顯示正確的值，而不是 `undefined`

### 步驟 3: 測試 LIFF

從 LINE App 打開訂房頁，檢查 Console 日誌：

```
[LIFF] Starting initialization...
[LIFF] LINE_LIFF_ID: 2008398150...（不是 "not set"）
[LIFF] LIFF initialized successfully
```

---

## 🎯 建議行動

**如果您使用 Git 自動部署：**

1. **前往 Cloudflare Dashboard**
   - Pages → booking-manager → Settings → Environment variables
   - 手動新增四個環境變數（Production 環境）

2. **重新部署**
   - Deployments → 最新部署的「...」→「Retry deployment」

**如果只使用手動部署：**

- ✅ 當前部署已經包含環境變數
- ✅ 可以開始測試

---

**設定完成後告訴我，我會協助驗證！**

