# LIFF 快速設定指南（5 分鐘）

## 🚀 快速步驟

### 1️⃣ 建立 LIFF App（2 分鐘）

1. 前往：https://developers.line.biz/
2. 選擇 Channel ID：`2008398150`
3. 點擊左側「**LIFF**」
4. 點擊「**Add**」
5. 填入：

```
App name: Booking Manager
Size: Full
Endpoint URL: https://blessing-haven.marcux.uk
Scope: 
  ✅ profile
  ✅ openid
```

6. 點擊「**Add**」
7. **複製 LIFF ID**（格式：`2008398150-xxxxxxx`）

---

### 2️⃣ 設定環境變數（1 分鐘）

1. 前往：https://dash.cloudflare.com
2. 選擇「Pages」→「booking-manager」
3. 「Settings」→「Environment variables」
4. 點擊「**Add variable**」
5. 填入：

```
Name: VITE_LINE_LIFF_ID
Value: [剛才複製的 LIFF ID]
Environment: Production
```

6. 點擊「**Save**」

---

### 3️⃣ 重新部署（1 分鐘）

1. 在 Cloudflare Pages Dashboard
2. 前往「**Deployments**」標籤
3. 點擊最新部署的「**...**」→「**Retry deployment**」

或使用命令列：
```powershell
cd "D:\File\Cursor\Developing\Booking Manager\V2"
npm run build
npx wrangler pages deploy dist --project-name=booking-manager
```

---

### 4️⃣ 測試（1 分鐘）

1. 從 LINE App 開啟：`https://blessing-haven.marcux.uk/#/booking`
2. 應該會自動顯示 LINE 使用者資訊
3. 如果沒有，按 F12 查看 Console 錯誤

---

## ✅ 檢查清單

- [ ] LIFF App 已建立
- [ ] Endpoint URL 正確：`https://blessing-haven.marcux.uk`
- [ ] Size 設定為 `Full`
- [ ] Scope 包含 `profile` 和 `openid`
- [ ] 已複製 LIFF ID
- [ ] 環境變數已設定：`VITE_LINE_LIFF_ID`
- [ ] 前端已重新部署
- [ ] 測試成功

---

## ⚠️ 重要提醒

1. **Endpoint URL 不要包含 path 或 hash**
   - ✅ 正確：`https://blessing-haven.marcux.uk`
   - ❌ 錯誤：`https://blessing-haven.marcux.uk/booking`
   - ❌ 錯誤：`https://blessing-haven.marcux.uk/#/booking`

2. **必須使用 HTTPS**
   - ✅ 正確：`https://...`
   - ❌ 錯誤：`http://...`

3. **設定環境變數後必須重新部署**
   - 環境變數不會即時生效
   - 需要重新建置和部署

---

**完成！** 🎉

