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
- **Claude 是主管**：拆任務、寫任務單、派工給 Gemini、整合、實機測試、提交 GitHub。
- **功能程式一律由 Gemini 撰寫**，Claude 不自己寫功能程式；有錯誤時把測試結果寫成修正單交回 Gemini 修。
- Claude 只可以做整合用的最小改動（插入區塊、測試用情境檔），並在回報中說明。
- 為了節省 Claude 的用量：不要整份讀 `index.html`，用 grep／指定行數讀需要的部分；自我測試盡量交給 Gemini（它會跑 sim.js），Claude 只做必要的實機測試。

## 派工流程（Gemini CLI）
1. 寫任務單：`tasks/vXX.md`（繁體中文，條列要做的事；能查到的座標、選擇器、錯誤原因都寫進去）。
2. 派工：`node tools/gemini/dispatch.js run vXX tasks/vXX.md`
   - 用環境變數 `GEMINI_API_KEY`（只有一組，不可寫進任何檔案或顯示出來），不再切換 Google 帳號。
   - 可用 `GEMINI_MODEL` 指定模型；模型忙線（503）會自動重試，結束代碼 4 = 重試後仍忙線。
   - 結束代碼 3 = 額度用完 → 停止，告訴使用者，不要自己改寫程式。
3. 看結果：`tools/gemini/work/vXX/block.js`、`report.md`；`node tools/gemini/dispatch.js status` 看全部、`check` 檢查金鑰是否設定。
4. 先試整合：`node tools/integrate.js tools/gemini/work/vXX/block.js --dry`，再實機測試（見下方「測試」），測試時用暫存副本，不要直接改 index.html。
5. 有問題：寫 `tasks/vXX-fix.md`（測試結果、錯誤訊息、截圖觀察），執行 `node tools/gemini/dispatch.js fix vXX tasks/vXX-fix.md`。
6. 通過：`node tools/integrate.js tools/gemini/work/vXX/block.js`，提交「第 XX 版：標題」並推到 GitHub。
- 如果 `gemini` 指令不存在或 `GEMINI_API_KEY` 沒設定，停下來請使用者照 SETUP.md 設定，不要改成自己寫程式。

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
