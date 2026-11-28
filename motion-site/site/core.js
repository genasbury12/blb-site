(function(){
var R=document.getElementById('m-root');if(!R)return;
var $=function(s,c){return (c||R).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||R).querySelectorAll(s))};
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
// even rows for chip groups: always complete rows
$$('[data-even]').forEach(function(g){var n=g.children.length,c=[3,4,2,5,6].filter(function(k){return n%k===0})[0]||n;g.classList.add('even');g.style.setProperty('--c',c);g.style.setProperty('--cm',n%2===0?2:1);});
// menu
var nav=$('[data-nav]'),menu=$('[data-menu]'),bg=$('[data-burger]');
if(bg){bg.addEventListener('click',function(){var o=!menu.classList.contains('open');menu.classList.toggle('open',o);bg.setAttribute('aria-expanded',o);menu.setAttribute('aria-hidden',!o);document.documentElement.style.overflow=o?'hidden':'';$$('a',menu).forEach(function(a,i){a.style.transitionDelay=o?(0.25+i*0.05)+'s':'0s'});});
$$('a',menu).forEach(function(a){a.addEventListener('click',function(){menu.classList.remove('open');bg.setAttribute('aria-expanded',false);document.documentElement.style.overflow='';})});}
// videos
$$('[data-yt]').forEach(function(b){b.addEventListener('click',function(){if(b.querySelector('iframe'))return;var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+b.getAttribute('data-yt')+'?autoplay=1&rel=0&modestbranding=1&playsinline=1';f.title=b.getAttribute('aria-label');f.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';f.allowFullscreen=true;b.appendChild(f);});});
// Flodesk forms
$$('form[data-fd]').forEach(function(form){var msg=form.querySelector('[data-msg]'),btn=form.querySelector('button[type=submit]');form.addEventListener('submit',function(e){e.preventDefault();var id=form.getAttribute('data-form-id')||'',fn=form.querySelector('[name=firstName]'),em=form.querySelector('[name=email]');var name=fn?fn.value.trim():'',email=em.value.trim();if(fn&&!name){msg.textContent='Add your first name.';fn.focus();return;}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.textContent='That email doesn’t look quite right yet.';em.focus();return;}if(!id){msg.textContent='Registration is opening soon. Please check back shortly.';return;}btn.disabled=true;msg.textContent='';try{sessionStorage.setItem('fpw_email',email)}catch(x){}var body={email:email,confirm_email_address:''};if(fn)body.firstName=name;fetch('https://form.flodesk.com/forms/'+id+'/submit',{method:'POST',mode:'no-cors',body:new URLSearchParams(body),keepalive:true}).catch(function(){}).then(function(){var nx=form.getAttribute('data-next');if(nx)location.href=nx;else form.innerHTML='<p style="font:400 26px/1.3 var(--fd)">You’re in. Check your inbox.</p>';});});});
// magnetic buttons + tilt cards
if(fine&&!reduce){
 $$('[data-mag]').forEach(function(el){el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();el.style.transform='translate('+((e.clientX-r.left-r.width/2)*.22)+'px,'+((e.clientY-r.top-r.height/2)*.3)+'px)'});el.addEventListener('pointerleave',function(){el.style.transition='transform .5s cubic-bezier(.2,.8,.2,1)';el.style.transform='';setTimeout(function(){el.style.transition=''},500)});});
 $$('[data-tilt]').forEach(function(el){el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;el.style.transform='rotateY('+((x-.5)*10)+'deg) rotateX('+((.5-y)*10)+'deg) translateY(-6px)';el.style.setProperty('--gx',x*100+'%');el.style.setProperty('--gy',y*100+'%')});el.addEventListener('pointerleave',function(){el.style.transition='transform .6s cubic-bezier(.2,.8,.2,1)';el.style.transform='';setTimeout(function(){el.style.transition=''},600)});});
}
function settle(){$$('.hlx').forEach(function(h){h.classList.add('on')});$$('[data-cross] li:not(.win)').forEach(function(l){l.classList.add('x')});$$('[data-checks] li').forEach(function(l){l.classList.add('on')});$$('[data-mods] span').forEach(function(s){s.classList.add('on')});}
if(reduce||!window.gsap||!window.ScrollTrigger){settle();return;}
R.classList.add('mo');
gsap.registerPlugin(ScrollTrigger);var hasSplit=!!window.SplitText;if(hasSplit)gsap.registerPlugin(SplitText);
var lenis=null;if(window.Lenis){lenis=new Lenis({lerp:.09,smoothWheel:true});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(function(t){lenis.raf(t*1000)});gsap.ticker.lagSmoothing(0);
 $$('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var h=a.getAttribute('href');if(h.length<2)return;var t=document.querySelector(h);if(t){e.preventDefault();lenis.scrollTo(t,{offset:-70,duration:1.4})}})});}
var prog=$('[data-prog]');if(prog)gsap.to(prog,{scaleX:1,ease:'none',scrollTrigger:{trigger:R,start:'top top',end:'bottom bottom',scrub:true}});
var lastY=0;if(nav)ScrollTrigger.create({start:0,end:'max',onUpdate:function(s){var y=s.scroll();nav.classList.toggle('hide',y>lastY&&y>400&&!(menu&&menu.classList.contains('open')));lastY=y;}});
// headline reveals
$$('[data-split]').forEach(function(h){var inHero=h.closest('[data-hero]');
 if(hasSplit){var sp=new SplitText(h,{type:'words',mask:'words'});gsap.from(sp.words,{yPercent:110,opacity:0,duration:1.05,ease:'expo.out',stagger:.04,delay:inHero?.2:0,scrollTrigger:inHero?null:{trigger:h,start:'top 86%'}});}
 else gsap.from(h,{y:40,opacity:0,duration:1,scrollTrigger:{trigger:h,start:'top 86%'}});});
// hero entrance (any page)
var hero=$('[data-hero]');if(hero){var tl=gsap.timeline({delay:.15});
 var q=function(s){return hero.querySelectorAll(s)};
 if(q('.eye').length)tl.from(q('.eye'),{y:16,opacity:0,duration:.7},0);
 if(q('[data-fade]:not(.eye)').length)tl.from(q('[data-fade]:not(.eye)'),{y:24,opacity:0,duration:.9,ease:'power3.out',stagger:.1},.6);
 if(q('[data-arch]').length)tl.from(q('[data-arch]'),{scaleY:0,transformOrigin:'50% 100%',duration:1.3,ease:'expo.out'},.5);
 if(q('[data-cut]').length){tl.from(q('[data-cut]'),{y:140,opacity:0,duration:1.3,ease:'expo.out'},.7);gsap.to(q('[data-cut]'),{yPercent:-6,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});}
 if(q('.bgname').length){tl.from(q('.bgname'),{opacity:0,scale:.8,duration:1.4,ease:'expo.out'},.6);gsap.to(q('.bgname'),{xPercent:-8,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});}
 if(q('[data-pill]').length)tl.from(q('[data-pill]'),{scale:0,opacity:0,duration:.7,ease:'back.out(2)',stagger:.12},1.2);
 if(q('.badge').length)tl.from(q('.badge'),{scale:0,rotate:-180,duration:1,ease:'back.out(1.6)'},1.1);
 Array.prototype.forEach.call(q('[data-pill]'),function(p,i){gsap.to(p,{y:i%2?-14:12,duration:2.6+i*.5,ease:'sine.inOut',yoyo:true,repeat:-1,delay:2})});}
// marquees (ribbons + footer)
var mqs=$$('[data-mq]').map(function(el){return {el:el,x:0,d:+(el.getAttribute('data-dir')||-1)}}),boost=0;
ScrollTrigger.create({start:0,end:'max',onUpdate:function(s){boost=gsap.utils.clamp(-14,14,s.getVelocity()/220)}});
mqs.forEach(function(m){if(m.d>0)m.x=-m.el.scrollWidth/2});
gsap.ticker.add(function(){boost*=.92;mqs.forEach(function(m){var w=m.el.scrollWidth/2;m.x+=(.6+Math.abs(boost))*m.d;if(m.d<0&&m.x<=-w)m.x+=w;if(m.d>0&&m.x>=0)m.x-=w;m.el.style.transform='translateX('+m.x+'px)'})});
// generic reveals
$$('[data-up]').forEach(function(el){gsap.to(el,{opacity:1,y:0,duration:1.05,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 88%'}})});
$$('[data-stagger]').forEach(function(g){gsap.from(g.children,{y:40,opacity:0,duration:.9,ease:'expo.out',stagger:.08,scrollTrigger:{trigger:g,start:'top 86%'}})});
$$('[data-slide]').forEach(function(g){Array.prototype.forEach.call(g.children,function(l){gsap.from(l,{x:-50,opacity:0,duration:1,ease:'expo.out',scrollTrigger:{trigger:l,start:'top 90%'}})})});
$$('.hlx').forEach(function(h){ScrollTrigger.create({trigger:h,start:'top 84%',once:true,onEnter:function(){h.classList.add('on')}})});
$$('[data-thread] .msg').forEach(function(m,i){gsap.from(m,{y:30,opacity:0,scale:.92,transformOrigin:i%2?'100% 100%':'0 100%',duration:.8,ease:'back.out(1.6)',scrollTrigger:{trigger:m,start:'top 88%'}})});
$$('[data-count]').forEach(function(el){var t=+el.getAttribute('data-count'),c=el.hasAttribute('data-comma'),o={v:0};ScrollTrigger.create({trigger:el,start:'top 92%',once:true,onEnter:function(){gsap.to(o,{v:t,duration:2,ease:'power3.out',onUpdate:function(){var n=Math.round(o.v);el.textContent=c?n.toLocaleString('en-US'):n}})}})});
// stacking cards
$$('[data-stack]').forEach(function(st){var cards=Array.prototype.slice.call(st.children);cards.forEach(function(c,i){c.style.zIndex=i+1;if(i===cards.length-1)return;gsap.to(c,{scale:.92,ease:'none',scrollTrigger:{trigger:cards[i+1],start:'top bottom',end:'top 104px',scrub:true}})})});
// sideways gallery
$$('[data-hz]').forEach(function(hz){var tr=hz.querySelector('[data-hztrack]');ScrollTrigger.matchMedia({'(min-width:701px)':function(){gsap.to(tr,{x:function(){return -(tr.scrollWidth-innerWidth+40)},ease:'none',scrollTrigger:{trigger:hz,start:'top top',end:function(){return '+='+(tr.scrollWidth-innerWidth)},pin:true,scrub:.8,invalidateOnRefresh:true}})},'(max-width:700px)':function(){hz.querySelector('.vp').style.cssText='height:auto;overflow-x:auto;padding:70px 0';}});});
// checks + modules
$$('[data-checks]').forEach(function(g){var lis=g.querySelectorAll('li');ScrollTrigger.create({trigger:g,start:'top 80%',once:true,onEnter:function(){Array.prototype.forEach.call(lis,function(li,i){setTimeout(function(){li.classList.add('on')},i*180+200)})}})});
$$('[data-mods]').forEach(function(g){var mods=g.querySelectorAll('span');ScrollTrigger.create({trigger:g,start:'top 85%',end:'top 40%',scrub:true,onUpdate:function(s){var k=Math.round(s.progress*mods.length);Array.prototype.forEach.call(mods,function(m,i){m.classList.toggle('on',i<k)})}})});
// collage
$$('[data-collage]').forEach(function(c){var t={trigger:c,start:'top 80%'};var b=c.querySelector('.big'),s=c.querySelector('.small'),n=c.querySelector('.note');if(b)gsap.from(b,{clipPath:'inset(0 100% 0 0 round 30px)',duration:1.4,ease:'expo.inOut',scrollTrigger:t});if(s)gsap.from(s,{y:80,opacity:0,duration:1.1,ease:'expo.out',delay:.5,scrollTrigger:t});if(n)gsap.from(n,{scale:0,duration:.8,ease:'back.out(2.2)',delay:.9,scrollTrigger:t});});
// stamps
$$('[data-stamps]').forEach(function(g){gsap.from(g.children,{scale:1.6,opacity:0,rotate:function(i){return [-14,10,-8,12][i%4]},duration:.6,ease:'power4.in',stagger:.18,scrollTrigger:{trigger:g,start:'top 82%'}})});
// cross offs
$$('[data-cross]').forEach(function(g){var cl=g.querySelectorAll('li');ScrollTrigger.create({trigger:g,start:'top 75%',end:'bottom 45%',scrub:true,onUpdate:function(s){var k=Math.floor(s.progress*(cl.length+.2));Array.prototype.forEach.call(cl,function(l,i){if(!l.classList.contains('win'))l.classList.toggle('x',i<k)})}})});
addEventListener('load',function(){ScrollTrigger.refresh()});
})();
;(function(){var g=document.querySelectorAll('[data-gauge]');if(!g.length)return;if(!('IntersectionObserver' in window)){g.forEach(function(x){x.classList.add('on')});return;}var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target);}})},{threshold:.4});g.forEach(function(x){io.observe(x)});})();
;(function(){if(!window.gsap||!window.ScrollTrigger)return;var red=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('[data-words]').forEach(function(el){if(red)return;var html=el.innerHTML;var out=html.replace(/(<[^>]+>)|([^<\s]+)/g,function(m,tag,word){return tag?tag:'<span class="w">'+word+'</span>'});el.innerHTML=out;gsap.to(el.querySelectorAll('.w'),{opacity:1,stagger:.05,ease:'none',scrollTrigger:{trigger:el,start:'top 82%',end:'bottom 45%',scrub:true}})});
document.querySelectorAll('[data-car]').forEach(function(c){var p=c.parentElement;if(red)return;gsap.fromTo(c,{left:'6%'},{left:'86%',ease:'none',scrollTrigger:{trigger:p,start:'top 85%',end:'bottom 35%',scrub:true}})});
document.querySelectorAll('[data-par] img').forEach(function(im){if(red)return;gsap.fromTo(im,{yPercent:-8,scale:1.12},{yPercent:8,ease:'none',scrollTrigger:{trigger:im.parentElement,start:'top bottom',end:'bottom top',scrub:true}})});
})();
;(function(){if(!document.querySelector('.m.sh'))return;var ems=document.querySelectorAll('.m.sh .hl');if(!('IntersectionObserver' in window))return;ems.forEach(function(e){e.style.setProperty('--hl','0%')});var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){setTimeout(function(){x.target.style.setProperty('--hl','100%')},350);io.unobserve(x.target)}})},{threshold:.6});ems.forEach(function(e){io.observe(e)});})();
;(function(){var c=document.querySelectorAll('.circ');if(!c.length)return;if(!('IntersectionObserver' in window)){c.forEach(function(x){x.classList.add('in')});return;}var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.8});c.forEach(function(x){io.observe(x)});})();
;(function(){
var red=matchMedia('(prefers-reduced-motion: reduce)').matches,NS='http://www.w3.org/2000/svg';
function onView(el,fn,th){if(!('IntersectionObserver' in window)||red){fn();return}var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){fn();io.disconnect()}})},{threshold:th||.25});io.observe(el)}
document.querySelectorAll('[data-bld],[data-br],[data-draw]').forEach(function(el){onView(el,function(){el.classList.add('on')})});
/* hub and spoke */
document.querySelectorAll('[data-bp]').forEach(function(bp){
 var svg=bp.querySelector('.bp-svg'),hub=bp.querySelector('[data-bphub] figure')||bp.querySelector('[data-bphub]'),ns=[].slice.call(bp.querySelectorAll('[data-bpn]')),paths=[],run={i:0,t:0,c:null};
 function draw(){svg.innerHTML='';paths=[];if(getComputedStyle(svg).display==='none')return;
  var B=bp.getBoundingClientRect(),H=hub.getBoundingClientRect();svg.setAttribute('viewBox','0 0 '+B.width+' '+B.height);
  var hx=H.left+H.width/2-B.left,hy=H.top+H.height/2-B.top;
  ns.forEach(function(n){var r=n.getBoundingClientRect(),left=(r.left+r.width/2-B.left)<hx,x=left?r.right-B.left:r.left-B.left,y=r.top+r.height/2-B.top,sx=left?H.left-B.left:H.right-B.left,mx=(x+sx)/2;
   var p=document.createElementNS(NS,'path');p.setAttribute('d','M'+sx+' '+hy+' C'+mx+' '+hy+' '+mx+' '+y+' '+x+' '+y);p.setAttribute('class','bp-ln');svg.appendChild(p);
   var d=document.createElementNS(NS,'circle');d.setAttribute('cx',x);d.setAttribute('cy',y);d.setAttribute('r',5);d.setAttribute('class','bp-dot');svg.appendChild(d);paths.push(p)});
  run.c=document.createElementNS(NS,'circle');run.c.setAttribute('class','bp-run');run.c.setAttribute('r',6);svg.appendChild(run.c)}
 function tick(ts){if(run.c&&paths.length){var p=paths[run.i%paths.length],L=p.getTotalLength(),k=Math.min(1,(ts-run.t)/1300),pt=p.getPointAtLength(L*k);run.c.setAttribute('cx',pt.x);run.c.setAttribute('cy',pt.y);
   if(k>=1){ns.forEach(function(n,j){n.classList.toggle('lit',j===run.i)});paths.forEach(function(q,j){q.classList.toggle('lit',j===run.i)});if(ts-run.t>2600){run.i=(run.i+1)%paths.length;run.t=ts}}}requestAnimationFrame(tick)}
 draw();addEventListener('resize',draw);addEventListener('load',draw);
 onView(bp,function(){bp.classList.add('on');setTimeout(draw,900);if(!red)requestAnimationFrame(function(ts){run.t=ts;tick(ts)})},.15);
 ns.forEach(function(n,i){n.addEventListener('mouseenter',function(){run.i=i;run.t=performance.now()-1300})});
});
/* sequence lighting: pipelines, flows, routes */
document.querySelectorAll('[data-seq]').forEach(function(el){var it=[].slice.call(el.querySelectorAll('[data-si]')),i=0,ms=+el.getAttribute('data-seq')||1400;
 onView(el,function(){el.classList.add('on');if(red){it.forEach(function(x){x.classList.add('lit')});return}
  setInterval(function(){it.forEach(function(x,j){x.classList.toggle('lit',j<=i);x.classList.toggle('now',j===i)});i=(i+1)%(it.length+1)},ms)})});
