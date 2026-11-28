<script>
(function(){
  var TO="https://formsubmit.co/ajax/hello@bossladybloggers.com";
  var f=document.querySelector('[data-app]');if(!f)return;var msg=f.querySelector('.msg');
  f.addEventListener('submit',function(ev){ev.preventDefault();
    var v=function(n){var el=f.querySelector('[name="'+n+'"]');return el?el.value.trim():'';};
    var r=function(n){var el=f.querySelector('input[name="'+n+'"]:checked');return el?el.value:'';};
    if(!v('First name')){msg.textContent='Add your first name.';return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('Email'))){msg.textContent='That email doesn’t look quite right yet.';return;}
    if(!r('Stage')){msg.textContent='Tell me where you are in your business right now.';return;}
    if(!v('What she wants to accomplish')){msg.textContent='Tell me what you want to accomplish.';return;}
    if(!r('Investment ready')){msg.textContent='Answer the investment question so I can review your application.';return;}
    msg.textContent='';var b=f.querySelector('button');b.disabled=true;
    var data={_subject:'Fast Track Call application: '+v('First name'),_template:'table',_captcha:'false',_replyto:v('Email')};
    ['First name','Email','Website','About and what she has built','What she wants to accomplish','Support she is looking for'].forEach(function(n){data[n]=v(n);});
    data['Stage']=r('Stage');data['Investment ready']=r('Investment ready');
    fetch(TO,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
      .then(function(x){if(!x.ok)throw 0;f.innerHTML='<p class="done">Thank you. Your application is in.</p>';location.href='/application-confirmation';})
      .catch(function(){b.disabled=false;msg.textContent='That didn’t send. Please try again in a moment.';});
  });
})();
</script>