from builder import *

# FLODESK: paste Katie's inline form snippet inside #flodesk-slot. When it's present, the fallback form below hides itself.
# The universal loader call needs the 6th argument 'fd'. Set the form's success redirect to /color-match-thank-you.
FORM = f'''<div class="formcard" id="match-form"><span class="ribbon">Free</span>
 <h3>Get your Mom Color Match</h3><span class="script">it only takes a few minutes</span>
 <div id="flodesk-slot"><!-- PASTE FLODESK INLINE FORM SNIPPET HERE --></div>
 <form class="fallback" action="#match-form" method="post" novalidate>
  <label for="fn">First name</label><input id="fn" name="first_name" type="text" autocomplete="given-name" required>
  <label for="em" style="margin-top:12px">Email</label><input id="em" name="email" type="email" autocomplete="email" required>
  <button type="submit" class="btn">Show me my colors</button>
  <p class="formnote" role="status">Almost there! This form connects to Katie's email list at launch.</p>
 </form>
 <p class="fine">No spam, just style. Unsubscribe anytime.</p></div>'''

content = f'''
<section class="m-hero">{BUBBLES}<div class="wrap split">
 <div>
  <span class="eyebrow" data-rv>Free quiz for moms</span>
  <h1 data-rv>Find the colors in your closet that already go together, and get 5 outfits you can wear this week.</h1>
  <p class="lede" data-rv="2">You don't need a new wardrobe. You need to know which pieces you own already mix. This quick quiz shows you.</p>
  <ul class="checks" data-rv="3"><li>Your mix-and-match color set, based on what's already in your closet</li><li>5 outfit formulas you can make today, no shopping required</li><li>The one color mistake that keeps so many moms reaching for leggings</li></ul>
 </div>
 <div data-rv="2">{FORM}</div>
</div></section>

<section class="ink"><div class="wrap split">
 <div class="pal" aria-hidden="true">{"".join(f'<i style="--c:{c}"></i>' for c in ["#E6CECE","#5E3F44","#F7EAEB","#A47E82","#C8AD86","#F0E7E2","#3E3333","#E6CECE","#A47E82"])}</div>
 <div><span class="eyebrow" data-rv>How it works</span><h2 data-rv>A few quick questions. One closet that finally makes sense.</h2>
  <ol class="mini" data-rv="2"><li><b>Answer a few questions</b> about the colors you already own and love wearing.</li><li><b>Get your results by email</b>, with your color set and 5 outfit formulas.</li><li><b>Get dressed tomorrow</b> from clothes that were in your closet all along.</li></ol>
  <a class="btn light" href="#match-form" data-rv="3">Show me my colors</a></div>
</div></section>
'''
CSS = FLODESK_CSS + r"""
.m-hero{padding-top:clamp(50px,6vw,80px)}.m-hero h1{font-size:clamp(38px,4.6vw,62px)}.m-hero .bubbles span{border-color:rgba(164,126,130,.45)}
.pal{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:360px;width:100%;margin:0 auto}.pal i{aspect-ratio:1;border-radius:50%;background:var(--c);border:5px solid rgba(247,234,235,.15)}
.mini{padding-left:22px;margin:0 0 28px}.mini li{margin-bottom:12px}.mini b{color:var(--pink);font-weight:600}
"""
JS = r"""
(function(){var slot=document.getElementById('flodesk-slot'),fb=document.querySelector('.fallback');
if(slot&&slot.querySelector('form,[class*="fd-form"],iframe')){fb.style.display='none'}
fb&&fb.addEventListener('submit',function(e){e.preventDefault();fb.querySelector('.formnote').classList.add('show')});})();
"""
page('color-match.html', 'Free Mom Color Match Quiz | Champagne & Savings',
     'Find the colors in your closet that already go together, and get 5 outfit formulas you can wear this week. A free quiz for moms.',
     content, CSS, JS, chrome=False)

