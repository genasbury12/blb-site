#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Holistik Queen: homepage."""
from builder import page, faq_html, faq_schema, spinbadge, SQUIG

FAQS = [
    ("Who is Holistik Queen for?",
     "Women 40 and up who are done with crash diets, contradictory advice, and 40-step routines. If you want simple, evidence-informed lifestyle changes that actually fit a busy life, you are exactly who this site was built for."),
    ("Is this medical advice?",
     "No. Victoria is a licensed respiratory therapist (B.S., RCP, RRT) and everything here is education, not diagnosis or treatment. Use it to have smarter conversations with your own doctor, not to replace them."),
    ("What does it cost to read?",
     "Nothing. The articles, the guides, and the Crown Letter newsletter are all free. Start with the free Queen's Reset guide and go from there."),
    ("Where should I start?",
     "Grab the free Queen's Reset on the Start Here page. It walks you through 7 simple swaps, one per day, so you can feel a difference in a week without buying a single supplement."),
    ("Why 'holistic' with a k?",
     "Because Holistik Queen looks at the whole picture, your sleep, food, stress, home, and beauty routine, and because every queen deserves a crown that is spelled her own way."),
]

CSS = r"""
/* hero */
.hero{position:relative;padding:90px 0 110px;overflow:hidden}
.hero .grid{display:grid;grid-template-columns:1.15fr .85fr;gap:60px;align-items:center}
.hero h1{margin:16px 0 10px}
.hero .hand{margin-bottom:6px}
.hero .ctas{display:flex;flex-wrap:wrap;gap:16px;margin-top:32px}
.hero .proof{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.hero .badgewrap{position:absolute;right:4%;top:60px;color:var(--emerald);display:none}
@media(min-width:1100px){.hero .badgewrap{display:block}}
.type-word{color:var(--coral);font-style:italic}
/* CSS-art portrait panel: swap the inner div for the client photo */
.artpanel{border-radius:46vw 46vw 24px 24px;position:relative;min-height:480px;width:100%;
  background:linear-gradient(160deg,#DCE9D2,#F3DDD0 55%,#F7E8CD);overflow:hidden;
  box-shadow:0 40px 70px -40px rgba(28,58,42,.5);border:1px solid rgba(28,58,42,.08)}
.artpanel .leafs{position:absolute;inset:0;opacity:.85}
.artpanel .crownchip{position:absolute;left:50%;bottom:26px;translate:-50% 0;background:rgba(253,249,240,.92);
  border-radius:16px;padding:14px 22px;text-align:center;box-shadow:0 18px 40px -18px rgba(28,58,42,.4);width:max-content}
.artpanel .crownchip b{font-family:var(--display);font-style:italic;font-size:1.2rem;display:block}
.artpanel .crownchip span{font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:var(--emerald)}
.floatchip{position:absolute;background:#fff;border-radius:60px;padding:10px 20px;font-weight:600;font-size:.82rem;
  box-shadow:0 16px 34px -16px rgba(28,58,42,.4);animation:bob 5s ease-in-out infinite}
.floatchip.a{top:12%;left:-24px;animation-delay:-1s}
.floatchip.b{top:38%;right:-18px;animation-delay:-2.6s;background:var(--ink);color:var(--paper)}
@keyframes bob{50%{translate:0 -12px}}
/* press strip */
.press{padding:34px 0;border-top:1px solid rgba(28,58,42,.08);border-bottom:1px solid rgba(28,58,42,.08)}
.press .mtrack span{font-family:var(--body);font-style:normal;font-weight:700;font-size:.85rem;
  letter-spacing:.28em;text-transform:uppercase;color:var(--muted)}
/* pillars */
.pillars{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:54px}
.pillar{display:block;text-decoration:none;border-radius:24px;padding:32px 24px 28px;position:relative;
  overflow:hidden;color:var(--ink);background:#fff;border:1px solid rgba(28,58,42,.08);
  box-shadow:0 24px 50px -32px rgba(28,58,42,.35);transition:transform .3s,box-shadow .3s}
.pillar:hover{transform:translateY(-8px) rotate(-.5deg);box-shadow:0 36px 60px -30px rgba(28,58,42,.42)}
.pillar .pnum{font-family:var(--display);font-style:italic;font-size:2.4rem;color:var(--accent,#1E6F50);line-height:1}
.pillar h3{font-size:1.45rem;margin:12px 0 8px}
.pillar p{font-size:.92rem;color:var(--muted)}
.pillar .go{display:inline-block;margin-top:16px;font-weight:700;font-size:.78rem;letter-spacing:.18em;
  text-transform:uppercase;color:var(--accent,#1E6F50)}
.pillar::after{content:'';position:absolute;top:-30px;right:-30px;width:90px;height:90px;border-radius:50%;
  background:var(--accent,#1E6F50);opacity:.12}
/* meet band */
.meet{position:relative;overflow:hidden}
.meet .grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:60px;align-items:center}
.meet .medallion{width:100%;max-width:380px;aspect-ratio:1;border-radius:50%;margin:0 auto;position:relative;
  background:radial-gradient(circle at 35% 30%,#2c5a41,#16301f 70%);border:1px solid rgba(201,151,62,.5);
  display:grid;place-items:center;text-align:center;padding:40px}
.meet .medallion .mq{font-family:var(--display);font-style:italic;font-size:5.6rem;color:var(--gold);line-height:1}
.meet .medallion .mt{font-size:.72rem;letter-spacing:.3em;text-transform:uppercase;font-weight:700;color:#cfdcc9;margin-top:8px}
.meet .medallion::after{content:'';position:absolute;inset:14px;border-radius:50%;border:1px dashed rgba(201,151,62,.45)}
.meet .stats{margin-top:44px;text-align:left}
/* toggle: old way vs holistik way */
.ways{max-width:900px;margin:50px auto 0}
.wswitch{display:flex;justify-content:center;gap:0;margin-bottom:34px}
.wswitch button{font-family:var(--body);font-weight:700;font-size:.82rem;letter-spacing:.14em;text-transform:uppercase;
  padding:14px 28px;border:1.5px solid var(--ink);background:transparent;color:var(--ink);cursor:pointer}
.wswitch button:first-child{border-radius:60px 0 0 60px}
.wswitch button:last-child{border-radius:0 60px 60px 0;border-left:0}
.wswitch button.on{background:var(--ink);color:var(--paper)}
.wpanel{display:none;grid-template-columns:1fr;gap:14px}
.wpanel.on{display:grid}
.wrow{display:flex;gap:16px;align-items:flex-start;background:#fff;border-radius:18px;padding:20px 24px;
  border:1px solid rgba(28,58,42,.09);box-shadow:0 14px 30px -24px rgba(28,58,42,.3)}
.wrow .ic{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:1rem}
.wpanel.old .ic{background:#F6E3DC;color:var(--clay)}
.wpanel.new .ic{background:#E2EFE4;color:var(--emerald)}
.wrow b{display:block;font-family:var(--display);font-size:1.2rem;font-weight:600}
.wrow p{font-size:.94rem;color:var(--muted)}
/* checklist */
.flagwrap{max-width:860px;margin:50px auto 0}
.flags{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.flag{display:flex;align-items:center;gap:14px;background:#fff;border:1.5px solid rgba(28,58,42,.12);
  border-radius:16px;padding:16px 20px;cursor:pointer;transition:border-color .2s,background .2s;user-select:none}
.flag .box{flex:none;width:26px;height:26px;border-radius:8px;border:2px solid var(--emerald);display:grid;
  place-items:center;color:#fff;font-size:.8rem;transition:background .2s}
.flag.on{border-color:var(--coral);background:#FFF6EF}
.flag.on .box{background:var(--coral);border-color:var(--coral)}
.flag span{font-size:.95rem}
.meter{margin-top:26px;background:#fff;border-radius:60px;border:1.5px solid rgba(28,58,42,.12);padding:8px;
  position:relative;height:46px;overflow:hidden}
.meter i{display:block;height:100%;width:0;border-radius:60px;background:linear-gradient(90deg,var(--gold),var(--coral));
  transition:width .5s ease}
.flagnote{text-align:center;margin-top:18px;font-family:var(--script);font-size:1.7rem;color:var(--emerald);min-height:2.2em}
/* crown letter */
.crownletter{position:relative;overflow:hidden}
.clcard{max-width:860px;margin:0 auto;background:#fff;border:1.5px solid var(--ink);border-radius:26px;
  padding:56px 48px;position:relative;box-shadow:12px 12px 0 var(--honey);text-align:center}
.clcard .ribbon{position:absolute;top:22px;right:-42px;rotate:45deg;background:var(--coral);color:#fff;
  font-size:.68rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;padding:8px 50px}
.clform{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;margin-top:30px;text-align:left}
.clform .btn{white-space:nowrap}
.clsmall{font-size:.8rem;color:var(--muted);margin-top:14px}
@media(max-width:900px){
  .hero .grid,.meet .grid{grid-template-columns:1fr}
  .artpanel{min-height:400px}
  .flags{grid-template-columns:1fr}
  .clform{grid-template-columns:1fr}
}
"""

