from builder import *

STEPS = [("one", "Foundation first", "We start in your closet, not in a shopping cart. You'll find the pieces that already work and the core your outfits are built on."),
         ("two", "Colors that actually mix", "You'll learn which colors in your closet go together, so every new piece works with at least three things you own."),
         ("three", "Personality and gaps, on purpose", "Then we add the fun (trends, color, the pieces that feel like you) and fill only the gaps that unlock the most outfits.")]

content = f'''
<section class="ab-hero"><div class="wm" style="left:50%;transform:translateX(-50%);top:4%">Style</div><div class="wrap narrow center">
 <span class="eyebrow" data-rv>About Champagne &amp; Savings</span>
 <h1 data-rv>You didn't lose your style. Your closet just stopped fitting your life.</h1>
 <p class="lede" data-rv="2">Champagne &amp; Savings is for millennial moms who used to love getting dressed and want that feeling back, on a real budget.</p>
 <div class="btns" data-rv="3"><a class="btn" href="{L["match"]}">Find my colors</a><a class="btn ghost" href="{L["club"]}">See the Club</a></div>
</div>
<div class="wrap arches" data-rv="2">{photo("Katie, everyday outfit")}{photo("Katie, close-up portrait")}{photo("Katie, outfit at the park")}
 <div class="ab-badge">{badge("CHAMPAGNE TASTE ✦ REAL-LIFE SAVINGS ✦ ", "abb", 140, dark=True)}</div></div>
</section>

<section class="bg-linen"><div class="wrap split">
 <div>
  <span class="eyebrow" data-rv>You're in the right place</span>
  <h2 data-rv>A full closet and an even fuller schedule</h2>
  <p data-rv="2">Half your clothes don't fit this body. The other half were cute impulse buys that go with exactly nothing. So you reach for leggings, again.</p>
  <span class="script" data-rv="3">Oh, you're in just the right spot, mama.</span>
  <p data-rv="3" style="margin-top:18px">That's where I come in: <strong>capsule wardrobes for moms</strong> that are trendy but classic, built around real life, and kind to your budget.</p>
 </div>
 <div class="card wish" data-rv="2"><h3>Do you ever just want to...</h3><ul class="checks">
  <li>Open your closet and <em>know</em> what to wear?</li><li>Feel cute at drop-off without looking like you're trying too hard?</li>
  <li>Stop wondering if your jeans are giving 2014?</li><li>Spend a little on yourself without the guilt, because you know it'll actually get worn?</li></ul></div>
</div></section>

<section class="ink"><div class="wm" style="right:-4vw;bottom:-6%">Katie</div><div class="wrap split">
 <div>
  <span class="eyebrow" data-rv>The track record</span>
  <h2 data-rv>Hi, I'm Katie Hennessey.</h2>
  <p data-rv="2">I've been sharing affordable fashion and shopping finds here since 2019. I left my job in the medical field to blog, and I also run an agency that manages LTK and Pinterest accounts for other bloggers, so I spend a lot of my week watching what's trending and what shoppers actually love.</p>
  <p data-rv="2">But the credential that matters most? I'm a millennial mom too. I know what it's like to stand in front of a full closet and still feel like you have nothing to wear.</p>
 </div>
 <div class="facts" data-rv="2">
  <div class="fact"><b>2019</b><span>Sharing affordable style since</span></div>
  <div class="fact"><b>LTK + Pinterest</b><span>Runs an agency for other bloggers</span></div>
  <div class="fact"><b>Medical field</b><span>Where she worked before blogging</span></div>
  <div class="fact"><b>Millennial mom</b><span>The credential that matters most</span></div>
 </div>
</div></section>

<section class="bg-white">{intro("How we'll do it", "Here's how we build a closet that works", "Tap a card to flip it.")}
 <div class="wrap grid3 flips">{"".join(f'<button type="button" class="fcard" data-rv="{i+1}" aria-label="{t}"><span class="fc front"><span class="num">{n}</span><span class="ft">{t}</span><span class="hint">flip me</span></span><span class="fc back"><span class="ft small">{t}</span>{d}</span></button>' for i,(n,t,d) in enumerate(STEPS))}</div>
 <p class="center" data-rv style="margin-top:34px"><span class="script">a closet you can get dressed from in 5 minutes</span></p>
</section>

<section class="bg-pink"><div class="wrap split flip">
 <div>
  <span class="eyebrow" data-rv>The real me</span>
  <h2 data-rv>A few things you should know about me</h2>
  <ul class="checks" data-rv="2">
   <li>I'm a self-described recovering shopping addict, which is exactly why I believe in shopping your closet first.</li>
   <li>I planned my dream Pinterest wedding on a budget, and it actually came true. Champagne taste, savings mindset. It's in the name.</li>
   <li>I'll always tell you when something's on sale, when it runs small, and when you can skip it.</li>
  </ul>
 </div>
 <div class="ab-polas" data-rv="2"><div class="pola q1">{photo("Katie candid, real mom life", "polaroid-photo")}<span>real life</span></div><div class="pola q2">{photo("Katie wedding photo", "polaroid-photo")}<span>dream wedding</span></div><div class="pola q3">{photo("Katie shopping haul, honest review", "polaroid-photo")}<span>sale alert</span></div></div>
</div></section>
''' + final_cta("Ready to feel like yourself in your clothes again?", "let's do this together",
     "Start with the free Mom Color Match to see which colors in your closet already go together. Or, if you're ready for the whole thing, join the Cute Capsule Club and start your Closet Reset this week.",
     "Find my colors", L['match'], ("Join the Club", L['club']))

