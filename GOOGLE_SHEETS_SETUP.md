# Google Sheets 設定指南

本文件詳細說明如何設定 Google Sheets 作為訂房系統的資料庫。

## 關鍵資訊

- **Sheets ID**: `1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw`
- **Service Account Email**: `booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com`

## 步驟 1：存取 Google Sheets

開啟以下連結（或使用現有的 Sheet）：
```
https://docs.google.com/spreadsheets/d/1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw/edit
```

## 步驟 2：建立工作表

在試算表底部，建立三個分頁（Sheet），名稱必須完全一致：

### 2.1 Bookings（訂單）

**第一列（表頭）**：
```
id	guestName	contactPhone	lineName	checkInDate	checkOutDate	numberOfGuests	useCoupon	arrivalTime	totalPrice	status	createdAt	updatedAt
```

**欄位說明**：
| 欄位 | 類型 | 說明 | 範例 |
|-----|------|------|------|
| id | 文字 | 訂單 ID（自動生成） | booking_abc123 |
| guestName | 文字 | 顧客姓名 | 王小明 |
| contactPhone | 文字 | 聯絡電話 | 0912345678 |
| lineName | 文字 | LINE ID（可空） | wangxiaoming |
| checkInDate | 日期 | 入住日期 | 2024-01-01 |
| checkOutDate | 日期 | 退房日期 | 2024-01-03 |
| numberOfGuests | 數字 | 人數 | 2 |
| useCoupon | 布林 | 使用優惠券 | TRUE 或 FALSE |
| arrivalTime | 時間 | 抵達時間（可空） | 15:00 |
| totalPrice | 數字 | 總價 | 9500 |
| status | 文字 | 狀態 | pending/confirmed/cancelled |
| createdAt | 日期時間 | 建立時間 | 2024-01-01T10:00:00.000Z |
| updatedAt | 日期時間 | 更新時間 | 2024-01-01T10:00:00.000Z |

**範例資料**（第二列）：
```
booking_example	王小明	0912345678	wangxiaoming	2024-01-01	2024-01-03	2	TRUE	15:00	9500	pending	2024-01-01T10:00:00.000Z	2024-01-01T10:00:00.000Z
```

### 2.2 Inventory（房況存量）

**第一列（表頭）**：
```
date	isClosed	capacity	note
```

**欄位說明**：
| 欄位 | 類型 | 說明 | 範例 |
|-----|------|------|------|
| date | 日期 | 日期 | 2024-01-01 |
| isClosed | 布林 | 是否關房 | TRUE 或 FALSE |
| capacity | 數字 | 容量（房間數/床位數） | 1 |
| note | 文字 | 備註（可空） | 維護中 |

**範例資料**（第二列）：
```
2024-01-15	TRUE	1	設備維護
```

**說明**：
- 只需要新增「特殊日期」的記錄（關房、容量變更）
- 未記錄的日期會使用 Settings 中的 `defaultCapacity`

### 2.3 Settings（系統設定）

**第一列（表頭）**：
```
key	value	updatedAt
```

**第二列開始（預設設定）**：
```
nightlyPriceDefault	5000	2024-01-01T00:00:00.000Z
weekendPriceDefault	7000	2024-01-01T00:00:00.000Z
couponDiscount	500	2024-01-01T00:00:00.000Z
defaultCapacity	1	2024-01-01T00:00:00.000Z
```

**設定說明**：
| Key | 說明 | 預設值 |
|-----|------|--------|
| nightlyPriceDefault | 平日房價 | 5000 |
| weekendPriceDefault | 週末房價（五、六） | 7000 |
| couponDiscount | 優惠券折扣 | 500 |
| defaultCapacity | 預設容量 | 1 |

**可選設定**（可自行新增）：
```
notificationEmails	["admin@example.com"]	2024-01-01T00:00:00.000Z
```

## 步驟 3：設定格式（建議）

### Bookings 工作表

1. 選取 `checkInDate` 和 `checkOutDate` 欄位
   - 格式 > 數字 > 日期 > `YYYY-MM-DD`

2. 選取 `createdAt` 和 `updatedAt` 欄位
   - 格式 > 數字 > 日期時間 > ISO 8601

3. 選取 `useCoupon` 欄位
   - 資料驗證 > 清單 > `TRUE, FALSE`

4. 選取 `status` 欄位
   - 資料驗證 > 清單 > `pending, confirmed, cancelled`

### Inventory 工作表

1. 選取 `date` 欄位
   - 格式 > 數字 > 日期 > `YYYY-MM-DD`

