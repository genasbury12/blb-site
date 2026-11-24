"""Builds site/_pages/futureproof-blogger.html: The Futureproof Blogger sales page in its own editorial
"The Future Is Female" brand (Midnight Orchid, Digital Pearl, lavender, liquid silver; Bodoni Moda + Space Grotesk).
No sales copy was supplied for this course yet, so the page uses Genasys's own words only: the brand guide's
headlines and campaign lines, plus the course copy from the All Access page (scripts/copy/all-access.txt).
Everything else (curriculum, deliverables, price, proof) is a TO FILL IN slot.
Run: python3 scripts/gen_futureproof_page.py"""
import math, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pf_parts import *

# Paste the course checkout link here. Until then every buy button scrolls to the purchase box.
CHECKOUT = ""
BUY = CHECKOUT or "#enroll"
def buy(label, cls=""): return btn(label, BUY, cls, BUY.startswith("http"))

# Course copy already written for the All Access page (Course 01)
AA = [l.strip() for l in (Path(__file__).parent / "copy/all-access.txt").read_text().split("\n") if l.strip()]
c0 = AA.index("COURSE 01")
c1 = AA.index("COURSE 02")
C = AA[c0:c1]
TAG = C[3]
QS = C[4:7]
DESC = C[7]
ii = C.index("Inside, you'll explore:")
EXPLORE = [x[2:] for x in C[ii + 1:] if x.startswith("* ")]
WHO = next(x for x in C if x.startswith("Whether you're just starting"))
TRANS = C[C.index("The transformation:") + 1]
assert C[2] == "The Futureproof Blogger" and len(QS) == 3 and len(EXPLORE) == 7

def orbit(cls="orbit", n=18):
    rings = "".join(f'<ellipse cx="200" cy="200" rx="170" ry="{60 + (i % 3) * 14}" transform="rotate({i * 180 / n:.1f} 200 200)"/>' for i in range(n))
    return f'<svg class="{cls}" viewBox="0 0 400 400" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".9">{rings}</g></svg>'

