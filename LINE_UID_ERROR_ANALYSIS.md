# LINE UID 邏輯錯誤分析報告

## 🔴 發現的嚴重錯誤

### 錯誤 1：OAuth Scope 設定不完整（導致無法取得真正的 LINE User ID）

**位置**：`utils/lineLogin.ts:394`

**問題**：
```typescript
// 只使用 profile scope，不使用 openid
const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodedRedirectUri}&state=${state}&scope=profile`;
```

**影響**：
- 沒有使用 `openid` scope，導致 OAuth 流程無法取得 `idToken`
- 只能取得 `accessToken`，而 `accessToken` 只能取得 LINE Login 的 userId，**不是真正的 LINE User ID**
- 這會導致同一個用戶使用 OAuth 和 LIFF 時，取得不同的 UID

**正確做法**：
應該使用 `scope=profile openid`，這樣才能取得 `idToken`，進而取得真正的 LINE User ID

---

### 錯誤 2：OAuth Callback 返回錯誤的 UID 類型

**位置**：`worker/src/handlers/line.ts:155`

**問題**：
```typescript
return c.json({
  accessToken, // 改為返回 accessToken 而不是 idToken
  lineUserId: lineUser.userId, // LINE Login 的 userId ❌
  name: lineUser.displayName,
  picture: lineUser.pictureUrl,
});
```

**影響**：
- 返回的 `lineUserId` 是 LINE Login 的 userId，**不是真正的 LINE User ID**
- 註解已經說明："注意：lineUser.userId 是 LINE Login 的 userId，與 LINE 平台的 userId 可能不同"
- 如果用戶先使用 OAuth 登入，之後在 LIFF 環境中登入，會取得不同的 UID，導致系統認為是不同用戶
- 這會導致：
  - 訂單無法正確綁定
  - 優惠券無法正確發放
  - 客戶資料無法正確關聯

**正確做法**：
- 應該在 OAuth callback 時，如果有 `idToken`，驗證後取得真正的 LINE User ID (`sub`)
- 如果沒有 `idToken`（因為 scope 問題），至少應該在註解中明確警告

---

### 錯誤 3：verifyLineToken 邏輯不一致

**位置**：`worker/src/handlers/line.ts:314-318`

**問題**：
```typescript
// 使用 accessToken（來自 OAuth，沒有 OpenID Connect）
if (accessToken) {
  // ... 取得 profile
  return c.json({
    lineUserId: lineUser.userId, // LINE Login 的 userId ❌
    name: lineUser.displayName,
    picture: lineUser.pictureUrl,
  });
}
```

**與 idToken 處理的對比**（第 257 行）：
```typescript
// 優先使用 idToken（來自 LIFF），可以取得真正的 LINE User ID
if (idToken) {
  // ... 驗證 idToken
  return c.json({
    lineUserId: lineUser.sub, // 真正的 LINE User ID ✅
    name: lineUser.name,
    picture: lineUser.picture,
  });
}
```

**影響**：
- 同一用戶使用不同登入方式會取得不同的 UID
- accessToken 路徑返回 LINE Login 的 userId
- idToken 路徑返回真正的 LINE User ID
- 這會導致資料不一致問題

---

### 錯誤 4：localStorage 可能儲存錯誤的 UID

**位置**：多處使用 `localStorage.setItem('lineUserId', ...)`

**問題場景**：
1. 用戶先用 OAuth 登入（取得 LINE Login 的 userId），儲存到 localStorage
2. 之後在 LIFF 環境中登入（取得真正的 LINE User ID）
3. localStorage 被覆蓋，但系統中可能已有使用舊 UID 的資料（訂單、優惠券等）

**影響位置**：
- `pages/BookingPage.tsx:204, 318`
- `pages/BenefitsPage.tsx:45`（從 localStorage 讀取）
- 如果 localStorage 儲存的是錯誤的 UID 類型，後續查詢會失敗

---

### 錯誤 5：訂單綁定時可能使用錯誤的 UID

**位置**：`pages/BookingPage.tsx:518, 535` 和 `pages/ConfirmationPage.tsx:88, 192`

**問題**：
- 訂單建立和綁定時使用的 `lineUserId` 可能來自：
  - OAuth 流程（LINE Login 的 userId）❌
  - LIFF 流程（真正的 LINE User ID）✅
- 如果使用的是錯誤的 UID，後續查詢客戶資料、優惠券會失敗

---

## 🔧 修復建議

### 優先修復 1：修正 OAuth Scope
在 `utils/lineLogin.ts:394` 加入 `openid` scope：
```typescript
const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodedRedirectUri}&state=${state}&scope=profile openid`;
```

### 優先修復 2：修正 OAuth Callback 以取得真正的 LINE User ID
在 `worker/src/handlers/line.ts` 的 `handleLineOAuthCallback` 中：
- 檢查 `tokenData.id_token` 是否存在
- 如果存在，驗證 idToken 並取得 `sub`（真正的 LINE User ID）
- 優先返回真正的 LINE User ID

### 優先修復 3：統一 verifyLineToken 的返回值
確保無論使用 accessToken 還是 idToken，都返回真正的 LINE User ID（如果可能）

### 優先修復 4：加入 UID 驗證和轉換邏輯
- 建立一個函數來統一處理 UID 轉換
- 如果檢測到是 LINE Login 的 userId，嘗試轉換或警告

---

## 📊 影響範圍評估

### 高風險
1. **客戶資料查詢失敗**：如果使用錯誤的 UID 查詢，會找不到資料
2. **訂單無法正確綁定**：訂單和客戶資料關聯失敗
3. **優惠券無法正確發放**：因為 UID 不匹配

### 中風險
1. **localStorage 資料不一致**：可能儲存錯誤的 UID
2. **用戶體驗問題**：已綁定的帳號找不到資料

### 低風險
1. **統計數據錯誤**：如果使用錯誤的 UID 計算

---

## ⚠️ 注意事項

1. **修復後需要資料遷移**：
   - 檢查現有資料中是否有使用 LINE Login 的 userId 的記錄
   - 可能需要建立 UID 對應表或遷移資料

2. **向後兼容性**：
   - 修復後，可能需要同時支援兩種 UID 格式（過渡期）
   - 或需要用戶重新綁定

3. **LINE Developers Console 設定**：
   - 確保 Callback URL 正確設定
   - 確保 LIFF App 設定正確