CSS = r"""
.ab-hero{padding-bottom:90px}.arches{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:22px;align-items:end;margin-top:60px;max-width:980px}
.arches>.photo:nth-child(1),.arches>.photo:nth-child(3){aspect-ratio:3/4}.ab-badge{position:absolute;right:4%;bottom:-40px;z-index:3}
.wish h3{margin-bottom:18px}.wish{transform:rotate(1deg)}
.facts{display:grid;grid-template-columns:1fr 1fr;gap:16px}.fact{border:1px solid rgba(247,234,235,.22);border-radius:22px;padding:26px 22px;background:rgba(247,234,235,.05)}
.fact b{display:block;font-family:var(--display);font-weight:400;font-size:clamp(28px,2.6vw,38px);color:var(--pink);line-height:1.1;margin-bottom:8px}
.fact span{font-family:var(--sans);font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.85}
.flips{margin-top:44px}.fcard{position:relative;height:330px;border:0;padding:0;background:none;cursor:pointer;perspective:1200px;font:inherit;color:inherit;text-align:center}
.fc{position:absolute;inset:0;border-radius:var(--r);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:34px;backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform .8s cubic-bezier(.3,.7,.2,1);box-shadow:var(--shadow)}
.front{background:var(--petal)}.back{background:var(--bord);color:var(--petal);transform:rotateY(180deg);font-size:19px;line-height:1.5}
.fcard:hover .front,.fcard:focus-visible .front,.fcard.on .front{transform:rotateY(-180deg)}.fcard:hover .back,.fcard:focus-visible .back,.fcard.on .back{transform:rotateY(0)}
.fcard .num{font-family:var(--script);font-size:56px;color:var(--rose);line-height:1}.ft{font-family:var(--display);font-size:30px;line-height:1.15;margin:10px 0 18px}.ft.small{font-size:22px;color:var(--pink);margin:0 0 12px}
.hint{font-family:var(--sans);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--bord)}
.ab-polas{position:relative;min-height:470px;width:100%}.ab-polas .pola{position:absolute;background:var(--white);padding:12px 12px 16px;box-shadow:var(--shadow);width:min(230px,52%)}
.ab-polas .pola span{display:block;font-family:var(--script);font-size:30px;color:var(--bord);text-align:center;margin-top:6px}.ab-polas .photo{box-shadow:none}
.q1{left:0;top:10px;transform:rotate(-6deg)}.q2{left:30%;top:120px;transform:rotate(3deg);z-index:2}.q3{right:0;top:0;transform:rotate(7deg)}
@media (max-width:900px){.arches{grid-template-columns:1fr 1fr;max-width:460px}.arches>.photo:nth-child(3){display:none}.ab-badge{right:-4px;bottom:-30px}.ab-badge .badge{width:110px!important;height:110px!important}
.facts{grid-template-columns:1fr 1fr}.ab-polas{min-height:430px;max-width:420px;margin:0 auto}}
"""
JS = r"""[].forEach.call(document.querySelectorAll('.fcard'),function(f){f.addEventListener('click',function(){f.classList.toggle('on')})});"""

page('about.html', 'About Katie | Champagne & Savings',
     'Meet Katie, the millennial mom behind Champagne & Savings, helping moms build cute, budget-friendly capsule wardrobes from clothes they already own.',
     content, CSS, JS, active='about')
print('built about.html')