THEME = r'''<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400;1,6..96,500&family=Space+Grotesk:wght@400;500;600&display=swap">
<style>
/* The Futureproof Blogger: The Future Is Female. A high fashion editorial identity: chrome meets couture.
   ~50% Midnight Orchid, 30% Digital Pearl, 15% lavender and amethyst, 5% liquid silver. */
.fpb{--orchid:#211C2C;--amethyst:#69577F;--flilac:#A99AC6;--silver:#C8CCD8;--lav:#D9CDE7;--pearl:#F6F3F8;
 --plum:#211C2C;--berry:#69577F;--rose:#D9CDE7;--blush:#D9CDE7;--cream:#F6F3F8;--cocoa:#3B3446;--mauve:#69577F;--pop:#A99AC6;
 --font-display:'Bodoni Moda',Georgia,serif;--font-body:'Space Grotesk',system-ui,sans-serif;--font-label:'Space Grotesk',system-ui,sans-serif;
 background:var(--pearl);font-family:var(--font-body)}
.fpb h1,.fpb h2,.fpb h3{font-weight:400;letter-spacing:-.01em;line-height:1.02}
.fpb h1 em,.fpb h2 em{font-style:italic;color:var(--amethyst)}
.fpb .dk h1 em,.fpb .dk h2 em{color:var(--flilac)}
.fpb .lbl{font:600 11.5px/1.4 var(--font-label);letter-spacing:.22em;color:var(--amethyst)}
.fpb .dk .lbl{color:var(--flilac)}
.fpb .body{font:400 18px/1.7 var(--font-body);color:var(--cocoa)}
.fpb .dk .body{color:#D8D2E2}
.fpb .big{font:400 clamp(24px,2.8vw,32px)/1.3 var(--font-display);color:var(--orchid)}
.fpb .dk .big{color:var(--pearl)}
.fpb .orc{background:var(--orchid)}
.fpb .lavbg{background:var(--lav)}
.fpb .amebg{background:var(--amethyst)}
.fpb .pf-btn{background:var(--pearl);color:var(--orchid);border-radius:999px;font:600 14px/1 var(--font-label);letter-spacing:.16em;text-transform:uppercase;min-height:58px;padding:8px 10px 8px 28px}
.fpb .pf-btn i{background:var(--orchid)}
.fpb .pf-btn.dkb{background:var(--orchid);color:var(--pearl)}.fpb .pf-btn.dkb i{background:var(--amethyst)}
.fpb .pf-btn.ol{background:transparent;color:var(--orchid);border:1px solid var(--orchid)}.fpb .pf-btn.ol i{background:var(--amethyst)}
.fpb .pf-btn.olw{background:transparent;color:var(--pearl);border:1px solid rgba(246,243,248,.5)}.fpb .pf-btn.olw i{background:var(--amethyst)}.fpb .pf-btn.olw i svg{stroke:#fff}
.fpb .pf-slot{border:1px dashed var(--amethyst);color:var(--amethyst);background:rgba(105,87,127,.05);border-radius:4px;font-family:var(--font-body)}
.fpb .dk .pf-slot{border-color:var(--flilac);color:var(--lav);background:rgba(169,154,198,.07)}
.fpb .rule{height:1px;background:currentColor;opacity:.25;border:0;margin:0}
.fpb .issue{font:500 11.5px/1 var(--font-label);letter-spacing:.24em;text-transform:uppercase}
/* wordmark */
.fpb .wm{line-height:.9;color:var(--pearl);margin:0}
.fpb .wm .t{display:block;font:italic 400 clamp(30px,3.4vw,48px)/1 var(--font-display);color:var(--lav)}
.fpb .wm .f{display:block;font:400 clamp(34px,4.9vw,76px)/.95 var(--font-display);letter-spacing:.01em;background:linear-gradient(180deg,#fff 0%,#C8CCD8 55%,#8E92A4 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.fpb .wm .b{display:block;font:italic 400 clamp(48px,6.6vw,104px)/.95 var(--font-display);color:#fff}
/* hero */
.fpb .hero{position:relative;overflow:hidden;isolation:isolate;padding-top:clamp(56px,7vw,96px)}
.fpb .hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(30px,5vw,64px);align-items:center}
.fpb .hero h1{font-size:clamp(34px,3.8vw,52px);color:var(--pearl)}
.fpb .portrait{position:relative;aspect-ratio:4/5;overflow:hidden;border-radius:2px}
.fpb .portrait img{width:100%;height:100%;object-fit:cover;object-position:55% 25%;display:block;filter:grayscale(1) contrast(1.08) brightness(.92)}
.fpb .portrait::after{content:"";position:absolute;inset:0;background:linear-gradient(160deg,rgba(169,154,198,.45),rgba(33,28,44,.55));mix-blend-mode:multiply}
.fpb .portrait .orbit{position:absolute;right:-38%;top:-30%;width:78%;color:var(--lav);z-index:2;opacity:.75}
.fpb .portrait figcaption{position:absolute;left:16px;bottom:14px;z-index:3;color:var(--pearl)}
.fpb .orbit{animation:fp-spin 60s linear infinite}
@keyframes fp-spin{to{transform:rotate(360deg)}}
/* evolution */
.fpb .evo{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:clamp(30px,5vw,72px);align-items:center}
.fpb .qs{display:flex;flex-direction:column}
.fpb .qs p{padding:22px 0;border-top:1px solid rgba(33,28,44,.18);font:italic 400 clamp(22px,2.4vw,30px)/1.3 var(--font-display);color:var(--orchid)}
.fpb .qs p span{display:block;font:500 11px/1 var(--font-label);font-style:normal;letter-spacing:.24em;color:var(--amethyst);margin-bottom:10px}
.fpb .sphere{aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 34% 30%,#fff 0%,#E8E9F0 14%,#C8CCD8 42%,#8E92A4 78%,#6c7083 100%);box-shadow:0 60px 90px -40px rgba(33,28,44,.55),inset -20px -30px 60px rgba(33,28,44,.25);max-width:380px;width:100%;margin:0 auto}
/* statement */
.fpb .state{text-align:center;padding:clamp(90px,12vw,170px) clamp(16px,4vw,48px)}
.fpb .state h2{font-size:clamp(46px,7.4vw,108px);line-height:1}
/* index */
.fpb .index{list-style:none;margin:0;padding:0;counter-reset:x}
.fpb .index li{counter-increment:x;display:grid;grid-template-columns:90px minmax(0,1fr);gap:20px;align-items:baseline;padding:24px 0;border-top:1px solid rgba(33,28,44,.18)}
.fpb .index li:last-child{border-bottom:1px solid rgba(33,28,44,.18)}
.fpb .index li::before{content:counter(x,decimal-leading-zero);font:italic 400 44px/1 var(--font-display);color:var(--flilac)}
.fpb .index li span{font:400 clamp(21px,2.2vw,27px)/1.3 var(--font-display);color:var(--orchid)}
.fpb .trans{padding:clamp(26px,4vw,44px);background:var(--orchid);color:var(--pearl);font:italic 400 clamp(24px,2.6vw,32px)/1.3 var(--font-display)}
.fpb .trans b{display:block;font:500 11px/1 var(--font-label);font-style:normal;letter-spacing:.24em;color:var(--flilac);margin-bottom:14px}
/* founder + purchase */
.fpb .fp-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(30px,5vw,72px);align-items:start}
.fpb .card{background:#fff;border:1px solid rgba(33,28,44,.14);padding:clamp(26px,4vw,44px);display:flex;flex-direction:column;gap:16px}
.fpb .card .wm .f{font-size:clamp(34px,4vw,54px);background:linear-gradient(180deg,#69577F,#211C2C);-webkit-background-clip:text;background-clip:text}
.fpb .card .wm .t{color:var(--amethyst);font-size:26px}.fpb .card .wm .b{color:var(--orchid);font-size:clamp(40px,4.4vw,60px)}
/* closing */
.fpb .portal{position:relative;overflow:hidden;isolation:isolate;text-align:center}
.fpb .portal .orbit{position:absolute;left:50%;top:50%;width:min(900px,140vw);transform:translate(-50%,-50%);color:var(--amethyst);opacity:.3;z-index:-1;animation:fp-spin2 90s linear infinite}
@keyframes fp-spin2{to{transform:translate(-50%,-50%) rotate(360deg)}}
.fpb .lines p{font:italic 400 clamp(22px,2.6vw,32px)/1.35 var(--font-display);color:var(--pearl);margin:0 0 6px}
.fpb .lines p:nth-child(even){color:var(--flilac)}
.fpb .portal h2{font-size:clamp(54px,8vw,120px);line-height:1}
@media (max-width:980px){.fpb .hero-grid,.fpb .evo,.fpb .fp-grid{grid-template-columns:minmax(0,1fr)}.fpb .sphere{max-width:260px}}
@media (max-width:600px){.fpb .index li{grid-template-columns:56px minmax(0,1fr);gap:12px}.fpb .index li::before{font-size:32px}}
@media (prefers-reduced-motion:reduce){.fpb .orbit,.fpb .portal .orbit{animation:none}}
</style>'''

