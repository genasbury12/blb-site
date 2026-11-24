"""Builds site/_pages/portfolio.html (the client portfolio) and site/_pages/client-project.html
(one template page that fills itself in from ?project=<key>). Run: python3 scripts/gen_portfolio_pages.py"""
import html, sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from folio_data import PROJECTS, VIDEOS, IMG, CDN, VIDEO_CSS, VIDEO_JS, video_cards

from pf_parts import *

# ---------------- PORTFOLIO PAGE ----------------
o = [CSS, '<main id="main" class="pf">']
o.append(f'''<section class="hero"><div class="in hero-grid">
<div class="stack" style="gap:22px">
<p class="lbl">The Boss Lady Bloggers client portfolio</p>
<h1>Beautiful blogging websites. Brilliant women. <em>Businesses built with strategy.</em></h1>
{P("Explore the brands, custom Showit websites and blogging businesses I've helped ambitious women bring to life through private blog coaching, business strategy and professional website design.")}
<p class="big it">Because behind every beautiful website is a woman with a vision, an audience she wants to serve and a business she wants to build.</p>
<div class="row">{btn("Explore My Client Portfolio", "#projects")}{btn("Work With Me", COACH, "ol")}</div>
</div>
<div class="fan" aria-hidden="true">
<span class="shot"><img src="{IMG}abroad-desktop.jpg" alt=""></span>
<span class="shot"><img src="{IMG}fizzy-desktop.jpg" alt=""></span>
<span class="shot"><img src="{IMG}oneincome-mockup.jpg" alt=""></span>
</div></div></section>''')

und = ["I want to understand your audience.", "Your offers.", "Your business model.", "Your positioning.", "What makes your expertise valuable.",
       "And what needs to happen between someone discovering your website and deciding to become a customer."]
o.append(f'''<section style="background:#FFFFFF"><div class="in twocol">
<div class="stack"><p class="lbl">More than custom website design</p><h2>I don&rsquo;t just design websites. <em>I help build the businesses behind them.</em></h2></div>
<div class="stack">
{P("A website can be absolutely gorgeous and still fail to communicate what makes your business worth purchasing from.")}
{P("It can have beautiful typography, carefully selected colors and impressive photography while leaving potential customers wondering what you actually do.")}
<p class="big">That&rsquo;s why my approach to custom blog website design begins long before I open Showit.</p>
<div class="understand">{''.join(f'<p>{e(x)}</p>' for x in und)}</div>
{P("As both a professional blogging coach and custom website designer, I bring those decisions together.")}
<p class="big it">The result is a website designed around the business you want to own, not simply the aesthetic you want to achieve.</p>
</div></div></section>''')

cards = []
for k, name, client, niche, url in PROJECTS:
    who = f'<p class="who">Client: {e(client)}</p>' if client else ''
    cards.append(f'''<article class="proj rv" id="project-{k}">
<a class="proj-img" href="/client-project/?project={k}" aria-label="View the {e(name)} project"><img src="{IMG}{k}-mockup.jpg" alt="{e(name)} website on a laptop and phone" loading="lazy" width="1600" height="1100"></a>
<div class="stack" style="gap:14px">
<p class="lbl">{e(niche)}</p>
<h3>{e(name)}</h3>{who}
{slot("Short description of her business, what she wanted to accomplish and the direction we developed together.", "sm")}
<p class="tiny">The project</p>
{slot("Services actually delivered: for example Private Blog Coaching, Brand Strategy, Custom Showit Website Design, Offer Development.", "sm")}
<div class="row">{btn("View the Full Project", "/client-project/?project=" + k)}<a class="link" href="{url}" target="_blank" rel="noopener">Visit the website</a></div>
</div></article>''')
o.append(f'''<section id="projects" style="background:#F6E1E8;scroll-margin-top:80px"><div class="in stack" style="gap:34px">
<div class="nar stack ctr" style="gap:16px"><p class="lbl">The women behind the websites</p><h2>Explore the businesses <em>we&rsquo;ve brought to life.</em></h2>
{P("Every woman arrives with a different vision, a different story and different business goals.")}
{P("Some are starting completely from scratch. Others are ready to reposition an existing business, develop new offers or create a professional online presence that reflects how much they've grown.")}
{P("Explore the strategy, design and business development behind selected client projects.")}</div>
<div class="projs">{''.join(cards)}</div>
</div></section>''')

