(function(){
  /* One page serves every client project: /client-project?project=oneincome and so on.
     To fill in a project, add text to its entry below: line, services, and any of
     meet, start, goals, strategy, brand, website, details, built, result, words.
     Plain text. A blank line starts a new paragraph. Empty sections hide on the live site. */
  var IMG="@H@/site/images/portfolio/";
  var P={
   oneincome:{name:"The One Income Plan",client:"Brooke Watrous",industry:"Personal finance for one income families",url:"https://oneincomeplan.com/"},
   tammy:{name:"Fearless Business Boss",client:"Tammy",industry:"Business coaching for women service providers",url:"https://tammy.v2.showitpreview.com/home"},
   abroad:{name:"Marriage & Retirement Abroad",client:"",industry:"Retiring in France for couples 45 and better",url:"https://marriageandretirementabroad.showit.site/"},
   fizzy:{name:"Fizzy & Free",client:"",industry:"Alcohol free motherhood community",url:"https://fizzyandfree.showit.site/"},
   focusflow:{name:"H.E.R Focus & Flow",client:"",industry:"Systems and OBM services for purpose driven women",url:"https://herfocusandflow.showitpreview.com/home"},
   cajungirl:{name:"The Cajun Girl",client:"",industry:"Beginner sewing education and membership",url:"https://thecajungirl.com/"},
   datenight:{name:"The Date Night Project",client:"",industry:"Date nights, games and gifts for couples",url:"https://datenightproject.showit.site/"}
  };
  /* What each section should hold. Shown only in the template preview, never on the live site. */
  var GUIDE={
   meet:"Who she is, who she serves and why she started this business. Use her own details from the onboarding questionnaire.",
   start:"Where the business was when she came to you: what existed, what didn't, and what was holding her back.",
   goals:"The specific outcomes the project had to deliver: offers, audience, website, launch.",
   strategy:"The positioning, offer and customer journey decisions you made together before design began.",
   brand:"Colors, typefaces, imagery and the feeling the brand needed to create, with the reasons behind them.",
   website:"The pages you built and how each one supports her business. The screenshots below fill in automatically.",
   details:"The small custom touches: interactive features, signature design elements, mobile experience.",
   built:"A plain list of everything delivered in the agreed scope.",
   result:"What changed for her business after launch. Only real, confirmed results.",
   words:"Her testimonial, quoted word for word with her permission."
  };
  var root=document.querySelector('[data-cp]');if(!root)return;
  var demo=root.hasAttribute('data-cp-demo');
  var keys=Object.keys(P);
  var key=(new URLSearchParams(location.search).get('project')||'').toLowerCase();
  if(!P[key]&&demo)key=keys[0];
  function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML;}
  function paras(t){return t.split(/\n\s*\n/).map(function(x){return '<p>'+esc(x.trim())+'</p>';}).join('');}
  var secs=[].slice.call(root.querySelectorAll('[data-sec]'));
  var holder=secs[0].parentNode,order=secs.slice();
  function render(k){
    var p=P[k];
    if(!p){root.querySelector('[data-cp-name]').textContent='Client project';return;}
    if(!demo)document.title=p.name+' | Client Project | Boss Lady Bloggers';
    root.querySelector('[data-cp-name]').textContent=p.name;
    root.querySelector('[data-cp-line]').innerHTML=p.line?'<p class="cs-line">'+esc(p.line)+'</p>':(demo?'<p class="cs-line cs-ph">Add a one sentence summary of the project (line).</p>':'');
    var cc=root.querySelector('[data-cp-client-cell]');cc.hidden=!p.client;root.querySelector('[data-cp-client]').textContent=p.client||'';
    root.querySelector('[data-cp-industry]').textContent=p.industry;
    var sc=root.querySelector('[data-cp-services-cell]');sc.hidden=!(p.services||demo);root.querySelector('[data-cp-services]').innerHTML=p.services?esc(p.services):'<span class="cs-ph-i">Add services</span>';
    var v=root.querySelector('[data-cp-visit-row] a');v.href=p.url;v.target='_blank';v.rel='noopener';
    root.querySelector('[data-cp-mock]').innerHTML='<img src="'+IMG+k+'-mockup.jpg" alt="'+esc(p.name)+' website on a laptop and phone" width="1600" height="1100">';
    root.querySelector('[data-cp-shots]').innerHTML='<figure class="cs-desk"><span class="cs-bar"><b></b><b></b><b></b><em>'+esc(p.url.replace(/^https?:\/\//,'').replace(/\/.*$/,''))+'</em></span><img src="'+IMG+k+'-desktop.jpg" alt="'+esc(p.name)+' homepage, desktop" loading="lazy" width="1440" height="900"></figure><figure class="cs-ph-m"><img src="'+IMG+k+'-mobile.jpg" alt="'+esc(p.name)+' homepage, mobile" loading="lazy" width="390" height="844"></figure>';
    var rail='',n=0;
    order.forEach(function(s){
      var sk=s.getAttribute('data-sec'),t=p[sk],b=s.querySelector('[data-body]');
      if(t){b.innerHTML=sk==='words'?'<blockquote>'+paras(t)+'</blockquote>':paras(t);}
      else if(demo){b.innerHTML='<div class="cs-guide"><b>Template slot</b><p>'+esc(GUIDE[sk])+'</p><code>'+sk+'</code></div>';}
      else b.innerHTML='';
      var show=!!t||demo||sk==='website';
      if(show){if(!s.parentNode)holder.appendChild(s);n++;s.querySelector('.num').textContent=(n<10?'0':'')+n;s.id='cs-'+sk;
        rail+='<a href="#cs-'+sk+'"><span>'+(n<10?'0':'')+n+'</span>'+s.querySelector('h2').textContent+'</a>';}
      else if(s.parentNode)s.parentNode.removeChild(s);
    });
    root.querySelector('[data-cp-rail]').innerHTML='<div class="cs-w">'+rail+'</div>';
    var more=root.querySelector('[data-cp-more]');more.innerHTML='';
    keys.filter(function(x){return x!==k;}).slice(0,3).forEach(function(x){
      var a=document.createElement('a');a.href='/client-project?project='+x;a.setAttribute('data-k',x);
      a.innerHTML='<span class="shot"><img src="'+IMG+x+'-mockup.jpg" alt="" loading="lazy" width="1600" height="1100"></span><b>'+esc(P[x].name)+'</b><small>'+esc(P[x].industry)+'</small>';more.appendChild(a);
    });
    var sw=root.querySelector('[data-cp-switch]');
    sw.innerHTML=demo?'<span>Preview a project:</span>'+keys.map(function(x){return '<button type="button" data-k="'+x+'" aria-pressed="'+(x===k)+'">'+esc(P[x].name)+'</button>';}).join(''):'';
  }
  render(key);
  if(demo)root.addEventListener('click',function(e){var t=e.target.closest('[data-k]');if(!t)return;e.preventDefault();render(t.getAttribute('data-k'));window.scrollTo({top:0,behavior:'smooth'});});
})();