WM = '<p class="wm" aria-label="The Futureproof Blogger"><span class="t">The</span><span class="f">FUTUREPROOF</span><span class="b">Blogger.</span></p>'
o = [CSS, THEME, '<main id="main" class="pf fpb">']

# 01 HERO
o.append(f'''<section class="hero orc dk"><div class="in hero-grid">
<div class="stack" style="gap:22px"><p class="lbl">The BOSS Academy presents</p>{WM}
<hr class="rule" style="color:#F6F3F8">
<h1>She doesn&rsquo;t fear the future. <em>She builds it.</em></h1>
<p class="big">{e(TAG)}</p>{P(DESC)}
<div class="row">{buy("Enter the Next Era")}<a class="issue" href="/all-access/" style="color:#A99AC6">Included with BOSS Academy All Access &rarr;</a></div></div>
<figure class="portrait" style="margin:0">{orbit()}<img src="/images/photos/portrait-hat.jpg" alt="Genasys, founder of Boss Lady Bloggers"><figcaption class="issue">Issue 01 / The Future Issue</figcaption></figure>
</div></section>''')

# 02 THE EVOLUTION
qs = "".join(f'<p><span>Signal {i + 1:02d}</span>{e(q)}</p>' for i, q in enumerate(QS))
o.append(f'''<section style="background:#F6F3F8"><div class="in evo">
<div class="stack" style="gap:20px"><p class="lbl">02 / The evolution</p><h2>Will the business you&rsquo;re building today <em>still make sense tomorrow?</em></h2>
{P("Discover how AI, changing consumer behavior and the evolution of the internet are reshaping the blogging industry.")}
<div class="qs">{qs}</div></div>
<div class="stack" style="align-items:center;gap:18px"><div class="sphere" aria-hidden="true"></div><p class="issue" style="color:#69577F">Evolution is her advantage.</p></div>
</div></section>''')

