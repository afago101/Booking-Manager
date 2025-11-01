# LINE 整合完整分析 - 根因診斷報告

## 📋 研究範圍

本報告分為兩個部分：
1. **我們這邊的LINE處理邏輯**（前端與後端代碼）
2. **LINE那邊要做的設定**（LINE Developers Console配置）

---

## 第一部分：我們這邊的LINE處理邏輯

### 1.1 前端處理流程總覽

#### 🔄 LINE 登入的兩種路徑

```
從 LINE App 進入
    ↓
檢查是否在 LINE 環境中 (userAgent 包含 "Line" 或 "LINE")
    ↓
路徑 A: LIFF 流程（如果已設定 LIFF ID）
    ├─ 初始化 LIFF SDK
    ├─ liff.init({ liffId })
    ├─ 檢查 liff.isLoggedIn()
    │   ├─ 未登入 → liff.login() → 重新載入頁面
    │   └─ 已登入 → liff.getProfile() → 取得 LINE User ID
    └─ 直接取得 profile.userId（真正的 LINE User ID）

路徑 B: OAuth 流程（如果 LIFF 不可用或未設定）
    ├─ loginWithLine()
    ├─ 構建 OAuth URL: https://access.line.me/oauth2/v2.1/authorize
    ├─ redirect_uri = 當前頁面 URL（不含 hash）
    ├─ 重定向到 LINE Login
    ├─ LINE 回調帶回 code 和 state
    ├─ handleLineOAuthCallback()
    ├─ 發送 code + redirect_uri 到後端 /api/line/oauth/callback
    └─ 後端交換取得 accessToken → 取得 profile → 返回 lineUserId
```

### 1.2 關鍵代碼邏輯分析

#### 📍 `utils/lineLogin.ts` - 核心邏輯

**1. `initLineLogin()` - LIFF 初始化**
```typescript
// 邏輯流程：
1. 檢查是否在 LINE 環境（userAgent 包含 "Line"）
2. 如果不在 → 跳過，resolve()
3. 如果在 → 檢查是否有 LIFF_ID 或 CHANNEL_ID
4. 如果沒有 → 記錄警告，resolve()（fallback 到 OAuth）
5. 如果有 → 載入 LIFF SDK → liff.init({ liffId })
```

**潛在問題：**
- ⚠️ 如果 LIFF_ID 設定錯誤，不會拋出錯誤，會默默 fallback 到 OAuth
- ⚠️ 如果 LIFF SDK 載入失敗，也會 fallback 到 OAuth
- ⚠️ 這些 fallback 可能導致從 LINE App 進入時仍走 OAuth 流程

**2. `getLineProfile()` - 取得 LINE 使用者資訊**
```typescript
// 邏輯流程：
1. 確保 LIFF 已初始化（如果沒有則調用 initLineLogin）
2. 等待 LIFF SDK 載入（最多重試 10 次，每次 100ms）
3. 檢查 liff.isLoggedIn()
   - 未登入 + 在 LINE App 內 → liff.login() → 返回 null（等待重新載入）
   - 未登入 + 不在 LINE App → 返回 null
4. 已登入 → liff.getProfile() → 返回 { lineUserId, name, picture }
```

**潛在問題：**
- ⚠️ `liff.login()` 會觸發重新導向，但代碼返回 null，依賴頁面重新載入
- ⚠️ 如果 LIFF 初始化在 `liff.login()` 重新導向前未完成，可能導致循環
- ⚠️ 重試機制（10次×100ms = 1秒）可能不夠，特別是網路較慢時

**3. `loginWithLine()` - OAuth 登入**
```typescript
// 邏輯流程：
1. 如果在 LINE 環境且有 LIFF → 使用 liff.login()
2. 否則 → 使用 OAuth 流程
3. 取得 Channel ID（從環境變數或後端 API）
4. 計算 redirect_uri：
   - 當前路徑 = window.location.pathname
   - 根據路徑決定：
     * '/' → redirectUri = origin + '/'
     * '/booking' → redirectUri = origin + '/booking'
     * '/confirmation' → redirectUri = origin + '/confirmation'
5. 構建 OAuth URL：scope=profile（不使用 openid）
6. 儲存 state 和 redirect_uri 到 sessionStorage
7. 重定向到 LINE Login
```

