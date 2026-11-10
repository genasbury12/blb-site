from builder import *

ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
ICON_SPARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l2.2 6.1L20 12l-5.8 2.9L12 21l-2.2-6.1L4 12l5.8-2.9z"/></svg>'
ICON_COIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2c1.6.3 2.8.9 2.8 2.2s-1.2 2.1-2.8 2.1c-1.2 0-2.2-.5-2.7-1.4M12 6v1.8M12 16.2V18" stroke-linecap="round"/></svg>'

FAQ = [
 ("Is this just for moms?", "It's made for millennial moms whose youngest is past the baby stage, but any woman who wants a cute closet on a real budget is welcome."),
 ("Do I have to buy a whole new wardrobe?", "No. Everything starts with shopping your own closet. You'll only buy the few pieces that unlock the most outfits, and every link has a Save option."),
 ("Is a capsule wardrobe boring?", "Not here. Expect color, trends, and personality. It's a wardrobe system, not minimalism."),
 ("Where do I start?", "Take the free Mom Color Match. In a few minutes you'll know which colors in your closet already go together, plus 5 outfits to wear this week."),
]

CHECK = ["I have a closet full of clothes and still end up in leggings",
         "Half my clothes don't fit this body anymore",
         "I buy cute pieces that go with nothing",
         "I honestly don't know what's current anymore",
         "I'll spend on my kids, then put a $30 top back",
         "I don't have a free weekend to figure this out"]