see = ["You see the beautiful homepage.", "The brand colors.", "The typography.", "The photography.", "The carefully designed pages."]
dont = ["You don't see the audience research behind the messaging.", "The offer strategy behind the navigation.", "The customer journey behind the calls to action.", "The positioning decisions behind the brand.", "Or the conversations that helped turn an overwhelming collection of ideas into a cohesive business direction."]
should = [("Your homepage", "should communicate your value."), ("Your navigation", "should help potential customers find what they need."), ("Your content", "should introduce people to your expertise."), ("Your sales pages", "should help customers understand the value of your offers."), ("Your email signup opportunities", "should give visitors a compelling reason to remain connected."), ("Your website as a whole", "should support the business you're building.")]
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:30px">
<div class="nar stack ctr" style="gap:16px"><p class="lbl">The strategy behind the design</p><h2>What you don&rsquo;t see when you look at <em>a finished website.</em></h2></div>
<div class="see"><div class="a">{''.join(f'<p class="x">{e(x)}</p>' for x in see)}</div><div class="b">{''.join(f'<p class="x">{e(x)}</p>' for x in dont)}</div></div>
<div class="nar stack ctr">
{P("But what you don't immediately see are the business decisions that influenced how those pages were built.")}
<p class="big">That&rsquo;s the work that makes my approach different.</p>
{P("When you hire me as your blogging coach and website designer, we're not simply deciding what your website should look like.")}
<p class="big it">We&rsquo;re deciding what your website needs to accomplish.</p>
{P("Every design decision should have a business reason behind it.")}</div>
<ul class="should">{''.join(f'<li><b>{e(a)}</b>{e(b)}</li>' for a, b in should)}</ul>
<div class="nar stack ctr"><p class="big">Beautiful design gets people&rsquo;s attention.</p><p class="big it">Strategic design gives that attention somewhere meaningful to go.</p>
<div class="row">{btn("Explore My Approach to Blog Coaching & Design", COACH, "br")}</div></div>
</div></section>''')

o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:30px">
<div class="nar stack ctr" style="gap:16px"><p class="lbl">Client experiences</p><h2>The experience behind <em>the finished project.</em></h2>
{P("Building a business is personal.")}
{P("There are decisions you've been second guessing, ideas you've been carrying around for years and a vision that might be difficult to communicate to someone else.")}
{P("My role is to help you make sense of those ideas, develop a strategy around them and bring the agreed pieces of your business to life.")}
<p class="big">But rather than tell you what that experience is like, I&rsquo;ll let the women I&rsquo;ve worked with <span class="it">tell you themselves.</span></p></div>
{video_cards()}
{slot("Optional: add each woman's business name under her video, and a short written quote from her if you'd like one on the page.", "sm")}
<div class="row" style="justify-content:center">{btn("Become My Next Private Client", COACH)}</div>
</div></section>''')

