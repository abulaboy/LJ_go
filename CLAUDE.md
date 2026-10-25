# 家裡走走（專案說明給 Claude Code）

請全程使用繁體中文（台灣用語）回覆。

## 這是什麼
「家裡走走」是用 Three.js r149（全域 `THREE`，從 CDN 載入）做的單一 HTML 網頁遊戲。
玩家操作家人角色，在台中的家和其他場景（北海道棒球場、怪獸樂園、海景客房、方塊島等）走動、互動。
目前主要開發的場景是**北海道棒球場**（以 ES CON FIELD HOKKAIDO 為藍本）。

## 檔案
- `index.html`：整個遊戲（約 4.3 萬行，2.8 MB），所有程式都在這一個檔案裡。
- `tools/`：自動測試工具（Playwright）、`tools/integrate.js`（插入區塊）、`tools/gemini/`（派工給 Gemini）。
- `tasks/`：給 Gemini 的任務單。
- `SETUP.md`：使用者在電腦上的第一次設定步驟。
- 線上版（claude.ai Artifact）：https://claude.ai/artifact/1cdN75GmP7uxTT7rEbCAvu
  - 線上同房（room）與使用者名稱（user）功能只在 Artifact 版有效；GitHub 自架版沒有。
  - Claude Code 無法直接發布到 Artifact。要更新線上版，請把改好的 `index.html` 交給 Claude（Cowork／聊天）發布，或由使用者自行處理。

## 程式結構（很重要）
- 主程式在一個外層 IIFE 裡：`<script>(function(){ ... netStart();\nrequestAnimationFrame(frame);\n})();</script>`
- 新功能一律寫成**一整段獨立區塊**，插在檔尾這一行之前：
  ```
  netStart();
  requestAnimationFrame(frame);
  })();
  </script>
  ```
- 每段開頭註解格式：`// ===== 第 XX 版：標題（作者） =====`。用 `grep -n "// ===== 第 " index.html` 可以看到所有版本；目前最新是第 81 版（第 75～81 版是 2026-10-25 加的，已接在遠端第 73、74 版之後）。
- 每段用 `(function(){ try{ ... }catch(e){} })();` 包起來，呼叫既有函式前先用 `typeof` 檢查，不可讓整個遊戲當掉。
- 不要改到別的版本的區塊；需要修正舊版時，優先用新區塊覆蓋行為，真的要改舊區塊要在回報裡說明。


## 工作分工（一定要遵守）
- **功能程式一律由每晚排程的「瀏覽器版 Gemini」撰寫**。Claude 不寫功能程式，也不自己派工（API 金鑰派工目前停用）。
- **Claude 只負責**：提交、推送、合併、測試。
  - 合併：把 Gemini 交出的區塊（`block.js`）接進 `index.html`，遇到版本編號撞號時，本機的改成接在遠端最新版之後。
  - 測試：跑 smoke 與實機測試（電腦版、手機版、截圖看位置有沒有和既有結構重疊），把結果回報給使用者。
  - 提交與推送：訊息寫「第 XX 版：標題」。推到 GitHub 前要先測過；有問題先停下來告訴使用者。
- 測試有問題時，把測試結果、錯誤訊息、截圖觀察寫成修正單（`tasks/vXX-fix.md`），交給使用者帶回 Gemini 修；Claude 不自己改功能程式。
- Claude 只可以做整合用的最小改動（插入區塊、改版本編號、測試用情境檔），並在回報中說明。
- 任務單（`tasks/vXX.md`）由使用者或 Gemini 準備；Claude 只在使用者要求時協助整理。
- 為了節省 Claude 的用量：不要整份讀 `index.html`，用 grep／指定行數讀需要的部分。

## 整合流程（Gemini 交件之後）
1. 把 Gemini 交出的 `block.js`（以及 `report.md`）放到 `tools/gemini/work/vXX/`。
2. 先試整合：`node tools/integrate.js tools/gemini/work/vXX/block.js --dry`；實機測試用暫存副本，不要直接改 index.html（見下方「測試」）。
3. 通過：`node tools/integrate.js tools/gemini/work/vXX/block.js`，提交「第 XX 版：標題」並推到 GitHub。
4. 沒通過：寫修正單，停下來告訴使用者。
- `tools/gemini/dispatch.js`（API 金鑰派工）保留但停用；使用者明說要用時才用，用法見 SETUP.md。

## 「提交並推送昨晚的版本」（每晚排程直接寫進 index.html）
每晚排程的 Gemini 會把測好的新版**直接寫進 `index.html`**（不是交 block.js）。使用者說「提交並推送昨晚的版本」時，依序做：
1. `git diff HEAD -- index.html` 列出新增了哪幾版（看新增行裡的「// ===== 第 XX 版」標頭），告訴使用者版號與標題。
2. 確認只在檔尾（`netStart();` 之前）新增區塊、沒有改到舊版：diff 只能有新增行，且都在最後一個 hunk；如果有刪除行或改到舊區塊，視為異常。
3. 跑 smoke 測試（電腦版與手機版，見下方「測試」），錯誤只能是既有的 `Failed to load resource`。
4. 用「第 XX～YY 版：各版標題」提交（只有一版就寫「第 XX 版：標題」），然後推送到 GitHub。
- 任何一步有異常（改到舊版、版號撞號、smoke 有新錯誤等），**停下來告訴使用者**，不要自己修、不要提交。


