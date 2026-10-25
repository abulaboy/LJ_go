# 第一次設定（Windows 電腦）

目標：在你的電腦用 Claude Code 開發「家裡走走」，由 Claude 當主管，派工給 Gemini（Gemini CLI，用 API 金鑰）寫程式，完成後推到 GitHub（abulaboy/LJ_go）。

> 下面的安裝指令是目前的官方做法，若有變動請以官方說明為準：
> Claude Code：https://docs.claude.com/en/docs/claude-code ／ Gemini CLI：https://github.com/google-gemini/gemini-cli

## 1. 安裝工具（只做一次）
1. 安裝 **Node.js LTS**（https://nodejs.org）與 **Git for Windows**（https://git-scm.com）。
2. 開「PowerShell」，輸入：
   ```
   npm install -g @anthropic-ai/claude-code
   npm install -g @google/gemini-cli
   ```
3. 確認：`node -v`、`git --version`、`claude --version`、`gemini --version` 都有出現版本號。

## 2. 把專案放到電腦（只做一次）
```
cd C:\AI
git clone https://github.com/abulaboy/LJ_go.git
```
把這個專案包解壓縮後的所有檔案（index.html、CLAUDE.md、SETUP.md、tasks、tools、.gitignore）複製進 `C:\AI\LJ_go`。
（如果你的網站原本用 study-room.html，請把 index.html 改成那個名字，並把 CLAUDE.md 和 tools 裡的 index.html 一起改掉，或直接請 Claude 幫你改。）

安裝測試工具：
```
cd C:\AI\LJ_go\tools
npm install
npx playwright install chromium
```

## 3. 設定 Gemini API 金鑰（只做一次）
到 https://aistudio.google.com/apikey 申請 API 金鑰，存成**使用者環境變數** `GEMINI_API_KEY`（PowerShell）：
```
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY","貼上你的金鑰","User")
```
關掉重開 PowerShell 後檢查：`node tools/gemini/dispatch.js check`，顯示「GEMINI_API_KEY：已設定」和 gemini 版本就完成了。
- 金鑰只放在環境變數，**不要寫進任何檔案、不要上傳 GitHub**。
- 只用這一組金鑰，不再輪流切換 Google 帳號。額度用完時 dispatch.js 會停下來（結束代碼 3），請等額度恢復或換付費金鑰。
- 免費金鑰每個模型每天只有約 20 次請求，派一個版本的工作通常不夠；建議到 Google AI Studio 開啟計費（付費層級）。
- 模型忙線（503）時 dispatch.js 會自動重試；也可以用環境變數 `GEMINI_MODEL` 指定模型（例如 `gemini-3.5-flash`）。

## 4. 開始開發
```
cd C:\AI\LJ_go
claude
```
第一次可以這樣說：
> 讀 CLAUDE.md，把 tasks/v80.md 派給 Gemini 做第 80 版，測試通過後提交並推到 GitHub。

## 5. 線上版（claude.ai Artifact）
Claude Code 不能直接發布到 Claude 的線上版（線上同房用的那個網址）。要更新時，把最新的 index.html 拿到 Claude（Cowork 或聊天）請它發布到原本的網址。
