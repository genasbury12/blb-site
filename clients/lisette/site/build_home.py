#!/usr/bin/env python3
"""Homepage for Marriage & Retirement Abroad. Run: python3 build_home.py
ALL COPY IS DRAFT until Lisette approves (she asked for input on copy)."""
from builder import page, faq_schema, faq_html

FAQS = [
 ("Is there a retirement visa for Americans who want to retire in France?",
  "Yes. Most American retirees use France's long stay visitor visa, which is renewable year after year. The paperwork looks intimidating, but it is very doable once someone shows you the order to do it in. Getting you organized for it is a core part of your plan."),
 ("How much do we need to retire comfortably in France?",
  "Less than most couples expect. It depends on the region and the lifestyle you want, which is exactly why your plan is built around your dream, not a generic number. Many towns in the South of France cost less month to month than a comparable life in a US city."),
 ("Do we need to speak French before we move?",
  "No. You can absolutely start this journey with zero French. That said, a little French opens a lot of doors and hearts, so couples in our world get French and culture training made just for this move. I lived in France for years and speak fluent French, and I will make it fun."),
 ("How do French people treat Americans who retire there?",
  "Warmly, especially when you arrive curious and willing to try. A friendly bonjour and a little effort with the culture go a very long way. We prepare you for the customs that matter so you feel like a neighbor, not a tourist."),
 ("What if we are not one hundred percent sure we are ready?",
  "That is exactly why the Practice Retirement Trip exists. You spend a few weeks in Provence living like retirees, not tourists, and then decide with real experience instead of guesses. No pressure, just clarity."),
]

