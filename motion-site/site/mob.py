import asyncio
from playwright.async_api import async_playwright
async def m():
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page(viewport={'width':390,'height':844})
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.route('**/*',lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
        await pg.goto('file://'+__import__('sys').argv[1]+'');await pg.wait_for_timeout(1500)
        print('errs',errs,'sw',await pg.evaluate('document.documentElement.scrollWidth'))
        await b.close()
asyncio.run(m())
