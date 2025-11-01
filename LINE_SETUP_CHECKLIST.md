# LINE 整合設定檢查清單

## ✅ 已完成項目

### 後端 (Cloudflare Workers)
- ✅ LINE_CHANNEL_ID: 2008398150
- ✅ LINE_CHANNEL_SECRET: f23bfe3dad87420a45827608c6a719b9
- ✅ OAuth callback handler (`/api/line/oauth/callback`)
- ✅ Token 驗證 endpoint (`/api/line/verify`)
- ✅ Config API (`/api/line/config`) - 前端可取得 Channel ID
- ✅ Worker 已部署：https://booking-api-public.afago101.workers.dev

### 前端 (Cloudflare Pages)
- ✅ 已部署：https://068d675d.booking-manager-pil.pages.dev
- ✅ LINE Login OAuth 流程已實作
- ✅ 優惠券功能已整合
- ✅ 訂房頁面已整合 LINE 綁定

### Google Sheets
- ✅ Customer_Profile 工作表（自動建立）
- ✅ Coupons 工作表（自動建立）
- ✅ Bookings 工作表已支援 lineUserId 和 couponCode

---

## ⚠️ 需要您完成的設定

### 1. LINE Developers Console 設定（必須）

**步驟：**

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇您的 Provider
3. 選擇 **LINE Login Channel** (Channel ID: 2008398150)
4. 進入 **「Channel settings」** → **「LINE Login settings」**

#### Callback URL 設定

在「Callback URL」欄位中，新增以下 URL（每行一個）：

```
https://blessing-haven.marcux.uk/booking
https://blessing-haven.marcux.uk/confirmation
https://blessing-haven.marcux.uk/
```

