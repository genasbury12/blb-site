"""Builds site/_pages/coaching.html (Blog Coaching & Design: The BOSS Business Experience, 12 months)
from Genasys's copy in scripts/copy/blog-coaching.txt. Run: python3 scripts/gen_coaching_page.py"""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from folio_data import PROJECTS, IMG, VIDEO_JS, video_cards
from pf_parts import *

SRC = Path(__file__).parent / "copy/blog-coaching.txt"
# brand rule: never "six figure"
L, section = load_copy(SRC, [("my multi six figure brand", "my money making brand")])

CTA = {"Apply": CAL, "Let's Discuss": CAL, "Explore My Client Portfolio": "/portfolio/", "Explore More Client Projects": "/portfolio/#projects"}
def cta(label, cls=""):
    href = next((v for k, v in CTA.items() if label.startswith(k)), CAL)
    return btn(label, href, cls, href.startswith("http"))

_flow = flow
def flow(lines, cta_cls=""): return _flow(lines, cta_cls, cta)

def std(n, bg, layout="center", dark=False, cta_cls=""):
    lbl, h, rest = head(section(n))
    cls = ' class="dk"' if dark else ""
    lb = f'<p class="lbl">{e(lbl)}</p>' if lbl else ""
    if layout == "split":
        return (f'<section{cls} style="background:{bg}"><div class="in twocol"><div class="stack sticky">{lb}<h2>{headline(h)}</h2></div>'
                f'<div class="stack">{flow(rest, cta_cls)}</div></div></section>')
    return (f'<section{cls} style="background:{bg}"><div class="nar stack ctr-h">{lb}<h2>{headline(h)}</h2>{flow(rest, cta_cls)}</div></section>')



o = [CSS, EXTRA, '<main id="main" class="pf">']

# 01 HERO
s = section(1)
tags = s[-1].split(" | ")
o.append(f'''<section class="hero dk" style="background:#3A1C2A"><div class="in hero-grid">
<div class="stack" style="gap:22px">
<p class="lbl">{e(s[0])}</p>
<h1>Let&rsquo;s build your business. Launch it. <em>And spend the next year making it work.</em></h1>
{P(s[2])}{P(s[3])}
<p class="big">{e(s[4])}</p><p class="big it">{e(s[5])}</p>
<div class="row">{cta(s[6][1:-1], "cr")}</div>
<p class="tagrow">{''.join(f"<span>{e(t)}</span>" for t in tags)}</p>
</div>
<div class="fan" aria-hidden="true">
<span class="shot"><img src="{IMG}tammy-desktop.jpg" alt=""></span>
<span class="shot"><img src="{IMG}cajungirl-desktop.jpg" alt=""></span>
<span class="shot"><img src="{IMG}abroad-mockup.jpg" alt=""></span>
</div></div></section>''')
assert s[1].startswith("Let's build your business.")

# 02 PROBLEM: thoughts as quote cards
s = section(2)
bi = next(i for i, l in enumerate(s) if l.startswith("* ")); bj = max(i for i, l in enumerate(s) if l.startswith("* "))
thoughts = "".join(f"<p>{e(x[2:])}</p>" for x in s[bi:bj + 1])
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:bi])}</div>
<div class="thoughts">{thoughts}</div>
<div class="nar stack">{flow(s[bj + 1:])}</div></div></section>''')

o.append(std(3, "#FFFFFF", "split"))
o.append(std(4, "#F6E1E8", "split"))

# 05 OFFER
s = section(5)
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="nar stack ctr-h">
<p class="lbl">{e(s[0])}</p><h2 style="font-size:clamp(48px,7vw,96px)">The BOSS Business <em>Experience</em></h2>
<p class="big" style="text-align:center">{e(s[2])}</p>{flow(s[3:], "cr")}</div></section>''')

o.append(std(6, "#FBF5EE", "split"))

