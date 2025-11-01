# 服務監測與日誌系統使用指南

## 📋 功能說明

系統已建立完整的服務監測功能，會自動記錄所有 LINE 和 Email 服務的操作日誌，方便您調閱和診斷問題。

---

## 🎯 記錄的服務

### LINE 服務日誌
- ✅ OAuth callback（登入驗證）
- ✅ 客戶資料同步（sync-profile）
- ✅ Token 驗證
- ✅ 訂單綁定

### Email 服務日誌
- ✅ 新訂單通知（發送給管理員）
- ✅ 訂單確認信（發送給客戶）

---

## 📊 API 端點

所有日誌 API 都需要 **Admin API Key** 驗證。

### 1. 取得日誌

**端點：** `GET /api/admin/logs`

**查詢參數：**
- `service`（可選）：服務名稱，例如 `line` 或 `email`
- `status`（可選）：狀態篩選，`success`、`error` 或 `warning`
- `limit`（可選）：限制返回數量，預設全部
- `since`（可選）：ISO 時間戳，只返回此時間之後的日誌

**範例：**
```powershell
# 取得所有日誌
$headers = @{ "Authorization" = "Bearer YOUR_ADMIN_API_KEY" }
Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/admin/logs" -Headers $headers

# 只取得 LINE 服務的錯誤日誌
Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/admin/logs?service=line&status=error" -Headers $headers

# 取得最近 50 筆日誌
Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/admin/logs?limit=50" -Headers $headers

# 取得最近 1 小時的日誌
$since = (Get-Date).AddHours(-1).ToUniversalTime().ToString("o")
Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/admin/logs?since=$since" -Headers $headers
```

---

### 2. 取得日誌摘要

**端點：** `GET /api/admin/logs/summary`

返回統計資訊：
- 總日誌數量
- 各服務的日誌數量
- 各狀態的日誌數量
- 最近的錯誤日誌（最多 10 筆）

**範例：**
```powershell
$headers = @{ "Authorization" = "Bearer YOUR_ADMIN_API_KEY" }
Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/admin/logs/summary" -Headers $headers
```

**回應範例：**
```json
{
  "total": 150,
  "byService": {
    "line": 80,
    "email": 70
  },
  "byStatus": {
    "success": 120,
    "error": 25,
    "warning": 5
  },
  "recentErrors": [...]
}
```

---

### 3. 匯出日誌（CSV）

**端點：** `GET /api/admin/logs/export`

返回 CSV 格式的所有日誌，方便在 Excel 中分析。

**範例：**
```powershell
$headers = @{ "Authorization" = "Bearer YOUR_ADMIN_API_KEY" }
$logs = Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/admin/logs/export" -Headers $headers
$logs | Out-File -FilePath "service-logs.csv" -Encoding UTF8
```

---

### 4. 清除所有日誌

**端點：** `DELETE /api/admin/logs`

**注意：** 這會清除所有日誌，請謹慎使用！

**範例：**
```powershell
$headers = @{ "Authorization" = "Bearer YOUR_ADMIN_API_KEY" }
Invoke-RestMethod -Uri "https://booking-api-public.afago101.workers.dev/api/admin/logs" -Method Delete -Headers $headers
```

---

## 📝 日誌格式

每個日誌記錄包含以下欄位：

```typescript
{
  id: string;              // 唯一識別碼
  timestamp: string;        // ISO 時間戳
  service: string;         // 服務名稱（'line', 'email'）
  action: string;          // 操作名稱（'oauth_callback', 'send_notification'）
  status: string;         // 'success', 'error', 'warning'
  message: string;        // 訊息描述
  duration?: number;       // 執行時間（毫秒）
  userId?: string;        // 使用者 ID（LINE User ID 或 Email）
  details?: any;          // 額外詳細資訊（錯誤訊息、回應資料等）
}
```

---

## 🧪 測試範例

### 測試 1: 查看所有日誌

```powershell
$apiKey = "YOUR_ADMIN_API_KEY"
$baseUrl = "https://booking-api-public.afago101.workers.dev/api/admin"
$headers = @{ "Authorization" = "Bearer $apiKey" }

# 取得所有日誌
$logs = Invoke-RestMethod -Uri "$baseUrl/logs" -Headers $headers
$logs.logs | Format-Table -AutoSize
```