# 03 BELIEF SHIFT
o.append('''<section class="state lavbg"><p class="lbl" style="margin-bottom:22px">03 / The belief shift</p><h2>Information is everywhere. <em>Value is not.</em></h2></section>''')

# 04 THE COURSE
o.append(f'''<section style="background:#F6F3F8"><div class="in twocol">
<div class="stack sticky"><p class="lbl">04 / The course</p><h2>Inside <em>The Futureproof Blogger.</em></h2>{P(DESC)}{P(WHO)}</div>
<div class="stack" style="gap:26px"><p class="issue" style="color:#69577F">Inside, you&rsquo;ll explore</p><ol class="index">{"".join(f"<li><span>{e(x)}</span></li>" for x in EXPLORE)}</ol>
<div class="trans"><b>The transformation</b>{e(TRANS)}</div></div></div></section>''')

# 05 THE FUTURE FILES
o.append(f'''<section class="orc dk"><div class="in stack" style="gap:26px">
<div class="nar stack ctr-h"><p class="lbl" style="text-align:center">05 / The Future Files</p><h2 style="text-align:center">The curriculum, <em>file by file.</em></h2></div>
<div class="nar">{slot("Your verified module list for The Futureproof Blogger: each Future File's name and a one line outcome. Send it and I'll set it as an editorial index here.")}</div>
</div></section>''')

# 06 PROOF AND PURCHASE
o.append(f'''<section id="enroll" style="background:#F6F3F8;scroll-margin-top:40px"><div class="in fp-grid">
<div class="stack" style="gap:18px"><figure class="portrait" style="margin:0;aspect-ratio:4/5"><img src="/images/photos/desk-writing.jpg" alt="Genasys writing at her desk" loading="lazy"></figure>
<p class="lbl">Meet your educator</p><p class="big">Hi, I&rsquo;m Genasys.</p>
{P("Founder of Boss Lady Bloggers, professional blogging coach, business strategist and custom Showit website designer.")}
<p class="big"><em style="color:#69577F">I&rsquo;m not interested in teaching you how to build a business for an internet that no longer exists.</em></p></div>
<div class="stack" style="gap:18px">
<div class="card">{WM}<hr class="rule">
<p class="issue" style="color:#69577F">What&rsquo;s inside</p>{slot("The actual deliverables: lessons, resources and anything else included with the course.", "sm")}
<p class="issue" style="color:#69577F">Your investment</p>{slot("Course price and payment options.", "sm")}{slot("Confirmed access duration and refund terms.", "sm")}
<div class="row">{buy("Enter the Next Era", "dkb")}</div>
<a class="issue" href="/all-access/" style="color:#69577F">Or get every course with BOSS Academy All Access &rarr;</a>
{"" if CHECKOUT else slot("Your Futureproof Blogger checkout link. Until you send it, every Enter the Next Era button scrolls here.", "sm")}</div>
{slot("Verified student testimonials, when you have them.", "sm")}</div>
</div></section>''')

# 07 CLOSING
lines = ["The future is female. And she's building it.", "She sees opportunity where others see uncertainty.", "Beyond blogging. Beyond the algorithm.",
         "Built on human intelligence. Empowered by AI.", "Become the business owner who understands what's changing."]
o.append(f'''<section class="portal orc dk">{orbit()}<div class="nar stack" style="gap:30px;align-items:center">
<div class="lines">{"".join(f"<p>{e(x)}</p>" for x in lines)}</div>
<h2>Enter the <em>next era.</em></h2>
<div class="row" style="justify-content:center">{buy("Enter the Next Era")}{btn("Explore BOSS Academy All Access", "/all-access/", "olw")}</div></div></section>''')

o.append(LEGAL + "</main>")
out = "\n".join(o)
for bad in ["—", "–", "…"]: assert bad not in out, bad
(ROOT / "futureproof-blogger.html").write_text(out)
print("wrote futureproof-blogger.html", len(out))