# 07 ROADMAP
s = section(7)
lbl, h = s[0], s[1]
intro = s[2:4]
ph_idx = [i for i, l in enumerate(s) if l.startswith("PHASE ")]
tail_start = None
phases = []
for k, a in enumerate(ph_idx):
    b = ph_idx[k + 1] if k + 1 < len(ph_idx) else len(s)
    blk = s[a:b]
    if k == len(ph_idx) - 1:
        cut = next(i for i, l in enumerate(blk) if l.startswith("[Let's"))
        tail_start, blk = blk[cut:], blk[:cut]
    num, name, when = blk[0], blk[1], blk[2]
    oi = blk.index("The outcome:")
    body, outcome = blk[3:oi], blk[oi + 1:]
    phases.append(f'''<article class="phase rv"><div><span class="pn">{e(num)}</span><h3>{e(name)}</h3><span class="when">{e(when)}</span></div>
<div class="stack" style="gap:14px">{flow(body)}<div class="outc"><b>The outcome</b>{e(" ".join(outcome))}</div></div></article>''')
o.append(f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">{e(lbl)}</p><h2>{headline(h)}</h2>{flow(intro)}</div>
<div class="phases">{''.join(phases)}</div>
<div class="row" style="justify-content:center">{cta(tail_start[0][1:-1], "br")}</div></div></section>''')

# 08 CYCLE
s = section(8)
ci = next(i for i, l in enumerate(s) if l.startswith("01. "))
steps = s[ci:ci + 10]
cyc = "".join(f"<div><b>{e(steps[k])}</b><p>{e(steps[k + 1])}</p></div>" for k in range(0, 10, 2))
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:ci])}</div>
<div class="cycle">{cyc}</div>
<div class="nar stack">{flow(s[ci + 10:])}</div></div></section>''')

# 09 WEBSITE: real mockups + videos replace the image slots
s = section(9)
cut = next(i for i, l in enumerate(s) if l.startswith("[Insert"))
fol = "".join(f'<a class="proj-img" href="/client-project/?project={k}"><img src="{IMG}{k}-mockup.jpg" alt="{e(n)} website on a laptop and phone" loading="lazy" width="1600" height="1100"></a>' for k, n, *_ in PROJECTS[:3])
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:30px">
<div class="in twocol" style="width:100%"><div class="stack sticky"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2></div><div class="stack">{flow(s[2:cut])}</div></div>
<div class="gal-d gal3">{fol}</div>
{slot("Insert genuine website design testimonial.")}
<div class="row" style="justify-content:center">{cta("Explore My Client Portfolio", "ol")}</div></div></section>''')

# 10 DFY: pairs
s = section(10)
pi = s.index("Your personalized implementation scope may include:")
pe = next(i for i, l in enumerate(s) if l.startswith("Your exact deliverables"))
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:pi + 1])}</div>
{pairs(s[pi + 1:pe])}
<div class="nar stack">{flow(s[pe:])}</div></div></section>''')

o.append(std(11, "#F6E1E8", "split"))

# 12 PRIVATE CLIENT EXPERIENCE: pairs
s = section(12)
pi = next(i for i, l in enumerate(s) if l.startswith("Private 1:1 Business Strategy Calls"))
pe = next(i for i, l in enumerate(s) if l.startswith("You'll have someone"))
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:pi])}</div>
{pairs(s[pi:pe])}
<div class="nar stack">{flow(s[pe:])}</div></div></section>''')

# 13 RESULTS: videos + real projects + case study slots
s = section(13)
cut = next(i for i, l in enumerate(s) if l.startswith("[Insert"))
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{flow(s[2:cut])}</div>
{video_cards()}
<div class="row" style="align-items:stretch">{slot("Featured client case study: her original challenges, actual deliverables and verified outcomes, with her completed website design.", "sm")}{slot("Second featured client case study: original business goals, strategic decisions and completed implementation work.", "sm")}</div>
<div class="row" style="justify-content:center">{cta("Explore More Client Projects", "ol")}</div></div></section>''')

# 14 MEET
s = section(14)
o.append(f'''<section style="background:#FBF5EE"><div class="in twocol">
<div class="stack sticky"><span class="shot" style="border-radius:999px 999px 26px 26px;border:10px solid #fff;max-width:420px"><img src="/images/photos/portrait-hat.jpg" alt="Genasys smiling in her pink hat" loading="lazy" style="aspect-ratio:3/4;object-fit:cover;object-position:60% 30%"></span></div>
<div class="stack"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{flow(s[2:])}</div></div></section>''')

# 15 WHY ONE PARTNER
s = section(15)
pi = s.index("The BOSS Business Experience brings multiple areas of expertise together.")
pe = next(i for i, l in enumerate(s) if l.startswith("One person who understands"))
o.append(f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:pi + 1])}</div>
{pairs(s[pi + 1:pe])}
<div class="nar stack" style="text-align:center">{''.join(f'<p class="big">{e(x)}</p>' for x in s[pe:])}</div></div></section>''')

# 16 INVESTMENT
s = section(16)
pi = s.index("YOUR 12 MONTH PRIVATE PARTNERSHIP")
pe = s.index("PRIVATE CLIENT INVESTMENT")
inv = s[pe + 1:]
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0] + " " + s[1])}</h2></div>
<div class="price dk"><p class="lbl">{e(s[pi])}</p><h3 style="font-size:clamp(34px,4vw,52px);color:#FBF5EE">{e(s[pi - 1])}</h3>
{pairs(s[pi + 1:pe])}</div>
<div class="nar stack" style="text-align:center;align-items:center"><p class="lbl">{e(s[pe])}</p>
<p class="big">Starting at</p>{slot("Confirmed starting investment.")}{slot("Initial business development payment and ongoing monthly partnership terms.")}
{flow(inv[2:])}</div></div></section>''')
assert inv[0].startswith("Starting at [") and inv[1].startswith("[Insert")

