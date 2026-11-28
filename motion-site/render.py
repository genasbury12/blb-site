import asyncio,subprocess,os
from playwright.async_api import async_playwright
B=[0,7.45,11.0,18.95,22.95,29.95,40.15,48.55,62.4,67.0];FPS=30
async def go():
  async with async_playwright() as pw:
    b=await pw.chromium.launch();pg=await b.new_page(viewport={'width':1080,'height':1350})
    await pg.goto('file:///home/claude/vsl/vsl.html');await pg.wait_for_timeout(800)
    files=[]
    for i in range(len(B)-1):
      a,e=B[i],B[i+1];n=round((e-a)*FPS);tmp=f'sc{i}.tmp.mp4';out=f'sc{i}.mp4'
      ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','image2pipe','-framerate',str(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-r',str(FPS),tmp],stdin=subprocess.PIPE)
      for k in range(n):
        t=a+k/FPS
        await pg.evaluate(f'render({t:.4f})')
        ff.stdin.write(await pg.screenshot(type='jpeg',quality=92))
      ff.stdin.close();rc=ff.wait()
      if rc==0: os.replace(tmp,out);files.append(out);print('scene',i,n,'frames ok',flush=True)
      else: print('scene',i,'FAILED');return
    open('list.txt','w').write(''.join(f"file '{f}'\n" for f in files))
    await b.close()
asyncio.run(go())
