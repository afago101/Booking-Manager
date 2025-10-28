# 🚨 移除 Cloudflare Pages 的 Access 保護

## 📊 當前狀況

❌ **前台被保護**：https://c306852d.booking-manager-pil.pages.dev  
❌ **無法公開訪問**：所有訪問都被重定向到登入頁面

---

## 🎯 解決方案

### 方案 1：從 Zero Trust 刪除 Pages Application（推薦）

#### 步驟 1：進入 Zero Trust Dashboard

1. **開啟 Cloudflare Dashboard**
   ```
   https://one.dash.cloudflare.com/
   ```

2. **登入您的帳號**

3. **進入 Access 設定**
   - 左側選單 → **Access** → **Applications**

#### 步驟 2：尋找並刪除 Pages 相關的 Application

尋找以下任一項目：
- 名稱包含：`booking-manager`
- 名稱包含：`pages`
- 域名是：`*.pages.dev`
- 域名是：`*.booking-manager-pil.pages.dev`
- 域名是：`c306852d.booking-manager-pil.pages.dev`

#### 步驟 3：刪除 Application

對每個相關的 Application：
1. 點擊右邊的 **···** (三點選單)
2. 選擇 **Delete**
3. 確認刪除

#### 步驟 4：等待生效

- 等待 **2-5 分鐘**讓變更生效
- 清除瀏覽器快取或使用無痕模式測試

---

### 方案 2：修改 Application 設定（部分保護）

如果您想保留某些保護但開放前台：

#### 步驟 1：編輯 Application

1. 在 **Access** → **Applications** 中
2. 找到相關的 Application
3. 點擊 **Edit**

#### 步驟 2：修改 Application Domain

將域名改為只保護特定路徑：
- 原本：`*.pages.dev` 或 `*.booking-manager-pil.pages.dev`
- 改為：`c306852d.booking-manager-pil.pages.dev/admin/*`

這樣只有 `/admin/*` 路徑需要認證，前台可以公開訪問。

#### 步驟 3：儲存變更

- 點擊 **Save**
- 等待 2-5 分鐘生效

---

### 方案 3：檢查 Account 層級設定

如果找不到特定的 Application，可能是 Account 層級設定：

#### 步驟 1：檢查 Authentication Domain

1. **Zero Trust** → **Settings** → **Authentication**
2. 尋找任何關於 `pages.dev` 的規則
3. 如果有，**編輯**或**刪除**

#### 步驟 2：檢查 Device Posture

1. **Zero Trust** → **Settings** → **Devices**
2. 檢查是否有強制所有流量通過 Zero Trust 的設定
3. 如果有，可以新增例外規則

---

## 🧪 測試是否成功

### PowerShell 測試

```powershell
# 測試前台
$response = Invoke-WebRequest -Uri "https://c306852d.booking-manager-pil.pages.dev" -UseBasicParsing

if ($response.Content -like "*Cloudflare Access*") {
    Write-Host "❌ 仍然被保護" -ForegroundColor Red
} else {
    Write-Host "✅ Access 已移除！" -ForegroundColor Green
}
```

### 瀏覽器測試

直接訪問（使用無痕模式）：
```
https://c306852d.booking-manager-pil.pages.dev
```

**成功標準**：
- ✅ 看到訂房頁面（而不是登入頁面）
- ✅ 可以選擇日期
- ✅ 沒有要求輸入 email 進行認證

---

## 🔍 診斷工具

### 檢查是否有 Access

```powershell
# 檢查回應 Headers
$response = Invoke-WebRequest -Uri "https://c306852d.booking-manager-pil.pages.dev" -UseBasicParsing
$response.Headers | ForEach-Object { $_.GetEnumerator() | Where-Object { $_.Key -like "cf-*" } }
```

如果看到 `cf-access-*` 開頭的 Header，表示 Access 仍然啟用。

---

## 🎯 替代方案：使用自訂網域

如果無法移除 Access，可以使用自訂網域繞過：

### 步驟 1：設定 Pages 自訂網域

1. **進入 Pages Dashboard**
   ```
   https://dash.cloudflare.com/:account/pages
   ```

2. **選擇專案**
   - 點擊 `booking-manager`

3. **新增自訂網域**
   - **Custom domains** → **Set up a custom domain**
   - 輸入：`booking.marcus.uk`
   - 確認並儲存

### 步驟 2：設定 DNS

1. **進入 marcus.uk DNS 設定**
   - DNS → Records → Add record

2. **新增 CNAME**
   
   | 欄位 | 值 |
   |------|-------------|
   | Type | CNAME |
   | Name | `booking` |
   | Target | `booking-manager.pages.dev` |
   | Proxy | ✅ Proxied |
   | TTL | Auto |

3. **儲存**

### 步驟 3：更新 API 配置（如果需要）

```powershell
# 更新 CORS 設定
cd worker
echo "https://booking.marcus.uk" | npx wrangler secret put CORS_ORIGINS
```

### 結果

- ✅ 新 URL：`https://booking.marcus.uk`
- ✅ 不受 `*.pages.dev` Access 保護
- ✅ 專業的自訂網域

---

## 📞 需要協助？

### 選項 A：截圖給我

請截圖以下頁面：
1. **Zero Trust → Access → Applications**（完整列表）
2. **Zero Trust → Settings → Authentication**

### 選項 B：嘗試自訂網域

如果願意使用自訂網域 `booking.marcus.uk`，這是最快的解決方案。

---

## ⏰ 預計時間

| 方案 | 時間 | 成功率 |
|------|------|--------|
| **方案 1**：刪除 Application | 5 分鐘 | 80% |
| **方案 2**：修改設定 | 5 分鐘 | 60% |
| **方案 3**：Account 設定 | 10 分鐘 | 50% |
| **自訂網域**（替代） | 10 分鐘 | 100% |

---

## 🚨 重要提醒

### Access 的影響範圍

您的帳號可能有以下 Access 設定：

```
Account Level (全域)
├── *.workers.dev (影響所有 Workers)
│   └── booking-manager-worker ❌ 被保護
│   └── booking-api-public ✅ 繞過（新名稱）
│
└── *.pages.dev (影響所有 Pages)
    └── booking-manager ❌ 被保護
    └── 其他 Pages 專案 ❌ 可能也被保護
```

### 建議

1. **立即**：嘗試刪除 Zero Trust Applications
2. **如果失敗**：使用自訂網域 `booking.marcus.uk`
3. **長期**：評估是否需要 Zero Trust，如果不需要可以完全停用

---

## ✨ 成功後

完成設定後，您應該能：

1. ✅ 直接訪問前台（無需登入）
2. ✅ 選擇日期並查看房況
3. ✅ 提交訂單
4. ✅ 公開分享前台連結給客戶

---

**現在請前往 Zero Trust Dashboard 執行方案 1！**

完成後告訴我，我會測試並確認。

如果 5 分鐘內無法解決，我們就改用自訂網域方案。

