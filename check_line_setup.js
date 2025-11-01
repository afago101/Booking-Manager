// LINE 設定檢查腳本
// 在瀏覽器 Console 中執行此腳本以檢查 LINE 設定

(function() {
  console.log('=== LINE 設定檢查 ===\n');
  
  // 1. 檢查環境變數
  console.log('1. 環境變數檢查:');
  
  // 嘗試從 import.meta.env 讀取（Vite 構建後的環境變數）
  let liffId, channelId, apiUrl;
  
  try {
    liffId = import.meta?.env?.VITE_LINE_LIFF_ID || '未設定';
    channelId = import.meta?.env?.VITE_LINE_CHANNEL_ID || '未設定';
    apiUrl = import.meta?.env?.VITE_API_BASE_URL || '未設定';
  } catch (e) {
    liffId = '未設定（無法讀取）';
    channelId = '未設定（無法讀取）';
    apiUrl = '未設定（無法讀取）';
  }
  
  // 詳細顯示 LIFF ID
  if (liffId && liffId !== '未設定' && liffId !== '未設定（無法讀取）') {
    if (liffId === '2008398150-kRq2E2Ro') {
      console.log('  - VITE_LINE_LIFF_ID: ✅ 正確 (' + liffId.substring(0, 15) + '...)');
    } else {
      console.log('  - VITE_LINE_LIFF_ID: ⚠️  已設定但值不匹配');
      console.log('    實際值:', liffId.substring(0, 20) + '...');
      console.log('    預期值: 2008398150-kRq2E2Ro');
    }
  } else {
    console.log('  - VITE_LINE_LIFF_ID: ❌ 未設定');
    console.log('    → 需要在 Cloudflare Pages 設定環境變數');
  }
  
  // Channel ID 檢查
  if (channelId && channelId !== '未設定' && channelId !== '未設定（無法讀取）') {
    if (channelId === '2008398150') {
      console.log('  - VITE_LINE_CHANNEL_ID: ✅ 正確 (' + channelId + ')');
    } else {
      console.log('  - VITE_LINE_CHANNEL_ID: ⚠️  值不匹配 (' + channelId + ')');
    }
  } else {
    console.log('  - VITE_LINE_CHANNEL_ID: ⚠️  未設定（會從後端取得，但不建議）');
  }
  
  // API URL 檢查
  if (apiUrl && apiUrl !== '未設定' && apiUrl !== '未設定（無法讀取）') {
    console.log('  - VITE_API_BASE_URL: ✅ 已設定 (' + apiUrl.substring(0, 40) + '...)');
  } else {
    console.log('  - VITE_API_BASE_URL: ⚠️  未設定（使用預設值 /api）');
  }
  
  // 2. 檢查 LINE 環境
  console.log('\n2. LINE 環境檢查:');
  const userAgent = navigator.userAgent || '';
  const isInLineApp = userAgent.includes('Line') || userAgent.includes('LINE');
  console.log('  - User Agent:', userAgent);
  console.log('  - 是否在 LINE App 內:', isInLineApp ? '✅ 是' : '❌ 否（請從 LINE App 打開）');
  
  // 3. 檢查 LIFF SDK
  console.log('\n3. LIFF SDK 檢查:');
  if (window.liff) {
    console.log('  - LIFF SDK: ✅ 已載入');
    if (typeof window.liff.isInClient === 'function') {
      console.log('  - isInClient():', window.liff.isInClient() ? '✅ 是' : '❌ 否');
    }
    if (typeof window.liff.isLoggedIn === 'function') {
      console.log('  - isLoggedIn():', window.liff.isLoggedIn() ? '✅ 已登入' : '❌ 未登入');
    }
  } else {
    console.log('  - LIFF SDK: ❌ 未載入（可能在一般瀏覽器，或 LIFF ID 未設定）');
  }
  
  // 4. 檢查 localStorage
  console.log('\n4. 本地儲存檢查:');
  const savedUserId = localStorage.getItem('lineUserId');
  console.log('  - 保存的 lineUserId:', savedUserId || '❌ 無');
  
  // 5. 檢查 sessionStorage
  console.log('\n5. Session 儲存檢查:');
  const oauthState = sessionStorage.getItem('line_oauth_state');
  const returnPath = sessionStorage.getItem('line_oauth_return_path');
  console.log('  - OAuth state:', oauthState || '無');
  console.log('  - Return path:', returnPath || '無');
  
  // 6. 檢查 URL 參數
  console.log('\n6. URL 參數檢查:');
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  console.log('  - OAuth code:', code ? `✅ ${code.substring(0, 20)}...` : '❌ 無');
  console.log('  - OAuth state:', state || '❌ 無');
  
  // 7. 總結
  console.log('\n=== 檢查總結 ===');
  const issues = [];
  
  if (liffId === '未設定') {
    issues.push('❌ VITE_LINE_LIFF_ID 未設定 - 請在 Cloudflare Pages 設定環境變數');
  }
  
  if (channelId === '未設定') {
    issues.push('⚠️ VITE_LINE_CHANNEL_ID 未設定 - 建議設定以提升效能');
  }
  
  if (!isInLineApp) {
    issues.push('⚠️ 不在 LINE App 內 - 請從 LINE App 打開此頁面');
  }
  
  if (!window.liff && isInLineApp) {
    issues.push('❌ LIFF SDK 未載入 - 檢查 LIFF ID 設定和網路連線');
  }
  
  if (issues.length === 0) {
    console.log('✅ 所有檢查項目正常');
  } else {
    console.log('發現以下問題：');
    issues.forEach(issue => console.log(`  ${issue}`));
  }
  
  console.log('\n=== 檢查完成 ===');
})();

