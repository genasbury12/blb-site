#!/usr/bin/env python3
"""Client portal / proposal page for Lisette. Published as a claude.ai Artifact.
Run: python3 build_portal.py  ->  portal/portal.html"""
import json

A = json.load(open('assets.json'))

CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3HLF56fntoufkyqpyZylwksqwoM"
IMAGES = [
    ("Lavender farmhouse (homepage hero)", f"{CDN}/hf_20260810_163550_c1f3536d-142f-462d-8679-c024ea9c0a19.png"),
    ("Hilltop village at dusk", f"{CDN}/hf_20260810_164148_8616caf1-c6f2-416c-9d67-30556f079d3f.png"),
    ("Cafe terrace", f"{CDN}/hf_20260810_163550_10e54926-f661-42fb-9f84-28d43346d2ad.png"),
    ("Provencal market stall", f"{CDN}/hf_20260810_163550_2d570a0c-c0a7-4ef7-a144-aa9af282b72a.png"),
    ("Mediterranean cove", f"{CDN}/hf_20260810_163550_2fa9f87f-8bf8-4dc6-80de-3c6f58bba9f0.png"),
    ("The lavender door", f"{CDN}/hf_20260810_163550_5155a00a-a372-4282-a536-65f010e3edf5.png"),
    ("Long lunch in the olive grove", f"{CDN}/hf_20260810_163550_79bcc52d-c742-423e-99c0-9f9e8d26b9dd.png"),
    ("French lesson flat lay", f"{CDN}/hf_20260810_163550_63d3b0d2-d9a0-42c1-920e-1d87a032caba.png"),
    ("Lavender fields panorama", f"{CDN}/hf_20260810_164148_30802121-2d4e-48c3-b174-1e455901197d.png"),
]

EMAIL = "hello@bossladybloggers.com"
M_FINISH = f"mailto:{EMAIL}?subject=Oui!%20Let%27s%20finish%20my%20website&body=Hi%20Genasys%2C%0A%0AI%20want%20to%20complete%20the%20project.%20My%20payment%20choice%20is%3A%20"
M_COACH = f"mailto:{EMAIL}?subject=Yes%20to%20coaching%20every%20two%20weeks&body=Hi%20Genasys%2C%0A%0AYes%2C%20I%27d%20love%20to%20restart%20our%20coaching%20calls%20every%20two%20weeks.%0A%0AMy%20best%20days%2Ftimes%3A%20"
M_TALK = f"mailto:{EMAIL}?subject=Let%27s%20talk%20first&body=Hi%20Genasys%2C%0A%0ABefore%20I%20decide%2C%20I%27d%20like%20to%20talk%20about%3A%20"

img_links = "\n".join(
    f'<a class="imglink" href="{u}" target="_blank" rel="noopener"><span class="in">{n}</span><span class="arr">&#8599;</span></a>'
    for n, u in IMAGES)

thumb = lambda k, label, note: f'''<figure class="thumb">
  <div class="tframe"><img src="data:image/jpeg;base64,{A[k]}" alt="{label} page preview"></div>
  <figcaption><b>{label}</b><span>{note}</span></figcaption>
</figure>'''

frame = lambda k, url, label: f'''<div class="browser">
  <div class="bbar"><i></i><i></i><i></i><span class="burl">{url}</span></div>
  <div class="bscroll"><img src="data:image/jpeg;base64,{A[k]}" alt="Full {label} page"></div>
  <div class="bhint">scroll inside to tour the page</div>
</div>'''