JS = r"""
(function(){
  /* old way / holistik way toggle */
  var tabs=document.querySelectorAll('.wswitch button');
  var panels=document.querySelectorAll('.wpanel');
  tabs.forEach(function(t){t.addEventListener('click',function(){
    tabs.forEach(function(x){x.classList.remove('on');});
    panels.forEach(function(p){p.classList.remove('on');});
    t.classList.add('on');
    document.getElementById(t.dataset.panel).classList.add('on');});});

  /* body flag checklist */
  var flags=document.querySelectorAll('.flag'),bar=document.getElementById('flagbar'),
      note=document.getElementById('flagnote');
  var notes=['tap what feels familiar, babe','one flag: worth a gentle look',
    'two flags: your body is whispering','three flags: that is a pattern, not a phase',
    'four flags: time for the Queen’s Reset','five or more: deep breath. start with one swap this week.'];
  function upd(){var n=document.querySelectorAll('.flag.on').length;
    if(bar)bar.style.width=(n/flags.length*100)+'%';
    if(note)note.textContent=notes[Math.min(n,notes.length-1)];}
  flags.forEach(function(f){f.addEventListener('click',function(){
    f.classList.toggle('on');
    f.querySelector('.box').textContent=f.classList.contains('on')?'✓':'';upd();});});
  upd();
})();
"""

