# LIFF 環境變數檢查總結

## ✅ 已確認的設定

根據您的回報：

1. ✅ **Endpoint URL**: `https://blessing-haven.marcux.uk`（正確！）
2. ✅ **Scope**: 包含 `profile` 和 `openid`（正確！）
3. ⚠️  **環境變數**: 需要檢查 Cloudflare Pages 設定

---

## 🔍 Cloudflare Pages 環境變數檢查

由於 wrangler CLI 無法直接列出 Pages 環境變數，我創建了診斷腳本來檢查。

### 方法 1: 使用診斷腳本（推薦）

**在瀏覽器 Console 中執行：**

1. 打開您的網站：`https://blessing-haven.marcux.uk/booking`
2. 按 F12 打開開發者工具
3. 在 Console 標籤中執行：

```javascript
// 檢查環境變數
console.log('VITE_LINE_LIFF_ID:', import.meta.env.VITE_LINE_LIFF_ID);
console.log('VITE_LINE_CHANNEL_ID:', import.meta.env.VITE_LINE_CHANNEL_ID);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
```

**預期結果：**
- `VITE_LINE_LIFF_ID` 應該顯示：`2008398150-kRq2E2Ro`
- `VITE_LINE_CHANNEL_ID` 應該顯示：`2008398150`
- `VITE_API_BASE_URL` 應該顯示：`https://booking-api-public.afago101.workers.dev/api`

**如果顯示 `undefined` 或空字串：**
- 表示環境變數未設定或未正確部署

---

### 方法 2: 手動檢查 Cloudflare Dashboard

1. **前往 Cloudflare Dashboard**
   - https://dash.cloudflare.com
   - 登入您的帳號

2. **進入 Pages 專案設定**
   - 選擇左側選單「Pages」
   - 選擇專案「booking-manager」
   - 進入「Settings」標籤
   - 點擊「Environment variables」

3. **檢查以下環境變數（Production 環境）：**

| 變數名稱 | 應該的值 | 狀態 |
|---------|---------|------|
| `VITE_LINE_LIFF_ID` | `2008398150-kRq2E2Ro` | ⚠️ 需要確認 |
| `VITE_LINE_CHANNEL_ID` | `2008398150` | ⚠️ 需要確認 |
| `VITE_API_BASE_URL` | `https://booking-api-public.afago101.workers.dev/api` | ⚠️ 需要確認 |
| `VITE_ADMIN_API_KEY` | `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL` | ⚠️ 需要確認 |

**重要注意事項：**
- ✅ 必須設定在 **Production** 環境
- ✅ 設定後必須重新部署才會生效
- ✅ 環境變數名稱必須完全正確（包括大小寫）

---

## 🛠️ 如果需要設定或修改環境變數

### 步驟 1: 設定環境變數

在 Cloudflare Pages Dashboard：

1. Settings → Environment variables
2. 點擊「Add variable」
3. 填入以下資訊：

**變數 1:**
- Name: `VITE_LINE_LIFF_ID`
- Value: `2008398150-kRq2E2Ro`
- Environment: ✅ **Production**（必須勾選）

**變數 2:**
- Name: `VITE_LINE_CHANNEL_ID`
- Value: `2008398150`
- Environment: ✅ **Production**

**變數 3:**
- Name: `VITE_API_BASE_URL`
- Value: `https://booking-api-public.afago101.workers.dev/api`
- Environment: ✅ **Production**

**變數 4:**
- Name: `VITE_ADMIN_API_KEY`
- Value: `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL`
- Environment: ✅ **Production**

4. 點擊「Save」

### 步驟 2: 重新部署

**方法 A: 使用 Dashboard（推薦）**
1. 前往「Deployments」標籤
2. 找到最新的部署
3. 點擊「...」→「Retry deployment」

**方法 B: 使用命令列**
```powershell
npm run build
npx wrangler pages deploy dist --project-name=booking-manager --commit-dirty=true
```

---

## 🧪 驗證環境變數是否生效

### 測試步驟：

1. **確保已重新部署**
   - 等待部署完成（通常需要 1-2 分鐘）

2. **清除瀏覽器快取**
   - 按 Ctrl+Shift+R（Windows）或 Cmd+Shift+R（Mac）
   - 或開啟無痕模式測試

3. **檢查 Console 日誌**
   - 打開開發者工具（F12）
   - 在 Console 中查看 `[LIFF]` 相關日誌
   - 應該看到：`[LIFF] LINE_LIFF_ID: 2008398150...`（不是 "not set"）

4. **檢查後台日誌**
   - 從 LINE App 打開訂房頁
   - 在後台「服務日誌」中查看
   - 應該看到 `liff_init_start` 和 `liff_init_success` 日誌

---

## 📋 完整檢查清單

### LINE Developers Console ✅
- [x] LIFF ID: `2008398150-kRq2E2Ro`
- [x] Endpoint URL: `https://blessing-haven.marcux.uk`（正確！）
- [x] Scope: 包含 `profile` 和 `openid`（正確！）

### Cloudflare Pages ⚠️
- [ ] `VITE_LINE_LIFF_ID` = `2008398150-kRq2E2Ro`（需要確認）
- [ ] `VITE_LINE_CHANNEL_ID` = `2008398150`（需要確認）
- [ ] `VITE_API_BASE_URL` = `https://booking-api-public.afago101.workers.dev/api`（需要確認）
- [ ] 所有變數設定在 **Production** 環境（需要確認）
- [ ] 環境變數設定後已重新部署（需要確認）

---

## 🎯 下一步

**請執行以下操作之一：**

1. **在 Cloudflare Dashboard 檢查環境變數**
   - 告訴我哪些變數已設定，哪些未設定

2. **在瀏覽器 Console 執行診斷**
   - 執行上述的 JavaScript 代碼
   - 告訴我顯示的值是什麼

3. **讓我直接幫您設定**
   - 我可以準備設定指令，但需要您確認或在 Dashboard 中手動設定

---

**診斷腳本已保存至：** `check_cloudflare_env.js`

您可以在瀏覽器 Console 中複製執行，或告訴我檢查結果，我會協助您設定。

