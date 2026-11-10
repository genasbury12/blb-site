// Usage: node verify.js home.html [more.html...]  -> qa/<name>-desktop.png, qa/<name>-mobile.png, report to stdout
const { chromium } = require('playwright'); const path=require('path');
(async()=>{
 const b=await chromium.launch(); const files=process.argv.slice(2);
 for(const f of files){
  const url='file://'+path.join(__dirname,'pages',f); const name=f.replace('.html','');
  const errs=[];
  for(const [label,vp,dsf] of [['desktop',{width:1440,height:900},1],['mobile',{width:390,height:844},2]]){
   const ctx=await b.newContext({viewport:vp,deviceScaleFactor:dsf,reducedMotion:'reduce'}); const p=await ctx.newPage();
   p.on('pageerror',e=>errs.push(label+' pageerror: '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(label+' console: '+m.text())});
   await p.goto(url,{waitUntil:'load'}); await p.waitForTimeout(600);
   for(let y=0;y<30000;y+=700){await p.evaluate(yy=>window.scrollTo(0,yy),y);await p.waitForTimeout(40)} await p.evaluate(()=>window.scrollTo(0,0));
   const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   const noH=await p.evaluate(()=>[...document.querySelectorAll('main section')].filter(s=>!s.querySelector('h1,h2')).length);
   await p.screenshot({path:`qa/${name}-${label}.png`,fullPage:true});
   console.log(`${f} ${label}: overflow=${ov}px sectionsWithoutH1H2=${noH}`);
   if(label==='mobile'){ // click tests
     const r=await p.evaluate(async()=>{const out={};const bg=document.querySelector('.burger');if(bg){bg.click();await new Promise(r=>setTimeout(r,700));out.menuOpen=document.getElementById('menu').classList.contains('open');document.querySelector('.menu-x').click()}
      const d=document.querySelector('.faq details');if(d){d.querySelector('summary').click();out.faqOpen=d.open}
      const t=document.querySelectorAll('.tapl button');if(t.length){t[0].click();t[1].click();out.tapNote=document.querySelector('.meter-note').textContent;out.meter=document.querySelector('.meter-bar i').style.width}
      const s=document.querySelectorAll('.tg-switch button');if(s.length){s[1].click();out.toggle=!document.querySelector('[data-panel=new]').hidden}
      return out});
     console.log('  clicks:',JSON.stringify(r));
   }
   await ctx.close();
  }
  const ctx=await b.newContext({viewport:{width:1440,height:900},javaScriptEnabled:false}); const p=await ctx.newPage(); await p.goto(url);
  const nojs=await p.evaluate(()=>{const l=document.querySelector('.loader');const hid=[...document.querySelectorAll('[data-rv]')].filter(e=>getComputedStyle(e).opacity==='0').length;return {loaderVisible:l?getComputedStyle(l).display!=='none':false,hiddenReveals:hid}});
  console.log('  no-JS:',JSON.stringify(nojs)); await ctx.close();
  console.log('  errors:',errs.length?errs:'none');
 }
 await b.close();})();
