(function(){
var S=document.getElementById('stage');
function el(html){var d=document.createElement('div');d.innerHTML=html.trim();var n=d.firstChild;S.appendChild(n);return n;}
function cl(x){return x<0?0:x>1?1:x}
function p(t,a,b){return cl((t-a)/(b-a))}
function eo(x){return 1-Math.pow(1-x,3)}
function eb(x){var c=1.70158;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)}
function win(t,a,b,f){f=f||.35;return Math.min(p(t,a,a+f),1-p(t,b-f,b))}
var T=67;
/* ---------- build ---------- */
// S1 cards (0-7.4)
var cards=[];for(var i=0;i<5;i++){cards.push(el('<div class="card" style="left:'+(160+i*90)+'px;top:'+(250+i*40)+'px"><b></b><i></i><i></i><i style="width:80%"></i><i></i><i style="width:60%"></i></div>'));}
var pins=[];for(var i=0;i<4;i++){pins.push(el('<svg width="70" height="90" viewBox="0 0 70 90" style="left:'+(620+ (i%2)*150)+'px;top:'+(230+Math.floor(i/2)*230)+'px"><path d="M35 4c16 0 28 12 28 28 0 20-28 54-28 54S7 52 7 32C7 16 19 4 35 4z" fill="#A23E66" stroke="#F6C9D8" stroke-width="3"/><circle cx="35" cy="32" r="10" fill="#FBF5EE"/></svg>'));}
var s1lbl=el('<div class="lbl" style="left:0;right:0;top:150px;text-align:center">Everything you were told to do</div>');
var check=el('<svg width="200" height="200" viewBox="0 0 200 200" style="left:440px;top:380px"><circle cx="100" cy="100" r="88" fill="rgba(42,20,33,.9)" stroke="#F6C9D8" stroke-width="5"/><path d="M58 104l28 28 56-64" fill="none" stroke="#F6C9D8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" id="ck"/></svg>');
// S2 $0 (7.4-11)
var zero=el('<div class="big" style="top:230px;font-size:360px">$0</div>');
var zlbl=el('<div class="lbl" style="left:0;right:0;top:620px;text-align:center">Your blog income this month</div>');
var flat=el('<svg width="800" height="200" viewBox="0 0 800 200" style="left:140px;top:700px"><path d="M0 150 L800 150" stroke="#F6C9D8" stroke-width="6" stroke-linecap="round" pathLength="1" stroke-dasharray="1" id="fl"/><path d="M0 0V190M0 190H800" stroke="rgba(246,201,216,.35)" stroke-width="3" fill="none"/></svg>');
// S3 AI typing + google (11-18.9)
var aiwin=el('<div style="position:absolute;left:120px;top:170px;width:840px;height:380px;border:3px solid #F6C9D8;border-radius:22px;background:rgba(42,20,33,.9);overflow:hidden"><div style="height:56px;border-bottom:2px solid rgba(246,201,216,.3);display:flex;align-items:center;gap:10px;padding:0 22px"><i style="width:14px;height:14px;border-radius:50%;background:#F6C9D8"></i><i style="width:14px;height:14px;border-radius:50%;background:#A23E66"></i><span style="margin-left:14px;font:700 20px Inter;letter-spacing:.16em;color:#F6C9D8">AI &middot; WRITING A BLOG POST</span></div><div id="ailines" style="padding:28px"></div></div>');
var ail=document.getElementById('ailines');var ailn=[];for(var i=0;i<9;i++){var d=document.createElement('i');d.style.cssText='display:block;height:14px;border-radius:7px;background:rgba(246,201,216,.5);margin-bottom:18px;width:0';ail.appendChild(d);ailn.push([d,[92,80,96,70,88,94,60,85,74][i]]);}
var timer=el('<div class="lbl" style="left:120px;top:580px;font-size:26px">Done in <span id="secs">0.0</span> seconds</div>');
var gbox=el('<div style="position:absolute;left:120px;top:640px;width:840px;border:3px solid #FBF5EE;border-radius:22px;background:#FBF5EE;color:#3A1C2A;padding:26px 30px"><div style="display:flex;align-items:center;gap:14px;font:600 26px Inter;border:2px solid #E9B9CA;border-radius:999px;padding:14px 22px"><svg width="26" height="26" viewBox="0 0 24 24"><circle cx="10" cy="10" r="7" fill="none" stroke="#A23E66" stroke-width="3"/><path d="M15 15l6 6" stroke="#A23E66" stroke-width="3" stroke-linecap="round"/></svg><span id="gq"></span></div><div id="gans" style="margin-top:20px;border-left:6px solid #A23E66;padding-left:18px"><b style="display:block;font:800 18px Inter;letter-spacing:.16em;color:#A23E66">AI ANSWER</b><i style="display:block;height:12px;border-radius:6px;background:#E9B9CA;margin-top:14px;width:95%"></i><i style="display:block;height:12px;border-radius:6px;background:#E9B9CA;margin-top:12px;width:80%"></i></div></div>');
var noclick=el('<div style="position:absolute;left:640px;top:930px;font:800 26px Inter;letter-spacing:.14em;color:#FBF5EE;background:#A23E66;border-radius:12px;padding:12px 18px;transform:rotate(-4deg)">0 CLICKS TO YOUR BLOG</div>');
// S4 too late (18.9-22.9) hourglass
var hg=el('<svg width="320" height="440" viewBox="0 0 320 440" style="left:380px;top:200px"><path d="M40 20h240M40 420h240" stroke="#F6C9D8" stroke-width="10" stroke-linecap="round"/><path d="M60 20c0 120 100 140 100 200S60 300 60 420M260 20c0 120-100 140-100 200s100 80 100 200" fill="none" stroke="#F6C9D8" stroke-width="6"/><path id="sandT" d="M90 60h140l-70 140z" fill="#A23E66"/><path id="sandB" d="M80 410h160l-80-60z" fill="#A23E66"/></svg>');
var late=el('<div class="big" style="top:700px;font-size:120px">Already <em>too late?</em></div>');
// S5 info everywhere / value (22.9-29.9)
var dots=[];for(var i=0;i<46;i++){var x=80+((i*197)%900),y=150+((i*131)%760);dots.push([el('<div style="position:absolute;left:'+x+'px;top:'+y+'px;width:'+(80+(i*37)%90)+'px;height:14px;border-radius:7px;background:rgba(246,201,216,.45)"></div>'),x,y,i]);}
var inf=el('<div class="big" style="top:330px;font-size:130px">Information<br>is everywhere.</div>');
var gem=el('<svg width="300" height="300" viewBox="0 0 300 300" style="left:390px;top:200px"><defs><radialGradient id="gg"><stop offset="0" stop-color="#F6C9D8" stop-opacity=".9"/><stop offset="1" stop-color="#F6C9D8" stop-opacity="0"/></radialGradient></defs><circle cx="150" cy="150" r="150" fill="url(#gg)"/><path d="M150 40l80 80-80 140-80-140z" fill="#A23E66" stroke="#FBF5EE" stroke-width="6" stroke-linejoin="round"/><path d="M70 120h160M150 40l-30 80 30 140 30-140z" fill="none" stroke="#FBF5EE" stroke-width="4" stroke-linejoin="round"/></svg>');
var val=el('<div class="big" style="top:560px;font-size:170px"><em>Value is not.</em></div>');
// S6 blueprint house (29.9-40.1)
var house=el('<svg width="760" height="640" viewBox="0 0 760 640" style="left:160px;top:150px"><g fill="none" stroke="#F6C9D8" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path id="h1" pathLength="1" stroke-dasharray="1" d="M40 600H720"/><path id="h2" pathLength="1" stroke-dasharray="1" d="M80 600V320H680V600"/><path id="h3" pathLength="1" stroke-dasharray="1" d="M40 330L380 60L720 330"/><path id="h4" pathLength="1" stroke-dasharray="1" d="M320 600V470H440V600"/></g><g font-family="Inter" font-weight="800" font-size="24" letter-spacing="3" fill="#FBF5EE" text-anchor="middle"><text id="t1" x="380" y="640">YOUR OFFER</text><text id="t2" x="200" y="420">YOUR BRAND</text><text id="t3" x="560" y="420">YOUR SALES</text><text id="t4" x="380" y="250">YOUR BUSINESS</text><text id="t5" x="380" y="455" font-size="20" fill="#F6C9D8">YOUR BLOG</text></g></svg>');
var hlbl=el('<div class="lbl" style="left:0;right:0;top:110px;text-align:center">Build the business first</div>');
var most=el('<div style="position:absolute;left:0;right:0;top:420px;text-align:center"><div style="display:inline-grid;grid-template-columns:repeat(6,90px);gap:14px" id="stack"></div><div class="lbl" style="position:static;margin-top:30px">Publishing more</div></div>');
var stk=document.getElementById('stack');var stks=[];for(var i=0;i<18;i++){var d=document.createElement('i');d.style.cssText='display:block;height:110px;border:3px solid rgba(246,201,216,.6);border-radius:10px';stk.appendChild(d);stks.push(d);}
var xmark=el('<svg width="420" height="420" viewBox="0 0 420 420" style="left:330px;top:330px"><path id="xm" d="M60 60L360 360M360 60L60 360" stroke="#A23E66" stroke-width="22" stroke-linecap="round" pathLength="1" stroke-dasharray="1"/></svg>');
// S7 Gen (40.1-48.5)
var gen=el('<img src="gen.png" style="position:absolute;left:470px;top:150px;width:520px;height:auto">');
var frame=el('<svg width="620" height="880" viewBox="0 0 620 880" style="left:420px;top:110px"><path id="fr" pathLength="1" stroke-dasharray="1" d="M20 860V310C20 150 150 20 310 20S600 150 600 310V860Z" fill="none" stroke="#F6C9D8" stroke-width="5"/></svg>');
var gname=el('<div style="position:absolute;left:60px;top:200px"><div class="lbl" style="position:static">Hi, I&rsquo;m</div><div style="font:400 104px/1 IS;color:#FBF5EE;margin-top:10px">Genasys</div><div style="font:700 24px/1.4 Inter;color:#F6C9D8;margin-top:10px">Founder of<br>Boss Lady Bloggers</div></div>');
var tags=[el('<div class="pill" style="left:60px;top:620px;background:#A23E66;padding:16px 24px;font:800 26px Inter">Aunt&rsquo;s basement</div>'),el('<div class="pill" style="left:60px;top:700px;background:#FBF5EE;color:#3A1C2A;padding:16px 24px;font:800 26px Inter">Single mom</div>'),el('<div class="pill" style="left:60px;top:780px;background:#F6C9D8;color:#3A1C2A;padding:16px 24px;font:800 26px Inter">Nap time hustle</div>')];
// S8 masterclass card (48.5-62.3)
var mc=el('<div style="position:absolute;left:90px;top:120px;width:900px;border:3px solid #F6C9D8;border-radius:30px;background:rgba(42,20,33,.92);padding:44px 50px"><div class="lbl" style="position:static">Free masterclass</div><div style="font:400 120px/.92 IS;margin:18px 0 30px">Futureproof<br><em style="color:#F6C9D8;font-style:italic">Your Blog</em></div><div id="mcl"></div></div>');
var mcl=document.getElementById('mcl');var mci=[];['What&rsquo;s actually happening to blogging','What people will still pay for','The business model I&rsquo;d build today'].forEach(function(x){var d=document.createElement('div');d.style.cssText='display:flex;align-items:center;gap:20px;margin-top:22px;font:800 34px/1.25 Inter';d.innerHTML='<b style="flex:none;width:52px;height:52px;border-radius:14px;border:3px solid #F6C9D8;display:grid;place-items:center;color:#2A1421;font-size:30px">&#10003;</b><span>'+x+'</span>';mcl.appendChild(d);mci.push(d);});
// S9 CTA (62.3-67)
var free=el('<div class="big" style="top:200px;font-size:230px"><em>It&rsquo;s free.</em></div>');
var btn=el('<div style="position:absolute;left:170px;top:560px;width:740px;height:150px;border-radius:999px;background:#FBF5EE;color:#3A1C2A;display:flex;align-items:center;justify-content:space-between;padding:0 26px 0 60px;font:800 52px Inter"><span>Save My Free Seat</span><i style="width:104px;height:104px;border-radius:50%;background:#A23E66;color:#fff;display:grid;place-items:center;font-style:normal;font-size:50px">&#8599;</i></div>');
var ring=el('<div style="position:absolute;left:170px;top:560px;width:740px;height:150px;border-radius:999px;border:6px solid #F6C9D8"></div>');
var cur=el('<svg width="90" height="110" viewBox="0 0 60 70" style="left:760px;top:660px"><path d="M4 4 L4 56 L18 44 L28 66 L38 61 L28 40 L46 40 Z" fill="#F6C9D8" stroke="#2A1421" stroke-width="3" stroke-linejoin="round"/></svg>');
var all=[];Array.prototype.forEach.call(S.children,function(c){all.push(c)});
/* ---------- captions ---------- */
var capEl=document.getElementById('cap');var hot=/^(paying|seconds|click|late|everywhere|value|not|business|blog|free|basement|mom|today|seat|now|futureproof)/i;
function caps(t){var ph=null;for(var i=0;i<W.length;i++){if(t>=W[i].s-0.05&&t<W[i].e){ph=W[i];break;}}
 if(!ph){capEl.innerHTML='';return;}
 capEl.innerHTML=ph.w.map(function(w){var on=t>=w[1];var h=on&&hot.test(w[0].replace(/[^A-Za-z]/g,''));return '<span class="'+(on?(h?'on hot':'on'):'')+'">'+w[0]+'</span>';}).join(' ');}
/* ---------- render ---------- */
function show(n,o,tr){n.style.opacity=o;if(tr!==undefined)n.style.transform=tr;}
window.render=function(t){
 all.forEach(function(c){c.style.opacity=0});
 document.getElementById('scan').style.top=((t*120)%1500-180)+'px';
 var m=Math.floor(t/60),s=Math.floor(t%60);document.getElementById('tc').textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
 document.getElementById('bar').style.width=(t/T*100)+'%';
 // S1
 var w=win(t,0,7.45);if(w>0){show(s1lbl,w);
  cards.forEach(function(c,i){var a=p(t,0.1+i*0.3,0.5+i*0.3);show(c,a*w,'translateY('+(40*(1-eo(a)))+'px) rotate('+((i-2)*3)+'deg)');});
  pins.forEach(function(c,i){var a=p(t,1.8+i*0.25,2.1+i*0.25);show(c,a*w,'scale('+eb(a)+')');});
  var a=p(t,3.9,4.6);show(check,a*w,'scale('+eb(a)+')');document.getElementById('ck').style.strokeDashoffset=1-p(t,4.1,4.9);}
 // S2
 w=win(t,7.4,11.05);if(w>0){var a=p(t,7.5,8.0);show(zero,w,'scale('+(0.7+0.3*eb(a))+')');show(zlbl,w*p(t,8.2,8.6));show(flat,w);document.getElementById('fl').style.strokeDashoffset=1-p(t,8.4,10.2);}
 // S3
 w=win(t,11.0,18.95);if(w>0){var a=p(t,11.6,14.2);show(aiwin,w,'translateY('+(30*(1-eo(p(t,11,11.5))))+'px)');
  ailn.forEach(function(l,i){l[0].style.width=(l[1]*cl(a*9-i))+'%';});
  show(timer,w*p(t,12,12.3));document.getElementById('secs').textContent=(Math.min(a,1)*7.9).toFixed(1);
  var g=p(t,14.4,14.9);show(gbox,w*g,'translateY('+(40*(1-eo(g)))+'px)');var q='is blogging still worth it';document.getElementById('gq').textContent=q.slice(0,Math.floor(q.length*p(t,14.8,16.2)));
  document.getElementById('gans').style.opacity=p(t,16.6,17.0);var nc=p(t,17.9,18.3);show(noclick,w*nc,'rotate(-4deg) scale('+eb(nc)+')');}
 // S4
 w=win(t,18.9,22.95);if(w>0){show(hg,w,'rotate('+(180*eo(p(t,21.4,22.4)))+'deg)');var f=p(t,19,21.4);document.getElementById('sandT').setAttribute('transform','translate(160 200) scale('+(1-f*0.85)+') translate(-160 -200)');document.getElementById('sandB').setAttribute('transform','translate(160 410) scale('+(0.2+f*0.8)+') translate(-160 -410)');var l=p(t,21.3,21.8);show(late,w*l,'translateY('+(30*(1-eo(l)))+'px)');}
 // S5
 w=win(t,22.9,29.95);if(w>0){var a=p(t,23,25.2),b=p(t,27.4,28.4);
  dots.forEach(function(d){var o=Math.min(cl(a*1.2-(d[3]%10)/12),1-b);show(d[0],w*o*0.9,'translate('+Math.sin(t*1.4+d[3])*8+'px,'+Math.cos(t*1.1+d[3])*6+'px)');});
  show(inf,w*Math.min(p(t,25.1,25.6),1-p(t,27.4,27.8)));var g=p(t,27.6,28.3);show(gem,w*g,'scale('+(0.4+0.6*eb(g))+') rotate('+(t*8)+'deg)');show(val,w*p(t,27.7,28.2));}
 // S6
 w=win(t,29.9,40.15);if(w>0){var a=p(t,30.1,30.5),x=p(t,34.0,34.8),h=p(t,35.3,35.8);
  show(most,w*Math.min(a,1-h));stks.forEach(function(d,i){d.style.opacity=cl(p(t,30.4,33.8)*18-i);});
  show(xmark,w*Math.min(x,1-h));document.getElementById('xm').style.strokeDashoffset=1-x;
  show(house,w*h);show(hlbl,w*h);['h1','h2','h3','h4'].forEach(function(id,i){document.getElementById(id).style.strokeDashoffset=1-p(t,35.6+i*0.6,36.4+i*0.6);});
  ['t1','t2','t3','t4','t5'].forEach(function(id,i){document.getElementById(id).style.opacity=p(t,36.6+i*0.55,37.0+i*0.55);});}
 // S7
 w=win(t,40.1,48.55);if(w>0){var g=p(t,40.2,40.9);show(gen,w*g,'translateY('+(40*(1-eo(g)))+'px)');show(frame,w);document.getElementById('fr').style.strokeDashoffset=1-p(t,40.2,41.6);show(gname,w*p(t,40.4,40.9));
  [43.4,44.7,47.2].forEach(function(s,i){var k=p(t,s,s+0.35);show(tags[i],w*k,'translateX('+(-40*(1-eo(k)))+'px)');});}
 // S8
 w=win(t,48.5,62.4);if(w>0){var g=p(t,48.6,49.3);show(mc,w,'scale('+(0.92+0.08*eo(g))+')');mc.style.opacity=w*g;
  [53.3,55.84,58.24].forEach(function(s,i){var k=p(t,s,s+0.4);mci[i].style.opacity=0.25+0.75*k;var b=mci[i].firstChild;b.style.background=k>0.5?'#F6C9D8':'transparent';b.style.color=k>0.5?'#2A1421':'transparent';});}
 // S9
 w=p(t,62.35,62.75);if(w>0){var f=p(t,62.6,63.2);show(free,w*f,'scale('+(0.8+0.2*eb(f))+')');var b=p(t,63.7,64.2);show(btn,b,'scale('+(0.85+0.15*eb(b))+')');
  var r=((t-64.2)%1.4)/1.4;show(ring,t>64.2?(1-r):0,'scale('+(1+r*0.12)+')');var c=p(t,64.6,65.4);show(cur,c,'translate('+(120*(1-eo(c)))+'px,'+(120*(1-eo(c)))+'px) scale('+(t>65.6&&t<65.9?0.85:1)+')');}
 caps(t);
};
render(0);
})();