CSS = r"""
/* hero */
.hero{padding:70px 0 90px}
.hgrid{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
.hero h1{font-size:clamp(46px,6.4vw,84px);margin:16px 0 8px}
.hero h1 .tw{color:var(--lav);font-style:italic;border-bottom:4px solid var(--gold);min-height:1em;display:inline-block}
.hero .lede{margin:18px 0 30px}
.hctas{display:flex;gap:16px;flex-wrap:wrap;align-items:center}
.hphoto{position:relative}
.hphoto .arch .ph{min-height:520px}
.hphoto .spinbadge{position:absolute;left:-40px;bottom:52px;filter:drop-shadow(0 10px 18px rgba(47,40,56,.25))}
.hnote{position:absolute;right:-8px;top:-16px;z-index:3;transform:rotate(4deg);background:#fff;
  border:1px solid rgba(106,87,158,.18);border-radius:14px;padding:10px 18px;
  font-family:var(--script);font-size:24px;color:var(--deep);box-shadow:var(--shadow)}
.squig{width:150px;margin-top:10px}

/* question pill marquee */
.qsect{padding:64px 0;background:var(--tint)}
.qsect .marq{padding:10px 0}
.qsect .chip{margin:0;flex:none;background:#fff}
.qsect .mtrack{gap:16px}
.qhead{text-align:center;max-width:640px;margin:0 auto 26px}

/* old way / new way toggle */
.waysect .wgrid{display:grid;grid-template-columns:1fr;gap:0;max-width:860px;margin:40px auto 0}
.wswitch{display:flex;justify-content:center;gap:0;margin-bottom:34px}
.wswitch button{font-family:var(--sans);font-weight:600;font-size:15.5px;letter-spacing:.06em;
  padding:14px 30px;border:2px solid var(--lav);background:#fff;color:var(--deep);cursor:pointer}
.wswitch button:first-child{border-radius:60px 0 0 60px}
.wswitch button:last-child{border-radius:0 60px 60px 0}
.wswitch button.on{background:var(--lav);color:#fff}
.wpanel{display:none}
.wpanel.on{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.wcard{border-radius:var(--rad);padding:26px 28px;font-size:16.5px}
.wcard b{font-family:var(--serif);font-size:20px;display:block;margin-bottom:6px}
.wpanel.old .wcard{background:#F3EDE4;color:#6E6357;border:1px dashed #C9BBA6}
.wpanel.new .wcard{background:#fff;border:1px solid rgba(106,87,158,.16);box-shadow:var(--shadow)}
.wpanel.new .wcard b{color:var(--lav)}

/* stats band */
.stats .sgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:30px;text-align:center;margin-top:46px}
.stats .num{font-family:var(--serif);font-size:clamp(52px,6vw,84px);color:var(--gold);line-height:1}
.stats .slab{font-size:14px;letter-spacing:.2em;text-transform:uppercase;margin-top:10px;color:#CFC8DA}

/* timeline */
.tl{position:relative;max-width:900px;margin:56px auto 0}
.tline{position:absolute;left:50%;top:0;bottom:0;width:3px;margin-left:-1.5px;
  background:linear-gradient(var(--lav),var(--gold));transform-origin:top;transform:scaleY(0)}
.tstep{display:grid;grid-template-columns:1fr 76px 1fr;align-items:center;margin-bottom:44px}
.tstep .tnum{width:76px;height:76px;border-radius:50%;background:var(--paper);border:2px solid var(--lav);
  display:flex;align-items:center;justify-content:center;font-family:var(--script);
  font-size:32px;color:var(--lav);z-index:1;justify-self:center}
.tstep .tcard{background:#fff;border-radius:var(--rad);padding:28px 30px;box-shadow:var(--shadow);
  border:1px solid rgba(106,87,158,.12)}
.tstep .tcard h3{font-size:26px;margin-bottom:8px}
.tstep .tcard h3 em{font-family:var(--script);font-style:normal;color:var(--gold);font-size:30px}
.tstep .tcard p{font-size:16.5px;color:var(--muted)}
.tstep:nth-child(odd) .tcard{grid-column:1}
.tstep:nth-child(odd) .tnum{grid-column:2}
.tstep:nth-child(even) .tcard{grid-column:3;grid-row:1}
.tstep:nth-child(even) .tnum{grid-column:2;grid-row:1}

/* offers */
.offers .ogrid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;margin-top:48px}
.ocard{padding:34px 30px;position:relative;display:flex;flex-direction:column;gap:14px}
.ocard .otag{position:absolute;top:-14px;left:26px;background:var(--gold);color:#fff;
  border-radius:60px;padding:6px 18px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:600}
.ocard.feat{border:2px solid var(--lav);transform:translateY(-10px)}
.ocard.feat .otag{background:var(--lav)}
.ocard h3{font-size:27px}
.ocard h3 em{font-family:var(--script);font-style:normal;color:var(--lav)}
.ocard p{font-size:16px;color:var(--muted);flex:1}
.ocard .ph{min-height:150px;border-radius:14px}
.ocard .btn{align-self:flex-start;padding:13px 26px;font-size:14.5px}

/* about */
.about .agrid{display:grid;grid-template-columns:.95fr 1.05fr;gap:60px;align-items:center}
.pcluster{position:relative;min-height:520px}
.pol{position:absolute;background:#fff;padding:12px 12px 44px;box-shadow:var(--shadow);
  border-radius:6px;cursor:pointer;transition:transform .3s}
.pol .ph{min-height:200px;width:220px}
.pol figcaption{font-family:var(--script);font-size:22px;color:var(--deep);text-align:center;margin-top:10px}
.pol:nth-child(1){top:0;left:4%;transform:rotate(-5deg)}
.pol:nth-child(2){top:120px;right:2%;transform:rotate(4deg)}
.pol:nth-child(3){bottom:0;left:16%;transform:rotate(-2deg)}
.pol:hover{transform:rotate(0) scale(1.04);z-index:5}
.afacts{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}

/* freebie */
.freebie .fgrid2{display:grid;grid-template-columns:1.1fr .9fr;gap:50px;align-items:center}
.fcard{padding:38px 36px;position:relative;overflow:hidden}
.fcard::before{content:"GRATUIT";position:absolute;top:22px;right:-42px;transform:rotate(45deg);
  background:var(--gold);color:#fff;font-size:11px;font-weight:600;letter-spacing:.22em;padding:7px 50px}
.fcard h3{font-size:30px;margin-bottom:16px}
.fcard ul{list-style:none;margin:0 0 24px}
.fcard li{padding:9px 0 9px 38px;position:relative;font-size:16.5px;border-bottom:1px dashed rgba(106,87,158,.18)}
.fcard li::before{content:"";position:absolute;left:0;top:12px;width:22px;height:22px;border-radius:7px;
  border:2px solid var(--lav);background:var(--blush)}
.fcard li::after{content:"\2713";position:absolute;left:5px;top:9px;color:var(--deep);font-weight:700;font-size:14px}

/* final cta */
.final{text-align:center;padding:120px 0}
.final .h2{max-width:760px;margin:14px auto 18px;font-size:clamp(38px,5.2vw,62px);
  background:linear-gradient(100deg,#F4EFE7 30%,var(--gold) 50%,#F4EFE7 70%);
  background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:shimmer 5s linear infinite}
@keyframes shimmer{to{background-position:-220% 0}}
.final .lede{margin:0 auto 34px}

@media(max-width:920px){
  .hgrid,.about .agrid,.freebie .fgrid2{grid-template-columns:1fr}
  .hphoto .arch .ph{min-height:420px}
  .hphoto .spinbadge{left:auto;right:10px;bottom:-26px}
  .wpanel.on{grid-template-columns:1fr}
  .stats .sgrid{grid-template-columns:repeat(2,1fr)}
  .offers .ogrid{grid-template-columns:1fr}
  .ocard.feat{transform:none}
  .tl .tstep{grid-template-columns:56px 1fr;margin-bottom:26px}
  .tline{left:28px}
  .tstep .tnum{grid-column:1!important;grid-row:1;width:56px;height:56px;font-size:24px}
  .tstep .tcard{grid-column:2!important;grid-row:1;margin-left:14px}
  .pcluster{min-height:600px}
  .pol .ph{width:180px;min-height:170px}
}
"""

