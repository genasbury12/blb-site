"""Genasys's real proof, in one place: written testimonials (from her masterclass comments and calls) and her payment
screenshots. Video testimonials live in folio_data.VIDEOS. Use these anywhere a page needs social proof.
Never add a quote or number here that Genasys didn't give us."""
import html

def _e(t): return html.escape(t, quote=False).replace("'", "&rsquo;")

QUOTES = {
    "Tesha": "She gave me a clear vision how to move my business forward and make money doing what I love.",
    "Morgan": "I really liked your authenticity and you break things down in a way that feels understandable and relatable.",
    "Clare": "Gen comes across as super friendly and understanding and as I am completely new to blogging, I feel that Gen will give me the right encouragement and support along my journey.",
    "Sadie": "Honestly, our chat was so lovely yesterday! I felt encouraged and supported but with no pressure to work with you.",
}

PROOF = [
    ("proof-81-invoices-paid.jpg", "Invoice app showing 81 paid invoices totaling $34,481", "81 invoices paid: $34,481", "center bottom"),
    ("proof-monthly-client-payments-2024.jpg", "Blurred sample of monthly client payments", "Real client payments, 2024", "center bottom"),
    ("proof-first-stripe-payouts-2020-2021.jpg", "Blurred sample of early Stripe payouts", "My first Stripe payouts", "center top"),
]

def css(accent="#A23E66", ink="#3A1C2A", card="#FFFFFF", radius="22px", label_font="var(--font-label)", display_font="var(--font-display)"):
    """Self-contained styles for the quote and proof cards. Pass a page's own colors to match its brand."""
    return f'''<style>
.prq{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:16px}}
.prq figure{{margin:0;background:{card};border-radius:{radius};padding:24px 24px 20px;display:flex;flex-direction:column;gap:14px;box-shadow:0 22px 44px -36px rgba(58,28,42,.6)}}
.prq blockquote{{margin:0;font:400 clamp(19px,1.9vw,23px)/1.35 {display_font};color:{ink}}}
.prq blockquote::before{{content:"\\201C";color:{accent}}}.prq blockquote::after{{content:"\\201D";color:{accent}}}
.prq figcaption{{margin-top:auto;font:500 11.5px/1.4 {label_font};letter-spacing:.16em;text-transform:uppercase;color:{accent}}}
.prp{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}}
.prp figure{{margin:0;background:{card};border-radius:{radius};padding:12px 12px 16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 22px 44px -36px rgba(58,28,42,.6)}}
.prp .im{{height:220px;overflow:hidden;border-radius:calc({radius} - 8px);background:#F6E1E8}}
.prp img{{width:100%;height:100%;object-fit:cover;display:block}}
.prp figcaption{{font:400 22px/1.2 {display_font};color:{ink};padding:0 6px}}
@media (max-width:760px){{.prp{{grid-template-columns:minmax(0,1fr)}}.prp .im{{height:200px}}}}
</style>'''

def quotes(names=("Tesha", "Morgan", "Clare")):
    return '<div class="prq">' + "".join(
        f'<figure class="rv"><blockquote>{_e(QUOTES[n])}</blockquote><figcaption>{n}</figcaption></figure>' for n in names) + '</div>'

def proof(src_prefix="/images/proof/"):
    return '<div class="prp">' + "".join(
        f'<figure class="rv"><div class="im"><img src="{src_prefix}{f}" alt="{_e(a)}" loading="lazy" style="object-position:{pos}"></div><figcaption>{_e(c)}</figcaption></figure>'
        for f, a, c, pos in PROOF) + '</div>'
