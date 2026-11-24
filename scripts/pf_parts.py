"""Shared helpers and styles for the Portfolio, Client Project and Blog Coaching pages."""
import html
from pathlib import Path
from folio_data import VIDEO_CSS

ROOT = Path(__file__).resolve().parent.parent / "site/_pages"
CAL = "https://calendly.com/bossladybloggers/15min"
APPLY_PAGE = "/apply/"   # Fast Track Call application page; every "Apply" button goes here
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
.pf .faq details{width:100%;box-sizing:border-box;background:#fff;border:2px solid var(--plum);border-radius:18px;padding:4px 20px}
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



# ---- copy renderer shared by the long sales pages (Blog Coaching, All Access) ----
import re

def load_copy(path, fixes=()):
    lines = [l.strip() for l in Path(path).read_text().split("\n") if l.strip()]
    for a, b in fixes: lines = [l.replace(a, b) for l in lines]
    def section(n):
        start = next(i for i, l in enumerate(lines) if l.startswith(f"SECTION {n:02d}:"))
        end = next((i for i, l in enumerate(lines) if i > start and l.startswith("SECTION ")), len(lines))
        return lines[start + 1:end]
    return lines, section

def is_label(l): return l.isupper() and len(l) > 3
def headline(l):
    parts = re.split(r"(?<=[.?])\s+", l, maxsplit=1)
    if len(parts) == 2: return f"{e(parts[0])} <em>{e(parts[1])}</em>"
    return e(l)

def flow(lines, cta_cls="", cta=None):
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
            if inner.startswith("Insert"): out.append(slot(inner if inner.endswith(".") else inner + "."))
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

# Course sales pages have no site menu or footer, only this small legal line.
LEGAL = ('<div class="legal" style="padding:22px clamp(16px,4vw,48px);text-align:center;font:500 11.5px/1.6 var(--font-label);'
         'letter-spacing:.12em;text-transform:uppercase;color:#6E6A80">&copy; Boss Lady Bloggers &middot; '
         '<a href="/privacy-policy/" style="color:inherit">Privacy Policy</a> &middot; '
         '<a href="/terms-and-conditions/" style="color:inherit">Terms &amp; Conditions</a></div>')

# Flodesk form for the "Futureproof Your Blog" webinar. Paste its form ID here once it exists in Flodesk:
# the homepage webinar section and /futureproof-webinar both use it.
WEBINAR_FORM_ID = ""

# "Futureproof Your Blog" webinar details, used by the confirmation page (and its Add to calendar button).
# start: ISO date and time with UTC offset, e.g. "2026-12-10T19:00:00-05:00". Leave "" until it's set.
WEBINAR = {"start": "", "minutes": 60, "date": "", "time": "", "duration": ""}

# Fast Track booking: the Calendly event approved applicants book. Replace with the Fast Track Call event link.
FAST_TRACK_CAL = CAL
