"""Builds site/_pages/portfolio.html (the client portfolio) and site/_pages/client-project.html
(one template page that fills itself in from ?project=<key>). Run: python3 scripts/gen_portfolio_pages.py"""
import html, sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from folio_data import PROJECTS, VIDEOS, IMG, CDN, VIDEO_CSS, VIDEO_JS, video_cards

ROOT = Path(__file__).resolve().parent.parent / "site/_pages"
CAL = "https://calendly.com/bossladybloggers/15min"
COACH = "/coaching/"
def e(t): return html.escape(t, quote=False).replace("'", "&rsquo;")
ARR = '<i aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"><path d="M3 11L11 3M5 3h6v6"></path></svg></i>'
def btn(label, href, cls="", ext=False):
    t = ' target="_blank" rel="noopener"' if ext else ''
    return f'<a class="pf-btn {cls}" href="{href}"{t}>{e(label)} {ARR}</a>'
def slot(t, cls=""): return f'<div class="pf-slot {cls}"><b>To fill in</b>{e(t)}</div>'
def P(t, cls="body"): return f'<p class="{cls}">{e(t)}</p>'

CSS = r'''<style>
/* Shared look for the Portfolio and Client Project pages: cream and plum editorial, real laptop and phone mockups. */
.pf{--plum:#3A1C2A;--berry:#A23E66;--rose:#E9B9CA;--blush:#F6E1E8;--cream:#FBF5EE;--cocoa:#4A2F3B;--mauve:#6E4B5B;--pop:#F6C9D8}
.pf section{padding:clamp(76px,9vw,124px) clamp(16px,4vw,48px)}
.pf .in{max-width:1180px;margin:0 auto}
.pf .nar{max-width:780px;margin:0 auto}
.pf .lbl{margin:0;font:500 12px/1.5 var(--font-label);letter-spacing:.2em;text-transform:uppercase;color:var(--berry)}
.pf .dk .lbl{color:var(--rose)}
.pf h1,.pf h2,.pf h3{margin:0;font-family:var(--font-display);font-weight:400;letter-spacing:-.015em;text-wrap:balance;color:var(--plum)}
.pf h1{font-size:clamp(46px,6.4vw,92px);line-height:.98;letter-spacing:-.025em}
.pf h2{font-size:clamp(38px,5vw,64px);line-height:1.02}
.pf h1 em,.pf h2 em{color:var(--berry)}
.pf .dk h1,.pf .dk h2,.pf .dk h3{color:var(--cream)}
.pf .dk h1 em,.pf .dk h2 em{color:var(--pop)}
.pf p{margin:0}
.pf .body{font:400 18px/1.7 var(--font-body);color:var(--cocoa)}
.pf .dk .body{color:#F1DDE2}
.pf .big{font:400 clamp(24px,3vw,34px)/1.25 var(--font-display);color:var(--plum)}
.pf .dk .big{color:var(--cream)}
.pf .it{font-style:italic;color:var(--berry)}
.pf .dk .it{color:var(--pop)}
.pf .stack{display:flex;flex-direction:column;gap:20px}
.pf .row{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.pf .ctr{text-align:center}.pf .ctr .row{justify-content:center}
.pf .pf-btn{display:inline-flex;align-items:center;gap:12px;min-height:56px;padding:8px 10px 8px 24px;border-radius:999px;background:var(--plum);color:#fff;font:600 15.5px/1.2 var(--font-body);text-decoration:none;transition:transform .2s ease}
.pf .pf-btn i{flex:none;width:38px;height:38px;border-radius:999px;background:var(--berry);display:grid;place-items:center;transition:transform .2s ease}
.pf .pf-btn.cr{background:var(--cream);color:var(--plum)}
.pf .pf-btn.br{background:var(--berry)}.pf .pf-btn.br i{background:var(--plum)}
.pf .pf-btn.ol{background:transparent;color:var(--plum);border:1.5px solid var(--plum)}
.pf .pf-btn.olw{background:transparent;color:var(--cream);border:1.5px solid rgba(233,185,202,.6)}
.pf .pf-btn.olw i{background:var(--pop)}.pf .pf-btn.olw i svg{stroke:#3A1C2A}
@media (hover:hover){.pf .pf-btn:hover{transform:translateY(-2px)}.pf .pf-btn:hover i{transform:rotate(45deg)}}
.pf .pf-btn:focus-visible,.pf summary:focus-visible{outline:3px solid var(--berry);outline-offset:3px}
.pf .pf-slot{border:2px dashed var(--berry);border-radius:18px;padding:16px 20px;background:rgba(162,62,102,.05);font:500 15px/1.5 var(--font-body);color:var(--berry)}
.pf .pf-slot b{display:block;font:500 11px/1.3 var(--font-label);letter-spacing:.16em;text-transform:uppercase;margin-bottom:6px}
.pf .pf-slot.sm{padding:12px 16px;font-size:14px}
.pf .dk .pf-slot{border-color:var(--pop);color:var(--pop);background:rgba(246,201,216,.06)}
.pf .chips{display:flex;flex-wrap:wrap;gap:8px}
.pf .chips span{padding:10px 16px;border-radius:999px;background:var(--plum);color:var(--cream);font:400 19px/1.2 var(--font-display)}
.pf .shot{display:block;border-radius:22px;overflow:hidden;box-shadow:0 34px 70px -44px rgba(58,28,42,.7);background:var(--blush)}
.pf .shot img{width:100%;height:auto;display:block}

/* hero */
.pf .hero{background:var(--cream);position:relative;overflow:hidden;isolation:isolate}
.pf .hero::before{content:"";position:absolute;right:-12%;top:-30%;width:60vw;height:60vw;max-width:760px;max-height:760px;border-radius:50%;background:radial-gradient(circle,rgba(233,185,202,.55),rgba(233,185,202,0) 66%);z-index:-1}
.pf .hero-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(36px,5vw,72px);align-items:center}
.pf .fan{position:relative;aspect-ratio:16/13}
.pf .fan .shot{position:absolute;width:78%}
.pf .fan .shot:nth-child(1){left:0;top:4%;transform:rotate(-5deg)}
.pf .fan .shot:nth-child(2){right:0;top:18%;transform:rotate(4deg)}
.pf .fan .shot:nth-child(3){left:11%;bottom:0;transform:rotate(-1deg)}

/* philosophy */
.pf .twocol{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(30px,5vw,72px);align-items:start}
.pf .understand{display:grid;gap:8px}
.pf .understand p{padding:14px 18px;border-radius:14px;background:var(--blush);font:400 22px/1.25 var(--font-display);color:var(--plum)}
.pf .understand p:first-child{background:var(--plum);color:var(--cream)}

/* projects */
.pf .proj{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);gap:clamp(26px,4vw,56px);align-items:center;padding:clamp(22px,3vw,34px);border-radius:32px;background:#fff}
.pf .proj:nth-child(even){grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr)}
.pf .proj:nth-child(even) .proj-img{order:2}
.pf .proj-img{display:block;border-radius:20px;overflow:hidden;background:var(--blush)}
.pf .proj-img img{width:100%;height:auto;display:block;transition:transform .5s ease}
@media (hover:hover){.pf .proj-img:hover img{transform:scale(1.025)}}
.pf .proj h3{font-size:clamp(32px,3.4vw,44px);line-height:1.02}
.pf .proj .who{font:500 15px/1.5 var(--font-body);color:var(--mauve)}
.pf .svc{display:flex;flex-wrap:wrap;gap:6px}
.pf .svc span{padding:8px 13px;border-radius:999px;border:1.5px solid var(--rose);font:500 13px/1.2 var(--font-body);color:var(--plum)}
.pf .projs{display:flex;flex-direction:column;gap:22px}
.pf .tiny{font:500 11.5px/1.4 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:var(--plum)}
.pf .link{font:600 15px/1.3 var(--font-body);color:var(--berry);text-decoration:underline;text-underline-offset:4px}

/* strategy */
.pf .see{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.pf .see > div{border-radius:28px;padding:clamp(22px,3vw,34px);display:flex;flex-direction:column;gap:10px}
.pf .see .a{background:var(--blush)}
.pf .see .b{background:var(--plum)}
.pf .see p.x{font:400 clamp(21px,2.2vw,25px)/1.3 var(--font-display);color:var(--plum)}
.pf .see .b p.x{color:var(--cream)}
.pf .should{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pf .should li{padding:18px 20px;border-radius:18px;background:#fff;font:500 16.5px/1.5 var(--font-body);color:var(--plum);border-left:3px solid var(--berry)}
.pf .should li b{display:block;font:400 22px/1.2 var(--font-display);color:var(--berry);margin-bottom:4px;font-weight:400}

/* gallery */
.pf .gal-d{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.pf .gal-m{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:12px}
.pf .gal-m .shot{border-radius:18px}
.pf .cap{margin-top:10px;font:500 11.5px/1.4 var(--font-label);letter-spacing:.14em;text-transform:uppercase;color:var(--mauve)}

/* experience */
.pf .bx{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(28px,4vw,56px);align-items:start}
.pf .ticks{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.pf .ticks li{position:relative;padding:13px 16px 13px 50px;border-radius:14px;background:rgba(251,245,238,.08);font:500 16px/1.5 var(--font-body);color:var(--cream)}
.pf .ticks li::before{content:"";position:absolute;left:14px;top:14px;width:22px;height:22px;border-radius:7px;background:var(--berry) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 12.5l4 4L18 8' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/16px no-repeat}

/* process */
.pf .steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.pf .step{background:#fff;border-radius:28px;padding:28px;display:flex;flex-direction:column;gap:12px}
.pf .step .n{font:400 italic 52px/.9 var(--font-display);color:var(--berry)}
.pf .step h3{font-size:27px;line-height:1.12}
.pf .step p{font:400 16px/1.6 var(--font-body);color:var(--cocoa)}

/* faq */
.pf .faq{display:flex;flex-direction:column;gap:12px}
.pf .faq details{background:#fff;border:2px solid var(--plum);border-radius:18px;padding:4px 20px}
.pf .faq summary{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:56px;font:600 16.5px/1.35 var(--font-body);color:var(--plum);cursor:pointer;list-style:none}
.pf .faq summary::-webkit-details-marker{display:none}
.pf .faq .faq-a p{margin:0 0 10px;font:400 16px/1.65 var(--font-body);color:var(--plum)}

/* webinar mini */
.pf .mini{background:var(--plum);border-radius:32px;padding:clamp(28px,5vw,56px);display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:28px;align-items:center}

/* client project */
.pf .cp-hero{background:var(--plum)}
.pf .meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.pf .meta div{padding:16px 18px;border-radius:18px;background:rgba(251,245,238,.07);display:flex;flex-direction:column;gap:6px}
.pf .meta span{font:500 11px/1.3 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:var(--pop)}
.pf .meta b{font:400 22px/1.2 var(--font-display);color:var(--cream);font-weight:400}
.pf .cp-sec{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(24px,4vw,64px);align-items:start;padding:clamp(34px,4vw,52px) 0;border-top:1px solid rgba(58,28,42,.14)}
.pf .cp-sec h2{font-size:clamp(32px,3.6vw,46px)}
.pf .cp-sec .num{display:block;font:500 11.5px/1 var(--font-label);letter-spacing:.18em;color:var(--berry);margin-bottom:14px}
.pf .more{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.pf .more a{display:flex;flex-direction:column;gap:10px;text-decoration:none;color:var(--plum)}
.pf .more a span{font:400 22px/1.2 var(--font-display)}

@media (max-width:980px){
 .pf .hero-grid,.pf .twocol,.pf .proj,.pf .proj:nth-child(even),.pf .bx,.pf .mini,.pf .cp-sec{grid-template-columns:minmax(0,1fr)}
 .pf .proj:nth-child(even) .proj-img{order:0}
 .pf .steps,.pf .more{grid-template-columns:minmax(0,1fr)}
 .pf .gal-m{grid-template-columns:repeat(4,minmax(0,1fr))}
}
@media (max-width:700px){
 .pf .see,.pf .should,.pf .gal-d,.pf .meta{grid-template-columns:minmax(0,1fr)}
 .pf .gal-m{grid-template-columns:repeat(2,minmax(0,1fr))}
 .pf .pf-btn{font-size:15px;padding-left:20px}
}
@media (prefers-reduced-motion:reduce){.pf *{transition:none!important}}
''' + VIDEO_CSS + '</style>'

def faq(q, ans):
    a = ''.join(f'<p>{x}</p>' for x in ans)
    return (f'<details class="rv"><summary>{e(q)}<span class="faq-plus" aria-hidden="true" style="flex:none;font:400 24px/1 var(--font-body);color:#A23E66">+</span></summary>'
            f'<div class="faq-a" style="padding:2px 0 12px">{a}</div></details>')

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
<div class="stack" style="align-items:flex-start"><span class="chips"><span style="background:#A23E66">Free webinar</span></span>{btn("Save My Free Seat", "/#webinar", "cr")}</div>
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