**注意：**
- 這些是**不含 hash (#)** 的實際路徑
- LINE OAuth callback 會回到這些 URL，並加上 `?code=...&state=...`
- 前端會自動處理 callback 並恢復到正確的 hash 路由（例如 `#/booking`）

#### Scope 設定

- ✅ **Scope** 只需要：`profile`（不需要 `openid`）
- ⚠️ **不需要啟用 OpenID Connect**
- ⚠️ **不需要請求 email 權限**

---

### 2. 前端環境變數（可選，但建議設定）

**如果未設定，系統會從後端取得 Channel ID，但設定後效能更好。**

#### 方法 A：Cloudflare Pages Dashboard 設定

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇「Pages」→ 您的專案「booking-manager」
3. 進入 **「Settings」** → **「Environment variables」**
4. 新增以下變數：

**Production 環境：**
- `VITE_API_BASE_URL` = `https://booking-api-public.afago101.workers.dev/api`
- `VITE_ADMIN_API_KEY` = `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL`
- `VITE_LINE_CHANNEL_ID` = `2008398150`（可選，但建議設定）

#### 方法 B：使用 Wrangler CLI（不會即時生效，需要重新部署）

```powershell
# 在專案根目錄執行
echo "VITE_API_BASE_URL=https://booking-api-public.afago101.workers.dev/api" >> .env.production
echo "VITE_ADMIN_API_KEY=40lVHrWkepi2cOwZq7U19vIgNFaDoRXL" >> .env.production
echo "VITE_LINE_CHANNEL_ID=2008398150" >> .env.production
```

然後重新建置和部署：
```powershell
npm run build
npx wrangler pages deploy dist --project-name=booking-manager
```

---

### 3. Google Sheets 初始化（自動處理）

**系統會自動建立以下工作表（如果不存在）：**

- ✅ `Customer_Profile` - 會員資料
- ✅ `Coupons` - 優惠券資料

**欄位結構：**

**Customer_Profile：**
```
lineUserId | guestName | contactPhone | email | lineName | totalNights | totalBookings | createdAt | updatedAt
```

**Coupons：**
```
id | couponCode | type | lineUserId | status | value | minNights | createdAt | usedAt | expiresAt
```

**注意：** 第一次呼叫 API 時會自動建立，不需要手動建立。

---

## 🧪 測試步驟

### 測試 1：驗證後端 API

```powershell
# 測試 LINE Config API
Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/line/config"
```

**預期結果：**
```json
{
  "channelId": "2008398150"
}
```

### 測試 2：從 LINE 環境進入訂房頁

1. 在 LINE 中開啟連結：
   ```
   https://blessing-haven.marcux.uk/#/booking
   ```
2. 系統應自動偵測 LINE 環境
3. 如果已登入 LINE，應能自動取得 UID
4. 訂房完成後，LINE UID 應自動保存

### 測試 3：純網頁訂房後綁定 LINE

1. 從一般瀏覽器開啟：
   ```
   https://blessing-haven.marcux.uk/#/booking
   ```
2. 完成訂房（不登入 LINE）
3. 在確認頁面點擊「綁定 LINE 帳號以享常客優惠」
4. 應跳轉到 LINE Login 頁面
5. 登入後返回並完成綁定

### 測試 4：優惠券功能

1. 綁定 LINE 後完成訂房（住 2 晚以上）
2. 系統應自動發放「住兩晚折 300」優惠券
3. 前往優惠頁面：
   ```
   https://blessing-haven.marcux.uk/#/benefits
   ```
4. 應能看到優惠券清單
5. 下次訂房時，應能在訂房頁面選擇優惠券

### 測試 5：後台管理

1. 登入後台：
   ```
   https://blessing-haven.marcux.uk/#/admin/login
   ```
2. 進入「會員管理」標籤
3. 應能看到所有綁定 LINE 的會員
4. 進入「優惠券管理」標籤
5. 應能看到所有優惠券（可手動新增、修改）

---

## 📋 功能檢查清單

### LINE Login 功能
- [ ] 從 LINE 進入時自動取得 UID
- [ ] 純網頁訂單完成後可綁定 LINE
- [ ] OAuth callback 正常運作
- [ ] Token 驗證正常

### 訂房功能
- [ ] 訂房時可選擇優惠券
- [ ] 優惠券折扣正確計算
- [ ] LINE UID 正確保存到訂單

### 常客優惠
- [ ] 自動發放「住兩晚折 300」優惠券
- [ ] 累計 10 晚後自動發放「10 晚送 1 晚」優惠券
- [ ] 優惠券頁面正常顯示
- [ ] 優惠券可正常使用

### 後台管理
- [ ] 會員管理介面正常顯示
- [ ] 可查看會員訂單記錄
- [ ] 優惠券管理介面正常運作
- [ ] 可手動新增/修改優惠券

---

## 🐛 常見問題

### Q1: 點擊「綁定 LINE」後沒有反應？

**檢查：**
1. LINE Developers Console 的 Callback URL 是否已設定
2. 瀏覽器 Console 是否有錯誤訊息
3. 後端 API 是否正常運作

### Q2: 優惠券沒有自動發放？

**檢查：**
1. Customer_Profile 工作表是否已建立
2. 訂房時是否有正確保存 lineUserId
3. 累計晚數是否正確更新

### Q3: 從 LINE 進入無法取得 UID？

**檢查：**
1. LINE Login settings 中 OpenID Connect 是否啟用
2. Scope 是否包含 `openid` 和 `profile`
3. 是否在 LINE 內開啟（不是外部瀏覽器）

---

## 📞 支援

如果遇到問題，請檢查：
1. Cloudflare Workers Logs（在 Dashboard 中查看）
2. 瀏覽器 Console（F12）
3. 後端 API 回應（使用 Postman 或 curl）

---

## ✅ 完成檢查

當所有項目都完成後，請確認：

- [ ] LINE Developers Console 的 Callback URL 已設定
- [ ] 前端環境變數已設定（可選）
- [ ] 從 LINE 進入測試成功
- [ ] 純網頁綁定測試成功
- [ ] 優惠券功能測試成功
- [ ] 後台管理功能測試成功

---

**最後更新：** 2025-10-31