content = f'''
<section class="hero" style="padding-top:clamp(56px,7vw,90px)"><div class="wm" style="right:-4vw;top:8%">Cute</div>
<div class="wrap split">
 <div>
  <span class="eyebrow" data-rv>For the mom who used to love getting dressed</span>
  <h1 data-rv>Get dressed in 5 minutes using the clothes already in your closet.</h1>
  <p class="cuteat" data-rv="2">Cute at <span class="tw" data-words='["drop-off","brunch","the Target run","date night","the park"]'>drop-off</span>{SQUIG}</p>
  <p class="lede" data-rv="2">Trendy but classic capsule wardrobes for millennial moms on a real budget. No stylist, no shopping spree, and definitely no beige minimalism.</p>
  <div class="btns" data-rv="3"><a class="btn" href="{L["match"]}">Find my colors (it's free)</a><a class="btn ghost" href="{L["club"]}">Join the Club</a></div>
 </div>
 <div class="hero-art" data-rv="2">{photo("Katie, full length, real-life outfit")}
  <div class="hb">{badge("GET DRESSED IN 5 MINUTES ✦ SHOP YOUR CLOSET FIRST ✦ ", "hb1", 150)}</div>
  <span class="chip c1">No beige minimalism</span><span class="chip c2">Real mom budget</span><span class="chip c3">Trendy but classic</span>
 </div>
</div></section>

<section class="ink toast"><div class="wm" style="left:-3vw;bottom:-4%">Haul</div><div class="wrap narrow center">
 <span class="eyebrow" data-rv>Real talk</span>
 <h2 data-rv>Another haul isn't going to fix your closet.</h2>
 <div class="strikes" data-rv="2"><s>The top that looked so cute on the model</s><s>The jeans everyone swore were <em>the</em> jeans</s><s>&ldquo;Just one thing&rdquo; at Target</s></div>
 <p class="lede" data-rv="2" style="color:var(--petal)">And you still end up in leggings. That's not because you lost your style. It's because nobody ever showed you how to build a closet where everything goes together.</p>
 <p data-rv="3" style="opacity:.85">The internet gives moms two options: declutter down to 10 beige pieces, or buy a whole new wardrobe. Neither one fits real life, a real body, or a real budget.</p>
</div></section>

<section class="bg-linen"><div class="wrap split">
 <div><span class="eyebrow" data-rv>Sound familiar?</span><h2 data-rv>Tap everything that sounds like your closet.</h2>
  <p class="lede" data-rv="2">Be honest. Nobody's watching (except maybe a toddler).</p>
  <div class="meter" data-rv="3" aria-live="polite"><div class="meter-bar"><i style="width:0%"></i></div><p class="meter-note">Tap a few to see what your closet is telling you.</p></div>
 </div>
 <ul class="tapl" data-rv="2">{"".join(f'<li><button type="button" aria-pressed="false"><span class="box"></span>{t}</button></li>' for t in CHECK)}</ul>
</div></section>

<section class="vp"><div class="wrap narrow center">
 <span class="eyebrow" data-rv>The fix</span>
 <h2 data-rv>You don't need more clothes. You need clothes that go together.</h2>{SQUIG}
 <p class="lede" data-rv="2">Champagne &amp; Savings is where trendy-but-classic style meets a real mom budget. I'll show you how to shop your closet first, find the colors that actually mix, and fill the gaps on purpose, so getting dressed feels fun again.</p>
 <div class="toggle" data-rv="3">
  <div class="tg-switch" role="group" aria-label="Compare the old way and the new way"><button type="button" class="on" data-side="old">The old way</button><button type="button" data-side="new">The Champagne way</button></div>
  <div class="tg-panels">
   <div class="tg-panel" data-panel="old"><ul class="checks xs"><li>Buy one more cute thing and hope it works</li><li>Stand in front of a full closet with nothing to wear</li><li>Reach for leggings, again</li></ul></div>
   <div class="tg-panel" data-panel="new" hidden><ul class="checks"><li>Shop your closet first</li><li>Know which colors mix, so everything works together</li><li>Grab two pieces in the dark and you're dressed</li></ul></div>
  </div>
 </div>
</div></section>

<section class="bg-white cheers"><div class="wrap">
 <div class="center"><span class="eyebrow" data-rv>What changes</span><h2 data-rv>Three things you can count on</h2></div>
 <div class="grid3" style="margin-top:40px">
  <div class="card tilt" data-rv><div class="icon">{ICON_CLOCK}</div><h3>Get dressed in 5 minutes</h3><p>Grab two pieces in the dark and you're dressed. Outfit formulas do the thinking for you.</p></div>
  <div class="card tilt" data-rv="2"><div class="icon">{ICON_SPARK}</div><h3>Look current, not costume</h3><p>Monthly trend edits tell you what's in, what to skip, and how to wear it as a mom.</p></div>
  <div class="card tilt" data-rv="3"><div class="icon">{ICON_COIN}</div><h3>Spend less, wear more</h3><p>Start with what you already own, then buy only the few pieces that unlock the most outfits.</p></div>
 </div>
</div></section>

<section class="bg-pink" style="padding:80px 0"><div class="wrap">
 <h2 class="center" style="font-size:clamp(28px,3vw,40px)" data-rv>The Cute Capsule Club, by the numbers</h2>
 <div class="stats" data-rv="2">
  <div class="stat"><b data-count="5">5</b><span>Minutes to get dressed</span></div>
  <div class="stat"><b data-count="7">7</b><span>Day Closet Reset</span></div>
  <div class="stat"><b data-count="21">21</b><span>Outfit guarantee</span></div>
  <div class="stat"><b>2019</b><span>Sharing style since</span></div>
 </div>
</div></section>

<section class="steps-sec"><div class="wm" style="right:-6vw;top:4%">Easy</div><div class="wrap">
 <div class="center"><span class="eyebrow" data-rv>How it works</span><h2 data-rv>A closet that works, in 3 simple steps</h2></div>
 <ol class="path">
  <li data-rv><span class="num">one</span><h3>Find your colors</h3><p>Take the free Mom Color Match and see which colors in your closet already go together, plus 5 outfits you can wear this week.</p></li>
  <li data-rv="2"><span class="num">two</span><h3>Reset your closet</h3><p>Inside the Cute Capsule Club, build your first capsule in about one nap time, using mostly what you already own.</p></li>
  <li data-rv="3"><span class="num">three</span><h3>Get dressed in 5 minutes</h3><p>A new capsule every season and a monthly trend edit keep it fresh. You're the mom at drop-off who looks put together without trying too hard.</p></li>
 </ol>
</div></section>

<section class="bg-linen"><div class="wrap split flip">
 <div><span class="eyebrow" data-rv>Meet Katie</span>
  <h2 data-rv>You need someone who gets that your day includes snack crumbs on your sleeve.</h2>
  <p data-rv="2">Everywhere I looked, I saw style advice made for 22 year olds with nowhere to be, or capsule wardrobes so beige they made me sad. Being a mom isn't for the faint of heart, and dressing like yourself while doing it is even harder.</p>
  <p data-rv="2">That's exactly why I started Champagne &amp; Savings. I'm Katie, a millennial mom sharing affordable fashion since 2019. Now I help moms like you build cute, mix-and-match closets on a real budget, so you can feel like yourself again.</p>
  <span class="script" data-rv="3">xo, Katie</span>
  <p data-rv="3" style="margin-top:22px"><a class="textlink" href="{L["about"]}">Meet your new closet bestie →</a></p>
 </div>
 <div class="polas" data-rv="2"><div class="pola p1">{photo("Katie with her kids", "polaroid-photo")}<span>real mom life</span></div><div class="pola p2">{photo("Katie outfit detail", "polaroid-photo")}<span>trendy but classic</span></div>{ARROW}</div>
</div></section>

<section class="fork"><div class="wrap">
 <div class="center"><span class="eyebrow" data-rv>Your next step</span><h2 data-rv>Here's how we can get started</h2></div>
 <div class="grid2" style="margin-top:44px">
  <div class="card fork-card" data-rv><span class="chip">Free</span><h3>Just getting started?</h3><p>Take the free Mom Color Match. In a few minutes, you'll know which colors in your closet already mix, and you'll get 5 outfits to wear this week.</p><a class="btn ghost" href="{L["match"]}">Find my colors →</a></div>
  <div class="card fork-card dark" data-rv="2"><span class="chip">The Cute Capsule Club</span><h3>Ready for a closet that works?</h3><p>Start with the 7-day Closet Reset, then get a new capsule every season, monthly trend edits, and a community of moms who get it.</p><a class="btn light" href="{L["club"]}">Start my Closet Reset →</a></div>
 </div>
 <p class="center" data-rv style="margin-top:30px">Want Katie to build your capsule for you? <a class="textlink" href="{L["makeover"]}">See the Closet Makeover</a></p>
</div></section>

<section class="bg-pink favor"><div class="wrap split">
 <div class="swatches" data-rv aria-hidden="true">{"".join(f'<i style="--c:{c};--n:{i}"></i>' for i,c in enumerate(["#3E3333","#5E3F44","#A47E82","#E6CECE","#F7EAEB","#C8AD86","#F0E7E2"]))}</div>
 <div><span class="eyebrow" data-rv>Free quiz</span>
  <h2 data-rv>Ready to find out which clothes in your closet already go together?</h2>
  <p class="lede" data-rv="2">Of course you are. You've got great taste. It just needs a plan.</p>
  <ul class="checks" data-rv="2"><li>The colors in your closet that already mix</li><li>5 outfit formulas you can make today</li><li>A peek at how the Club turns them into a whole closet</li></ul>
  <a class="btn" data-rv="3" href="{L["match"]}">Yes! Show me my colors</a>
 </div>
</div></section>

<section class="bg-linen"><div class="wrap"><div class="center"><span class="eyebrow" data-rv>Questions</span><h2 data-rv>Good questions, honest answers</h2></div>{faq_items_html(FAQ)}</div></section>
''' + final_cta("Have a closet you're actually excited to open.", "you didn't lose your style", "Start with the free Mom Color Match, or jump into the Cute Capsule Club today.", "Find my colors", L['match'], ("Join the Club", L['club']))