html = f"""<title>Lisette &times; Boss Lady Bloggers | Project Portal</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
@font-face{{font-family:'Cormorant Garamond';font-style:normal;font-weight:500;
  src:url(data:font/woff2;base64,{A['cg']}) format('woff2')}}
@font-face{{font-family:'Cormorant Garamond';font-style:italic;font-weight:500;
  src:url(data:font/woff2;base64,{A['cgi']}) format('woff2')}}
@font-face{{font-family:'Jost';font-style:normal;font-weight:400 600;
  src:url(data:font/woff2;base64,{A['jost']}) format('woff2')}}
@font-face{{font-family:'Parisienne';font-style:normal;font-weight:400;
  src:url(data:font/woff2;base64,{A['par']}) format('woff2')}}

:root{{
  --paper:#FBF9F4; --tint:#F1EDF7; --ink:#2F2838; --lav:#6A579E; --deep:#4F3F7E;
  --gold:#B9944E; --blush:#E9E2F4; --muted:#6F677D; --line:rgba(106,87,158,.18);
  --serif:'Cormorant Garamond',Georgia,serif; --sans:'Jost',sans-serif;
  --script:'Parisienne',cursive;
}}
*{{margin:0;padding:0;box-sizing:border-box}}
html{{scroll-behavior:smooth}}
body{{background:var(--paper);color:var(--ink);font-family:var(--sans);
  font-size:17.5px;line-height:1.65;-webkit-font-smoothing:antialiased}}
img{{max-width:100%;display:block}}
a{{color:var(--deep)}}
h1,h2,h3{{font-family:var(--serif);font-weight:500;line-height:1.12;text-wrap:balance}}
.wrap{{max-width:1060px;margin:0 auto;padding:0 24px}}
.eyebrow{{font-weight:600;font-size:12.5px;letter-spacing:.28em;text-transform:uppercase;
  color:var(--deep);display:inline-flex;align-items:center;gap:12px}}
.eyebrow::before{{content:"";width:34px;height:1px;background:var(--gold)}}
.hand{{font-family:var(--script);color:var(--gold);font-size:clamp(26px,3.2vw,36px);line-height:1.25}}
.hand.lav{{color:var(--lav)}}
section{{padding:84px 0}}
.h2{{font-size:clamp(32px,4.2vw,48px);margin:12px 0 16px}}
.lede{{font-size:18.5px;color:var(--muted);max-width:62ch}}

.ribbon{{background:var(--deep);color:#EFE9F8;font-size:12px;letter-spacing:.26em;
  text-transform:uppercase;text-align:center;padding:11px 16px}}
.ribbon b{{color:#E5D9A9;font-weight:600}}

.hero{{padding:96px 0 80px;background:
  radial-gradient(900px 420px at 85% -10%,rgba(106,87,158,.14),transparent 70%),
  radial-gradient(700px 380px at -10% 110%,rgba(185,148,78,.12),transparent 70%),var(--paper);
  border-bottom:1px solid var(--line)}}
.hero .hand{{font-size:clamp(34px,4.6vw,52px)}}
.hero h1{{font-size:clamp(44px,6.4vw,76px);margin:10px 0 18px}}
.hero h1 em{{font-style:italic;color:var(--lav)}}
.statrow{{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}}
.stat{{background:#fff;border:1px solid var(--line);border-radius:60px;padding:10px 20px;
  font-size:14.5px;font-weight:500;color:var(--deep)}}
.stat b{{font-family:var(--serif);font-size:19px;color:var(--ink);font-weight:600;margin-right:6px}}

.letter{{background:var(--tint)}}
.paperbox{{background:#fff;border:1px solid var(--line);border-radius:22px;
  box-shadow:0 24px 60px rgba(47,40,56,.10);max-width:720px;margin:0 auto;padding:52px 54px}}
.paperbox p{{margin-bottom:18px;max-width:62ch}}
.paperbox .sig{{font-family:var(--script);font-size:38px;color:var(--lav);margin-top:26px}}
.paperbox .role{{font-size:12.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted)}}

.browser{{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;
  box-shadow:0 24px 60px rgba(47,40,56,.12)}}
.bbar{{display:flex;align-items:center;gap:7px;padding:12px 16px;background:var(--blush);
  border-bottom:1px solid var(--line)}}
.bbar i{{width:11px;height:11px;border-radius:50%;background:#fff;border:1px solid var(--line)}}
.bbar i:first-child{{background:var(--gold)}}
.bbar i:nth-child(2){{background:var(--lav)}}
.burl{{margin-left:10px;background:#fff;border-radius:60px;padding:5px 16px;font-size:12.5px;
  color:var(--muted);letter-spacing:.04em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
.bscroll{{height:480px;overflow-y:auto;overscroll-behavior:contain}}
.bhint{{text-align:center;font-size:12px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--muted);padding:10px;border-top:1px dashed var(--line)}}
.framegrid{{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:44px}}
.framegrid .browser:first-child{{grid-column:1/-1}}
.framegrid .browser:first-child .bscroll{{height:560px}}

.thumbs{{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:44px}}
.thumb{{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;
  box-shadow:0 12px 30px rgba(47,40,56,.08)}}
.tframe{{height:180px;overflow:hidden;border-bottom:1px solid var(--line)}}
.thumb figcaption{{padding:12px 16px 14px;display:flex;flex-direction:column;gap:2px}}
.thumb b{{font-family:var(--serif);font-size:17.5px;font-weight:600}}
.thumb span{{font-size:12.5px;color:var(--muted);letter-spacing:.04em}}

.brand{{background:var(--ink);color:#EFE9F5}}
.brand .eyebrow{{color:#CBBFE4}}
.brand .lede{{color:#CFC8DA}}
.swatches{{display:grid;grid-template-columns:repeat(8,1fr);gap:12px;margin:40px 0 8px}}
.sw{{border-radius:12px;height:86px;display:flex;align-items:flex-end;padding:8px;
  font-size:10.5px;letter-spacing:.08em;border:1px solid rgba(255,255,255,.14)}}
.typerow{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:22px;margin-top:34px}}
.type{{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.13);
  border-radius:14px;padding:22px 24px}}
.type .big{{font-size:30px;line-height:1.1}}
.type .lab{{font-size:11.5px;letter-spacing:.22em;text-transform:uppercase;color:#CBBFE4;margin-top:10px}}
.imggrid{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:34px}}
.imglink{{display:flex;justify-content:space-between;align-items:center;gap:10px;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);border-radius:60px;
  padding:12px 20px;color:#EFE9F5;text-decoration:none;font-size:14.5px;transition:background .2s}}
.imglink:hover{{background:rgba(185,148,78,.25)}}
.imglink .arr{{color:#E5D9A9}}

.donegrid{{display:grid;grid-template-columns:1fr 1fr;gap:8px 34px;max-width:860px;margin:38px auto 0}}
.done{{display:flex;gap:12px;align-items:flex-start;padding:9px 0;border-bottom:1px dashed var(--line);font-size:16px}}
.done::before{{content:"\\2713";flex:none;width:22px;height:22px;border-radius:7px;background:var(--blush);
  border:1.5px solid var(--lav);color:var(--deep);font-weight:700;font-size:13px;
  display:flex;align-items:center;justify-content:center;margin-top:3px}}

.tasks{{background:var(--tint)}}
.taskgrid{{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:44px}}
.taskcol{{background:#fff;border-radius:20px;border:1px solid var(--line);padding:36px 36px;
  box-shadow:0 16px 44px rgba(47,40,56,.08)}}
.taskcol.mine{{border-top:5px solid var(--lav)}}
.taskcol.yours{{border-top:5px solid var(--gold)}}
.taskcol h3{{font-size:26px;margin-bottom:4px}}
.taskcol .who{{font-family:var(--script);font-size:24px;color:var(--gold);margin-bottom:18px}}
.taskcol.mine .who{{color:var(--lav)}}
.taskcol li{{list-style:none;padding:10px 0 10px 30px;position:relative;font-size:15.5px;
  border-bottom:1px dashed var(--line)}}
.taskcol li:last-child{{border-bottom:0}}
.taskcol.mine li::before{{content:"";position:absolute;left:2px;top:17px;width:9px;height:9px;
  border-radius:50%;background:var(--lav)}}
.taskcol.yours li::before{{content:"";position:absolute;left:2px;top:17px;width:9px;height:9px;
  border-radius:50%;background:var(--gold)}}
.taskcol li b{{font-weight:600}}
.taskcol li small{{display:block;color:var(--muted);font-size:13.5px;line-height:1.5}}

.offer .cards{{display:grid;grid-template-columns:1fr 1fr;gap:28px;max-width:860px;margin:44px auto 0}}
.price{{background:#fff;border:1px solid var(--line);border-radius:22px;padding:40px 38px;
  text-align:center;position:relative;box-shadow:0 16px 44px rgba(47,40,56,.08)}}
.price.best{{border:2px solid var(--lav)}}
.price .tag{{position:absolute;top:-15px;left:50%;transform:translateX(-50%);background:var(--lav);
  color:#fff;border-radius:60px;padding:6px 20px;font-size:11.5px;letter-spacing:.2em;
  text-transform:uppercase;font-weight:600;white-space:nowrap}}
.price h3{{font-size:24px;margin-bottom:6px}}
.price .amt{{font-family:var(--serif);font-size:56px;font-weight:600;color:var(--deep);line-height:1;margin:14px 0 4px;font-variant-numeric:tabular-nums}}
.price .amt small{{font-size:20px;color:var(--muted);font-weight:400}}
.price .sub{{color:var(--muted);font-size:14.5px;margin-bottom:20px}}
.price .save{{display:inline-block;background:var(--blush);color:var(--deep);border-radius:60px;
  padding:6px 16px;font-size:13.5px;font-weight:600;margin-bottom:18px}}
.btn{{display:inline-block;background:var(--lav);color:#fff;text-decoration:none;font-weight:600;
  font-size:15.5px;letter-spacing:.04em;padding:15px 32px;border-radius:60px;
  box-shadow:0 12px 26px rgba(106,87,158,.30);transition:transform .2s,background .2s}}
.btn:hover{{background:var(--deep);transform:translateY(-2px)}}
.btn.ghost{{background:transparent;color:var(--deep);border:2px solid var(--lav);box-shadow:none}}
.btn.ghost:hover{{background:var(--lav);color:#fff}}
.finelist{{max-width:860px;margin:26px auto 0;text-align:center;font-size:14.5px;color:var(--muted)}}

.coach{{max-width:860px;margin:40px auto 0;background:linear-gradient(135deg,var(--blush),#fff 60%);
  border:1px solid var(--line);border-radius:22px;padding:40px 42px;display:grid;
  grid-template-columns:1.3fr .7fr;gap:26px;align-items:center;box-shadow:0 16px 44px rgba(47,40,56,.08)}}
.coach h3{{font-size:27px;margin:6px 0 10px}}
.coach p{{color:var(--muted);font-size:15.5px;max-width:52ch}}
.coach .cta{{display:flex;flex-direction:column;gap:12px;align-items:stretch;text-align:center}}

.final{{background:var(--ink);color:#F2EDE4;text-align:center;padding:100px 0}}
.final .h2{{color:#fff;max-width:640px;margin:12px auto 14px}}
.final .lede{{margin:0 auto 34px;color:#CFC8DA}}
.final .btn{{background:var(--paper);color:var(--ink);box-shadow:0 12px 26px rgba(0,0,0,.3)}}
.final .btn:hover{{background:var(--gold);color:#fff}}
.foot{{background:var(--ink);color:#A79FB6;text-align:center;font-size:13px;
  padding:26px 16px;border-top:1px solid rgba(255,255,255,.12)}}
.foot .fmark{{font-family:var(--script);font-size:22px;color:var(--gold);display:block;margin-bottom:6px}}

@media(max-width:860px){{
  section{{padding:60px 0}}
  .framegrid,.taskgrid,.offer .cards,.donegrid{{grid-template-columns:1fr}}
  .framegrid .browser:first-child .bscroll{{height:440px}}
  .thumbs{{grid-template-columns:1fr 1fr}}
  .swatches{{grid-template-columns:repeat(4,1fr)}}
  .typerow,.imggrid{{grid-template-columns:1fr}}
  .paperbox{{padding:36px 26px}}
  .coach{{grid-template-columns:1fr}}
}}
@media(prefers-reduced-motion:reduce){{html{{scroll-behavior:auto}}.btn{{transition:none}}}}
</style>

<div class="ribbon">Boss Lady Bloggers <b>&middot;</b> Private Client Portal <b>&middot;</b> Prepared for Lisette Ralston</div>

<header class="hero"><div class="wrap">
  <span class="hand">bonjour, Lisette...</span>
  <h1>Your website is <em>already beautiful.</em></h1>
  <p class="lede">While things were paused, I kept building. Marriage &amp; Retirement Abroad now exists
  as a complete, hand-coded website in your lavender brand, and this page is your private tour of it.
  Scroll through, fall in love, and then decide how you would like to finish this together.</p>
  <div class="statrow">
    <span class="stat"><b>14</b> pages designed &amp; built</span>
    <span class="stat"><b>9</b> custom Provence images</span>
    <span class="stat"><b>100%</b> tested on phone &amp; desktop</span>
    <span class="stat"><b>1</b> dream, ready to launch</span>
  </div>
</div></header>

<section class="letter"><div class="wrap">
  <div class="paperbox">
    <span class="eyebrow">A note from Genasys</span>
    <h2 class="h2" style="font-size:clamp(28px,3.6vw,38px)">First, a clean slate</h2>
    <p>Earlier this year our billing got tangled, and I refunded your payments in full. That chapter is
    closed, and there is no balance and no hard feelings on my side. I am writing because the work,
    and your dream, still matter to me.</p>
    <p>You told me in your questionnaire that if I could help you with only one thing, it should be
    building your website. So I built it. All of it: the homepage, the Practice Retirement Trip page,
    your story page, the freebie funnel, the coming soon pages for your blog, podcast, and French
    lessons, even the legal page shells.</p>
    <p>This portal shows you everything, exactly as it stands. If you love it, below you will find two
    simple ways to finish the project, and one question about coaching. If now is not the moment,
    that is okay too. The work will be here.</p>
    <div class="sig">Genasys</div>
    <div class="role">Boss Lady Bloggers &middot; BEM+</div>
  </div>
</div></section>

<section><div class="wrap">
  <span class="eyebrow">The tour</span>
  <h2 class="h2">See your website, page by page</h2>
  <p class="lede">These are real, working pages, not mockups. Each frame below scrolls like a phone:
  drag inside to walk the whole page top to bottom.</p>
  <div class="framegrid">
    {frame('home', 'marriageandretirementabroad.com', 'homepage')}
    {frame('trip', 'marriageandretirementabroad.com/trip', 'Practice Retirement Trip')}
    {frame('about', 'marriageandretirementabroad.com/about', 'about')}
  </div>
  <p style="margin-top:18px;font-size:14px;color:var(--muted)">The photo spots on the about page are
  intentionally waiting for your brand photos. Your face belongs there, not a stand-in.</p>
</div></section>

<section style="padding-top:0"><div class="wrap">
  <span class="eyebrow">And the rest</span>
  <h2 class="h2" style="font-size:clamp(26px,3.2vw,36px)">Eight more pages, ready and waiting</h2>
  <div class="thumbs">
    {thumb('start_here','Start Here','your visitor welcome mat')}
    {thumb('freebie','Free Checklist','your list builder')}
    {thumb('book','Book a Call','your booking page')}
    {thumb('contact','Contact','styled contact form')}
    {thumb('blog','Blog','elegant coming soon')}
    {thumb('podcast','Podcast','you two, coming soon')}
    {thumb('french','French Lessons','waitlist ready')}
    {thumb('thank_you','Merci Page','after signup')}
  </div>
  <p style="margin-top:18px;font-size:14px;color:var(--muted)">Plus Privacy, Terms, and Disclaimer
  shells, ready for your official legal copy.</p>
</div></section>

<section class="brand"><div class="wrap">
  <span class="eyebrow">Your brand system</span>
  <h2 class="h2" style="color:#fff">Lavender, gold, and la belle vie</h2>
  <p class="lede">Built from the vision in your questionnaire: elegant, minimalist, warm, and
  unmistakably the South of France.</p>
  <div class="swatches">
    <div class="sw" style="background:#FBF9F4;color:#6F677D">FBF9F4</div>
    <div class="sw" style="background:#F1EDF7;color:#6F677D">F1EDF7</div>
    <div class="sw" style="background:#E9E2F4;color:#4F3F7E">E9E2F4</div>
    <div class="sw" style="background:#6A579E;color:#fff">6A579E</div>
    <div class="sw" style="background:#4F3F7E;color:#fff">4F3F7E</div>
    <div class="sw" style="background:#B9944E;color:#fff">B9944E</div>
    <div class="sw" style="background:#6F677D;color:#fff">6F677D</div>
    <div class="sw" style="background:#2F2838;color:#CBBFE4">2F2838</div>
  </div>
  <div class="typerow">
    <div class="type"><div class="big" style="font-family:var(--serif)">Retire in France</div><div class="lab">Cormorant Garamond &middot; headlines</div></div>
    <div class="type"><div class="big" style="font-family:var(--sans);font-size:24px">together, with confidence</div><div class="lab">Jost &middot; body &amp; buttons</div></div>
    <div class="type"><div class="big" style="font-family:var(--script);color:#E5D9A9">la belle vie</div><div class="lab">Parisienne &middot; handwritten accents</div></div>
  </div>
  <h3 style="font-size:24px;color:#fff;margin-top:44px">Your Provence image collection</h3>
  <p style="color:#CFC8DA;font-size:15px;margin-top:6px">Nine images made exclusively for your brand
  colors. Click any to view or save the full resolution file.</p>
  <div class="imggrid">{img_links}</div>
</div></section>

<section><div class="wrap" style="text-align:center">
  <span class="eyebrow" style="justify-content:center">Where the project stands</span>
  <h2 class="h2">Already done, checked, and double checked</h2>
  <div class="donegrid" style="text-align:left">
    <div class="done">Brand system: colors, fonts, signature details</div>
    <div class="done">All 14 pages designed and hand-coded</div>
    <div class="done">Draft copy written in your voice, ready for your edits</div>
    <div class="done">Custom Provence imagery placed sitewide</div>
    <div class="done">Interactive touches: menus, timelines, FAQs, animations</div>
    <div class="done">Search-friendly structure with FAQ schema on key pages</div>
    <div class="done">Contact and freebie forms designed and wired</div>
    <div class="done">Every page tested on desktop and phone screens</div>
  </div>
</div></section>

<section class="tasks"><div class="wrap">
  <span class="eyebrow">The finish line</span>
  <h2 class="h2">What is left, and who does what</h2>
  <p class="lede">Short lists on both sides. Yours is mostly decisions; mine is mostly work.</p>
  <div class="taskgrid">
    <div class="taskcol mine">
      <h3>On my plate</h3><div class="who">Genasys handles...</div>
      <ul>
        <li><b>Install all 14 pages in Showit</b><small>Desktop and mobile canvases, published and live on your domain.</small></li>
        <li><b>Connect your forms</b><small>Contact + checklist forms wired to your email, tested end to end.</small></li>
        <li><b>Create your freebie</b><small>Design the actual Retire in France Starter Checklist download.</small></li>
        <li><b>Set up your email list</b><small>Platform setup, welcome sequence, checklist delivery on autopilot.</small></li>
        <li><b>Embed your booking calendar</b><small>Your call link living on the Book a Call page.</small></li>
        <li><b>Move images to permanent hosting</b><small>Plus favicon and finishing touches.</small></li>
        <li><b>Inject your legal copy</b><small>Privacy, Terms, and Disclaimer formatted to match the site.</small></li>
        <li><b>Write and optimize your first blog articles</b><small>The 10 to 12 SEO articles from your 3 month goal.</small></li>
        <li><b>Final quality pass on the live site</b><small>Real phones, every link, every form, before we call it launched.</small></li>
      </ul>
    </div>
    <div class="taskcol yours">
      <h3>On your plate</h3><div class="who">Lisette decides...</div>
      <ul>
        <li><b>Say yes below</b><small>Pick monthly or paid in full, whichever feels right.</small></li>
        <li><b>Purchase your domain and Showit plan</b><small>marriageandretirementabroad.com is the address we planned.</small></li>
        <li><b>Review the website copy</b><small>You asked for input on every word. I will send it page by page.</small></li>
        <li><b>Brand photos of you two</b><small>JPG files under 30 MB in a shared Google Drive folder. 15 to 40 photos is plenty.</small></li>
        <li><b>Your email address for the forms</b><small>Plus one activation click when the first test lands.</small></li>
        <li><b>Set up your booking calendar</b><small>Or send me your availability and I will set it up for you.</small></li>
        <li><b>Choose your email platform</b><small>Flodesk again, or I will recommend a simpler start.</small></li>
        <li><b>Send your legal copy</b><small>Or approve a template service and I will handle the rest.</small></li>
        <li><b>Coaching, yes or no</b><small>Tell me if you want our calls back every two weeks.</small></li>
      </ul>
    </div>
  </div>
</div></section>

<section class="offer"><div class="wrap" style="text-align:center">
  <span class="eyebrow" style="justify-content:center">The invitation</span>
  <h2 class="h2">Two simple ways to finish</h2>
  <p class="lede" style="margin:0 auto">One project, one finish line, your choice of pace. Both paths
  include every item on my task list above, through launch.</p>
  <div class="cards">
    <div class="price">
      <h3>Month by month</h3>
      <div class="amt">$333<small>/mo</small></div>
      <div class="sub">12 monthly payments &middot; $3,996 total</div>
      <p style="font-size:15px;color:var(--muted);margin-bottom:22px">Steady and gentle on cash flow
      while we build, launch, and grow together over the year.</p>
      <a class="btn ghost" href="{M_FINISH}Monthly%20(%24333%20x%2012)">Choose Monthly</a>
    </div>
    <div class="price best">
      <span class="tag">Best value &middot; save $496</span>
      <h3>Paid in full</h3>
      <div class="amt">$3,500</div>
      <div class="sub">One payment &middot; everything included</div>
      <span class="save">$496 less than monthly</span>
      <p style="font-size:15px;color:var(--muted);margin-bottom:22px">One decision, one payment, and
      the whole finish line becomes my job.</p>
      <a class="btn" href="{M_FINISH}Paid%20in%20full%20(%243%2C500)">Choose Paid in Full</a>
    </div>
  </div>
  <div class="coach">
    <div>
      <span class="eyebrow">One more question</span>
      <h3>Want your coaching back, every two weeks?</h3>
      <p>You asked for regular contact and real accountability. If you would like it, we restart our
      coaching calls on a steady two week rhythm: strategy, feedback, and momentum while the site
      goes live and your first articles publish. Just tell me yes and your best days.</p>
    </div>
    <div class="cta">
      <a class="btn" href="{M_COACH}">Yes, every two weeks</a>
      <a class="btn ghost" href="{M_TALK}">Let's talk first</a>
    </div>
  </div>
  <p class="finelist">Questions about anything here, including payments or timing? Reply to this page
  by email and ask. Straight answers, no pressure, always.</p>
</div></section>

<section class="final"><div class="wrap">
  <span class="hand" style="font-size:34px">the lavender is waiting...</span>
  <h2 class="h2">Say the word, and we finish this together.</h2>
  <p class="lede">Your website is built. Your brand is gorgeous. The only missing piece is your yes.</p>
  <a class="btn" href="{M_FINISH}">Email Genasys Your Decision</a>
</div></section>

<div class="foot"><span class="fmark">Boss Lady Bloggers</span>
Prepared with love for Lisette Ralston &middot; Marriage &amp; Retirement Abroad &middot; 2026</div>
"""

open("portal.html", "w").write(html)
print(f"wrote portal.html ({len(html)/1024/1024:.2f} MB)")
