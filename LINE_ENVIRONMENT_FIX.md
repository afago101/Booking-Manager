# LINE 環境判斷修正

## 📋 修正內容

根據用戶需求，修正了 LINE 登入邏輯，確保：

1. **只有從 LINE App（LIFF）進入時才自動獲取 LINE UID**
2. **一般瀏覽器不自動獲取，用戶可以透過確認頁的綁定按鈕來綁定**

---

## 🔧 修改的檔案

### 1. `utils/lineLogin.ts`

**修改 `isInLine()` 函數：**

```typescript
/**
 * 檢查是否在 LINE 環境中（LIFF）
 * 必須同時滿足：
 * 1. userAgent 包含 LINE
 * 2. LIFF SDK 已初始化
 * 3. isInClient() === true
 * 
 * 只有真正從 LINE App 進入時才返回 true
 */
export function isInLine(): boolean {
  // 首先檢查 userAgent
  const userAgent = navigator.userAgent || '';
  const hasLineUserAgent = userAgent.includes('Line') || userAgent.includes('LINE');
  
  if (!hasLineUserAgent) {
    return false; // 連 userAgent 都不包含 LINE，肯定不是 LINE 環境
  }
  
  // userAgent 包含 LINE，但還需要確認 LIFF 是否真的可用
  // 只有 LIFF 已初始化且 isInClient() === true 才是真正的 LIFF 環境
  if (window.liff && typeof window.liff.isInClient === 'function') {
    return window.liff.isInClient() === true;
  }
  
  // userAgent 包含 LINE 但 LIFF 未初始化，返回 false
  return false;
}
```

**變更說明：**
- ✅ 更嚴格的判斷：不僅檢查 userAgent，還要確認 LIFF SDK 已初始化且 `isInClient() === true`
- ✅ 確保只有真正從 LINE App 進入時才返回 `true`

---

### 2. `pages/BookingPage.tsx`

**修改 `loadLineUser()` 函數：**

```typescript
const loadLineUser = async () => {
  // 先檢查 userAgent，如果包含 LINE 才初始化 LIFF
  const userAgent = navigator.userAgent || '';
  const hasLineUserAgent = userAgent.includes('Line') || userAgent.includes('LINE');
  
  // 如果 userAgent 不包含 LINE，肯定不是 LINE 環境，不執行任何 LINE 相關操作
  if (!hasLineUserAgent) {
    console.log('[BookingPage] Not in LINE environment (userAgent check)');
    // ✅ 修正：一般瀏覽器不自動獲取 LINE UID，也不使用 localStorage 的 lineUserId
    // 用戶可以透過確認頁的綁定按鈕來綁定 LINE 帳號
    return;
  }
  
  // userAgent 包含 LINE，嘗試初始化 LIFF
  await initLineLogin();
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // ✅ 修正：使用 isInLine() 嚴格判斷是否在真正的 LIFF 環境
  const isReallyInLine = isInLine();
  
  // ✅ 只有確認在真正的 LIFF 環境中才獲取 LINE UID
  if (isReallyInLine) {
    const lineUser = await getLineProfile();
    // ... 獲取並處理 LINE UID
  } else {
    // 雖然 userAgent 包含 LINE，但不是真正的 LIFF 環境
    // 用戶可以在確認頁透過綁定按鈕來綁定
    console.log('[BookingPage] UserAgent contains LINE but not in true LIFF environment');
  }
};
```

**變更說明：**
- ✅ 一般瀏覽器（userAgent 不包含 LINE）完全不執行 LINE 相關操作
- ✅ 只有確認在真正的 LIFF 環境（`isInLine() === true`）時才自動獲取 LINE UID
- ✅ 移除了對 `localStorage` 中 `lineUserId` 的使用（一般瀏覽器不再自動使用）

---

### 3. `pages/ConfirmationPage.tsx`

**修改 `handleBindLine()` 函數：**