**潛在問題：**
- ⚠️ scope 只使用 `profile`，不使用 `openid`，可能無法取得真正的 LINE User ID
- ⚠️ redirect_uri 計算邏輯依賴當前 pathname，如果從其他地方進入可能計算錯誤
- ⚠️ 如果 sessionStorage 被清除，state 驗證會失敗

**4. `handleLineOAuthCallback()` - OAuth 回調處理**
```typescript
// 邏輯流程：
1. 從 URL 參數取得 code 和 state
2. 驗證 state（與 sessionStorage 中保存的比較）
3. 取得 redirect_uri（從 sessionStorage 或計算當前 URL）
4. 發送 POST /api/line/oauth/callback 包含 { code, redirectUri, state }
5. 返回 accessToken 或 idToken
```

**潛在問題：**
- ⚠️ 如果 sessionStorage 中沒有 redirect_uri，會從當前 URL 計算，但可能與 LINE 設定的不一致
- ⚠️ 如果當前 URL 是 API 路徑（包含 `/api/`），會嘗試修正，但可能修正錯誤

#### 📍 `pages/BookingPage.tsx` - 訂房頁處理

**OAuth Callback 處理：**
```typescript
useEffect(() => {
  // 1. 檢查 URL 參數是否有 code 和 state
  // 2. 如果有 → 使用 sessionStorage 標記防止重複處理
  // 3. 調用 handleLineOAuthCallback()
  // 4. 驗證 token → 取得 lineUserId
  // 5. 同步客戶資料到 Sheets
  // 6. 清除 URL 參數（使用 setTimeout + navigate）
}, [syncCustomerProfile]);
```

**LIFF 流程處理：**
```typescript
useEffect(() => {
  // 1. 檢查是否在 LINE 環境（userAgent）
  // 2. 如果在 → 初始化 LIFF → 等待 1 秒 → 取得 profile
  // 3. 如果取得 profile → 設定 lineUserId → 同步到 Sheets
}, [syncCustomerProfile]);
```

**潛在問題：**
- ⚠️ `syncCustomerProfile` 在依賴項中，但可能在 useEffect 執行期間變化
- ⚠️ 等待 1 秒是硬編碼，可能不夠或太多
- ⚠️ 兩個 useEffect 可能同時執行（一個處理 OAuth callback，一個處理 LIFF）

### 1.3 後端處理邏輯分析

#### 📍 `worker/src/handlers/line.ts`

**`handleLineOAuthCallback()` - OAuth 回調處理**
```typescript
// 邏輯流程：
1. 接收 { code, redirectUri } 從前端
2. 驗證 LINE_CHANNEL_ID 和 LINE_CHANNEL_SECRET 是否存在
3. 發送 POST 到 LINE API: https://api.line.me/oauth2/v2.1/token
   - grant_type: 'authorization_code'
   - code: 從前端接收的 code
   - redirect_uri: 從前端接收的 redirectUri（必須與 LINE Console 設定一致）
   - client_id: LINE_CHANNEL_ID
   - client_secret: LINE_CHANNEL_SECRET
4. 取得 access_token
5. 使用 access_token 取得使用者資料：https://api.line.me/v2/profile
6. 返回 { accessToken, lineUserId, name, picture }
```

**關鍵問題：**
- ✅ redirect_uri 必須與 LINE Developers Console 中設定的 Callback URL **完全一致**
- ⚠️ LINE API 會嚴格比對 redirect_uri，任何差異（尾斜線、協議、大小寫）都會導致 401 錯誤
- ⚠️ 返回的 `lineUserId` 是 LINE Login 的 userId，**不是真正的 LINE User ID**（只有 LIFF 可以取得真正的 LINE User ID）

