// 檢查和建立 Google Sheets 工作表的腳本

const SHEETS_ID = '1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw';

// 從 gen-lang-client JSON 讀取
const SERVICE_ACCOUNT = {
  client_email: 'booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com',
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDiN+2SB5A4boCa
hwmKOGTRhtQ6/N4nhIhrtHTlrC3H+JQHOjTPE11uOOqjX6P2/ucRszojPsJZGTk6
AILUU5Tx/ZuvVc1OQjnV9UyCromzBUxQ/Uu3rYuYR9HRy13IUExAcl3km1ZbagQ/
afjDhKY+ZJg6pUyymaNYffUCwPH6UeZ8n+elAe52ikSo9WOjLcBbBhU5djdYAImc
5VjfzCw7Q2snP7ZekF3aK6ugrbYidOBoN9w7T50g8YeCOg216JJ6K5UHdb5WRut6
FhGf5QAbXef8pfuUv6Din+vFtWytksOQwCnjrthLryp5AgEAn6xg3Cgy4F24/UxY
YNvNbZHHAgMBAAECggEAH1NK+2GUZ9lsHI8zfnzlqnAHES4KnffyeND8g6tZNuuQ
pVmQONaVJa9i/9boGnVczld+ZvqzUz7fbPfne1B2+8rjFUoGi9421Q51QallWbFo
9SlwzpFibGa8QtbBo1H0j9NmdhgemA+xC+Oi9iwhuy/B4WkaGvyUdoC7/gggL0nd
BGKfC0N4tz6XIX8mDPw7HGxpCsz+h9xrqT36zOz0nsFYTv1IZGMv2bhlwGG8TT+I
MknrEEW6keXfSUcTmbaGi6e+YA1swhjY4w7LixZjN0R/3KQiW7TUHuXRhRH1m3hG
fAhNNfyKTHkWeza1pudjkhVHa8sjmVSyeyRronr+UQKBgQD73JwLi9dHHmf0nXKW
28Bn7r9pdW7xGTvHlrOUcU6vGdyngdFTlqfc/3du3x2N9oEjQ2bn0fwHM4V+nUCc
P7wmFYlzFLO4poZvuhoJKFh0AMjxzDIzRIHUo41iQtwtnWhZd5ii8BD/IFVkmHgi
NYrcfffU0ECszuyuWpey1wiWNwKBgQDl73Tp1aX27Lv74HAC8OB1UsF/egHi9XW5
uei0h3inhb3El1fO2oTlWKPhtqzD0bUQptngqiDKaT8S9MBvwstrhKps1tAyov+e
tUT4CeTN4Lb6V2Y/N95ObbQPAzyxDp4U16oIgbnGxHPkFIzfpVAtpNYwMoaoo/xb
7kYQ0FUY8QKBgEhsFl7nlj64CpJ3V8Tzaa85IsdTYlRnuh3ZQsgzkLmfCSkNlkCf
+KL+vrwd4iS5NkcKkaOlaQA1G3TeCP8lAJg+5yg1UryM/elQrT3m4RByTVXiLqk5
UM/xO61+pktjkObxEe4AdBK4nHVxtlG37bcbbdE/FOncEojMOgTN+oUfAoGALrcm
1rdMf817J+Jif4Z24/9LRt3/8h+SqohF6h+3+LkoY/+nnGQzKfGHYj1d/m7lzZtI
mueVv+oAIZbOXiaCc7bBdVlzdUY+jv0fJRHFhbqJEnWdVWzBYsfRFFfBBewFXBCx
AAdzOhoBva4bLPkGQC/EQIiTaUHf7MGNRK8/CtECgYEAmiZ/jHSSfV/frTuS1h30
wFJ9eyQq4fpIHb6Bzq5OJriNSYULKidnVZSE3xIg0DAWCTiNRfTfk0os7xQIT23I
Ls1Yr5j8vZ6LxkxzcWwdN5mwdxfnhLJGOXMf5HOhZFIH2knmdMCtLwPQxe+tL37U
+DhCI9ce1aDi/S0t06DVQcA=
-----END PRIVATE KEY-----`
};

async function getAccessToken() {
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    credentials: SERVICE_ACCOUNT,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function getSheetMetadata(accessToken) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  return response.json();
}

async function createSheet(accessToken, sheetName) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }]
      })
    }
  );
  return response.json();
}

async function setupSheetHeaders(accessToken, sheetName, headers, defaultRows = []) {
  // 寫入表頭
  const values = [headers, ...defaultRows];
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values })
    }
  );
  return response.json();
}

async function main() {
  console.log('🔍 檢查 Google Sheets 工作表...\n');
  
  try {
    const accessToken = await getAccessToken();
    console.log('✅ 已取得 Google API 存取權限\n');

    const metadata = await getSheetMetadata(accessToken);
    const existingSheets = metadata.sheets.map(s => s.properties.title);
    
    console.log('📋 現有工作表：', existingSheets.join(', '), '\n');

    const requiredSheets = {
      'Bookings': {
        headers: ['id', 'guestName', 'checkInDate', 'checkOutDate', 'numberOfGuests', 'totalPrice', 'contactPhone', 'lineName', 'useCoupon', 'arrivalTime', 'status', 'createdAt'],
        defaultRows: []
      },
      'Prices': {
        headers: ['date', 'price', 'isClosed'],
        defaultRows: []
      },
      'config': {
        headers: ['key', 'value'],
        defaultRows: [
          ['defaultWeekday', '5000'],
          ['defaultWeekend', '7000'],
          ['closedDates', '[]'],
          ['notificationEmails', '[]']
        ]
      }
    };

    for (const [sheetName, config] of Object.entries(requiredSheets)) {
      if (!existingSheets.includes(sheetName)) {
        console.log(`➕ 建立工作表：${sheetName}`);
        await createSheet(accessToken, sheetName);
        console.log(`✅ ${sheetName} 建立成功`);
        
        console.log(`📝 設定 ${sheetName} 表頭和預設值`);
        await setupSheetHeaders(accessToken, sheetName, config.headers, config.defaultRows);
        console.log(`✅ ${sheetName} 設定完成\n`);
      } else {
        console.log(`✓ ${sheetName} 已存在\n`);
      }
    }

    console.log('🎉 所有工作表檢查完成！\n');
    console.log('📊 Google Sheets 連結：');
    console.log(`https://docs.google.com/spreadsheets/d/${SHEETS_ID}/edit\n`);
    
  } catch (error) {
    console.error('❌ 錯誤：', error.message);
    if (error.response) {
      const errorData = await error.response.json();
      console.error('詳細錯誤：', JSON.stringify(errorData, null, 2));
    }
  }
}

main();

