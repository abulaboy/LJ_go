// 用法：node run.js ../index.html scenarios/smoke.js [寬 高]
// 會用 Playwright 開頁面（?dbg=1），把 three.min.js 從 node_modules 提供給頁面，執行情境檔，最後列出錯誤。
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [, , pageFile, scen, w, h] = process.argv;
  let html = fs.readFileSync(pageFile, 'utf8');
  // 測試用掛鉤（只在測試時插入，不會寫回檔案）
  html = html.replace("netStart();\nrequestAnimationFrame(frame);",
    "window.__T={scene,things,colliders,BK,A,pos,VEN:typeof VEN!=='undefined'?VEN:null,travel:typeof travel!=='undefined'?travel:null,ROOMS,roomAt};\nnetStart();\nrequestAnimationFrame(frame);");
  const three = fs.readFileSync(require('path').join(__dirname,'node_modules','three','build','three.min.js'));
  const W = +w || 1100, H = +h || 700, mob = W < 600;
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: mob, isMobile: mob });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CE ' + m.text().slice(0, 200)); });
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('three.min.js')) return r.fulfill({ body: three, contentType: 'application/javascript' });
    if (u.startsWith('http://t.local/')) return r.fulfill({ body: html, contentType: 'text/html; charset=utf-8' });
    return r.abort();
  });
  await p.goto('http://t.local/x.html?dbg=1', { timeout: 150000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.__T && window.__dbg, null, { timeout: 150000 });
  await require(path.resolve(scen))(p, errs);
  console.log('ERRORS:', JSON.stringify(errs.slice(0, 15)));
  await b.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
