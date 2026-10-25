module.exports = async (p) => {
  await p.evaluate(() => window.__T.travel('escon'));
  await p.waitForTimeout(12000);
  const r = await p.evaluate(() => window.__T.things.filter(t=>{try{return window.__T.roomAt(t.x,t.z).venue==='escon'}catch(e){return false}}).map(t=>{let l='';try{l=t.label()}catch(e){}return [l,Math.round(t.x),Math.round(t.z),t.r]}).filter(a=>/應援|加油|棒|溫室|採收|番茄|三振|投手|挑戰/.test(a[0])));
  console.log(JSON.stringify(r));
};
