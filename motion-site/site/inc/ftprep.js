<script>
(function(){var R=document.querySelector('.m');
/* ======= Your discovery tools (Claude artifacts). Add title, link and instructions for each when ready ======= */
var DISCOVERY=[
 /* {title:'Tool name',url:'https://claude.ai/...',instructions:'What to do and what to send back.'}, */
];
var d=R.querySelector('[data-disc]');if(d&&DISCOVERY.length){d.hidden=false;d.innerHTML=DISCOVERY.map(function(x,i){return '<div class="card"><span class="num">0'+(i+1)+'</span><h3>'+x.title+'</h3><p>'+x.instructions+'</p><a class="btn br" style="align-self:flex-start" target="_blank" rel="noopener" href="'+x.url+'">Open '+x.title+' &#8599;</a></div>';}).join('');}
var lock=R.querySelector('[data-lock]'),fr=R.querySelector('[data-calsrc]'),K='blb_ft_prepdone';
window.bmUnlockCal=function(scroll){if(lock)lock.remove();if(fr&&!fr.src)fr.src=fr.getAttribute('data-calsrc');try{sessionStorage.setItem(K,'1')}catch(x){}if(scroll){var s=document.getElementById('schedule');if(s)s.scrollIntoView({behavior:'smooth'});}};
try{if(sessionStorage.getItem(K))window.bmUnlockCal(false)}catch(x){}
var u=R.querySelector('[data-unlock]');if(u)u.addEventListener('click',function(){window.bmUnlockCal(false)});
var ls=R.querySelectorAll('[data-stepnav] a');if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)Array.prototype.forEach.call(ls,function(l){l.classList.toggle('on',l.getAttribute('href')==='#'+e.target.id)})})},{rootMargin:'-45% 0px -50% 0px'});['s1','s2','s3'].forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el)});}
})();
</script><script>
(function(){
  var TO='https://formsubmit.co/ajax/hello@bossladybloggers.com';var f=document.querySelector('[data-q]');if(!f)return;var msg=f.querySelector('.msg');
  f.addEventListener('submit',function(ev){ev.preventDefault();
    var v=function(n){var el=f.querySelector('[name="'+n+'"]');return el?el.value.trim():'';};
    if(!v('First name')){msg.textContent='Add your name.';return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('Email'))){msg.textContent='That email doesn’t look quite right yet.';return;}
    msg.textContent='';var b=f.querySelector('button');b.disabled=true;
    var data={_subject:'Fast Track questionnaire: '+v('First name'),_template:'table',_captcha:'false',_replyto:v('Email')};
    [].forEach.call(f.querySelectorAll('input[name],textarea[name]'),function(el){data[el.name]=el.value.trim();});
    fetch(TO,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
      .then(function(x){if(!x.ok)throw 0;f.innerHTML='<p class="done">Thank you. Your questionnaire is in. Your calendar is unlocked below.</p>';window.bmUnlockCal&&window.bmUnlockCal(true);})
      .catch(function(){b.disabled=false;msg.textContent='That didn’t send. Please try again in a moment.';});
  });
})();
</script>