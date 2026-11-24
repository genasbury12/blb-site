"""Builds site/_pages/interactive-course-creator.html: The Interactive Course Creator sales page in its own
"Interactive Lab" brand (violet, peach, lilac, canvas, ink; retro computer windows) from Genasys's copy in
scripts/copy/interactive-course-creator.txt. Run: python3 scripts/gen_icc_page.py"""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pf_parts import *
import proof

# Paste the course checkout link here. Until then every buy button scrolls to the price box.
CHECKOUT = ""
BUY = CHECKOUT or "#enroll"
SRC = Path(__file__).parent / "copy/interactive-course-creator.txt"
L, section = load_copy(SRC, [("I built a multi six figure business", "I built a money making business")])

def cta(label, cls=""):
    if label.startswith("Explore BOSS Academy All Access"): return btn(label, "/all-access/", cls)
    return btn(label, BUY, cls, BUY.startswith("http"))
_flow = flow
def flow(lines, cta_cls=""):
    lines = [("[Insert " + l[7:]) if l.startswith("[Embed ") else l for l in lines]
    return _flow(lines, cta_cls, cta)

def win(label, body, cls=""):
    return (f'<div class="win {cls}"><div class="bar"><i></i><i></i><i></i><span>{e(label)}</span></div>'
            f'<div class="wb">{body}</div></div>')

CURSOR = '<svg class="cursor" viewBox="0 0 60 72" aria-hidden="true"><path d="M4 3l48 30-21 4 12 25-9 4-12-25-15 14z" fill="#F1A48E" stroke="#27243A" stroke-width="3" stroke-linejoin="round"/></svg>'
STICKER = '<svg class="sticker" viewBox="0 0 120 120" aria-hidden="true"><path d="M60 4l11 24 25-10-5 26 26 7-21 17 15 22-27 1-2 27-22-15-22 15-2-27-27-1 15-22L3 51l26-7-5-26 25 10z" fill="#6348B5" stroke="#27243A" stroke-width="2.5" stroke-linejoin="round"/><text x="60" y="56" text-anchor="middle" font-family="Space Grotesk,sans-serif" font-weight="700" font-size="17" fill="#E0D5F5">LEVEL</text><text x="60" y="77" text-anchor="middle" font-family="Space Grotesk,sans-serif" font-weight="700" font-size="20" fill="#E0D5F5">UP!</text></svg>'
STAR = '<svg class="spark" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 0l4.5 15.5L40 20l-15.5 4.5L20 40l-4.5-15.5L0 20l15.5-4.5z"/></svg>'
BURST = '<svg class="burst" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0l9 30 25-19-15 27 31 3-30 9 19 25-27-15-3 31-9-30-25 19 15-27-31-3 30-9-19-25 27 15z"/></svg>'

# Real course screens (mockups v2, captured from the live course). Served from jsDelivr pinned to the commit
# that added them, because the Netlify image host stopped deploying on Nov 15.
SHOTS = "https://cdn.jsdelivr.net/gh/genasbury12/blb-site@6628ed57c0836524f91d524eee1c79a83d725b48/site/images/icc/"
MOD_TITLES = ["Set Up Your Capture System", "Do Your Real Work With Claude", "Turn Your Library Into a Course",
              "Make Your Prompts Work for Students", "Build the Lesson Boards", "Make the Videos", "Update and Launch"]
def shot(name, alt, cls="shot", eager=False):
    lz = "" if eager else ' loading="lazy"'
    return f'<img class="{cls}" src="{SHOTS}{name}.jpg" alt="{e(alt)}" width="1600" height="900"{lz}>'

