from builder import *

FAQ = [
 ("I'm not a fashion person. Will this work for me?", "Yes. The Club does the fashion thinking for you. You follow the steps and the outfit formulas."),
 ("Will it work for my body and size?", "It's built around the body you have today, not the one you had before kids. You'll learn the shapes and colors that work for you."),
 ("Do I have to buy a bunch of new clothes?", "No. You start by shopping your own closet. Your gap list is short, and every link has a Save option."),
 ("How much time does it take?", "The Closet Reset takes about one nap time to build your first capsule, spread over 7 short days. After that, getting dressed takes about 5 minutes."),
 ("Is this a minimalist capsule?", "Not even a little. Expect trends, color, and personality."),
 ("What stores do you link to?", "Places moms already shop, like Target, Amazon, Old Navy, and more, at Save, Middle, and Splurge prices. Some links are affiliate links."),
 ("How does Win Your Money Back work?", "Finish the Reset and post your 7 outfits in the Club, and your $97 becomes membership credit, about 5 months free."),
 ("Can I cancel?", "Yes, anytime. Your membership is $19 a month after your first month."),
]
INSIDE = [("cal","The 7-day Closet Reset","Build your first capsule in about one nap time, using mostly clothes you already own."),
          ("list","Your gap list","Only the few pieces that unlock the most outfits, with links at Save, Middle, and Splurge prices."),
          ("hanger","Outfit formulas + calendar","Grab two pieces in the dark and you're dressed. Printable and phone friendly."),
          ("leaf","A new capsule every season","So your closet keeps working when the weather changes."),
          ("trend","The monthly trend edit","What's in, what to skip, and how to wear it as a mom."),
          ("heart","The Club community","Real moms, real outfits, real bodies.")]
DAYS = ["Shop your closet: pull out everything you actually like wearing","Find your foundation pieces","Find the colors that actually mix",
        "Learn your go-to outfit formulas","Add your personality pieces","Make your short gap list","Fill in your outfit calendar and get dressed in 5 minutes"]
CTA = f'<a class="btn" href="{L["checkout"]}">Start my Closet Reset</a>'

