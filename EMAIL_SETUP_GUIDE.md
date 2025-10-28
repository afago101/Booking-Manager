# 📧 Email 通知設定指南

## 🎯 功能說明

當有新訂單時，系統會自動發送 email 通知到指定的收件人信箱。

---

## 📋 設定步驟

### 1️⃣ 註冊 Resend（免費email服務）

1. 前往 [Resend官網](https://resend.com)
2. 點擊「Sign Up」註冊帳號
3. 驗證您的email地址

**免費額度**：每月 3,000 封email（足夠使用）

---

### 2️⃣ 取得 API Key

1. 登入 Resend Dashboard
2. 點擊左側選單 **「API Keys」**
3. 點擊 **「Create API Key」**
4. 名稱輸入：`Booking System`
5. Permission 選擇：**「Sending access」**
6. 點擊 **「Add」**
7. **複製顯示的 API Key**（只會顯示一次！）
   - 格式類似：`re_123456789abcdefghijk`

---

### 3️⃣ 驗證發信域名（重要！）

**選項 A：使用 Resend 提供的測試域名**（最簡單）
- Resend 提供 `onboarding@resend.dev` 作為測試
- 但只能發送到您自己註冊的email
- 適合測試用

**選項 B：使用您自己的域名**（推薦用於正式環境）
1. 在 Resend Dashboard 點擊 **「Domains」**
2. 點擊 **「Add Domain」**
3. 輸入您的域名（例如：`marcus.uk`）
4. 按照指示在您的域名DNS設定中添加以下記錄：

```
類型: TXT
主機名: _resend
值: resend-verify=xxx（Resend 會提供）

類型: MX
主機名: @
值: feedback-smtp.resend.com
優先級: 10
```

5. 等待驗證完成（通常幾分鐘內）

---

### 4️⃣ 在 Google Sheets 設定

打開您的訂房系統 Google Sheets：
https://docs.google.com/spreadsheets/d/1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw

進入 **`config`** 工作表，設定以下欄位：

| key | value | 說明 |
|-----|-------|------|
| `emailApiKey` | `re_123456789abcdefghijk` | 您從 Resend 取得的 API Key |
| `emailFrom` | `booking@marcus.uk` | 發件人email（使用您驗證的域名）|
| `emailFromName` | `祝福海灣訂房系統` | 發件人名稱 |
| `notificationEmails` | `["your@email.com","another@email.com"]` | 接收通知的email列表（JSON陣列格式）|

**範例設定**：

```
emailApiKey: re_abcd1234efgh5678ijkl
emailFrom: booking@marcus.uk
emailFromName: 祝福海灣訂房系統
notificationEmails: ["owner@example.com","manager@example.com"]
```

**注意**：
- `notificationEmails` 必須是 JSON 陣列格式
- 可以設定多個收件人
- 每個email要用雙引號包圍，用逗號分隔

---

### 5️⃣ 測試 Email 通知

1. 打開前台：https://07c85f63.booking-manager-pil.pages.dev
2. 創建一筆測試訂單
3. 檢查您設定的收件信箱
4. 應該會收到類似這樣的email：

```
🎉 新訂單通知

訂單資訊：
訂單編號：booking_xxx
客人姓名：測試客人
聯絡電話：0912345678
LINE ID：testline
入住日期：2025-11-10
退房日期：2025-11-11
入住人數：2 人
總金額：NT$ 2,890
```

---

## 🔍 常見問題

### Q1: 沒有收到email怎麼辦？

**檢查清單**：
1. ✅ 確認 Google Sheets 的 `emailApiKey` 已正確填寫
2. ✅ 確認 `notificationEmails` 格式正確（JSON陣列）
3. ✅ 檢查垃圾郵件資料夾
4. ✅ 確認 Resend Dashboard 中域名已驗證
5. ✅ 查看 Resend Dashboard 的 **「Logs」** 頁面確認發送狀態

### Q2: 如何修改email樣式？

Email 樣式在 `worker/src/utils/email.ts` 文件中定義。
您可以修改 `generateBookingEmailHtml()` 函數來自訂樣式。

### Q3: 可以發送給客人嗎？

目前系統只發送給管理員。
如要發送給客人，需要在 `handleCreateBooking` 中添加額外的邏輯。

### Q4: Resend 有使用限制嗎？

**免費方案限制**：
- 每月 3,000 封email
- 每日 100 封email
- 只能從已驗證的域名發送

**付費方案**：
- Pro: $20/月，50,000 封email
- 支援更多功能和更高發送量

### Q5: 可以用其他email服務嗎？

可以！系統使用標準的 REST API。
您可以修改 `worker/src/utils/email.ts` 來支援其他服務：
- SendGrid
- Mailgun  
- AWS SES
- Postmark

只需要修改 API endpoint 和認證方式即可。

---

## 📊 Email 發送日誌

在 Resend Dashboard 的 **「Logs」** 頁面可以看到：
- 發送時間
- 收件人
- 狀態（成功/失敗）
- 錯誤訊息（如果有）

---

## ✨ Email 內容預覽

您的客戶會收到這樣的email：

**主旨**：🎉 新訂單通知 - 張三

**內容**：
- 精美的HTML排版
- 包含所有訂單資訊
- 醒目的價格顯示
- 專業的品牌形象

---

## 🎯 下一步

1. **立即設定**：
   - 註冊 Resend
   - 取得 API Key
   - 在 Google Sheets 設定

2. **測試**：
   - 創建測試訂單
   - 確認收到email

3. **正式使用**：
   - 驗證您的域名
   - 修改發件人信箱
   - 享受自動通知！

---

**需要協助？** 檢查 Resend 文檔：https://resend.com/docs

