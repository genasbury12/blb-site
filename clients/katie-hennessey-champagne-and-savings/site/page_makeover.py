from builder import *
FAQ = [("Is this in person?", "No, it's fully virtual, so it works wherever you live."),
       ("Do I have to buy new clothes?", "No. We start with what you own. Your shopping list is short and optional."),
       ("What if I'm not sure what my style is?", "That's exactly what the call is for."),
       ("How do I get started?", "Request your Makeover and Katie will reply with next steps and available times.")]
REQ = L['contact'] + '?topic=makeover'
content = f'''
<section class="ink mk-hero"><div class="wm" style="right:-5vw;top:10%">Yours</div>{BUBBLES}<div class="wrap split">
 <div><span class="eyebrow" data-rv>Closet Makeover with Katie</span>
  <h1 data-rv>Want someone to just tell you what to wear?</h1>
  <p class="lede" data-rv="2" style="color:var(--petal)">You know a capsule would help. You just don't have the time, or the energy, to figure it out yourself. You want someone with a good eye to look at what you own and hand you the plan.</p>
  <div class="btns" data-rv="3"><a class="btn light" href="{REQ}">Request my Closet Makeover</a><span class="chip">$497 · fully virtual</span></div></div>
 <div style="max-width:420px;width:100%;margin:0 auto;position:relative" data-rv="2">{photo("Katie on a video call, styling a closet")}<div class="mk-badge">{badge("DONE FOR YOU ✦ MADE JUST FOR YOU ✦ ", "mkb", 130)}</div></div>
</div></section>

<section class="bg-linen">{intro("Introducing", "A personal capsule, built from your closet", "One video call and a plan made just for you. No learning a system. Katie does the thinking.")}
 <div class="wrap mk-steps">
  <div class="mstep" data-rv><span>01</span><div class="icon">{ICONS["cam"]}</div><h3>Send your closet</h3><p>Fill out a short form and upload photos of what you own and wear most.</p></div>
  <div class="mstep" data-rv="2"><span>02</span><div class="icon">{ICONS["video"]}</div><h3>Meet with Katie</h3><p>A video call where you walk through your closet together and talk about your life, your style, and how you want to feel.</p></div>
  <div class="mstep" data-rv="3"><span>03</span><div class="icon">{ICONS["list"]}</div><h3>Get your plan</h3><p>Your personal capsule, outfit formulas built from your actual clothes, and a short shopping list with Save, Middle, and Splurge links.</p></div>
 </div></section>

<section class="bg-white"><div class="wrap split">
 <div class="card mk-price" data-rv><span class="chip">Your investment</span><div class="amt">$497</div><p>for your personal Closet Makeover</p>
  <p class="muted" style="font-size:17px">Katie keeps spots limited each month so every closet gets her full attention.</p><a class="btn" href="{REQ}">Request my Closet Makeover</a></div>
 <div><span class="eyebrow" data-rv>Is it for you?</span><h2 data-rv>Perfect if you'd rather have a plan made just for you</h2>
  <ul class="checks" data-rv="2"><li>You'd rather pay for a plan than learn a system</li><li>You want Katie's eye on your actual closet</li><li>You want to stop guessing and start getting dressed</li></ul>
  <p data-rv="3" style="margin-top:18px">Like doing it yourself with a step-by-step plan? <a class="textlink" href="{L["club"]}">See the Cute Capsule Club</a></p></div>
</div></section>

<section class="bg-pink">{intro("Questions", "Before you request")}<div class="wrap">{faq_items_html(FAQ)}</div></section>
''' + final_cta("Let's make your closet make sense.", "made just for you", "One call, one plan, and a closet you can get dressed from in 5 minutes.", "Request my Closet Makeover", REQ)
CSS = r"""
.intro{max-width:820px;margin:0 auto 10px;padding:0 28px}.mk-hero .bubbles span{border-color:rgba(230,206,206,.4);background:transparent}
.mk-hero .lede{color:var(--petal)}.mk-badge{position:absolute;left:-30px;bottom:40px}
.mk-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;margin-top:44px}.mstep{background:var(--white);border-radius:120px 120px var(--r) var(--r);padding:44px 30px 34px;text-align:center;box-shadow:var(--shadow);position:relative}
.mstep .icon{margin:0 auto 18px}.mstep>span{position:absolute;top:18px;left:50%;transform:translateX(-50%);font-family:var(--sans);font-size:11px;letter-spacing:.3em;color:var(--rose)}
.mk-price{text-align:center}.mk-price .amt{font-family:var(--display);font-size:clamp(90px,9vw,130px);line-height:1;color:var(--bord);margin:16px 0 6px}.mk-price .btn{width:100%;justify-content:center}
@media (max-width:900px){.mk-steps{grid-template-columns:1fr}.mk-badge{left:-10px}.mk-badge .badge{width:104px!important;height:104px!important}}
"""
page('closet-makeover.html', 'Virtual Closet Makeover with Katie | Champagne & Savings',
     'A personal, done-for-you capsule built from your closet in one video call, with outfit formulas and a short shopping list.', content, CSS, active=None, schema=faq_schema(FAQ))

