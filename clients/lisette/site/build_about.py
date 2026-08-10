#!/usr/bin/env python3
"""About page. BIO PHOTO SLOTS STAY AS PLACEHOLDERS per client direction
until brand photos arrive. Run: python3 build_about.py"""
from builder import page, img

CSS = r"""
.ahero{padding:84px 0 70px;background:var(--tint)}
.ahero .split{align-items:center}
.ahero h1{font-size:clamp(42px,5.8vw,70px);margin:14px 0 12px}
.ahero .arch .ph{min-height:460px}
.story{max-width:760px;margin:0 auto}
.story p{margin-bottom:22px;font-size:18.5px}
.story p:first-of-type::first-letter{font-family:var(--serif);font-size:74px;line-height:.8;
  float:left;padding:8px 14px 0 0;color:var(--lav)}
.pull{border-left:3px solid var(--gold);padding:6px 0 6px 26px;margin:34px 0;
  font-family:var(--serif);font-style:italic;font-size:26px;color:var(--deep)}
.jtl{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:48px}
.jcard{background:#fff;border-radius:var(--rad);padding:26px;box-shadow:var(--shadow);
  border-top:4px solid var(--lav)}
.jcard .jyr{font-family:var(--script);color:var(--gold);font-size:28px}
.jcard h3{font-size:21px;margin:6px 0 8px}
.jcard p{font-size:15.5px;color:var(--muted)}
.beliefs .bgrid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:44px;max-width:900px;margin-left:auto;margin-right:auto}
.bcard{border-radius:var(--rad);padding:30px 32px;background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.14)}
.bcard .hand{font-size:28px}
.bcard h3{font-size:23px;margin:6px 0 8px;color:#fff}
.bcard p{font-size:16px;color:#CFC8DA}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:26px;max-width:820px;margin:44px auto 0}
.dcard{text-align:center;padding:34px 28px}
.dcard .ph{min-height:260px;border-radius:14px;margin-bottom:18px}
.dcard h3{font-size:25px}
.dcard .hand{font-size:24px}
@media(max-width:920px){
  .jtl{grid-template-columns:1fr 1fr}
  .beliefs .bgrid,.duo{grid-template-columns:1fr}
  .ahero .arch .ph{min-height:360px}
}
"""