gd = ''.join(f'<figure style="margin:0"><span class="shot"><img src="{IMG}{k}-desktop.jpg" alt="{e(n)} homepage design" loading="lazy" width="1440" height="900"></span><figcaption class="cap">{e(n)}</figcaption></figure>' for k, n, *_ in PROJECTS[:6])
gm = ''.join(f'<span class="shot"><img src="{IMG}{k}-mobile.jpg" alt="{e(n)} mobile design" loading="lazy" width="390" height="844"></span>' for k, n, *_ in PROJECTS)
o.append(f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:30px">
<div class="nar stack ctr" style="gap:16px"><p class="lbl">The design details</p><h2>A closer look <em>at the work.</em></h2>
{P("From custom homepages and blog designs to sales pages, mobile experiences and thoughtful brand details, explore some of the design work behind my client projects.")}</div>
<div class="gal-d">{gd}</div>
<p class="lbl" style="text-align:center">Designed for every screen</p>
<div class="gal-m">{gm}</div>
<div class="row" style="align-items:stretch">{slot("Brand color palettes and typography previews.", "sm")}{slot("Sales page designs.", "sm")}{slot("Individual website page previews.", "sm")}</div>
<p class="big ctr">Every business has its own personality, audience and objectives. <span class="it">Your website should reflect yours.</span></p>
</div></section>''')

inc = ["Personalized business strategy.", "Audience research and positioning.", "Offer development and monetization.", "Brand messaging and creative direction.", "Custom Showit website design.", "Marketing and sales strategy.", "Private 1:1 blog coaching.", "Done for you business development."]
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="in bx">
<div class="stack"><p class="lbl">Now imagine what we could build for you</p><h2>Your business deserves more than a beautiful website <em>with nothing behind it.</em></h2>
{P("If you've been exploring my portfolio and imagining what your own business could look like, let me introduce you to the experience behind the work.")}
<p class="big">The BOSS Business Experience</p>
{P("My signature private blog coaching, custom Showit website design and done for you business development experience.")}
{P("Together, we'll develop the strategy behind your business, establish what you're selling, refine how you communicate your value and build a professional online presence around your goals.")}</div>
<div class="stack"><p class="body">Depending on your business needs and agreed project scope, we&rsquo;ll work on:</p>
<ul class="ticks">{''.join(f'<li>{e(x)}</li>' for x in inc)}</ul>
{P("You don't have to hire a business coach, figure out your brand independently, find a website designer and then teach yourself how to connect everything.")}
<p class="big it">We&rsquo;ll develop the pieces together, with one cohesive business vision guiding the process.</p>
<div class="row">{btn("Explore The BOSS Business Experience", COACH, "cr")}</div></div>
</div></section>''')