# ---------------- SHOP ----------------
CATS = ["This Season's Capsule","Everyday Cool Mom","Jeans That Work","Drop-Off Ready","Date Night","Under $30 Finds","Beauty","Gift Guides"]
SW = ["#F7EAEB","#3E3333","#E6CECE","#5E3F44","#F0E7E2","#A47E82","#C8AD86","#F7EAEB","#5E3F44","#E6CECE","#3E3333","#F0E7E2"]
content = f'''
<section class="sh-hero"><div class="wrap split">
 <div><span class="eyebrow" data-rv>The shop</span><h1 data-rv>Shop the looks. Skip the guesswork.</h1>
  <p class="lede" data-rv="2">Everything here is picked for real mom life: comfy enough for the park, cute enough for brunch, and priced so you don't have to think twice.</p>
  <div class="btns" data-rv="3"><a class="btn" href="#guide">Get this season's guide</a><a class="btn ghost" href="#categories">Shop by category</a></div></div>
 <div class="guide-mock" data-rv="2" aria-hidden="true"><div class="gm-top"><span>THE SEASONAL</span><b>Capsule Guide</b></div><div class="gm-grid">{"".join(f'<i style="--c:{c}"></i>' for c in SW)}</div><div class="gm-foot">30 outfits · Save, Middle, Splurge links</div></div>
</div></section>

<section class="bg-pink" id="guide"><div class="wrap split flip">
 <div><span class="eyebrow" data-rv>Featured</span><h2 data-rv>This season's capsule, done for you.</h2>
  <p data-rv="2">Want the list without the full Club? Get this season's trendy-but-classic capsule with every piece, 30 outfits made from them, and shopping links at Save, Middle, and Splurge prices.</p>
  <ul class="checks" data-rv="2"><li>A full capsule of mix-and-match pieces that all go together</li><li>30 outfits, mapped out for you</li><li>Links to places you already shop</li><li>Swap suggestions so you can use what you already own</li></ul></div>
 <div class="card prod" data-rv="2"><span class="chip">Seasonal Capsule Guide</span><div class="amt">$27</div><p>One season, done for you.</p><a class="btn" href="{L["checkout"]}">Get the guide</a>
  <p class="fine">Want a new capsule every season, plus the Closet Reset and the community? <a href="{L["club"]}">Join the Cute Capsule Club instead</a></p></div>
</div></section>

<section class="bg-linen" id="categories">{intro("Shop by category", "Find exactly what you came for")}
 <div class="wrap cats">{"".join(f'<a class="cat" href="{L["ltk"]}" data-rv="{i%3+1}"><span class="cat-art" style="--c:{SW[i]}">{ICONS["bag"]}</span><span>{c}</span></a>' for i,c in enumerate(CATS))}</div>
 <p class="center muted" data-rv style="font-size:16px;margin-top:30px">Some links on this page are affiliate links, which means I may earn a small commission at no extra cost to you. I only share pieces I'd actually wear.</p>
</section>
''' + final_cta("Want a new capsule every season?", "the whole closet", "The Cute Capsule Club gives you the Closet Reset, a new capsule each season, monthly trend edits, and a community of moms who get it.", "Join the Club", L['club'])
CSS2 = r"""
.intro{max-width:820px;margin:0 auto 10px;padding:0 28px}.sh-hero{padding-top:clamp(56px,7vw,90px)}
.guide-mock{background:var(--white);border-radius:30px;padding:30px;box-shadow:var(--shadow);max-width:420px;width:100%;margin:0 auto;transform:rotate(2deg)}
.gm-top{text-align:center;margin-bottom:18px}.gm-top span{font-family:var(--sans);font-size:11px;letter-spacing:.3em;color:var(--rose)}.gm-top b{display:block;font-family:var(--display);font-weight:400;font-size:38px}
.gm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.gm-grid i{aspect-ratio:3/4;border-radius:10px;background:var(--c);border:1px solid rgba(164,126,130,.25)}
.gm-foot{text-align:center;margin-top:16px;font-family:var(--sans);font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--bord)}
.prod{text-align:center}.prod .amt{font-family:var(--display);font-size:clamp(90px,9vw,124px);line-height:1;color:var(--bord);margin:14px 0 4px}.prod .btn{width:100%;justify-content:center}
.prod .fine{font-size:16px;color:var(--muted);margin:16px 0 0}.prod .fine a{color:var(--bord)}
.cats{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:40px}.cat{text-decoration:none;background:var(--white);border-radius:var(--r);padding:26px 20px;text-align:center;box-shadow:0 20px 40px -30px rgba(94,63,68,.6);transition:transform .3s;display:block}
.cat:hover{transform:translateY(-5px)}.cat-art{display:grid;place-items:center;width:84px;height:84px;margin:0 auto 14px;border-radius:999px 999px 18px 18px;background:var(--c);color:var(--bord);border:1px solid rgba(164,126,130,.25)}
.cat-art svg{width:32px}.cat>span:last-child{font-family:var(--display);font-size:22px;line-height:1.2}
@media (max-width:900px){.cats{grid-template-columns:1fr 1fr}.guide-mock{transform:none}}
"""
page('shop.html', 'Shop Seasonal Capsules and Mom Style Finds | Champagne & Savings',
     "Shop Katie's seasonal capsule guide and mom-approved finds, picked for real life and priced for a real budget.", content, CSS2, active='shop')