content = f"""
<section class="ahero">
  <div class="ghostword" style="bottom:-10px;left:-30px">Notre Histoire</div>
  <div class="wrap split">
    <div>
      <span class="eyebrow">Our story</span>
      <h1>Bonjour from the two of us</h1>
      <p class="lede" style="margin:0 0 22px">We are a married couple in our fifties, four grown kids between us, planning the exact retirement we help you plan: a life in the South of France.</p>
      <span class="hand">enchantes de vous rencontrer</span>
    </div>
    <div class="arch">{img('', 'Lisette and her husband', label='Bio photo coming soon<br>Lisette &amp; her husband', tone='field')}</div>
  </div>
</section>

<section class="sect">
  <div class="wrap">
    <div class="story">
      <span class="eyebrow">How we got here</span>
      <h2 class="h2">France is not a fantasy for us. It is home.</h2>
      <p>I lived in France for years before moving to the United States. I speak the language fluently, I know the culture from the inside, and I never stopped missing the rhythm of life there. The markets on Saturday morning. The long lunches. The way nobody rushes you out of a cafe.</p>
      <p>My husband and I built full lives here. Careers, four wonderful kids, all of it. And somewhere along the way we made each other a promise: we were not going to spend our best years waiting for someday. We are planning our return to the South of France, and we are doing it carefully, joyfully, and on purpose.</p>
      <div class="pull">Most retirement advice tells you how to save for retirement. Almost nobody helps you plan what you are retiring to.</div>
      <p>When we started organizing our own move, we discovered how confusing the process is when you do it alone. Conflicting visa advice. Endless region lists. Language fear. We also discovered something better: with the right order of operations, it is all very doable. That is what Marriage &amp; Retirement Abroad exists to share.</p>
      <p>And here is our favorite secret: you do not have to wait for one big lump sum retirement at the end of your career. We help couples think in segments, two or three years at a time, so the dream can start sooner than you think.</p>
    </div>
  </div>
</section>

<section class="sect tint">
  <div class="wrap">
    <div style="text-align:center;max-width:620px;margin:0 auto">
      <span class="eyebrow" style="justify-content:center">The road so far</span>
      <h2 class="h2">Our journey, the short version</h2>
    </div>
    <div class="jtl">
      <div class="jcard"><div class="jyr">then</div><h3>Years in France</h3><p>Lisette lives in France, becomes fluent, and falls for the culture for good.</p></div>
      <div class="jcard"><div class="jyr">after</div><h3>Building a life in Texas</h3><p>Careers, marriage, four kids grown and launched. The dream stays quietly alive.</p></div>
      <div class="jcard"><div class="jyr">now</div><h3>Planning our return</h3><p>We are mapping our own retirement in the South of France, step by step.</p></div>
      <div class="jcard"><div class="jyr">next</div><h3>Bringing couples along</h3><p>Practice trips, custom plans, and French lessons so you can join us over there.</p></div>
    </div>
  </div>
</section>

<section class="sect ink beliefs">
  <div class="ghostword" style="top:0;right:-30px;-webkit-text-stroke-color:rgba(255,255,255,.08)">Croyances</div>
  <div class="wrap">
    <div style="text-align:center;max-width:620px;margin:0 auto">
      <span class="eyebrow">What we believe</span>
      <h2 class="h2">The MRA way of thinking</h2>
    </div>
    <div class="bgrid">
      <div class="bcard"><span class="hand">number one</span><h3>Retire TO something</h3><p>A retirement without a dream attached is just a very long weekend. We plan the lifestyle first, then the logistics.</p></div>
      <div class="bcard"><span class="hand">number two</span><h3>Sooner beats someday</h3><p>Retirement can come in segments. A few years abroad in your fifties counts, and it might be the best ones.</p></div>
      <div class="bcard"><span class="hand">number three</span><h3>Do it together</h3><p>This is a couples adventure. Both dreams go on the map, both voices pick the town, both of you order the croissants.</p></div>
      <div class="bcard"><span class="hand">number four</span><h3>Practice before you promise</h3><p>You would test drive a car. Test drive your French retirement before you commit to it.</p></div>
    </div>
  </div>
</section>

<section class="sect">
  <div class="wrap">
    <div style="text-align:center;max-width:620px;margin:0 auto">
      <span class="eyebrow" style="justify-content:center">Say hello</span>
      <h2 class="h2">The team is small on purpose</h2>
      <p style="margin-top:-2px"><span class="hand">just us two, and soon, you</span></p>
    </div>
    <div class="duo">
      <div class="card dcard">{img('', 'Lisette', label='Bio photo coming soon<br>Lisette', tone='sunset')}<h3>Lisette</h3><span class="hand">your guide et professeure</span><p style="font-size:16px;color:var(--muted);margin-top:8px">Fluent French speaker, former resident of France, planner of every detail, believer in your dream.</p></div>
      <div class="card dcard">{img('', 'Her husband', label='Bio photo coming soon<br>Monsieur')}<h3>Her Husband</h3><span class="hand">co-pilot et co-host</span><p style="font-size:16px;color:var(--muted);margin-top:8px">The other half of the adventure, future podcast co-host, and quality control for every long lunch.</p></div>
    </div>
  </div>
</section>

<section class="sect ink final" style="text-align:center;padding:110px 0">
  <div class="wrap">
    <span class="hand" style="font-size:32px">now you know us...</span>
    <h2 class="h2" style="max-width:700px;margin:12px auto 16px">We would love to know the two of you.</h2>
    <p class="lede" style="margin:0 auto 32px">Tell us about your dream retirement on a free call. We will tell you exactly how we would help you get there.</p>
    <a class="btn cream" href="book.html">Book Your Free Call</a>
  </div>
</section>
"""

page(
    "about.html",
    "About Us | Marriage & Retirement Abroad",
    "Meet Lisette and her husband: a married couple planning their own retirement in the South of France and helping couples 45 and better do the same.",
    content,
    extra_css=CSS,
)