THEME = r'''<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Outfit:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap">
<style>
/* The Interactive Lab (brand guide v1): Electric Violet meets Pixel Peach. Violet hero, peach buttons with dark text,
   canvas reading sections, lilac browser panels, thin Code Ink borders, restrained shadows, technical grids. */
.icc{--violet:#6348B5;--peach:#F1A48E;--lilac:#E0D5F5;--canvas:#EBEBE5;--ink:#27243A;--white:#FAF9F6;
 --sys-blue:#B7C8F4;--px-purple:#D1B8ED;--coral:#F5C2C9;--cloud:#D9D5F0;--warm:#F5D5C4;
 --plum:#27243A;--berry:#6348B5;--rose:#E0D5F5;--blush:#E0D5F5;--cream:#FAF9F6;--cocoa:#3A3650;--mauve:#5B5675;--pop:#F1A48E;
 --font-display:'Space Grotesk',system-ui,sans-serif;--font-body:'Outfit',system-ui,sans-serif;--font-label:'Space Mono',ui-monospace,monospace;
 background:var(--canvas);font-family:var(--font-body)}
.icc h1,.icc h2,.icc h3{font-weight:700;letter-spacing:-.035em;line-height:1}
.icc h3{letter-spacing:-.02em}
.icc h1 em,.icc h2 em{font-style:normal;color:var(--violet)}
.icc .dk h1 em,.icc .dk h2 em{color:var(--peach)}
.icc .lbl{font-weight:700;letter-spacing:.14em;color:var(--violet)}
.icc .dk .lbl{color:var(--peach)}
.icc .body{font-family:var(--font-body)}
.icc .beat{font-weight:600;font-size:clamp(20px,2.1vw,24px);letter-spacing:-.015em}
.icc .big{font-weight:600;letter-spacing:-.025em}
.icc .it{font-style:normal;color:var(--violet)}
.icc .dk .it{color:var(--peach)}
.icc .grid-bg{background-color:var(--canvas);background-image:linear-gradient(rgba(39,36,58,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(39,36,58,.06) 1px,transparent 1px);background-size:36px 36px}
.icc .vio{background-color:var(--violet);background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);background-size:44px 44px}
.icc .vio.dk .body,.icc .vio.dk .ticks.lt li{color:#F3EEFF}
.icc .inkbg{background:var(--ink)}
.icc .lil{background:var(--lilac)}
.icc .wht{background:var(--white)}
/* buttons: peach with dark text */
.icc .pf-btn{background:var(--peach);color:var(--ink);border:1.5px solid var(--ink);box-shadow:3px 3px 0 var(--ink);font-family:var(--font-label);font-weight:700;font-size:14px;letter-spacing:.03em;text-transform:uppercase;border-radius:12px}
.icc .pf-btn i{background:var(--ink);border-radius:9px}
.icc .pf-btn.cr,.icc .pf-btn.br{background:var(--peach);color:var(--ink)}
.icc .pf-btn.ol{background:var(--white);color:var(--ink)}.icc .pf-btn.ol i{background:var(--violet)}
.icc .pf-btn.olw{background:transparent;color:#fff;border-color:rgba(255,255,255,.7);box-shadow:none}.icc .pf-btn.olw i{background:var(--peach)}.icc .pf-btn.olw i svg{stroke:#27243A}
.icc .dk .pf-btn{box-shadow:3px 3px 0 rgba(0,0,0,.35)}
@media (hover:hover){.icc .pf-btn:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--ink)}}
.icc .pf-slot{border-color:var(--violet);color:var(--violet);background:rgba(99,72,181,.06);font-family:var(--font-label);font-size:13.5px}
.icc .dk .pf-slot{border-color:var(--peach);color:var(--peach);background:rgba(241,164,142,.08)}
.icc .ticks li::before{background-color:var(--violet);border-radius:6px}
.icc .ticks.lt li{background:var(--white);border:1.5px solid var(--ink);border-radius:12px;font-family:var(--font-body)}
.icc .dk .ticks.lt li{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.25)}
/* lilac browser windows, thin ink borders, restrained shadows */
.icc .win{border:1.5px solid var(--ink);border-radius:16px;overflow:hidden;background:var(--white);box-shadow:0 22px 44px -28px rgba(39,36,58,.55)}
.icc .win .bar{background:var(--lilac);display:flex;align-items:center;gap:7px;padding:11px 14px;border-bottom:1.5px solid var(--ink)}
.icc .win .bar i{width:11px;height:11px;border-radius:50%;background:var(--peach)}
.icc .win .bar i:nth-child(2){background:var(--violet)}.icc .win .bar i:nth-child(3){background:var(--ink)}
.icc .win .bar span{margin-left:10px;font:700 11.5px/1 var(--font-label);color:var(--ink)}
.icc .win .wb{padding:clamp(18px,2.6vw,28px);color:var(--ink)}
.icc .win .big,.icc .win .beat,.icc .win h3{color:var(--ink)}
.icc .win .body{color:var(--cocoa)}
.icc .win .lbl{color:var(--violet)}
.icc .win .pf-slot{border-color:var(--violet);color:var(--violet);background:rgba(99,72,181,.06)}
.icc .win .ticks.lt li{background:#fff;color:var(--ink);border-color:var(--ink)}
.icc img.shot{display:block;width:100%;height:auto;border-radius:16px;border:1.5px solid var(--ink);box-shadow:0 22px 44px -28px rgba(39,36,58,.55)}
.icc .shotwrap{display:flex;flex-direction:column;gap:10px}
.icc .shotcap{font:700 11px/1.4 var(--font-label);letter-spacing:.08em;color:var(--violet);text-transform:uppercase}
.icc .dk .shotcap{color:var(--lilac)}
.icc .spark{width:26px;height:26px;fill:var(--violet)}
.icc .rel{position:relative}
/* graphic vocabulary */
.icc .cursor{position:absolute;width:clamp(64px,8vw,110px);z-index:3;filter:drop-shadow(4px 6px 0 rgba(39,36,58,.25))}
.icc .sticker{position:absolute;width:clamp(92px,11vw,138px);z-index:3;transform:rotate(-10deg)}
.icc .segs{display:flex;gap:5px}
.icc .segs b{flex:1;height:12px;border-radius:999px;background:var(--peach)}
.icc .segs b.off{background:rgba(39,36,58,.15)}
/* hero */
.icc .ihero{position:relative;overflow:hidden;isolation:isolate}
.icc .ihero h1{font-size:clamp(38px,4.4vw,62px);color:#fff}
.icc .ihero .body{color:#F3EEFF}
.icc .intro{font:700 13px/1 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:var(--lilac)}
.icc .lockup{font:700 clamp(40px,4.8vw,66px)/.95 var(--font-display);letter-spacing:-.045em;color:#fff}
.icc .lockup b{display:block;color:var(--peach);font-weight:700}
.icc .mode{font:700 12px/1 var(--font-label);letter-spacing:.12em;color:var(--lilac)}
.icc .stats{display:flex;flex-wrap:wrap;gap:8px}
.icc .stats span{padding:9px 12px;border-radius:10px;background:var(--lilac);color:var(--ink);border:1.5px solid var(--ink);font:700 11.5px/1.2 var(--font-label);letter-spacing:.04em}
.icc .stats span b{color:var(--violet)}
.icc .hero-vis{position:relative}
.icc .hero-vis .cursor{right:-8px;bottom:56px}
.icc .hero-vis .sticker{left:-34px;top:-40px}
/* dashboard illustration */
.icc .dash h4{margin:0;font:700 26px/1.05 var(--font-display);letter-spacing:-.03em;color:var(--ink)}
.icc .dash .tag{display:inline-block;padding:6px 10px;border-radius:8px;background:var(--lilac);font:700 11px/1 var(--font-label);color:var(--violet);margin:0 6px 6px 0}
.icc .mis{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.icc .mis li{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:10px;background:var(--canvas);font:500 14.5px/1.3 var(--font-body);color:var(--ink)}
.icc .mis li i{flex:none;width:20px;height:20px;border-radius:6px;border:1.5px solid var(--ink);background:#fff}
.icc .mis li.on i{background:var(--violet) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 12.5l4 4L18 8' fill='none' stroke='%23fff' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/14px no-repeat}
.icc .badges{display:flex;gap:8px;flex-wrap:wrap}
.icc .badges span{width:42px;height:42px;border-radius:12px;border:1.5px solid var(--ink);display:grid;place-items:center;font:700 12px/1 var(--font-label);color:var(--ink)}
.icc .badges span.lock{background:#e4e2ea;color:#8a869a;border-style:dashed}
/* compare + cards */
.icc .ab{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}
.icc .ab .win .wb p{margin:0 0 10px;font:400 16.5px/1.6 var(--font-body)}
.icc .ab .a .bar{background:#dcdad2}
.icc .feat{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.icc .feat article{background:var(--white);border:1.5px solid var(--ink);border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:8px}
.icc .feat article:nth-child(4n+2){background:var(--lilac)}.icc .feat article:nth-child(4n+3){background:var(--warm)}
.icc .feat h3{font-size:23px}.icc .feat p{font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.icc .glance{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:12px}
.icc .glance div{border-radius:14px;padding:18px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.3);color:#F3EEFF;font:400 15.5px/1.45 var(--font-body)}
.icc .glance div b{display:block;font:700 46px/.9 var(--font-display);letter-spacing:-.04em;color:var(--peach);margin-bottom:6px}
.icc .mods{display:flex;flex-direction:column;gap:22px}
.icc .mod{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:clamp(20px,3vw,44px);align-items:start}
.icc .mod .num{font:700 13px/1 var(--font-label);letter-spacing:.18em;color:var(--violet)}
.icc .mod h3{font-size:clamp(28px,3vw,40px);margin-top:10px}
.icc .inside{display:grid;gap:10px}
.icc .inside div{padding:14px 16px;border-radius:12px;background:var(--canvas);border-left:4px solid var(--violet)}
.icc .inside b{display:block;font:700 18px/1.2 var(--font-display);letter-spacing:-.01em;margin-bottom:4px}
.icc .inside p{margin:0;font:400 15px/1.55 var(--font-body);color:var(--cocoa)}
.icc .pass .field{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
.icc .pass .field span{font:700 10.5px/1 var(--font-label);letter-spacing:.12em;text-transform:uppercase;color:var(--violet)}
.icc .pass .field i{display:block;height:34px;border-radius:9px;border:1.5px solid var(--ink);background:var(--canvas)}
.icc .labs{display:grid;gap:8px;max-width:820px;margin:0 auto;width:100%}
.icc .labs div{display:grid;grid-template-columns:56px minmax(0,1fr) minmax(0,1fr);align-items:center;gap:12px;padding:14px 18px;border-radius:12px;color:var(--ink)}
.icc .labs .n{font:700 20px/1 var(--font-display);color:var(--violet)}
.icc .labs .l{font:700 21px/1.1 var(--font-display);letter-spacing:-.02em}
.icc .labs .r{font:700 12.5px/1.2 var(--font-label);letter-spacing:.04em}
.icc .sop{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px}
.icc .sop ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.icc .sop li{font:400 15px/1.45 var(--font-body);padding-left:22px;position:relative}
.icc .sop li::before{content:">";position:absolute;left:0;font:700 14px/1.45 var(--font-label);color:var(--violet)}
.icc .res{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:14px}
.icc .res div{background:var(--white);border:1.5px solid var(--ink);border-radius:14px;padding:18px}
.icc .res h3{font-size:19px;margin-bottom:10px}
.icc .res p{margin:0;padding:6px 0;border-top:1px dashed rgba(39,36,58,.22);font:400 14.5px/1.4 var(--font-body)}
.icc .vs{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:22px;align-items:start}
.icc .vs ol{margin:0;padding:0;list-style:none;display:grid;gap:8px;counter-reset:s}
.icc .vs li{counter-increment:s;display:flex;gap:12px;font:400 15.5px/1.45 var(--font-body)}
.icc .vs li::before{content:counter(s,decimal-leading-zero);font:700 12px/1.9 var(--font-label);color:var(--violet)}
.icc .vs .a li{color:#6b6780}
.icc .ifs{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:14px}
.icc .ifs article{border-radius:16px;padding:22px;background:var(--lilac);border:1.5px solid var(--ink)}
.icc .ifs h3{font-size:22px;margin-bottom:8px}.icc .ifs p{margin:0;font:400 15.5px/1.55 var(--font-body)}
.icc .ifs article:nth-child(odd){background:var(--white)}
.icc .recv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.icc .recv div{padding:14px 16px;border-radius:12px;background:var(--canvas)}
.icc .recv b{display:block;font:700 18px/1.2 var(--font-display);margin-bottom:4px}
.icc .recv p{margin:0;font:400 14.5px/1.5 var(--font-body);color:var(--cocoa)}
/* campaign band */
.icc .band{position:relative;overflow:hidden}
.icc .band h2{font-size:clamp(52px,9vw,128px);line-height:.92;letter-spacing:-.05em;color:#fff}
.icc .band h2 span{color:var(--peach)}
.icc .band h2 mark{background:var(--lilac);color:var(--ink);padding:0 .12em;border-radius:.12em}
.icc .band .cursor{right:8%;bottom:16%}
/* dream course builder */
.icc .dream .opts{display:flex;flex-wrap:wrap;gap:8px}
.icc .dream label{cursor:pointer}
.icc .dream input{position:absolute;opacity:0;pointer-events:none}
.icc .dream label span{display:inline-block;padding:10px 14px;border-radius:10px;border:1.5px solid var(--ink);background:var(--white);font:600 14.5px/1.2 var(--font-body);color:var(--ink)}
.icc .dream input:checked+span{background:var(--violet);color:#fff;border-color:var(--violet)}
.icc .dream input:checked+span::before{content:"\2713  "}
.icc .dream input:focus-visible+span{outline:3px solid var(--peach);outline-offset:2px}
.icc .term{background:var(--ink);border-radius:12px;padding:18px;color:#F3EEFF;font:400 14px/1.65 var(--font-label);white-space:pre-wrap;min-height:120px}
.icc .term b{color:var(--peach);font-weight:700}
@media (max-width:980px){.icc .mod,.icc .vs{grid-template-columns:minmax(0,1fr)}.icc .hero-vis .sticker{left:auto;right:-6px;top:-50px}}
@media (max-width:700px){.icc .ab,.icc .feat,.icc .recv{grid-template-columns:minmax(0,1fr)}.icc .labs div{grid-template-columns:40px minmax(0,1fr)}.icc .labs .r{grid-column:2}.icc .cursor{display:none}}
</style>'''

