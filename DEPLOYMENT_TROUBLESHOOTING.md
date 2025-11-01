# 部署故障排除指南

## 🔍 如果頁面無法打開，請按順序檢查：

### 步驟 1: 檢查 GitHub Actions 部署狀態

1. 前往：https://github.com/afago101/Booking-Manager/actions
2. 查看最新的 workflow run
3. 確認兩個 jobs 都成功：
   - ✅ `deploy-worker` - 應該顯示綠色勾號
   - ✅ `deploy-frontend` - 應該顯示綠色勾號

**如果部署失敗**：
- 點擊失敗的 job 查看錯誤訊息
- 檢查是否缺少 GitHub Secrets

---

### 步驟 2: 檢查 Cloudflare Pages 部署

1. 前往：https://dash.cloudflare.com
2. **Workers & Pages** → **Pages** → **booking-manager**
3. 查看 **Deployments** 標籤
4. 確認最新部署狀態為 **Success** ✅

**如果部署失敗**：
- 點擊失敗的部署查看日誌
- 檢查建置錯誤訊息

---

### 步驟 3: 檢查瀏覽器 Console（最重要！）

1. **打開網頁**（即使無法顯示）
2. **按 F12** 打開開發者工具
3. **查看 Console 標籤**
4. **記錄所有錯誤訊息**（紅色文字）

**常見錯誤**：
- `Failed to fetch` → API 連線問題
- `Cannot find module` → 模組路徑錯誤
- `Unexpected token` → JavaScript 語法錯誤
- `404 Not Found` → 檔案路徑錯誤

---

### 步驟 4: 檢查 Network 請求

1. **開發者工具** → **Network 標籤**
2. **重新載入頁面**（F5）
3. **檢查以下請求**：

**必須成功的請求**：
- ✅ `index.html` - 狀態碼 200
- ✅ `assets/index-*.js` - 狀態碼 200
- ✅ `assets/index-*.css` - 狀態碼 200

**如果 404 錯誤**：
- 檢查檔案是否在 `dist` 目錄中
- 檢查 Cloudflare Pages 部署是否包含所有檔案

---

### 步驟 5: 檢查環境變數

1. **Cloudflare Dashboard** → **Pages** → **booking-manager**
2. **Settings** → **Environment variables**
3. **確認 Production 環境有這些變數**：

| 變數名稱 | 應該的值 |
|---------|---------|
| `VITE_API_BASE_URL` | `https://booking-api-public.afago101.workers.dev/api` |
| `VITE_ADMIN_API_KEY` | `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL` |
| `VITE_LINE_LIFF_ID` | `2008398150-kRq2E2Ro` |
| `VITE_LINE_CHANNEL_ID` | `2008398150` |

**如果缺少變數**：
- 新增缺失的變數
- 觸發重新部署

---

### 步驟 6: 清除快取

**瀏覽器快取**：
- `Ctrl + Shift + R`（強制重新載入）
- 或使用無痕模式測試

**Cloudflare 快取**：
- Cloudflare Dashboard → **Caching** → **Purge Everything**
- 等待 1-2 分鐘後重新測試

---

### 步驟 7: 檢查 Worker 狀態

1. **Cloudflare Dashboard** → **Workers & Pages** → **Workers**
2. 確認 Worker `booking-api-public` 狀態為 **Active** ✅
3. 測試 Worker API：
   ```
   https://booking-api-public.afago101.workers.dev/api/availability?from=2024-01-01&to=2024-01-31
   ```

---

## 🔧 快速修復方法

### 方法 1: 手動觸發重新部署

1. **GitHub** → **Actions** → **Deploy to Cloudflare**
2. 點擊 **Run workflow**
3. 選擇分支 `main`
4. 點擊 **Run workflow**

### 方法 2: 在 Cloudflare Dashboard 重新部署

1. **Cloudflare Dashboard** → **Pages** → **booking-manager**
2. **Deployments** → 找到最新部署
3. 點擊 **...** → **Retry deployment**

### 方法 3: 檢查建置輸出

1. 本地執行：`npm run build`
2. 確認 `dist` 目錄包含所有檔案
3. 檢查 `dist/index.html` 中的 script 路徑是否正確

---

## 📞 需要協助時提供的信息

如果問題仍未解決，請提供：

1. **瀏覽器 Console 的完整錯誤訊息**（截圖或複製文字）
2. **Network 標籤中失敗的請求**（截圖）
3. **GitHub Actions 的部署日誌**（如果失敗）
4. **Cloudflare Pages 的部署日誌**（如果失敗）
5. **訪問的 URL**（例如：`https://blessing-haven.marcux.uk`）

---

## ✅ 預期的正常狀態

**正常運作時應該看到**：
- 頁面可以正常載入和顯示
- 沒有 Console 錯誤（除了預期的日誌訊息）
- 所有 Network 請求都返回 200 狀態碼
- GitHub Actions 顯示成功 ✅
- Cloudflare Pages 部署狀態為 Success ✅

