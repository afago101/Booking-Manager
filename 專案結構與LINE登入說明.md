# 專案結構與 LINE 登入完整說明

## 📁 專案整體架構

### 專案類型
- **前端**：React + TypeScript + Vite（部署在 Cloudflare Pages）
- **後端**：Cloudflare Workers + Hono 框架（部署在 Cloudflare Workers）
- **資料庫**：Google Sheets（作為資料儲存）

### 目錄結構

```
V2/
├── components/              # React 元件
│   ├── HeaderMenu.tsx      # 頂部選單（包含 LINE 登入）
│   ├── BookingPriceCalendar.tsx
│   └── ...
├── pages/                  # 頁面元件
│   ├── BookingPage.tsx     # 訂房頁（整合 LINE 登入）
│   ├── BenefitsPage.tsx   # 優惠頁（需 LINE 登入）
│   ├── ConfirmationPage.tsx
│   ├── HomePage.tsx
│   └── ...
├── services/               # API 服務層
│   ├── apiService.ts      # 封裝所有 API 呼叫（包含 LINE API）
│   └── mockDb.ts
├── utils/                  # 工具函數
│   ├── lineLogin.ts       # ⭐ LINE 登入核心邏輯
│   └── ...
├── worker/                 # 後端 API（Cloudflare Workers）
│   └── src/
│       ├── handlers/
│       │   ├── line.ts    # ⭐ LINE 相關 API 處理器
│       │   ├── admin.ts
│       │   └── public.ts
│       ├── middleware/
│       └── utils/
└── types.ts               # 型別定義
```

---

## 🔐 LINE 登入架構總覽

### 支援的兩種登入方式

1. **LIFF（LINE Frontend Framework）**
   - 適用在 LINE App 內開啟網頁
   - 可以直接取得真正的 LINE User ID
   - 使用 `window.liff` API

2. **LINE Login OAuth 2.0**
   - 適用在一般瀏覽器開啟
   - 使用 OAuth 流程（授權碼模式）
   - 透過後端交換 token 取得使用者資訊

### 登入流程圖

```
使用者進入訂房頁
    ↓
是否在 LINE 環境中？
    ├─ 是 → 使用 LIFF
    │       ├─ 檢查是否已登入
    │       ├─ 未登入 → liff.login()
    │       └─ 已登入 → liff.getProfile()
    │
    └─ 否 → 使用 OAuth
            ├─ 點擊「綁定 LINE」按鈕
            ├─ 重定向到 LINE Login
            ├─ 使用者授權
            ├─ 回調到 redirect_uri?code=...
            ├─ 前端呼叫後端 /api/line/oauth/callback
            ├─ 後端交換 code 取得 accessToken
            └─ 前端取得 lineUserId
```

---

## 📝 關鍵檔案說明

### 1. `utils/lineLogin.ts`（前端 LINE 登入工具）

**主要函數：**

- `initLineLogin()`：初始化 LIFF（如果在 LINE 環境中）
- `isInLine()`：檢查是否在 LINE App 中
- `getLineProfile()`：取得 LINE 使用者資訊（LIFF 模式）
- `loginWithLine()`：觸發 LINE Login OAuth 流程（一般瀏覽器）
- `handleLineOAuthCallback()`：處理 OAuth callback（從 URL 參數取得 code）
- `logoutLine()`：登出 LINE

**環境變數：**
- `VITE_LINE_CHANNEL_ID`：LINE Channel ID
- `VITE_LINE_LIFF_ID`：LIFF App ID（可選）

**使用範例：**
```typescript
// 在 BookingPage.tsx 中
import { getLineProfile, isInLine, initLineLogin } from '../utils/lineLogin';

// 檢查是否在 LINE 環境中
if (isInLine()) {
  await initLineLogin();
  const lineUser = await getLineProfile();
  if (lineUser) {
    setLineUserId(lineUser.lineUserId);
  }
}
```

---

### 2. `worker/src/handlers/line.ts`（後端 LINE API）

**API 端點：**

#### `POST /api/line/oauth/callback`
- 處理 OAuth callback
- 交換 `authorization_code` 取得 `access_token`
- 使用 `access_token` 取得使用者資訊
- 返回 `accessToken` 和 `lineUserId`

```typescript
// 請求
POST /api/line/oauth/callback
{
  "code": "authorization_code",
  "redirectUri": "https://example.com/booking"
}

// 回應
{
  "accessToken": "...",
  "lineUserId": "U1234567890...",
  "name": "使用者名稱",
  "picture": "頭像 URL"
}
```

