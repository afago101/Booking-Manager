# LINE 登入邏輯問題分析與修正

## 🐛 發現的問題

### 問題 1: URL 參數清除時機導致的競爭條件 ⚠️ **嚴重**

**位置**: `utils/lineLogin.ts:416-428`

**問題描述**:
```typescript
// 在 handleLineOAuthCallback 中
const data = await response.json();  // 取得 token

// ❌ 問題：在返回 token 之前就清除了 URL 參數
window.history.replaceState({}, '', returnPath);

// 返回 token
return data.accessToken || data.idToken || null;
```

**影響**:
1. React 組件的 `useEffect` 可能會因為 URL 變化而觸發重新渲染
2. 如果 `useEffect` 在 URL 清除後再次執行，會檢查不到 `code` 和 `state`
3. 導致登入資訊處理流程中斷

**根本原因**:
- `window.history.replaceState` 會改變 URL，但不會觸發頁面重新載入
- React Router 可能會因為 URL 變化而重新渲染組件
- 如果組件重新渲染，`useEffect` 可能會重新執行，但此時 URL 參數已被清除

### 問題 2: useEffect 依賴導致可能的無限循環 ⚠️ **中等**

**位置**: `pages/BookingPage.tsx:131-249`

**問題描述**:
```typescript
useEffect(() => {
  // ... OAuth callback 處理
  // ... LINE 用戶載入
}, [syncCustomerProfile]);  // ⚠️ 依賴 syncCustomerProfile
```

**影響**:
- 雖然 `syncCustomerProfile` 是 `useCallback`，但如果在某種情況下重新創建，會導致 `useEffect` 無限執行
- 如果 OAuth callback 處理過程中調用了 `syncCustomerProfile`，可能會觸發新的 `useEffect` 執行

**根本原因**:
- `syncCustomerProfile` 的依賴是空數組 `[]`，理論上不會變化
- 但如果 React 在重新渲染時認為依賴變化，可能會導致問題

### 問題 3: 狀態檢查不完整導致重複處理 ⚠️ **中等**

**位置**: `pages/BookingPage.tsx:131-181`

**問題描述**:
```typescript
useEffect(() => {
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  if (code && state) {
    // 處理 OAuth callback
    handleLineOAuthCallback().then(async (token) => {
      // 處理 token...
    });
    return;  // ⚠️ 但沒有標記已處理，如果組件重新渲染可能會重複處理
  }
  
  // 繼續載入 LINE 用戶...
}, [syncCustomerProfile]);
```

**影響**:
- 如果 OAuth callback 處理過程中組件重新渲染，可能會重複處理
- 沒有標記機制防止重複處理

### 問題 4: React Router 與 window.history 的衝突 ⚠️ **輕微**

**位置**: `utils/lineLogin.ts:423, 427`

**問題描述**:
```typescript
// 使用原生 window.history API
window.history.replaceState({}, '', returnPath);

// 但 React Router 使用的是 BrowserRouter
// 可能會導致 React Router 的狀態與實際 URL 不同步
```

**影響**:
- React Router 可能沒有感知到 URL 變化
- 可能會導致路由狀態不一致

---

## 🔧 修正方案

### 修正 1: 延遲清除 URL 參數，並使用 React Router 的方式

**修改**: `utils/lineLogin.ts`

```typescript
export async function handleLineOAuthCallback(): Promise<string | null> {
  // ... 前面的邏輯不變 ...
  
  const data = await response.json();
  
  // ✅ 修正：先返回 token，讓調用者處理完畢後再清除 URL
  // 不在這裡清除 URL，由調用者處理
  
  return data.accessToken || data.idToken || null;
}
```

**並在調用者中處理 URL 清除**:
```typescript
// pages/BookingPage.tsx
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  if (code && state) {
    // 使用標記防止重複處理
    const processingKey = `oauth_processing_${code}`;
    if (sessionStorage.getItem(processingKey)) {
      return;  // 已經在處理中
    }
    sessionStorage.setItem(processingKey, 'true');
    
    handleLineOAuthCallback().then(async (token) => {
      if (token) {
        // ... 處理 token ...
        
        // ✅ 處理完畢後再清除 URL（使用 React Router 的方式）
        const navigate = useNavigate();
        const returnPath = sessionStorage.getItem('line_oauth_return_path') || '/booking';
        navigate(returnPath, { replace: true });
        
        // 清除標記
        sessionStorage.removeItem(processingKey);
      }
    });
    return;
  }
}, [syncCustomerProfile]);
```

### 修正 2: 移除 useEffect 依賴，改用 useRef 追蹤狀態

**修改**: `pages/BookingPage.tsx`