**`handleVerifyLineToken()` - Token 驗證**
```typescript
// 支援兩種 token：
1. idToken（來自 LIFF）
   - 驗證 idToken → 取得真正的 LINE User ID
2. accessToken（來自 OAuth）
   - 使用 accessToken 取得 profile → 取得 LINE Login 的 userId
```

### 1.4 環境變數要求

#### 前端環境變數（Cloudflare Pages）
- `VITE_LINE_LIFF_ID`: LIFF App ID（格式：`2008398150-xxxxx`）
- `VITE_LINE_CHANNEL_ID`: LINE Channel ID（`2008398150`）
- `VITE_API_BASE_URL`: 後端 API URL

#### 後端環境變數（Cloudflare Workers）
- `LINE_CHANNEL_ID`: LINE Channel ID（`2008398150`）
- `LINE_CHANNEL_SECRET`: LINE Channel Secret

---

## 第二部分：LINE那邊要做的設定

### 2.1 LINE Developers Console 設定總覽

#### 🔗 必要設定項目

1. **LINE Login Channel 設定**
   - Callback URL（必須與前端 redirect_uri 完全一致）
   - Scope 設定（profile, openid, email）

2. **LIFF App 設定**（如果使用 LIFF）
   - LIFF App 建立
   - Endpoint URL 設定
   - Scope 設定

3. **LINE Official Account 設定**（如果使用選單）
   - 選單設定
   - Webhook URL（如果需要）

### 2.2 LINE Login Channel 設定詳解

#### 📍 Callback URL 設定（關鍵！）

**設定位置：**
1. 前往 https://developers.line.biz/
2. 選擇 Provider → LINE Login Channel (2008398150)
3. 「Channel settings」→「LINE Login settings」
4. 找到「Callback URL」欄位

**必須設定的 URL（每行一個）：**
```
https://blessing-haven.marcux.uk/booking
https://blessing-haven.marcux.uk/confirmation
https://blessing-haven.marcux.uk/
```

