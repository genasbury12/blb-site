(function(){
/* ================= SETTINGS: fill these in ================= */
var CFG={
  FORM_URL:'',          /* ClickUp form share link (Form view > Share > copy link) */
  REPLAY_ID:'',         /* YouTube video ID of the 30 minute training */
  CHAPTERS:[0,450,900,1350], /* chapter start times in seconds, adjust after recording */
  BONUS1_URL:'',        /* link to Offers AI Can't Copy */
  BONUS2_NAME:'',       /* name of the watch-to-the-end bonus */
  BONUS2_DESC:'',       /* one line about it */
  BONUS2_URL:'',        /* link to it */
  FULL_PRICE:'97',      /* regular price */
  LAUNCH_PRICE:'67',    /* launch price, shown after the 1 hour ends */
  SALE_PRICE:'48.50',   /* half off the regular price, first hour only */
  SALE_URL:'',          /* ThriveCart checkout link with the 50% coupon */
  FULL_URL:'/futureproof-blogger',
  ACCESS_HOURS:72,
  SALE_MINUTES:60
};
/* =========================================================== */
var R=document.querySelector('[data-fd-root]');if(!R)return;
var demo=R.hasAttribute('data-fd-demo');
function $(s){return R.querySelector(s)}function $$(s){return Array.prototype.slice.call(R.querySelectorAll(s))}
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},del:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var K={u:'fpd_unlocked_at',f:'fpd_finished'};
var qs=new URLSearchParams(location.search);
if(qs.get('unlocked')==='1'&&!store.get(K.u))store.set(K.u,String(Date.now()));

/* form embed */
var slot=$('[data-formslot]');
if(CFG.FORM_URL&&slot){slot.innerHTML='<iframe class="clickup-embed" src="'+CFG.FORM_URL+'" title="Futureproof Your Blog questions" loading="lazy"></iframe>';}

function pad(n){return (n<10?'0':'')+n}
var timers=[];
function setSteps(n){$$('.fd-steps li').forEach(function(li,i){li.classList.toggle('done',i<n);li.classList.toggle('here',i===n);});var b=$('[data-stepbar]');if(b)b.style.width=(n/2*100)+'%';}

function confetti(){var c=$('[data-confetti]');if(!c||c.childNodes.length||matchMedia('(prefers-reduced-motion: reduce)').matches)return;var cols=['#A23E66','#E9B9CA','#3A1C2A','#F6C9D8'];for(var i=0;i<70;i++){var e=document.createElement('i');e.style.left=Math.random()*100+'%';e.style.background=cols[i%4];e.style.animationDelay=(Math.random()*1.4)+'s';c.appendChild(e);}}

function render(){
  timers.forEach(clearInterval);timers=[];
  var t0=+store.get(K.u)||0, unlocked=!!t0;
  $('[data-locked]').hidden=unlocked;$('[data-unlocked]').hidden=!unlocked;
  setSteps(unlocked?2:1);
  if(!unlocked)return;
  confetti();
  /* bonus 1 */
  var b1=$('[data-b1link]');if(b1){if(CFG.BONUS1_URL){b1.href=CFG.BONUS1_URL;b1.target='_blank';b1.rel='noopener';}}
  /* access clock */
  var accEnd=t0+CFG.ACCESS_HOURS*3600e3;
  function acc(){var ms=accEnd-Date.now();if(ms<=0&&!demo){location.href='/masterclass-expired';return;}ms=Math.max(0,ms);var h=Math.floor(ms/3600e3),m=Math.floor(ms%3600e3/60e3),s=Math.floor(ms%60e3/1e3);var b=$$('[data-access] b');b[0].textContent=pad(h);b[1].textContent=pad(m);b[2].textContent=pad(s);}
  acc();timers.push(setInterval(acc,1000));
  /* sale clock */
  var saleEnd=t0+CFG.SALE_MINUTES*60e3;
  function sale(){var ms=saleEnd-Date.now(),on=ms>0;ms=Math.max(0,ms);var m=Math.floor(ms/60e3),s=Math.floor(ms%60e3/1e3);var b=$$('[data-sale] b');b[0].textContent=pad(m);b[1].textContent=pad(s);
    var box=$('[data-offer]');box.classList.toggle('ended',!on);
    $('[data-saletitle]').textContent=on?'50% off ends in':'Your 50% off has ended';
    $('[data-salesub]').textContent=on?'Only for women who join within 1 hour of unlocking this training.':'The Futureproof Blogger is still available at the $'+CFG.LAUNCH_PRICE+' launch price.';
    $('[data-badge]').hidden=!on;var bk=$('.fd-buy-k');if(bk)bk.textContent=on?'Your price for the next hour':'Launch price';
    var full=$('[data-full]'),sp=$('[data-sale-price]');
    var after=CFG.LAUNCH_PRICE||CFG.FULL_PRICE;
    if(CFG.FULL_PRICE&&CFG.SALE_PRICE){full.textContent='$'+CFG.FULL_PRICE;sp.textContent='$'+(on?CFG.SALE_PRICE:after);}
    else{full.textContent='';sp.textContent=on?'50% off':'Full price';}
    var pn=$('[data-pnote]');if(pn)pn.innerHTML=on?'Half off the regular $'+CFG.FULL_PRICE+'. Less than the $'+CFG.LAUNCH_PRICE+' launch price, for the next hour only.':'Launch price. Regular price $'+CFG.FULL_PRICE+'.';
    var cta=$('[data-cta]');cta.href=on?(CFG.SALE_URL||'#'):CFG.FULL_URL;
    $('[data-ctatext]').textContent=on?'Yes! I Want to Futureproof My Business':'Get Access to The Futureproof Blogger';
    $('[data-after]').textContent=on?'When the timer hits zero, $'+CFG.SALE_PRICE+' is gone and the price goes back to $'+CFG.LAUNCH_PRICE+'.':'';
  }
  sale();timers.push(setInterval(sale,1000));
  /* bonus 2 */
  if(CFG.BONUS2_NAME)$('[data-b2name]').textContent=CFG.BONUS2_NAME;
  if(CFG.BONUS2_DESC)$('[data-b2desc]').textContent=CFG.BONUS2_DESC;
  if(store.get(K.f))finish(true);
}
function finish(quiet){store.set(K.f,'1');var b=$('[data-b2]');b.classList.remove('locked');b.classList.add('open');$('[data-b2tag]').textContent='Bonus 02 · unlocked';var a=$('[data-b2link]');a.hidden=false;if(CFG.BONUS2_URL){a.href=CFG.BONUS2_URL;a.target='_blank';a.rel='noopener';}setPct(100);}
function setPct(p){p=Math.max(0,Math.min(100,Math.round(p)));$('[data-watchpct]').textContent=p+'%';$('[data-watchbar]').style.width=p+'%';}

/* player + watch tracking */
var player=null;
if(CFG.REPLAY_ID){
  var pl=$('[data-player]');pl.innerHTML='<div id="fd-yt"></div>';
  window.onYouTubeIframeAPIReady=function(){player=new YT.Player('fd-yt',{videoId:CFG.REPLAY_ID,playerVars:{rel:0,modestbranding:1,playsinline:1},events:{onStateChange:function(e){if(e.data===0)finish();}}});
    setInterval(function(){if(player&&player.getDuration){var d=player.getDuration(),c=player.getCurrentTime();if(d>0){var p=c/d*100;if(!store.get(K.f))setPct(p);if(p>=95&&!store.get(K.f))finish();var i=0;CFG.CHAPTERS.forEach(function(s,j){if(c>=s)i=j});$$('.fd-ch').forEach(function(b,j){b.setAttribute('aria-pressed',j===i?'true':'false')});}}},1000);};
  var s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';document.head.appendChild(s);
}
$$('.fd-ch').forEach(function(b,i){b.addEventListener('click',function(){$$('.fd-ch').forEach(function(x,j){x.setAttribute('aria-pressed',j===i?'true':'false')});if(player&&player.seekTo){player.seekTo(CFG.CHAPTERS[i]||0,true);player.playVideo();}});});

/* module "loading" animation */
var mods=$$('.fd-mods li'),mc=$('[data-modcount]');
if('IntersectionObserver' in window&&mods.length){var done=false;new IntersectionObserver(function(en,o){en.forEach(function(e){if(e.isIntersecting&&!done){done=true;mods.forEach(function(li,i){setTimeout(function(){li.classList.add('on');mc.textContent=i+1;},250+i*260)});o.disconnect();}})},{threshold:.3}).observe($('.fd-mods'));}else{mods.forEach(function(li){li.classList.add('on')});if(mc)mc.textContent=mods.length;}

/* preview controls (review page only) */
if(demo){var d=$('[data-demo]');d.hidden=false;
  $('[data-demo-lock]').onclick=function(){store.del(K.u);store.del(K.f);render();scrollTo(0,0);};
  $('[data-demo-unlock]').onclick=function(){store.set(K.u,String(Date.now()));store.del(K.f);var b=$('[data-b2]');b.classList.add('locked');b.classList.remove('open');$('[data-b2link]').hidden=true;$('[data-b2tag]').textContent='Bonus 02 · watch to the end to unlock';setPct(0);render();scrollTo(0,0);};
  $('[data-demo-finish]').onclick=function(){if(!store.get(K.u))store.set(K.u,String(Date.now()));render();finish();};
  $('[data-demo-expire]').onclick=function(){store.set(K.u,String(Date.now()-CFG.SALE_MINUTES*60e3-1000));render();var o=$('#offer');if(o)o.scrollIntoView({behavior:'smooth'});};
}
render();
})();