CSS = r"""
@media (min-width:901px){.hero .split{grid-template-columns:1.1fr .9fr}}.cuteat{font-family:var(--display);font-size:clamp(26px,2.6vw,34px);margin:0 0 4px;color:var(--bord)}
.tw{font-style:italic;color:var(--rose);transition:opacity .28s;display:inline-block;min-width:4ch}
.hero-art{position:relative;max-width:460px;margin-left:auto;width:100%}.hb{position:absolute;left:-46px;bottom:60px;z-index:3}
.hero-art .chip{position:absolute;z-index:3}.c1{top:12%;right:-14px;transform:rotate(4deg)}.c2{bottom:18%;right:-24px;transform:rotate(-5deg)}.c3{top:-10px;left:18%;transform:rotate(-3deg)}
@media (prefers-reduced-motion:no-preference){.hero-art .chip{animation:bob 5s ease-in-out infinite}.c2{animation-delay:1.2s!important}.c3{animation-delay:2.4s!important}}
@keyframes bob{50%{translate:0 -10px}}
.strikes{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:10px 0 30px}
.strikes s{font-family:var(--sans);font-size:13px;letter-spacing:.12em;text-transform:uppercase;background:rgba(247,234,235,.08);border:1px solid rgba(247,234,235,.25);padding:11px 18px;border-radius:40px;text-decoration-color:var(--rose);text-decoration-thickness:2px}
.tapl{list-style:none;padding:0;margin:0;display:grid;gap:12px}
.tapl button{width:100%;text-align:left;display:flex;gap:16px;align-items:center;background:var(--white);border:1.5px solid transparent;border-radius:18px;padding:18px 20px;font-family:var(--serif);font-size:20px;color:var(--truffle);cursor:pointer;box-shadow:0 14px 28px -22px rgba(94,63,68,.55);transition:.25s}
.tapl button:hover{border-color:var(--pink)}.tapl .box{flex:0 0 26px;height:26px;border-radius:50%;border:1.5px solid var(--rose);display:grid;place-items:center;transition:.25s}
.tapl button[aria-pressed=true]{background:var(--bord);color:var(--petal)}.tapl button[aria-pressed=true] .box{background:var(--pink);border-color:var(--pink)}
.tapl button[aria-pressed=true] .box::after{content:"";width:10px;height:6px;border-left:2px solid var(--bord);border-bottom:2px solid var(--bord);transform:rotate(-45deg) translate(1px,-1px)}
.meter{margin-top:30px}.meter-bar{height:12px;border-radius:20px;background:var(--white);overflow:hidden}.meter-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--rose),var(--bord));border-radius:20px;transition:width .5s}
.meter-note{margin-top:14px;font-style:italic;color:var(--bord)}
.toggle{margin-top:34px}.tg-switch{display:inline-flex;background:var(--white);border-radius:60px;padding:6px;box-shadow:var(--shadow)}
.tg-switch button{border:0;background:none;font-family:var(--sans);font-size:12.5px;letter-spacing:.18em;text-transform:uppercase;padding:14px 22px;border-radius:60px;cursor:pointer;color:var(--truffle)}
.tg-switch button.on{background:var(--bord);color:var(--petal)}.tg-panels{max-width:560px;margin:30px auto 0;text-align:left}
.tilt{transition:transform .35s}.tilt:hover{transform:translateY(-6px) rotate(-.6deg)}
.path{list-style:none;padding:0;margin:56px 0 0;display:grid;grid-template-columns:repeat(3,1fr);gap:30px;position:relative}
.path::before{content:"";position:absolute;top:34px;left:12%;right:12%;border-top:1.5px dashed var(--rose);opacity:.6}
.path li{position:relative;text-align:center;padding:0 10px}.path .num{display:grid;place-items:center;width:70px;height:70px;margin:0 auto 20px;border-radius:50%;background:var(--bord);color:var(--petal);font-family:var(--script);font-size:34px;position:relative;z-index:1}
.polas{position:relative;min-height:440px}.pola{position:absolute;background:var(--white);padding:14px 14px 18px;box-shadow:var(--shadow);width:min(270px,62%)}
.pola span{display:block;font-family:var(--script);font-size:32px;color:var(--bord);text-align:center;margin-top:8px}
.p1{left:0;top:0;transform:rotate(-5deg)}.p2{right:0;top:120px;transform:rotate(4deg)}.polas .doodle-arrow{position:absolute;left:38%;bottom:0;transform:rotate(10deg)}
.pola .photo{box-shadow:none}.pola:hover{z-index:2}
.fork-card{display:flex;flex-direction:column;align-items:flex-start;gap:6px}.fork-card .btn{margin-top:auto}.fork-card.dark{background:var(--bord);color:var(--petal)}.fork-card.dark h3{color:var(--petal)}
.fork-card .chip{margin-bottom:14px}
.swatches{position:relative;height:380px}.swatches i{position:absolute;width:132px;height:132px;border-radius:50%;background:var(--c);border:6px solid var(--white);box-shadow:var(--shadow)}
.swatches i:nth-child(1){left:6%;top:40px}.swatches i:nth-child(2){left:30%;top:0}.swatches i:nth-child(3){left:54%;top:46px}.swatches i:nth-child(4){left:16%;top:170px}
.swatches i:nth-child(5){left:40%;top:140px}.swatches i:nth-child(6){left:64%;top:196px}.swatches i:nth-child(7){left:30%;top:262px;width:96px;height:96px}
@media (prefers-reduced-motion:no-preference){.swatches i{animation:bob 6s ease-in-out infinite;animation-delay:calc(var(--n) * -.8s)}}
@media (max-width:900px){.hero-art{margin:20px auto 0;max-width:340px}.hb{left:-18px;bottom:30px}.hb .badge{width:110px!important;height:110px!important}
.path{grid-template-columns:1fr}.path::before{display:none}.polas{min-height:420px;max-width:420px;width:100%;margin:0 auto}.swatches{height:300px;max-width:420px;width:100%;margin:0 auto}.swatches i{width:96px!important;height:96px!important}.c2{right:-6px}.c1{right:-6px}}
"""