# ---------------- WORK WITH ME ----------------
content = f'''
<section class="ww-hero"><div class="wrap split">
 <div><span class="eyebrow" data-rv>Brand collaborations</span><h1 data-rv>Partner with Champagne &amp; Savings</h1>
  <p class="lede" data-rv="2">My readers are millennial moms who want to look cute and current on a real budget. They come here for trendy-but-classic outfits they can actually wear to drop-off, brunch, and date night, and for honest recommendations they can trust.</p>
  <div class="btns" data-rv="3"><a class="btn" href="{L["contact"]}?topic=collab">Request my media kit</a></div></div>
 <div class="aud card" data-rv="2"><h3>Who you'll reach</h3><ul class="checks"><li>Millennial moms who love fashion but shop on a budget</li><li>Readers looking for outfits for real mom life</li><li>Shoppers who act on honest, specific recommendations</li></ul>
  <p class="muted" style="font-size:16px;margin:10px 0 0">Current audience numbers are in the media kit.</p></div>
</div></section>
<section class="ink"><div class="wrap narrow center"><span class="eyebrow" data-rv>My promise</span><h2 data-rv>I only partner with brands I'd wear myself.</h2>
 <p class="lede" data-rv="2" style="color:var(--petal);margin:0 auto">And I'll never pressure my readers to buy something they don't need. That honesty is why they trust what I share.</p></div></section>
<section class="bg-linen">{intro("Ways we can work together", "Pick what fits your campaign")}
 <div class="wrap grid3" style="margin-top:40px">
  <div class="card" data-rv><div class="icon">{ICONS["spark"]}</div><h3>Sponsored posts and capsule features</h3><p>Your pieces styled into real, mix-and-match outfits on the blog.</p></div>
  <div class="card" data-rv="2"><div class="icon">{ICONS["video"]}</div><h3>Instagram, TikTok, and Pinterest</h3><p>Try-ons, outfit formulas, and pins built to be saved and shopped.</p></div>
  <div class="card" data-rv="3"><div class="icon">{ICONS["bag"]}</div><h3>Seasonal capsules and gift guides</h3><p>Placement in the guides moms come back to every season.</p></div>
 </div></section>
''' + final_cta("Let's create something your customers will love.", "let's collaborate", "Request the media kit for current numbers, rates, and past partnerships.", "Request my media kit", L['contact'] + '?topic=collab')
CSS3 = r""".intro{max-width:820px;margin:0 auto 10px;padding:0 28px}.ww-hero{padding-top:clamp(56px,7vw,90px)}.aud{transform:rotate(-1deg)}"""
page('work-with-me.html', 'Work With Me | Brand Collaborations | Champagne & Savings',
     'Partner with Champagne & Savings to reach millennial moms who want trendy but classic style on a real budget.', content, CSS3)