**⚠️ 關鍵要求：**
- ✅ **必須是 HTTPS**（不能是 HTTP）
- ✅ **不能包含 hash (#)**（不能是 `#/booking`）
- ✅ **不能有多餘的斜線**（除了根路徑 `/`）
- ✅ **必須完全匹配**（包括協議、網域、路徑、大小寫）
- ✅ **沒有尾隨斜線**（除了根路徑 `/`）

**常見錯誤：**
- ❌ `http://blessing-haven.marcux.uk/booking`（使用 HTTP）
- ❌ `https://blessing-haven.marcux.uk/booking/`（多餘的尾隨斜線）
- ❌ `https://blessing-haven.marcux.uk/#/booking`（包含 hash）
- ❌ `https://xxx.pages.dev/booking`（使用 Cloudflare Pages 預設網域）

#### 📍 Scope 設定

**設定位置：**
- 「Channel settings」→「LINE Login settings」→「Scopes」

**建議設定：**
- ✅ **`profile`**（必選）- 取得使用者基本資訊（姓名、頭像）
- ⚠️ **`openid`**（可選）- 如果要取得 LINE User ID（但 OAuth 流程中的 userId 可能不是真正的 LINE User ID）
- ⚠️ **`email`**（可選）- 如果需要 email 權限

**注意：**
- 如果只使用 `profile` scope，OAuth 流程中取得的是 LINE Login 的 userId，**不是真正的 LINE User ID**
- 要取得真正的 LINE User ID，必須：
  1. 使用 LIFF + `openid` scope，或
  2. 使用 OAuth + `openid` scope + 解析 idToken（但我們的代碼目前不使用 idToken）

### 2.3 LIFF App 設定詳解

#### 📍 建立 LIFF App

**設定位置：**
1. LINE Developers Console → Provider → LINE Login Channel
2. 左側選單 →「LIFF」
3. 點擊「Add」建立新的 LIFF App

**設定值：**

**App name：**
```
Booking Manager
```
或
```
祝福海灣訂房系統
```

**Size：**
```
Full（全螢幕）
```
⚠️ **建議選擇 Full**，提供最佳使用者體驗

**Endpoint URL：**
```
https://blessing-haven.marcux.uk
```
⚠️ **重要：**
- 使用實際的自訂網域
- 必須是 HTTPS
- **不要包含 path**（例如 `/booking` 或 `/#/booking`）
- **不要包含 hash (#)**

**Scope：**
勾選以下選項：
- ✅ **`profile`**（必選）
- ✅ **`openid`**（建議，可取得真正的 LINE User ID）

**Bot link feature：**
- 可選，根據需求決定

#### 📍 取得 LIFF ID

設定完成後，會看到：
- **LIFF App ID**：格式類似 `2008398150-abcdefgh`
- ⚠️ **請複製並保存這個 ID！**
- 設定到 Cloudflare Pages 環境變數 `VITE_LINE_LIFF_ID`

### 2.4 LINE Official Account 選單設定（如果使用）

**設定位置：**
1. LINE Official Account Manager
2. 選擇您的帳號
3. 「設定」→「回應設定」→「網頁應用程式」

**設定值：**
- **標題**：例如「立即訂房」
- **動作類型**：選擇「開啟網頁」
- **網頁 URL**：`https://blessing-haven.marcux.uk/booking`
- **使用 LIFF**：如果已設定 LIFF，可以選擇使用 LIFF

⚠️ **注意：**
- 如果設定為使用 LIFF，URL 會自動加上 LIFF 參數
- 如果不使用 LIFF，URL 保持原樣，前端會使用 OAuth 流程

---

## 第三部分：根因分析

### 3.1 問題分類

#### 🔴 嚴重問題（導致功能完全無法使用）

**問題 1: Callback URL 不匹配**
- **症狀**：OAuth 回調返回 401 Unauthorized
- **根因**：
  1. LINE Developers Console 中設定的 Callback URL 與前端發送的 redirect_uri 不一致
  2. 常見差異：尾隨斜線、協議（HTTP vs HTTPS）、網域、路徑
- **影響**：OAuth 流程完全無法使用
- **解決方法**：
  1. 確保 LINE Console 中設定所有可能的路徑（`/`, `/booking`, `/confirmation`）
  2. 確保前端發送的 redirect_uri 與 LINE 設定完全一致（檢查尾隨斜線、協議、大小寫）

**問題 2: LIFF 未設定或設定錯誤**
- **症狀**：從 LINE App 進入時無法自動取得使用者資訊
- **根因**：
  1. `VITE_LINE_LIFF_ID` 環境變數未設定或設定錯誤
  2. LIFF App 的 Endpoint URL 設定錯誤（包含 path 或 hash）
  3. LIFF App 的 Scope 設定不完整（缺少 `openid` 或 `profile`）
- **影響**：從 LINE App 進入時必須手動登入，體驗不佳
- **解決方法**：
  1. 確認 `VITE_LINE_LIFF_ID` 已正確設定
  2. 確認 LIFF App 的 Endpoint URL 是 `https://blessing-haven.marcux.uk`（不含 path）
  3. 確認 LIFF App 的 Scope 包含 `profile` 和 `openid`

**問題 3: Scope 設定不正確**
- **症狀**：無法取得 LINE User ID 或取得的是 LINE Login 的 userId（不是真正的 LINE User ID）
- **根因**：
  1. OAuth 流程只使用 `profile` scope，不使用 `openid`
  2. 即使使用 `openid` scope，我們的代碼也不解析 idToken，只使用 accessToken
  3. accessToken 取得的 userId 是 LINE Login 的 userId，**不是真正的 LINE User ID**
- **影響**：
  - 如果使用 OAuth 流程，取得的 userId 可能不是真正的 LINE User ID
  - 如果兩個不同的登入方式（LIFF vs OAuth）取得不同的 userId，可能導致資料不一致
- **解決方法**：
  1. 優先使用 LIFF 流程（可以取得真正的 LINE User ID）
  2. 如果必須使用 OAuth，需要解析 idToken 才能取得真正的 LINE User ID（但我們目前的代碼不支持）

#### 🟡 中等等級問題（導致功能部分可用但體驗不佳）

**問題 4: 環境變數未設定**
- **症狀**：前端無法取得 Channel ID，需要從後端取得（較慢）
- **根因**：`VITE_LINE_CHANNEL_ID` 環境變數未設定
- **影響**：第一次載入時需要額外的 API 請求，增加延遲
- **解決方法**：在 Cloudflare Pages 中設定 `VITE_LINE_CHANNEL_ID`

**問題 5: 重試機制不足**
- **症狀**：網路較慢時 LIFF SDK 可能未完全載入就開始使用
- **根因**：重試機制（10次×100ms = 1秒）可能不夠
- **影響**：可能導致 `getLineProfile()` 返回 null，fallback 到 OAuth
- **解決方法**：增加重試次數或時間間隔

**問題 6: 多個 useEffect 同時執行**
- **症狀**：可能導致重複處理或狀態衝突
- **根因**：BookingPage 中兩個 useEffect（一個處理 OAuth callback，一個處理 LIFF）可能同時執行
- **影響**：可能導致重複同步客戶資料或狀態不一致
- **解決方法**：增加狀態標記，防止重複處理

#### 🟢 輕微問題（不影響功能但可能優化）

**問題 7: 硬編碼的等待時間**
- **症狀**：`await new Promise(resolve => setTimeout(resolve, 1000))` 是硬編碼的 1 秒
- **根因**：無法根據實際 LIFF 初始化速度調整
- **影響**：可能等待時間過長或過短
- **解決方法**：使用動態檢查機制，等待 LIFF 真正初始化完成

**問題 8: 錯誤處理不夠詳細**
- **症狀**：某些錯誤可能被吞掉，無法追蹤
- **根因**：某些 catch 區塊只是 resolve()，不拋出錯誤
- **影響**：難以診斷問題
- **解決方法**：增加更詳細的錯誤日誌（已部分實作，可繼續改進）

### 3.2 根本原因總結

#### 🎯 核心問題

**從 LINE App 進入時無法自動取得使用者資訊的根本原因：**

1. **LIFF 設定缺失或不正確**（最可能）
   - `VITE_LINE_LIFF_ID` 未設定或設定錯誤
   - LIFF App 的 Endpoint URL 設定錯誤（包含 path 或 hash）
   - LIFF App 的 Scope 設定不完整

2. **LIFF 初始化失敗後 fallback 到 OAuth，但 OAuth 也可能失敗**
   - LIFF 初始化失敗後，代碼會 fallback 到 OAuth
   - 但 OAuth 需要正確的 Callback URL 設定
   - 如果兩者都失敗，就無法取得使用者資訊

3. **從 LINE 選單進入時可能繞過 LIFF 初始化**
   - 如果選單 URL 包含參數或使用外部瀏覽器打開，可能不在 LINE App 環境中
   - 此時不會初始化 LIFF，必須使用 OAuth

**OAuth 登入失敗的根本原因：**

1. **Callback URL 不匹配**（最常見）
   - LINE Developers Console 中設定的 Callback URL 與前端發送的 redirect_uri 不一致
   - 差異可能包括：尾隨斜線、協議、網域、路徑

2. **redirect_uri 計算邏輯錯誤**
   - 前端從 `window.location.pathname` 計算 redirect_uri
   - 如果從其他地方進入或 URL 包含參數，可能計算錯誤

3. **sessionStorage 被清除**
   - 如果瀏覽器清除 sessionStorage，state 驗證會失敗
   - redirect_uri 也會丟失，導致計算錯誤

### 3.3 修復建議優先級

#### 🔥 立即修復（P0）

1. **確認 LINE Developers Console Callback URL 設定**
   - 確保包含所有可能的路徑：`/`, `/booking`, `/confirmation`
   - 確保沒有尾隨斜線（除了根路徑 `/`）
   - 確保是 HTTPS

2. **確認 LIFF App 設定**
   - Endpoint URL 是 `https://blessing-haven.marcux.uk`（不含 path）
   - Scope 包含 `profile` 和 `openid`
   - 取得 LIFF ID 並設定到 `VITE_LINE_LIFF_ID`

3. **確認環境變數設定**
   - `VITE_LINE_LIFF_ID`：LIFF App ID
   - `VITE_LINE_CHANNEL_ID`：LINE Channel ID
   - `VITE_API_BASE_URL`：後端 API URL

#### ⚠️ 短期改進（P1）

1. **改進 redirect_uri 計算邏輯**
   - 優先使用 sessionStorage 中保存的 redirect_uri
   - 如果沒有，從當前 URL 計算，但確保與 LINE 設定一致

2. **改進 LIFF 初始化檢查**
   - 增加更詳細的錯誤日誌
   - 改進重試機制

3. **改進錯誤處理**
   - 所有錯誤都應該記錄到後台監測
   - 提供更明確的錯誤訊息

#### 💡 長期優化（P2）

1. **統一 LINE User ID 取得方式**
   - 優先使用 LIFF（可以取得真正的 LINE User ID）
   - 如果 LIFF 不可用，OAuth 流程應該解析 idToken 取得真正的 LINE User ID

2. **改進狀態管理**
   - 防止多個 useEffect 同時執行
   - 使用狀態機管理登入流程

3. **增加自動測試**
   - 測試 LIFF 流程
   - 測試 OAuth 流程
   - 測試從不同入口進入的情況

---

## 第四部分：診斷檢查清單

### 4.1 LINE Developers Console 設定檢查

- [ ] 前往 https://developers.line.biz/
- [ ] 選擇 Provider → LINE Login Channel (2008398150)
- [ ] 檢查「Channel settings」→「LINE Login settings」
- [ ] 確認「Callback URL」包含：
  - [ ] `https://blessing-haven.marcux.uk/booking`
  - [ ] `https://blessing-haven.marcux.uk/confirmation`
  - [ ] `https://blessing-haven.marcux.uk/`
- [ ] 確認所有 URL：
  - [ ] 使用 HTTPS（不是 HTTP）
  - [ ] 沒有尾隨斜線（除了根路徑 `/`）
  - [ ] 沒有 hash (#)
  - [ ] 使用自訂網域（不是 Cloudflare Pages 預設網域）
- [ ] 檢查「Scopes」設定：
  - [ ] `profile` 已勾選
  - [ ] `openid` 已勾選（建議）

### 4.2 LIFF App 設定檢查

- [ ] 前往 LINE Developers Console → Provider → LINE Login Channel →「LIFF」
- [ ] 檢查是否有 LIFF App
- [ ] 如果有，檢查設定：
  - [ ] Endpoint URL 是 `https://blessing-haven.marcux.uk`（不含 path）
  - [ ] Size 是 `Full`
  - [ ] Scope 包含 `profile` 和 `openid`
- [ ] 複製 LIFF App ID（格式：`2008398150-xxxxx`）
- [ ] 如果沒有 LIFF App，建立一個

### 4.3 Cloudflare Pages 環境變數檢查

- [ ] 前往 Cloudflare Dashboard → Pages → booking-manager → Settings → Environment variables
- [ ] 檢查以下環境變數：
  - [ ] `VITE_LINE_LIFF_ID`：LIFF App ID
  - [ ] `VITE_LINE_CHANNEL_ID`：`2008398150`
  - [ ] `VITE_API_BASE_URL`：後端 API URL

### 4.4 Cloudflare Workers 環境變數檢查

- [ ] 前往 Cloudflare Dashboard → Workers & Pages → booking-api-public → Settings → Variables
- [ ] 檢查以下環境變數：
  - [ ] `LINE_CHANNEL_ID`：`2008398150`
  - [ ] `LINE_CHANNEL_SECRET`：Channel Secret

### 4.5 測試檢查

- [ ] 從 LINE App 打開 `https://blessing-haven.marcux.uk/booking`
- [ ] 檢查瀏覽器 Console（如果可能）：
  - [ ] 是否有 `[LIFF]` 相關日誌
  - [ ] 是否有錯誤訊息
- [ ] 檢查後台「服務日誌」：
  - [ ] 是否有 `liff_init_start` 日誌
  - [ ] 是否有 `liff_init_success` 或 `liff_init_failed` 日誌
  - [ ] 是否有 `liff_profile_received` 日誌
- [ ] 從一般瀏覽器打開 `https://blessing-haven.marcux.uk/booking`
- [ ] 點擊「LINE 登入」
- [ ] 完成登入後檢查：
  - [ ] 是否有 `oauth_callback_detected` 日誌
  - [ ] 是否有 `oauth_callback_success` 日誌
  - [ ] 是否有 `booking_page_login_success` 日誌

---

## 第五部分：預期行為

### 5.1 從 LINE App 進入訂房頁（理想流程）

```
使用者從 LINE App 打開 https://blessing-haven.marcux.uk/booking
    ↓
前端檢測到在 LINE 環境中（userAgent 包含 "Line"）
    ↓
初始化 LIFF（如果有 VITE_LINE_LIFF_ID）
    ↓
LIFF 初始化成功
    ↓
檢查 liff.isLoggedIn()
    ├─ 已登入 → liff.getProfile() → 取得 LINE User ID → 同步到 Sheets → 完成
    └─ 未登入 → liff.login() → LINE 自動登入 → 重新載入頁面 → 回到「已登入」分支
```

### 5.2 從一般瀏覽器進入訂房頁（OAuth 流程）

```
使用者從一般瀏覽器打開 https://blessing-haven.marcux.uk/booking
    ↓
前端檢測到不在 LINE 環境中
    ↓
使用者點擊「LINE 登入」
    ↓
loginWithLine() → 構建 OAuth URL → 重定向到 LINE Login
    ↓
使用者授權登入
    ↓
LINE 回調到 https://blessing-haven.marcux.uk/booking?code=...&state=...
    ↓
handleLineOAuthCallback() → 發送到後端 → 取得 accessToken → 取得 profile
    ↓
設定 lineUserId → 同步到 Sheets → 完成
```

### 5.3 從確認頁綁定 LINE（OAuth 流程）

```
使用者完成訂房，進入確認頁
    ↓
使用者點擊「綁定 LINE 帳號」
    ↓
loginWithLine() → 構建 OAuth URL（redirect_uri = /confirmation）→ 重定向到 LINE Login
    ↓
使用者授權登入
    ↓
LINE 回調到 https://blessing-haven.marcux.uk/confirmation?code=...&state=...
    ↓
handleLineOAuthCallback() → 發送到後端 → 取得 accessToken → 取得 profile
    ↓
綁定訂單（bindBooking）→ 同步客戶資料 → 顯示成功訊息
```

---

## 總結

### 最可能的根因

1. **LIFF 未設定或設定錯誤**（導致從 LINE App 進入時無法自動取得使用者資訊）
2. **Callback URL 不匹配**（導致 OAuth 登入失敗）

### 立即行動項目

1. ✅ 檢查並設定 LINE Developers Console 的 Callback URL
2. ✅ 檢查並建立/設定 LIFF App
3. ✅ 檢查並設定所有環境變數
4. ✅ 重新測試所有流程

### 需要確認的資訊

- LINE Developers Console 中實際設定的 Callback URL 列表
- LIFF App 是否存在，以及其 Endpoint URL 設定
- Cloudflare Pages 環境變數的實際值
- 從後台服務日誌中看到的錯誤訊息

---

**報告生成時間：** 2025-11-01  
**版本：** 1.0  
**作者：** AI Assistant

