"""Builds site/_pages/coaching.html (Blog Coaching & Design: The BOSS Business Experience, 12 months)
from Genasys's copy in scripts/copy/blog-coaching.txt. Run: python3 scripts/gen_coaching_page.py"""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from folio_data import PROJECTS, IMG, VIDEO_JS, video_cards
from pf_parts import *

SRC = Path(__file__).parent / "copy/blog-coaching.txt"
L = [l.strip() for l in SRC.read_text().split("\n") if l.strip()]
# brand rule: never "six figure"
L = [l.replace("my multi six figure brand", "my money making brand") for l in L]

def section(n):
    start = next(i for i, l in enumerate(L) if l.startswith(f"SECTION {n:02d}:"))
    end = next((i for i, l in enumerate(L) if i > start and l.startswith("SECTION ")), len(L))
    return L[start + 1:end]

CTA = {"Apply": CAL, "Let's Discuss": CAL, "Explore My Client Portfolio": "/portfolio/", "Explore More Client Projects": "/portfolio/#projects"}
def cta(label, cls=""):
    href = next((v for k, v in CTA.items() if label.startswith(k)), CAL)
    return btn(label, href, cls, href.startswith("http"))

def is_label(l): return l.isupper() and len(l) > 3
def headline(l):
    parts = re.split(r"(?<=[.?])\s+", l, maxsplit=1)
    if len(parts) == 2: return f"{e(parts[0])} <em>{e(parts[1])}</em>"
    return e(l)

def flow(lines, cta_cls=""):
    """Generic renderer: bullets, buttons, slots, short display lines and paragraphs."""
    out, i = [], 0
    while i < len(lines):
        l = lines[i]
        if l.startswith("* "):
            items = []
            while i < len(lines) and lines[i].startswith("* "):
                items.append(lines[i][2:]); i += 1
            out.append('<ul class="ticks lt">' + "".join(f"<li>{e(x)}</li>" for x in items) + "</ul>")
            continue
        if l.startswith("[") and l.endswith("]"):
            inner = l[1:-1]
            if inner.startswith("Insert"): out.append(slot(inner + "."))
            else: out.append(f'<div class="row">{cta(inner, cta_cls)}</div>')
        elif is_label(l): out.append(f'<p class="lbl">{e(l)}</p>')
        elif len(l) <= 64: out.append(f'<p class="beat">{e(l)}</p>')
        else: out.append(P(l))
        i += 1
    return "\n".join(out)

def head(lines):
    """Pull the optional label and the headline off the front of a section."""
    lbl = ""
    if is_label(lines[0]): lbl, lines = lines[0], lines[1:]
    return lbl, lines[0], lines[1:]

def std(n, bg, layout="center", dark=False, cta_cls=""):
    lbl, h, rest = head(section(n))
    cls = ' class="dk"' if dark else ""
    lb = f'<p class="lbl">{e(lbl)}</p>' if lbl else ""
    if layout == "split":
        return (f'<section{cls} style="background:{bg}"><div class="in twocol"><div class="stack sticky">{lb}<h2>{headline(h)}</h2></div>'
                f'<div class="stack">{flow(rest, cta_cls)}</div></div></section>')
    return (f'<section{cls} style="background:{bg}"><div class="nar stack ctr-h">{lb}<h2>{headline(h)}</h2>{flow(rest, cta_cls)}</div></section>')

def pairs(lines):
    """Title line followed by a description line."""
    return '<div class="pairs">' + "".join(f'<article class="pair rv"><h3>{e(t)}</h3><p>{e(d)}</p></article>' for t, d in zip(lines[::2], lines[1::2])) + '</div>'

