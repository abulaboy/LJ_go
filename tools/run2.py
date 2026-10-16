import asyncio,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--allow-file-access-from-files'])
    pg=await b.new_page()
    errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' else None)
    await pg.goto('file://'+sys.argv[1])
    await pg.wait_for_timeout(1500)
    await pg.keyboard.down('w');await pg.wait_for_timeout(600);await pg.keyboard.up('w')
    for k in "rrrrrnn": await pg.keyboard.press(k); await pg.wait_for_timeout(200)
    await pg.wait_for_timeout(500)
    print('ERRORS:',errs[:10])
    print(await pg.evaluate("document.getElementById('room').textContent+' | '+document.getElementById('toast').textContent"))
    await b.close()
asyncio.run(main())