```typescript
const handleBindLine = async () => {
  // ✅ 修正：先檢查是否在真正的 LIFF 環境中
  let lineUserInfo = null;
  const isReallyInLine = isInLine();
  
  if (isReallyInLine) {
    // 在 LIFF 環境中，初始化 LIFF 並取得 profile
    await initLineLogin();
    await new Promise(resolve => setTimeout(resolve, 500));
    lineUserInfo = await getLineProfile();
  }
  
  // 如果不在 LIFF 環境或 LIFF 取得失敗，使用 OAuth 流程
  if (!lineUserInfo || !lineUserInfo.lineUserId) {
    await loginWithLine(); // 使用 OAuth 流程
    return;
  }

  // ✅ 確認：如果到這裡，一定有 lineUserId，執行綁定
  const bindResult = await apiService.bindBooking(id, lineUserInfo.lineUserId, ...);
  
  // ✅ 修正：確保客戶資料已同步（雙重保險）
  await apiService.syncCustomerProfile(lineUserInfo.lineUserId, ...);
  
  setBindingSuccess(true);
};
```

**變更說明：**
- ✅ 先檢查是否在真正的 LIFF 環境（`isInLine()`）
- ✅ 如果在 LIFF 環境，先嘗試透過 LIFF 取得 LINE UID
- ✅ 如果不在 LIFF 環境或 LIFF 失敗，使用 OAuth 流程
- ✅ 確保綁定時一定會執行 `syncCustomerProfile`，確保 LINE UID 正確記錄

---

## 🎯 行為變化

### 修正前

- ❌ 只要 userAgent 包含 LINE 就嘗試獲取 LINE UID（可能誤判）
- ❌ 一般瀏覽器可能使用 `localStorage` 中的 `lineUserId`（不需要）
- ❌ 綁定按鈕邏輯可能不完整

### 修正後

- ✅ **從 LINE App（LIFF）進入**：自動獲取 LINE UID 並同步到 Sheets
- ✅ **從一般瀏覽器進入**：不執行任何 LINE 相關操作
- ✅ **訂單完成後點擊綁定按鈕**：
  - 如果在 LIFF 環境：透過 LIFF 獲取 LINE UID
  - 如果在一般瀏覽器：使用 OAuth 流程獲取 LINE UID
  - **確保執行** `syncCustomerProfile` 同步 LINE UID

---

## ✅ 測試建議

### 測試場景 1：從 LINE App 進入

1. 從 LINE App 打開訂房頁
2. **預期**：自動獲取 LINE UID，表單可能自動填入 LINE 名稱
3. 檢查 Console：應該看到 `[BookingPage] Confirmed in LIFF environment`
4. 檢查後台日誌：應該看到 `booking_page_liff_success`

### 測試場景 2：從一般瀏覽器進入

1. 從 Chrome/Safari 等一般瀏覽器打開訂房頁
2. **預期**：不執行任何 LINE 相關操作
3. 檢查 Console：應該看到 `[BookingPage] Not in LINE environment (userAgent check)`
4. 填寫訂單並提交

### 測試場景 3：確認頁綁定（LIFF 環境）

1. 從 LINE App 進入並完成訂單
2. 在確認頁點擊「綁定 LINE 帳號」
3. **預期**：透過 LIFF 獲取 LINE UID 並綁定
4. 檢查 Console：應該看到 `[ConfirmationPage] In LIFF environment`
5. 檢查後台日誌：應該看到 `confirmation_page_bind_success`

### 測試場景 4：確認頁綁定（一般瀏覽器）

1. 從一般瀏覽器完成訂單
2. 在確認頁點擊「綁定 LINE 帳號」
3. **預期**：跳轉到 LINE 登入頁面（OAuth 流程）
4. 登入後返回確認頁，自動完成綁定
5. 檢查後台日誌：應該看到 `confirmation_page_bind_success`

---

## 📝 日誌追蹤

所有操作都會記錄到後台監測系統：

- `booking_page_line_check`：檢查 LINE 環境
- `booking_page_liff_success`：LIFF 環境成功獲取 LINE UID
- `confirmation_page_bind_success`：綁定成功
- `confirmation_page_bind_error`：綁定失敗

---

**修正完成時間：** 2024-12-19