content = f'''
<section class="club-hero">{BUBBLES}<div class="wrap split">
 <div>
  <span class="eyebrow" data-rv>The Cute Capsule Club</span>
  <h1 data-rv>Got a closet full of clothes and nothing to wear?</h1>
  <p class="lede" data-rv="2">You open the doors, stare for a minute, and reach for the same leggings and sweatshirt. Again. Some of it doesn't fit this body. Some of it was a cute impulse buy that goes with nothing. And some of it still has the tags on.</p>
  <div class="btns" data-rv="3">{CTA}<span class="chip">$97 · includes your first month</span></div>
 </div>
 <div class="outfits" data-rv="2" aria-hidden="true">
  <div class="ofit o1"><i style="--c:#F7EAEB"></i><i style="--c:#5E3F44"></i><i style="--c:#C8AD86"></i><span>drop-off</span></div>
  <div class="ofit o2"><i style="--c:#E6CECE"></i><i style="--c:#3E3333"></i><i style="--c:#F0E7E2"></i><span>brunch</span></div>
  <div class="ofit o3"><i style="--c:#A47E82"></i><i style="--c:#F0E7E2"></i><i style="--c:#5E3F44"></i><span>date night</span></div>
  <div class="cl-badge">{badge("THE CUTE CAPSULE CLUB ✦ EST. 2019 ✦ ", "cb", 140)}</div>
 </div>
</div></section>

<section class="bg-linen">{intro("Sound familiar?", "You don't want to look like you gave up.", "But you don't want to look like you're trying too hard at the park, either. So you play it safe, every single day, and wonder where the girl who loved getting dressed went.")}
 <div class="wrap grid3 notes">
  <div class="note n1" data-rv><span class="tape"></span>You've saved hundreds of outfit pins and made almost none of them.</div>
  <div class="note n2" data-rv="2"><span class="tape"></span>You'll spend on your kids without blinking, then put a $30 top back.</div>
  <div class="note n3" data-rv="3"><span class="tape"></span>You've heard skinny jeans are “over” and honestly have no idea what's current anymore.</div>
 </div>
 <p class="center" data-rv style="margin-top:40px"><span class="script">say goodbye to leggings by default</span></p>
</section>

<section class="ink"><div class="wm" style="left:-3vw;top:6%">You</div><div class="wrap split">
 <div><span class="eyebrow" data-rv>What you really want</span><h2 data-rv>You want to feel like yourself again.</h2>
  <p data-rv="2">Not a 22 year old. Not a minimalist with 10 beige pieces. <em>You</em>, the version who knows what to wear, feels cute at drop-off, and catches her reflection in the Target doors and thinks, “Okay, I look good.”</p></div>
 <ul class="checks glow" data-rv="2"><li>Open your closet and know what to wear</li><li>Look current without chasing every trend</li><li>Spend on purpose, not on impulse</li><li>Get dressed in 5 minutes, even on the chaos mornings</li></ul>
</div></section>

<section class="bg-white"><div class="wrap split">
 <div class="bigstat" data-rv><b><span data-count="62">62</span>%</b><span>of new mothers said they felt they had lost part of their identity since having a child</span><a href="https://www.psychologytoday.com/us/blog/how-to-thrive-postpartum/202502/who-am-i-now-coping-with-postpartum-identity-loss" target="_blank" rel="noopener">2023 study, via Psychology Today</a></div>
 <div><span class="eyebrow" data-rv>You're not imagining it</span><h2 data-rv>If you don't recognize yourself in your clothes, you're far from alone.</h2>
  <p class="lede" data-rv="2">And your closet is one of the easiest places to start finding her again.</p></div>
</div></section>

<section class="bg-pink">{intro("Introducing", "The Cute Capsule Club", "A wardrobe system for millennial moms that turns what you already own into mix-and-match outfits, so you can get dressed in 5 minutes and actually like what you see. It's not about minimalism. It's built around how you actually dress, actually live, and actually get ready in the morning.")}
 <div class="wrap grid3 inside">{"".join(f'<div class="card" data-rv="{i%3+1}"><div class="icon">{ICONS[ic]}</div><h3>{t}</h3><p>{d}</p></div>' for i,(ic,t,d) in enumerate(INSIDE))}</div>
</section>

<section class="reset">{intro("Break it down", "Your 7-day Closet Reset", "Short daily steps. About one nap time in total.")}
 <div class="wrap narrow"><ol class="tl" style="--p:1">{"".join(f'<li data-rv><span class="day">Day {i+1}</span><p>{d}</p></li>' for i,d in enumerate(DAYS))}</ol>
 <div class="bonus" data-rv><span class="chip">Bonus</span><h3>Win your money back</h3><p>Finish the Reset and post your 7 outfits in the Club, and your $97 comes back to you as about 5 months of membership.</p></div></div>
</section>

<section class="bg-linen"><div class="wrap split">
 <div><span class="eyebrow" data-rv>The capsule math</span><h2 data-rv>Why fewer pieces make more outfits</h2>
  <p data-rv="2">When everything goes together, every piece multiplies. Slide to see how many combinations a small capsule makes.</p>
  <p class="muted" data-rv="2" style="font-size:17px">Combinations of one top, one bottom, and a layer (or no layer), before shoes and accessories.</p></div>
 <div class="calc card" data-rv="2">
  <label>Tops <output data-o="tops">6</output><input type="range" min="2" max="10" value="6" data-k="tops" aria-label="Tops"></label>
  <label>Bottoms <output data-o="bottoms">4</output><input type="range" min="1" max="6" value="4" data-k="bottoms" aria-label="Bottoms"></label>
  <label>Layers <output data-o="layers">2</output><input type="range" min="0" max="4" value="2" data-k="layers" aria-label="Layers"></label>
  <div class="calc-out"><b data-total>72</b><span>outfits from <i data-pieces>12</i> pieces</span></div>
 </div>
</div></section>

<section class="bg-white">{intro("Let's be honest", "You're going to spend money on clothes this year either way.", "Here's where it usually goes.")}
 <div class="wrap grid3 ways">
  <div class="way" data-rv><span class="x">×</span><h3>Hire a personal stylist</h3><p>It works, but it's a big spend, and most moms won't spend that on themselves.</p></div>
  <div class="way" data-rv="2"><span class="x">×</span><h3>Keep buying “just one thing”</h3><p>A $30 top here, a $40 pair of jeans there. None of it goes together, so you're right back in leggings.</p></div>
  <div class="way" data-rv="3"><span class="x">×</span><h3>DIY it from Pinterest</h3><p>Hours of saving outfits made for someone else's body, budget, and life.</p></div>
 </div>
 <p class="center lede" data-rv style="margin:40px auto 0">The Club costs less than one cute top from Zara a month, and it makes sure the clothes you already paid for actually get worn.</p>
</section>

<section class="bord join"><div class="wm" style="right:-4vw;top:2%">Join</div><div class="wrap split">
 <div><span class="eyebrow" data-rv>Everything you get</span><h2 data-rv>Here's what's inside the Club</h2>
  <ul class="checks" data-rv="2"><li>The 7-day Closet Reset</li><li>Your personal gap list with Save, Middle, and Splurge links</li><li>Outfit formulas and the printable outfit calendar</li>
  <li>A new capsule every season (each one sold separately as a $27 Seasonal Capsule Guide)</li><li>The monthly trend edit</li><li>The Club community</li><li>The 21 Outfits Guarantee</li><li>Bonus: Win your money back</li></ul></div>
 <div class="price card" data-rv="2"><span class="chip">Your investment</span><div class="amt">$97</div><p>for the Closet Reset, including your first month</p><div class="then">then $19 a month · cancel anytime</div>{CTA}<p class="fine">Secure checkout. Some links are affiliate links.</p></div>
</div></section>

<section class="guar"><div class="wrap narrow"><div class="contract card" data-rv>
 <div class="seal">{COUPE}</div><span class="eyebrow">The promise</span><h2>The 21 Outfits Guarantee</h2>
 <p>Do the 7-day Closet Reset. If you can't make at least 21 outfits you actually like from your first capsule, email me within 30 days and I'll give you every penny back.</p>
 <div class="sig"><span class="script">Katie</span><span class="line">Katie Hennessey, Champagne &amp; Savings</span></div>
 <p class="fine"><a href="{L["terms"]}">See the full terms</a></p></div></div></section>

<section class="bg-linen"><div class="wrap split flip">
 <div><span class="eyebrow" data-rv>And who am I to help?</span><h2 data-rv>The system I wish I'd had</h2>
  <p data-rv="2">I'm Katie Hennessey, the millennial mom behind Champagne &amp; Savings. I've been sharing affordable fashion since 2019, and I help other bloggers with their LTK and Pinterest accounts, so I know what's trending and what's worth your money.</p>
  <p data-rv="2">I made the Cute Capsule Club because I was tired of capsule advice that was either too beige or too expensive for real mom life.</p><span class="script" data-rv="3">xo, Katie</span></div>
 <div style="max-width:400px;width:100%;margin:0 auto" data-rv="2">{photo("Katie, warm portrait in a capsule outfit")}</div>
</div></section>

<section class="bg-white">{intro("Is it for you?", "The Club is a perfect match if...")}
 <div class="wrap grid2 fit">
  <div class="card" data-rv><h3>Yes, this is you</h3><ul class="checks"><li>You used to love getting dressed, and you miss that feeling</li><li>Your youngest is past the baby stage and you're ready to dress the body you have now</li><li>You want to look current without chasing every trend</li><li>You're done wasting money on clothes that go with nothing</li></ul></div>
  <div class="card soft" data-rv="2"><h3>It's not for you if</h3><ul class="checks xs"><li>You want a 10-piece beige minimalist wardrobe</li><li>You want a new haul every week</li><li>You're in the first few months after having a baby (start with the free <a href="{L["match"]}">Color Match</a> and come back when you're ready)</li></ul></div>
 </div>
</section>

<section class="bg-pink" id="faq">{intro("Questions", "Everything you're wondering")}<div class="wrap">{faq_items_html(FAQ)}<div class="center" style="margin-top:36px" data-rv>{CTA}</div></div></section>
''' + final_cta("You didn't lose your style. Your closet just needs a plan.", "one nap time",
   "You could keep buying “just one more thing.” Or you could spend one nap time building a closet that finally goes together, and get dressed in 5 minutes for the rest of the season.",
   "Start my Closet Reset", L['checkout'])

