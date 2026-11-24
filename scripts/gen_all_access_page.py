"""Builds site/_pages/all-access.html (The BOSS Academy All Access sales page) from Genasys's copy in
scripts/copy/all-access.txt. Run: python3 scripts/gen_all_access_page.py"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pf_parts import *

# Paste the All Access checkout link here. Until then every buy button scrolls to the price box.
CHECKOUT = ""
BUY = CHECKOUT or "#unlock"
SRC = Path(__file__).parent / "copy/all-access.txt"
L, section = load_copy(SRC, [("I built a multi six figure brand", "I built a money making brand")])

def cta(label, cls=""):
    if label.startswith("Shop Individual"): return btn(label, "/academy/#library", cls)
    return btn(label, BUY, cls, BUY.startswith("http"))
_flow = flow
def flow(lines, cta_cls=""):
    # "[Include ...]" is an instruction too, not a button
    lines = [("[Insert " + l[9:]) if l.startswith("[Include ") else l for l in lines]
    return _flow(lines, cta_cls, cta)

def std(n, bg, layout="split", dark=False, cta_cls=""):
    lbl, h, rest = head(section(n))
    cls = ' class="dk"' if dark else ""
    lb = f'<p class="lbl">{e(lbl)}</p>' if lbl else ""
    if layout == "split":
        return (f'<section{cls} style="background:{bg}"><div class="in twocol"><div class="stack sticky">{lb}<h2>{headline(h)}</h2></div>'
                f'<div class="stack">{flow(rest, cta_cls)}</div></div></section>')
    return f'<section{cls} style="background:{bg}"><div class="nar stack ctr-h">{lb}<h2>{headline(h)}</h2>{flow(rest, cta_cls)}</div></section>'

def inline_slot(t): return f'<span class="islot">To fill in: {e(t)}</span>'

COURSES = [("futureproof", "#A23E66", "#FFFFFF"), ("pbm", "#FBF5EE", "#3A1C2A"), ("interactive", "#E9B9CA", "#3A1C2A")]
def cover(name, cat, bg, fg, big=False):
    return (f'<div class="cover{" big" if big else ""}" style="background:{bg};color:{fg}"><small>The BOSS Academy</small>'
            f'<b>{e(name)}</b><small>{e(cat)}</small></div>')

EXTRA2 = r'''<style>
.pf .cover{aspect-ratio:3/2;border-radius:8px 18px 18px 8px;padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:-8px 0 0 rgba(0,0,0,.16) inset,0 30px 60px -40px rgba(0,0,0,.6)}
.pf .cover small{font:500 10.5px/1.4 var(--font-label);letter-spacing:.16em;text-transform:uppercase}
.pf .cover b{font:400 clamp(28px,2.8vw,36px)/1 var(--font-display);font-weight:400}
.pf .covers{position:relative;aspect-ratio:1/1;max-width:520px;margin-left:auto;width:100%}
.pf .covers .cover{position:absolute;width:74%;justify-content:flex-start;gap:12px}
.pf .covers .cover small:last-child{margin-top:auto}
.pf .covers .cover:nth-child(1){left:0;top:2%;transform:rotate(-5deg)}
.pf .covers .cover:nth-child(2){right:0;top:27%;transform:rotate(4deg)}
.pf .covers .cover:nth-child(3){left:8%;top:52%;transform:rotate(-1deg)}
.pf .islot{display:inline-block;border:2px dashed currentColor;border-radius:10px;padding:3px 10px;font:600 14px/1.4 var(--font-body)}
.pf .course{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(24px,4vw,56px);padding:clamp(24px,4vw,44px);border-radius:32px;background:#fff;align-items:start}
.pf .course .ticks.lt li{background:var(--cream);font-size:15px}
.pf .course .num{font:500 12px/1 var(--font-label);letter-spacing:.2em;color:var(--berry)}
.pf .course h3{font-size:clamp(36px,4vw,54px);line-height:1}
.pf .course .hook{font:400 italic clamp(21px,2.2vw,26px)/1.3 var(--font-display);color:var(--berry)}
.pf .pricebar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;padding:14px 18px;border-radius:16px;background:var(--plum);color:var(--cream);font:500 12px/1.4 var(--font-label);letter-spacing:.14em;text-transform:uppercase}
.pf .pricebar .islot{color:var(--pop);letter-spacing:0;text-transform:none}
.pf .pricebar .inc{color:var(--pop)}
.pf .courses{display:flex;flex-direction:column;gap:20px}
.pf .three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.pf .three article{border-radius:28px;padding:28px;display:flex;flex-direction:column;gap:10px}
.pf .three h3{font:400 italic clamp(34px,3.4vw,44px)/1 var(--font-display)}
.pf .three p{font:400 16px/1.6 var(--font-body)}
.pf .stack-v{background:#fff;border-radius:32px;padding:clamp(24px,4vw,44px);display:flex;flex-direction:column;gap:0}
.pf .vrow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 24px;align-items:center;padding:20px 0;border-bottom:1px solid rgba(58,28,42,.12)}
.pf .vrow h3{font-size:26px;line-height:1.15}
.pf .vrow p{font:400 15.5px/1.6 var(--font-body);color:var(--cocoa)}
.pf .vrow .islot{color:var(--berry)}
.pf .compare{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:22px}
.pf .compare > div{border-radius:22px;padding:22px;display:flex;flex-direction:column;gap:10px}
.pf .compare .a{background:var(--blush)}
.pf .compare .a .islot{color:var(--berry)}
.pf .compare .b{background:var(--plum);color:var(--cream)}
.pf .compare .b .islot{color:var(--pop)}
.pf .final-card{background:var(--cream);border-radius:32px;padding:clamp(26px,4vw,44px);display:flex;flex-direction:column;gap:14px;max-width:640px;margin:0 auto}
.pf .final-card .ticks.lt li{background:#fff}
@media (max-width:980px){.pf .course,.pf .three{grid-template-columns:minmax(0,1fr)}.pf .covers{margin:0 auto;max-width:420px;aspect-ratio:5/6}.pf .covers .cover{width:80%}}
@media (max-width:700px){.pf .compare{grid-template-columns:minmax(0,1fr)}.pf .vrow{grid-template-columns:minmax(0,1fr)}}
</style>'''

o = [CSS, EXTRA, EXTRA2, '<main id="main" class="pf">']
names = {}

# 07 parse courses first (names + categories used in the hero)
s7 = section(7)
starts = [i for i, l in enumerate(s7) if l.startswith("COURSE 0")]
course_html = []
for k, a in enumerate(starts):
    b = starts[k + 1] if k + 1 < len(starts) else len(s7)
    blk = s7[a:b]
    num, cat, name, hook = blk[0], blk[1], blk[2], blk[3]
    names[k] = (name, cat)
    ti = blk.index("The transformation:")
    body, trans = blk[4:ti], blk[ti + 1]
    assert blk[ti + 2].startswith("INDIVIDUAL COURSE PRICE") and blk[ti + 3] == "INCLUDED WITH ALL ACCESS"
    key, bg, fg = COURSES[k]
    course_html.append(f'''<article class="course rv" id="course-{key}"><div class="stack" style="gap:16px">{cover(name, cat, bg, fg)}
<div class="pricebar"><span>Individual course price {inline_slot("price")}</span><span class="inc">Included with All Access</span></div></div>
<div class="stack" style="gap:14px"><span class="num">{e(num)} &middot; {e(cat)}</span><h3>{e(name)}</h3><p class="hook">{e(hook)}</p>{flow(body)}
{btn("See the full course", "/interactive-course-creator/", "ol") if key == "interactive" else ""}
<div class="outc" style="padding:18px 20px;border-radius:18px;background:#A23E66;color:#fff;font:400 20px/1.35 var(--font-display)"><b style="display:block;font:500 11px/1.3 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:#F6C9D8;margin-bottom:6px;font-weight:500">The transformation</b>{e(trans)}</div></div></article>''')

# 01 HERO
s = section(1)
chips = [x.strip().rstrip(".") for x in s[6].split(". ") if x.strip()]
o.append(f'''<section class="hero dk" style="background:#3A1C2A"><div class="in hero-grid">
<div class="stack" style="gap:22px"><p class="lbl">{e(s[0])}</p><h1>{headline(s[1])}</h1>
{P(s[2])}<p class="big">{e(s[3])}</p>{P(s[4])}
<div class="row">{cta(s[5][1:-1], "cr")}</div>
<p class="tagrow">{"".join(f"<span>{e(c)}</span>" for c in chips)}</p></div>
<div class="covers" aria-hidden="true">{"".join(cover(names[k][0], names[k][1], COURSES[k][1], COURSES[k][2]) for k in range(3))}</div>
</div></section>''')

# 02 PROBLEM
s = section(2)
bi = next(i for i, l in enumerate(s) if l.startswith("* ")); bj = max(i for i, l in enumerate(s) if l.startswith("* "))
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:bi])}</div>
<div class="thoughts">{"".join(f"<p>{e(x[2:])}</p>" for x in s[bi:bj + 1])}</div>
<div class="nar stack">{flow(s[bj + 1:])}</div></div></section>''')

o.append(std(3, "#FFFFFF"))
o.append(std(4, "#F6E1E8"))
o.append(std(5, "#3A1C2A", "center", True))

# 06 OFFER
s = section(6)
o.append(f'''<section style="background:#FBF5EE"><div class="nar stack ctr-h">
<p class="lbl">{e(s[0])}</p><h2 style="font-size:clamp(48px,7vw,92px)">The BOSS Academy <em>All Access</em></h2>
<p class="big" style="text-align:center">{e(s[2])}</p>{flow(s[3:], "br")}</div></section>''')
assert s[1] == "The BOSS Academy All Access"

o.append(f'''<section id="courses" style="background:#F6E1E8;scroll-margin-top:80px"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s7[0])}</h2>{flow(s7[1:starts[0]])}</div>
<div class="courses">{"".join(course_html)}</div></div></section>''')

# 08 CONNECTING
s = section(8)
ti = s.index("Think differently.")
trio = s[ti:ti + 6]
rest = s[ti + 6:]
styles = [("#3A1C2A", "#FBF5EE", "#F6C9D8"), ("#A23E66", "#FFFFFF", "#3A1C2A"), ("#FFFFFF", "#3A1C2A", "#A23E66")]
cards = "".join(f'<article style="background:{bg};color:{fg}"><h3 style="color:{hc}">{e(t)}</h3><p>{e(d)}</p></article>' for (t, d), (bg, fg, hc) in zip(zip(trio[::2], trio[1::2]), styles))
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:ti])}</div>
<div class="three">{cards}</div>
<div class="nar stack">{flow(rest, "br")}</div></div></section>''')

# 09 FUTURE
s = section(9)
pi = s.index("Future areas of education may include:")
pe = next(i for i, l in enumerate(s) if l.startswith("These subjects represent"))
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:pi + 1])}</div>
{pairs(s[pi + 1:pe])}
<div class="nar stack">{flow(s[pe:])}</div></div></section>''')

o.append(std(10, "#FFFFFF"))

# 11 HOW IT WORKS
s = section(11)
si = next(i for i, l in enumerate(s) if l.startswith("01. "))
st = s[si:si + 8]
steps = "".join(f'<article class="step rv"><span class="n">{e(st[k][:2])}</span><h3>{e(st[k][4:])}</h3><p>{e(st[k + 1])}</p></article>' for k in range(0, 8, 2))
o.append(f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:si])}</div>
<div class="steps steps4">{steps}</div>
<div class="nar stack">{flow(s[si + 8:])}</div></div></section>''')

# 12 SOCIAL PROOF
s = section(12)
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:24px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2></div>
<div class="pairs">{flow(s[1:])}</div></div></section>''')

o.append(std(13, "#FBF5EE"))

# 14 VALUE STACK
s = section(14)
rows = []
i = 2
while i < len(s) and not s[i].startswith("PURCHASE THE COURSES"):
    t, d = s[i], s[i + 1]
    if i + 2 < len(s) and s[i + 2].startswith("Individual price"):
        rows.append(f'<div class="vrow"><div><h3>{e(t)}</h3><p>{e(d)}</p></div>{inline_slot("individual price")}</div>'); i += 3
    elif d.startswith("["):
        rows.append(f'<div class="vrow"><div><h3>{e(t)}</h3><p>{inline_slot(d[8:-1] if d.startswith("[Insert") else d[1:-1])}</p></div><span class="tiny">Included</span></div>'); i += 2
    else:
        rows.append(f'<div class="vrow"><div><h3>{e(t)}</h3><p>{e(d)}</p></div><span class="tiny">Included</span></div>'); i += 2
k = s.index("PURCHASE THE COURSES INDIVIDUALLY")
tail = s[k + 4:]
o.append(f'''<section id="unlock" style="background:#F6E1E8;scroll-margin-top:80px"><div class="in stack" style="gap:24px;max-width:900px">
<div class="stack ctr-h"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2></div>
<div class="stack-v">{"".join(rows)}
<div class="compare"><div class="a"><p class="tiny">{e(s[k])}</p>{inline_slot("combined individual course price")}</div>
<div class="b"><p class="tiny" style="color:#F6C9D8">{e(s[k + 2])}</p>{inline_slot("All Access investment")}</div></div>
<div class="stack" style="margin-top:20px;align-items:center;text-align:center">{flow([l for l in tail])}</div></div>
{"" if CHECKOUT else slot("Your All Access checkout link. Until you send it, every Unlock button scrolls to this price box.")}
</div></section>''')
assert s[k + 1].startswith("[") and s[k + 3].startswith("[")

o.append(std(15, "#FBF5EE", "center", cta_cls="br"))

# 16 EDUCATOR
s = section(16)
o.append(f'''<section style="background:#FFFFFF"><div class="in twocol">
<div class="stack sticky"><span class="shot" style="border-radius:999px 999px 26px 26px;border:10px solid #FBF5EE;max-width:420px"><img src="/images/photos/desk-mic-smile.jpg" alt="Genasys smiling at her desk" loading="lazy" style="aspect-ratio:3/4;object-fit:cover"></span></div>
<div class="stack"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{flow(s[2:])}</div></div></section>''')

# 17 WHO FOR
s = section(17)
fi = next(i for i, l in enumerate(s) if l.startswith("* ")); fe = next(i for i in range(fi, len(s)) if not s[i].startswith("* "))
ni = next(i for i, l in enumerate(s) if l.startswith("All Access may not be"))
ne = next(i for i in range(ni + 1, len(s)) if not s[i].startswith("* "))
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:fi])}</div>
<div class="fornot"><div style="background:#FFFFFF"><p class="lbl">All Access is for you if</p><ul class="ticks lt">{"".join(f"<li>{e(x[2:])}</li>" for x in s[fi:fe])}</ul></div>
<div style="background:#F6E1E8"><p class="lbl">It may not be the right choice if</p><ul class="ticks lt no">{"".join(f"<li>{e(x[2:])}</li>" for x in s[ni + 1:ne])}</ul></div></div>
<div class="nar stack">{flow(s[fe:ni])}{flow(s[ne:])}<div class="row">{btn("The Blogging Ladies Membership", "/membership/", "ol")}{btn("The BOSS Business Experience", COACH, "ol")}</div></div></div></section>''')

# 18 FAQ
s = section(18)
qs, cur = [], None
for l in s[1:]:
    if l.endswith("?") and len(l) < 110: cur = [l, []]; qs.append(cur)
    elif cur: cur[1].append(l)
def ans(lines):
    return [f'<span class="islot" style="color:#A23E66">To fill in: {e(l[8:-1])}</span>' if l.startswith("[Insert") else e(l) for l in lines]
o.append(f'''<section style="background:#FFFFFF"><div class="nar stack" style="gap:26px">
<div class="stack" style="text-align:center;gap:14px"><p class="lbl">Frequently asked questions</p><h2>{headline(s[0])}</h2></div>
<div class="faq">{"".join(faq(q, ans(a)) for q, a in qs)}</div></div></section>''')

# 19 FINAL
s = section(19)
ci = s.index("THE COMPLETE EDUCATIONAL COLLECTION")
inc = s[ci + 2:ci + 6]
after = s[ci + 6:]
assert after[0].startswith("[Confirmed") and after[1] == "[All Access Price]" and after[2].startswith("[Unlock")
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="in stack" style="gap:34px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:ci])}</div>
<div class="final-card"><p class="lbl" style="color:#A23E66">{e(s[ci])}</p><h3 style="font-size:clamp(34px,4vw,48px);color:#3A1C2A">{e(s[ci + 1])}</h3>
<ul class="ticks lt">{"".join(f"<li>{e(x)}</li>" for x in inc)}</ul>
{slot("Confirmed future course access terms.", "sm")}{slot("All Access price.", "sm")}
<div class="row">{cta(after[2][1:-1], "br")}</div></div>
<div class="nar stack" style="text-align:center;align-items:center">{"".join(f'<p class="big">{e(x)}</p>' for x in after[3:5])}
<p class="body">{e(after[5])}</p><div class="row">{cta(after[6][1:-1], "olw")}</div></div></div></section>''')

o.append("</main>")
out = "\n".join(o)
for bad in ["—", "–", "…"]: assert bad not in out, bad
assert "six figure" not in out.lower()
(ROOT / "all-access.html").write_text(out)
print("wrote all-access.html", len(out))