EXTRA = r'''<style>
.pf .beat{font:400 clamp(21px,2.3vw,26px)/1.3 var(--font-display);color:var(--plum)}
.pf .dk .beat{color:var(--cream)}
.pf .ctr-h{text-align:left}
.pf .ctr-h > h2,.pf .ctr-h > .lbl{text-align:center}
.pf .sticky{position:sticky;top:110px}
.pf .ticks.lt li{background:#fff;color:var(--plum)}
.pf .dk .ticks.lt li{background:rgba(251,245,238,.08);color:var(--cream)}
.pf .ticks.no li::before{background:var(--plum) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 7l10 10M17 7L7 17' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E") center/14px no-repeat}
.pf .tagrow{display:flex;flex-wrap:wrap;gap:8px 18px;font:500 11.5px/1.5 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:var(--pop)}
.pf .tagrow span+span::before{content:"\2726";margin-right:18px;color:var(--berry)}
.pf .thoughts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pf .thoughts p{padding:18px 20px;border-radius:18px;background:#fff;font:400 italic 21px/1.35 var(--font-display);color:var(--plum)}
.pf .thoughts p::before{content:"\201C";color:var(--berry)}.pf .thoughts p::after{content:"\201D";color:var(--berry)}
.pf .phase{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(24px,4vw,56px);padding:clamp(26px,4vw,44px);border-radius:32px;background:#fff;align-items:start}
.pf .phase .pn{font:500 12px/1 var(--font-label);letter-spacing:.2em;color:var(--berry)}
.pf .phase h3{font:400 italic clamp(48px,6vw,80px)/.95 var(--font-display);color:var(--plum);margin:10px 0 12px}
.pf .phase .when{display:inline-block;padding:9px 14px;border-radius:999px;background:var(--plum);color:var(--cream);font:500 11px/1 var(--font-label);letter-spacing:.14em}
.pf .phase .ticks.lt li{background:var(--cream);font-size:15px;padding:11px 14px 11px 46px}
.pf .phase .ticks.lt li::before{top:12px}
@media (min-width:1100px){.pf .phase .ticks{grid-template-columns:repeat(2,minmax(0,1fr))}}
.pf .phase .outc{padding:18px 20px;border-radius:18px;background:var(--berry);color:#fff;font:400 20px/1.35 var(--font-display)}
.pf .phase .outc b{display:block;font:500 11px/1.3 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:var(--pop);margin-bottom:6px;font-weight:500}
.pf .phases{display:flex;flex-direction:column;gap:18px}
.pf .cycle{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;counter-reset:c}
.pf .cycle div{padding:22px 18px;border-radius:22px;background:rgba(251,245,238,.08);display:flex;flex-direction:column;gap:8px}
.pf .cycle b{font:400 italic 34px/1 var(--font-display);color:var(--pop);font-weight:400}
.pf .cycle p{font:400 15px/1.55 var(--font-body);color:#F1DDE2}
.pf .pairs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.pf .pair{padding:22px 24px;border-radius:22px;background:#fff;display:flex;flex-direction:column;gap:8px}
.pf .pair h3{font-size:25px;line-height:1.15}
.pf .pair p{font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.pf .dk .pair{background:rgba(251,245,238,.07)}.pf .dk .pair h3{color:var(--cream)}.pf .dk .pair p{color:#F1DDE2}
.pf .price{background:var(--plum);border-radius:32px;padding:clamp(28px,4vw,48px);display:flex;flex-direction:column;gap:14px}
.pf .fornot{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.pf .fornot > div{border-radius:28px;padding:clamp(22px,3vw,32px);display:flex;flex-direction:column;gap:14px}
.pf .avail{background:var(--berry);border-radius:32px;padding:clamp(30px,5vw,60px);text-align:center;display:flex;flex-direction:column;gap:16px;align-items:center}
.pf .avail h2{color:#fff}.pf .avail h2 em{color:var(--pop)}.pf .avail .body{color:#FBE3EA}

.pf .steps4{grid-template-columns:repeat(4,minmax(0,1fr))}.pf .gal3{grid-template-columns:repeat(3,minmax(0,1fr))}
@media (max-width:1100px){.pf .steps4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:980px){.pf .gal3{grid-template-columns:minmax(0,1fr)}.pf .phase{grid-template-columns:minmax(0,1fr)}.pf .cycle{grid-template-columns:repeat(2,minmax(0,1fr))}.pf .sticky{position:static}}
@media (max-width:700px){.pf .steps4,.pf .thoughts,.pf .pairs,.pf .fornot,.pf .cycle{grid-template-columns:minmax(0,1fr)}}
</style>'''

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
