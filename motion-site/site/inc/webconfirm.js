<script>
(function(){var R=document.querySelector('.m');
var c=R.querySelector('[data-confetti]');if(c&&!matchMedia('(prefers-reduced-motion: reduce)').matches){var cols=['#A23E66','#E9B9CA','#3A1C2A','#F6C9D8'];for(var i=0;i<60;i++){var e=document.createElement('i');e.style.left=Math.random()*100+'%';e.style.background=cols[i%4];e.style.animationDelay=(Math.random()*1.2)+'s';c.appendChild(e);}}
var em='';try{em=sessionStorage.getItem('fpw_email')||''}catch(x){}
if(em){R.querySelector('[data-wemail]').textContent=' at '+em;R.querySelector('[data-wemailfield]').value=em;}
var bs=R.querySelectorAll('[data-bels] button'),bm=R.querySelector('[data-belmsg]');Array.prototype.forEach.call(bs,function(b){b.addEventListener('click',function(){Array.prototype.forEach.call(bs,function(x){x.setAttribute('aria-pressed',x===b)});bm.textContent='Hold onto that one. We&rsquo;ll talk about it.'.replace('&rsquo;','\u2019');});});
var sh=R.querySelector('[data-share]'),sm=R.querySelector('[data-sharemsg]'),url='https://www.bossladybloggers.com/futureproof-your-blog';
sh.addEventListener('click',function(){if(navigator.share){navigator.share({title:'Futureproof Your Blog',text:'A free masterclass with Genasys of Boss Lady Bloggers.',url:url}).catch(function(){});}else if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){sm.textContent='Link copied: '+url;});}else{sm.textContent=url;}});
var f=R.querySelector('[data-wprep]');if(f){var msg=f.querySelector('.msg');f.addEventListener('submit',function(ev){ev.preventDefault();var r=f.querySelector('input[name="Stage"]:checked');var v=function(n){var el=f.querySelector('[name="'+n+'"]');return el?el.value.trim():''};
 if(!r){msg.textContent='Tell me where you are in your blogging business.';return;}
 var data={_subject:'Futureproof Your Blog prep answers'+(em?': '+em:''),_template:'table',_captcha:'false',Stage:r.value,'Biggest concern':v('Biggest concern'),'What she wants to accomplish':v('What she wants to accomplish'),'Her question for Genasys':v('Her question for Genasys'),Email:em};if(em)data._replyto=em;
 msg.textContent='';var b=f.querySelector('button');b.disabled=true;
 fetch('https://formsubmit.co/ajax/hello@bossladybloggers.com',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)}).then(function(x){if(!x.ok)throw 0;f.innerHTML='<p class="done">Thank you. I can&rsquo;t wait to read your answers.</p>';}).catch(function(){b.disabled=false;msg.textContent='That didn\u2019t send. Please try again in a moment.';});});}
})();
</script>