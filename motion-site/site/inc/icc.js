<script>

(function(){var R=document.querySelector('.bm');
/* ======= Paste The Interactive Course Creator checkout link here when it's ready ======= */
var CHECKOUT='';
if(CHECKOUT)Array.prototype.forEach.call(R.querySelectorAll('a[href="#enroll"]'),function(a){a.href=CHECKOUT;});
/* dashboard demo */
var d=R.querySelector('[data-labdash]');if(d){var ts=d.querySelectorAll('[data-labtasks] li'),ring=d.querySelector('[data-ring]'),rt=d.querySelector('[data-ringt]'),nx=d.querySelector('[data-next]'),xp=d.querySelector('[data-xp]'),bg=d.querySelectorAll('[data-badges] i'),rk=d.querySelectorAll('[data-ranks] span');
 function up(){var n=d.querySelectorAll('[data-labtasks] li.on').length,p=56+n*4;ring.style.strokeDashoffset=289*(1-p/100);rt.textContent=p+'%';xp.textContent=100+n*20;Array.prototype.forEach.call(bg,function(b,j){b.classList.toggle('on',j<2+n)});Array.prototype.forEach.call(rk,function(r,j){r.classList.toggle('on',j<(n===3?5:4))});var open=Array.prototype.filter.call(ts,function(t){return !t.classList.contains('on')});nx.textContent=open.length?open[0].textContent.replace('\u2713','').trim():'Rank up! You\u2019re a Board Builder.';}
 Array.prototype.forEach.call(ts,function(t){function tg(){t.classList.toggle('on');up();}t.addEventListener('click',tg);t.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();tg()}});});
 var tl=d.querySelectorAll('[data-ltools] button'),tm=d.querySelector('[data-ltoolmsg]');Array.prototype.forEach.call(tl,function(b){b.addEventListener('click',function(){Array.prototype.forEach.call(tl,function(x){x.setAttribute('aria-pressed',x===b)});tm.textContent=b.textContent+' is one of the working tools inside the course.';});});
 setTimeout(up,500);}
/* passport */
Array.prototype.forEach.call(R.querySelectorAll('[data-pp]'),function(i){i.addEventListener('input',function(){var k=i.getAttribute('data-pp');Array.prototype.forEach.call(R.querySelectorAll('[data-o="'+k+'"]'),function(m){m.textContent=i.value.trim()||i.getAttribute('placeholder');});});});
var cp=R.querySelector('[data-copyp]');if(cp)cp.addEventListener('click',function(){var t=R.querySelector('[data-prompt]').innerText.replace(/^Copy\s*/,'');if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){cp.textContent='Copied';setTimeout(function(){cp.textContent='Copy'},1800)});});
/* playbook */
var pb=R.querySelectorAll('[data-pb] div'),pk=0,pg=R.querySelector('[data-pbgo]');if(pg)pg.addEventListener('click',function(){if(pk<pb.length){pb[pk].classList.add('on');pk++;}if(pk>=pb.length){pg.textContent='Playbook full. Start over';pg.onclick=function(){Array.prototype.forEach.call(pb,function(x){x.classList.remove('on')});pk=0;pg.textContent='Complete a lesson';pg.onclick=null;};}});
/* quiz */
var qz=R.querySelector('[data-qz]');if(qz){var qm=qz.querySelector('[data-qzmsg]');Array.prototype.forEach.call(qz.querySelectorAll('button'),function(b){b.addEventListener('click',function(){Array.prototype.forEach.call(qz.querySelectorAll('button'),function(x){x.classList.remove('right','wrong')});if(b.getAttribute('data-a')==='1'){b.classList.add('right');qm.textContent='Correct. Everything collects in the Playbook. +10 XP';}else{b.classList.add('wrong');qm.textContent='Not quite. Try again.';}});});}
/* toggles */
function tog(sel,attr){var bs=R.querySelectorAll(sel+' button');Array.prototype.forEach.call(bs,function(b){b.addEventListener('click',function(){Array.prototype.forEach.call(bs,function(x){x.setAttribute('aria-selected',x===b)});Array.prototype.forEach.call(R.querySelectorAll('['+attr+']'),function(v){v.hidden=v.getAttribute(attr)!==b.getAttribute('data-k')});});});}
tog('[data-cmptog]','data-cview2');tog('[data-fit2]','data-fit2list');
/* count up */
var cn=R.querySelectorAll('[data-count]');if(cn.length&&'IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);var n=+e.target.getAttribute('data-count'),k=0;e.target.textContent='0';var iv=setInterval(function(){k++;e.target.textContent=k;if(k>=n)clearInterval(iv)},28);})});Array.prototype.forEach.call(cn,function(c){io.observe(c)});}else Array.prototype.forEach.call(cn,function(c){c.textContent=c.getAttribute('data-count')});
var tilt=R.querySelector('[data-tilt]');if(tilt&&!matchMedia('(prefers-reduced-motion: reduce)').matches){var im=tilt.querySelector('img');tilt.addEventListener('mousemove',function(e){var r=tilt.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;im.style.transform='scale(1.04) rotateY('+(x*6)+'deg) rotateX('+(-y*6)+'deg)';});tilt.addEventListener('mouseleave',function(){im.style.transform='';});}
})();


