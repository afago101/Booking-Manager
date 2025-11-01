# LINE 會員資料問題診斷指南

## 🔍 立即診斷步驟

### 步驟 1: 檢查瀏覽器 Console（最重要！）

1. **從 LINE App 開啟訂房頁面**
2. **開啟開發者工具**（F12）
3. **查看 Console 標籤**
4. **記錄所有錯誤訊息**

**常見錯誤訊息：**
- ❌ `LIFF init failed` → **需要設定 LIFF ID**
- ❌ `LINE Channel ID not configured` → **需要設定環境變數**
- ❌ `Failed to exchange OAuth code` → **Callback URL 未設定**
- ❌ `CORS error` → **CORS_ORIGINS 未設定**

---

### 步驟 2: 檢查 Network 請求

1. **開啟開發者工具**（F12）
2. **進入 Network 標籤**
3. **過濾：** 選擇 `XHR` 或 `Fetch`
4. **從 LINE 進入訂房頁面**
5. **查看以下 API 請求：**
   - `/api/line/config` - 應該返回 Channel ID
   - `/api/line/sync-profile` - 應該成功（200）
   - `/api/line/coupons/:lineUserId` - 應該成功（200）

**如果請求失敗：**
- 點擊請求查看詳細資訊
- 查看 Response 標籤中的錯誤訊息
- 查看 Request 標籤中的請求內容

---

### 步驟 3: 手動測試同步 API

在瀏覽器 Console 執行以下程式碼：

```javascript
// 測試同步 API
async function testSync() {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
    
    const response = await fetch(`${API_BASE_URL}/line/sync-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lineUserId: 'test_user_123',
        name: '測試使用者',
        picture: 'https://example.com/picture.jpg',
        guestName: '測試姓名',
        contactPhone: '0912345678',
        email: 'test@example.com'
      })
    });
    
    const result = await response.json();
    console.log('同步結果:', result);
    return result;
  } catch (error) {
    console.error('同步失敗:', error);
  }
}

// 執行測試
testSync();
```

**預期結果：**
```json
{
  "success": true,
  "profile": {
    "lineUserId": "test_user_123",
    "guestName": "測試姓名",
    ...
  },
  "message": "Customer profile synced successfully"
}
```

---

### 步驟 4: 檢查環境變數

在瀏覽器 Console 執行：

```javascript
console.log('環境變數檢查:');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('VITE_LINE_CHANNEL_ID:', import.meta.env.VITE_LINE_CHANNEL_ID);
console.log('VITE_LINE_LIFF_ID:', import.meta.env.VITE_LINE_LIFF_ID);
```

**預期結果：**
- `VITE_API_BASE_URL` 應該是：`https://booking-api-public.afago101.workers.dev/api`
- `VITE_LINE_CHANNEL_ID` 應該是：`2008398150`
- `VITE_LINE_LIFF_ID` 可以是空的（如果沒有設定 LIFF）

**如果環境變數為空或錯誤：**
1. 前往 Cloudflare Pages Dashboard
2. 設定環境變數
3. 重新部署前端

---

### 步驟 5: 檢查 LINE 登入狀態

在瀏覽器 Console 執行：

```javascript
// 檢查是否在 LINE 環境中
const isInLine = navigator.userAgent.includes('Line') || navigator.userAgent.includes('LINE');
console.log('是否在 LINE 環境:', isInLine);

// 檢查 LIFF 狀態
console.log('LIFF 是否已載入:', typeof window.liff !== 'undefined');
if (window.liff) {
  console.log('LIFF isInClient:', window.liff.isInClient());
  console.log('LIFF isLoggedIn:', window.liff.isLoggedIn());
}
```

---

## 🛠️ 最可能的問題和解決方法

### 問題 A: LIFF ID 未設定（最常見）

**症狀：**
- 從 LINE 進入時無法取得使用者資訊
- Console 顯示 `LIFF init failed`

**解決方法：**

1. **建立 LIFF App：**
   - 前往 [LINE Developers Console](https://developers.line.biz/)
   - 選擇 Channel ID `2008398150`
   - 進入「LIFF」標籤 → 點擊「Add」
   - 設定：
     - App name: `Booking Manager`
     - Size: `Full`
     - Endpoint URL: `https://blessing-haven.marcux.uk`
   - 取得 LIFF ID

2. **設定環境變數：**
   - Cloudflare Pages Dashboard
   - 設定 `VITE_LINE_LIFF_ID` = 您的 LIFF ID
   - 重新部署

---

### 問題 B: 環境變數未設定

**症狀：**
- Console 顯示 `LINE Channel ID not configured`
- 無法呼叫 LINE API

**解決方法：**

在 Cloudflare Pages Dashboard 設定：
- `VITE_API_BASE_URL` = `https://booking-api-public.afago101.workers.dev/api`
- `VITE_LINE_CHANNEL_ID` = `2008398150`
- 重新部署

---

### 問題 C: Callback URL 未設定

**症狀：**
- OAuth 登入失敗
- 錯誤訊息：`Invalid redirect_uri`

**解決方法：**

在 LINE Developers Console 設定 Callback URL：
```
https://blessing-haven.marcux.uk/booking
https://blessing-haven.marcux.uk/confirmation
https://blessing-haven.marcux.uk/
```

---

### 問題 D: Customer_Profile 工作表不存在

**症狀：**
- API 呼叫成功但資料沒有寫入

**解決方法：**

在 Google Sheets 中建立 `Customer_Profile` 工作表，欄位：
```
lineUserId | guestName | contactPhone | email | lineName | totalNights | totalBookings | createdAt | updatedAt
```

或呼叫初始化 API：
```powershell
$headers = @{
    "x-admin-key" = "40lVHrWkepi2cOwZq7U19vIgNFaDoRXL"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/admin/initialize" `
    -Method POST `
    -Headers $headers
```

---

## 📊 診斷報告範本

請填寫以下資訊以便進一步診斷：

```
1. 從哪裡進入？
   [ ] LINE App
   [ ] 一般瀏覽器

2. 執行了什麼操作？
   - 

3. Console 錯誤訊息：
   - 

4. Network 請求狀態：
   - /api/line/config: [ ] 成功 [ ] 失敗
   - /api/line/sync-profile: [ ] 成功 [ ] 失敗
   - 錯誤訊息：

5. 環境變數檢查：
   - VITE_API_BASE_URL: 
   - VITE_LINE_CHANNEL_ID: 
   - VITE_LINE_LIFF_ID: 

6. LINE Developers Console 設定：
   - [ ] Callback URL 已設定
   - [ ] 使用的 Channel ID: 
   - [ ] LIFF App 已建立: [ ] 是 [ ] 否

7. Google Sheets：
   - [ ] Service Account 有編輯權限
   - [ ] Customer_Profile 工作表存在
```

---

**請先執行步驟 1-5，並提供診斷結果！**

