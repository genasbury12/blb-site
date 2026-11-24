"""Adds the "Take a look inside" showcase (BOSS Business System and website template library mockups) to the
Membership, Membership Offer and Black Friday pages, and swaps the Membership testimonial placeholders for real
payment proof and client video testimonials. Safe to run again: it replaces what sits between its markers.
Run: python3 scripts/add_boss_showcase.py"""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from folio_data import video_cards, VIDEO_CSS, VIDEO_JS

PAGES = Path(__file__).resolve().parent.parent / "site/_pages"
BOSS = "https://cdn.jsdelivr.net/gh/genasbury12/blb-site@463c6b98943973b83288beeb28b52195d0290a10/site/images/boss/"
A, B = "<!-- BOSS SHOWCASE START -->", "<!-- BOSS SHOWCASE END -->"
PA, PB = "<!-- PROOF START -->", "<!-- PROOF END -->"

def fig(f, alt, cap):
    return (f'<figure class="rv" style="margin:0;display:flex;flex-direction:column;gap:10px"><div style="border-radius:22px;overflow:hidden;background:#F6E1E8;box-shadow:0 30px 60px -44px rgba(58,28,42,.7)">'
            f'<img src="{BOSS}{f}" alt="{alt}" loading="lazy" style="display:block;width:100%;height:auto"></div>'
            f'<figcaption style="font:500 11.5px/1.5 var(--font-label);letter-spacing:.14em;text-transform:uppercase;color:#A23E66;text-align:center">{cap}</figcaption></figure>')

SHOWCASE = f'''{A}
<style>.bss-2,.bss-3{{display:grid;gap:22px}}.bss-2{{grid-template-columns:repeat(2,minmax(0,1fr))}}.bss-3{{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:860px){{.bss-2,.bss-3{{grid-template-columns:minmax(0,1fr)}}}}</style>
<section style="background:#FBF5EE;padding:clamp(80px,9vw,120px) clamp(16px,4vw,48px)"><div style="max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:clamp(26px,3vw,40px)">
<div style="text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center"><p class="bl8-mono" style="color:#A23E66;margin:0">Inside the membership</p>
<h2 class="bl8-h2 rv" style="color:#3A1C2A">Take a look <em style="color:#A23E66">inside.</em></h2></div>
{fig("01-boss-suite-all-devices.jpg", "The BOSS Business System course on a desktop, laptop, tablet and phone", "The BOSS Business System, on every device")}
<div class="bss-2">{fig("00-all-9-modules.jpg", "Every BOSS Business System module", "Every module, with its own lessons and tools")}{fig("06-website-template-library.jpg", "The members only website template library", "The members only website template library")}</div>
<div class="bss-3">{fig("02-module-1-tools-and-lessons.jpg", "Module 1 lessons and tools on a laptop and phone", "Lessons and tools")}{fig("03-module-2-copy-writer-and-headlines.jpg", "The copy writer and headline library", "Copy writer and headline library")}{fig("04-module-2-brand-builder.jpg", "The brand builder", "Brand builder")}</div>
</div></section>
{B}'''

def pol(src, alt, cap, rot, tape, pos):
    return (f'<figure class="bl8-polaroid rv" style="width:min(250px,100%);transform:rotate({rot}deg)"><span class="bl8-tape {tape}" aria-hidden="true"></span>'
            f'<div style="height:170px;overflow:hidden;border-radius:3px;background:#E9B9CA"><img src="/images/proof/{src}" alt="{alt}" loading="lazy" style="width:100%;height:100%;object-fit:cover;object-position:{pos}"></div><figcaption>{cap}</figcaption></figure>')
PROOF = (f'{PA}<style>{VIDEO_CSS}@media (min-width:1000px){{.bf-vt .vt-grid{{grid-template-columns:repeat(5,minmax(0,1fr))}}}}'
         '@media (max-width:999px){.bf-vt .vt-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.bf-vt .vt:last-child{grid-column:1 / -1;max-width:calc(50% - 8px);justify-self:center;width:100%}}</style>'
         '<div style="display:flex;flex-wrap:wrap;gap:26px;justify-content:center">'
         + pol("proof-81-invoices-paid.jpg", "Invoice app showing 81 paid invoices totaling $34,481", "81 invoices paid: $34,481", "-3", "stripe", "center bottom")
         + pol("proof-monthly-client-payments-2024.jpg", "Blurred sample of monthly client payments", "real client payments, 2024", "2.5", "dots", "center bottom")
         + pol("proof-first-stripe-payouts-2020-2021.jpg", "Blurred sample of early Stripe payouts", "my first Stripe payouts", "-1.5", "stripe", "center top")
         + f'</div><div class="bf-vt" style="width:100%">{video_cards()}</div>{PB}')

def put(t, block, a, b, anchor_re, where="before"):
    if a in t:
        return t[:t.index(a)] + block + t[t.index(b) + len(b):]
    m = re.search(anchor_re, t, re.S); assert m, anchor_re
    i = m.start() if where == "before" else m.end()
    return t[:i] + block + "\n" + t[i:]

# where the showcase goes on each page: right after the section that lists what's inside
SPOTS = {
    "membership.html": r"(?<=make better decisions as an entrepreneur\.</p>\n</div></div></section>\n)",
    "membership-offer.html": r'<section style="background:#F6E1E8;padding:90px clamp\(16px,4vw,48px\)">',
    "black-friday.html": r'<section class="bl8-check"[^>]*><div style="max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:30px">\s*<div style="text-align:center;max-width:860px;margin:0 auto"><h2 class="bl8-h2 rv" style="color:#3A1C2A;">Imagine what you could',
}
for name, spot in SPOTS.items():
    p = PAGES / name; t = p.read_text()
    t = put(t, SHOWCASE, A, B, spot)
    if name == "membership.html":
        slots = re.compile(r'(?:<div style="border:2px dashed #A23E66;[^>]*><b [^>]*>TO FILL IN</b>Insert a genuine testimonial[^<]*</div>)+')
        if PA in t: t = t[:t.index(PA)] + PROOF + t[t.index(PB) + len(PB):]
        else:
            m = slots.search(t); assert m; t = t[:m.start()] + PROOF + t[m.end():]
        t = t.replace('<div style="max-width:1000px;margin:0 auto;display:flex;flex-direction:column;gap:24px;"><div style="text-align:center"><h2 class="bl8-h2 rv" style="color:#3A1C2A;">From women who have been',
                      '<div style="max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:32px;"><div style="text-align:center"><h2 class="bl8-h2 rv" style="color:#3A1C2A;">From women who have been')
        if "data-yt" in t and "vt-play" in t and VIDEO_JS not in t: t = t.rstrip() + "\n" + VIDEO_JS + "\n"
        i = t.find("Insert confirmed membership access terms")  # FAQ with no answer yet: left out until confirmed
        if i > 0: s = t.rfind("<details", 0, i); t = t[:s] + t[t.find("</details>", i) + len("</details>"):]
        t = re.sub(r'\n?<div style="border:2px dashed #A23E66;[^>]*><b [^>]*>TO FILL IN</b>[^<]*</div>', "", t)  # other unconfirmed terms: left out
    assert "to fill in" not in t.lower(), (name, t[max(0, t.lower().find("to fill in") - 300):t.lower().find("to fill in") + 100])
    p.write_text(t); print("updated", name)
