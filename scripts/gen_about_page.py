"""Builds site/_pages/about.html from Genasys's copy in scripts/copy/about.txt.
Run: python3 scripts/gen_about_page.py"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from folio_data import PROJECTS, IMG, VIDEO_JS, video_cards
from pf_parts import *

YT = "https://www.youtube.com/@GenasysLynn"
IG = "https://www.instagram.com/blogcoach_gen"
SRC = Path(__file__).parent / "copy/about.txt"
# brand rule: never "six figure"
L, section = load_copy(SRC, [("I built a multi six figure brand", "I built a money making brand"),
                             ("grew into a multi six figure brand", "grew into a money making brand")])

LINKS = {"Discover How We Can Work Together": "#work", "Explore My Private Blog Coaching Services": COACH,
         "Explore The BOSS Business Experience": COACH, "Explore My Client Portfolio": "/portfolio/",
         "Explore the Membership": "/membership/", "Shop The BOSS Academy": "/academy/", "Save My Free Seat": "/futureproof-webinar/",
         "Read the Blog": "/blog/", "Listen to the Podcast": "/podcast/", "Watch on YouTube": YT,
         "Find Me on Instagram": IG, "Let's Build Your Business Together": COACH}
def cta(label, cls=""):
    href = LINKS[label]
    return btn(label, href, cls, href.startswith("http"))
_flow = flow
def flow(lines, cta_cls=""): return _flow(lines, cta_cls, cta)

def photo(src, alt, pos="center"):
    return (f'<span class="shot arch-ph"><img src="/images/photos/{src}" alt="{e(alt)}" loading="lazy" '
            f'style="aspect-ratio:3/4;object-fit:cover;object-position:{pos}"></span>')

EXTRA2 = r'''<style>
.pf .arch-ph{border-radius:999px 999px 26px 26px;border:10px solid #fff;max-width:440px;width:100%}
.pf .beliefs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.pf .belief{padding:26px;border-radius:26px;background:rgba(251,245,238,.07);display:flex;flex-direction:column;gap:10px}
.pf .belief .n{font:400 italic 44px/.9 var(--font-display);color:var(--pop)}
.pf .belief h3{font-size:clamp(24px,2.4vw,30px);line-height:1.15;color:var(--cream)}
.pf .belief p{font:400 16px/1.65 var(--font-body);color:#F1DDE2}
.pf .belief:last-child:nth-child(odd){grid-column:1 / -1}
.pf .offers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.pf .offer{border-radius:30px;padding:30px 26px;display:flex;flex-direction:column;gap:12px;background:#fff}
.pf .offer:nth-child(1){background:var(--plum)}.pf .offer:nth-child(2){background:var(--berry)}
.pf .offer .k{font:500 12px/1.5 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:var(--berry)}
.pf .offer:nth-child(-n+2) .k{color:var(--pop)}
.pf .offer h3{font:400 italic clamp(30px,3vw,38px)/1.05 var(--font-display);color:var(--plum)}
.pf .offer:nth-child(-n+2) h3{color:#fff}
.pf .offer p{font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.pf .offer:nth-child(-n+2) p{color:#F6E1E8}
.pf .offer .pf-btn{margin-top:auto;align-self:flex-start}
.pf .chan{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.pf .chan article{border-radius:24px;padding:24px;background:#fff;display:flex;flex-direction:column;gap:10px}
.pf .chan h3{font-size:25px;line-height:1.15}
.pf .chan p{font:400 15.5px/1.6 var(--font-body);color:var(--cocoa)}
.pf .chan .pf-btn{margin-top:auto;align-self:flex-start;font-size:14.5px}
.pf .sig{font:700 clamp(54px,7vw,84px)/1 var(--font-script);color:var(--berry);transform:rotate(-3deg);display:inline-block}
@media (max-width:1100px){.pf .chan{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:980px){.pf .offers{grid-template-columns:minmax(0,1fr)}.pf .arch-ph{margin:0 auto;max-width:360px}}
@media (max-width:700px){.pf .beliefs,.pf .chan{grid-template-columns:minmax(0,1fr)}}
</style>'''

o = [CSS, EXTRA, EXTRA2, '<main id="main" class="pf">']

# 01 HERO
s = section(1)
o.append(f'''<section class="hero"><div class="in hero-grid">
<div class="stack" style="gap:22px"><p class="lbl">{e(s[0])}</p><h1 style="font-size:clamp(42px,5.6vw,80px)">{headline(s[1])}</h1>
<p class="big">{e(s[2])}</p>{flow(s[3:])}</div>
<div>{photo("hat-laugh.jpg", "Genasys laughing in her pink hat", "50% 20%")}</div></div></section>''')

# 02 STORY
s = section(2)
o.append(f'''<section style="background:#FFFFFF"><div class="in twocol">
<div class="stack sticky">{photo("desk-writing.jpg", "Genasys writing at her desk")}</div>
<div class="stack"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{flow(s[2:])}</div></div></section>''')

def split(n, bg, dark=False):
    lbl, h, rest = head(section(n))
    lb = f'<p class="lbl">{e(lbl)}</p>' if lbl else ""
    dk = ' class="dk"' if dark else ""
    return (f'<section{dk} style="background:{bg}"><div class="in twocol"><div class="stack sticky">{lb}<h2>{headline(h)}</h2></div>'
            f'<div class="stack">{flow(rest)}</div></div></section>')
o.append(split(3, "#F6E1E8"))
o.append(split(4, "#FBF5EE"))

# 05 PHILOSOPHY
s = section(5)
idx = [i for i, l in enumerate(s) if len(l) > 3 and l[:2].isdigit() and l[2:4] == ". "]
cards = []
for k, a in enumerate(idx):
    b = idx[k + 1] if k + 1 < len(idx) else len(s)
    cards.append(f'<article class="belief rv"><span class="n">{e(s[a][:2])}</span><h3>{e(s[a][4:])}</h3>{"".join(f"<p>{e(x)}</p>" for x in s[a + 1:b])}</article>')
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2></div>
<div class="beliefs">{"".join(cards)}</div></div></section>''')

# 06 DIFFERENT
s = section(6)
pi = s.index("Business Strategy")
pe = next(i for i, l in enumerate(s) if l.startswith("These are not separate"))
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:pi])}</div>
{pairs(s[pi:pe])}<div class="nar stack">{flow(s[pe:], "br")}</div></div></section>''')
assert s[0].startswith("I don't just teach")

# 07 WOMEN: real mockups + video testimonials in place of the image slots
s = section(7)
cut = next(i for i, l in enumerate(s) if l.startswith("[Insert"))
fol = "".join(f'<a class="proj-img" href="/client-project/?project={k}"><img src="{IMG}{k}-mockup.jpg" alt="{e(n)} website on a laptop and phone" loading="lazy" width="1600" height="1100"></a>' for k, n, *_ in PROJECTS[:3])
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:cut])}</div>
<div class="gal-d gal3">{fol}</div>
{video_cards()}
{slot("Documented client transformations and case studies.")}
<div class="row" style="justify-content:center">{cta("Explore My Client Portfolio", "ol")}</div></div></section>''')

# 08 EXPLORING
s = section(8)
o.append(f'''<section style="background:#F6E1E8"><div class="in twocol">
<div class="stack sticky"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{photo("desk-typing.jpg", "Genasys typing on her laptop")}</div>
<div class="stack">{flow(s[2:])}</div></div></section>''')

# 09 HUMAN
s = section(9)
o.append(f'''<section style="background:#FBF5EE"><div class="in twocol">
<div class="stack sticky"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{photo("plants-portrait.jpg", "Genasys at home with her plants")}</div>
<div class="stack">{flow(s[2:])}</div></div></section>''')

# 10 GET TO KNOW ME
s = section(10)
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">{e(s[0])}</p><h2>Get to know <em>me.</em></h2></div>
{pairs(s[1:])}</div></section>''')

# 11 WORK TOGETHER
s = section(11)
starts = [i for i, l in enumerate(s) if l in ("The BOSS Business Experience", "The Blogging Ladies Membership", "The BOSS Academy")]
offers = []
for k, a in enumerate(starts):
    b = starts[k + 1] if k + 1 < len(starts) else len(s)
    blk = s[a:b]
    name, kick, body, button = blk[0], blk[1], blk[2:-1], blk[-1][1:-1]
    cls = "cr" if k < 2 else ""
    offers.append(f'<article class="offer"><p class="k">{e(kick)} &middot; {e(name)}</p><h3>{e(kick.capitalize())}.</h3>'
                  f'{"".join(f"<p>{e(x)}</p>" for x in body)}{cta(button, cls)}</article>')
o.append(f'''<section id="work" style="background:#FFFFFF;scroll-margin-top:80px"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:starts[0]])}</div>
<div class="offers">{"".join(offers)}</div></div></section>''')

# 12 WEBINAR
s = section(12)
o.append(f'''<section style="background:#FBF5EE"><div class="in"><div class="mini dk">
<div class="stack"><p class="lbl">{e(s[0])}</p><h2>Futureproof <em>Your Blog</em></h2><p class="big">{e(s[2])}</p>{flow(s[3:-1])}</div>
<div class="stack" style="align-items:flex-start"><span class="chips"><span style="background:#A23E66">Free webinar</span></span>{cta(s[-1][1:-1], "cr")}</div>
</div></div></section>''')
assert s[1] == "Futureproof Your Blog"

# 13 STAY CONNECTED
s = section(13)
items = s[2:]
ch = "".join(f'<article><h3>{e(items[k])}</h3><p>{e(items[k + 1])}</p>{cta(items[k + 2][1:-1], "ol")}</article>' for k in range(0, len(items), 3))
o.append(f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:28px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{P(s[1])}</div><div class="chan">{ch}</div></div></section>''')

# 14 FINAL
s = section(14)
wi = s.index("With love,")
o.append(f'''<section style="background:#FBF5EE"><div class="nar stack ctr-h">
<p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{flow(s[2:wi], "br")}
<div class="stack" style="gap:4px;margin-top:10px"><p class="body">{e(s[wi])}</p><span class="sig">{e(s[wi + 1])}</span><p class="lbl" style="text-align:left">{e(s[wi + 2])}</p></div>
</div></section>''')

o.append(VIDEO_JS + "\n</main>")
out = "\n".join(o)
for bad in ["—", "–", "…"]: assert bad not in out, bad
assert "six figure" not in out.lower()
(ROOT / "about.html").write_text(out)
print("wrote about.html", len(out))