#### `POST /api/line/verify`
- 驗證 LINE Token（支援 idToken 或 accessToken）
- 如果是 `idToken`（LIFF），可取得真正的 LINE User ID
- 如果是 `accessToken`（OAuth），取得 LINE Login 的 userId

```typescript
// 請求
POST /api/line/verify
{
  "idToken": "..." // 或 "accessToken": "..."
}

// 回應
{
  "lineUserId": "U1234567890...",
  "name": "使用者名稱",
  "picture": "頭像 URL"
}
```

#### `GET /api/line/profile/:lineUserId`
- 取得或建立客戶資料

#### `POST /api/line/bind-booking`
- 將訂單與 LINE User ID 綁定
- 自動更新客戶累計晚數
- 自動發放優惠券：
  - 住 2 晚以上：發放「住兩晚折 300」優惠券
  - 累計 10 晚：發放「10 晚送 1 晚」優惠券

#### `GET /api/line/coupons/:lineUserId`
- 取得客戶的優惠券列表（僅有效的）

#### `GET /api/line/bookings/:lineUserId`
- 取得客戶的訂單列表

#### `POST /api/line/apply-coupon`
- 驗證優惠券並檢查是否符合使用條件

**環境變數（後端）：**
- `LINE_CHANNEL_ID`：LINE Channel ID
- `LINE_CHANNEL_SECRET`：LINE Channel Secret

---

### 3. `services/apiService.ts`（API 服務封裝）

**LINE 相關方法：**

```typescript
// 驗證 LINE Token
async verifyLineToken(token: string): Promise<{
  lineUserId: string;
  name?: string;
  picture?: string;
}>

// 取得客戶資料
async getCustomerProfile(lineUserId: string): Promise<CustomerProfile>

// 綁定訂單到 LINE 帳號
async bindBooking(
  bookingId: string,
  lineUserId: string,
  guestName?: string,
  contactPhone?: string,
  email?: string
): Promise<{ success: boolean; booking: Booking; profile: CustomerProfile }>

// 取得客戶優惠券
async getCustomerCoupons(lineUserId: string): Promise<Coupon[]>

// 取得客戶訂單
async getCustomerBookings(lineUserId: string): Promise<Booking[]>

// 驗證並應用優惠券
async applyCoupon(
  couponCode: string,
  checkInDate: string,
  checkOutDate: string,
  lineUserId: string
): Promise<{ valid: boolean; coupon: {...} }>
```

---

### 4. `pages/BookingPage.tsx`（訂房頁面整合）

**LINE 登入流程：**

1. **頁面載入時：**
   ```typescript
   useEffect(() => {
     // 處理 OAuth callback（從 URL 參數取得 code）
     const code = urlParams.get('code');
     if (code) {
       handleLineOAuthCallback().then(async (token) => {
         const result = await apiService.verifyLineToken(token);
         setLineUserId(result.lineUserId);
         loadCoupons(result.lineUserId);
       });
       return;
     }
   
     // 如果在 LINE 環境中，使用 LIFF
     if (isInLine()) {
       await initLineLogin();
       const lineUser = await getLineProfile();
       if (lineUser) {
         setLineUserId(lineUser.lineUserId);
         loadCoupons(lineUser.lineUserId);
       }
     } else {
       // 檢查 localStorage 是否有保存的 lineUserId
       const savedUserId = localStorage.getItem('lineUserId');
       if (savedUserId) {
         setLineUserId(savedUserId);
         loadCoupons(savedUserId);
       }
     }
   }, []);
   ```

2. **訂房完成後：**
   - 如果已登入 LINE，自動綁定訂單
   - 如果未登入，在確認頁可手動綁定

---

### 5. `pages/BenefitsPage.tsx`（優惠頁面）

**功能：**
- 顯示客戶累計住宿晚數和訂單數
- 顯示所有可用優惠券
- 顯示進度條（距離 10 晚還差幾晚）
- 可點擊優惠券直接跳轉到訂房頁使用

**LINE 驗證：**
- 必須已綁定 LINE 帳號才能查看
- 如果未綁定，顯示提示訊息

---

## 🔄 資料流程

### LINE 登入 → 綁定訂單 → 優惠券發放

```
1. 使用者登入 LINE
   ↓
2. 取得 lineUserId（LIFF 或 OAuth）
   ↓
3. 完成訂房
   ↓
4. 呼叫 bindBooking API
   ↓
5. 後端更新：
   - Bookings 工作表（加入 lineUserId）
   - Customer_Profile 工作表（累計晚數、訂單數）
   ↓
6. 檢查是否達到發放條件：
   - 住 2 晚以上 → 發放「住兩晚折 300」優惠券
   - 累計 10 晚 → 發放「10 晚送 1 晚」優惠券
   ↓
7. 寫入 Coupons 工作表
```

