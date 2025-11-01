// 檢查 Cloudflare Pages 環境變數的診斷腳本
// 這個腳本檢查前端應用中實際讀取到的環境變數值

console.log('=== Cloudflare Pages 環境變數檢查 ===\n');

// 檢查 VITE 環境變數（這些是在構建時注入的）
const envVars = {
  'VITE_LINE_LIFF_ID': import.meta.env.VITE_LINE_LIFF_ID || '未設定',
  'VITE_LINE_CHANNEL_ID': import.meta.env.VITE_LINE_CHANNEL_ID || '未設定',
  'VITE_API_BASE_URL': import.meta.env.VITE_API_BASE_URL || '未設定',
  'VITE_ADMIN_API_KEY': import.meta.env.VITE_ADMIN_API_KEY ? '已設定（已隱藏）' : '未設定',
};

console.log('1. 環境變數狀態：');
Object.entries(envVars).forEach(([key, value]) => {
  const status = value === '未設定' ? '❌' : '✅';
  console.log(`   ${status} ${key}: ${value === '未設定' ? value : (key.includes('KEY') ? value : value.substring(0, 30) + (value.length > 30 ? '...' : ''))}`);
});

console.log('\n2. LIFF 檢查：');
const liffId = import.meta.env.VITE_LINE_LIFF_ID || '';
if (liffId) {
  if (liffId === '2008398150-kRq2E2Ro') {
    console.log('   ✅ LIFF ID 正確: 2008398150-kRq2E2Ro');
  } else {
    console.log(`   ⚠️  LIFF ID 不匹配:`);
    console.log(`      實際值: ${liffId}`);
    console.log(`      預期值: 2008398150-kRq2E2Ro`);
  }
} else {
  console.log('   ❌ LIFF ID 未設定');
  console.log('   → 請在 Cloudflare Pages Dashboard 設定 VITE_LINE_LIFF_ID = 2008398150-kRq2E2Ro');
}

console.log('\n3. LINE Channel ID 檢查：');
const channelId = import.meta.env.VITE_LINE_CHANNEL_ID || '';
if (channelId) {
  if (channelId === '2008398150') {
    console.log('   ✅ Channel ID 正確: 2008398150');
  } else {
    console.log(`   ⚠️  Channel ID 不匹配:`);
    console.log(`      實際值: ${channelId}`);
    console.log(`      預期值: 2008398150`);
  }
} else {
  console.log('   ⚠️  Channel ID 未設定（會從後端取得，但不建議）');
}

console.log('\n4. API Base URL 檢查：');
const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
if (apiUrl) {
  console.log(`   ✅ API Base URL: ${apiUrl}`);
} else {
  console.log('   ⚠️  API Base URL 未設定（使用預設值 /api）');
}

console.log('\n=== 檢查完成 ===\n');

// 檢查 LIFF SDK 狀態（如果已載入）
if (typeof window !== 'undefined' && window.liff) {
  console.log('5. LIFF SDK 狀態：');
  console.log(`   ✅ LIFF SDK 已載入`);
  if (typeof window.liff.isInClient === 'function') {
    console.log(`   - isInClient: ${window.liff.isInClient() ? '✅ 是' : '❌ 否'}`);
  }
  if (typeof window.liff.isLoggedIn === 'function') {
    console.log(`   - isLoggedIn: ${window.liff.isLoggedIn() ? '✅ 是' : '❌ 否'}`);
  }
} else {
  console.log('5. LIFF SDK 狀態：');
  console.log('   ⚠️  LIFF SDK 尚未載入（可能需要等待初始化）');
}

// 輸出建議
console.log('\n=== 建議操作 ===');
const issues = [];

if (!liffId || liffId === '未設定') {
  issues.push('❌ VITE_LINE_LIFF_ID 未設定');
  console.log('\n立即行動：');
  console.log('1. 前往 Cloudflare Dashboard → Pages → booking-manager');
  console.log('2. Settings → Environment variables');
  console.log('3. 新增變數：');
  console.log('   Name: VITE_LINE_LIFF_ID');
  console.log('   Value: 2008398150-kRq2E2Ro');
  console.log('   Environment: Production');
  console.log('4. 儲存後，在 Deployments 頁面點擊「Retry deployment」重新部署');
}

if (!channelId || channelId === '未設定') {
  issues.push('⚠️  VITE_LINE_CHANNEL_ID 未設定（建議設定）');
}

if (issues.length > 0) {
  console.log('\n發現問題：');
  issues.forEach(issue => console.log(`   ${issue}`));
} else {
  console.log('\n✅ 所有環境變數已正確設定！');
}

console.log('\n=== 檢查完成 ===');

