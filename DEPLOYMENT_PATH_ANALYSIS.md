# 部署路徑完整分析

## 🔍 問題診斷

根據錯誤訊息：`Failed to load module script: Expected a JavaScript or Wasm module script but the server responded with a MIME type of "application/octet-stream".` (index.tsx:1)

這表示瀏覽器仍在嘗試載入 `/index.tsx`，而不是打包後的 `/assets/index-*.js`。

## ✅ 已驗證的正確配置

### 1. 本地建置輸出
- ✅ `dist/index.html` 正確包含 `/assets/index-C21M7mAn.js`
- ✅ `dist/index.html` **不包含** `index.tsx`
- ✅ `dist/_headers` 正確設定 MIME type
- ✅ `dist/_redirects` 正確設定 SPA 路由

### 2. Vite 配置 (`vite.config.ts`)
- ✅ `build.outDir: 'dist'` - 明確指定輸出目錄
- ✅ `build.assetsDir: 'assets'` - 明確指定資源目錄
- ✅ `build.emptyOutDir: true` - 確保建置前清空目錄
- ✅ `rollupOptions.output` - 確保檔案命名格式一致

### 3. GitHub Actions 部署流程
- ✅ 使用 `directory: dist` 參數部署到 Cloudflare Pages
- ✅ 新增建置驗證步驟，確保 `dist/index.html` 不包含 `index.tsx`
- ✅ 新增部署前驗證，確認檔案結構正確

## 🚨 可能的原因

### 原因 1: Cloudflare Pages 快取
**症狀**: 即使部署了新版本，瀏覽器仍載入舊的 HTML
**解決方案**: 
1. 在 Cloudflare Dashboard 清除快取
2. 使用無痕模式測試
3. 檢查 HTTP 標頭，確認檔案版本

### 原因 2: Cloudflare Pages 設定衝突
**症狀**: Cloudflare Pages 可能從錯誤的目錄提供服務
**檢查**:
1. 前往 Cloudflare Dashboard → Pages → booking-manager
2. Settings → Builds & deployments
3. 確認 **Build output directory** 設定為 `dist`（或留空，因為 GitHub Actions 已指定）

### 原因 3: GitHub Actions 部署未正確上傳 dist
**症狀**: 雖然建置成功，但 Cloudflare Pages 沒有收到正確的檔案
**檢查**:
1. 查看 GitHub Actions 的部署日誌
2. 確認 `cloudflare/pages-action` 的日誌顯示正確的檔案數量
3. 檢查是否有錯誤訊息

### 原因 4: 多個部署來源衝突
**症狀**: Cloudflare Pages 可能同時從 Git 和 GitHub Actions 接收部署
**解決方案**:
1. 在 Cloudflare Pages 設定中，確認部署來源
2. 如果使用 GitHub Actions，應該**關閉**自動構建（Git integration）
3. 或確認只使用一種部署方式

## 🔧 解決步驟

### 步驟 1: 確認 Cloudflare Pages 設定

1. 登入 https://dash.cloudflare.com
2. Workers & Pages → Pages → booking-manager
3. Settings → Builds & deployments
4. 檢查以下設定：
   - **Build command**: 應該留空（因為 GitHub Actions 已處理建置）
   - **Build output directory**: 應該留空（因為 GitHub Actions 已指定 `directory: dist`）
   - **Root directory**: 應該留空

### 步驟 2: 確認部署來源

在 Cloudflare Pages 設定中：
- 如果使用 **GitHub Actions 部署**：
  - 確認 **Git integration** 已關閉或設定正確
  - 確認不會有衝突的構建

### 步驟 3: 檢查最新部署

1. 在 Cloudflare Pages → booking-manager → Deployments
2. 檢查最新的部署：
   - 部署時間是否與 GitHub Actions 一致
   - 部署狀態是否為 Success
   - 點擊部署查看詳細資訊

### 步驟 4: 清除快取

1. Cloudflare Dashboard → Caching → Purge Everything
2. 或使用 `curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache"`

### 步驟 5: 驗證部署的檔案

如果可能，檢查 Cloudflare Pages 實際提供的檔案：
1. 訪問 `https://blessing-haven.marcux.uk/index.html`
2. 查看頁面原始碼
3. 確認是否包含 `/assets/index-*.js` 而不是 `/index.tsx`

## 📋 部署檢查清單

部署前確認：
- [ ] `npm run build` 成功執行
- [ ] `dist/index.html` 包含 `/assets/index-*.js`
- [ ] `dist/index.html` **不包含** `index.tsx`
- [ ] `dist/_headers` 存在且內容正確
- [ ] `dist/_redirects` 存在且內容正確
- [ ] GitHub Actions 建置驗證步驟通過

部署後確認：
- [ ] GitHub Actions 部署成功
- [ ] Cloudflare Pages 部署狀態為 Success
- [ ] 清除瀏覽器快取後測試
- [ ] 檢查 Network 標籤，確認載入的是 `/assets/index-*.js`

## 🎯 關鍵配置檔案

### `.github/workflows/deploy.yml`
```yaml
directory: dist  # ✅ 正確：指定 dist 目錄
```

### `vite.config.ts`
```typescript
build: {
  outDir: 'dist',           # ✅ 明確指定輸出目錄
  assetsDir: 'assets',      # ✅ 明確指定資源目錄
  emptyOutDir: true,        # ✅ 確保建置前清空
}
```

### `public/_headers`
```
/assets/*
  Content-Type: application/javascript; charset=utf-8
```

### `public/_redirects`
```
/*    /index.html   200
```

