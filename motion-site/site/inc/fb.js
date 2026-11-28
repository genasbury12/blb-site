window.addEventListener('load',function(){var R=document.querySelector('.m');if(!R)return;function $$(s){return Array.prototype.slice.call(R.querySelectorAll(s))}
/* progress track: car drives to the current stage */
$$('[data-ftrack]').forEach(function(t){var n=+t.dataset.n,pct=((n-1)/3*100)*0.88+6;var go=function(){var f=t.querySelector('.rail>i'),c=t.querySelector('.pace');if(f)f.style.width=((n-1)/3*100)+'%';if(c)c.style.left=((n-1)/3*100)+'%'};if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){go();io.disconnect()}})},{threshold:.4});io.observe(t)}else go()});
if(!window.gsap)return;gsap.registerPlugin(ScrollTrigger);
/* road fills as you drive down it */
$$('.f-road').forEach(function(r){var f=r.querySelector('[data-lanefill]');if(f)gsap.fromTo(f,{height:'0%'},{height:'100%',ease:'none',scrollTrigger:{trigger:r,start:'top 70%',end:'bottom 60%',scrub:true}})});
/* clipboard ticks */
$$('[data-fclip] li').forEach(function(li){ScrollTrigger.create({trigger:li,start:'top 75%',onEnter:function(){li.classList.add('on')}})});
/* roundel spins in */
var rd=R.querySelector('.f-roundel .ph');if(rd&&!matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.from(rd,{rotate:-25,scale:.8,opacity:0,duration:1.4,ease:'expo.out',delay:.3});
});