JS = r"""
(function(){
  // old way / new way toggle
  var btns=document.querySelectorAll('.wswitch button');
  var panels={old:document.querySelector('.wpanel.old'),new:document.querySelector('.wpanel.new')};
  btns.forEach(function(b){ b.addEventListener('click',function(){
    btns.forEach(function(x){x.classList.remove('on')}); b.classList.add('on');
    var k=b.getAttribute('data-w');
    for(var p in panels){ panels[p].classList.toggle('on',p===k); }
  });});

  // scroll-drawn timeline line
  var tl=document.querySelector('.tl'), line=document.querySelector('.tline');
  if(tl&&line){
    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){ line.style.transform='scaleY(1)'; }
    else{
      var draw=function(){
        var r=tl.getBoundingClientRect();
        var p=(window.innerHeight*0.75-r.top)/r.height;
        line.style.transform='scaleY('+Math.max(0,Math.min(1,p))+')';
      };
      window.addEventListener('scroll',draw,{passive:true}); draw();
    }
  }

  // polaroids: tap brings to front
  document.querySelectorAll('.pol').forEach(function(p){
    p.addEventListener('click',function(){
      document.querySelectorAll('.pol').forEach(function(x){x.style.zIndex=1});
      p.style.zIndex=6;
    });
  });
})();
"""

BADGE_SVG = """<div class="spinbadge"><svg viewBox="0 0 120 120">
<defs><path id="circ" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs>
<text font-family="Jost,sans-serif" font-size="10.5" fill="#4F3F7E">
<textPath href="#circ" textLength="288" lengthAdjust="spacingAndGlyphs">RETIRE IN FRANCE &#8226; ENSEMBLE &#8226; OUI OUI &#8226;</textPath>
</text></svg><div class="mid">&#10047;</div></div>"""

SQUIG = """<svg class="squig" viewBox="0 0 150 14" fill="none">
<path d="M2 9 C 20 2, 35 12, 52 7 S 90 2, 108 8 S 138 12, 148 5"
stroke="#B9944E" stroke-width="3" stroke-linecap="round"/></svg>"""

