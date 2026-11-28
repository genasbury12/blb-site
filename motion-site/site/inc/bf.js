<script>
(function(){var R=document.querySelector('.m');if(!R)return;
var END=new Date('2026-11-30T23:59:59-05:00').getTime();
function pad(n){return (n<10?'0':'')+n}
function tick(){var t=Math.max(0,END-Date.now()),d=Math.floor(t/864e5),h=Math.floor(t/36e5)%24,m=Math.floor(t/6e4)%60,s=Math.floor(t/1e3)%60;
 R.querySelectorAll('[data-cd]').forEach(function(c){c.querySelector('[data-u=d]').textContent=pad(d);c.querySelector('[data-u=h]').textContent=pad(h);c.querySelector('[data-u=m]').textContent=pad(m);c.querySelector('[data-u=s]').textContent=pad(s)})}
tick();setInterval(tick,1000);
R.querySelectorAll('[data-xstrike] button,[data-xfit] button').forEach(function(b){b.setAttribute('aria-pressed','false');b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on)})});
var plan=R.querySelector('[data-xplan]');if(plan){var bs=plan.querySelectorAll('.x-skills button'),n=plan.querySelector('[data-xn]'),f=plan.querySelector('.x-gauge .f');
 bs.forEach(function(b){b.setAttribute('aria-pressed','false');b.addEventListener('click',function(){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');var k=plan.querySelectorAll('.x-skills [aria-pressed=true]').length;n.textContent=k;f.style.strokeDashoffset=100-k/7*100;plan.classList.toggle('full',k===7)})})}
var nav=R.querySelectorAll('.x-specnav a');if(nav.length&&'IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)nav.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)})})},{rootMargin:'-40% 0px -55% 0px'});R.querySelectorAll('.x-specs article').forEach(function(a){io.observe(a)})}
})();
</script>
