# LINE 登入邏輯完整分析

## 📋 目錄
1. [登入觸發方式](#登入觸發方式)
2. [兩種登入路徑](#兩種登入路徑)
3. [登入後處理流程](#登入後處理流程)
4. [數據寫入機制](#數據寫入機制)
5. [優惠券發放邏輯](#優惠券發放邏輯)
6. [完整流程圖](#完整流程圖)

---

## 登入觸發方式

### 1. **自動觸發（在 LINE App 內）**
**位置**: `pages/BookingPage.tsx` (130-249行)

**觸發條件**:
```typescript
// 檢查是否在 LINE 環境中（使用 userAgent）
const userAgent = navigator.userAgent || '';
const inLineEnv = userAgent.includes('Line') || userAgent.includes('LINE');

if (inLineEnv) {
  await initLineLogin();  // 初始化 LIFF SDK
  const lineUser = await getLineProfile();  // 取得 LINE 用戶資料
}
```

**流程**:
1. 頁面載入時自動檢測 LINE 環境
2. 初始化 LIFF SDK
3. 如果未登入，自動觸發 `window.liff.login()`
4. 登入成功後取得 profile

### 2. **OAuth Callback 觸發**
**位置**: `pages/BookingPage.tsx` (131-181行) 和 `pages/ConfirmationPage.tsx` (89-164行)

**觸發條件**:
```typescript
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

if (code && state) {
  // 處理 OAuth callback
  handleLineOAuthCallback().then(async (token) => {
    // 驗證 token 並取得 LINE User ID
    const result = await apiService.verifyLineToken(token);
    // 同步客戶資料
    await syncCustomerProfile(...);
  });
}
```

### 3. **手動觸發（在確認頁面綁定）**
**位置**: `pages/ConfirmationPage.tsx` (40-86行)

**觸發條件**:
- 用戶點擊「綁定 LINE 帳號」按鈕
- 訂單尚未綁定 LINE (`!lineUserId`)

**流程**:
```typescript
const handleBindLine = async () => {
  // 如果在 LINE 環境中，直接取得 profile
  if (isInLine()) {
    lineUserInfo = await getLineProfile();
  }
  
  // 如果不在 LINE 環境或未登入，打開 LINE 登入
  if (!lineUserInfo) {
    await loginWithLine();  // 重定向到 LINE 登入頁
    return;
  }
  
  // 綁定訂單
  await apiService.bindBooking(id, lineUserInfo.lineUserId, ...);
};
```

---

## 兩種登入路徑

### 路徑 A: LIFF（LINE Frontend Framework）- 在 LINE App 內

**文件**: `utils/lineLogin.ts` (16-118行)

**特點**:
- 僅在 LINE App 內可用
- 不需要 OpenID Connect
- 可以直接取得真正的 LINE User ID (`profile.userId`)
- 不需要重定向

**流程**:
```
1. initLineLogin()
   └─> 載入 LIFF SDK (`https://static.line-scdn.net/liff/edge/versions/2.27.0/sdk.js`)
   └─> window.liff.init({ liffId })

2. getLineProfile()
   └─> 檢查是否已登入 (window.liff.isLoggedIn())
   └─> 如果未登入，自動觸發 window.liff.login()
   └─> 取得 profile: window.liff.getProfile()
   └─> 返回 { lineUserId, name, picture }
```

**代碼位置**:
- 初始化: `utils/lineLogin.ts:16-118`
- 取得 profile: `utils/lineLogin.ts:141-203`

---

### 路徑 B: OAuth 2.0 - 在一般瀏覽器

**文件**: `utils/lineLogin.ts` (209-288行, 293-437行)

**特點**:
- 可在任何瀏覽器使用
- 需要重定向到 LINE 登入頁
- 使用 authorization code 流程
- 後端交換 token 取得用戶資料

**流程**:
```
1. loginWithLine() [前端]
   └─> 從環境變數或後端取得 LINE_CHANNEL_ID
   └─> 根據當前路徑決定 redirect_uri
       ├─ '/' → 'https://domain.com/'
       ├─ '/booking' → 'https://domain.com/booking'
       └─ '/confirmation' → 'https://domain.com/confirmation'
   └─> 生成 state 並儲存到 sessionStorage
   └─> 重定向到 LINE 授權頁:
       `https://access.line.me/oauth2/v2.1/authorize?
        response_type=code&
        client_id=${channelId}&
        redirect_uri=${redirectUri}&
        state=${state}&
        scope=profile`

2. LINE 回調 [前端處理]
   └─> handleLineOAuthCallback() [utils/lineLogin.ts:293]
       └─> 從 URL 取得 code 和 state
       └─> 驗證 state (防止 CSRF)
       └─> 發送 POST /api/line/oauth/callback
           {
             code,
             redirectUri,
             state
           }

3. 後端交換 token [worker/src/handlers/line.ts:13-174]
   └─> handleLineOAuthCallback()
       └─> 向 LINE API 交換 token:
           POST https://api.line.me/oauth2/v2.1/token
           {
             grant_type: 'authorization_code',
             code,
             redirect_uri: redirectUri,
             client_id: LINE_CHANNEL_ID,
             client_secret: LINE_CHANNEL_SECRET
           }
       └─> 取得 accessToken
       └─> 使用 accessToken 取得用戶資料:
           GET https://api.line.me/v2/profile
           Authorization: Bearer ${accessToken}
       └─> 返回給前端:
           {
             accessToken,
             lineUserId: lineUser.userId,  // LINE Login 的 userId
             name: lineUser.displayName,
             picture: lineUser.pictureUrl
           }

4. 前端驗證 token [前端]
   └─> apiService.verifyLineToken(token)
       └─> POST /api/line/verify
           {
             idToken?: string,      // 如果是 LIFF
             accessToken?: string  // 如果是 OAuth
           }

5. 後端驗證 [worker/src/handlers/line.ts:183-346]
   └─> handleVerifyLineToken()
       ├─> 如果有 idToken (LIFF):
       │   └─> POST https://api.line.me/oauth2/v2.1/verify
       │       └─> 返回真正的 LINE User ID (sub)
       └─> 如果有 accessToken (OAuth):
           └─> GET https://api.line.me/v2/profile
               └─> 返回 LINE Login 的 userId
```

---

## 登入後處理流程

### 在 BookingPage 登入後:

**位置**: `pages/BookingPage.tsx` (149-171行, 202-226行)

```typescript
// 1. 設定狀態
setLineUserId(result.lineUserId);
setLineUserInfo({ name: result.name, picture: result.picture });
localStorage.setItem('lineUserId', result.lineUserId);

// 2. 同步客戶資料到 Sheets
await syncCustomerProfile(
  result.lineUserId,
  result.name,
  result.picture,
  existingProfile?.guestName,
  existingProfile?.contactPhone,
  existingProfile?.email
);

// 3. 如果客戶資料已存在，自動填入表單
if (result.profile && existingProfile) {
  setFormData(prev => ({
    ...prev,
    guestName: prev.guestName || result.profile.guestName || '',
    contactPhone: prev.contactPhone || result.profile.contactPhone || '',
    email: prev.email || result.profile.email || '',
    lineName: prev.lineName || result.profile.lineName || name || '',
  }));
}

// 4. 載入優惠券
loadCoupons(result.lineUserId);
```

### 在 ConfirmationPage 綁定後:

**位置**: `pages/ConfirmationPage.tsx` (108-147行)

```typescript
// 1. 驗證 token 並取得 LINE User ID
const result = await apiService.verifyLineToken(token);

// 2. 綁定訂單到 LINE User ID
const bindResult = await apiService.bindBooking(
  id,                    // bookingId
  result.lineUserId,
  guestName,
  contactPhone,
  email
);

// 3. 確保客戶資料已同步（雙重保險）
await apiService.syncCustomerProfile(
  result.lineUserId,
  result.name,
  result.picture,
  guestName,
  contactPhone,
  email
);

// 4. 設定成功狀態
setBindingSuccess(true);
```

---

## 數據寫入機制

### 1. 同步客戶資料 (Customer_Profile)

**API**: `POST /api/line/sync-profile`

**後端處理**: `worker/src/handlers/line.ts:377-464`

**寫入位置**: Google Sheets 的 `Customer_Profile` 工作表

**數據結構**:
```typescript
{
  lineUserId: string,        // 主鍵（第1欄）
  guestName: string,         // 真實姓名（第2欄）
  contactPhone: string,      // 聯絡電話（第3欄）
  email: string,             // 電子郵件（第4欄）
  lineName: string,          // LINE 名稱（第5欄）
  totalNights: number,       // 累計住宿晚數（第6欄）
  totalBookings: number,    // 累計訂單數（第7欄）
  createdAt: string,         // 建立時間（第8欄）
  updatedAt: string          // 更新時間（第9欄）
}
```

**寫入邏輯**:
```typescript
// 1. 檢查客戶資料是否存在
let profile = await sheets.getCustomerProfile(lineUserId);

if (!profile) {
  // 建立新客戶資料
  profile = {
    lineUserId,
    guestName: guestName || name || '',
    contactPhone: contactPhone || '',
    email: email || '',
    lineName: name || '',
    totalNights: 0,
    totalBookings: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await sheets.createOrUpdateCustomerProfile(profile);
} else {
  // 更新現有客戶資料（保留累計數據）
  profile.lineName = name || profile.lineName || '';
  if (guestName) profile.guestName = guestName;
  if (contactPhone) profile.contactPhone = contactPhone;
  if (email) profile.email = email;
  profile.updatedAt = new Date().toISOString();
  await sheets.createOrUpdateCustomerProfile(profile);
}
```

**Sheets 實作**: `worker/src/utils/sheets.ts:354-380`

---

### 2. 綁定訂單 (Bookings)

**API**: `POST /api/line/bind-booking`

**後端處理**: `worker/src/handlers/line.ts:470-643`

**寫入位置**: Google Sheets 的 `Bookings` 工作表

**數據更新**:
```typescript
// 更新訂單的 lineUserId 和 lineName
await sheets.updateBooking(bookingId, {
  lineUserId,
  lineName: booking.lineName || guestName,
}, booking.updatedAt);
```

**同時更新客戶資料**:
```typescript
// 計算住宿晚數
const nights = Math.ceil(
  (new Date(booking.checkOutDate).getTime() - 
   new Date(booking.checkInDate).getTime()) / 
  (1000 * 60 * 60 * 24)
);

if (!profile) {
  // 建立新客戶資料（包含本次訂單數據）
  profile = {
    lineUserId,
    guestName: guestName || booking.guestName,
    contactPhone: contactPhone || booking.contactPhone,
    email: email || booking.email,
    lineName: booking.lineName || guestName,
    totalNights: nights,        // 本次訂單的晚數
    totalBookings: 1,            // 本次訂單計為 1 筆
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
} else {
  // 更新現有客戶資料（累加數據）
  profile.totalNights += nights;      // 累加晚數
  profile.totalBookings += 1;          // 累加訂單數
  profile.updatedAt = new Date().toISOString();
  if (guestName) profile.guestName = guestName;
  if (contactPhone) profile.contactPhone = contactPhone;
  if (email) profile.email = email;
}
```

---

### 3. 優惠券發放 (Coupons)

**發放時機**: 綁定訂單時自動檢查並發放

**後端處理**: `worker/src/handlers/line.ts:592-632`

**優惠券類型**:

#### A. 10晚送1晚住宿券 (free_night)
```typescript
// 條件: 累計住宿達到 10 晚
if (profile.totalNights >= 10 && profile.totalNights - nights < 10) {
  // 檢查是否已有此類型的有效優惠券
  const existingCoupons = await sheets.getCoupons(lineUserId);
  const hasFreeNightCoupon = existingCoupons.some(
    c => c.type === 'free_night' && c.status === 'active'
  );
  
  if (!hasFreeNightCoupon) {
    // 發放優惠券
    const couponCode = `FREE${Date.now().toString(36).toUpperCase()}`;
    const freeNightCoupon: Coupon = {
      id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      couponCode,
      type: 'free_night',
      lineUserId,
      status: 'active',
      value: 1,              // 1晚
      minNights: 2,          // 需連續兩晚
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年後過期
    };
    await sheets.createCoupon(freeNightCoupon);
  }
}
```

#### B. 住兩晚折300元 (stay_discount)
```typescript
// 條件: 本次訂單住兩晚以上
if (nights >= 2) {
  const stayDiscountCoupon: Coupon = {
    id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    couponCode: `DISCOUNT${Date.now().toString(36).toUpperCase()}`,
    type: 'stay_discount',
    lineUserId,
    status: 'active',
    value: 300,             // 折300
    minNights: 2,           // 需住兩晚
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90天後過期
  };
  await sheets.createCoupon(stayDiscountCoupon);
}
```

**寫入位置**: Google Sheets 的 `Coupons` 工作表

**數據結構**:
```typescript
{
  id: string,               // 優惠券 ID（第1欄）
  couponCode: string,      // 優惠券代碼（第2欄）
  type: 'stay_discount' | 'free_night',  // 類型（第3欄）
  lineUserId: string,       // 用戶 ID（第4欄）
  status: 'active' | 'used' | 'expired', // 狀態（第5欄）
  value: number,           // 價值（第6欄）
  minNights: number,       // 最低晚數（第7欄）
  createdAt: string,        // 建立時間（第8欄）
  usedAt: string,          // 使用時間（第9欄，可選）
  expiresAt: string        // 過期時間（第10欄，可選）
}
```

**Sheets 實作**: `worker/src/utils/sheets.ts:414-429`

---

## 完整流程圖

### 場景 1: 在 LINE App 內進入訂房頁

```
用戶在 LINE App 內打開訂房頁
    ↓
BookingPage 載入
    ↓
檢測到 LINE 環境 (userAgent 包含 'Line')
    ↓
initLineLogin() → 載入 LIFF SDK
    ↓
getLineProfile()
    ├─> 已登入: 直接取得 profile
    └─> 未登入: window.liff.login() → 自動登入 → 重新載入頁面
    ↓
取得 LINE User ID 和資料
    ↓
同步到 Customer_Profile 表
    ├─> 如果不存在: 建立新記錄
    └─> 如果存在: 更新資料（保留累計數據）
    ↓
載入優惠券列表
    ↓
自動填入表單（如果有現有客戶資料）
    ↓
用戶完成訂房
    ↓
創建訂單（Bookings 表）
    └─> 如果已登入，訂單自動包含 lineUserId
```

### 場景 2: 在一般瀏覽器登入並訂房

```
用戶在一般瀏覽器打開訂房頁
    ↓
BookingPage 載入
    ↓
不在 LINE 環境，檢查 localStorage
    ├─> 有 lineUserId: 載入優惠券
    └─> 沒有: 顯示未綁定狀態
    ↓
用戶點擊「綁定 LINE」或手動登入
    ↓
loginWithLine() → 重定向到 LINE 登入頁
    ↓
用戶授權
    ↓
LINE 回調到 /booking?code=xxx&state=yyy
    ↓
handleLineOAuthCallback()
    ├─> 驗證 state (CSRF 保護)
    ├─> POST /api/line/oauth/callback
    │   └─> 後端交換 token → 取得用戶資料
    └─> 返回 accessToken
    ↓
apiService.verifyLineToken(token)
    └─> POST /api/line/verify → 取得 lineUserId
    ↓
同步到 Customer_Profile 表
    ↓
載入優惠券列表
    ↓
自動填入表單（如果有現有客戶資料）
    ↓
用戶完成訂房
    ↓
創建訂單（包含 lineUserId）
```

### 場景 3: 在確認頁面綁定 LINE

```
用戶完成訂房（未綁定 LINE）
    ↓
導航到 ConfirmationPage
    ↓
顯示「綁定 LINE 以享常客優惠」
    ↓
用戶點擊「綁定 LINE 帳號」
    ↓
handleBindLine()
    ├─> 在 LINE 環境: getLineProfile()
    └─> 不在 LINE 環境: loginWithLine() → OAuth 流程
    ↓
取得 LINE User ID
    ↓
綁定訂單
    ├─> POST /api/line/bind-booking
    │   ├─> 更新訂單的 lineUserId
    │   ├─> 建立或更新 Customer_Profile
    │   │   └─> 累加 totalNights 和 totalBookings
    │   └─> 檢查並發放優惠券
    │       ├─> 10晚送1晚: 如果 totalNights >= 10
    │       └─> 住兩晚折300: 如果 nights >= 2
    └─> 確保客戶資料同步（雙重保險）
    ↓
顯示綁定成功訊息
```

---

## 重要注意事項

### 1. LINE User ID 的差異

- **LIFF 取得的 User ID**: 真正的 LINE User ID（可用於 LINE Messaging API）
- **OAuth 取得的 User ID**: LINE Login 的 userId（可能與 LINE 平台的 userId 不同）

**影響**: 
- 目前系統使用 LINE Login 的 userId，但都統一儲存在 `lineUserId` 欄位
- 如果需要與 LINE Messaging API 整合，可能需要調整

### 2. 數據同步時機

- **訂房頁登入後**: 立即同步到 Customer_Profile（建立或更新基本資料）
- **確認頁綁定後**: 
  - 綁定訂單（更新 Bookings 表）
  - 更新 Customer_Profile（累加數據）
  - 發放優惠券

### 3. 優惠券發放邏輯

- **10晚送1晚**: 只在達到 10 晚時發放一次（如果已有有效優惠券則不再發放）
- **住兩晚折300**: 每次訂單住兩晚以上都會發放

### 4. 表單自動填入

- 只有在 Customer_Profile 已存在時才會自動填入
- 優先使用表單現有值（不會覆蓋用戶已輸入的資料）

### 5. 狀態管理

- `lineUserId` 儲存在 `localStorage`，頁面重新載入後可恢復
- `sessionStorage` 用於 OAuth 流程的臨時資料（state, redirect_uri）

---

## 相關檔案位置

### 前端
- `utils/lineLogin.ts` - LINE 登入工具函數
- `pages/BookingPage.tsx` - 訂房頁面（自動登入）
- `pages/ConfirmationPage.tsx` - 確認頁面（手動綁定）
- `pages/BenefitsPage.tsx` - 優惠頁面（顯示優惠券）
- `services/apiService.ts` - API 服務封裝

### 後端
- `worker/src/handlers/line.ts` - LINE API 處理
- `worker/src/utils/sheets.ts` - Google Sheets 操作
- `worker/src/index.ts` - 路由定義

### Google Sheets 工作表
- `Customer_Profile` - 客戶資料
- `Coupons` - 優惠券
- `Bookings` - 訂單

---

## 總結

LINE 登入系統採用雙路徑設計：
1. **LIFF** - 在 LINE App 內提供無縫登入體驗
2. **OAuth 2.0** - 在一般瀏覽器提供登入功能

登入後會：
1. 同步客戶資料到 `Customer_Profile` 表
2. 綁定訂單到 LINE User ID
3. 自動發放優惠券（根據住宿晚數和訂單規則）
4. 自動填入表單（如果有現有客戶資料）

整個系統圍繞 `lineUserId` 作為客戶的唯一識別符，實現訂單、客戶資料和優惠券的關聯管理。

