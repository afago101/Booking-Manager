// LINE Login utility

import { frontendLogger } from './frontendLogger';

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID || '';
const LINE_LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID || '';

export interface LineUserInfo {
  lineUserId: string;
  name?: string;
  picture?: string;
}

/**
 * 初始化 LINE Login (LIFF)
 * 如果沒有 LIFF ID，會嘗試使用 Channel ID（僅在 LINE 環境中）
 */
export function initLineLogin(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    console.log('[LIFF] Starting initialization...');
    console.log('[LIFF] LINE_LIFF_ID:', LINE_LIFF_ID ? LINE_LIFF_ID.substring(0, 10) + '...' : 'not set');
    console.log('[LIFF] LINE_CHANNEL_ID:', LINE_CHANNEL_ID ? LINE_CHANNEL_ID : 'not set');

    // 如果不在 LINE 環境中，不需要初始化 LIFF
    const userAgent = navigator.userAgent || '';
    const isInLineApp = userAgent.includes('Line') || userAgent.includes('LINE');
    
    console.log('[LIFF] User agent:', userAgent);
    console.log('[LIFF] Is in LINE app:', isInLineApp);
    
    // ✅ 記錄到後台監測
    frontendLogger.log({
      service: 'line',
      action: 'liff_init_start',
      status: 'info',
      message: 'Starting LIFF initialization',
      details: {
        hasLiffId: !!LINE_LIFF_ID,
        hasChannelId: !!LINE_CHANNEL_ID,
        isInLineApp,
        userAgent: userAgent.substring(0, 100), // 限制長度
      },
    });
    
    if (!isInLineApp) {
      // 不在 LINE 環境中，不需要 LIFF
      console.log('[LIFF] Not in LINE environment, skipping initialization');
      frontendLogger.log({
        service: 'line',
        action: 'liff_init_skipped',
        status: 'info',
        message: 'Not in LINE environment, skipping LIFF initialization',
      });
      resolve();
      return;
    }

    // 在 LINE 環境中，如果有 LIFF ID 就使用，否則跳過（使用 OAuth）
    const liffId = LINE_LIFF_ID || LINE_CHANNEL_ID;
    
    if (!liffId) {
      // 沒有 LIFF ID，跳過 LIFF 初始化（將使用 OAuth）
      console.warn('[LIFF] No LIFF ID or Channel ID, skipping initialization');
      frontendLogger.log({
        service: 'line',
        action: 'liff_init_failed',
        status: 'warning',
        message: 'No LIFF ID or Channel ID configured',
      });
      resolve();
      return;
    }

    // 檢查是否已載入 LINE Login SDK
    if (window.liff) {
      if (window.liff.isLoggedIn !== undefined) {
        console.log('[LIFF] LIFF already initialized');
        resolve();
        return;
      }
    }

    // 檢查腳本是否已經在載入
    if (document.querySelector('script[src*="liff"]')) {
      console.log('[LIFF] LIFF SDK script already loading');
      // 等待腳本載入完成
      const checkInterval = setInterval(() => {
        if (window.liff && window.liff.init) {
          clearInterval(checkInterval);
        window.liff.init({ liffId })
          .then(() => {
            console.log('[LIFF] LIFF initialized successfully');
            frontendLogger.log({
              service: 'line',
              action: 'liff_init_success',
              status: 'success',
              message: 'LIFF initialized successfully',
              details: {
                liffId: liffId.substring(0, 15) + '...',
              },
            });
            resolve();
          })
          .catch((err) => {
            console.error('[LIFF] LIFF init failed:', err);
            frontendLogger.log({
              service: 'line',
              action: 'liff_init_failed',
              status: 'error',
              message: 'LIFF initialization failed',
              details: {
                error: err.message || String(err),
                liffId: liffId.substring(0, 15) + '...',
              },
            });
            resolve(); // 不拋出錯誤，允許使用 OAuth 流程
          });
        }
      }, 100);
      
      // 10秒超時
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.liff) {
          console.warn('[LIFF] LIFF SDK loading timeout');
          resolve();
        }
      }, 10000);
      return;
    }

    console.log('[LIFF] Loading LIFF SDK...');
    // 載入 LINE Login SDK (LIFF)
    const script = document.createElement('script');
    script.src = 'https://static.line-scdn.net/liff/edge/versions/2.27.0/sdk.js';
    script.onload = () => {
      console.log('[LIFF] LIFF SDK script loaded');
      if (window.liff) {
        console.log('[LIFF] Initializing with LIFF ID:', liffId.substring(0, 10) + '...');
        window.liff.init({ liffId })
          .then(() => {
            console.log('[LIFF] LIFF initialized successfully');
            frontendLogger.log({
              service: 'line',
              action: 'liff_init_success',
              status: 'success',
              message: 'LIFF initialized successfully',
              details: {
                liffId: liffId.substring(0, 15) + '...',
              },
            });
            resolve();
          })
          .catch((err) => {
            console.error('[LIFF] LIFF init failed:', err);
            frontendLogger.log({
              service: 'line',
              action: 'liff_init_failed',
              status: 'error',
              message: 'LIFF initialization failed',
              details: {
                error: err.message || String(err),
                liffId: liffId.substring(0, 15) + '...',
              },
            });
            resolve(); // 不拋出錯誤，允許使用 OAuth 流程
          });
      } else {
        console.warn('[LIFF] LIFF SDK not available after load');
        resolve(); // 不拋出錯誤
      }
    };
    script.onerror = () => {
      console.error('[LIFF] Failed to load LIFF SDK script');
      resolve(); // 不拋出錯誤，允許使用 OAuth 流程
    };
    document.head.appendChild(script);
  });
}

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
  if (typeof window === 'undefined') return false;
  
  // 首先檢查 userAgent
  const userAgent = navigator.userAgent || '';
  const hasLineUserAgent = userAgent.includes('Line') || userAgent.includes('LINE');
  
  if (!hasLineUserAgent) {
    // 連 userAgent 都不包含 LINE，肯定不是 LINE 環境
    return false;
  }
  
  // userAgent 包含 LINE，但還需要確認 LIFF 是否真的可用
  // 只有 LIFF 已初始化且 isInClient() === true 才是真正的 LIFF 環境
  if (window.liff && typeof window.liff.isInClient === 'function') {
    const inClient = window.liff.isInClient();
    console.log('[isInLine] LIFF check:', { inClient, isInClient: inClient === true });
    return inClient === true;
  }
  
  // userAgent 包含 LINE 但 LIFF 未初始化
  // 這種情況下可能是從 LINE App 打開，但 LIFF 還沒初始化完成
  // 為了嚴格判斷，返回 false（需要等待 LIFF 初始化）
  console.log('[isInLine] UserAgent contains LINE but LIFF not initialized');
  return false;
}

