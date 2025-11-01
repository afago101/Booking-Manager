# Cloudflare Pages 環境變數設定完整指南

## 🎯 重要區別

您剛才查看的是 **Cloudflare Workers（後端）** 的環境變數設定畫面。

**LIFF ID 需要設定在 Cloudflare Pages（前端）的環境變數中！**

---

## 📍 設定位置

### Cloudflare Pages 環境變數

**路徑：**
1. 登入：https://dash.cloudflare.com
2. 左側選單 →「**Pages**」
3. 選擇專案「**booking-manager**」
4. 頂部標籤 →「**Settings**」
5. 左側選單 →「**Environment variables**」

**⚠️ 注意：** 這是 **不同的設定頁面**，不是 Worker 的設定！

---

## 📝 需要設定的環境變數

在 **Production** 環境中，需要設定以下四個變數：

### 變數 1: VITE_LINE_LIFF_ID（最重要！）

```
Variable name: VITE_LINE_LIFF_ID
Value: 2008398150-kRq2E2Ro
Environment: ✅ Production（必須勾選）
```

### 變數 2: VITE_LINE_CHANNEL_ID

```
Variable name: VITE_LINE_CHANNEL_ID
Value: 2008398150
Environment: ✅ Production
```

### 變數 3: VITE_API_BASE_URL

```
Variable name: VITE_API_BASE_URL
Value: https://booking-api-public.afago101.workers.dev/api
Environment: ✅ Production
```

### 變數 4: VITE_ADMIN_API_KEY

```
Variable name: VITE_ADMIN_API_KEY
Value: 40lVHrWkepi2cOwZq7U19vIgNFaDoRXL
Environment: ✅ Production
```

---

## 🔧 詳細設定步驟

### 步驟 1: 進入正確的設定頁面

1. **前往 Cloudflare Dashboard**
   - https://dash.cloudflare.com

2. **進入 Pages（不是 Workers）**
   - 左側選單 →「**Pages**」
   - 選擇專案「**booking-manager**」

3. **進入環境變數設定**
   - 點擊頂部「**Settings**」標籤
   - 在左側選單中找到「**Environment variables**」
   - 點擊進入

**⚠️ 確認您看到的是 Pages 專案的設定，不是 Worker 的設定！**

### 步驟 2: 新增環境變數

對每個變數執行以下步驟：

1. **點擊「Add variable」或「新增變數」按鈕**

2. **填入變數資訊**
   - **Variable name**：例如 `VITE_LINE_LIFF_ID`
   - **Value**：例如 `2008398150-kRq2E2Ro`
   - **Environment**：
     - ✅ **必須勾選「Production」**
     - ⚠️ Preview 可選（用於測試）

3. **點擊「Save」儲存**

4. **重複設定其他三個變數**

### 步驟 3: 確認設定

設定完成後，您應該在列表中看到四個變數：

| 變數名稱 | 環境 | 值 |
|---------|------|---|
| `VITE_LINE_LIFF_ID` | Production | `2008398150-kRq2E2Ro` |
| `VITE_LINE_CHANNEL_ID` | Production | `2008398150` |
| `VITE_API_BASE_URL` | Production | `https://booking-api-public.afago101.workers.dev/api` |
| `VITE_ADMIN_API_KEY` | Production | `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL` |

---

## 🚀 重新部署前端

**⚠️ 重要：設定環境變數後必須重新部署才會生效！**

### 方法 A: Dashboard 重新部署（推薦）

1. 在 Cloudflare Pages 專案中
2. 點擊「**Deployments**」標籤
3. 找到最新的部署（應該是最上面那個）
4. 點擊右側「**...**」按鈕（三個點）
5. 選擇「**Retry deployment**」或「**重新部署**」

### 方法 B: 命令列重新部署

```powershell
# 在專案根目錄執行
npx vite build
npx wrangler pages deploy dist --project-name=booking-manager --commit-dirty=true
```

---

## ✅ 驗證設定

