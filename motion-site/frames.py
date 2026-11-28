import asyncio,sys
from playwright.async_api import async_playwright
async def go(ts):
  async with async_playwright() as pw:
    b=await pw.chromium.launch();pg=await b.new_page(viewport={'width':1080,'height':1350})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file:///home/claude/vsl/vsl.html');await pg.wait_for_timeout(800)
    for t in ts:
      await pg.evaluate(f'render({t})');await pg.screenshot(path=f'/home/claude/vsl/f_{t}.jpg',type='jpeg',quality=80)
    print(errs);await b.close()
asyncio.run(go([float(x) for x in sys.argv[1:]]))