/**
 * 取得 LINE 使用者資訊（僅在 LINE 環境中可用）
 * 使用 LIFF 可以取得真正的 LINE User ID（不需要 OpenID Connect）
 */
export async function getLineProfile(): Promise<LineUserInfo | null> {
  try {
    console.log('[LIFF] Starting getLineProfile...');
    
    // 確保 LIFF 已初始化
    if (!window.liff) {
      console.log('[LIFF] LIFF not loaded, initializing...');
      await initLineLogin();
      
      // 等待 LIFF SDK 完全載入
      let retries = 0;
      while (!window.liff && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
    }

    // 如果 LIFF 初始化後仍未載入，返回 null
    if (!window.liff) {
      console.error('[LIFF] LIFF not available after initialization');
      return null;
    }

    console.log('[LIFF] LIFF loaded, checking login status...');
    console.log('[LIFF] isInClient:', window.liff.isInClient());
    console.log('[LIFF] isLoggedIn:', window.liff.isLoggedIn());

    // 如果未登入，嘗試自動登入（僅在 LINE 環境中）
    if (!window.liff.isLoggedIn()) {
      if (window.liff.isInClient()) {
        console.log('[LIFF] Not logged in, triggering login...');
        frontendLogger.log({
          service: 'line',
          action: 'liff_auto_login',
          status: 'info',
          message: 'Not logged in, triggering automatic login',
        });
        // 在 LINE App 中，自動觸發登入
        window.liff.login();
        // 登入會觸發重新導向，這裡返回 null，等待重新載入
        return null;
      } else {
        console.warn('[LIFF] Not logged in and not in LINE client');
        frontendLogger.log({
          service: 'line',
          action: 'liff_not_logged_in',
          status: 'warning',
          message: 'Not logged in and not in LINE client',
        });
        // 不在 LINE App 中，返回 null
        return null;
      }
    }

    console.log('[LIFF] Getting profile...');
    const profile = await window.liff.getProfile();
    console.log('[LIFF] Profile received:', {
      userId: profile.userId,
      displayName: profile.displayName,
      hasPicture: !!profile.pictureUrl,
    });
    
    // ✅ 記錄到後台監測
    frontendLogger.log({
      service: 'line',
      action: 'liff_profile_received',
      status: 'success',
      message: 'LINE profile received successfully',
      userId: profile.userId,
      details: {
        displayName: profile.displayName,
        hasPicture: !!profile.pictureUrl,
      },
    });
    
    // LIFF 的 getProfile() 可以直接取得 userId（真正的 LINE User ID）
    // 不需要 idToken 驗證
    
    return {
      lineUserId: profile.userId, // LIFF 可以直接取得真正的 LINE User ID
      name: profile.displayName,
      picture: profile.pictureUrl,
    };
  } catch (error) {
    console.error('[LIFF] Error getting LINE profile:', error);
    frontendLogger.log({
      service: 'line',
      action: 'liff_profile_error',
      status: 'error',
      message: 'Error getting LINE profile',
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return null;
  }
}

/**
 * LINE 登入（在非 LINE 環境中打開登入頁）
 * 使用 LINE Login OAuth 流程
 */
export async function loginWithLine(): Promise<void> {
  try {
    // 如果在 LINE 環境中且有 LIFF
    if (window.liff && typeof window.liff.isLoggedIn === 'function') {
      if (!window.liff.isLoggedIn()) {
        window.liff.login();
        return;
      }
    }

    // 使用 LINE Login OAuth（純網頁環境）
    // 如果沒有設定 Channel ID，需要從後端取得
    let channelId = LINE_CHANNEL_ID;
    
    if (!channelId) {
      // 嘗試從後端取得 Channel ID（可選）
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
        const response = await fetch(`${API_BASE_URL}/line/config`);
        if (response.ok) {
          const config = await response.json();
          channelId = config.channelId;
        }
      } catch (err) {
        console.error('Failed to get Channel ID from backend:', err);
      }
    }
    
    if (!channelId) {
      throw new Error('LINE Channel ID not configured. Please set VITE_LINE_CHANNEL_ID environment variable.');
    }
    
    // 使用標準路徑（非 hash router）
    // 從當前 pathname 決定正確的 redirect_uri
    const currentPath = window.location.pathname || '/';
    
    // 根據當前路徑決定 redirect_uri
    // 這些必須與 LINE Developers Console 中設定的 Callback URL 完全一致
    let redirectUri = '';
    
    if (currentPath === '/' || currentPath === '') {
      redirectUri = window.location.origin + '/';
    } else if (currentPath === '/booking' || currentPath.startsWith('/booking')) {
      redirectUri = window.location.origin + '/booking';
    } else if (currentPath === '/confirmation' || currentPath.startsWith('/confirmation')) {
      redirectUri = window.location.origin + '/confirmation';
    } else {
      // 如果不在已知的路由中，使用根路徑
      redirectUri = window.location.origin + '/';
    }
    
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const state = encodeURIComponent(Date.now().toString());
    
    // 儲存當前路徑到 sessionStorage，以便 callback 後回到正確的頁面
    sessionStorage.setItem('line_oauth_return_path', currentPath);
    // 儲存 redirectUri，以便 callback 時使用正確的值
    sessionStorage.setItem('line_oauth_redirect_uri', redirectUri);
    
    // 加入調試日誌
    console.log('[LINE Login] Current URL:', window.location.href);
    console.log('[LINE Login] Current Path:', currentPath);
    console.log('[LINE Login] Redirect URI:', redirectUri);
    console.log('[LINE Login] Encoded Redirect URI:', encodedRedirectUri);
    
    // ✅ 修正：加入 openid scope 以取得真正的 LINE User ID
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodedRedirectUri}&state=${state}&scope=profile openid`;
    
    // 儲存 state 到 sessionStorage 以便驗證
    sessionStorage.setItem('line_oauth_state', state);
    
    console.log('[LINE Login] Full OAuth URL:', lineLoginUrl);
    
    // 重定向到 LINE Login
    window.location.href = lineLoginUrl;
  } catch (error) {
    console.error('Error logging in with LINE:', error);
    throw error;
  }
}

/**
 * 處理 LINE OAuth callback（從 URL 參數取得 code 並交換 token）
 */
export async function handleLineOAuthCallback(): Promise<string | null> {
  console.log('[LINE OAuth] handleLineOAuthCallback called');
  console.log('[LINE OAuth] Full URL:', window.location.href);
  console.log('[LINE OAuth] Search:', window.location.search);
  console.log('[LINE OAuth] Pathname:', window.location.pathname);
  
  // 從 URL 參數取得 code 和 state（標準方式）
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  console.log('[LINE OAuth] URL params:', { 
    hasCode: !!code, 
    hasState: !!state,
    codeLength: code?.length || 0,
    stateLength: state?.length || 0,
    url: window.location.href,
    search: window.location.search,
    pathname: window.location.pathname,
  });
  
  if (!code || !state) {
    console.log('[LINE OAuth] Missing code or state after all parsing attempts, returning null');
    return null;
  }

  // 驗證 state
  const savedState = sessionStorage.getItem('line_oauth_state');
  console.log('[LINE OAuth] State validation:', { 
    received: state,
    saved: savedState,
    match: state === savedState,
  });
  
  if (state !== savedState) {
    console.error('[LINE OAuth] Invalid OAuth state - possible CSRF attack or expired session');
    return null;
  }

  sessionStorage.removeItem('line_oauth_state');

  try {
    // 透過後端交換 access token 和 id token
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
    
    // 重要：redirect_uri 必須是前端網址，不是後端 API 網址
    // 我們應該使用在 loginWithLine 時計算的 redirectUri
    // 但如果沒有保存，則從當前 URL 計算（排除可能的 API 路徑）
    let redirectUri = sessionStorage.getItem('line_oauth_redirect_uri');
    
    if (!redirectUri) {
      // 如果沒有保存，從當前 URL 計算
      // 但必須確保是前端網址，不是 API 網址
      redirectUri = window.location.origin + window.location.pathname;
      
      // 如果當前 URL 是 API 端點或包含 /api/，這是錯誤的
      // 應該使用保存的 return_path 來推斷正確的路徑
      if (redirectUri.includes('/api/') || window.location.pathname.startsWith('/api/')) {
        const returnPath = sessionStorage.getItem('line_oauth_return_path');
        if (returnPath) {
          redirectUri = window.location.origin + returnPath;
        } else {
          // 如果沒有路徑，使用根路徑
          redirectUri = window.location.origin + '/';
        }
        console.warn('[LINE OAuth] Invalid redirectUri detected, using calculated path:', redirectUri);
      }
    }
    
    // 確保末尾沒有多餘的斜線（除了根路徑）
    if (redirectUri !== window.location.origin + '/' && redirectUri.endsWith('/')) {
      redirectUri = redirectUri.slice(0, -1);
    }
    
    // 記錄詳細資訊以便診斷
    console.log('[LINE OAuth] Sending callback request:', {
      redirectUri,
      codeLength: code.length,
      state,
      apiUrl: `${API_BASE_URL}/line/oauth/callback`,
      currentUrl: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
    });

    const response = await fetch(`${API_BASE_URL}/line/oauth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri, state }),
    });

    console.log('[LINE OAuth] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to exchange OAuth code';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      console.error('[LINE OAuth] Callback failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        redirectUri,
      });
      
      // ✅ 記錄到後台監測
      frontendLogger.log({
        service: 'line',
        action: 'oauth_callback_failed',
        status: 'error',
        message: 'OAuth callback failed',
        details: {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          redirectUri,
        },
      });
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[LINE OAuth] Callback successful:', {
      hasAccessToken: !!data.accessToken,
      hasIdToken: !!data.idToken,
      hasLineUserId: !!data.lineUserId,
      lineUserId: data.lineUserId,
      name: data.name,
    });
    
    // ✅ 記錄到後台監測
    frontendLogger.log({
      service: 'line',
      action: 'oauth_callback_success',
      status: 'success',
      message: 'OAuth callback completed successfully',
      userId: data.lineUserId,
      details: {
        hasAccessToken: !!data.accessToken,
        hasIdToken: !!data.idToken,
        name: data.name,
      },
    });
    
    // ✅ 修正：不在這裡清除 URL，讓調用者處理
    // 這樣可以確保組件先處理完 token 和狀態更新，再清除 URL
    // 避免因為 URL 清除導致 React Router 重新渲染而中斷處理流程
    
    // ✅ 修正：優先返回 idToken（如果有），否則返回 accessToken
    // idToken 可用於取得真正的 LINE User ID
    return data.idToken || data.accessToken || null;
  } catch (error) {
    console.error('[LINE OAuth] Error handling OAuth callback:', error);
    frontendLogger.log({
      service: 'line',
      action: 'oauth_callback_error',
      status: 'error',
      message: 'Error handling OAuth callback',
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return null;
  }
}

/**
 * LINE 登出
 */
export async function logoutLine(): Promise<void> {
  try {
    if (window.liff && window.liff.isLoggedIn()) {
      window.liff.logout();
    }
  } catch (error) {
    console.error('Error logging out from LINE:', error);
  }
}

// 擴展 Window 介面
declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>;
      isInClient: () => boolean;
      isLoggedIn: () => boolean;
      getProfile: () => Promise<{ displayName: string; pictureUrl?: string; userId: string }>;
      getIDToken: () => string | null;
      login: () => void;
      logout: () => void;
    };
  }
}