## 可以使用的全域介面（在 IIFE 內可直接呼叫）
- `scene, camera, renderer, THREE`；`pos`（玩家位置 {x,z}，就是 `A.pos`）；`A`（玩家：`A.pos`、`A.heading`、`A.g` 群組、`A.jh` 跳躍高度）
- `things`：互動點陣列，`push({x,z,r,label:()=>'文字',go(){...}})`，玩家靠近按 E／互動鍵觸發
- `col(x0,x1,z0,z1)` 建立碰撞方塊（回傳 c；`c.on=false` 關閉；`c.top=高度` 可站上）；`colliders` 全部碰撞
- `sit({x,z,ry,h})`、`tpTo(x,z,heading)`、`say('字幕')`、`banner('大標','副標')`、`takePhoto()`、`flash()`
- `notes(頻率陣列, 波形, 每音秒數)`、`noiseBurst(秒數, 濾波Hz, 音量0~1, 濾波類型)`
- `BK` 存檔物件＋`saveBK()`；`BADGES` 徽章陣列，元素一定是 `[id,'名稱','emoji',function(){return false;}]`；`award(id)`
- `ROOMS`（`{id,name,venue,rects,m}`）、`roomAt(x,z)`；`VEN` 場地表、`travel(dest)`、`goHome()`
- 北海道棒球場：`VGRP.escon`、`VLG.escon`、`window.__ESCON`（`OX:0, OZ:800, fieldY:0, home:{x:0,z:745}`；`bases` 是陣列：本壘、一壘(-19.4,764.4)、二壘(0,783.8)、三壘(19.4,764.4)；`mound:(0,763.4)`；`roof`、`screens.flashBanner(...)`）。球場範圍 x:-170～170、z:630～970。
- 怪獸：`window.__MONS`、`window.__MOVES`、`window.__BATTLE`
- 每格更新用串接：`var prev=window.__moreTick2; window.__moreTick2=function(dt,t){ if(prev) prev(dt,t); ... };`（dt 請自己限制最大 0.1）
- 手機判斷：`matchMedia('(hover:none)').matches || innerWidth<=560`
- 測試網址加 `?dbg=1` 會有 `window.__dbg`（`tp(x,z,h)`、`cam(yaw,pitch,dist)`、`day(bool)`、`act()`、`pos()`）

## 版面規則
- 手機（375x812）右上角有 48x48 的 ☰ 按鈕（top:8px right:8px），小地圖在它下面（約 top:62px）。手機版計分卡請放 `top:142px; right:8px`。
- 電腦版小地圖在右上角；第 81 版會自動把黃色邊框（#ffd166）的計分卡移到小地圖下方。
- 左下是搖桿、右下是「互動」與「換人」按鈕，小遊戲面板請放畫面中下方（bottom 約 160～170px），不要擋住它們。
- 空白鍵只在小遊戲需要時才攔截（capture 階段 `preventDefault`＋`stopPropagation`），其他時間不能攔截（會讓角色不能跳）。

## 測試
```
cd tools
npm install            # 安裝 playwright 與 three@0.149.0
npx playwright install chromium
node run.js ../index.html scenarios/smoke.js            # 電腦版
node run.js ../index.html scenarios/smoke.js 375 812    # 手機版
```
- 軟體繪圖大約每秒 1 格。用 `travel('escon')` 傳送後要等約 12 秒，再用 `__dbg.tp` 移動。
- 依賴 dt 計時的功能，可以在情境裡直接呼叫 `window.__moreTick2(0.1, t)` 加速。
- 小遊戲是否正常：用 `things` 找 label、`go()` 開始，再檢查畫面 DOM 和 `BK` 存檔值，並截圖看外觀（電腦和手機都要看）。

## 必須遵守
- 不可使用任何受版權保護的角色、商標、隊徽、吉祥物或真實球員長相（寶可夢、卡通人物、Minecraft 素材、真實球隊等），一律原創；真實設施與店名可以參考。
- 所有畫面文字用繁體中文（台灣用語），小學一年級看得懂。
- 大場景要「靠近才建立／才顯示」，不要拖慢開場讀取速度。
- 每次提交訊息寫「第 XX 版：標題」。

## 待辦（2026-10-25 時）
- 第 82 版「⚾ 球場玩什麼？」活動總覽面板（任務單在 tasks/v80.md，檔名沿用；尚未派工，等 Gemini 額度）
- 第 80 版三振挑戰的計分卡在電腦版仍會蓋住小地圖
- 方塊島擴充（樓梯、半磚、門、作品拍照；要改寫第 70 版區塊，`BK.blocks` 存檔要相容）
- 球場本體精緻化（替換第 47 版，保持 `__ESCON` 介面與座標）
- 線上同房一起看比賽、一起打球
