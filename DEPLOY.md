# 財報分析工具 — 部署指南

## 第一步：申請 Claude API Key

1. 打開瀏覽器，前往 https://console.anthropic.com/
2. 點「Sign Up」註冊帳號（用 Email 或 Google 登入）
3. 登入後，點左側「API Keys」→「Create Key」
4. 幫 Key 取個名字（例如：財報分析），按「Create Key」
5. **複製 Key（只顯示一次！格式像 `sk-ant-api03-...`）**

---

## 第二步：在本機測試（確認可以跑起來）

打開「命令提示字元」（Windows 鍵 → 搜尋 cmd）或 PowerShell：

```bash
# 進到專案資料夾
cd C:\Users\User\financial-analyzer

# 啟動開發伺服器
npm run dev
```

看到 `Local: http://localhost:3000` 後，打開瀏覽器輸入 http://localhost:3000

測試方法：
- 從公開資訊觀測站下載一份財報 PDF（例如台積電 2330 年報）
- 網址：https://mops.twse.com.tw → 財務報告 → 年報
- 上傳 PDF，輸入剛才的 API Key，按「開始分析」

---

## 第三步：部署到 Vercel（讓別人也能用）

### 準備 GitHub

1. 安裝 Git（如果還沒有）：https://git-scm.com/download/win
2. 在 https://github.com 申請帳號
3. 建立一個新的 Repository（叫 `financial-analyzer`，設成 Private 或 Public）
4. 在命令提示字元執行：

```bash
cd C:\Users\User\financial-analyzer

git init
git add .
git commit -m "初始版本"
git branch -M main
git remote add origin https://github.com/你的帳號名稱/financial-analyzer.git
git push -u origin main
```

（第一次 push 時可能需要在瀏覽器完成 GitHub 驗證）

### 部署到 Vercel

1. 前往 https://vercel.com，用 GitHub 帳號登入
2. 點「New Project」→ 選你剛上傳的 `financial-analyzer` 專案
3. 設定保持預設，直接點「Deploy」
4. 等 2–3 分鐘部署完成

部署成功後，Vercel 會給你一個網址（例如 `your-project.vercel.app`）

### 注意事項

**Vercel Hobby（免費）方案限制：**
- 每個 API 請求最長執行 60 秒
- 分析簡單的季報通常沒問題；複雜的完整年報可能偶爾超時

**如果常超時（分析失敗），有兩個解法：**
- 方案 A：升級 Vercel Pro（$20/月），執行時間延長到 300 秒
- 方案 B：上傳較小的財報（例如只含財務報表的精簡版，非完整年報）

---

## 費用說明

- **Vercel 費用：** 免費方案就夠個人使用（有流量限制）
- **Claude API 費用：** 由使用者自行負擔，分析一份財報約 $0.05–0.20 USD
  - 新帳號通常有免費額度
  - 付費方式：在 console.anthropic.com 加入信用卡

---

## 常見問題

**Q：上傳後一直轉圈不動？**
A：正常，AI 分析需要 30–60 秒。若超過 2 分鐘才報錯，可能是 Vercel 超時，請嘗試較小的 PDF。

**Q：出現「API Key 無效」？**
A：確認 Key 開頭是 `sk-ant-`，且帳號有有效餘額（新帳號可能需要加入信用卡）。

**Q：出現「JSON 解析失敗」？**
A：財報格式太複雜或圖片過多，AI 無法正確解析。可嘗試下載只含財務報表的版本。

**Q：想讓使用者不用輸入 API Key？**
A：在 Vercel 設定環境變數 `ANTHROPIC_API_KEY`，然後修改 `src/app/api/analyze/route.ts` 中的 `apiKey` 改為從 `process.env.ANTHROPIC_API_KEY` 讀取。這樣所有費用由你支付。
