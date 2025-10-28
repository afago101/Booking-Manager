# GitHub 自動部署設定指南

使用 GitHub Actions 實現 Git push 自動部署到 Cloudflare。

## 📋 前置準備

1. GitHub 帳號
2. Cloudflare 帳號
3. Git 已安裝

## 🔧 設定步驟

### 步驟 1：建立 GitHub Repository

```bash
# 在專案目錄初始化 Git（如果還沒有）
git init

# 添加所有檔案
git add .

# 第一次提交
git commit -m "Initial commit: Booking Manager V2"

# 在 GitHub 建立新 repository，然後：
git remote add origin https://github.com/your-username/booking-manager.git
git branch -M main
git push -u origin main
```

### 步驟 2：取得 Cloudflare API Token

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 點擊右上角頭像 → **My Profile**
3. 左側選單 → **API Tokens**
4. 點擊 **Create Token**
5. 使用範本：**Edit Cloudflare Workers**
6. 調整權限：
   - Account > Cloudflare Pages > Edit
   - Account > Workers Scripts > Edit
7. 點擊 **Continue to summary** → **Create Token**
8. **複製 Token**（只會顯示一次）

### 步驟 3：取得 Cloudflare Account ID

1. 在 Cloudflare Dashboard 首頁
2. 右側邊欄會顯示 **Account ID**
3. 複製這個 ID

### 步驟 4：設定 GitHub Secrets

在您的 GitHub Repository：

1. 進入 **Settings** → **Secrets and variables** → **Actions**
2. 點擊 **New repository secret**
3. 依序新增以下 Secrets：

| Secret Name | 說明 | 範例 |
|------------|------|------|
| `CLOUDFLARE_API_TOKEN` | 剛才建立的 API Token | `abc123...` |
| `CLOUDFLARE_ACCOUNT_ID` | 您的 Cloudflare Account ID | `1234567890abcdef` |
| `VITE_API_BASE_URL` | Worker 的 URL | `https://your-worker.workers.dev/api` |
| `VITE_ADMIN_API_KEY` | Admin API Key | 自己生成的強密碼 |

### 步驟 5：設定 Cloudflare Worker Secrets

**重要**：Worker 的敏感資訊必須在 Cloudflare 設定，不能放在 GitHub：

```bash
cd worker

# 登入 Cloudflare
wrangler login

# 設定 Worker Secrets
wrangler secret put GOOGLE_SHEETS_ID
# 輸入: 1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw

wrangler secret put GOOGLE_CLIENT_EMAIL
# 輸入: booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com

wrangler secret put GOOGLE_PRIVATE_KEY
# 貼上完整的 Private Key（包含 BEGIN 和 END）

wrangler secret put ADMIN_API_KEY
# 輸入與 GitHub Secret 相同的值

wrangler secret put CORS_ORIGINS
# 輸入: https://your-site.pages.dev （或 * 開發時）
```

### 步驟 6：測試自動部署

```bash
# 修改任何檔案
echo "# Test" >> README.md

# 提交並推送
git add .
git commit -m "Test auto deployment"
git push
```

前往 GitHub Repository → **Actions** 頁面查看部署進度。

## 📊 部署流程

```
Git Push
    ↓
GitHub Actions 觸發
    ↓
├─ Deploy Worker (先)
│   └─ 使用 wrangler deploy
└─ Deploy Frontend (後)
    ├─ 建立 .env.production
    ├─ npm run build
    └─ 部署到 Cloudflare Pages
```

## 🔒 安全性說明

### ✅ 安全的做法

- Worker Secrets（Private Key、API Key）存在 Cloudflare
- GitHub Secrets 只存 API Token 和非敏感設定
- `.gitignore` 排除所有敏感檔案
- 使用 CLOUDFLARE_API_TOKEN（不是 API Key）

### ❌ 不要做的事

- ❌ 不要將 Private Key 放在 GitHub（即使是 Secret）
- ❌ 不要將 `.env` 檔案提交到 Git
- ❌ 不要使用全域 API Key（用 Token）

## 🎯 手動觸發部署

如果需要手動觸發部署：

1. GitHub Repository → **Actions**
2. 左側選擇 **Deploy to Cloudflare**
3. 點擊 **Run workflow**

## 🐛 疑難排解

### 部署失敗：Unauthorized

- 檢查 `CLOUDFLARE_API_TOKEN` 是否正確
- 確認 Token 有 Workers 和 Pages 的編輯權限

### Worker 無法連接 Google Sheets

- 確認已在 Cloudflare 設定 Worker Secrets（不是 GitHub Secrets）
- 使用 `wrangler secret list` 檢查

### 前端環境變數錯誤

- 檢查 GitHub Secrets 中的 `VITE_API_BASE_URL`
- 確認 Worker 已部署且 URL 正確

## 📝 更新 Worker Secrets

如果需要更新 Worker 的敏感資訊：

```bash
cd worker
wrangler secret put GOOGLE_PRIVATE_KEY
# 輸入新的值

# 重新部署
wrangler deploy
```

## 🔄 更新流程

往後只需要：

```bash
git add .
git commit -m "Update features"
git push
```

GitHub Actions 會自動：
1. 部署 Worker
2. 建置前端
3. 部署到 Cloudflare Pages

## 📱 部署狀態通知

可在 GitHub Repository → **Settings** → **Notifications** 設定部署狀態通知。

---

**安全提醒**：所有敏感資訊都應該透過 Secrets 管理，絕不提交到 Git！

