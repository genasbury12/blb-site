window.addEventListener('load',function(){var R=document.querySelector('.m');if(!R)return;function $$(s){return Array.prototype.slice.call(R.querySelectorAll(s))}
/* yes / not yet buttons */
$$('.g-check .q').forEach(function(q){var bs=q.querySelectorAll('button');Array.prototype.forEach.call(bs,function(b){b.setAttribute('aria-pressed','false');b.addEventListener('click',function(){Array.prototype.forEach.call(bs,function(x){x.setAttribute('aria-pressed',x===b)})})})});
if(!window.gsap)return;gsap.registerPlugin(ScrollTrigger);
/* notebook: tick items as you scroll, month counter climbs */
var lis=$$('[data-gtodo] li'),mo=R.querySelector('[data-month]');lis.forEach(function(li,i){ScrollTrigger.create({trigger:li,start:'top 72%',onEnter:function(){li.classList.add('done');if(mo&&i===lis.length-1){mo.textContent='Month 2';mo.classList.add('bump')}}})});
/* 7/7 meter */
var ml=$$('[data-meterlist] li'),mn=R.querySelector('[data-meter]'),mb=R.querySelector('[data-meterbar]');ml.forEach(function(li,i){ScrollTrigger.create({trigger:li,start:'top 75%',onEnter:function(){li.classList.add('on');if(mn)mn.textContent=i+1;if(mb)mb.style.width=((i+1)/ml.length*100)+'%'},onLeaveBack:function(){li.classList.remove('on');if(mn)mn.textContent=i;if(mb)mb.style.width=(i/ml.length*100)+'%'}})});
/* project steps */
var pl=$$('[data-projlist] li'),pn=R.querySelector('[data-projn]'),pb=R.querySelector('[data-projbar]');pl.forEach(function(li,i){ScrollTrigger.create({trigger:li,start:'top 75%',onEnter:function(){li.classList.add('on');if(pn)pn.textContent=i+1;if(pb)pb.style.width=((i+1)*10)+'%'},onLeaveBack:function(){li.classList.remove('on');if(pn)pn.textContent=i;if(pb)pb.style.width=(i*10)+'%'}})});
/* module map lights in order */
var mods=$$('[data-gmods] article');mods.forEach(function(a){ScrollTrigger.create({trigger:a,start:'top 78%',onEnter:function(){a.classList.add('lit')}})});
/* receipt prints */
var rc=R.querySelector('.g-receipt');if(rc)gsap.from(rc,{clipPath:'inset(0 0 100% 0)',duration:1.6,ease:'power2.inOut',scrollTrigger:{trigger:rc,start:'top 80%'}});
/* AI says vs reality */
$$('.g-says .pair').forEach(function(p){ScrollTrigger.create({trigger:p,start:'top 72%',onEnter:function(){p.classList.add('on')}})});
/* member card float */
var mc=R.querySelector('.g-hero .mcard');if(mc&&!matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.to('.g-cardwrap',{y:-14,duration:3,ease:'sine.inOut',yoyo:true,repeat:-1});
});
