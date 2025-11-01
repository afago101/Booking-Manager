// Cloudflare Pages 環境變數設定腳本
// 需要 Node.js 執行：node set_cloudflare_pages_env.js

const projectName = 'booking-manager';
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID; // 從環境變數或 wrangler 取得
const apiToken = process.env.CLOUDFLARE_API_TOKEN; // 需要 API Token

const envVars = {
  'VITE_LINE_LIFF_ID': '2008398150-kRq2E2Ro',
  'VITE_LINE_CHANNEL_ID': '2008398150',
  'VITE_API_BASE_URL': 'https://booking-api-public.afago101.workers.dev/api',
  'VITE_ADMIN_API_KEY': '40lVHrWkepi2cOwZq7U19vIgNFaDoRXL'
};

async function setEnvironmentVariables() {
  if (!accountId || !apiToken) {
    console.error('❌ 需要設定 CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_TOKEN');
    console.log('\n取得方式：');
    console.log('1. Account ID: Cloudflare Dashboard 右側邊欄');
    console.log('2. API Token: https://dash.cloudflare.com/profile/api-tokens');
    console.log('   權限需要：Pages:Edit');
    return;
  }

  console.log('=== 設定 Cloudflare Pages 環境變數 ===\n');

  // 注意：Cloudflare Pages API 可能需要不同的端點
  // 這裡提供一個參考結構，實際 API 可能需要調整
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/env`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variables: Object.entries(envVars).map(([key, value]) => ({
          key,
          value,
          environments: ['production']
        }))
      })
    });

    if (response.ok) {
      console.log('✅ 環境變數設定成功！');
    } else {
      const error = await response.json();
      console.error('❌ 設定失敗:', error);
      console.log('\n⚠️  如果 API 端點不正確，請使用 Dashboard 手動設定：');
      console.log('   https://dash.cloudflare.com → Pages → booking-manager → Settings → Environment variables');
    }
  } catch (error) {
    console.error('❌ 請求失敗:', error.message);
    console.log('\n建議：使用 Cloudflare Dashboard 手動設定環境變數');
  }
}

setEnvironmentVariables();

