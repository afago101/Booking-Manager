# 自動部署指南

## ✅ 自動部署已啟用

專案已配置 GitHub Actions，當您推送代碼到 `main` 或 `master` 分支時，會自動觸發部署流程。

---

## 🚀 部署流程

### 觸發條件

1. **自動觸發**
   - 推送代碼到 `main` 或 `master` 分支
   - 合併 Pull Request 到 `main` 或 `master` 分支

2. **手動觸發**
   - 前往 GitHub → Actions → Deploy to Cloudflare
   - 點擊 "Run workflow"

### 部署步驟

部署會依序執行以下步驟：

1. **Deploy Worker（後端）**
   - 安裝 Worker 依賴
   - 部署到 Cloudflare Workers

2. **Deploy Frontend（前端）**
   - 等待 Worker 部署完成
   - 創建 `.env.production` 檔案
   - 安裝前端依賴
   - 建置前端應用
   - 部署到 Cloudflare Pages

---

## 📋 需要的 GitHub Secrets

確保以下 Secrets 已設定在 GitHub Repository Settings → Secrets and variables → Actions：

### 必須的 Secrets

| Secret 名稱 | 說明 | 是否設定？ |
|------------|------|----------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | ⚠️ 需要確認 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | ⚠️ 需要確認 |
| `VITE_API_BASE_URL` | API 基礎 URL | ⚠️ 需要確認 |
| `VITE_ADMIN_API_KEY` | 管理員 API Key | ⚠️ 需要確認 |
| `VITE_LINE_LIFF_ID` | LINE LIFF ID | ⚠️ 需要確認 |
| `VITE_LINE_CHANNEL_ID` | LINE Channel ID | ⚠️ 需要確認 |

### 自動提供的 Secrets

- `GITHUB_TOKEN` - GitHub 自動提供，無需設定

---

## 🔧 設定 GitHub Secrets

### 步驟 1: 進入 Secrets 設定頁面

1. 前往 GitHub Repository
2. 點擊 **Settings** 標籤
3. 左側選單 → **Secrets and variables** → **Actions**
4. 點擊 **New repository secret**

### 步驟 2: 新增每個 Secret

對每個 Secret 執行以下操作：

1. **Name**: 輸入 Secret 名稱（例如 `CLOUDFLARE_API_TOKEN`）
2. **Secret**: 輸入對應的值
3. 點擊 **Add secret**

### 步驟 3: 確認所有 Secrets 已設定

檢查 Secrets 列表，確認上述六個 Secrets 都已設定。

---

## 📊 查看部署狀態

### 方法 1: GitHub Actions

1. 前往 GitHub Repository
2. 點擊 **Actions** 標籤
3. 選擇最近的 workflow run
4. 查看部署狀態

### 方法 2: Cloudflare Dashboard

1. 前往 Cloudflare Dashboard
2. **Workers & Pages** → **Pages** → **booking-manager**
3. 查看 **Deployments** 標籤

---

## ⚠️ 常見問題

### 問題 1: 部署失敗 - 找不到 Secret

**原因**: GitHub Secret 未設定或名稱錯誤

**解決方法**:
1. 檢查 GitHub Secrets 是否正確設定
2. 確認 Secret 名稱與 workflow 中使用的名稱完全一致（區分大小寫）

### 問題 2: Worker 部署失敗

**原因**: 
- Cloudflare API Token 權限不足
- Worker 配置錯誤

**解決方法**:
1. 檢查 Cloudflare API Token 是否有正確權限
2. 查看 Worker 部署日誌以獲取詳細錯誤資訊

### 問題 3: Frontend 部署失敗

**原因**:
- 建置失敗
- 環境變數未設定

**解決方法**:
1. 檢查建置日誌中的錯誤訊息
2. 確認所有 GitHub Secrets 已設定
3. 確認 Cloudflare Pages 環境變數也已設定（作為備用）

---

## 🎯 部署檢查清單

在推送代碼前，確認：

- [ ] 所有變更已提交並推送到 `main` 或 `master` 分支
- [ ] GitHub Secrets 已正確設定
- [ ] Cloudflare Pages 環境變數已設定（Production 環境）
- [ ] 本地測試通過（`npm run build` 成功）

---

## 🔄 手動觸發部署

如果需要手動觸發部署：

1. 前往 GitHub → **Actions**
2. 選擇 **Deploy to Cloudflare** workflow
3. 點擊 **Run workflow**
4. 選擇分支（通常是 `main`）
5. 點擊 **Run workflow**

---

## 📝 注意事項

1. **部署時間**: 通常需要 2-5 分鐘完成整個部署流程
2. **並行限制**: Worker 和 Frontend 部署會依序執行（Frontend 等待 Worker 完成）
3. **忽略檔案**: `.md` 檔案變更不會觸發部署（減少不必要的部署）
4. **環境變數**: 確保 GitHub Secrets 和 Cloudflare Pages 環境變數都正確設定

---

## ✅ 部署成功後

部署成功後：

1. **等待 1-2 分鐘** 讓 Cloudflare 完成 CDN 更新
2. **清除瀏覽器快取** 或使用無痕模式測試
3. **檢查功能**: 測試 LINE 登入、訂房流程等關鍵功能

---

## 🆘 需要協助？

如果部署遇到問題：

1. 查看 GitHub Actions 日誌
2. 檢查 Cloudflare Dashboard 的部署記錄
3. 確認所有環境變數和 Secrets 都已正確設定