/* cycle */
document.querySelectorAll('[data-cyc]').forEach(function(c){var it=[].slice.call(c.querySelectorAll('.cyc-i')),n=it.length,dot=c.querySelector('.cyc-dot'),a=0;
 function place(){var wide=innerWidth>900;it.forEach(function(x,i){var t=(-90+i*360/n)*Math.PI/180;if(wide){x.style.left=(50+33*Math.cos(t))+'%';x.style.top=(50+36*Math.sin(t))+'%'}else{x.style.left='';x.style.top=''}})}
 place();addEventListener('resize',place);
 onView(c,function(){c.classList.add('on');if(red)return;var last=performance.now();(function f(ts){a=(a+(ts-last)*0.03)%360;last=ts;var t=(a-90)*Math.PI/180;if(dot){dot.setAttribute('cx',50+33*Math.cos(t));dot.setAttribute('cy',50+36*Math.sin(t))}
  var k=Math.round(a/(360/n))%n;it.forEach(function(x,j){x.classList.toggle('lit',j===k)});requestAnimationFrame(f)})(last)})});
})();
;(function(){document.querySelectorAll('[data-route]').forEach(function(r){var st=[].slice.call(r.querySelectorAll('.st')),bar=r.querySelector('.rl i');
function f(){var b=r.getBoundingClientRect(),mid=innerHeight*.6,p=Math.max(0,Math.min(1,(mid-b.top)/b.height));bar.style.height=(p*100)+'%';st.forEach(function(s){var sb=s.getBoundingClientRect();s.classList.toggle('lit',sb.top+30<mid)})}
addEventListener('scroll',f,{passive:true});f()})})();
;(function(){function tag(){document.querySelectorAll('.m button[aria-pressed]').forEach(function(b){if(b.querySelector('.tap-tag')||b.offsetWidth<220)return;b.classList.add('has-tap');var s=document.createElement('span');s.className='tap-tag';s.setAttribute('aria-hidden','true');s.textContent='Tap';b.appendChild(s)})}
if(document.readyState==='complete')setTimeout(tag,300);else addEventListener('load',function(){setTimeout(tag,300)});setTimeout(tag,1500)})();
;(function(){function yid(u){u=u.trim();var m=u.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);if(m)return m[1];if(/^[\w-]{11}$/.test(u))return u;return null}
document.querySelectorAll('[data-ftv]').forEach(function(box){var raw=(box.getAttribute('data-ftv')||'').split(',').map(function(x){return x.trim()}).filter(Boolean);var items=[];raw.forEach(function(r){var parts=r.split('|'),id=yid(parts[0]);if(id)items.push({id:id,cap:(parts[1]||'').trim()})});
var sec=box.closest('.ftv-sec');if(!items.length){if(box.hasAttribute('data-ftv-demo')){if(sec)sec.hidden=false;box.classList.add('many','even');for(var k=1;k<=4;k++){var f=document.createElement('figure');f.className='ftv-i';f.innerHTML='<div class="ftv-p ftv-ph"><span class="pl"><svg width="22" height="22" viewBox="0 0 18 18"><path d="M5 3l10 6-10 6z" fill="currentColor"/></svg></span><span class="ph-t">Your Fast Track Call video '+k+' goes here</span></div><figcaption>Preview only. Paste YouTube links in data-ftv to fill this.</figcaption>';box.appendChild(f)}return}if(sec)sec.hidden=true;return}if(sec)sec.hidden=false;box.classList.add(items.length===1?'one':(items.length===2?'two':'many'));if(items.length%2===0)box.classList.add('even');
items.forEach(function(it){var f=document.createElement('figure');f.className='ftv-i';var b=document.createElement('button');b.type='button';b.className='ftv-p';b.setAttribute('aria-label','Play video'+(it.cap?': '+it.cap:''));b.innerHTML='<img src="https://i.ytimg.com/vi/'+it.id+'/hqdefault.jpg" alt="" loading="lazy"><span class="pl"><svg width="22" height="22" viewBox="0 0 18 18"><path d="M5 3l10 6-10 6z" fill="currentColor"/></svg></span>';b.addEventListener('click',function(){b.outerHTML='<div class="ftv-p"><iframe src="https://www.youtube-nocookie.com/embed/'+it.id+'?autoplay=1&rel=0" title="'+(it.cap||'Fast Track Call')+'" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'});f.appendChild(b);if(it.cap){var c=document.createElement('figcaption');c.textContent=it.cap;f.appendChild(c)}box.appendChild(f)})})})();