o = [CSS, EXTRA, THEME, '<main id="main" class="pf icc">']

def head2(lines):
    lbl, h, rest = head(lines)
    return (f'<p class="lbl">{e(lbl)}</p>' if lbl else ""), h, rest

# 01 HERO
s = section(1)
stats = s[8].split(" | ")
def stat(t):
    m = re.match(r"(\d+)\s+(.*)", t)
    return f"<span><b>{m.group(1)}</b> {e(m.group(2))}</span>" if m else f"<span>{e(t)}</span>"
LABS = [("01", "Capture", "Capture Ready", "#E0D5F5"), ("02", "Organize", "Library Builder", "#B7C8F4"), ("03", "Plan", "Course Planner", "#F5D5C4"),
        ("04", "Personalize", "Prompt Writer", "#D1B8ED"), ("05", "Build", "Board Builder", "#F1A48E"), ("06", "Produce", "Video Maker", "#F5C2C9"),
        ("07", "Launch", "Course Creator", "#D9D5F0")]
segs = "".join('<b></b>' if i < 5 else '<b class="off"></b>' for i in range(7))
dash = win("creator_workspace / home", f'''<div class="dash stack" style="gap:16px">
<div><span class="tag">LAB 05</span><span class="tag">Board Builder</span><h4>Build the Lesson Boards</h4></div>
<div><div style="display:flex;justify-content:space-between;font:700 11px/1 var(--font-label);margin-bottom:8px"><span>BUILD_PROGRESS</span><span>RANK 5 OF 7</span></div><div class="segs">{segs}</div></div>
<ul class="mis"><li class="on"><i></i>Build your first module board.</li><li class="on"><i></i>Add quick check quizzes.</li><li><i></i>Add missions, XP, badges and lesson locks.</li></ul>
<div class="badges">{"".join(f'<span style="background:{c}">{n}</span>' for n, _, _, c in LABS[:4])}<span class="lock">05</span></div></div>''')
o.append(f'''<section class="ihero vio dk">
<div class="in hero-grid rel" style="z-index:1">
<div class="stack" style="gap:20px"><p class="lbl" style="color:#E0D5F5">{e(s[0])}</p><h1>{headline(s[1])}</h1>{P(s[2])}{P(s[3])}
<p class="intro">{e(s[4])}</p><p class="lockup">The Interactive <b>Course Creator.</b></p><p class="mode">CREATE_MODE: ON</p><p class="big">{e(s[6])}</p>
<div class="row">{cta(s[7][1:-1], "cr")}</div></div>
<div class="stack hero-vis" style="gap:22px">{STICKER}{shot("01-hero-every-device", "The Interactive Course Creator shown on an iMac, MacBook, iPad and iPhone.", eager=True)}{CURSOR}<div class="stats">{"".join(stat(x) for x in stats)}</div></div>
</div></section>''')
assert s[4] == "Introducing..." and s[5] == "The Interactive Course Creator"