2. 選取 `isClosed` 欄位
   - 資料驗證 > 清單 > `TRUE, FALSE`

### Settings 工作表

1. 選取 `updatedAt` 欄位
   - 格式 > 數字 > 日期時間 > ISO 8601

## 步驟 4：共用權限

**重要：這是系統運作的必要步驟！**

1. 點擊右上角的「共用」按鈕

2. 在「新增使用者和群組」欄位輸入：
   ```
   booking-sheet-manager@gen-lang-client-0646685275.iam.gserviceaccount.com
   ```

3. 權限選擇：**編輯者**

4. **取消勾選**「通知使用者」（Service Account 不需要通知）

5. 點擊「完成」

6. 確認共用清單中顯示該 Service Account

## 步驟 5：測試連接

部署 Worker 後，使用以下 API 測試連接：

```bash
# 初始化 Sheets（如果表頭已手動建立，可跳過）
curl -X POST https://your-worker.workers.dev/api/admin/initialize \
  -H "x-admin-key: your-admin-key"

# 測試讀取設定
curl https://your-worker.workers.dev/api/admin/settings \
  -H "x-admin-key: your-admin-key"
```

## 進階設定

### 凍結首列（表頭）

1. 選取第一列
2. 檢視 > 凍結 > 1 列

### 設定篩選器

1. 選取表頭列
2. 資料 > 建立篩選器

### 條件式格式（Bookings）

**標示不同狀態**：
1. 選取 `status` 欄位（整欄）
2. 格式 > 條件式格式
3. 新增規則：
   - `status = "pending"` → 黃色背景
   - `status = "confirmed"` → 綠色背景
   - `status = "cancelled"` → 紅色背景

## 資料驗證範例

### 日期驗證（checkInDate）

1. 選取 `checkInDate` 欄位
2. 資料 > 資料驗證
3. 準則：日期 > 在範圍內
4. 範圍：今天 ~ 1 年後

### 電話號碼驗證（contactPhone）

1. 選取 `contactPhone` 欄位
2. 資料 > 資料驗證
3. 準則：文字 > 符合正規表示式
4. 正規表示式：`^09\d{8}$`（台灣手機號碼）

## 備份建議

### 自動備份（Google Sheets 內建）

Google Sheets 會自動保留版本記錄：
- 檔案 > 版本記錄 > 查看版本記錄

### 手動備份

定期匯出備份：
1. 檔案 > 下載
2. 選擇格式：
   - Microsoft Excel (.xlsx) - 完整格式
   - CSV - 純資料

### 自動匯出腳本（進階）

可使用 Google Apps Script 設定每日自動備份到 Google Drive。

## 常見問題

### Q: 為什麼需要分享給 Service Account？

A: Worker 使用 Service Account 認證存取 Google Sheets API，必須有編輯權限才能讀寫資料。

### Q: 可以使用多個 Sheets 嗎？

A: 可以，只需修改 Worker 的 `GOOGLE_SHEETS_ID` 環境變數。

### Q: 如何限制特定人員只能查看？

A: 
1. Service Account 保持編輯權限（API 需要）
2. 其他人員設為「檢視者」或「加註者」
3. 重要：不要刪除 Service Account 的權限

### Q: 資料會被覆蓋嗎？

A: 系統使用樂觀鎖機制，並發更新時會回傳錯誤，不會靜默覆蓋。

### Q: 可以手動編輯資料嗎？

A: 可以，但建議：
- 不要刪除表頭列
- 保持欄位順序
- 使用正確的資料格式
- 更新 `updatedAt` 欄位

## 疑難排解

### 錯誤：Permission denied

1. 確認 Service Account email 已加入共用
2. 確認權限為「編輯者」
3. 等待 1-2 分鐘讓權限生效

### 錯誤：Requested entity was not found

1. 確認 Sheets ID 正確
2. 確認工作表名稱完全一致（區分大小寫）

### 資料格式錯誤

確保：
- 日期格式：`YYYY-MM-DD`
- 時間格式：`HH:mm`
- ISO 8601：`YYYY-MM-DDTHH:mm:ss.sssZ`
- 布林值：`TRUE` 或 `FALSE`（大寫）

## 維護建議

1. **定期檢查**：每週檢查 Sheets 資料完整性
2. **清理舊資料**：每季度將舊訂單移到存檔分頁
3. **監控配額**：Google Sheets API 有每日讀取限制
4. **備份習慣**：重要變更前先手動備份

---

設定完成後，系統即可正常運作！ 🎉

