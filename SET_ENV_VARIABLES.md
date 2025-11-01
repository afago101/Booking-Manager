# 設定 Cloudflare Pages 環境變數指南

## 📋 重要說明

**LIFF ID 是前端的環境變數**，必須設定在 **Cloudflare Pages**（不是 Worker）。

您剛才看到的畫面是 **Worker** 的環境變數設定，Worker 不需要 LIFF ID。

---

## 🎯 需要設定的位置

### Cloudflare Pages（前端）環境變數

**設定位置：**
1. 前往：https://dash.cloudflare.com
2. 選擇左側選單「**Pages**」
3. 選擇專案「**booking-manager**」
4. 進入「**Settings**」標籤
5. 點擊「**Environment variables**」

---

## 📝 需要設定的環境變數

在 Cloudflare Pages 的 **Production** 環境中，需要設定以下變數：

### 變數 1: VITE_LINE_LIFF_ID
```
Name: VITE_LINE_LIFF_ID
Value: 2008398150-kRq2E2Ro
Environment: ✅ Production（必須勾選）
```

### 變數 2: VITE_LINE_CHANNEL_ID
```
Name: VITE_LINE_CHANNEL_ID
Value: 2008398150
Environment: ✅ Production
```

### 變數 3: VITE_API_BASE_URL
```
Name: VITE_API_BASE_URL
Value: https://booking-api-public.afago101.workers.dev/api
Environment: ✅ Production
```

### 變數 4: VITE_ADMIN_API_KEY
```
Name: VITE_ADMIN_API_KEY
Value: 40lVHrWkepi2cOwZq7U19vIgNFaDoRXL
Environment: ✅ Production
```

---

## 🔧 詳細設定步驟

### 步驟 1: 進入環境變數設定頁面

1. **登入 Cloudflare Dashboard**
   - https://dash.cloudflare.com

2. **進入 Pages 專案**
   - 左側選單 →「**Pages**」
   - 選擇專案「**booking-manager**」

3. **進入環境變數設定**
   - 點擊頂部「**Settings**」標籤
   - 在左側選單中找到「**Environment variables**」
   - 點擊進入

### 步驟 2: 新增環境變數

對每個變數執行以下操作：

1. **點擊「Add variable」或「新增變數」按鈕**

2. **填入變數資訊**
   - **Variable name（變數名稱）**：例如 `VITE_LINE_LIFF_ID`
   - **Value（值）**：例如 `2008398150-kRq2E2Ro`
   - **Environment（環境）**：
     - ✅ 勾選「**Production**」（必須！）
     - ⚠️ 可選勾選「Preview」（用於預覽環境測試）

3. **點擊「Save」儲存**

4. **重複步驟 1-3 設定其他變數**

### 步驟 3: 確認所有變數

設定完成後，應該在列表中看到：

| 變數名稱 | 環境 | 狀態 |
|---------|------|------|
| `VITE_LINE_LIFF_ID` | Production | ✅ |
| `VITE_LINE_CHANNEL_ID` | Production | ✅ |
| `VITE_API_BASE_URL` | Production | ✅ |
| `VITE_ADMIN_API_KEY` | Production | ✅ |

---

## 🚀 重新部署前端

**⚠️ 重要：設定環境變數後必須重新部署才會生效！**

### 方法 A: Dashboard 重新部署（推薦）

1. 在 Cloudflare Pages 專案中
2. 點擊「**Deployments**」標籤
3. 找到最新的部署
4. 點擊右側「**...**」按鈕
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

### 步驟 2: 清除瀏覽器快取
- 按 `Ctrl+Shift+R`（強制重新載入）
- 或開啟無痕模式測試

### 步驟 3: 檢查環境變數

在瀏覽器 Console（F12）執行：

```javascript
console.log('VITE_LINE_LIFF_ID:', import.meta.env.VITE_LINE_LIFF_ID);
console.log('VITE_LINE_CHANNEL_ID:', import.meta.env.VITE_LINE_CHANNEL_ID);
```

**預期結果：**
```
VITE_LINE_LIFF_ID: 2008398150-kRq2E2Ro
VITE_LINE_CHANNEL_ID: 2008398150
```

### 步驟 4: 測試 LIFF 初始化

從 LINE App 打開訂房頁，在 Console 應該看到：

```
[LIFF] Starting initialization...
[LIFF] LINE_LIFF_ID: 2008398150...（不是 "not set"）
[LIFF] LIFF initialized successfully
```

---

## 📋 完整檢查清單

### Cloudflare Pages 環境變數
- [ ] `VITE_LINE_LIFF_ID` = `2008398150-kRq2E2Ro`（Production）
- [ ] `VITE_LINE_CHANNEL_ID` = `2008398150`（Production）
- [ ] `VITE_API_BASE_URL` = `https://booking-api-public.afago101.workers.dev/api`（Production）
- [ ] `VITE_ADMIN_API_KEY` = `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL`（Production）
- [ ] 設定後已重新部署

### 驗證結果
- [ ] Console 顯示 LIFF ID 正確
- [ ] 從 LINE App 進入能自動取得使用者資訊
- [ ] 後台日誌顯示 LIFF 初始化成功

---

## 🔄 兩個不同的設定位置

### 1. Cloudflare Workers（後端）- 您剛才看到的畫面
**用途**：後端 API 使用的環境變數
- `LINE_CHANNEL_ID` ✅（已設定）
- `LINE_CHANNEL_SECRET` ✅（已設定）
- 其他 Worker Secrets ✅（已設定）

**不需要** LIFF ID（因為 Worker 不使用 LIFF）

### 2. Cloudflare Pages（前端）- 需要設定的地方
**用途**：前端構建時注入的環境變數
- `VITE_LINE_LIFF_ID` ⚠️（需要設定）
- `VITE_LINE_CHANNEL_ID` ⚠️（需要設定）
- `VITE_API_BASE_URL` ⚠️（需要設定）
- `VITE_ADMIN_API_KEY` ⚠️（需要設定）

---

## 🎯 立即行動

1. **前往 Cloudflare Pages Dashboard**
   - https://dash.cloudflare.com → Pages → booking-manager → Settings → Environment variables

2. **設定四個環境變數**（如上所述）

3. **重新部署前端**

4. **驗證設定**（使用 Console 檢查）

---

**設定完成後告訴我，我會協助您驗證！**

