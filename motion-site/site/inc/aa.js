<script>
(function(){var R=document.querySelector('.m');if(!R)return;
/* Paste the All Access checkout link here when it's ready */
var CHECKOUT='';
if(CHECKOUT)R.querySelectorAll('[data-checkout],a[href="#unlock"].btn').forEach(function(a){a.href=CHECKOUT});
R.querySelectorAll('[data-ytog] button').forEach(function(b){b.setAttribute('aria-pressed','false');b.addEventListener('click',function(){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true')})});
var sk=R.querySelector('[data-yskill]');if(sk){var bs=sk.querySelectorAll('.y-sk button'),n=sk.querySelector('[data-yn]'),bars=sk.querySelectorAll('.bars i');
 bs.forEach(function(b){b.setAttribute('aria-pressed','false');b.addEventListener('click',function(){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');var k=sk.querySelectorAll('.y-sk [aria-pressed=true]').length;n.textContent=k;bars.forEach(function(x,i){x.classList.toggle('on',i<k)});sk.classList.toggle('full',k===7)})})}
var ds=R.querySelectorAll('[data-ydoors] .door');
if(ds.length){if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){ds.forEach(function(d){d.classList.add('open')})}else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var i=[].indexOf.call(ds,e.target);setTimeout(function(){e.target.classList.add('open')},300+i*250);io.unobserve(e.target)}})},{threshold:.35});ds.forEach(function(d){io.observe(d)})}}
})();
</script>
