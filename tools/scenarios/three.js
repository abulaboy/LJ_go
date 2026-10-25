module.exports = async (p, errs) => {
  const W = ms => p.waitForTimeout(ms);
  await p.evaluate(() => window.__T.travel('escon')); await W(12000);
  const tick = async n => { for (let i=0;i<n;i++){ await p.evaluate(()=>{ if(window.__moreTick2) window.__moreTick2(0.1, performance.now()/1000); }); } };
  const test = async (name, re, near) => {
    const e0 = errs.length;
    await p.evaluate(([x,z]) => window.__dbg.tp(x,z,0), near); await W(5000);
    const info = await p.evaluate((src) => {
      const re = new RegExp(src), T = window.__T;
      const t = T.things.find(t => { try { return re.test(t.label()); } catch(e){ return false; } });
      if (!t) return null;
      const room = (T.roomAt(t.x,t.z)||{});
      const hits = T.colliders.filter(c => c.on!==false && t.x>c.x0-0.3 && t.x<c.x1+0.3 && t.z>c.z0-0.3 && t.z<c.z1+0.3).length;
      return { label: t.label(), x: t.x, z: t.z, venue: room.venue, room: room.name||room.id, collidersOver: hits };
    }, re.source);
    console.log(name, JSON.stringify(info));
    if (!info) return;
    await p.evaluate(([x,z]) => window.__dbg.tp(x,z,0), [info.x, info.z+1.5]); await W(3000);
    await p.evaluate((src) => { const re=new RegExp(src); const t=window.__T.things.find(t=>{try{return re.test(t.label())}catch(e){return false}}); t.go(); }, re.source);
    await W(3000); await tick(30); await W(1500);
    await p.screenshot({ path: name + '-start.png' });
    const dom = await p.evaluate(() => [...document.querySelectorAll('div')].filter(d=>{const s=getComputedStyle(d);return s.position==='fixed'&&d.offsetParent!==null&&d.innerText&&d.innerText.length<200&&d.getBoundingClientRect().width>60}).slice(-4).map(d=>d.innerText.replace(/\s+/g,' ').slice(0,80)));
    console.log(name, 'DOM:', JSON.stringify(dom));
    await tick(40); await W(1000);
    await p.screenshot({ path: name + '-play.png' });
    console.log(name, 'new errors:', JSON.stringify(errs.slice(e0).filter(x=>!/Failed to load/.test(x))));
    await p.keyboard.press('Escape'); await W(500);
  };
  await test('applause', /站上應援團長台/, [-16, 756]);
  await test('strikeout', /投手丘三振挑戰/, [3, 767]);
  // 溫室：先走近讓它建立
  await p.evaluate(() => window.__dbg.tp(140, 925, 0)); await W(8000); await tick(10);
  const g = await p.evaluate(() => window.__T.things.filter(t=>{try{return /採收|溫室|農/.test(t.label())}catch(e){return false}}).map(t=>[t.label(),Math.round(t.x),Math.round(t.z)]));
  console.log('greenhouse things', JSON.stringify(g));
};