# ---------------- thank-you page ----------------
content2 = f'''
<section class="ty"><canvas id="pop" aria-hidden="true"></canvas><div class="wrap narrow center">
 <div class="ty-coupe" data-rv>{COUPE}</div>
 <span class="eyebrow" data-rv>Cheers to you</span>
 <h1 data-rv>Your colors are on their way to your inbox!</h1>
 <p class="lede" data-rv="2">While you wait, here's a little secret: knowing your colors is step 2 of a 3-step system.</p>
 <div class="three" data-rv="2"><div><span>1</span>Foundation pieces</div><div class="you"><span>2</span>Your colors<em>you are here</em></div><div><span>3</span>Personality + gaps</div></div>
</div></section>

<section class="bg-linen"><div class="wrap split">
 <div><span class="eyebrow" data-rv>Want the whole closet?</span><h2 data-rv>Not just the colors. The whole closet.</h2>
  <p data-rv="2">Start your Closet Reset inside the Cute Capsule Club and build your first capsule in about one nap time, using mostly clothes you already own.</p>
  <div class="btns" data-rv="3"><a class="btn" href="{L["checkout"]}">Start my Closet Reset</a><a class="textlink" href="{L["club"]}">See everything inside</a></div></div>
 <div class="card mb" data-rv="2"><span class="chip">Bonus</span><h3>Win your money back</h3><p>Finish the Reset and post your 7 outfits in the Club, and your $97 comes back to you as about 5 months of membership.</p>
  <p style="margin:0"><a class="textlink" href="{L["blog"]}">Not yet? Read the latest capsule →</a></p></div>
</div></section>
'''
CSS2 = r"""
.ty{padding-top:clamp(60px,8vw,110px)}#pop{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
.ty-coupe{width:120px;margin:0 auto 18px}.ty h1{font-size:clamp(40px,5vw,68px)}
.three{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:34px}.three div{background:var(--white);border-radius:20px;padding:22px 14px;font-family:var(--sans);font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;box-shadow:0 14px 30px -22px rgba(94,63,68,.5)}
.three span{display:block;font-family:var(--script);font-size:40px;letter-spacing:0;text-transform:none;color:var(--rose);line-height:1.1}
.three .you{background:var(--bord);color:var(--petal)}.three .you span{color:var(--pink)}.three em{display:block;font-family:var(--serif);font-style:italic;text-transform:none;letter-spacing:0;font-size:16px;margin-top:6px;color:var(--pink)}
.mb .chip{margin-bottom:12px}
@media (max-width:600px){.three{grid-template-columns:1fr}}
"""
JS2 = r"""
(function(){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var c=document.getElementById('pop');if(!c)return;var x=c.getContext('2d'),W,H,ps=[],t0=performance.now();
function rs(){W=c.width=c.offsetWidth;H=c.height=c.offsetHeight}rs();window.addEventListener('resize',rs);
var cols=['#E6CECE','#A47E82','#C8AD86','#5E3F44','#F0E7E2'];for(var i=0;i<120;i++)ps.push({x:W/2+(Math.random()-.5)*80,y:H*.35,vx:(Math.random()-.5)*9,vy:-Math.random()*11-3,r:Math.random()*5+2,c:cols[i%cols.length],o:Math.random()<.4});
(function f(n){var e=(n-t0)/1000;x.clearRect(0,0,W,H);x.globalAlpha=Math.max(0,1-e/5);ps.forEach(function(p){p.vy+=.22;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;x.beginPath();x.arc(p.x,p.y,p.r,0,7);
if(p.o){x.strokeStyle=p.c;x.lineWidth=1.5;x.stroke()}else{x.fillStyle=p.c;x.fill()}});if(e<5)requestAnimationFrame(f);else x.clearRect(0,0,W,H)})(t0)})();
"""
page('color-match-thank-you.html', 'Your Colors Are On the Way | Champagne & Savings', 'Your Mom Color Match results are on their way to your inbox.',
     content2, CSS2, JS2, chrome=False)
print('built color-match.html, color-match-thank-you.html')
