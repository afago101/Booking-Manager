# LIFF 設定確認

## ✅ 您的 LIFF 設定

根據您提供的資訊：
- **LIFF ID**: `2008398150-kRq2E2Ro`
- **Size**: `Tall`
- **LIFF URL**: `https://liff.line.me/2008398150-kRq2E2Ro`

## 📝 需要設定的環境變數

在 Cloudflare Pages Dashboard 設定：
```
VITE_LINE_LIFF_ID = 2008398150-kRq2E2Ro
```

## ⚠️ 注意事項

1. **Size 設定為 "Tall"**
   - 您的 LIFF App Size 是 "Tall"（不是 "Full"）
   - 這不影響功能，只是顯示高度不同
   - "Tall" 適合簡單的表單和資訊顯示
   - 如果需要全螢幕體驗，可以考慮改為 "Full"

2. **程式碼已準備好**
   - 程式碼已經正確處理 LIFF 初始化
   - 會自動使用 `VITE_LINE_LIFF_ID` 環境變數
   - 不需要修改程式碼

3. **設定環境變數後必須重新部署**
   - 環境變數不會即時生效
   - 需要重新建置和部署前端