JS = r"""
(function(){var b=[].slice.call(document.querySelectorAll('.tapl button')),bar=document.querySelector('.meter-bar i'),note=document.querySelector('.meter-note');
var notes=['Tap a few to see what your closet is telling you.','Okay, you have great taste. It just needs a plan.','Your closet is full of potential, not outfits. Yet.','This is exactly why the Color Match exists.','Mama, your closet is begging for a Reset.','You are 100% my people. Let\'s fix this together.','Every single one? Your Closet Reset starts now.'];
b.forEach(function(x){x.addEventListener('click',function(){x.setAttribute('aria-pressed',x.getAttribute('aria-pressed')!=='true');var n=b.filter(function(y){return y.getAttribute('aria-pressed')==='true'}).length;
bar.style.width=Math.round(n/b.length*100)+'%';note.textContent=notes[n]})});
var sw=[].slice.call(document.querySelectorAll('.tg-switch button'));sw.forEach(function(s){s.addEventListener('click',function(){sw.forEach(function(o){o.classList.toggle('on',o===s)});
[].forEach.call(document.querySelectorAll('.tg-panel'),function(p){p.hidden=p.getAttribute('data-panel')!==s.getAttribute('data-side')})})});})();
"""

page('home.html', 'Capsule Wardrobe for Moms | Champagne & Savings',
     'Trendy but classic capsule wardrobes for millennial moms on a real budget. Get dressed in 5 minutes using the clothes you already own.',
     content, CSS, JS, active='home', schema=faq_schema(FAQ))
print('built home.html')