# 02 DEMO
s = section(2)
lb, h, rest = head2(s)
cut = next(i for i, l in enumerate(rest) if l.startswith("[Embed") or l.startswith("[Insert"))
o.append(f'''<section class="lil"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h">{lb}<h2>{headline(h)}</h2></div>
<div class="twocol"><div class="stack">{flow(rest[:cut])}</div>
<div class="stack">{shot("09-course-home", "The course home with a folder for every module, on a laptop and a phone.")}{win("demo.mov", flow(rest[cut + 1:cut + 2]))}<div class="row">{cta(rest[-1][1:-1], "cr")}</div></div></div></div></section>''')

def split(n, cls="", photo=None):
    lb, h, rest = head2(section(n))
    return (f'<section class="{cls}"><div class="in twocol"><div class="stack sticky">{lb}<h2>{headline(h)}</h2>{STAR}</div>'
            f'<div class="stack">{flow(rest)}</div></div></section>')
o.append(split(3, "grid-bg"))
o.append(split(4, "lil"))

# 05 OPPORTUNITY
s = section(5)
ai, bi = s.index("Product A"), s.index("Product B")
end_b = s.index("That's the opportunity.")
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:ai])}</div>
<div class="ab"><div class="a">{win("product_a.pdf", "".join(f"<p>{e(x)}</p>" for x in s[ai + 1:bi]))}</div>
<div class="b">{win("product_b.app", "".join(f"<p>{e(x)}</p>" for x in s[bi + 1:end_b]))}</div></div>
<div class="nar stack">{flow(s[end_b:])}</div></div></section>''')

# 06 IMAGINE
s = section(6)
pi = s.index("A personalized student dashboard")
pe = s.index("These aren't just hypothetical ideas.")
feats = s[pi:pe]
# each feature: title then 1-2 description lines; titles have no closing period
cards, cur = [], None
for l in feats:
    if not l.endswith("."):
        cur = [l, []]; cards.append(cur)
    else: cur[1].append(l)
o.append(f'''<section class="grid-bg"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:pi])}</div>
<div class="feat">{"".join(f'<article><h3>{e(t)}</h3>{"".join(f"<p>{e(x)}</p>" for x in d)}</article>' for t, d in cards)}</div>
<div class="nar stack ctr-h">{"".join(f'<p class="big" style="text-align:center">{e(x)}</p>' for x in s[pe:])}</div></div></section>''')

# Campaign band (brand guide) + the interactive "dream course" concept builder the guide asks for
FEATS = ["A personalized student dashboard", "Personalized Claude prompts", "Working educational tools", "Quick check quizzes",
         "Guided missions", "Narrated video lessons", "A personal student Playbook", "Progress tracking and badges"]
opts = "".join('<label><input type="checkbox" value="' + e(f) + '"><span>' + e(f) + '</span></label>' for f in FEATS)
builder = ('<div class="dream stack" style="gap:16px"><div class="opts">' + opts + '</div>'
           '<div class="term" data-term><b>&gt; dream_course</b>\nPick a feature to start building.</div>'
           '<div class="row"><button type="button" class="pf-btn" data-copy>Copy my concept ' + ARR + '</button>'
           '<span class="mode" style="color:#6348B5" data-copied></span></div></div>')
o.append('<section class="band vio dk"><div class="in stack" style="gap:22px">'
         '<p class="mode">WELCOME TO CREATOR MODE</p>'
         '<h2>If you can <span>teach it.</span><br>You can <mark>build it.</mark></h2>'
         '<p class="body" style="max-width:560px">Your knowledge. Your methodology. Your own interactive educational experience.</p></div>'
         + CURSOR + '</section>')
o.append('<section class="grid-bg"><div class="in twocol" style="align-items:center">'
         '<div class="stack"><p class="lbl">Try it</p><h2>Design your <em>dream course.</em></h2>'
         '<p class="body">Pick the features you want your students to experience. This is a quick concept builder, not a live course.</p></div>'
         + win("dream_course.builder", builder) + '</div></section>')
o.append(r"""<script>
(function(){
  var box=document.querySelector('.dream');if(!box)return;
  var term=box.querySelector('[data-term]'),note=box.querySelector('[data-copied]');
  function text(){var f=[].map.call(box.querySelectorAll('input:checked'),function(i){return i.value;});
    return f.length?'My dream interactive course includes:\n'+f.map(function(x){return '- '+x;}).join('\n'):'';}
  function draw(){var t=text();term.innerHTML='<b>&gt; dream_course</b>\n'+(t?t.replace(/&/g,'&amp;').replace(/</g,'&lt;'):'Pick a feature to start building.');note.textContent='';}
  box.addEventListener('change',draw);
  box.querySelector('[data-copy]').addEventListener('click',function(){
    var t=text();if(!t){note.textContent='PICK A FEATURE FIRST';return;}
    var fail=function(){note.textContent='SELECT AND COPY THE TEXT ABOVE';};
    if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){note.textContent='COPIED';},fail);else fail();
  });
})();
</script>""")

# 07 OFFER
s = section(7)
o.append(f'''<section class="inkbg dk"><div class="nar stack ctr-h">
<p class="lbl">{e(s[0])}</p><h2 style="font-size:clamp(46px,7vw,92px);text-align:center">The Interactive <em>Course Creator</em></h2>
<p class="big" style="text-align:center">{e(s[2])}</p>{flow(s[3:], "cr")}</div></section>''')
assert s[1] == "The Interactive Course Creator"

# 08 GLANCE
s = section(8)
def tile(t):
    m = re.match(r"(\d+)\s+(.*)", t)
    return f"<div><b>{m.group(1)}</b>{e(m.group(2))}</div>" if m else f"<div>{e(t)}</div>"
o.append(f'''<section class="vio dk"><div class="in stack" style="gap:28px">
<div class="nar stack ctr-h"><p class="lbl">Your course at a glance</p><h2>{headline(s[0])}</h2></div>
<div class="glance">{"".join(tile(x) for x in s[1:-1])}</div>
<p class="big" style="text-align:center">{e(s[-1])}</p></div></section>''')

# 09 PROCESS
s = section(9)
starts = [i for i, l in enumerate(s) if re.match(r"^(PART|MODULE) 0", l)]
mods = []
for k, a in enumerate(starts):
    b = starts[k + 1] if k + 1 < len(starts) else len(s)
    blk = s[a:b]; num, title, body = blk[0], blk[1], blk[2:]
    mark = next((i for i, l in enumerate(body) if l in ("Inside this module:", "Learn my process for creating three different types of educational video content.")), None)
    if mark is None:
        inner = flow(body)
    else:
        tail = next(i for i in range(mark + 1, len(body)) if body[i].startswith(("By the end", "This module takes", "Instead of relying")))
        pairs_ = body[mark + 1:tail]
        items = []; i = 0
        while i < len(pairs_):
            t = pairs_[i]; d = []; i += 1
            while i < len(pairs_) and (i + 1 >= len(pairs_) or len(pairs_[i]) > 60 or pairs_[i].startswith("No ")):
                d.append(pairs_[i]); i += 1
                if i < len(pairs_) and len(pairs_[i]) <= 60 and not pairs_[i].startswith("No "): break
            items.append(f'<div><b>{e(t)}</b>{"".join(f"<p>{e(x)}</p>" for x in d)}</div>')
        inner = flow(body[:mark + 1]) + f'<div class="inside">{"".join(items)}</div>' + flow(body[tail:])
    mbody = f'<div class="mod"><div><span class="num">{e(num)}</span><h3>{e(title)}</h3></div><div class="stack" style="gap:14px">{inner}</div></div>'
    n = len(mods)
    pic = shot(f"{n + 2:02d}-module-{n + 1}", f"Module {n + 1}, {MOD_TITLES[n]}, open on a laptop and a phone.")
    mods.append('<article class="rv stack" style="gap:16px">' + win(num.lower().replace(" ", "_") + ".board", mbody) + pic + '</article>')
o.append(f'''<section class="grid-bg"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">The course creation process</p><h2>{headline(s[0])}</h2></div>
<div class="mods">{"".join(mods)}</div></div></section>''')

# 10 PASSPORT
s = section(10)
fi = next(i for i, l in enumerate(s) if l.startswith("* ")); fe = max(i for i, l in enumerate(s) if l.startswith("* "))
fields = [x[2:].rstrip(".") for x in s[fi:fe + 1]]
form = "".join(f'<div class="field"><span>{e(f)}</span><i></i></div>' for f in fields)
o.append(f'''<section class="lil"><div class="in twocol">
<div class="stack"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{flow(s[2:fi])}{flow(s[fe + 1:])}</div>
<div class="sticky pass">{win("passport.form", form)}</div></div></section>''')

# 11 PLAYBOOK
o.append(split(11, "grid-bg"))

# 12 GAMIFIED
s = section(12)
ri = s.index("Achievement ranks")
ranks = s[ri + 2:ri + 9]
ci = s.index("Course Creator certificate")
items = list(zip(s[2:ri:2], s[3:ri:2])) + [(s[ri], s[ri + 1]), (s[ci], s[ci + 1])]
o.append(f'''<section class="inkbg dk"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">The gamified learning experience</p><h2>{headline(s[0])}</h2>{P(s[1])}</div>
{pairs([x for p in items for x in p])}
<div class="stack" style="align-items:center;gap:14px"><p class="lbl">Seven labs. Seven milestones.</p><div class="labs">{"".join(f'<div style="background:{c}"><span class="n">{n}</span><span class="l">{e(l)}</span><span class="r">{e(r.rstrip("."))}</span></div>' for (n, l, _, c), r in zip(LABS, ranks))}</div></div>
<div class="nar stack" style="text-align:center">{"".join(f'<p class="big">{e(x)}</p>' for x in s[ci + 2:])}</div></div></section>''')
assert len(ranks) == 7 and ranks[-1] == "Course Creator."

# 13 SOP LIBRARY
s = section(13)
cats = [i for i, l in enumerate(s) if i > 0 and not l.startswith("* ") and i + 1 < len(s) and s[i + 1].startswith("* ")]
groups = []
for c in cats:
    j = c + 1; items = []
    while j < len(s) and s[j].startswith("* "): items.append(s[j][2:]); j += 1
    groups.append(win(s[c].lower().replace(" & ", "_").replace(" ", "_") + ".sop", f'<h3 style="font-size:22px;margin-bottom:12px">{e(s[c])}</h3><ul>{"".join(f"<li>{e(x)}</li>" for x in items)}</ul>'))
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{flow(s[2:cats[0]])}</div>
{shot("11-passport-and-libraries", "The Course SOP Library on a laptop and the Passport form on a tablet.")}
<div class="sop">{"".join(groups)}</div>
<div class="nar stack">{flow(s[j:])}</div></div></section>''')

