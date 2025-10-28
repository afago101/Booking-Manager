# 🎯 部署狀態檢查

## ✅ 已完成

1. ✅ **Cloudflare Worker** 部署成功
   - URL: `https://booking-manager-worker.afago101.workers.dev`
   - 健康檢查正常

2. ✅ **所有 Secrets** 已設定
   - GOOGLE_SHEETS_ID
   - GOOGLE_CLIENT_EMAIL  
   - GOOGLE_PRIVATE_KEY
   - ADMIN_API_KEY: `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL`
   - CORS_ORIGINS

3. ✅ **Google API 連接** 正常
   - JWT 簽名成功
   - 可以訪問 Google Sheets API

## ⚠️ 需要手動完成

### Google Sheets 設定

請開啟：
https://docs.google.com/spreadsheets/d/1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw/edit

#### 步驟 1：確認共用權限

1. 點擊右上角「共用」按鈕
2. 確認以下 email 已加入：
   ```
   booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com
   ```
3. 權限必須是「編輯者」

#### 步驟 2：建立三個工作表（分頁）

在試算表底部，建立三個分頁（Sheet），名稱必須完全一致：

**1. Bookings**
- 在第一列輸入表頭：
  ```
  id	guestName	contactPhone	lineName	checkInDate	checkOutDate	numberOfGuests	useCoupon	arrivalTime	totalPrice	status	createdAt	updatedAt
  ```

**2. Inventory**
- 在第一列輸入表頭：
  ```
  date	isClosed	capacity	note
  ```

**3. Settings**
- 在第一列輸入表頭：
  ```
  key	value	updatedAt
  ```
- 在第二列開始輸入預設值：
  ```
  nightlyPriceDefault	5000	2024-01-01T00:00:00.000Z
  weekendPriceDefault	7000	2024-01-01T00:00:00.000Z
  couponDiscount	500	2024-01-01T00:00:00.000Z
  defaultCapacity	1	2024-01-01T00:00:00.000Z
  ```

#### 完成後測試

在 PowerShell 執行：

```powershell
# 測試可訂日期
Invoke-RestMethod -Uri "https://booking-manager-worker.afago101.workers.dev/api/availability?from=2024-11-01&to=2024-11-05"

# 測試設定
Invoke-RestMethod -Uri "https://booking-manager-worker.afago101.workers.dev/api/admin/settings" `
  -Headers @{"x-admin-key"="40lVHrWkepi2cOwZq7U19vIgNFaDoRXL"}
```

## 📋 下一步：部署前端

當 Google Sheets 設定完成並測試通過後：

### 1. 更新環境變數

回到專案根目錄建立 `.env.production`：

```bash
cd ..
echo "VITE_API_BASE_URL=https://booking-manager-worker.afago101.workers.dev/api" > .env.production
echo "VITE_ADMIN_API_KEY=40lVHrWkepi2cOwZq7U19vIgNFaDoRXL" >> .env.production
```

### 2. 建置前端

```bash
npm install
npm run build
```

### 3. 部署到 Cloudflare Pages

```bash
npx wrangler pages deploy dist --project-name=booking-manager
```

## 🔑 重要資訊（請保密）

- **Worker URL**: `https://booking-manager-worker.afago101.workers.dev`
- **Admin API Key**: `40lVHrWkepi2cOwZq7U19vIgNFaDoRXL`
- **Sheets ID**: `1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw`

⚠️ 完成後請刪除此檔案！