LEAF_SVG = """<svg class="leafs" viewBox="0 0 400 520" fill="none" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<g stroke="#1C3A2A" stroke-width="1.6" opacity=".5">
<path d="M200 500 C 200 380 180 300 120 220 M200 500 C 200 380 220 300 280 220"/>
<path d="M120 220 C 100 190 95 160 105 130 M120 220 C 150 200 165 175 168 140"/>
<path d="M280 220 C 300 190 305 160 295 130 M280 220 C 250 200 235 175 232 140"/>
<ellipse cx="105" cy="115" rx="16" ry="30" transform="rotate(-25 105 115)"/>
<ellipse cx="168" cy="122" rx="14" ry="27" transform="rotate(12 168 122)"/>
<ellipse cx="295" cy="115" rx="16" ry="30" transform="rotate(25 295 115)"/>
<ellipse cx="232" cy="122" rx="14" ry="27" transform="rotate(-12 232 122)"/>
<circle cx="200" cy="95" r="26"/>
<path d="M186 88 l6 10 8 -16 8 16 6 -10" stroke-width="2"/>
</g></svg>"""

PILLARS = [
    ("holistic-health.html", "01", "#1E6F50", "Holistic Health",
     "Prevent and push back on chronic disease with habits your future self will thank you for."),
    ("clean-eating.html", "02", "#6B8F3C", "Clean Eating",
     "Real food, fewer labels to decode, and zero guilt. Eating well without living in the kitchen."),
    ("mindful-wellness.html", "03", "#7C6AA6", "Mindful Wellness",
     "Stress, sleep, and a nervous system that finally gets to exhale. Calm is a skill you can learn."),
    ("eco-beauty.html", "04", "#C96F5E", "Eco Beauty",
     "Glow without the toxic fine print. Cleaner swaps for your skin, hair, and bathroom shelf."),
    ("conscious-lifestyle.html", "05", "#C9973E", "Conscious Lifestyle",
     "A home and a routine that work for your health, your wallet, and the planet you live on."),
]