# 14 RESOURCES
s = section(14)
CATS = ["Strategic Worksheets", "Course Creation Templates", "Implementation Checklists", "Progress & Improvement Trackers", "Course Wide Resources"]
idx = [s.index(c) for c in CATS] + [len(s) - 1]
cards = "".join(f'<div><h3>{e(CATS[k])}</h3>{"".join(f"<p>{e(x.rstrip(chr(46)))}</p>" for x in s[idx[k] + 1:idx[k + 1]])}</div>' for k in range(len(CATS)))
o.append(f'''<section class="grid-bg"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:idx[0]])}</div>
<div class="res">{cards}</div><p class="big" style="text-align:center">{e(s[-1])}</p></div></section>''')

# 15 DIFFERENT
s = section(15)
ai = s.index("A typical AI course creation approach"); bi = s.index("The Interactive Course Creator approach")
be = next(i for i, l in enumerate(s) if l.startswith("One approach"))
o.append(f'''<section class="lil"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2></div>
<div class="vs"><div class="a">{win("typical_ai_course.txt", f"<h3 style='font-size:22px;margin-bottom:12px'>{e(s[ai])}</h3><ol>{''.join(f'<li>{e(x)}</li>' for x in s[ai + 1:bi])}</ol>")}</div>
<div class="b">{win("interactive_course_creator.app", f"<h3 style='font-size:22px;margin-bottom:12px'>{e(s[bi])}</h3><ol>{''.join(f'<li>{e(x)}</li>' for x in s[bi + 1:be])}</ol>")}</div></div>
<div class="nar stack" style="text-align:center">{"".join(f'<p class="big">{e(x)}</p>' for x in s[be:])}</div></div></section>''')