CSS = r"""
.intro{max-width:820px;margin:0 auto 10px;padding:0 28px}.intro.center .lede{margin-left:auto;margin-right:auto}
.club-hero{padding-top:clamp(56px,7vw,90px)}.club-hero .bubbles span{border-color:rgba(164,126,130,.5)}
.outfits{position:relative;min-height:480px;width:100%}.ofit{position:absolute;width:210px;background:var(--white);border-radius:22px;padding:16px;box-shadow:var(--shadow);display:grid;gap:8px}
.ofit i{display:block;height:62px;border-radius:12px;background:var(--c);border:1px solid rgba(164,126,130,.25)}.ofit i:nth-child(2){height:84px}
.ofit span{font-family:var(--script);font-size:32px;color:var(--bord);text-align:center;line-height:1.1}
.o1{left:0;top:40px;transform:rotate(-6deg)}.o2{left:31%;top:150px;transform:rotate(3deg);z-index:2}.o3{right:0;top:0;transform:rotate(7deg);z-index:3}.cl-badge{position:absolute;left:4%;bottom:-10px;z-index:3}
.notes{margin-top:44px}.note{background:#FFF8F2;padding:44px 30px 34px;font-size:21px;line-height:1.45;box-shadow:0 22px 40px -26px rgba(94,63,68,.55);position:relative}
.n1{transform:rotate(-2deg)}.n2{transform:rotate(1.5deg);background:#FBEFF0}.n3{transform:rotate(-1deg)}
.tape{position:absolute;top:-12px;left:50%;width:110px;height:28px;transform:translateX(-50%) rotate(-3deg);background:rgba(200,173,134,.5)}
.glow li{font-size:21px}.glow li::before{box-shadow:0 0 0 6px rgba(230,206,206,.08),0 0 22px rgba(230,206,206,.35)}
.bigstat{background:var(--bord);color:var(--petal);border-radius:28px;padding:44px 40px;box-shadow:var(--shadow)}
.bigstat b{display:block;font-family:var(--display);font-weight:400;font-size:clamp(90px,10vw,140px);line-height:1;color:var(--pink)}
.bigstat>span{display:block;font-size:21px;margin:10px 0 18px}.bigstat a{font-family:var(--sans);font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--pink)}
.inside{margin-top:44px}.inside .card{padding:34px 28px}.inside .icon{background:var(--petal)}
.tl{list-style:none;margin:44px 0 0;padding:0 0 0 46px;position:relative}
.tl::before{content:"";position:absolute;left:14px;top:6px;bottom:6px;width:2px;background:rgba(164,126,130,.25)}
.tl::after{content:"";position:absolute;left:14px;top:6px;bottom:6px;width:2px;background:linear-gradient(var(--rose),var(--bord));transform-origin:top;transform:scaleY(var(--p))}
.tl li{position:relative;padding:0 0 28px}.tl li::before{content:"";position:absolute;left:-41px;top:6px;width:20px;height:20px;border-radius:50%;background:var(--petal);border:2px solid var(--rose)}
.tl .day{font-family:var(--sans);font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--rose)}.tl p{font-family:var(--display);font-size:clamp(22px,2.2vw,28px);line-height:1.25;margin:4px 0 0}
.bonus{margin-top:20px;background:var(--bord);color:var(--petal);border-radius:24px;padding:30px 30px 18px}.bonus h3{color:var(--petal);margin:12px 0 8px}
.calc label{display:grid;grid-template-columns:1fr auto;align-items:center;font-family:var(--sans);font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--bord);margin-bottom:20px}
.calc output{font-family:var(--display);font-size:24px;letter-spacing:0;color:var(--truffle)}
.calc input[type=range]{grid-column:1/-1;width:100%;margin-top:10px;accent-color:var(--bord);height:28px}
.calc-out{border-top:1px solid var(--pink);padding-top:20px;text-align:center}.calc-out b{display:block;font-family:var(--display);font-weight:400;font-size:clamp(70px,8vw,104px);line-height:1;color:var(--bord)}
.calc-out span{font-family:var(--sans);font-size:12.5px;letter-spacing:.18em;text-transform:uppercase}.calc-out i{font-style:normal}
.ways{margin-top:44px}.way{background:var(--petal);border-radius:var(--r);padding:34px 28px;position:relative}
.way h3{padding-right:46px;text-decoration:line-through;text-decoration-color:var(--rose);text-decoration-thickness:2px}.way .x{position:absolute;top:20px;right:22px;width:38px;height:38px;border-radius:50%;background:var(--white);color:var(--rose);display:grid;place-items:center;font-size:24px}
.join .checks li{font-size:20px}.price{text-align:center;color:var(--truffle)}.price .amt{font-family:var(--display);font-size:clamp(90px,9vw,130px);line-height:1;color:var(--bord);margin:18px 0 6px}
.price .then{font-family:var(--sans);font-size:12.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--rose);margin-bottom:26px}.price .btn{width:100%;justify-content:center}
.price .fine,.contract .fine{font-size:15px;color:var(--muted);margin:14px 0 0}
.guar{background:repeating-linear-gradient(135deg,var(--petal) 0 22px,#F3E2E3 22px 44px)}
.contract{border:1.5px solid var(--rose);outline:1px solid var(--pink);outline-offset:-12px;padding:56px 50px 40px;text-align:center}
.seal{position:relative;z-index:2;width:110px;height:110px;margin:-110px auto 14px;border-radius:50%;background:var(--bord);padding:18px 24px;box-shadow:var(--shadow)}.seal .coupe{color:var(--petal)}.seal .coupe .bow{color:var(--pink)}
.sig{margin-top:22px}.sig .script{font-size:64px}.sig .line{display:block;border-top:1px solid var(--rose);max-width:420px;margin:4px auto 0;padding-top:8px;font-family:var(--sans);font-size:11.5px;letter-spacing:.2em;text-transform:uppercase}
.fit{margin-top:40px}.fit .soft{background:var(--petal)}.fit a{color:var(--bord)}
@media (max-width:900px){.outfits{min-height:440px;max-width:440px;margin:10px auto 0}.ofit{width:150px}.o2{top:170px}.ofit i{height:44px}.ofit i:nth-child(2){height:60px}.cl-badge .badge{width:110px!important;height:110px!important}
.contract{padding:50px 22px 30px}.tl{padding-left:40px}}
"""
JS = r"""
(function(){var r={};function upd(){var t=+r.tops.value,b=+r.bottoms.value,l=+r.layers.value;
document.querySelector('[data-o=tops]').textContent=t;document.querySelector('[data-o=bottoms]').textContent=b;document.querySelector('[data-o=layers]').textContent=l;
document.querySelector('[data-total]').textContent=t*b*(l+1);document.querySelector('[data-pieces]').textContent=t+b+l}
[].forEach.call(document.querySelectorAll('.calc input'),function(i){r[i.getAttribute('data-k')]=i;i.addEventListener('input',upd)});if(r.tops)upd();
var tl=document.querySelector('.tl');if(tl&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){tl.style.setProperty('--p',0);
function sc(){var b=tl.getBoundingClientRect(),vh=window.innerHeight;var p=Math.min(1,Math.max(0,(vh*.75-b.top)/b.height));tl.style.setProperty('--p',p.toFixed(3))}
window.addEventListener('scroll',sc,{passive:true});sc()}})();
"""
page('the-club.html', 'The Cute Capsule Club | Capsule Wardrobe for Moms',
     'The Cute Capsule Club helps millennial moms build a trendy but classic capsule wardrobe from clothes they already own. Get dressed in 5 minutes.',
     content, CSS, JS, active='club', schema=faq_schema(FAQ))
print('built the-club.html')