steps = [("We develop your strategy.", "Before we begin designing, we'll establish your business direction, understand your audience, identify your offers and determine what your website needs to support."),
         ("We bring your brand and website to life.", "We'll translate your business strategy into a professional online presence that reflects your vision, communicates your expertise and supports your customer journey."),
         ("We prepare your business for its next chapter.", "We'll connect your website to your wider business strategy, establish your marketing and sales priorities and help you understand how to move forward with the assets we've developed.")]
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:30px">
<div class="nar stack ctr" style="gap:16px"><p class="lbl">The process</p><h2>From the ideas in your head to a business <em>you can finally see.</em></h2></div>
<div class="steps">{''.join(f'<article class="step rv"><span class="n">{i+1:02d}</span><h3>{e(t)}</h3><p>{e(d)}</p></article>' for i, (t, d) in enumerate(steps))}</div>
<div class="nar stack ctr">{P("Throughout the experience, you'll receive personalized guidance and professional implementation according to your agreed project scope.")}<div class="row">{btn("Explore Working Together", COACH)}</div></div>
</div></section>''')

INV = '<span style="display:inline-block;border:2px dashed #A23E66;border-radius:10px;padding:2px 10px;color:#A23E66;font-weight:600">TO FILL IN: confirmed starting investment</span>'
faqs = [("Do you only design websites for bloggers?", [e("My specialty is working with women who want to build online businesses using blogging as part of their marketing and business strategy."), e("This can include coaches, educators, digital product creators, service providers, personal brands and entrepreneurs.")]),
        ("Do I need to have my business strategy figured out before hiring you?", [e("No. Business strategy is a central part of the BOSS Business Experience."), e("We'll work through your business direction, positioning, offers and audience before developing the website around them.")]),
        ("What platform do you design websites on?", [e("I specialize in custom Showit website design, with WordPress integration for blogging.")]),
        ("Will my website look like the other websites in your portfolio?", [e("No. Your website is designed around your individual business, brand identity, audience and goals."), e("My portfolio demonstrates the quality and range of my work rather than a collection of designs you need to choose from.")]),
        ("What if I already have a website?", [e("We can explore your existing website, business strategy and goals to determine whether a strategic redesign or a more comprehensive business development experience would make sense.")]),
        ("Is blog coaching included with my website design?", [e("Private blog coaching is a core component of the BOSS Business Experience."), e("My approach combines business strategy, personalized mentorship and professional website design because those pieces should work together.")]),
        ("How much does it cost to work with you?", ["Private client experiences begin at " + INV + ".", e("Your final investment depends on your business needs, website requirements and agreed implementation scope.")]),
        ("How do I get started?", [e("Begin by exploring the BOSS Business Experience and completing a private client application."), e("We'll discuss your vision, business goals, investment readiness and the support you need during a complimentary Fast Track Call.")])]
o.append(f'''<section style="background:#FFFFFF"><div class="nar stack" style="gap:26px">
<div class="stack ctr" style="gap:14px"><p class="lbl">Frequently asked questions</p><h2>Questions <em>before we begin.</em></h2></div>
<div class="faq">{''.join(faq(q, a) for q, a in faqs)}</div></div></section>''')

o.append(f'''<section style="background:#F6E1E8"><div class="nar stack ctr" style="align-items:center">
<p class="lbl">Your business could be the next one we bring to life</p>
<h2>You&rsquo;ve seen what&rsquo;s possible. <em>Now let&rsquo;s talk about your vision.</em></h2>
{P("Maybe you already know exactly what you want your business to become.")}
{P("Maybe you have a collection of ideas but need someone to help you develop a strategy around them.")}
{P("Maybe your existing website no longer reflects the business you want to build.")}
{P("Whatever your starting point, you don't have to figure out every individual piece independently.")}
{P("As your professional blog coach, business strategist and website designer, I'll help you bring the pieces together.")}
<p class="big">Let&rsquo;s build something that feels like you, communicates your value and gives your business <span class="it">a professional foundation to grow from.</span></p>
<div class="row">{btn("Explore The BOSS Business Experience", COACH, "br")}{btn("Apply for a Fast Track Call", CAL, "ol", True)}</div>
</div></section>''')

o.append(f'''<section style="background:#FBF5EE"><div class="in"><div class="mini dk">
<div class="stack"><p class="lbl">Not quite ready for private coaching &amp; design?</p><h2>Futureproof <em>Your Blog</em></h2>
<p class="body">Discover how to build a blogging business that can adapt to AI, changing consumer behavior and the evolving future of the internet.</p>
<p class="body">Understand what your business needs before investing your time and money into building it.</p></div>
<div class="stack" style="align-items:flex-start"><span class="chips"><span style="background:#A23E66">Free webinar</span></span>{btn("Save My Free Seat", "/futureproof-webinar/", "cr")}</div>
</div></div></section>''')
o.append(VIDEO_JS + '\n</main>')
out = '\n'.join(o)
for bad in ['—', '–', '…']: assert bad not in out, bad
(ROOT / "portfolio.html").write_text(out)
print("wrote portfolio.html", len(out))

# ---------------- CLIENT PROJECT TEMPLATE ----------------
SECS = [
    ("meet", "Meet the woman behind the business.", "Introduce your client, her background, expertise, audience and the business she wanted to build."),
    ("start", "Where she started.", "Explain her original business challenges, what she was struggling with, what she wanted to accomplish and why she decided to work with you."),
    ("goals", "What we needed to accomplish.", "Explain the strategic objectives established for the project."),
    ("strategy", "The business strategy.", "Describe the actual decisions made around her business model, audience, positioning, offers and monetization strategy, and why they were made and how they influenced the rest of the project."),
    ("brand", "The brand direction.", "Explain the messaging, visual identity, typography, color palette and creative direction developed for the business. Add brand visuals."),
    ("website", "The custom website.", "Explain the website strategy and how the design supports her audience, offers and business objectives."),
    ("details", "The details that make the difference.", "Showcase specific design features, customer pathways, email signup opportunities, sales pages or other assets, and the business purpose behind each one."),
    ("built", "What we built together.", "List the actual completed deliverables."),
    ("result", "The transformation.", "Describe verified results, completed business assets, strategic improvements and documented client outcomes. Add before and after website comparisons, if available."),
    ("words", "In her own words.", "Add her genuine client testimonial, with Client Name | Business Name."),
]
c = [CSS, '<main id="main" class="pf" data-cp>']
c.append(f'''<section class="cp-hero dk"><div class="in stack" style="gap:26px">
<p class="lbl">A Boss Lady Bloggers client project</p>
<h1 data-cp-name>[Client Business Name]</h1>
<div data-cp-line>{slot("One compelling sentence describing the business and the transformation behind the project.")}</div>
<div class="meta"><div><span>Client</span><b data-cp-client>To fill in</b></div><div><span>Industry</span><b data-cp-industry>To fill in</b></div><div><span>Services</span><b data-cp-services>To fill in: actual services delivered</b></div></div>
<div class="row" data-cp-visit-row>{btn("Visit the Website", "#", "cr")}</div>
<div data-cp-mock></div>
</div></section>''')
secs = []
for i, (key, h, hint) in enumerate(SECS):
    extra = ''
    if key == 'website':
        extra = '<div data-cp-shots style="display:flex;flex-direction:column;gap:16px;margin-top:6px"></div>'
    secs.append(f'''<div class="cp-sec rv" data-sec="{key}"><div><span class="num">{i+1:02d}</span><h2>{e(h)}</h2></div>