content = f"""
<section class="hero">
  <div class="ghostword" style="top:16px;right:-30px">Provence</div>
  <div class="wrap hgrid">
    <div>
      <span class="eyebrow">For couples 45 and better</span>
      <h1>Retire in France<br><span class="tw" data-words='["together.","with confidence.","without the overwhelm.","sooner than you think."]'>together.</span></h1>
      {SQUIG}
      <p class="lede">You have dreamed about it for years. The village market, the long lunches,
      the lavender fields. Marriage &amp; Retirement Abroad helps married couples plan, practice,
      and live that dream in the South of France, with someone who has lived it walking beside you.</p>
      <div class="hctas">
        <a class="btn" href="book.html">Plan Your Retirement</a>
        <a class="btn ghost" href="freebie.html">Get the Free Checklist</a>
      </div>
    </div>
    <div class="hphoto">
      <div class="hnote">wake up and smell the lavender</div>
      <div class="arch"><div class="ph field"><span>Photo coming soon<br>Lisette &amp; her husband in Provence</span></div></div>
      {BADGE_SVG}
    </div>
  </div>
</section>

<section class="qsect">
  <div class="wrap qhead">
    <span class="eyebrow" style="justify-content:center">Sound familiar?</span>
    <h2 class="h2" style="font-size:clamp(30px,3.8vw,44px)">The questions keeping your dream on hold</h2>
  </div>
  <div class="marq"><div class="mtrack" aria-hidden="true">
    <span class="chip">Is there a retirement visa for Americans?</span>
    <span class="chip solid">How much do we need to retire in France?</span>
    <span class="chip">Where are the best places to retire in France?</span>
    <span class="chip solid">Is French hard to learn?</span>
    <span class="chip">Is there a retirement visa for Americans?</span>
    <span class="chip solid">How much do we need to retire in France?</span>
    <span class="chip">Where are the best places to retire in France?</span>
    <span class="chip solid">Is French hard to learn?</span>
  </div></div>
  <div class="marq"><div class="mtrack rev" aria-hidden="true">
    <span class="chip solid">How will the French treat us?</span>
    <span class="chip">What do we do about healthcare?</span>
    <span class="chip solid">Do we have to wait until 65?</span>
    <span class="chip">Where do we even start?</span>
    <span class="chip solid">How will the French treat us?</span>
    <span class="chip">What do we do about healthcare?</span>
    <span class="chip solid">Do we have to wait until 65?</span>
    <span class="chip">Where do we even start?</span>
  </div></div>
  <p style="text-align:center;margin-top:26px"><span class="hand lav">good news: every one of these has an answer</span></p>
</section>

<section class="sect waysect">
  <div class="wrap">
    <div style="text-align:center;max-width:640px;margin:0 auto">
      <span class="eyebrow" style="justify-content:center">Two ways to do this</span>
      <h2 class="h2">DIY overwhelm, or a guided path</h2>
    </div>
    <div class="wgrid">
      <div class="wswitch">
        <button data-w="old">The DIY Way</button>
        <button class="on" data-w="new">The MRA Way</button>
      </div>
      <div class="wpanel old">
        <div class="wcard"><b>47 open browser tabs</b>Conflicting visa advice from forums, half of it outdated, none of it about your situation.</div>
        <div class="wcard"><b>Analysis paralysis</b>Every region looks lovely on Instagram. You still have no idea where you would actually be happy.</div>
        <div class="wcard"><b>Google Translate courage</b>You are not sure you could order coffee, let alone open a bank account.</div>
        <div class="wcard"><b>The someday shelf</b>The dream stays parked next to the exercise bike. Years pass.</div>
      </div>
      <div class="wpanel new on">
        <div class="wcard"><b>One clear roadmap</b>A step by step plan built around your dream, your budget, and your timeline. You always know the next move.</div>
        <div class="wcard"><b>A shortlist made for two</b>We match regions and towns to how you both actually want to live, then you go feel them in person.</div>
        <div class="wcard"><b>French with a friend</b>Culture and language training from a fluent speaker who lived there, made for couples like you.</div>
        <div class="wcard"><b>Practice before you promise</b>Test drive retirement in Provence for a few weeks before you commit to anything.</div>
      </div>
    </div>
  </div>
</section>

<section class="sect ink stats">
  <div class="ghostword" style="bottom:-30px;left:-20px;-webkit-text-stroke-color:rgba(255,255,255,.08)">Ensemble</div>
  <div class="wrap">
    <div style="text-align:center;max-width:620px;margin:0 auto">
      <span class="eyebrow">The promise</span>
      <h2 class="h2">Simple on purpose</h2>
      <p class="lede" style="margin:0 auto">No jargon, no overwhelm, no one-size-fits-all plans. Here is the whole philosophy in numbers.</p>
    </div>
    <div class="sgrid">
      <div><div class="num" data-count="3">0</div><div class="slab">Simple phases</div></div>
      <div><div class="num" data-count="1">0</div><div class="slab">Practice trip</div></div>
      <div><div class="num" data-count="100">0</div><div class="slab">Percent tailored to you</div></div>
      <div><div class="num" data-count="0">0</div><div class="slab">Guesswork</div></div>
    </div>
  </div>
</section>

<section class="sect">
  <div class="wrap">
    <div style="text-align:center;max-width:640px;margin:0 auto">
      <span class="eyebrow" style="justify-content:center">How it works</span>
      <h2 class="h2">Dream it. Practice it. Live it.</h2>
    </div>
    <div class="tl">
      <div class="tline"></div>
      <div class="tstep">
        <div class="tcard"><h3><em>un.</em> Dream it</h3><p>We map your dream retirement together: the region, the rhythm, the budget, the bucket list. You leave with a custom lifestyle plan and a clear order of operations for visas, paperwork, and logistics.</p></div>
        <div class="tnum">1</div>
      </div>
      <div class="tstep">
        <div class="tnum">2</div>
        <div class="tcard"><h3><em>deux.</em> Practice it</h3><p>Join the Practice Retirement Trip in Provence. A few weeks living like locals, not tourists. Markets, neighbors, slow mornings. You come home knowing, not wondering.</p></div>
      </div>
      <div class="tstep">
        <div class="tcard"><h3><em>trois.</em> Live it</h3><p>When you are ready, we put the plan in motion. Paperwork organized, French lessons underway, a soft landing waiting. You pack up and start living the dream, with support the whole way.</p></div>
        <div class="tnum">3</div>
      </div>
    </div>
  </div>
</section>

<section class="sect tint offers">
  <div class="wrap">
    <div style="text-align:center;max-width:660px;margin:0 auto">
      <span class="eyebrow" style="justify-content:center">Ways to work together</span>
      <h2 class="h2">Your path to la belle vie</h2>
      <p style="margin-top:-4px"><span class="hand">high touch, small numbers, big dreams</span></p>
    </div>
    <div class="ogrid">
      <div class="card ocard">
        <span class="otag">Limited spots</span>
        <div class="ph sunset"><span>Photo coming soon</span></div>
        <h3>1:1 Lifestyle <em>Planning</em></h3>
        <p>A retirement plan custom made for the two of you. Region shortlist, timeline, budget frame, and the exact order to do everything in.</p>
        <a class="btn ghost" href="book.html">Book a Call</a>
      </div>
      <div class="card ocard feat">
        <span class="otag">Signature</span>
        <div class="ph field"><span>Photo coming soon</span></div>
        <h3>The Practice <em>Retirement Trip</em></h3>
        <p>The heart of it all. A short, fully organized stay in Provence to test drive your French retirement before you commit. Late spring and early summer departures.</p>
        <a class="btn" href="trip.html">Explore the Trip</a>
      </div>
      <div class="card ocard">
        <span class="otag">Coming soon</span>
        <div class="ph"><span>Photo coming soon</span></div>
        <h3>French for <em>Your New Life</em></h3>
        <p>Language and culture training built for couples moving to France. Real conversations for markets, neighbors, and paperwork, taught with joy.</p>
        <a class="btn ghost" href="contact.html">Join the List</a>
      </div>
    </div>
  </div>
</section>

<section class="sect about">
  <div class="ghostword" style="top:10px;right:-40px">Bonjour</div>
  <div class="wrap agrid">
    <div class="pcluster">
      <figure class="pol"><div class="ph sunset"><span>Photo coming soon</span></div><figcaption>somewhere in the south</figcaption></figure>
      <figure class="pol"><div class="ph"><span>Photo coming soon</span></div><figcaption>us, mid adventure</figcaption></figure>
      <figure class="pol"><div class="ph field"><span>Photo coming soon</span></div><figcaption>the lavender that started it all</figcaption></figure>
    </div>
    <div>
      <span class="eyebrow">Meet your guide</span>
      <h2 class="h2">Bonjour, I'm Lisette</h2>
      <p style="margin-bottom:16px">I lived in France for years before moving to the United States, and I speak French fluently. Now my husband and I are planning our own retirement in the South of France, and I am building the exact roadmap I will hand to you.</p>
      <p style="margin-bottom:16px">I am not selling a dream I read about in a magazine. I am living the plan, step by step, and helping couples like you skip the confusion, the conflicting advice, and the wasted years.</p>
      <p><span class="hand">this is the fun part, I promise</span></p>
      <div class="afacts">
        <span class="chip solid">Fluent in French</span>
        <span class="chip solid">Lived in France for years</span>
        <span class="chip solid">Married, 4 grown kids</span>
        <span class="chip solid">Provence bound</span>
      </div>
      <div style="margin-top:28px"><a class="btn" href="about.html">Our Story</a></div>
    </div>
  </div>
</section>

<section class="sect blush freebie">
  <div class="wrap fgrid2">
    <div>
      <span class="eyebrow">Free for you</span>
      <h2 class="h2">Start dreaming on paper</h2>
      <p class="lede" style="margin-bottom:24px">The Retire in France Starter Checklist walks you through the first questions every couple should answer together, in one cozy afternoon. No jargon, just clarity.</p>
      <a class="btn" href="freebie.html">Send Me the Checklist</a>
      <p style="margin-top:14px;font-size:14.5px;color:var(--muted)">Free forever. Unsubscribe anytime.</p>
    </div>
    <div class="card fcard">
      <h3>Inside the checklist</h3>
      <ul>
        <li>The dream questions to answer as a couple first</li>
        <li>The 5 lifestyle factors that pick your region for you</li>
        <li>The visa paperwork order, in plain English</li>
        <li>A first budget worksheet you can finish tonight</li>
      </ul>
      <span class="hand lav">your first step toward Provence</span>
    </div>
  </div>
</section>

<section class="sect">
  <div class="wrap" style="text-align:center">
    <span class="eyebrow" style="justify-content:center">Questions, answered</span>
    <h2 class="h2">Everything couples ask us first</h2>
    {faq_html(FAQS)}
  </div>
</section>

<section class="sect ink final">
  <div class="wrap">
    <span class="hand" style="font-size:34px">your table in Provence is waiting...</span>
    <h2 class="h2">Let's plan the retirement you have been dreaming about.</h2>
    <p class="lede">One friendly call. No pressure, no jargon. Just the two of you, your dream, and a clear next step.</p>
    <a class="btn cream" href="book.html">Book Your Free Call</a>
  </div>
</section>
"""

page(
    "home.html",
    "Marriage & Retirement Abroad | Retire in France Together",
    "Helping couples 45 and better plan, practice, and live their dream retirement in the South of France. Custom lifestyle plans, a practice trip to Provence, and French lessons for two.",
    content,
    extra_css=CSS,
    extra_js=JS,
    extra_head=faq_schema(FAQS),
)
