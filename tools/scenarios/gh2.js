module.exports = async (p) => {
  const W = ms => p.waitForTimeout(ms);
  await p.evaluate(() => window.__T.travel('escon')); await W(12000);
  await p.evaluate(() => window.__dbg.tp(100, 945, 0)); await W(8000);
  console.log(JSON.stringify(await p.evaluate(()=>window.__T.things.filter(t=>{try{return /採收|拖拉機|番茄|農/.test(t.label())}catch(e){}}).map(t=>[t.label(),Math.round(t.x),Math.round(t.z)]))));
  await p.evaluate(() => window.__dbg.cam(0, 1.2, 70)); await W(3000);
  await p.screenshot({ path: 'gh-over.png' });
  await p.evaluate(() => window.__dbg.cam(0, 1.2, 160)); await W(3000);
  await p.screenshot({ path: 'gh-over2.png' });
};