pillar_cards = "".join(
    '<a class="pillar rise" href="%s" style="--accent:%s"><span class="pnum">%s</span>'
    '<h3>%s</h3><p>%s</p><span class="go">Explore &rarr;</span></a>' % (h, c, n, t, p)
    for h, n, c, t, p in PILLARS)

press = "<span>&#10022;&ensp;Authority Magazine</span><span>&#10022;&ensp;SheFinds</span><span>&#10022;&ensp;Carewell</span><span>&#10022;&ensp;Mude</span><span>&#10022;&ensp;Dreambound</span>"

flags_items = [
    "Coffee is the only reason you make it to noon",
    "You sleep 7 hours and still wake up tired",
    "The 3pm crash runs your afternoon",
    "Your skin and hair feel duller than they used to",
    "Little aches are becoming background noise",
    "Bloating shows up no matter what you eat",
    "You snap at people you love, then feel awful",
    "Your doctor said 'let's keep an eye on it'",
]
flags_html = "".join('<div class="flag" role="button" tabindex="0"><span class="box"></span><span>%s</span></div>' % f
                     for f in flags_items)

content = """
<!-- HERO -->
<section class="hero">
  <div class="ghost" style="top:24px">wellness</div>
  <div class="wrap grid" style="position:relative;z-index:1">
    <div>
      <span class="eyebrow rise">Holistic health &amp; wellness for women 40+</span>
      <h1 class="h-xl rise">Your health is your <span class="type-word" data-words='["crown.","energy.","freedom.","future."]'>crown.</span><br>Wear it well.</h1>
      <span class="hand rise">no fads, no fear, just simple science, babe</span>
      <p class="lede rise" style="max-width:540px;margin-top:18px">Holistik Queen helps women over 40 prevent and reverse chronic disease with
      simple lifestyle changes that save you time and money. Written by Victoria, a licensed respiratory
      therapist who spent years watching preventable disease win, and decided to teach women how to stop it early.</p>
      <div class="ctas rise">
        <a class="btn btn-coral" href="start-here.html">Get the free Queen&rsquo;s Reset <span class="arr">&rarr;</span></a>
        <a class="btn btn-ghost" href="about.html">Meet Victoria</a>
      </div>
      <div class="proof rise">
        <span class="chip">&#10047; B.S., RCP, RRT</span>
        <span class="chip">&#10047; 15+ years in patient care</span>
        <span class="chip">&#10047; Featured in Authority Magazine</span>
      </div>
    </div>
    <div class="rise" style="position:relative">
      <!-- CLIENT PHOTO SLOT: replace .artpanel inner art with <img> of Victoria when photos arrive -->
      <div class="artpanel">%(leaf)s
        <div class="crownchip"><span>Est. by Victoria</span><b>reigning over her own health</b></div>
      </div>
      <div class="floatchip a">&#127807; 7 swaps, 7 days</div>
      <div class="floatchip b">&#10024; simple &gt; extreme</div>
    </div>
  </div>
  <div class="badgewrap">%(badge)s</div>
</section>

<!-- PRESS MARQUEE -->
<div class="press marq">
  <div class="mtrack" aria-hidden="true"><span style="font-family:var(--script);font-size:1.4rem;text-transform:none;letter-spacing:0;color:var(--gold)">as seen in&ensp;</span>%(press)s<span style="font-family:var(--script);font-size:1.4rem;text-transform:none;letter-spacing:0;color:var(--gold)">as seen in&ensp;</span>%(press)s</div>
</div>

<!-- PILLARS -->
<section>
  <div class="wrap center">
    <span class="eyebrow rise">The five crown jewels</span>
    <h2 class="h-lg rise">Everything here fits under<br><span class="it hl">five simple topics</span></h2>
    %(squig)s
    <p class="lede rise narrow" style="margin:20px auto 0">Pick the one your body has been nudging you about. Each topic is a
    library of short, practical reads you can act on the same day.</p>
    <div class="pillars">%(pillars)s</div>
  </div>
</section>

<!-- MEET VICTORIA (INK) -->
<section class="sec-ink meet">
  <div class="ghost" style="bottom:10px">Victoria</div>
  <div class="wrap grid" style="position:relative;z-index:1">
    <div class="rise">
      <div class="medallion"><div><div class="mq">V.</div><div class="mt">B.S. &middot; RCP &middot; RRT</div></div></div>
    </div>
    <div>
      <span class="eyebrow rise">Meet your wellness bestie</span>
      <h2 class="h-lg rise">I watched chronic disease up close.<br><span class="it" style="color:var(--gold)">Then I chose prevention.</span></h2>
      <p class="lede rise" style="margin-top:18px">I'm Victoria. For years I worked as a respiratory therapist in renowned
      San Francisco Bay Area hospitals, caring for patients with complex cardiopulmonary and chronic disease.
      I saw the same story on repeat: conditions that took decades to build and could have been softened,
      delayed, or prevented entirely with everyday choices.</p>
      <p class="lede rise" style="margin-top:14px">Holistik Queen is me handing you that head start. Simple, realistic
      changes that protect your energy, your money, and your years.</p>
      <div class="stats">
        <div class="rise"><div class="num"><span data-count="15">0</span>+</div><div class="lbl">Years in respiratory care</div></div>
        <div class="rise"><div class="num"><span data-count="5">0</span></div><div class="lbl">Wellness pillars</div></div>
        <div class="rise"><div class="num"><span data-count="7">0</span></div><div class="lbl">Swaps in the free reset</div></div>
        <div class="rise"><div class="num"><span data-count="100">0</span>%%</div><div class="lbl">Free to read, always</div></div>
      </div>
      <div class="rise" style="margin-top:36px"><a class="btn btn-ghost" href="about.html">Read my story <span class="arr">&rarr;</span></a></div>
    </div>
  </div>
</section>

<!-- OLD WAY / HOLISTIK WAY -->
<section>
  <div class="wrap">
    <div class="center">
      <span class="eyebrow rise">A tale of two mornings</span>
      <h2 class="h-lg rise">The 2am Google spiral<br>vs. <span class="it hl hl-coral">the Holistik way</span></h2>
      <span class="hand rise">flip the switch and feel the difference</span>
    </div>
    <div class="ways rise">
      <div class="wswitch" role="tablist">
        <button class="on" data-panel="wold" role="tab">The old way</button>
        <button data-panel="wnew" role="tab">The Holistik way</button>
      </div>
      <div class="wpanel old on" id="wold">
        <div class="wrow"><span class="ic">&#10007;</span><div><b>Symptom-Googling at 2am</b><p>Forty open tabs, four contradictory answers, and one brand new fear you didn't have at bedtime.</p></div></div>
        <div class="wrow"><span class="ic">&#10007;</span><div><b>A $200 supplement haul</b><p>Half of it expires untouched. Nobody can tell you what the other half actually did.</p></div></div>
        <div class="wrow"><span class="ic">&#10007;</span><div><b>All-or-nothing January energy</b><p>Two extreme weeks, one busy weekend, and the whole plan quietly disappears.</p></div></div>
        <div class="wrow"><span class="ic">&#10007;</span><div><b>Waiting for the wake-up call</b><p>Nothing changes until a lab result forces it. Prevention was cheaper, in every currency.</p></div></div>
      </div>
      <div class="wpanel new" id="wnew">
        <div class="wrow"><span class="ic">&#10003;</span><div><b>One trusted source, five topics</b><p>Short evidence-informed reads from a licensed clinician, filed exactly where you can find them.</p></div></div>
        <div class="wrow"><span class="ic">&#10003;</span><div><b>Swaps before supplements</b><p>Start with sleep, food, movement, and stress. They are free, and they do the heavy lifting.</p></div></div>
        <div class="wrow"><span class="ic">&#10003;</span><div><b>One change a week</b><p>Small enough to keep on your worst week. That is the entire secret to habits that stay.</p></div></div>
        <div class="wrow"><span class="ic">&#10003;</span><div><b>Prevention as a lifestyle</b><p>You get ahead of disease years before it starts, and your future self reigns because of it.</p></div></div>
      </div>
    </div>
  </div>
</section>

<!-- BODY FLAGS CHECKLIST (TINT) -->
<section class="sec-tint">
  <div class="wrap">
    <div class="center">
      <span class="eyebrow rise">A 30-second check-in</span>
      <h2 class="h-lg rise">Is your body <span class="it hl">waving little flags?</span></h2>
      <p class="lede rise narrow" style="margin:16px auto 0">Tap every card that feels familiar. No judgment, just information.
      Your body keeps receipts, and it would love you to read them.</p>
    </div>
    <div class="flagwrap rise">
      <div class="flags">%(flags)s</div>
      <div class="meter" aria-hidden="true"><i id="flagbar"></i></div>
      <div class="flagnote" id="flagnote">tap what feels familiar, babe</div>
      <div class="center" style="margin-top:26px"><a class="btn btn-coral" href="start-here.html">Start the free 7-day reset <span class="arr">&rarr;</span></a></div>
    </div>
  </div>
</section>

<!-- CROWN LETTER -->
<section class="crownletter">
  <div class="ghost" style="top:16px">the letter</div>
  <div class="wrap" style="position:relative;z-index:1">
    <div class="clcard rise">
      <span class="ribbon">Subscriber only</span>
      <span class="eyebrow">The Crown Letter</span>
      <h2 class="h-md" style="margin:12px 0 6px">Some things I only tell my subscribers.</h2>
      <span class="hand">don&rsquo;t miss out, babe</span>
      <p class="muted" style="max-width:560px;margin:14px auto 0">One short letter. The swap of the week, what the research
      actually said, and the honest version of what I'm testing on myself. Free forever, unsubscribe whenever.</p>
      <!-- WAITING ON CLIENT: replace with the real email platform (Flodesk) embed. FormSubmit needs its one-time activation click. -->
      <form class="clform" action="https://formsubmit.co/hello@holistikqueen.com" method="POST">
        <input type="hidden" name="_subject" value="New Crown Letter subscriber">
        <input type="hidden" name="_captcha" value="false">
        <input type="hidden" name="_template" value="table">
        <input type="hidden" name="_next" value="https://www.holistikqueen.com/?sub=1">
        <div><label class="flabel" for="clname">First name</label><input class="field" id="clname" name="name" required placeholder="Your name"></div>
        <div><label class="flabel" for="clemail">Email</label><input class="field" id="clemail" type="email" name="email" required placeholder="you@example.com"></div>
        <div style="display:flex;align-items:flex-end"><button class="btn btn-coral" type="submit">Crown me &#10022;</button></div>
      </form>
      <p class="clsmall">Comes with the free Queen&rsquo;s Reset guide. No spam, ever. That would be very unroyal.</p>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="sec-tint">
  <div class="wrap">
    <div class="center" style="margin-bottom:40px">
      <span class="eyebrow rise">Before you ask</span>
      <h2 class="h-lg rise">Questions, <span class="it hl">answered honestly</span></h2>
    </div>
    %(faq)s
  </div>
</section>

<!-- FINAL CTA -->
<section class="sec-ink" style="text-align:center;position:relative;overflow:hidden">
  <div class="ghost" style="top:20px">reign</div>
  <div class="wrap" style="position:relative;z-index:1">
    <span class="hand rise" style="font-size:2.2rem">ready when you are, babe</span>
    <h2 class="h-xl rise" style="margin:10px 0 18px">Put the crown on.<br><span class="shimmer it">Start with one swap.</span></h2>
    <p class="lede rise narrow" style="margin:0 auto 34px">Seven days, seven royally simple swaps, zero dollars.
    The Queen&rsquo;s Reset is the head start I wish every one of my patients had gotten.</p>
    <div class="rise"><a class="btn btn-coral" href="start-here.html">Claim the free Queen&rsquo;s Reset <span class="arr">&rarr;</span></a></div>
  </div>
</section>
""" % {
    "leaf": LEAF_SVG,
    "badge": spinbadge("WELLNESS &#183; FIT FOR A &#183; QUEEN &#183; 40+ &#183;", "&#9813;", "hero"),
    "press": press,
    "pillars": pillar_cards,
    "flags": flags_html,
    "faq": faq_html(FAQS),
    "squig": SQUIG % "#C9973E",
}

page("index.html",
     "Holistik Queen | Holistic Health & Wellness for Women 40+",
     "Simple, science-informed lifestyle changes that help women over 40 prevent and reverse chronic disease. By Victoria, B.S., RCP, RRT. Start with the free Queen's Reset.",
     content, extra_css=CSS, extra_js=JS, schema=faq_schema(FAQS))
