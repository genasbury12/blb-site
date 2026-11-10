const { chromium } = require('playwright'); const path=require('path');
(async()=>{const b=await chromium.launch();
for(const f of ['blog-header-embed.html','blog-post-cta-embed.html','blog-footer-embed.html']){
 for(const [l,vp,dsf] of [['desktop',{width:1440,height:900},1],['mobile',{width:390,height:844},2]]){
  const c=await b.newContext({viewport:vp,deviceScaleFactor:dsf,javaScriptEnabled:false}); const p=await c.newPage();
  await p.goto('file://'+path.join(__dirname,'pages',f)); await p.waitForTimeout(500);
  const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  const scripts=await p.evaluate(()=>document.querySelectorAll('script').length);
  if(f.startsWith('blog-header')&&l==='mobile'){await p.click('label.burger');const open=await p.evaluate(()=>getComputedStyle(document.querySelector('.csb .links')).display);console.log('  css-only menu after tap:',open)}
  await p.screenshot({path:`qa/${f.replace('.html','')}-${l}.png`,fullPage:true}); console.log(f,l,'overflow',ov,'scripts',scripts); await c.close()}}
await b.close()})();
