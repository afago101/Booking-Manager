# LINE 部署問題已修復

## 🔍 發現的問題

**Channel ID 不一致！**

- ❌ 文件中寫的是：`2008396997`
- ✅ Worker 實際設定的是：`2008398150`

這導致前端和後端使用不同的 Channel ID，造成部署失敗。

---

## ✅ 已修復的項目

1. ✅ **Worker 已成功重新部署**
2. ✅ **確認 Worker 中的 LINE_CHANNEL_ID = `2008398150`**
3. ✅ **已更新文件中的 Channel ID**

---

## 🔧 需要您完成的設定

### 1. LINE Developers Console（必須）

**重要：使用正確的 Channel ID `2008398150`**

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇您的 Provider
3. 選擇 **LINE Login Channel** (Channel ID: **2008398150**)
4. 進入 **「Channel settings」** → **「LINE Login settings」**

#### Callback URL 設定

在「Callback URL」欄位中，新增以下 URL（每行一個，**不含 hash**）：

```
https://blessing-haven.marcux.uk/booking
https://blessing-haven.marcux.uk/confirmation
https://blessing-haven.marcux.uk/
```

### 2. 前端環境變數（建議設定）

#### 方法 A：Cloudflare Pages Dashboard（推薦）

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇「Pages」→ 專案「booking-manager」
3. 進入 **「Settings」** → **「Environment variables」**
4. 新增或更新：

**Production 環境：**
- `VITE_API_BASE_URL` = `https://booking-api-public.afago101.workers.dev/api`
- `VITE_ADMIN_API_KEY` = `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL`
- `VITE_LINE_CHANNEL_ID` = `2008398150` ⚠️ **使用正確的 Channel ID**

**注意：** 設定後需要重新建置和部署前端。

#### 方法 B：重新建置部署

```powershell
# 在專案根目錄
@"
VITE_API_BASE_URL=https://booking-api-public.afago101.workers.dev/api
VITE_ADMIN_API_KEY=40lVHrWkepi2cOwZq7U19vIgNFaDoRXL
VITE_LINE_CHANNEL_ID=2008398150
"@ | Out-File -FilePath .env.production -Encoding utf8

# 建置並部署
npm run build
npx wrangler pages deploy dist --project-name=booking-manager
```

---

## 🧪 驗證修復

### 步驟 1: 確認後端 API

```powershell
# 測試 LINE Config API
$config = Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/line/config"
Write-Host "Channel ID: $($config.channelId)"
```

**預期結果：**
```json
{
  "channelId": "2008398150"
}
```

### 步驟 2: 測試前端

1. 開啟瀏覽器開發者工具（F12）
2. 前往：`https://blessing-haven.marcux.uk/#/booking`
3. 檢查 Console 是否有錯誤
4. 嘗試 LINE 登入功能

### 步驟 3: 確認 LINE Developers Console 設定

1. 確認 Callback URL 已正確設定（三個 URL，不含 hash）
2. 確認使用的是 Channel ID `2008398150`
3. Scope 設定為 `profile`（不需要 `openid`）

---

## 📋 完整檢查清單

- [x] Worker 已部署 ✅
- [x] LINE Secrets 已設定 ✅
- [x] 確認正確的 Channel ID (`2008398150`) ✅
- [ ] **LINE Developers Console Callback URL 已設定**（需手動完成）
- [ ] **前端環境變數已設定**（建議完成）
- [ ] 前端已重新部署（如果修改了環境變數）

---

## 🎯 下一步

1. **立即完成：** 前往 LINE Developers Console 設定 Callback URL（使用 Channel ID `2008398150`）
2. **建議完成：** 在 Cloudflare Pages Dashboard 設定前端環境變數，並重新部署前端
3. **測試：** 完成上述設定後，測試 LINE 登入功能

---

## 📝 重要提醒

⚠️ **所有地方都必須使用 Channel ID `2008398150`：**
- LINE Developers Console
- 前端環境變數 `VITE_LINE_CHANNEL_ID`
- 任何配置文件

不要使用舊的 Channel ID `2008396997`！

---

**修復時間：** 2025-01-XX

