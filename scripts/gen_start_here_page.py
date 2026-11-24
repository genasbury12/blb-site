"""Builds site/_pages/start-here.html from Genasys's copy in scripts/copy/start-here.txt.
Section 03 ("Which of these sounds most like you right now?") is the business finder: six starting points,
each opening its recommendation. Run: python3 scripts/gen_start_here_page.py"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from folio_data import PROJECTS, IMG
from pf_parts import *

YT = "https://www.youtube.com/@GenasysLynn"
SRC = Path(__file__).parent / "copy/start-here.txt"
# brand rules: never "six figure", no ellipses
L, section = load_copy(SRC, [("I built a multi six figure brand", "I built a money making brand"),
                             ("BEFORE WE GO ANY FURTHER...", "BEFORE WE GO ANY FURTHER")])

LINKS = {
    "Find My Next Step": "#start",
    "Explore Blogging Ladies": "/membership/", "Join Blogging Ladies": "/membership/",
    "Explore Private Coaching & Design": COACH, "Explore The BOSS Business Experience": COACH,
    "Explore the Fast Track Call": APPLY_PAGE, "Apply for a Complimentary Fast Track Call": APPLY_PAGE,
    "Apply for My Personalized Fast Track Call": APPLY_PAGE,
    "Discover The Futureproof Blogger": "/futureproof-blogger/",
    "Watch My Free Futureproof Your Blog Masterclass": "/futureproof-webinar/",
    "Save My Free Seat": "/futureproof-webinar/", "Start With the Free Masterclass": "/futureproof-webinar/",
    "Explore The Productive Blogger Method": "/academy/#course-pbm",
    "Enter The Interactive Lab": "/interactive-course-creator/",
    "Shop The BOSS Academy": "/academy/", "Explore All Access": "/all-access/", "Discover Academy All Access": "/all-access/",
    "Explore My Client Portfolio": "/portfolio/", "Get to Know Me": "/about/",
    "Explore the Blog": "/blog/", "Listen to the Podcast": "/podcast/", "Watch on YouTube": YT,
}
def cta(label, cls="", href=None):
    href = href or LINKS[label]
    return btn(label, href, cls, href.startswith("http"))
def b(l): return l[1:-1] if l.startswith("[") and l.endswith("]") else None

EXTRA2 = r'''<style>
.pf .arch-ph{border-radius:999px 999px 26px 26px;border:10px solid #fff;max-width:440px;width:100%}
.pf .maybes{display:grid;gap:10px}
.pf .maybes p{padding:15px 18px 15px 48px;border-radius:16px;background:#fff;font:400 16.5px/1.55 var(--font-body);color:var(--plum);position:relative}
.pf .maybes p::before{content:"";position:absolute;left:18px;top:21px;width:14px;height:14px;border-radius:50%;background:var(--berry);box-shadow:0 0 0 4px var(--blush)}
.pf .notbiz{font:400 clamp(46px,7vw,104px)/.95 var(--font-display);letter-spacing:-.03em;color:var(--cream);margin:0}
.pf .notbiz em{color:var(--pop)}
.pf .chips.lt span{background:rgba(251,245,238,.1);color:var(--cream);border:1px solid rgba(233,185,202,.35);font-size:18px}
/* finder */
.pf .pick{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.pf .pick button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:10px;padding:20px 22px;border-radius:22px;background:#fff;border:2px solid transparent;transition:transform .2s ease,border-color .2s ease}
.pf .pick button .n{font:400 italic 40px/.9 var(--font-display);color:var(--berry)}
.pf .pick button .t{font:400 clamp(20px,1.9vw,24px)/1.2 var(--font-display);color:var(--plum)}
.pf .pick button[aria-selected="true"]{background:var(--plum);border-color:var(--plum)}
.pf .pick button[aria-selected="true"] .n{color:var(--pop)}
.pf .pick button[aria-selected="true"] .t{color:var(--cream)}
.pf .pick button:focus-visible{outline:3px solid var(--berry);outline-offset:3px}
@media (hover:hover){.pf .pick button:hover{transform:translateY(-2px);border-color:var(--berry)}}
.pf .rec{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(22px,3vw,40px);padding:clamp(24px,4vw,44px);border-radius:32px;background:#fff;scroll-margin-top:90px}
.pf .rec + .rec{margin-top:16px}
.pf .rec .q{font:400 italic clamp(22px,2.4vw,29px)/1.3 var(--font-display);color:var(--plum)}
.pf .rec .q::before{content:"\201C";color:var(--berry)}.pf .rec .q::after{content:"\201D";color:var(--berry)}
.pf .rec .who{font:500 11.5px/1.4 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:var(--berry)}
.pf .rec .card{background:var(--plum);border-radius:24px;padding:clamp(22px,3vw,32px);display:flex;flex-direction:column;gap:12px;align-self:start}
.pf .rec .card .k{font:500 11.5px/1.4 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:var(--pop)}
.pf .rec .card h3{font:400 italic clamp(30px,3vw,40px)/1.02 var(--font-display);color:var(--cream)}
.pf .rec .card p{font:400 16px/1.6 var(--font-body);color:#F1DDE2}
.pf .rec .card .alt{margin-top:8px;padding-top:16px;border-top:1px solid rgba(233,185,202,.3);display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.pf .rec .card .alt p{font:400 19px/1.3 var(--font-display);color:var(--cream)}
/* three ways */
.pf .offers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.pf .offer{border-radius:30px;padding:30px 26px;display:flex;flex-direction:column;gap:12px;background:#fff}
.pf .offer:nth-child(1){background:var(--plum)}.pf .offer:nth-child(2){background:var(--berry)}
.pf .offer .k{font:500 12px/1.5 var(--font-label);letter-spacing:.18em;text-transform:uppercase;color:var(--berry)}
.pf .offer h3{font:400 italic clamp(30px,3vw,38px)/1.05 var(--font-display);color:var(--plum)}
.pf .offer .sub{font:600 14.5px/1.45 var(--font-body);color:var(--mauve)}
.pf .offer p{font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.pf .offer .best{padding:14px 16px;border-radius:16px;background:var(--blush);font:500 15px/1.5 var(--font-body);color:var(--plum)}
.pf .offer .best b{display:block;font:500 11px/1.3 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:var(--berry);margin-bottom:4px;font-weight:500}
.pf .offer .amt{font:400 44px/1 var(--font-display);color:var(--plum)}
.pf .offer:nth-child(-n+2) .k{color:var(--pop)}
.pf .offer:nth-child(-n+2) h3,.pf .offer:nth-child(-n+2) .amt{color:#fff}
.pf .offer:nth-child(-n+2) .sub{color:var(--pop)}
.pf .offer:nth-child(-n+2) p{color:#F6E1E8}
.pf .offer:nth-child(-n+2) .best{background:rgba(255,255,255,.1);color:#fff}
.pf .offer:nth-child(-n+2) .best b{color:var(--pop)}
.pf .offer .btns{margin-top:auto;display:flex;flex-direction:column;gap:10px;align-items:flex-start;padding-top:6px}
/* compare */
.pf .cmp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.pf .cmp article{border-radius:26px;background:#fff;padding:26px;display:flex;flex-direction:column;gap:14px}
.pf .cmp article:first-child{outline:2px solid var(--berry);outline-offset:-2px}
.pf .cmp h3{font-size:clamp(26px,2.5vw,32px);line-height:1.08}
.pf .cmp .ticks.lt li{background:var(--cream);font-size:15px;padding:11px 14px 11px 46px}
.pf .cmp .ticks.lt li::before{top:12px}
.pf .cmp .inv{margin-top:auto;padding:14px 16px;border-radius:16px;background:var(--plum);color:var(--cream);font:400 20px/1.3 var(--font-display)}
/* academy */
.pf .crs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.pf .crs article{border-radius:28px;background:#fff;padding:22px;display:flex;flex-direction:column;gap:14px}
.pf .cv{aspect-ratio:4/3;border-radius:8px 18px 18px 8px;padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:-8px 0 0 rgba(0,0,0,.16) inset,0 24px 44px -30px rgba(58,28,42,.8)}
.pf .cv small{font:500 10.5px/1.4 var(--font-label);letter-spacing:.16em;text-transform:uppercase}
.pf .cv b{font:400 clamp(28px,2.6vw,36px)/1 var(--font-display);font-weight:400}
.pf .crs .tag{font:500 12px/1.5 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:var(--berry)}
.pf .crs p{font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.pf .crs .stat{padding:12px 14px;border-radius:14px;background:var(--blush);font:600 14.5px/1.5 var(--font-body);color:var(--plum)}
.pf .crs .end{font:400 italic 21px/1.3 var(--font-display);color:var(--plum)}
.pf .crs .pf-btn{margin-top:auto;align-self:flex-start}
.pf .aa{margin-top:18px;border-radius:30px;background:var(--berry);padding:clamp(26px,4vw,44px);display:grid;grid-template-columns:minmax(0,1.3fr) auto;gap:24px;align-items:center}
.pf .aa h3{font:400 italic clamp(30px,3.4vw,44px)/1.05 var(--font-display);color:#fff}
.pf .aa p{font:400 17px/1.6 var(--font-body);color:#FBE3EA}
/* free content */
.pf .chan{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.pf .chan article{border-radius:24px;padding:24px;background:#fff;display:flex;flex-direction:column;gap:10px}
.pf .chan h3{font-size:25px;line-height:1.15}
.pf .chan p{font:400 15.5px/1.6 var(--font-body);color:var(--cocoa)}
.pf .chan .pf-btn,.pf .chan .pf-slot{margin-top:auto;align-self:flex-start;font-size:14.5px}
.pf .sig{font:700 clamp(54px,7vw,84px)/1 var(--font-script);color:var(--berry);transform:rotate(-3deg);display:inline-block}
.pf .proj-name{margin-top:12px;font:400 24px/1.15 var(--font-display);color:var(--plum)}
.pf .proj-sub{font:500 14.5px/1.5 var(--font-body);color:var(--mauve)}
.pf .gal-d a{text-decoration:none}

@media (max-width:980px){.pf .chan,.pf .offers,.pf .cmp,.pf .crs,.pf .rec,.pf .aa{grid-template-columns:minmax(0,1fr)}.pf .pick{grid-template-columns:repeat(2,minmax(0,1fr))}.pf .arch-ph{margin:0 auto;max-width:360px}}
@media (max-width:700px){.pf .chan,.pf .pick{grid-template-columns:minmax(0,1fr)}.pf .pick button{flex-direction:row;align-items:center;gap:14px;padding:16px 18px}.pf .pick button .n{font-size:32px}}
</style>'''

def photo(src, alt, pos="center"):
    return (f'<span class="shot arch-ph"><img src="/images/photos/{src}" alt="{e(alt)}" loading="lazy" '
            f'style="aspect-ratio:3/4;object-fit:cover;object-position:{pos}"></span>')

o = [CSS, EXTRA, EXTRA2, '<main id="main" class="pf">']

# 01 HERO
s = section(1)
maybes = [l for l in s if l.startswith(("Maybe", "Or maybe"))]
after = s[2 + len(maybes):]
o.append(f'''<section class="hero"><div class="in hero-grid">
<div class="stack" style="gap:22px"><p class="lbl">{e(s[0])}</p><h1 style="font-size:clamp(42px,5.4vw,78px)">{headline(s[1])}</h1>
<div class="maybes">{"".join(f"<p>{e(m)}</p>" for m in maybes)}</div>
{P(after[0])}<p class="beat">{e(after[1])}</p><div class="row">{cta(b(after[2]), "br")}</div></div>
<div class="sticky" style="align-self:start">{photo("hat-laugh.jpg", "Genasys laughing in her pink hat", "50% 20%")}</div></div></section>''')
assert len(maybes) == 4 and len(after) == 3

# 02 FOUNDATION
s = section(2)
i_nb = s.index("Your blog is not your business.")
chips_line = next(l for l in s if l.startswith("What you sell."))
chips = [c.strip() + "." for c in chips_line.split(".") if c.strip()]
ci = s.index(chips_line)
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="in twocol">
<div class="stack sticky"><p class="lbl">{e(s[0])}</p>{P(s[1])}<h2 class="notbiz">Your blog is <em>not</em> your business.</h2></div>
<div class="stack"><p class="big">{e(s[i_nb + 1])}</p><p class="beat">{e(s[i_nb + 2])}</p>
<div class="chips lt">{"".join(f"<span>{e(c)}</span>" for c in chips)}</div>
{flow(s[ci + 1:])}</div></div></section>''')

# 03 FINDER
s = section(3)
starts = [i for i, l in enumerate(s) if len(l) > 4 and l[:2].isdigit() and l[2:4] == ". "]
tabs, panels = [], []
for k, a in enumerate(starts):
    z = starts[k + 1] if k + 1 < len(starts) else len(s)
    blk = s[a:z]
    num, title = blk[0][:2], blk[0][4:]
    quote = blk[1].strip('"')
    ri = next(i for i, l in enumerate(blk) if l.startswith("Your recommended starting point:"))
    diag = blk[2:ri]
    name = blk[ri].split(":", 1)[1].strip()
    rest = blk[ri + 1:]
    bi = next(i for i, l in enumerate(rest) if b(l))
    desc, main_btn, alt = rest[:bi], b(rest[bi]), rest[bi + 1:]
    alt_html = ""
    if alt:
        assert len(alt) == 2 and b(alt[1])
        alt_html = f'<div class="alt"><p>{e(alt[0])}</p>{cta(b(alt[1]), "olw")}</div>'
    sel = "true" if k == 0 else "false"
    tabs.append(f'<button type="button" role="tab" id="sp-t{k}" aria-controls="sp-p{k}" aria-selected="{sel}" tabindex="{0 if k == 0 else -1}">'
                f'<span class="n">{num}</span><span class="t">{e(title)}</span></button>')
    panels.append(f'''<div class="rec" role="tabpanel" id="sp-p{k}" aria-labelledby="sp-t{k}" tabindex="0">
<div class="stack"><p class="who">{num} &middot; {e(title)}</p><p class="q">{e(quote)}</p>{flow(diag)}</div>
<div class="card"><p class="k">Your recommended starting point</p><h3>{e(name)}</h3>{"".join(f"<p>{e(x)}</p>" for x in desc)}
<div class="row">{cta(main_btn, "cr")}</div>{alt_html}</div></div>''')
o.append(f'''<section id="start" style="background:#F6E1E8;scroll-margin-top:80px"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">Find your starting point</p><h2>Which of these sounds <em>most like you</em> right now?</h2></div>
<div class="pick" role="tablist" aria-label="Your starting point">{"".join(tabs)}</div>
<div class="recs">{"".join(panels)}</div></div></section>''')
assert s[0] == "Which of these sounds most like you right now?" and len(starts) == 6
FINDER_JS = r'''<script>
(function(){
  var list=document.querySelector('.pf .pick'); if(!list) return;
  var tabs=[].slice.call(list.querySelectorAll('[role="tab"]'));
  var panels=tabs.map(function(t){return document.getElementById(t.getAttribute('aria-controls'));});
  function show(i,focus,scroll){
    tabs.forEach(function(t,j){var on=j===i;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;panels[j].hidden=!on;});
    if(focus) tabs[i].focus();
    if(scroll && window.matchMedia('(max-width:980px)').matches) panels[i].scrollIntoView({behavior:'smooth',block:'start'});
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){show(i,false,true);});
    t.addEventListener('keydown',function(ev){
      var n=null;
      if(ev.key==='ArrowRight'||ev.key==='ArrowDown') n=(i+1)%tabs.length;
      if(ev.key==='ArrowLeft'||ev.key==='ArrowUp') n=(i-1+tabs.length)%tabs.length;
      if(ev.key==='Home') n=0; if(ev.key==='End') n=tabs.length-1;
      if(n!==null){ev.preventDefault();show(n,true,false);}
    });
  });
  show(0,false,false);
})();
</script>'''

# 04 RECOMMENDED FIRST STEP: the free masterclass
s = section(4)
wi = s.index("Futureproof Your Blog")
bl = [l for l in s if l.startswith("* ")]
li = s.index(bl[-1])
o.append(f'''<section style="background:#FBF5EE"><div class="in"><div class="mini dk" style="align-items:start">
<div class="stack"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{flow(s[2:wi])}
<span class="chips"><span style="background:#A23E66">Free masterclass</span></span>
<h3 style="font:400 italic clamp(34px,4vw,52px)/1 var(--font-display);color:#FBF5EE">Futureproof Your Blog</h3><p class="big">{e(s[wi + 1])}</p></div>
<div class="stack"><p class="lbl">{e(s[wi + 2])}</p>{flow(bl)}{flow(s[li + 1:-1])}<div class="row">{cta(b(s[-1]), "cr")}</div></div>
</div></div></section>''')

# 05 THREE WAYS
s = section(5)
kicks = ["BUILD IT WITH ME", "FOLLOW MY SYSTEM", "DEVELOP A SPECIFIC SKILL"]
ks = [s.index(k) for k in kicks]
offers = []
for n, a in enumerate(ks):
    z = ks[n + 1] if n + 1 < len(ks) else len(s)
    blk = s[a:z]
    kick, name, sub, body = blk[0], blk[1], blk[2], blk[3:]
    paras, best, amt, buttons = [], "", "", []
    for l in body:
        if b(l): buttons.append(b(l))
        elif l.startswith("Best for:"): best = l.split(":", 1)[1].strip()
        elif l.startswith("$"): amt = l
        else: paras.append(l)
    bcls = ["cr", "olw"] if n < 2 else ["", "ol"]
    offers.append(f'''<article class="offer rv"><p class="k">{e(kick)}</p><h3>{e(name)}</h3><p class="sub">{e(sub)}</p>
{"".join(f"<p>{e(x)}</p>" for x in paras)}<p class="best"><b>Best for</b>{e(best)}</p>{f'<p class="amt">{e(amt)}</p>' if amt else ""}
<div class="btns">{"".join(cta(x, bcls[j]) for j, x in enumerate(buttons))}</div></article>''')
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">The three ways to work with me</p><h2>Choose the level of support that <em>makes sense for you.</em></h2>{flow(s[1:ks[0]])}</div>
<div class="offers">{"".join(offers)}</div></div></section>''')
assert s[0].startswith("CHOOSE THE LEVEL")

# 06 COMPARE
s = section(6)
names = ["The BOSS Business Experience", "Blogging Ladies", "The BOSS Academy"]
ns = [s.index(x) for x in names]
end = s.index("There isn't one right choice for every woman.")
cols = []
for n, a in enumerate(ns):
    z = ns[n + 1] if n + 1 < len(ns) else end
    blk = s[a + 1:z]
    cols.append(f'<article class="rv"><h3>{e(s[a])}</h3><ul class="ticks lt">{"".join(f"<li>{e(x)}</li>" for x in blk[:-1])}</ul><p class="inv">{e(blk[-1])}</p></article>')
o.append(f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">Compare your options</p><h2>How much support do you want <em>while building your business?</em></h2></div>
<div class="cmp">{"".join(cols)}</div>
<div class="nar stack ctr-h" style="text-align:center"><p class="beat">{e(s[end])}</p>{P(s[end + 1])}</div></div></section>''')
assert s[0].startswith("How much support")

# 07 ACADEMY
s = section(7)
COV = {"The Futureproof Blogger": ("#A23E66", "#FFFFFF", "Business & the future of blogging", "/futureproof-blogger/"),
       "The Productive Blogger Method": ("#3A1C2A", "#FFFFFF", "AI & business productivity", "/academy/#course-pbm"),
       "The Interactive Course Creator": ("#E9B9CA", "#3A1C2A", "AI & digital products", "/interactive-course-creator/")}
cs = [s.index(k) for k in COV]
wa = s.index("Want access to the complete collection?")
cards = []
for n, a in enumerate(cs):
    z = cs[n + 1] if n + 1 < len(cs) else wa
    blk = s[a:z]
    name, tag, body, button = blk[0], blk[1], blk[2:-1], b(blk[-1])
    bg, fg, cat, href = COV[name]
    ps = "".join(f'<p class="stat">{e(x)}</p>' if x[0].isupper() and x.split()[0] in ("Seven",) else
                 (f'<p class="end">{e(x)}</p>' if x.startswith("Learn how to") and len(x) < 60 else f"<p>{e(x)}</p>") for x in body)
    cards.append(f'''<article class="rv"><div class="cv" style="background:{bg};color:{fg}"><small>The BOSS Academy</small><b>{e(name)}</b><small>{e(cat)}</small></div>
<p class="tag">{e(tag)}</p>{ps}{cta(button, "", href)}</article>''')
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">{e(s[0])}</p><h2>What do you want to <em>learn next?</em></h2></div>
<div class="crs">{"".join(cards)}</div>
<div class="aa"><div class="stack" style="gap:10px"><h3>{e(s[wa])}</h3><p>{e(s[wa + 1])}</p></div><div>{cta(b(s[wa + 2]), "cr")}</div></div>
</div></section>''')
assert s[1] == "What do you want to learn next?"

# 08 FAST TRACK
s = section(8)
bl = [l for l in s if l.startswith("* ")]
bi, li = s.index(bl[0]), s.index(bl[-1])
ai = next(i for i, l in enumerate(s) if b(l))
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="in twocol">
<div class="stack sticky"><p class="lbl">{e(s[0])}</p><p class="big" style="font-size:clamp(20px,2.2vw,26px)">Want me to personally look at your business?</p><h2>{headline(s[1])}</h2>{flow(s[2:bi - 1])}</div>
<div class="stack"><p class="beat">{e(s[bi - 1])}</p><ul class="ticks">{"".join(f"<li>{e(x[2:])}</li>" for x in bl)}</ul>{flow(s[li + 1:ai])}
<div class="row">{cta(b(s[ai]), "cr")}</div><p class="lbl" style="color:#F6C9D8">{e(s[ai + 1])}</p></div></div></section>''')
assert s[0].startswith("THE BLOG MONETIZATION")

# 09 CLIENT WORK
s = section(9)
cut = next(i for i, l in enumerate(s) if l.startswith("[Insert"))
fol = "".join(f'<a class="rv" href="/client-project/?project={k}"><span class="proj-img"><img src="{IMG}{k}-mockup.jpg" alt="{e(n)} website on a laptop and phone" loading="lazy" width="1600" height="1100"></span>'
              f'<p class="proj-name">{e(n)}</p><p class="proj-sub">{e(d)}</p></a>' for k, n, _, d, _ in PROJECTS[:3])
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{flow(s[2:cut])}</div>
<div class="gal-d gal3">{fol}</div>
<div class="row" style="justify-content:center">{cta(b(s[cut + 1]), "ol")}</div></div></section>''')

# 10 MEET GENASYS
s = section(10)
o.append(f'''<section style="background:#F6E1E8"><div class="in twocol">
<div class="stack sticky">{photo("desk-mic-smile.jpg", "Genasys smiling at her desk")}</div>
<div class="stack"><p class="lbl">Meet the woman behind it all</p><h2>Hi, I&rsquo;m <em>Genasys.</em></h2>{flow(s[1:-1])}<div class="row">{cta(b(s[-1]), "br")}</div></div></div></section>''')
assert s[0].startswith("HI, I'M")

# 11 FREE CONTENT
s = section(11)
items = s[2:]
ch = []
for k in range(0, len(items), 3):
    t, d, bt = items[k], items[k + 1], b(items[k + 2])
    if bt not in LINKS: continue  # no resources page yet: card left out until there is one
    ch.append(f'<article class="rv"><h3>{e(t)}</h3><p>{e(d)}</p>{cta(bt, "ol")}</article>')
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:28px">
<div class="nar stack ctr-h"><p class="lbl">{e(s[0])}</p><h2>Come learn <em>with me.</em></h2></div><div class="chan">{"".join(ch)}</div></div></section>''')
assert s[1] == "Come learn with me."

# 12 FAQ
s = section(12)
qs, cur = [], None
for l in s:
    if l.endswith("?") and len(l) < 110: cur = [l, []]; qs.append(cur)
    elif cur: cur[1].append(l)
o.append(f'''<section style="background:#FFFFFF"><div class="nar stack" style="gap:26px">
<div class="stack" style="text-align:center;gap:14px"><p class="lbl">Frequently asked questions</p><h2>Your questions, <em>answered.</em></h2></div>
<div class="faq">{"".join(faq(q, [e(x) for x in a]) for q, a in qs)}</div></div></section>''')
assert len(qs) == 8

# 13 FINAL
s = section(13)
li0 = s.index("Your website.")
li1 = s.index("The newest AI tools.")
wi = s.index("With love,")
btns = [b(l) for l in s[:wi] if b(l)]
o.append(f'''<section style="background:#F6E1E8"><div class="nar stack ctr-h">
<h2>{headline(s[0])}</h2>{P(s[1])}
<div class="chips" style="justify-content:center">{"".join(f"<span>{e(x)}</span>" for x in s[li0:li1 + 1])}</div>
{flow([l for l in s[li1 + 1:wi] if not b(l)])}
<div class="row" style="justify-content:center">{cta(btns[0], "br")}{cta(btns[1], "ol")}</div>
<div class="stack" style="gap:4px;margin-top:10px"><p class="body">{e(s[wi])}</p><span class="sig">{e(s[wi + 1])}</span><p class="lbl" style="text-align:left">{e(s[wi + 2])}</p></div>
</div></section>''')

o.append(FINDER_JS + "\n</main>")
out = "\n".join(o)
for bad in ["—", "–", "…", "..."]: assert bad not in out, bad
assert "six figure" not in out.lower()
(ROOT / "start-here.html").write_text(out)
print("wrote start-here.html", len(out))