# 17 WHO FOR
s = section(17)
fi = next(i for i, l in enumerate(s) if l.startswith("* ")); fe = next(i for i in range(fi, len(s)) if not s[i].startswith("* "))
ni = next(i for i, l in enumerate(s) if l.startswith("This experience is probably not"))
ne = next(i for i in range(ni + 1, len(s)) if not s[i].startswith("* "))
yes = "".join(f"<li>{e(x[2:])}</li>" for x in s[fi:fe]); no = "".join(f"<li>{e(x[2:])}</li>" for x in s[ni + 1:ne])
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:fi])}</div>
<div class="fornot"><div style="background:#FFFFFF"><p class="lbl">This is for you if</p><ul class="ticks lt" style="--x:0">{yes}</ul></div>
<div style="background:#F6E1E8"><p class="lbl">Probably not the right fit if</p><ul class="ticks lt no">{no}</ul></div></div>
<div class="nar stack">{flow(s[fe:ni])}{flow(s[ne:])}<div class="row">{btn("The Blogging Ladies Membership", "/membership/", "ol")}{btn("The BOSS Academy", "/academy/", "ol")}</div></div></div></section>''')

# 18 HOW TO START
s = section(18)
st = [i for i, l in enumerate(s) if l.startswith("Step ")]
cards = []
for k, a in enumerate(st):
    b = st[k + 1] if k + 1 < len(st) else next(i for i, l in enumerate(s) if l.startswith("[Apply"))
    num, title = s[a].split(". ", 1)
    cards.append(f'<article class="step rv"><span class="n">{e(num.replace("Step ", ""))}</span><h3>{e(title)}</h3>{"".join(f"<p>{e(x)}</p>" for x in s[a + 1:b])}</article>')
o.append(f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2></div>
<div class="steps steps4">{''.join(cards)}</div>
<div class="row" style="justify-content:center">{cta(s[-1][1:-1], "br")}</div></div></section>''')

# 19 AVAILABILITY
s = section(19)
o.append(f'''<section style="background:#FFFFFF"><div class="in"><div class="avail">
<h2>{headline(s[0])}</h2>{"".join(f'<p class="body" style="max-width:720px">{e(x)}</p>' for x in s[1:-1])}
<div class="row" style="justify-content:center">{cta(s[-1][1:-1], "cr")}</div></div></div></section>''')

# 20 FAQ
s = section(20)
qs, cur = [], None
for l in s:
    if l.endswith("?") and len(l) < 110: cur = [l, []]; qs.append(cur)
    elif cur: cur[1].append(l)
def ans(lines):
    out = []
    for l in lines:
        if l.startswith("[Insert"): out.append(f'<span style="display:block;border:2px dashed #A23E66;border-radius:12px;padding:10px 14px;color:#A23E66;font-weight:600">TO FILL IN: {e(l[8:-1])}</span>')
        elif "[Confirmed Starting Investment]" in l: out.append(e(l.split("[")[0]) + '<span style="display:inline-block;border:2px dashed #A23E66;border-radius:10px;padding:2px 10px;color:#A23E66;font-weight:600">TO FILL IN: confirmed starting investment</span>.')
        else: out.append(e(l))
    return out
o.append(f'''<section style="background:#FBF5EE"><div class="nar stack" style="gap:26px">
<div class="stack" style="text-align:center;gap:14px"><p class="lbl">Frequently asked questions</p><h2>Your questions, <em>answered.</em></h2></div>
<div class="faq">{"".join(faq(q, ans(a)) for q, a in qs)}</div></div></section>''')

# 21 FINAL (copy was cut off: rest is a slot)
s = section(21)
o.append(f'''<section style="background:#F6E1E8"><div class="nar stack ctr-h">
<h2>{headline(s[0])}</h2>{flow(s[1:])}
{slot("The rest of this section, from “I can't promise that every marketing campaign” to your final call to action. Send it and I'll finish this section.")}
<div class="row" style="justify-content:center">{cta("Apply for Your Complimentary Fast Track Call", "br")}</div></div></section>''')

o.append(VIDEO_JS + "\n</main>")
out = "\n".join(o)
for bad in ["—", "–", "…"]: assert bad not in out, bad
assert "six figure" not in out.lower()
(ROOT / "coaching.html").write_text(out)
print("wrote coaching.html", len(out))