### 步驟 1: 等待部署完成
- 通常需要 1-2 分鐘
- 可以在 Deployments 頁面查看部署狀態

### 步驟 2: 清除瀏覽器快取
- 按 `Ctrl+Shift+R`（強制重新載入）
- 或開啟無痕模式測試

### 步驟 3: 檢查環境變數

在瀏覽器 Console（F12）執行：

```javascript
console.log('=== 環境變數檢查 ===');
console.log('VITE_LINE_LIFF_ID:', import.meta.env.VITE_LINE_LIFF_ID);
console.log('VITE_LINE_CHANNEL_ID:', import.meta.env.VITE_LINE_CHANNEL_ID);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
```

**預期結果：**
```
=== 環境變數檢查 ===
VITE_LINE_LIFF_ID: 2008398150-kRq2E2Ro
VITE_LINE_CHANNEL_ID: 2008398150
VITE_API_BASE_URL: https://booking-api-public.afago101.workers.dev/api
```

**如果顯示 `undefined`：**
- 表示環境變數未設定或未正確部署
- 請確認：
  1. 變數名稱完全正確（包括大小寫）
  2. 設定在 Production 環境
  3. 已重新部署

### 步驟 4: 測試 LIFF 初始化

從 LINE App 打開訂房頁，在 Console 應該看到：

```
[LIFF] Starting initialization...
[LIFF] LINE_LIFF_ID: 2008398150...（不是 "not set"）
[LIFF] LIFF initialized successfully
[LIFF] Profile received: { userId: "...", displayName: "..." }
```

---

## 🔍 兩個不同的設定位置總結

### 1. Cloudflare Workers（後端）- 您剛才看到的
**位置：** Workers & Pages → booking-api-public → Settings → Variables
**用途：** 後端 API 使用的環境變數
**包含：**
- ✅ `LINE_CHANNEL_ID`（已設定）
- ✅ `LINE_CHANNEL_SECRET`（已設定）
- ✅ `GOOGLE_SHEETS_ID`（已設定）
- ✅ 其他 Worker Secrets（已設定）

**不需要：** LIFF ID（Worker 不使用 LIFF）

### 2. Cloudflare Pages（前端）- 需要設定的地方
**位置：** Pages → booking-manager → Settings → Environment variables
**用途：** 前端構建時注入的環境變數
**需要設定：**
- ⚠️ `VITE_LINE_LIFF_ID`（需要設定）
- ⚠️ `VITE_LINE_CHANNEL_ID`（需要設定）
- ⚠️ `VITE_API_BASE_URL`（需要設定）
- ⚠️ `VITE_ADMIN_API_KEY`（需要設定）

---

## 📋 完整檢查清單

### 設定步驟
- [ ] 進入 Cloudflare Pages（不是 Workers）
- [ ] 進入 booking-manager 專案
- [ ] Settings → Environment variables
- [ ] 新增 `VITE_LINE_LIFF_ID` = `2008398150-kRq2E2Ro`（Production）
- [ ] 新增 `VITE_LINE_CHANNEL_ID` = `2008398150`（Production）
- [ ] 新增 `VITE_API_BASE_URL` = `https://booking-api-public.afago101.workers.dev/api`（Production）
- [ ] 新增 `VITE_ADMIN_API_KEY` = `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL`（Production）
- [ ] 重新部署前端

### 驗證結果
- [ ] Console 顯示 LIFF ID 正確
- [ ] 從 LINE App 進入能自動取得使用者資訊
- [ ] 後台日誌顯示 LIFF 初始化成功

---

## 🎯 立即行動

**請執行以下操作：**

1. **前往 Cloudflare Pages Dashboard**
   - https://dash.cloudflare.com → Pages → booking-manager → Settings → Environment variables

2. **設定四個環境變數**（如上所述）

3. **重新部署前端**
   - Deployments → 最新部署的「...」→「Retry deployment」

4. **驗證設定**
   - 在 Console 檢查環境變數是否正確讀取

---

**設定完成後告訴我，我會協助驗證！**