# 16 WHAT COULD YOU CREATE
s = section(16)
ii = [i for i, l in enumerate(s) if l.startswith("If you")]
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:ii[0]])}</div>
<div class="ifs">{"".join(f'<article><h3>{e(s[i])}</h3><p>{e(s[i + 1])}</p></article>' for i in ii)}</div>
<div class="nar stack" style="text-align:center">{"".join(f'<p class="big">{e(x)}</p>' for x in s[ii[-1] + 2:])}</div></div></section>''')

o.append(split(17, "grid-bg"))

# 18 EDUCATOR
s = section(18)
o.append(f'''<section class="vio dk"><div class="in twocol">
<div class="stack sticky">{win("about_genasys.jpg", '<img src="/images/photos/desk-laptop-mic.jpg" alt="Genasys at her desk with her laptop and microphone" loading="lazy" style="width:100%;aspect-ratio:4/5;object-fit:cover;display:block;border-radius:10px">')}</div>
<div class="stack"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{flow(s[2:])}</div></div></section>''')

# 19 WHO FOR
s = section(19)
fi = next(i for i, l in enumerate(s) if l.startswith("* ")); fe = max(i for i, l in enumerate(s) if l.startswith("* "))
ni = s.index("This course probably isn't for you if:")
ne = next(i for i, l in enumerate(s) if l.startswith("The Interactive Course Creator is about"))
o.append(f'''<section class="grid-bg"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2></div>
<div class="fornot"><div style="background:#FFFFFF;border:2.5px solid #27243A"><p class="lbl">{e(s[fi - 1])}</p><ul class="ticks lt">{"".join(f"<li>{e(x[2:])}</li>" for x in s[fi:fe + 1])}</ul></div>
<div style="background:#E0D5F5;border:2.5px solid #27243A"><p class="lbl">{e(s[ni])}</p><ul class="ticks lt no">{"".join(f"<li>{e(x)}</li>" for x in s[ni + 1:ne])}</ul></div></div>
<div class="nar stack">{flow(s[fe + 1:ni])}<p class="big">{e(s[ne])}</p></div></div></section>''')

# 20 SOCIAL PROOF
s = section(20)
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:24px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2></div>
{shot("10-feedback-board", "The feedback board where students say where they got stuck.")}
<div class="pairs">{shot("07-module-6", "Module 6, Your Voice, No Camera: narrated lessons, open on a laptop and a phone.")}{shot("11-passport-and-libraries", "The Course SOP Library on a laptop and the Passport form on a tablet.")}{shot("06-module-5", "Module 5: lesson boards and gamification, open on a laptop and a phone.")}{shot("02-module-1", "Module 1, the capture system, open on a laptop and a phone.")}</div>
<div class="nar stack ctr-h" style="margin-top:12px"><p class="lbl">What women say about learning with Gen</p></div>
{proof.css(accent="#6348B5", ink="#27243A", card="#FAF9F6", radius="14px")}{proof.quotes(("Morgan", "Tesha", "Clare"))}</div></section>''')
assert s[1].startswith("[Insert genuine screenshots")

