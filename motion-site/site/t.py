import asyncio,sys,os,re
from playwright.async_api import async_playwright
NM='/tmp/gs/node_modules/'
def local(url):
    if 'cdn.jsdelivr.net/npm/gsap' in url: return NM+'gsap/dist/'+url.rsplit('/',1)[1]
    if 'cdn.jsdelivr.net/npm/lenis' in url: return NM+'lenis/dist/'+url.rsplit('/',1)[1]
    m=re.search(r'raw\.githubusercontent\.com/genasbury12/blb-site/[0-9a-f]+/(.+)$',url)
    if m: return '/tmp/blbrepo/'+m.group(1)
    m=re.search(r'/gh/genasbury12/blb-site@[0-9a-f]+/(.+)$',url)
    if m: return '/tmp/blbrepo/'+m.group(1)
    m=re.search(r'charming-caramel-d2453c\.netlify\.app/images/(.+)$',url)
    if m: return '/tmp/blbrepo/site/images/'+m.group(1)
    return None
async def route(r):
    u=r.request.url
    if u.startswith('file:'): return await r.continue_()
    p=local(u)
    if p and os.path.exists(p): return await r.fulfill(path=p)
    return await r.abort()
async def main():
    F=sys.argv[1];W=int(sys.argv[2]);O=sys.argv[3];os.makedirs(O,exist_ok=True)
    async with async_playwright() as pw:
        b=await pw.chromium.launch()
        pg=await b.new_page(viewport={'width':W,'height':(844 if W<500 else 900)})
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' else None)
        await pg.route('**/*',route)
        await pg.goto('file://'+F+'',wait_until='load');await pg.wait_for_timeout(3600)
        await pg.screenshot(path=f'{O}/s{W}_00.png')
        H=await pg.evaluate('document.documentElement.scrollHeight');print('H',H,'errs',errs[:6])
        sw=await pg.evaluate('document.documentElement.scrollWidth');print('scrollWidth',sw)
        await pg.mouse.move(W/2,450)
        i=1;y=0
        while y<H and i<70:
            for _ in range(9): await pg.mouse.wheel(0,100);await pg.wait_for_timeout(40)
            await pg.wait_for_timeout(900)
            y=await pg.evaluate('scrollY');H=await pg.evaluate('document.documentElement.scrollHeight')
            await pg.screenshot(path=f'{O}/s{W}_{i:02d}.png');i+=1
            if y+900>=H-5: break
        print('shots',i,'errs',errs[:6])
        await b.close()
asyncio.run(main())