---

## 🗄️ Google Sheets 資料結構

### Bookings 工作表
- `lineUserId`：LINE User ID（綁定後才有）
- `couponCode`：使用的優惠券代碼

### Customer_Profile 工作表
```
lineUserId | guestName | contactPhone | email | lineName | totalNights | totalBookings | createdAt | updatedAt
```

### Coupons 工作表
```
id | couponCode | type | lineUserId | status | value | minNights | createdAt | usedAt | expiresAt
```

**優惠券類型：**
- `stay_discount`：住兩晚折 300 元
- `free_night`：10 晚送 1 晚（最便宜的一晚）

---

## ⚙️ 環境變數設定

### 前端（Cloudflare Pages）

**必要：**
- `VITE_API_BASE_URL`：後端 API 網址

**選填（建議設定）：**
- `VITE_LINE_CHANNEL_ID`：LINE Channel ID
- `VITE_LINE_LIFF_ID`：LIFF App ID（如果使用 LIFF）
- `VITE_ADMIN_API_KEY`：管理員 API Key

### 後端（Cloudflare Workers）

**必要：**
- `LINE_CHANNEL_ID`：LINE Channel ID
- `LINE_CHANNEL_SECRET`：LINE Channel Secret
- `GOOGLE_SHEETS_ID`：Google Sheets ID
- `GOOGLE_CLIENT_EMAIL`：Google Service Account Email
- `GOOGLE_PRIVATE_KEY`：Google Service Account Private Key

---

## 🔗 LINE Developers Console 設定

### Callback URL（必須）

在 LINE Developers Console 的「LINE Login settings」中設定：

```
https://your-domain.com/booking
https://your-domain.com/confirmation
https://your-domain.com/
```

**注意：**
- 這些是不含 hash (#) 的實際路徑
- OAuth callback 會回到這些 URL，並加上 `?code=...&state=...`
- 前端會自動處理並恢復到正確的 hash 路由

### Scope
- 只需要：`profile`
- **不需要** `openid`（如果不使用 OpenID Connect）

---

## 🧪 測試流程

### 測試 1：LINE App 內登入（LIFF）

1. 在 LINE 中開啟連結：`https://your-domain.com/#/booking`
2. 系統自動偵測 LINE 環境
3. 如果已登入 LINE，自動取得 UID
4. 完成訂房後，訂單自動綁定到 LINE 帳號

### 測試 2：一般瀏覽器 OAuth 登入

1. 從一般瀏覽器開啟：`https://your-domain.com/#/booking`
2. 完成訂房（不登入 LINE）
3. 在確認頁點擊「綁定 LINE 帳號」
4. 跳轉到 LINE Login 頁面
5. 授權後返回並完成綁定

### 測試 3：優惠券功能

1. 綁定 LINE 後完成訂房（住 2 晚以上）
2. 系統自動發放「住兩晚折 300」優惠券
3. 前往優惠頁：`https://your-domain.com/#/benefits`
4. 應能看到優惠券清單
5. 下次訂房時可選擇使用優惠券

---

## 🐛 常見問題

### Q1: OAuth callback 失敗？
- 檢查 Callback URL 是否正確設定
- 檢查 redirect_uri 是否與設定一致（不含 hash）
- 檢查瀏覽器 Console 錯誤訊息

### Q2: 無法取得 LINE User ID？
- LIFF：檢查是否在 LINE App 內開啟
- OAuth：檢查 Token 交換是否成功
- 檢查後端環境變數是否正確

### Q3: 優惠券沒有自動發放？
- 檢查 Customer_Profile 工作表是否已建立
- 檢查訂單是否正確綁定 lineUserId
- 檢查累計晚數計算是否正確

---

## 📚 相關檔案清單

### 核心檔案
- `utils/lineLogin.ts` - LINE 登入前端邏輯
- `worker/src/handlers/line.ts` - LINE 後端 API
- `services/apiService.ts` - API 服務封裝

### 使用 LINE 登入的頁面
- `pages/BookingPage.tsx` - 訂房頁（自動登入、綁定訂單）
- `pages/BenefitsPage.tsx` - 優惠頁（需登入）
- `pages/ConfirmationPage.tsx` - 確認頁（可手動綁定）

### 設定文件
- `LINE_SETUP_CHECKLIST.md` - LINE 設定檢查清單
- `LINE_CALLBACK_URL_FIX.md` - Callback URL 修復說明

---

**最後更新：** 2025-01-27

