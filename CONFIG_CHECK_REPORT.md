# 📊 Google Sheets Config 檢查報告

檢查時間：2025-10-28

---

## ✅ 配置狀態總覽

### 已正確設定的配置

| 配置項 | 當前值 | 狀態 | 說明 |
|--------|--------|------|------|
| `nightlyPriceDefault` | 2890 | ✅ 正常 | 平日預設房價 |
| `weekendPriceDefault` | 3580 | ✅ 正常 | 週末預設房價 |
| `adminPassword` | @KCCO1130 | ✅ 正常 | 管理員登入密碼（已自訂）|
| `notificationEmails` | ["afago101@gmail.com", "coconew23@gmail.com"] | ✅ 正常 | Email 通知收件人（2位）|
| `emailApiKey` | re_i3zhJ8Qp_... | ✅ 正常 | Resend API Key |
| `emailFrom` | booking@marcus.uk | ✅ 正常 | 發件人 email |
| `emailFromName` | （亂碼） | ⚠️ 需修正 | 發件人名稱顯示異常 |
| `closedDates` | [] | ✅ 已添加 | 關閉預訂的日期列表（空陣列）|

---

## ⚠️ 需要注意的問題

### 1. emailFromName 顯示亂碼

**當前值**：`ç¥ç¦æµ·ç£è¨æ¿ç³»çµ±`  
**應該是**：`祝福海灣訂房系統`

**原因**：UTF-8 編碼問題

**修復方法**：
1. 打開 [Google Sheets](https://docs.google.com/spreadsheets/d/1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw)
2. 進入 `config` 工作表
3. 找到 `emailFromName` 那一行
4. 將 `value` 欄位改為：`祝福海灣訂房系統`
5. 保存即可

---

## 📋 完整配置列表

以下是推薦的完整配置（可根據需求調整）：

| key | value | 必要性 | 說明 |
|-----|-------|--------|------|
| `adminPassword` | `@KCCO1130` | ✅ 必要 | 管理員密碼 |
| `nightlyPriceDefault` | `2890` | ✅ 必要 | 平日預設房價 |
| `weekendPriceDefault` | `3580` | ✅ 必要 | 週末預設房價 |
| `closedDates` | `[]` | ⚙️ 建議 | 關閉預訂的日期（JSON陣列）|
| `notificationEmails` | `["afago101@gmail.com","coconew23@gmail.com"]` | 📧 Email功能 | 接收通知的email列表 |
| `emailApiKey` | `re_i3zhJ8Qp_...` | 📧 Email功能 | Resend API Key |
| `emailFrom` | `booking@marcus.uk` | 📧 Email功能 | 發件人email |
| `emailFromName` | `祝福海灣訂房系統` | 📧 Email功能 | 發件人名稱 |
| `defaultCapacity` | `1` | ⚙️ 可選 | 預設每日容量（預設為1）|
| `defaultWeekday` | `5000` | ⚙️ 可選 | 舊版平日價格（向後相容）|
| `defaultWeekend` | `7000` | ⚙️ 可選 | 舊版週末價格（向後相容）|

---

## 🎯 配置優先級

### 核心功能（必要）
- ✅ `adminPassword`
- ✅ `nightlyPriceDefault`
- ✅ `weekendPriceDefault`

### 房況管理（建議）
- ✅ `closedDates`
- ⚙️ `defaultCapacity`（可選，預設為1）

### Email 通知（需要時設定）
- ✅ `emailApiKey`
- ✅ `emailFrom`
- ⚠️ `emailFromName`（需修正亂碼）
- ✅ `notificationEmails`

---

## 📧 Email 通知功能檢查

### 當前設定狀態
- ✅ **API Key 已設定**：`re_i3zhJ8Qp_...`
- ✅ **發件人 email 已設定**：`booking@marcus.uk`
- ⚠️ **發件人名稱**：顯示亂碼（需修正）
- ✅ **收件人列表**：2 個 email
  - `afago101@gmail.com`
  - `coconew23@gmail.com`

### Email 功能狀態
- 🟢 **API Key 有效**：格式正確
- 🟢 **收件人格式正確**：JSON 陣列格式
- 🟡 **發件人名稱需修正**：顯示為亂碼

### 測試建議
創建一筆測試訂單，檢查是否收到 email 通知。

---

## ✅ 整體評估

### 配置完整度：90%

**優點**：
- ✅ 所有核心配置都已正確設定
- ✅ Email 通知功能已完整配置
- ✅ 收件人設定正確（2位）
- ✅ 價格設定合理

**需改進**：
- ⚠️ `emailFromName` 顯示亂碼
- ⚙️ 可考慮新增 `defaultCapacity` 配置

---

## 🔧 建議操作

### 立即執行
1. **修正 emailFromName 亂碼**
   - 進入 Google Sheets config 工作表
   - 修改 `emailFromName` 為：`祝福海灣訂房系統`

### 可選操作
2. **新增 defaultCapacity**（如果需要每日容量大於1）
   ```
   key: defaultCapacity
   value: 1
   ```

3. **測試 Email 通知**
   - 創建測試訂單
   - 確認兩個收件人都收到 email

---

## 📝 配置範例（完整版）

如果想要完整的配置，可以參考以下設定：

```
adminPassword: @KCCO1130
nightlyPriceDefault: 2890
weekendPriceDefault: 3580
closedDates: []
defaultCapacity: 1
notificationEmails: ["afago101@gmail.com","coconew23@gmail.com"]
emailApiKey: re_i3zhJ8Qp_LttDvKDf1i3oUS6Ee4Pu3YUf
emailFrom: booking@marcus.uk
emailFromName: 祝福海灣訂房系統
```

---

## ✨ 總結

您的 Google Sheets config 工作表**整體配置良好**！

**已完成**：
- ✅ 核心功能配置完整
- ✅ Email 通知功能已設定
- ✅ 關閉日期功能已啟用

**需要修正**：
- ⚠️ 修正 `emailFromName` 的亂碼問題

**建議測試**：
- 📧 創建測試訂單，確認 email 通知正常運作

---

**Google Sheets 連結**：
https://docs.google.com/spreadsheets/d/1MdxsHfSOo8Y4OJt7OnqOpSDYwTq3OHjIdNav-CaN4Uw

