# Cloudflare Pages 環境變數檢查指南

## 📋 檢查方法

由於 wrangler CLI 無法直接列出 Cloudflare Pages 的環境變數，請使用以下方法檢查：

---

## 方法 1: 瀏覽器 Console 檢查（最快）

### 步驟：

1. **打開您的網站**
   - 訪問：`https://blessing-haven.marcux.uk/booking`
   - 或從 LINE App 打開訂房頁

2. **打開開發者工具**
   - 按 `F12` 或右鍵選擇「檢查」
   - 切換到「Console」標籤

3. **執行檢查腳本**

複製以下代碼到 Console 執行：

```javascript
// 檢查環境變數
console.log('=== 環境變數檢查 ===');
console.log('VITE_LINE_LIFF_ID:', import.meta.env.VITE_LINE_LIFF_ID || '未設定');
console.log('VITE_LINE_CHANNEL_ID:', import.meta.env.VITE_LINE_CHANNEL_ID || '未設定');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || '未設定');

// 檢查 LIFF ID 是否正確
const liffId = import.meta.env.VITE_LINE_LIFF_ID;
if (liffId === '2008398150-kRq2E2Ro') {
  console.log('✅ LIFF ID 正確');
} else if (liffId) {
  console.log('⚠️  LIFF ID 不匹配:', liffId);
} else {
  console.log('❌ LIFF ID 未設定');
}
```

**預期結果：**
- ✅ `VITE_LINE_LIFF_ID` 應該顯示：`2008398150-kRq2E2Ro`
- ✅ `VITE_LINE_CHANNEL_ID` 應該顯示：`2008398150`
- ✅ `VITE_API_BASE_URL` 應該顯示：`https://booking-api-public.afago101.workers.dev/api`

**如果顯示 `undefined` 或空字串：**
- 表示環境變數未設定或未正確部署

---

## 方法 2: 使用診斷腳本

我已經創建了完整的診斷腳本：`check_line_setup.js`

在瀏覽器 Console 中執行整個腳本的內容，會顯示詳細的檢查結果。

---

## 方法 3: Cloudflare Dashboard 手動檢查

1. **登入 Cloudflare Dashboard**
   - https://dash.cloudflare.com

2. **進入 Pages 專案**
   - 左側選單 →「Pages」
   - 選擇專案「booking-manager」

3. **檢查環境變數**
   - 點擊「Settings」標籤
   - 點擊「Environment variables」
   - 查看 **Production** 環境的變數列表

**需要確認的變數：**

| 變數名稱 | 應該的值 | 是否設定？ |
|---------|---------|-----------|
| `VITE_LINE_LIFF_ID` | `2008398150-kRq2E2Ro` | ⚠️ 需要確認 |
| `VITE_LINE_CHANNEL_ID` | `2008398150` | ⚠️ 需要確認 |
| `VITE_API_BASE_URL` | `https://booking-api-public.afago101.workers.dev/api` | ⚠️ 需要確認 |
| `VITE_ADMIN_API_KEY` | `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL` | ⚠️ 需要確認 |

**⚠️ 重要：**
- 必須設定在 **Production** 環境
- 如果設定在 Preview 或 Development，不會在正式環境生效

---

## 🔧 如果需要設定環境變數

### 步驟 1: 在 Dashboard 設定

1. Cloudflare Dashboard → Pages → booking-manager
2. Settings → Environment variables
3. 點擊「Add variable」

**設定每個變數：**

**變數 1:**
- Name: `VITE_LINE_LIFF_ID`
- Value: `2008398150-kRq2E2Ro`
- Environment: ✅ **Production**（必須勾選！）

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

4. 點擊「Save」儲存每個變數

### 步驟 2: 重新部署

**方法 A: Dashboard（推薦）**
1. 前往「Deployments」標籤
2. 找到最新的部署
3. 點擊「...」→「Retry deployment」

**方法 B: 命令列**
```powershell
npx vite build
npx wrangler pages deploy dist --project-name=booking-manager --commit-dirty=true
```

---

## ✅ 驗證設定

### 測試步驟：

1. **等待部署完成**
   - 通常需要 1-2 分鐘

2. **清除瀏覽器快取**
   - 按 `Ctrl+Shift+R`（強制重新載入）
   - 或開啟無痕模式

3. **在 Console 再次檢查**
   - 執行檢查代碼
   - 確認環境變數已正確讀取

4. **檢查後台日誌**
   - 從 LINE App 打開訂房頁
   - 在後台「服務日誌」查看
   - 應該看到 `liff_init_start` 且 `hasLiffId: true`

---

## 🎯 預期結果

如果環境變數設定正確，應該看到：

**Console 日誌：**
```
[LIFF] Starting initialization...
[LIFF] LINE_LIFF_ID: 2008398150...（不是 "not set"）
[LIFF] LINE_CHANNEL_ID: 2008398150
[LIFF] LIFF initialized successfully
```

**後台日誌：**
```json
{
  "service": "line",
  "action": "liff_init_start",
  "status": "info",
  "details": {
    "hasLiffId": true,
    "hasChannelId": true,
    "isInLineApp": true
  }
}
```

---

## 📞 檢查結果

請執行上述檢查並告訴我結果：

1. **Console 顯示的環境變數值是什麼？**
2. **是否有任何變數顯示 "未設定" 或 "undefined"？**
3. **LIFF ID 是否匹配 `2008398150-kRq2E2Ro`？**

根據結果，我會幫您：
- 設定缺失的環境變數
- 修正錯誤的值
- 重新部署前端

