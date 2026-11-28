import asyncio,sys,os
sys.argv=[sys.argv[0]]+sys.argv[1:]
exec(open('/tmp/site/t.py').read().split('async def main')[0])
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch()
        for n in sys.argv[1:]:
            for W,H in [(1440,900),(390,844)]:
                pg=await b.new_page(viewport={'width':W,'height':H})
                errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
                await pg.route('**/*',route)
                await pg.goto('file:///tmp/site/out/'+n+'.html');await pg.wait_for_timeout(3500)
                await pg.screenshot(path=f'/tmp/site/sc/top_{n}_{W}.png')
                print(n,W,errs[:2],await pg.evaluate('document.documentElement.scrollWidth'))
                await pg.close()
        await b.close()
asyncio.run(main())
