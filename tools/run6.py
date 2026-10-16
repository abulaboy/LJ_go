import asyncio,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+sys.argv[1]);await pg.wait_for_timeout(800)
    r=await pg.evaluate("""async()=>{const T=window.__T;let n=0;
      for(const t of T.things){if(t.x>-5&&t.x<20&&t.z>-2&&t.z<25){const l=t.label();if(l&&!/電梯|去「|1 樓|到四人|到海景/.test(l)){try{t.go();n++;}catch(e){return 'ERR '+l+' '+e;}await new Promise(r=>setTimeout(r,15));}}}
      await new Promise(r=>setTimeout(r,800));return n;}""")
    print('ERRORS:',errs[:10]);print(r)
    await b.close()
asyncio.run(main())
