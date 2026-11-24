"""Builds site/_pages/apply.html: The Blog Monetization Fast Track Call application page (BLB brand),
from Genasys's copy in scripts/copy/fast-track-call.txt. The five Section 05 examples are anonymized format
examples drawn from the structure of her real Fast Track presentations: no client names, numbers or details.
Applications email her through FormSubmit (same service as the contact form).
Run: python3 scripts/gen_fast_track_page.py"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pf_parts import *
import proof

APPLY = "#apply"
TO = "https://formsubmit.co/ajax/hello@bossladybloggers.com"
L, section = load_copy(Path(__file__).parent / "copy/fast-track-call.txt",
                       [("I built a multi six figure brand", "I built a money making brand")])
def cta(label, cls=""):
    if label.startswith("Explore My Educational"): return btn(label, "/academy/", cls)
    return btn(label, APPLY, cls)
_flow = flow
def flow(lines, cta_cls=""): return _flow(lines, cta_cls, cta)
def split(n, bg, dark=False):
    lb, h, rest = head(section(n))
    lbx = f'<p class="lbl">{e(lb)}</p>' if lb else ""
    dk = ' class="dk"' if dark else ""
    return (f'<section{dk} style="background:{bg}"><div class="in twocol"><div class="stack sticky">{lbx}<h2>{headline(h)}</h2></div>'
            f'<div class="stack">{flow(rest)}</div></div></section>')

EX = r'''<style>
.pf .show{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;background:#F6E1E8;border-radius:30px;padding:clamp(14px,2vw,22px)}
.pf .show article{background:#fff;border-radius:22px;padding:22px;display:flex;flex-direction:column;gap:12px}
.pf .show h3{font-size:24px}
.pf .show .ico{width:26px;height:26px;fill:none;stroke:#A23E66;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.pf .show .bar{display:grid;gap:5px}.pf .show .bar span{font:500 13px/1 var(--font-body);color:var(--plum)}
.pf .show .bar i{display:block;height:8px;border-radius:99px;background:#F3E6EB}.pf .show .bar b{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#A23E66,#C46A8E)}
.pf .show .eco{display:flex;flex-direction:column;align-items:stretch;gap:4px;text-align:center}
.pf .show .eco span{padding:9px;border-radius:10px;background:#FBF5EE;font:500 13.5px/1 var(--font-body);color:var(--plum)}
.pf .show .eco .l2{background:#F6E1E8}.pf .show .eco .l3{background:#E9B9CA}.pf .show .eco .l4{background:#3A1C2A;color:#FBF5EE}
.pf .show .eco em{font-style:normal;color:#A23E66;font-size:13px;line-height:1}
.pf .show .wt{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pf .show .wt > div{display:flex;flex-direction:column;gap:8px}
.pf .show .wt small{font:500 12px/1 var(--font-body);color:var(--mauve)}
.pf .show .wfa{aspect-ratio:4/5;border:1.5px solid #E9B9CA;border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:6px;background:#FFFCFA}
.pf .show .wfa i{display:block;border-radius:5px}.pf .show .wfa .t{height:10px;background:#E9D6DD}
.pf .show .g9{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.pf .show .g9 i{background:#F1DDE5}
.pf .show .hb{flex:1.2;background:#3A1C2A;border-radius:6px;padding:10px;display:flex;flex-direction:column;gap:5px;justify-content:center}
.pf .show .hb i{height:7px;width:70%;background:#FBF5EE}.pf .show .hb i.s{width:50%;background:#E9B9CA}.pf .show .hb i.s2{width:38%;height:10px;border-radius:99px;background:#A23E66}
.pf .show .band{height:22px;background:#E9B9CA}.pf .show .g2{flex:.8;display:grid;grid-template-columns:1fr 1fr;gap:5px}.pf .show .g2 i{background:#F6E1E8}
.pf .show .rd{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.pf .show .rd li{display:flex;align-items:center;gap:12px;font:500 15px/1.3 var(--font-body);color:var(--plum)}
.pf .show .rd span{flex:none;width:28px;height:28px;border-radius:50%;background:#F6E1E8;display:grid;place-items:center;font:500 12px/1 var(--font-label);color:#A23E66}
@media (max-width:800px){.pf .show{grid-template-columns:minmax(0,1fr)}}
.pf .areas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.pf .area{background:#fff;border-radius:22px;padding:24px;display:flex;flex-direction:column;gap:8px}
.pf .area .n{font:400 italic 34px/1 var(--font-display);color:var(--berry)}
.pf .area h3{font-size:25px;line-height:1.15}
.pf .area p{margin:0;font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.pf .area p.q{font:400 italic 19px/1.4 var(--font-display);color:var(--plum)}
.pf .exgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.pf .ex{background:#fff;border-radius:24px;padding:22px;display:flex;flex-direction:column;gap:12px;box-shadow:0 22px 44px -36px rgba(58,28,42,.6)}
.pf .ex.wide{grid-column:1 / -1}
.pf .ex .tagx{align-self:flex-start;font:500 10.5px/1 var(--font-label);letter-spacing:.16em;text-transform:uppercase;padding:7px 11px;border-radius:999px;background:var(--blush);color:var(--plum)}
.pf .ex h3{font-size:24px}
.pf .leak{background:var(--plum);border-radius:16px;padding:16px;display:grid;gap:10px;color:var(--cream)}
.pf .leak b{font:400 22px/1.2 var(--font-display);font-weight:400}
.pf .leak .vs2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pf .leak .vs2 div{border-radius:12px;padding:10px 12px;font:400 14px/1.45 var(--font-body)}
.pf .leak .w{background:rgba(155,44,44,.3)}.pf .leak .r{background:rgba(63,125,90,.35)}
.pf .leak .vs2 span{display:block;font:500 10px/1 var(--font-label);letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px;opacity:.85}
.pf .wire{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pf .wf{border:1.5px solid var(--line,#F0DCE3);border-radius:12px;padding:10px;display:grid;gap:6px;background:#FFFCFA}
.pf .wf i{display:block;border-radius:6px;background:#EADBE1;height:10px}
.pf .wf i.h{height:20px;width:80%;background:#D9C3CC}.pf .wf i.b{height:26px;width:46%;border-radius:999px;background:var(--berry)}
.pf .wf i.s{width:60%}.pf .wf .row3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.pf .wf .row3 i{height:34px}
.pf .wf.old i.b{background:#cbb}.pf .wf.old .menu{display:flex;flex-wrap:wrap;gap:4px}.pf .wf.old .menu i{width:28px;height:8px}
.pf .wf small{font:500 10px/1 var(--font-label);letter-spacing:.14em;text-transform:uppercase;color:var(--mauve)}
.pf .lad{display:grid;gap:8px}
.pf .lad div{display:grid;grid-template-columns:76px 1fr;gap:12px;align-items:center;padding:12px 14px;border-radius:14px;background:var(--blush);font:400 15px/1.4 var(--font-body);color:var(--plum)}
.pf .lad div b{font:700 22px/1 var(--font-script);color:var(--berry)}
.pf .lad div.on{background:var(--plum);color:var(--cream)}.pf .lad div.on b{color:var(--rose)}
.pf .flow5{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.pf .flow5 span{padding:12px 14px;border-radius:14px;background:var(--blush);font:500 14px/1.2 var(--font-body);color:var(--plum)}
.pf .flow5 span.k{background:var(--berry);color:#fff}
.pf .flow5 em{font:700 22px/1 var(--font-script);color:var(--berry);font-style:normal}
.pf .road{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.pf .road div{border-top:6px solid var(--berry);background:#FFFCFA;border-radius:0 0 14px 14px;padding:12px;display:grid;gap:4px}
.pf .road div:nth-child(2){border-color:#C46A8E}.pf .road div:nth-child(3){border-color:var(--rose)}.pf .road div:nth-child(4){border-color:var(--plum)}
.pf .road small{font:500 10px/1 var(--font-label);letter-spacing:.14em;text-transform:uppercase;color:var(--mauve)}
.pf .road b{font:400 18px/1.2 var(--font-display);font-weight:400;color:var(--plum)}
.pf .exnote{font:400 13.5px/1.5 var(--font-body);color:var(--mauve)}
.pf .found{display:flex;flex-wrap:wrap;gap:8px}
.pf .found span{padding:11px 16px;border-radius:999px;background:var(--plum);color:var(--cream);font:400 18px/1.2 var(--font-display)}
.pf .willq p{margin:0;padding:16px 0;border-top:1px solid rgba(251,245,238,.2);font:400 italic clamp(20px,2.2vw,26px)/1.35 var(--font-display);color:var(--cream)}
.pf .steps5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.pf .steps5 article{background:#fff;border-radius:22px;padding:20px;display:flex;flex-direction:column;gap:8px}
.pf .steps5 .n{font:400 italic 40px/.9 var(--font-display);color:var(--berry)}
.pf .steps5 h3{font-size:21px;line-height:1.2}
.pf .steps5 p{margin:0;font:400 14.5px/1.55 var(--font-body);color:var(--cocoa)}
.pf .app{background:#fff;border-radius:28px;padding:clamp(22px,4vw,40px);display:flex;flex-direction:column;gap:18px;box-shadow:0 30px 60px -40px rgba(58,28,42,.6)}
.pf .app .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.pf .app .fld{display:flex;flex-direction:column;gap:6px}
.pf .app label.q,.pf .app legend{font:600 15px/1.35 var(--font-body);color:var(--plum);padding:0}
.pf .app input[type=text],.pf .app textarea{border:2px solid var(--rose);border-radius:14px;padding:12px 14px;font:400 16px/1.5 var(--font-body);color:var(--plum);background:var(--cream);-webkit-appearance:none;appearance:none}
.pf .app input[type=text]{min-height:52px}.pf .app textarea{min-height:100px;resize:vertical}
.pf .app input:focus,.pf .app textarea:focus{outline:none;border-color:var(--berry);box-shadow:0 0 0 4px rgba(162,62,102,.14)}
.pf .app fieldset{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.pf .app .opt{display:flex;gap:10px;align-items:flex-start;padding:11px 14px;border:1.5px solid var(--rose);border-radius:12px;cursor:pointer;font:400 15.5px/1.45 var(--font-body);color:var(--plum)}
.pf .app .opt input{margin-top:3px;accent-color:#A23E66;width:18px;height:18px;flex:none}
.pf .app .opt:has(input:checked){border-color:var(--berry);background:var(--blush)}
.pf .app .opt:focus-within{outline:3px solid var(--berry);outline-offset:2px}
.pf .app button{align-self:flex-start;min-height:58px;padding:0 28px;border:0;border-radius:999px;background:var(--berry);color:#fff;font:600 16px/1 var(--font-body);cursor:pointer}
.pf .app button:disabled{opacity:.6}
.pf .app .msg:not(:empty){font:600 14.5px/1.4 var(--font-body);color:#9B2C2C}
.pf .app .done{font:400 clamp(26px,3vw,34px)/1.25 var(--font-display);color:var(--plum);margin:0}
@media (max-width:1100px){.pf .steps5{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:800px){.pf .areas,.pf .exgrid,.pf .steps5,.pf .app .two{grid-template-columns:minmax(0,1fr)}.pf .road{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:520px){.pf .leak .vs2,.pf .wire{grid-template-columns:minmax(0,1fr)}}
</style>'''

o = [CSS, EXTRA, EX, '<main id="main" class="pf">']

# 01 HERO
s = section(1)
o.append(f'''<section class="hero dk" style="background:#3A1C2A"><div class="in hero-grid">
<div class="stack" style="gap:20px"><p class="lbl">{e(s[0])}</p><h1 style="font-size:clamp(42px,5.4vw,78px)">{headline(s[1])}</h1>
{P(s[2])}{P(s[3])}<div class="stack" style="gap:2px">{"".join(f'<p class="big">{e(x)}</p>' for x in s[4:6])}<p class="big it">{e(s[6])}</p></div></div>
<div class="stack" style="gap:18px;background:#FBF5EE;border-radius:30px;padding:clamp(24px,3vw,36px)">
<p style="font:700 clamp(30px,3vw,40px)/1 var(--font-script);color:#A23E66;transform:rotate(-2deg);align-self:flex-start">{e(s[7])}</p>
<h2 style="color:#3A1C2A;font-size:clamp(34px,3.6vw,48px)">The Blog Monetization <em style="color:#A23E66">Fast Track Call</em></h2>
<p style="font:400 16.5px/1.6 var(--font-body);color:#4A2F3B;margin:0">{e(s[9])}</p>
<div class="row">{cta(s[10][1:-1], "br")}</div><p style="font:500 12px/1.5 var(--font-label);letter-spacing:.08em;color:#6E4B5B;margin:0">{e(s[11])}</p></div>
</div></section>''')
assert s[8] == "The Blog Monetization Fast Track Call"

# Showcase near the top, laid out like Genasys's example: four presentation previews
ICO = {"leak": '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M8 11h6"/>', "eco": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h4a2.5 2.5 0 012.5 2.5v5"/>',
       "web": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>', "road": '<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="1.6"/><circle cx="14" cy="12" r="1.6"/><circle cx="10" cy="19" r="1.6"/>'}
def ico(k): return f'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">{ICO[k]}</svg>'
bars = "".join(f'<div class="bar"><span>{t}</span><i><b style="width:{w}%"></b></i></div>' for t, w in [("Offer positioning", 34), ("Customer pathways", 55), ("Sales conversion", 28), ("Messaging", 42)])
eco = '<div class="eco"><span>Free resource</span><em>&darr;</em><span class="l2">Entry offer</span><em>&darr;</em><span class="l3">Signature offer</span><em>&darr;</em><span class="l4">Premium support</span></div>'
web = ('<div class="wt"><div><div class="wfa"><i class="t"></i><div class="g9">' + "<i></i>" * 9 + '</div></div><small>Before</small></div>'
       '<div><div class="wfa"><i class="t"></i><div class="hb"><i></i><i class="s"></i><i class="s2"></i></div><i class="band"></i><div class="g2"><i></i><i></i></div></div><small>Proposed direction</small></div></div>')
road = '<ol class="rd">' + "".join(f"<li><span>{i}</span>{t}</li>" for i, t in enumerate(["Business clarity", "Brand &amp; messaging", "Website &amp; offers", "Sales systems", "Growth &amp; optimization"], 1)) + "</ol>"
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:24px">
<div class="nar stack ctr-h" style="gap:12px"><p class="lbl" style="text-align:center">Inside your personalized Fast Track experience</p><h2 style="text-align:center">See your business <em>through my eyes.</em></h2></div>
<div class="show"><article>{ico("leak")}<h3>Revenue Leak Analysis</h3>{bars}</article><article>{ico("eco")}<h3>Your Offer Ecosystem</h3>{eco}</article>
<article>{ico("web")}<h3>Website Transformation</h3>{web}</article><article>{ico("road")}<h3>Your Strategic Roadmap</h3>{road}</article></div>
<p class="exnote" style="text-align:center">Illustrative previews of the kinds of things your personalized presentation can include. Yours is built around your own business.</p>
</div></section>''')

# 02 PROBLEM
s = section(2)
o.append(split(2, "#FBF5EE"))

# 03 DIFFERENT
o.append(split(3, "#FFFFFF"))

# 04 PRESENTATION AREAS
s = section(4)
TITLES = ["Your current reality versus your desired business", "Your hidden revenue leaks", "Your offer ecosystem", "Your brand messaging and positioning",
          "Your website and customer experience", "Your marketing and sales funnels", "Your AI implementation opportunities", "Your business development roadmap"]
idx = [s.index(t) for t in TITLES]
cards = []
for k, a in enumerate(idx):
    b = idx[k + 1] if k + 1 < len(idx) else len(s)
    paras = "".join(('<p class="q">' if x.endswith("?") else "<p>") + e(x) + "</p>" for x in s[a + 1:b])
    cards.append(f'<article class="area rv"><span class="n">{k + 1:02d}</span><h3>{e(s[a])}</h3>{paras}</article>')
o.append(f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:28px">
<div class="nar stack ctr-h"><p class="lbl" style="text-align:center">Your personalized business presentation</p><h2 style="text-align:center">{headline(s[0])}</h2>{flow(s[1:idx[0]])}</div>
<div class="areas">{"".join(cards)}</div></div></section>''')

# 05 SEE IT: anonymized format examples
s = section(5)
ex_leak = '''<article class="ex"><span class="tagx">Example, anonymized</span><h3>A revenue leak analysis</h3>
<div class="leak"><b>Every path ends in a free call</b><div class="vs2"><div class="w"><span>What&rsquo;s happening</span>A reader who loves a post can only book a call with a stranger, or leave.</div><div class="r"><span>What works</span>Post, then a matching freebie, then a small paid first step.</div></div></div>
<div class="leak"><b>A list that reads but isn&rsquo;t asked to buy</b><div class="vs2"><div class="w"><span>What&rsquo;s happening</span>Helpful emails with no single next step.</div><div class="r"><span>What works</span>A short welcome series that ends in one clear offer.</div></div></div></article>'''
ex_home = '''<article class="ex"><span class="tagx">Example, anonymized</span><h3>A before and after homepage concept</h3>
<div class="wire"><div class="wf old"><small>Before</small><div class="menu"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><i class="h"></i><i></i><i class="s"></i><div class="row3"><i></i><i></i><i></i></div><i class="b"></i></div>
<div class="wf"><small>After</small><i class="h"></i><i class="s"></i><i class="b"></i><div class="row3"><i style="background:#F6E1E8"></i><i style="background:#E9B9CA"></i><i style="background:#F6E1E8"></i></div><i class="s"></i></div></div>
<p class="exnote">One clear promise, one main button and a path for each kind of visitor, instead of a menu of everything.</p></article>'''
ex_lad = '''<article class="ex"><span class="tagx">Example, anonymized</span><h3>An offer ecosystem</h3>
<div class="lad"><div><b>High</b>Premium private work, offered to existing customers</div><div><b>Mid</b>A group program as the natural next step</div><div class="on"><b>Entry</b>One small paid first yes</div><div><b>Free</b>One freebie that matches the best posts</div></div></article>'''
ex_fun = '''<article class="ex"><span class="tagx">Example, anonymized</span><h3>A personalized sales funnel</h3>
<div class="flow5"><span>Posts, pins and videos</span><em>&rarr;</em><span class="k">One freebie</span><em>&rarr;</em><span>Thank you page offer</span><em>&rarr;</em><span>Welcome emails</span><em>&rarr;</em><span class="k">Core offer</span></div>
<p class="exnote">Every piece of content has one job: lead to the freebie. The emails do the rest.</p></article>'''
ex_road = '''<article class="ex wide"><span class="tagx">Example, anonymized</span><h3>A business development roadmap</h3>
<div class="road"><div><small>First</small><b>Fix the path to buy</b></div><div><small>Next</small><b>Build the small first offer</b></div><div><small>Then</small><b>Write the welcome emails</b></div><div><small>Ongoing</small><b>Content that points to the freebie</b></div></div></article>'''
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:28px">
<div class="nar stack ctr-h"><h2 style="text-align:center">{headline(s[0])}</h2>{flow(s[1:5])}</div>
<div class="exgrid">{ex_leak}{ex_fun}{ex_home}{ex_lad}</div>
<div class="nar stack" style="text-align:center">{flow(s[10:])}</div></div></section>''')
assert all(x.startswith("[Insert") for x in s[5:10])

# 06 NOT STARTED
s = section(6)
fi = s.index("Your expertise."); fe = s.index("The business model that could make sense for your ambitions.")
o.append(f'''<section style="background:#FFFFFF"><div class="in twocol"><div class="stack sticky"><p class="lbl">For bloggers who haven&rsquo;t started yet</p><h2>{headline(s[0])}</h2></div>
<div class="stack">{flow(s[1:fi])}<div class="found">{"".join(f"<span>{e(x)}</span>" for x in s[fi:fe + 1])}</div>{flow(s[fe + 1:])}</div></div></section>''')

# 07 EXISTING
s = section(7)
o.append(f'''<section style="background:#F6E1E8"><div class="in twocol"><div class="stack sticky"><p class="lbl">For existing bloggers</p><h2>{headline(s[0])}</h2></div>
<div class="stack">{flow(s[1:])}</div></div></section>''')

# 08 NEXT 12 MONTHS
s = section(8)
wi = [i for i, l in enumerate(s) if l.startswith("Will you")]
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="in twocol"><div class="stack sticky"><p class="lbl">The next 12 months</p><h2>{headline(s[0])}</h2></div>
<div class="stack"><div class="willq">{"".join(f"<p>{e(s[i])}</p>" for i in wi)}</div>{flow(s[wi[-1] + 1:])}</div></div></section>''')

# 09 HOW IT WORKS
s = section(9)
st = [i for i, l in enumerate(s) if l.startswith("STEP ")]
end = next(i for i, l in enumerate(s) if l.startswith("[Apply"))
cards = []
for k, a in enumerate(st):
    b = st[k + 1] if k + 1 < len(st) else end
    cards.append(f'<article class="rv"><span class="n">{e(s[a][5:])}</span><h3>{e(s[a + 1])}</h3>{"".join(f"<p>{e(x)}</p>" for x in s[a + 2:b])}</article>')
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:28px">
<div class="nar stack ctr-h"><p class="lbl" style="text-align:center">How the Fast Track experience works</p><h2 style="text-align:center">Five steps <em>from application to strategy.</em></h2></div>
<div class="steps5">{"".join(cards)}</div><div class="row" style="justify-content:center">{cta(s[end][1:-1], "br")}</div></div></section>''')

# 10 WHY
o.append(split(10, "#FFFFFF"))

# 11 STRATEGIST
s = section(11)
o.append(f'''<section style="background:#F6E1E8"><div class="in twocol">
<div class="stack sticky"><span class="shot" style="border-radius:999px 999px 26px 26px;border:10px solid #fff;max-width:420px"><img src="/images/photos/desk-mic-smile.jpg" alt="Genasys smiling at her desk" loading="lazy" style="aspect-ratio:3/4;object-fit:cover"></span></div>
<div class="stack"><p class="lbl">Meet your strategist</p><h2>{headline(s[0])}</h2>{flow(s[1:])}</div></div></section>''')

# 12 WHO
s = section(12)
fi = next(i for i, l in enumerate(s) if l.startswith("* ")); fe = max(i for i, l in enumerate(s) if l.startswith("* "))
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:26px">
<div class="nar stack ctr-h"><p class="lbl" style="text-align:center">Who should apply?</p><h2 style="text-align:center">{headline(s[0])}</h2>{P(s[1])}</div>
<div class="nar"><ul class="ticks">{"".join(f"<li>{e(x[2:])}</li>" for x in s[fi:fe + 1])}</ul></div>
<div class="nar stack">{flow(s[fe + 1:])}</div></div></section>''')

# 13 INVESTMENT
s = section(13)
o.append(f'''<section class="dk" style="background:#3A1C2A"><div class="in twocol"><div class="stack sticky"><p class="lbl">An important note about investment</p><h2>{headline(s[0])}</h2></div>
<div class="stack">{flow(s[1:], "cr")}</div></div></section>''')

# 14 APPLICATION
s = section(14)
stages = ["I'm thinking about starting a blog.", "I've started my blog but haven't made money.", "I'm making some money but want more consistent revenue.", "I have an established business and want to adapt it for the future."]
opt = lambda name, vals: "".join(f'<label class="opt"><input type="radio" name="{name}" value="{e(v)}"><span>{e(v)}</span></label>' for v in vals)
form = f'''<form class="app" data-app novalidate>
<div class="two"><div class="fld"><label class="q" for="fa-n">First name</label><input id="fa-n" type="text" name="First name" autocomplete="given-name" maxlength="120"></div>
<div class="fld"><label class="q" for="fa-e">Email address</label><input id="fa-e" type="text" name="Email" inputmode="email" autocomplete="email" maxlength="200"></div></div>
<div class="fld"><label class="q" for="fa-w">Your website, if you have one</label><input id="fa-w" type="text" name="Website" inputmode="url" maxlength="300"></div>
<fieldset><legend>Where are you in your business right now?</legend>{opt("Stage", stages)}</fieldset>
<div class="fld"><label class="q" for="fa-b">Tell me a little about yourself and what you&rsquo;ve already built.</label><textarea id="fa-b" name="About and what she has built" maxlength="3000"></textarea></div>
<div class="fld"><label class="q" for="fa-g">What do you want to accomplish?</label><textarea id="fa-g" name="What she wants to accomplish" maxlength="3000"></textarea></div>
<div class="fld"><label class="q" for="fa-s">What type of support are you looking for?</label><textarea id="fa-s" name="Support she is looking for" maxlength="3000"></textarea></div>
<fieldset><legend>Are you financially prepared to explore a premium private coaching and implementation partnership if we&rsquo;re a good fit?</legend>{opt("Investment ready", ["Yes", "Not yet"])}</fieldset>
<button type="submit">{e(s[4][1:-1])}</button><p class="msg" role="alert"></p>
<p style="margin:0;font:400 14px/1.5 var(--font-body);color:#6E4B5B">{e(s[5])}</p></form>'''
o.append(f'''<section id="apply" style="background:#F6E1E8;scroll-margin-top:80px"><div class="in stack" style="gap:26px;max-width:860px">
<div class="stack ctr-h"><p class="lbl" style="text-align:center">Application</p><h2 style="text-align:center">{headline(s[0])}</h2>{P(s[1])}{P(s[2])}</div>{form}</div></section>''')
assert s[3].startswith("[Embed") and s[4] == "[Submit My Application]"

# 15 FAQ
s = section(15)
qs, cur = [], None
for l in s:
    if l.endswith("?") and len(l) < 110: cur = [l, []]; qs.append(cur)
    elif cur: cur[1].append(l)
def ans(lines):
    return [e(l) for l in lines if not l.startswith("[")]
o.append(f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:26px">
<div class="nar stack ctr-h"><p class="lbl">In their words</p><h2>What women say after <em>talking with me.</em></h2></div>
{proof.css()}{proof.quotes(("Sadie", "Tesha", "Clare"))}</div></section>''')
o.append(f'''<section style="background:#FFFFFF"><div class="nar stack" style="gap:26px">
<div class="stack" style="text-align:center;gap:14px"><p class="lbl">Frequently asked questions</p><h2>Before you <em>apply.</em></h2></div>
<div class="faq">{"".join(faq(q, ans(a)) for q, a in qs if ans(a))}</div></div></section>''')

# 16 FINAL
s = section(16)
ai = next(i for i, l in enumerate(s) if l.startswith("[Apply"))
o.append(f'''<section style="background:#FBF5EE"><div class="nar stack ctr-h">
<h2 style="text-align:center">{headline(s[0])}</h2>{flow(s[1:ai])}<div class="row" style="justify-content:center">{cta(s[ai][1:-1], "br")}</div>
<div style="text-align:center"><span style="font:700 clamp(46px,5vw,64px)/1 var(--font-script);color:#A23E66">{e(s[ai + 1])}</span><p class="lbl" style="margin-top:6px">{e(s[ai + 2])}</p></div></div></section>''')

o.append("<script>\n(function(){\n  var TO=" + repr(TO).replace("'", '"') + r""";
  var f=document.querySelector('[data-app]');if(!f)return;var msg=f.querySelector('.msg');
  f.addEventListener('submit',function(ev){ev.preventDefault();
    var v=function(n){var el=f.querySelector('[name="'+n+'"]');return el?el.value.trim():'';};
    var r=function(n){var el=f.querySelector('input[name="'+n+'"]:checked');return el?el.value:'';};
    if(!v('First name')){msg.textContent='Add your first name.';return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('Email'))){msg.textContent='That email doesn’t look quite right yet.';return;}
    if(!r('Stage')){msg.textContent='Tell me where you are in your business right now.';return;}
    if(!v('What she wants to accomplish')){msg.textContent='Tell me what you want to accomplish.';return;}
    if(!r('Investment ready')){msg.textContent='Answer the investment question so I can review your application.';return;}
    msg.textContent='';var b=f.querySelector('button');b.disabled=true;
    var data={_subject:'Fast Track Call application: '+v('First name'),_template:'table',_captcha:'false',_replyto:v('Email')};
    ['First name','Email','Website','About and what she has built','What she wants to accomplish','Support she is looking for'].forEach(function(n){data[n]=v(n);});
    data['Stage']=r('Stage');data['Investment ready']=r('Investment ready');
    fetch(TO,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
      .then(function(x){if(!x.ok)throw 0;f.innerHTML='<p class="done">Thank you. Your application is in.</p>';location.href='/application-confirmation/';})
      .catch(function(){b.disabled=false;msg.textContent='That didn’t send. Please try again in a moment.';});
  });
})();
</script>""")
o.append("</main>")
out = "\n".join(o)
for bad in ["—", "–", "…"]: assert bad not in out, bad
assert "six figure" not in out.lower()
(ROOT / "apply.html").write_text(out)
print("wrote apply.html", len(out))
