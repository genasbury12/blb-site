window.addEventListener('load',function(){var R=document.querySelector('.m');if(!R||!window.gsap)return;var red=matchMedia('(prefers-reduced-motion: reduce)').matches;gsap.registerPlugin(ScrollTrigger);
function $$(s){return Array.prototype.slice.call(R.querySelectorAll(s))}
/* hero dial fills to 12 */
var f=R.querySelector('.dial .fill');if(f){if(red)f.style.strokeDashoffset=0;else gsap.fromTo(f,{strokeDashoffset:12},{strokeDashoffset:0,duration:2.4,ease:'power3.inOut',delay:.5});
 $$('.dial .ph').forEach(function(p,i){gsap.from(p,{opacity:0,scale:.6,duration:.6,delay:.9+i*.45,ease:'back.out(2)'})});}
/* roadmap: months light up as each phase enters */
var ms=$$('.b-months i');$$('.b-phase').forEach(function(ph){var m=+ph.dataset.m;ScrollTrigger.create({trigger:ph,start:'top 60%',end:'bottom 40%',onToggle:function(s){if(s.isActive){ms.forEach(function(x,i){x.classList.toggle('on',i<m)});$$('.b-phase').forEach(function(p){p.classList.toggle('cur',p===ph)})}}})});
/* optimization cycle highlights each step in turn */
var nodes=$$('.b-cycle .node'),k=0;if(nodes.length&&!red){ScrollTrigger.create({trigger:'.b-cycle',start:'top 75%',once:true,onEnter:function(){nodes[0].classList.add('on');setInterval(function(){nodes[k].classList.remove('on');k=(k+1)%nodes.length;nodes[k].classList.add('on')},1800)}})}
/* timeline rail draws with scroll */
var rail=R.querySelector('[data-rail]');if(rail)gsap.fromTo(rail,{scaleY:0},{scaleY:1,ease:'none',scrollTrigger:{trigger:'.b-line',start:'top 70%',end:'bottom 60%',scrub:true}});
$$('.b-line .it').forEach(function(it){ScrollTrigger.create({trigger:it,start:'top 65%',onEnter:function(){it.classList.add('lit')}})});
/* steps path */
var path=R.querySelector('[data-path]');if(path)gsap.fromTo(path,{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{trigger:'.b-steps',start:'top 75%',end:'bottom 70%',scrub:true}});
/* strike lists */
$$('[data-strike] li').forEach(function(li,i){ScrollTrigger.create({trigger:li,start:'top 70%',onEnter:function(){li.classList.add('x')}})});
/* instead of rows: strike left, light right */
$$('.b-swap .r').forEach(function(r){ScrollTrigger.create({trigger:r,start:'top 70%',onEnter:function(){r.classList.add('go')}})});
/* terminal typing */
var t=$$('[data-type] li');t.forEach(function(li){li.style.opacity=0});ScrollTrigger.create({trigger:'.b-term',start:'top 75%',once:true,onEnter:function(){t.forEach(function(li,i){setTimeout(function(){li.style.opacity=1;li.classList.add('typed')},i*260)})}});
/* browser screenshot scrolls */
var si=R.querySelector('[data-siteimg]');if(si&&!red)gsap.to(si,{yPercent:-28,ease:'none',scrollTrigger:{trigger:'.b-browser',start:'top bottom',end:'bottom top',scrub:true}});
/* launch list: last line drops */
var x=R.querySelector('.b-launch .x');if(x)ScrollTrigger.create({trigger:x,start:'top 75%',onEnter:function(){x.classList.add('drop')}});
});
