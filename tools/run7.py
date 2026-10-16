import asyncio,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+sys.argv[1]);await pg.wait_for_timeout(800)
    r=await pg.evaluate("""async()=>{const T=window.__T;T.OC.forEach(c=>c.open=true);await new Promise(r=>setTimeout(r,1500));
      const a=T.OC.map(c=>c.name+':'+c.t.toFixed(2)+':'+c.parts.map(p=>p.t==='h'?(p.g.rotation.y-p.b).toFixed(2):(p.g.position.z-p.bz).toFixed(2)).join(','));
      return a.join(' | ');}""")
    print('ERRORS:',errs[:10]);print(r)
    await b.close()
asyncio.run(main())
