// 範例情境：到北海道棒球場、截圖、列出附近互動點
module.exports = async (p) => {
  const W = ms => p.waitForTimeout(ms);
  await p.evaluate(() => window.__T.travel('escon'));
  await W(12000); // 軟體繪圖很慢，傳送要等久一點
  const list = await p.evaluate(() => window.__T.things
    .filter(t => { try { return Math.abs(t.z - 760) < 80 && Math.abs(t.x) < 80; } catch (e) { return false; } })
    .map(t => { try { return t.label(); } catch (e) { return '?'; } }).slice(0, 20));
  console.log('附近互動點：', list);
  await p.screenshot({ path: 'smoke.png' });
};
