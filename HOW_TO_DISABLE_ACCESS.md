# 如何關閉 Cloudflare Access（圖文步驟）

## 🎯 目標
關閉 Worker 的 Cloudflare Access 保護，讓 API 可以公開訪問

---

## 📍 方法 1：從 Zero Trust 刪除（最常見）

### 步驟 1：進入 Zero Trust Dashboard

1. 開啟瀏覽器，前往：
   ```
   https://one.dash.cloudflare.com/
   ```

2. 選擇您的帳號

3. 左側選單找到 **Zero Trust** 或 **Access**

### 步驟 2：找到 Applications

1. 點擊 **Access** → **Applications**
2. 或直接前往：
   ```
   https://one.dash.cloudflare.com/:account/zero-trust/access/apps
   ```

### 步驟 3：刪除 Worker Application

您會看到應用程式列表，找到：
- 名稱可能是：
  - `booking-manager-worker`
  - `*.workers.dev`
  - `booking-manager-worker.afago101.workers.dev`
  - 或包含 "worker" 的任何應用

對每一個相關應用：
1. 點擊應用名稱右邊的 **三點圖示 (···)**
2. 選擇 **Delete**
3. 確認刪除

### 步驟 4：確認刪除

刪除後，Applications 列表中應該不再有與 `workers.dev` 相關的應用。

---

## 📍 方法 2：從 Workers Dashboard 關閉

### 步驟 1：進入 Workers Dashboard

```
https://dash.cloudflare.com/:account/workers-and-pages
```

### 步驟 2：選擇 Worker

找到並點擊 `booking-manager-worker`

### 步驟 3：檢查 Settings

1. 點擊 **Settings** 標籤
2. 找到 **Triggers** 或 **Routes** 區域
3. 檢查是否有 Access 相關設定
4. 如果有，點擊 **Edit** 並移除

---

## 📍 方法 3：檢查 Account 層級設定

### 可能的問題：預設 Access 規則

1. 前往 Zero Trust Dashboard
2. 選擇 **Settings** → **Authentication**
3. 檢查是否有針對 `*.workers.dev` 的規則
4. 如果有，編輯或刪除它

---

## 🧪 測試是否成功

### 在 PowerShell 執行：

```powershell
# 測試 1: Health Check
$response = Invoke-RestMethod -Uri "https://booking-manager-worker.afago101.workers.dev/api/health"
$response

# 如果成功，應該看到：
# status : ok
# timestamp : 2024-...
```

### 如果仍然看到 HTML（登入頁面）：

#### A. 清除瀏覽器快取
```powershell
# 使用無痕模式測試
Start-Process msedge.exe -ArgumentList "-inprivate https://booking-manager-worker.afago101.workers.dev/api/health"
```

#### B. 等待 2-3 分鐘
DNS 和 CDN 快取需要時間更新

#### C. 檢查是否有多個 Access Applications
可能有多個規則影響同一個 Worker

---

## 🔍 診斷工具

### 檢查目前的 Access 狀態

```powershell
# 查看回應 Header
$response = Invoke-WebRequest -Uri "https://booking-manager-worker.afago101.workers.dev/api/health" -UseBasicParsing
$response.Headers
```

如果看到 `cf-access-*` 開頭的 Header，表示 Access 仍然啟用。

---

## 📞 需要協助？

### 如果以上都無法解決：

1. **截圖給我**
   - Zero Trust → Access → Applications 頁面
   - 顯示目前有哪些應用程式

2. **確認帳號狀態**
   - 是否有啟用 Zero Trust 試用版？
   - 是否有團隊成員設定了 Access？

3. **臨時方案：使用自訂網域**
   如果必須保留 Access，可以：
   - 為 Worker 設定自訂網域
   - 只對自訂網域套用 Access
   - `workers.dev` 保持公開

---

## ✅ 成功標準

執行測試命令後，應該看到：

```json
{
  "status": "ok",
  "timestamp": "2024-10-28T..."
}
```

**而不是** HTML 登入頁面！

---

## 🚨 如果實在無法關閉

### 替代方案：配置 Service Token

如果組織政策強制要求 Access：

1. 建立 Service Token
2. 在前端請求中加入 Token Header
3. 需要修改前端和 Worker 配置

這是最後手段，優先嘗試完全關閉 Access。