<div class="stack" data-body>{slot(hint)}{extra}</div></div>''')
c.append(f'''<section style="background:#FBF5EE"><div class="in">{''.join(secs)}</div></section>''')
c.append(f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:28px">
<div class="nar stack ctr" style="gap:16px"><h2>Ready to bring your own <em>business vision to life?</em></h2>
{P("Through the BOSS Business Experience, I combine private blog coaching, custom Showit website design and done for you business development to help ambitious women build the businesses behind their blogs.")}
<div class="row">{btn("Explore The BOSS Business Experience", COACH, "br")}{btn("View More Client Projects", "/portfolio/#projects", "ol")}</div></div>
<div class="more" data-cp-more></div>
</div></section>''')
data = {k: {"name": n, "client": cl, "industry": ni, "url": u} for k, n, cl, ni, u in PROJECTS}
c.append('''<script>
(function(){
  /* One page serves every client project: /client-project?project=oneincome and so on.
     To fill in a project, add text to its entry: line, services, and any of
     meet, start, goals, strategy, brand, website, details, built, result, words (plain text, blank line = new paragraph). */
  var IMG='''+json.dumps(CDN)+''';
  var P=''' + json.dumps(data) + ''';
  var key=(new URLSearchParams(location.search).get('project')||'').toLowerCase();
  var root=document.querySelector('[data-cp]');if(!root)return;
  function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML;}
  function paras(t){return t.split(/\\n\\s*\\n/).map(function(x){return '<p class="body">'+esc(x.trim())+'</p>';}).join('');}
  var more=root.querySelector('[data-cp-more]');
  Object.keys(P).filter(function(k){return k!==key;}).slice(0,3).forEach(function(k){
    var a=document.createElement('a');a.href='/client-project?project='+k;
    a.innerHTML='<span class="shot"><img src="'+IMG+k+'-mockup.jpg" alt="" loading="lazy" width="1600" height="1100"></span><span>'+esc(P[k].name)+'</span>';more.appendChild(a);
  });
  var p=P[key];if(!p)return;
  document.title=p.name+' | Client Project | Boss Lady Bloggers';
  root.querySelector('[data-cp-name]').textContent=p.name;
  if(p.line)root.querySelector('[data-cp-line]').innerHTML='<p class="big">'+esc(p.line)+'</p>';
  if(p.client)root.querySelector('[data-cp-client]').textContent=p.client;
  root.querySelector('[data-cp-industry]').textContent=p.industry;
  if(p.services)root.querySelector('[data-cp-services]').textContent=p.services;
  var v=root.querySelector('[data-cp-visit-row] a');v.href=p.url;v.target='_blank';v.rel='noopener';
  root.querySelector('[data-cp-mock]').innerHTML='<span class="shot" style="margin-top:10px"><img src="'+IMG+key+'-mockup.jpg" alt="'+esc(p.name)+' website on a laptop and phone" width="1600" height="1100"></span>';
  var shots=root.querySelector('[data-cp-shots]');
  if(shots)shots.innerHTML='<span class="shot"><img src="'+IMG+key+'-desktop.jpg" alt="'+esc(p.name)+' homepage, desktop" loading="lazy" width="1440" height="900"></span>'+
    '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;max-width:520px"><span class="shot"><img src="'+IMG+key+'-mobile.jpg" alt="'+esc(p.name)+' homepage, mobile" loading="lazy" width="390" height="844"></span></div>';
  root.querySelectorAll('[data-sec]').forEach(function(s){var t=p[s.getAttribute('data-sec')];if(t){var b=s.querySelector('[data-body]');var slot=b.querySelector('.pf-slot');if(slot)slot.outerHTML=paras(t);}});
})();
</script>
</main>''')
out = '\n'.join(c)
for bad in ['—', '–', '…']: assert bad not in out, bad
(ROOT / "client-project.html").write_text(out)
print("wrote client-project.html", len(out))
