# LINE 一般瀏覽器修正

## 🐛 問題描述

用戶報告：一般瀏覽器進入時還是會取用 LINE，但沒有查詢 Google Sheet。

## 🔍 問題原因

在 `BookingPage.tsx` 的 OAuth callback 處理中，即使是一般瀏覽器，如果 URL 中有 `code` 和 `state` 參數（可能是誤觸或其他原因），也會執行 LINE 登入流程。

## ✅ 修正內容

### 修改檔案：`pages/BookingPage.tsx`

**OAuth callback 處理邏輯：**

```typescript
// 處理 LINE OAuth callback（從 URL 參數取得 code）
// ✅ 修正：只有在 LINE 環境中才處理 OAuth callback，一般瀏覽器不應該處理
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  // ✅ 修正：如果沒有 code 和 state，不執行任何 LINE 相關操作
  if (!code || !state) {
    return;
  }
  
  // ✅ 修正：檢查是否在 LINE 環境中（userAgent 檢查）
  const userAgent = navigator.userAgent || '';
  const hasLineUserAgent = userAgent.includes('Line') || userAgent.includes('LINE');
  
  if (!hasLineUserAgent) {
    // 一般瀏覽器不應該有 OAuth callback（可能是誤觸）
    console.log('[BookingPage] OAuth callback detected but not in LINE environment, clearing URL params');
    // 清除 URL 參數，但不執行 LINE 登入
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    return;
  }
  
  // 只有在 LINE 環境中才處理 OAuth callback
  // ... 處理 OAuth callback
});
```

## 🎯 修正後行為

### 一般瀏覽器進入時

1. **檢查 URL 參數**
   - 如果沒有 `code` 和 `state`：直接返回，不執行任何 LINE 相關操作 ✅
   - 如果有 `code` 和 `state` 但不在 LINE 環境：清除 URL 參數並返回 ✅

2. **不會觸發以下操作：**
   - ❌ 不會調用 `handleLineOAuthCallback()`
   - ❌ 不會調用 `apiService.verifyLineToken()`
   - ❌ 不會調用 `syncCustomerProfile()`
   - ❌ 不會設置 `lineUserId`
   - ❌ 不會載入優惠券

3. **`loadLineUser()` 函數**
   - 會檢查 userAgent，如果不包含 LINE，直接 return
   - 不會初始化 LIFF
   - 不會獲取 LINE profile

### LINE App（LIFF）進入時

1. **自動獲取 LINE UID**
2. **同步到 Google Sheets**
3. **載入優惠券**

## 📋 完整流程檢查

### 一般瀏覽器流程

```
進入訂房頁
  ↓
檢查 OAuth callback（code & state）
  ├─ 沒有 → 返回（不執行任何操作）✅
  └─ 有但不在 LINE 環境 → 清除 URL 參數並返回 ✅
  ↓
檢查 userAgent
  ├─ 不包含 LINE → loadLineUser() 直接 return ✅
  └─ 包含 LINE → 初始化 LIFF（僅在真正的 LIFF 環境中）
```

### LINE App（LIFF）流程

```
進入訂房頁
  ↓
檢查 OAuth callback（code & state）
  ├─ 有且在 LINE 環境 → 處理 OAuth callback ✅
  └─ 沒有 → 繼續
  ↓
檢查 userAgent
  ├─ 包含 LINE → 初始化 LIFF
  └─ 確認 isInClient() === true → 獲取 LINE profile ✅
  ↓
同步到 Google Sheets ✅
```

## 🔧 日誌追蹤

所有操作都會記錄到後台監測系統：

- `oauth_callback_detected`（僅在 LINE 環境中記錄）
- `booking_page_line_check`（包含環境檢查結果）
- `booking_page_liff_success`（僅在 LIFF 環境成功時記錄）

## ✅ 測試建議

### 測試場景 1：一般瀏覽器（正常進入）

1. 從 Chrome/Safari 等一般瀏覽器打開訂房頁
2. **預期**：
   - Console 應該看到 `[BookingPage] Not in LINE environment (userAgent check)`
   - 不應該看到任何 LINE 相關的 API 調用
   - 不應該設置 `lineUserId`
3. 檢查 Network 標籤：不應該有 `/api/line/` 相關的請求

### 測試場景 2：一般瀏覽器（誤觸 OAuth callback）

1. 從一般瀏覽器打開帶有 `code` 和 `state` 參數的 URL
2. **預期**：
   - Console 應該看到 `[BookingPage] OAuth callback detected but not in LINE environment, clearing URL params`
   - URL 參數應該被清除
   - 不應該執行 LINE 登入

### 測試場景 3：LINE App（正常進入）

1. 從 LINE App 打開訂房頁
2. **預期**：
   - 自動獲取 LINE UID
   - 同步到 Google Sheets
   - 載入優惠券

---

**修正完成時間：** 2024-12-19

