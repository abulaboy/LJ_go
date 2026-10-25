# 給 Gemini 的工作說明（家裡走走）

你是這個專案的程式撰寫者。主管（Claude）會給你一個任務，請只在「目前這個資料夾」裡工作。

## 你會拿到的東西
- `task.md`：這次的任務（第幾版、要做什麼）。
- `index.html`：遊戲目前的完整程式（只能讀，不要修改）。可以用搜尋找你需要的函式或座標。

## 你要交出的東西
1. `block.js`：一整段可以直接貼在主程式最後面的區塊，格式：
   ```
   // ===== 第 XX 版：標題（Gemini 撰寫） =====
   (function(){ try{ ... }catch(e){} })();
   ```
2. `report.md`：用繁體中文寫你做了什麼、怎麼操作、自我測試結果、還有沒有疑慮。
3. 交出前自我檢查：`node --check block.js`；再寫一個 `sim.js`，用假的 THREE、scene、DOM、BK、BADGES、things 等實際執行一次（含主要互動流程），確認不丟錯。

## 程式規則
- 程式會被貼在主程式外層 IIFE 的最後面（在 `netStart();` 之前），所有主程式的 function/const 都可以直接呼叫，但一定要先 `typeof` 檢查並 try/catch 保護，不可讓整個遊戲當掉。
- 不可修改或重新定義其他版本的東西。
- 可用介面：`scene, camera, renderer, THREE`；`pos`／`A`（A.pos、A.heading、A.g、A.jh）；`things.push({x,z,r,label:()=>'文字',go(){}})`；`col(x0,x1,z0,z1)`（回傳 c，c.on=false 關閉、c.top=高度）；`colliders`；`sit({x,z,ry,h})`、`tpTo(x,z,heading)`、`say(字)`、`banner(大標,副標)`、`takePhoto()`、`flash()`；`notes(頻率陣列,波形,每音秒數)`、`noiseBurst(秒數,濾波Hz,音量,類型)`；`BK`＋`saveBK()`；`BADGES` 元素一定是 `[id,'名稱','emoji',function(){return false;}]`，`award(id)`；`ROOMS`、`roomAt(x,z)`（.venue）；`VEN`、`travel(dest)`；`VGRP.escon`、`window.__ESCON`（home {x:0,z:745}、bases 陣列 本壘/一壘(-19.4,764.4)/二壘(0,783.8)/三壘(19.4,764.4)、mound (0,763.4)、fieldY 0、screens.flashBanner）；`window.__MONS`、`__MOVES`、`__BATTLE`。
- 每格更新用串接：`var prev=window.__moreTick2; window.__moreTick2=function(dt,t){ if(prev) prev(dt,t); ... };`，dt 自己限制最大 0.1；遊戲計時用 dt 累加，不要用 setTimeout 排流程。
- 手機（`matchMedia('(hover:none)').matches || innerWidth<=560`）：右上角有 ☰（top:8 right:8，48x48），小地圖在它下面；計分卡放 top:142px right:8px。小遊戲面板放畫面中下方（bottom 約 160px），不要擋左下搖桿和右下「互動」鍵。
- 空白鍵只在小遊戲需要時攔截（capture 階段 preventDefault＋stopPropagation）。
- 大型模型要「玩家靠近才建立／顯示」，不要拖慢開場。
- 不可使用任何受版權保護的角色、商標、真實球隊隊徽或真實球員長相，一律原創。
- 畫面文字全部用繁體中文（台灣用語），小學一年級看得懂。