(function(){
 var root=document.querySelector('.bm');if(!root)return;
 var reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 function $(s,c){return (c||root).querySelector(s)}function $$(s,c){return Array.prototype.slice.call((c||root).querySelectorAll(s))}
 function onKey(el,fn){el.addEventListener('click',fn);el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();fn.call(el,e);}});}
 /* reveal + highlighter */
 var obs='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');obs.unobserve(e.target);}});},{threshold:.2}):null;
 $$('.rv,.hl').forEach(function(el){obs?obs.observe(el):el.classList.add('on');});
 /* hero tilt */
 var tilt=$('[data-tilt]');
 if(tilt&&!reduced){var shot=$('.shot',tilt);tilt.addEventListener('mousemove',function(e){var r=tilt.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;shot.style.transform='rotateY('+(x*10)+'deg) rotateX('+(-y*10)+'deg)';});tilt.addEventListener('mouseleave',function(){shot.style.transform='rotate(2deg)';});}
 /* 12 month check */
 var qs=$$('[data-check] .q'),verdict=$('[data-verdict]'),hint=$('[data-check-hint]');
 qs.forEach(function(q){$$('button',q).forEach(function(b){b.addEventListener('click',function(){$$('button',q).forEach(function(x){x.classList.remove('on')});b.classList.add('on');q.dataset.ans=b.dataset.a;
  if(qs.every(function(x){return x.dataset.ans})){verdict.classList.add('on');hint.textContent=qs.every(function(x){return x.dataset.ans==='y'})?'Love that. Keep reading, there is still a lot to build.':'Then keep reading.';}});});});
 /* to-do + months */
 var todo=$$('[data-todo] li'),month=$('[data-month]');
 todo.forEach(function(li){onKey(li,function(){li.classList.toggle('done');li.setAttribute('aria-checked',li.classList.contains('done'));var n=$$('[data-todo] li.done').length,month=$('[data-month]');if(month)month.textContent='Month '+(n+1);});});
 /* thoughts */
 var tc=$('[data-tcount]');$$('[data-thoughts] .chip').forEach(function(c){c.addEventListener('click',function(){c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')!=='true');var n=$$('[data-thoughts] .chip[aria-pressed=true]').length;if(tc)tc.textContent=n+' of '+$$('[data-thoughts] .chip').length+(n>=3?'. You are not the only one.':'');});});
 /* flip cards */
 $$('.pair').forEach(function(p){p.addEventListener('click',function(){p.classList.toggle('flip')});});
 /* dashboard */
 var have=$$('[data-have] li'),pri=$('[data-pri]'),dc=$('[data-dcount]'),db=$('[data-dbar]');
 have.forEach(function(li){onKey(li,function(){li.classList.toggle('on');var on=$$('[data-have] li.on').length;if(dc)dc.textContent=on+' / '+have.length;if(db)db.style.width=(on/have.length*100)+'%';
  var next=have.filter(function(x){return !x.classList.contains('on')})[0];if(pri)pri.textContent=next?next.textContent.replace('✓','').trim():'You know what you’re building, why, and what comes next.';});});
 /* rotating assets */
 var rot=$('[data-rot]'),items=['A completed offer.','A clearer brand message.','A finished sales page.','An email marketing system.','A website that supports your business goals.','A marketing plan you can realistically execute.'],ri=0;
 if(rot&&!reduced)setInterval(function(){rot.classList.add('out');setTimeout(function(){ri=(ri+1)%items.length;rot.textContent=items[ri];rot.classList.remove('out');},350);},2400);
 /* tabs */
 var tabs=$$('[data-tabs] .tab');
 function selTab(t){tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;document.getElementById(x.getAttribute('aria-controls')).classList.toggle('on',on);});}
 tabs.forEach(function(t,i){t.addEventListener('click',function(){selTab(t)});t.addEventListener('keydown',function(e){if(e.key==='ArrowDown'||e.key==='ArrowRight'){e.preventDefault();var n=tabs[(i+1)%tabs.length];selTab(n);n.focus();}if(e.key==='ArrowUp'||e.key==='ArrowLeft'){e.preventDefault();var p=tabs[(i+tabs.length-1)%tabs.length];selTab(p);p.focus();}});});
 /* modules */
 var M=[["Business foundations",["Understand the difference between operating a blog and building a business.","Establish your business model, direction, revenue goals and the role your blog plays in attracting potential customers.","Stop measuring your entire business by pageviews and start understanding what contributes to revenue."]],
 ["Audience and buyer psychology",["Go beyond basic audience demographics.","Understand what your potential customers want, what they’re struggling with, what motivates their buying decisions and why they might hesitate to purchase.","Learn how to build your business around the people you’re actually trying to serve."]],
 ["Offer creation and monetization",["Determine what makes sense for you to sell.","Explore offer opportunities, customer demand, validation, pricing and the relationship between your free content and paid solutions.","Build something around a meaningful customer problem rather than creating another product simply because you can."]],
 ["Brand positioning and messaging",["Develop a clearer understanding of what makes your business valuable and how to communicate that value.","Establish messaging that connects with potential buyers and helps them recognize why your offers are relevant to them."]],
 ["Website and customer pathways",["Understand how your website fits into the wider business.","Learn how your pages, content, navigation and offers can work together to guide visitors toward meaningful next steps.","Your website should support your business strategy, not exist separately from it."]],
 ["Front end sales",["Learn how to introduce new people to your business, build their interest, establish trust and create opportunities for them to become customers.","Understand how your content and marketing contribute to the beginning of your sales process."]],
 ["Back end sales",["Understand what happens after someone enters your world.","Develop strategies for nurturing your audience, communicating the value of your offers, generating sales and creating additional opportunities to serve existing customers."]],
 ["Prelaunch and launch strategy",["Learn how to prepare your audience for an offer, build interest, communicate its value and create a deliberate promotional strategy.","Stop creating products in isolation and announcing them to an audience that hasn’t been prepared to buy."]]];
 var mods=$$('[data-mods] .mod'),mp=$('[data-modpanel]'),mi=0;
 function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')}
 function showMod(i){mi=(i+8)%8;mods.forEach(function(b,j){b.setAttribute('aria-selected',j===mi)});mp.style.animation='none';void mp.offsetWidth;mp.style.animation='bfade .5s ease';
  mp.innerHTML='<p class="lbl">Module '+(mi+1)+' of 8</p><h3 style="font-size:clamp(30px,3.6vw,50px)">'+esc(M[mi][0])+'</h3>'+M[mi][1].map(function(t){return '<p>'+esc(t)+'</p>'}).join('');}
 mods.forEach(function(b,j){b.addEventListener('click',function(){showMod(j)})});
 if(mp){var mpv=$('[data-mprev]'),mnx=$('[data-mnext]');if(mpv)mpv.addEventListener('click',function(){showMod(mi-1)});if(mnx)mnx.addEventListener('click',function(){showMod(mi+1)});showMod(0);}
 /* roadmap picker */
 var road=$$('[data-road] li');
 function lightRoad(first){road.forEach(function(li,i){li.classList.remove('on','first');setTimeout(function(){li.classList.add('on');if(i===first)li.classList.add('first');},reduced?0:i*140);});}
 $$('[data-start] .chip').forEach(function(c){c.addEventListener('click',function(){$$('[data-start] .chip').forEach(function(x){x.setAttribute('aria-pressed',x===c)});lightRoad(+c.dataset.first);});});
 /* project steps */
 var steps=$$('[data-proj] li'),pct=$('[data-pct]'),pb=$('[data-pbar]'),pd=$('[data-pdone]');
 steps.forEach(function(li){onKey(li,function(){li.classList.toggle('on');var n=$$('[data-proj] li.on').length;pct.textContent=(n*10)+'%';pb.style.width=(n*10)+'%';pd.style.opacity=n===10?1:0;});});
 /* 90 days */
 var days=$$('[data-days] .day');days.forEach(function(d){d.addEventListener('click',function(){days.forEach(function(x){x.classList.toggle('on',x===d);x.setAttribute('aria-expanded',x===d)});});});
 /* cost */
 var cost=$('[data-cost]');$$('[data-costs] li').forEach(function(li){onKey(li,function(){li.classList.toggle('on');li.setAttribute('aria-checked',li.classList.contains('on'));cost.textContent=$$('[data-costs] li.on').length+' / '+$$('[data-costs] li').length;});});
 /* another... */
 var an=$('[data-another]'),aw=an?(an.getAttribute('data-words')||'').split('|'):[],ai=0;
 if(an&&aw.length>1&&!reduced)setInterval(function(){ai=(ai+1)%aw.length;an.style.opacity=0;setTimeout(function(){an.textContent=aw[ai];an.style.opacity=1;},300);},2200);
 if(an)an.style.transition='opacity .3s';
 /* fit toggle */
 $$('[data-fit] button').forEach(function(b){b.addEventListener('click',function(){$$('[data-fit] button').forEach(function(x){x.setAttribute('aria-selected',x===b)});$$('[data-fitlist]').forEach(function(l){l.hidden=l.dataset.fitlist!==b.dataset.k});});});
 /* video testimonials */
 $$('[data-yt]').forEach(function(b){b.addEventListener('click',function(){var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+b.getAttribute('data-yt')+'?autoplay=1&rel=0&modestbranding=1&playsinline=1';f.title=b.getAttribute('aria-label');f.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';f.allowFullscreen=true;b.parentNode.appendChild(f);b.remove();});});
 /* Black Friday note until Nov 30 2026 11:59 PM ET */
 var bf=$('[data-bf]');if(bf&&Date.now()<Date.UTC(2026,11,1,4,59,59))bf.hidden=false;
})();

(function(){
 var root=document.querySelector('.bm');if(!root)return;
 function $$(s){return Array.prototype.slice.call(root.querySelectorAll(s))}
 /* countdown */
 var END=Date.UTC(2026,11,1,4,59,59);
 var cds=$$('[data-cd]');
 function tick(){var d=Math.max(0,END-Date.now()),s=Math.floor(d/1000),v={d:Math.floor(s/86400),h:Math.floor(s%86400/3600),m:Math.floor(s%3600/60),s:s%60};
  cds.forEach(function(c){['d','h','m','s'].forEach(function(k){var e=c.querySelector('[data-'+k+']');if(e)e.textContent=(v[k]<10?'0':'')+v[k];});});}
 if(cds.length){tick();setInterval(tick,1000);}
 /* year progress */
 var yb=root.querySelector('[data-year]');
 if(yb){var n=new Date(),y=n.getFullYear(),a=new Date(y,0,1),b=new Date(y+1,0,1),pc=Math.min(100,Math.round((n-a)/(b-a)*100));
  setTimeout(function(){yb.querySelector('b').style.width=pc+'%';},400);var t=root.querySelector('[data-yearpc]');if(t)t.textContent=pc+'% of '+y+' is already behind you.';}
 /* skill picker */
 var sk=$$('[data-skills] .chip'),sc=root.querySelector('[data-skillcount]');
 sk.forEach(function(c){c.addEventListener('click',function(){c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')!=='true');var k=$$('[data-skills] .chip[aria-pressed=true]').length;if(sc)sc.textContent=k+' of '+sk.length+' skills added to your 2027 plan';});});
 /* filter */
 $$('[data-filter]').forEach(function(bar){var grid=root.querySelector(bar.getAttribute('data-filter'));if(!grid)return;
  Array.prototype.slice.call(bar.querySelectorAll('button')).forEach(function(b){b.addEventListener('click',function(){
   Array.prototype.slice.call(bar.querySelectorAll('button')).forEach(function(x){x.setAttribute('aria-pressed',x===b)});
   var f=b.getAttribute('data-f'),shown=0;Array.prototype.slice.call(grid.children).forEach(function(c){var on=f==='all'||(' '+(c.getAttribute('data-cat')||'')+' ').indexOf(' '+f+' ')>-1;c.hidden=!on;if(on)shown++;});
   var em=root.querySelector(grid.getAttribute('data-empty')||'[data-none]');if(em)em.hidden=shown>0;});});});
 /* finder: chips that reveal a result card */
 $$('[data-finder]').forEach(function(f){var bs=Array.prototype.slice.call(f.querySelectorAll('[data-pick]'));bs.forEach(function(b){b.addEventListener('click',function(){
  bs.forEach(function(x){x.setAttribute('aria-pressed',x===b)});
  Array.prototype.slice.call(f.querySelectorAll('[data-result]')).forEach(function(r){r.hidden=r.getAttribute('data-result')!==b.getAttribute('data-pick');if(!r.hidden){r.style.animation='none';void r.offsetWidth;r.style.animation='bfade .5s ease';}});});});});
 /* drag rail + arrows */
 $$('[data-rail]').forEach(function(r){var down=false,x0=0,s0=0;
  r.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;down=true;x0=e.clientX;s0=r.scrollLeft;r.classList.add('drag');});
  window.addEventListener('pointerup',function(){down=false;r.classList.remove('drag')});
  r.addEventListener('pointermove',function(e){if(down){r.scrollLeft=s0-(e.clientX-x0);}});
  var id=r.getAttribute('data-rail');Array.prototype.slice.call(root.querySelectorAll('[data-rail-btn="'+id+'"]')).forEach(function(b){b.addEventListener('click',function(){var c=r.firstElementChild;r.scrollBy({left:(+b.getAttribute('data-dir'))*((c?c.getBoundingClientRect().width:400)+20),behavior:'smooth'});});});});
 /* hover reveal stack (fan) toggle on tap */
 $$('[data-fan]').forEach(function(f){f.addEventListener('click',function(){f.classList.toggle('open')});});
 /* cross off list */
 $$('[data-cross] li').forEach(function(li){li.tabIndex=0;function t(){li.classList.toggle('x')}li.addEventListener('click',t);li.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();t();}});});
 /* latest blog posts */
 var lp=root.querySelector('[data-latest]');
 if(lp&&window.fetch){fetch('https://bossladybloggers.com/wp-json/wp/v2/posts?per_page=3&_embed').then(function(r){return r.json()}).then(function(posts){var cards=lp.querySelectorAll('a');(posts||[]).slice(0,cards.length).forEach(function(p,i){var a=cards[i];a.href=p.link;var t=a.querySelector('[data-title]');if(t)t.innerHTML=p.title.rendered;var m=p._embedded&&p._embedded['wp:featuredmedia']&&p._embedded['wp:featuredmedia'][0];var src=m&&((m.media_details&&m.media_details.sizes&&m.media_details.sizes.medium_large&&m.media_details.sizes.medium_large.source_url)||m.source_url);var box=a.querySelector('[data-img]');if(box&&src){var img=document.createElement('img');img.src=src;img.alt='';img.loading='lazy';box.appendChild(img);}});}).catch(function(){});}
})();
/* Flodesk forms: <form data-fd data-form-id="ID" data-next="/page"> */
(function(){
 var forms=document.querySelectorAll('.bm form[data-fd]');
 Array.prototype.forEach.call(forms,function(form){
  var msg=form.querySelector('[data-msg]'),btn=form.querySelector('button[type=submit]');
  form.addEventListener('submit',function(e){
   e.preventDefault();
   var id=form.getAttribute('data-form-id')||'',fn=form.querySelector('[name=firstName]'),em=form.querySelector('[name=email]');
   var name=fn?fn.value.trim():'',email=em?em.value.trim():'';
   if(fn&&!name){msg.textContent='Add your first name.';fn.focus();return;}
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.textContent='That email doesn’t look quite right yet.';em.focus();return;}
   if(!id){msg.textContent='Registration is opening soon. Please check back shortly.';return;}
   btn.disabled=true;msg.textContent='';
   var body={email:email,confirm_email_address:''};if(fn)body.firstName=name;
   try{sessionStorage.setItem('fpw_email',email)}catch(x){}
   fetch('https://form.flodesk.com/forms/'+id+'/submit',{method:'POST',mode:'no-cors',body:new URLSearchParams(body),keepalive:true}).catch(function(){}).then(function(){
    var nx=form.getAttribute('data-next');if(nx){location.href=nx;return;}
    form.innerHTML='<p style="font:400 26px/1.3 var(--font-display)">'+(form.getAttribute('data-done')||'You’re in. Check your inbox.')+'</p>';});
  });
 });
})();
/* form progress bars */
(function(){Array.prototype.forEach.call(document.querySelectorAll('.bm form.app'),function(f){var bar=document.querySelector('[data-appbar="'+(f.hasAttribute('data-app')?'app':'q')+'"] b');if(!bar)return;
 function up(){var fs=f.querySelectorAll('input[type=text],textarea'),names={},done=0,tot=0;Array.prototype.forEach.call(fs,function(e){tot++;if(e.value.trim())done++;});Array.prototype.forEach.call(f.querySelectorAll('input[type=radio]'),function(r){names[r.name]=names[r.name]||!!f.querySelector('input[name="'+r.name+'"]:checked');});for(var k in names){tot++;if(names[k])done++;}bar.style.width=(tot?done/tot*100:0)+'%';}
 f.addEventListener('input',up);f.addEventListener('change',up);});})();
/* ===== SKIM FIRST: show everything, no click needed ===== */
(function(){function run(){var R=document.querySelector('.bm');if(!R)return;var A=function(s,c){return Array.prototype.slice.call((c||R).querySelectorAll(s))};
 // rotating lines -> show every line
 A('[data-words]').forEach(function(el){var w=(el.getAttribute('data-words')||'').split('|').filter(function(x){return x.trim()});if(w.length<2)return;var n=document.createElement(el.tagName.toLowerCase()==='em'?'em':'span');n.className='sk-lines';w.forEach(function(x){var s=document.createElement('span');s.textContent=x;n.appendChild(s)});el.parentNode.style.minHeight='0';el.replaceWith(n);});
 // tabs -> every panel visible, with its title
 A('[data-tabs]').forEach(function(t){var tabs=A('[role=tab]',t),ps=A('[role=tabpanel]',t);ps.forEach(function(p,i){p.hidden=false;p.classList.add('on');if(!p.querySelector('h2,h3')&&tabs[i]){var h=document.createElement('h3');h.className='sk-h';var st=tabs[i].querySelector('strong');h.textContent=(st||tabs[i]).textContent.trim();p.insertBefore(h,p.firstChild);}});});
 // toggled views -> all visible with a heading
 ['data-fitlist','data-cview','data-yview','data-view'].forEach(function(at){A('['+at+']').forEach(function(v){var k=v.getAttribute(at),b=R.querySelector('button[data-k="'+k+'"]');v.hidden=false;v.style.display='';if(b){var g=b.closest('[role=tablist],.toggle')||b.parentNode;g.style.display='none';if(!v.previousElementSibling||!v.previousElementSibling.classList.contains('sk-h')){var h=document.createElement('p');h.className='sk-h';h.textContent=b.textContent.trim();v.parentNode.insertBefore(h,v);}}});});
 // buttons whose description sits in an attribute -> list them all
 A('[data-cyc],[data-orbit]').forEach(function(g){var ul=document.createElement('ul');ul.className='sk-list';A('button',g).forEach(function(b){var d=b.getAttribute('data-d')||b.getAttribute('data-t')||'';var li=document.createElement('li');var st=document.createElement('strong');st.textContent=b.textContent.trim().replace(/^(\d+)\s*/,'$1 ');li.appendChild(st);var sp=document.createElement('span');sp.innerHTML=d;li.appendChild(sp);ul.appendChild(li);});g.parentNode.insertBefore(ul,g);g.style.display='none';});
 A('[data-cyct],[data-cycd],[data-orbitt],[data-orbitd]').forEach(function(e){var c=e.closest('.card')||e;e.style.display='none';});
 // x-ray pins always on
 A('[data-xray]').forEach(function(x){x.classList.add('on')});
 // FAQs open
 A('details').forEach(function(d){d.open=true});
 // flip hints + click prompts out
 A('.pair small').forEach(function(s){if(/flip/i.test(s.textContent))s.remove()});
 A('p,span.lbl').forEach(function(el){var t=el.textContent.trim();if(t.length<110&&/^(tap|tick|flip|drag|hover|click|pick)\b/i.test(t)&&!el.querySelector('a,button,input')){el.style.display='none';return;}
  if(el.children.length===0){var nt=t.replace(/\s*(Tap|Tick|Flip|Drag|Click)( each| the| a| through| one| to| them)?[^.]{0,60}\.$/,'');if(nt!==t&&nt.length>20)el.textContent=nt;}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(run,0)});else setTimeout(run,0);})();
/* ===== CONTRAST GUARD: if any text ends up hard to read on its background, fix the text color ===== */
(function(){function pc(c){var m=c&&c.match(/rgba?\(([^)]+)\)/);if(!m)return null;var a=m[1].split(',').map(parseFloat);return [a[0],a[1],a[2],a.length>3?a[3]:1]}
function L(c){function f(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])}
function cr(a,b){var x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function bgOf(el){while(el&&el!==document.documentElement){var s=getComputedStyle(el);if(s.backgroundImage&&s.backgroundImage!=='none')return null;var c=pc(s.backgroundColor);if(c&&c[3]>0.85)return c;el=el.parentElement}return null}
function guard(){var R=document.querySelector('.bm');if(!R)return;R.querySelectorAll('*').forEach(function(e){var t='';for(var n=e.firstChild;n;n=n.nextSibling)if(n.nodeType===3)t+=n.textContent;if(t.trim().length<2)return;var s=getComputedStyle(e);var c=pc(s.color);if(!c)return;var b=bgOf(e);if(!b)return;var big=parseFloat(s.fontSize)>=24;var need=big?3:4.5;if(cr(c,b)>=need)return;var dark=L(b)<0.3;var it=s.fontStyle==='italic';var opts=dark?(it?[[246,201,216],[233,185,202],[251,245,238]]:[[251,245,238]]):(it?[[162,62,102],[58,28,42]]:[[58,28,42]]);for(var i=0;i<opts.length;i++){if(cr(opts[i],b)>=need){e.style.setProperty('color','rgb('+opts[i].join(',')+')','important');return}}e.style.setProperty('color',dark?'#FBF5EE':'#3A1C2A','important');});}
function go(){setTimeout(guard,60)}
if(document.readyState==='complete')go();else addEventListener('load',go);})();
/* Fast Track car drives to your current lap */
(function(){var c=document.querySelector('.bm [data-ftcar]');if(!c)return;var go=function(){c.classList.add('go')};if(!('IntersectionObserver' in window)){go();return}var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){setTimeout(go,250);io.disconnect()}},{threshold:.5});io.observe(c);})();

</script>