### 測試 2: 查看 LINE 服務的錯誤

```powershell
# 只查看 LINE 服務的錯誤日誌
$errorLogs = Invoke-RestMethod -Uri "$baseUrl/logs?service=line&status=error" -Headers $headers
$errorLogs.logs | Format-Table -Property timestamp, message, userId, details -AutoSize
```

### 測試 3: 查看 Email 發送記錄

```powershell
# 查看 Email 服務的日誌
$emailLogs = Invoke-RestMethod -Uri "$baseUrl/logs?service=email" -Headers $headers
$emailLogs.logs | Format-Table -Property timestamp, action, status, userId, duration -AutoSize
```

---

## 📊 日誌內容範例

### LINE OAuth Callback 成功

```json
{
  "id": "1234567890-abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "line",
  "action": "oauth_callback",
  "status": "success",
  "message": "OAuth callback completed successfully",
  "duration": 245,
  "userId": "U1234567890abcdef",
  "details": {
    "name": "張三",
    "hasPicture": true
  }
}
```

### LINE OAuth Callback 失敗

```json
{
  "id": "1234567890-def456",
  "timestamp": "2024-01-15T10:35:00.000Z",
  "service": "line",
  "action": "oauth_callback",
  "status": "error",
  "message": "Failed to exchange OAuth code",
  "duration": 120,
  "details": {
    "status": 401,
    "error": "invalid_grant",
    "redirectUri": "https://blessing-haven.marcux.uk/booking"
  }
}
```

### Email 發送成功

```json
{
  "id": "1234567890-ghi789",
  "timestamp": "2024-01-15T11:00:00.000Z",
  "service": "email",
  "action": "send_notification",
  "status": "success",
  "message": "Booking notification email sent to admin@example.com",
  "duration": 350,
  "userId": "admin@example.com",
  "details": {
    "bookingId": "BK-20240115-001",
    "guestName": "李四",
    "emailId": "re_abc123"
  }
}
```

### Email 發送失敗

```json
{
  "id": "1234567890-jkl012",
  "timestamp": "2024-01-15T11:05:00.000Z",
  "service": "email",
  "action": "send_confirmation",
  "status": "error",
  "message": "Email send failed to customer@example.com",
  "duration": 200,
  "userId": "customer@example.com",
  "details": {
    "status": 429,
    "error": "Rate limit exceeded",
    "attempt": 2,
    "bookingId": "BK-20240115-001"
  }
}
```

---

## 🔍 診斷問題

### 問題 1: LINE 登入失敗

**步驟：**
1. 取得 LINE 服務的錯誤日誌
2. 查看 `details.error` 欄位
3. 檢查 `redirectUri` 是否正確

### 問題 2: Email 發送失敗

**步驟：**
1. 取得 Email 服務的錯誤日誌
2. 查看 `details.status` 和 `details.error`
3. 如果狀態是 429，表示超過速率限制

### 問題 3: 效能問題

**步驟：**
1. 查看 `duration` 欄位
2. 找出執行時間較長的操作
3. 檢查是否有重試或錯誤

---

## 📋 注意事項

1. **日誌保存在記憶體中**
   - 最多保留 200 筆日誌
   - Worker 重啟後會清空
   - 建議定期匯出重要日誌

2. **需要 Admin API Key**
   - 所有日誌 API 都需要驗證
   - 確保 API Key 的安全性

3. **日誌不會自動持久化**
   - 如果需要長期保存，請定期匯出

---

## ✅ 已完成的功能

- ✅ LINE OAuth callback 日誌記錄
- ✅ LINE 客戶資料同步日誌記錄
- ✅ Email 發送日誌記錄（通知和確認信）
- ✅ 日誌查詢 API（支援篩選）
- ✅ 日誌摘要 API
- ✅ 日誌匯出功能（CSV）
- ✅ 日誌清除功能

---

**系統已部署！現在您可以隨時調閱服務日誌來診斷問題了！** 🎉

