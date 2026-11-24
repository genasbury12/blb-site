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

from fp_parts import orbit, THEME, WM

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