o.append(split(21, "lil"))
# right before the offer: everything inside
o.append(f'''<section class="lil" style="padding-top:0"><div class="in shotwrap"><p class="shotcap">Everything inside</p>{shot("00-everything-inside-grid", "All 7 module boards, the course home and the feedback board in one grid.")}</div></section>''')

# 22 EVERYTHING YOU RECEIVE
s = section(22)
ii = s.index("Your investment")
inv_lbl = f'<p class="lbl">{e(s[ii])}</p>' if SHOW_SLOTS else ""
recv = "".join(f'<div><b>{e(t)}</b><p>{e(d)}</p></div>' for t, d in zip(s[2:ii:2], s[3:ii:2]))
o.append(f'''<section id="enroll" class="inkbg dk" style="scroll-margin-top:80px"><div class="in stack" style="gap:26px;max-width:960px">
<div class="stack ctr-h"><p class="lbl">{e(s[0])}</p><h2 style="text-align:center">The Interactive <em>Course Creator</em></h2></div>
{win("everything_inside.list", f'<div class="recv">{recv}</div><div class="stack" style="align-items:center;text-align:center;margin-top:22px;gap:14px">{inv_lbl}{slot("Course price.", "sm")}{slot("Confirmed course access duration and purchase terms.", "sm")}<div class="row">{cta(s[ii + 3][1:-1], "br")}</div><p class="big">{e(s[ii + 4])}</p></div>')}
{"" if CHECKOUT else slot("Your Interactive Course Creator checkout link. Until you send it, every buy button scrolls to this box.")}
</div></section>''')
assert s[1] == "The Interactive Course Creator"

