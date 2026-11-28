(function(){var R=document.querySelector('.m');if(!R)return;
function A(s,c){return Array.prototype.slice.call((c||R).querySelectorAll(s));}
/* tick lists with a counter */
A('[data-fyticks]').forEach(function(g){var bs=A('button',g),box=g.parentNode,cnt=box.querySelector('[data-fycount]'),bar=box.querySelector('[data-fybar]'),done=box.querySelector('[data-fydone]');
 function up(){var n=bs.filter(function(b){return b.getAttribute('aria-pressed')==='true'}).length;if(cnt)cnt.textContent=n+' / '+bs.length;if(bar)bar.style.width=(n/bs.length*100)+'%';if(done)done.classList.toggle('on',n===bs.length);}
 bs.forEach(function(b){b.setAttribute('aria-pressed','false');b.addEventListener('click',function(){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true');up();});});up();});
/* reveal one at a time */
A('[data-fyreveal]').forEach(function(w){var li=A('li',w),btn=w.parentNode.querySelector('[data-fyrevealbtn]'),k=0;if(!li.length)return;li[0].classList.add('on');k=1;
 if(btn)btn.addEventListener('click',function(){if(k<li.length){li[k].classList.add('on');k++;}if(k>=li.length){btn.style.display='none';var after=w.parentNode.querySelector('[data-fyafter]');if(after)after.hidden=false;}});});
/* tabs */
A('[data-fytabs]').forEach(function(t){var bs=A('[data-fyt]',t),ps=A('[data-fyp]',t);
 function go(i){bs.forEach(function(b,j){b.setAttribute('aria-pressed',j===i?'true':'false')});ps.forEach(function(p,j){p.classList.toggle('on',j===i)});}
 bs.forEach(function(b,i){b.addEventListener('click',function(){go(i)})});go(0);});
})();