```typescript
const hasProcessedOAuth = useRef(false);

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  // ✅ 修正：使用 ref 防止重複處理
  if (code && state && !hasProcessedOAuth.current) {
    hasProcessedOAuth.current = true;
    
    handleLineOAuthCallback().then(async (token) => {
      // ... 處理邏輯 ...
      
      // 處理完畢後重置標記（如果失敗）
      if (!token) {
        hasProcessedOAuth.current = false;
      }
    });
    return;
  }
  
  // ... 其他邏輯 ...
}, []);  // ✅ 移除依賴
```

### 修正 3: 添加狀態標記防止重複處理

**修改**: `pages/BookingPage.tsx`

```typescript
const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  // ✅ 修正：檢查是否正在處理
  if (code && state && !isProcessingOAuth) {
    setIsProcessingOAuth(true);
    
    handleLineOAuthCallback().then(async (token) => {
      if (token) {
        // ... 處理邏輯 ...
      } else {
        setIsProcessingOAuth(false);  // 失敗時重置
      }
    }).catch(() => {
      setIsProcessingOAuth(false);  // 錯誤時重置
    });
    return;
  }
  
  // ... 其他邏輯 ...
}, [isProcessingOAuth]);  // 使用狀態作為依賴
```

---

## ✅ 最終建議的修正方案

### 方案 A: 使用 sessionStorage 標記（推薦）

**優點**:
- 簡單直接
- 不會因為組件重新渲染而失效
- 可以跨組件使用

**實作**:
```typescript
// utils/lineLogin.ts
export async function handleLineOAuthCallback(): Promise<string | null> {
  // ... 前面的邏輯 ...
  
  // ❌ 移除：不在這裡清除 URL
  // window.history.replaceState({}, '', returnPath);
  
  // ✅ 返回 token，讓調用者處理 URL 清除
  return data.accessToken || data.idToken || null;
}

// pages/BookingPage.tsx
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  if (code && state) {
    // ✅ 檢查是否已處理
    const processedKey = `oauth_processed_${state}`;
    if (sessionStorage.getItem(processedKey)) {
      return;
    }
    
    sessionStorage.setItem(processedKey, 'true');
    
    handleLineOAuthCallback().then(async (token) => {
      if (token) {
        // ... 處理 token ...
        
        // ✅ 使用 React Router 清除 URL
        const returnPath = sessionStorage.getItem('line_oauth_return_path') || '/booking';
        window.history.replaceState({}, '', returnPath);
        window.location.reload();  // 強制重新載入以清除 URL 參數
        // 或者使用 navigate（但需要從組件外部獲取）
      }
    });
    return;
  }
  
  // ... 其他邏輯 ...
}, []);  // ✅ 移除依賴
```

### 方案 B: 分離 OAuth 處理和狀態管理（更複雜但更穩定）

**優點**:
- 邏輯更清晰
- 狀態管理更可靠
- 易於調試

**實作**:
創建一個專門的 hook 來處理 OAuth callback:
```typescript
// hooks/useLineOAuthCallback.ts
export function useLineOAuthCallback() {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (!code || !state || isProcessing) return;
    
    setIsProcessing(true);
    
    handleLineOAuthCallback().then(async (token) => {
      if (token) {
        // 處理 token...
        const returnPath = sessionStorage.getItem('line_oauth_return_path') || '/booking';
        navigate(returnPath, { replace: true });
      }
      setIsProcessing(false);
    });
  }, [isProcessing, navigate]);
  
  return { isProcessing };
}
```

---

## 📝 立即需要修正的問題

### 最嚴重的問題：URL 清除時機

**當前代碼** (`utils/lineLogin.ts:416-432`):
```typescript
// ❌ 問題：在返回前就清除了 URL
window.history.replaceState({}, '', returnPath);
return data.accessToken || data.idToken || null;
```

**修正建議**:
1. 移除 `handleLineOAuthCallback` 中的 URL 清除邏輯
2. 在調用者中處理 URL 清除
3. 使用 React Router 的 `navigate` 或延遲清除

### 次要問題：防止重複處理

**當前代碼** (`pages/BookingPage.tsx:131-181`):
```typescript
// ⚠️ 問題：沒有防重複機制
if (code && state) {
  handleLineOAuthCallback().then(...);
  return;
}
```

**修正建議**:
1. 添加 sessionStorage 標記
2. 使用 useRef 追蹤處理狀態
3. 或者添加 isLoading 狀態檢查

---

## 🔍 測試建議

修正後需要測試以下場景：

1. **正常 OAuth 流程**:
   - 從一般瀏覽器進入訂房頁
   - 點擊綁定 LINE
   - 完成授權後回調
   - 確認資訊正確顯示

2. **快速重新載入**:
   - 在 OAuth callback 頁面快速重新載入
   - 確認不會重複處理

3. **多次點擊**:
   - 快速多次點擊綁定按鈕
   - 確認不會重複發送請求

4. **URL 參數保留**:
   - 確認處理過程中 URL 參數不會提前清除
   - 確認處理完畢後 URL 正確清除