# ---------------- CONTACT ----------------
# FORMSUBMIT: replace KATIE_EMAIL with her inbox. The first submission emails her an activation link she must click.
content = f'''
<section class="ct-hero"><div class="wm" style="left:-3vw;top:4%">Hello</div><div class="wrap split">
 <div><span class="eyebrow" data-rv>Contact</span><h1 data-rv>Hi friend, let's chat!</h1>
  <p class="lede" data-rv="2">I read every message. Please give me a few business days to reply.</p>
  <div class="before" data-rv="2">
   <a href="{L["club"]}#faq"><b>Questions about the Club?</b><span>Check the Club FAQ first. It might save you a wait.</span></a>
   <a href="{L["collab"]}"><b>Brand or collaboration inquiry?</b><span>Head to Work With Me and request my media kit.</span></a>
   <a href="{L["shop"]}"><b>Looking for something I wore?</b><span>It's probably in the Shop.</span></a>
  </div></div>
 <div data-rv="2"><div class="formcard"><span class="ribbon">Say hi</span><h3>Send a message</h3><span class="script">xo, Katie</span>
  <form id="cf" action="https://formsubmit.co/KATIE_EMAIL" method="POST">
   <input type="hidden" name="_subject" value="New message from champagneandsavings.com"><input type="hidden" name="_captcha" value="false"><input type="hidden" name="_template" value="table">
   <input type="hidden" name="_next" value="https://champagneandsavings.com/contact?sent=1"><input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
   <label for="n">Name</label><input id="n" name="name" type="text" autocomplete="name" required>
   <label for="e" style="margin-top:12px">Email</label><input id="e" name="email" type="email" autocomplete="email" required>
   <label for="t" style="margin-top:12px">What's this about?</label><select id="t" name="topic"><option value="club">A Club question</option><option value="makeover">Closet Makeover</option><option value="collab">Collaboration</option><option value="other">Something else</option></select>
   <label for="m" style="margin-top:12px">Message</label><textarea id="m" name="message" rows="5" required></textarea>
   <button type="submit" class="btn">Send my message</button>
   <p class="formnote" role="status">Thank you! Your message is on its way. I'll reply within a few business days.</p>
  </form></div></div>
</div></section>
'''
CSS4 = FLODESK_CSS + r"""
.ct-hero{padding-top:clamp(56px,7vw,90px)}.before{display:grid;gap:14px;margin-top:20px}.before a{display:block;text-decoration:none;background:var(--white);border-radius:18px;padding:20px 22px;box-shadow:0 16px 32px -24px rgba(94,63,68,.55);transition:transform .25s}
.before a:hover{transform:translateX(6px)}.before b{display:block;font-family:var(--display);font-weight:400;font-size:24px}.before span{color:var(--muted);font-size:18px}
.formcard select{appearance:none;-webkit-appearance:none}
"""
JS4 = r"""
(function(){var q=new URLSearchParams(location.search),t=q.get('topic'),s=document.getElementById('t');if(t&&s)s.value=t;
var f=document.getElementById('cf');if(f){f.querySelector('[name=_next]').value=location.origin+location.pathname+'?sent=1';if(q.get('sent')==='1')f.querySelector('.formnote').classList.add('show')}})();
"""
page('contact.html', 'Contact Katie | Champagne & Savings', 'Questions about the Cute Capsule Club, a Closet Makeover, or a brand collaboration? Send Katie a message.', content, CSS4, JS4)
print('built makeover, shop, work-with-me, contact')