# 23 FAQ
s = section(23)
qs, cur = [], None
for l in s:
    if l.endswith("?") and len(l) < 110: cur = [l, []]; qs.append(cur)
    elif cur: cur[1].append(l)
def ans(lines):
    return [e(l) for l in lines if not l.startswith("[")]
o.append(f'''<section class="grid-bg"><div class="nar stack" style="gap:26px">
<div class="stack" style="text-align:center;gap:14px"><p class="lbl">Frequently asked questions</p><h2>Your questions, <em>answered.</em></h2></div>
<div class="faq">{"".join(faq(q, ans(a)) for q, a in qs if ans(a))}</div></div></section>''')

# 24 FINAL
s = section(24)
ti = s.index("The Interactive Course Creator")
o.append(f'''<section class="lil"><div class="in stack" style="gap:30px">
<div class="nar stack ctr-h"><h2>{headline(s[0])}</h2>{flow(s[1:ti])}</div>
<div style="max-width:620px;margin:0 auto;width:100%">{win("the_interactive_course_creator.app", f'<h3 style="font-size:32px;margin-bottom:14px">{e(s[ti])}</h3><ul class="ticks lt">{"".join(f"<li>{e(x)}</li>" for x in s[ti + 1:ti + 9])}</ul><div class="stack" style="margin-top:16px;gap:12px">{slot("Course price.", "sm")}<div class="row">{cta(s[ti + 10][1:-1], "br")}</div></div>')}</div>
</div></section>''')
assert s[ti + 9] == "[Course Price]"

# 25 ALL ACCESS
s = section(25)
o.append(f'''<section class="vio dk"><div class="in stack" style="gap:28px">
<div class="nar stack ctr-h"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{P(s[2])}</div>
{pairs(s[3:9])}
<div class="row" style="justify-content:center">{cta(s[9][1:-1], "cr")}{cta(s[10][1:-1], "olw")}</div></div></section>''')

o.append(LEGAL + "</main>")
out = "\n".join(o)
for bad in ["—", "–", "…"]: assert bad not in out, bad
assert "six figure" not in out.lower()
(ROOT / "interactive-course-creator.html").write_text(out)
print("wrote interactive-course-creator.html", len(out))
