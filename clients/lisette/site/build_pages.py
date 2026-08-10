#!/usr/bin/env python3
"""Supporting pages: start-here, contact, book, freebie, thank-you,
blog / podcast / french coming-soon pages, legal shells.
Run: python3 build_pages.py
NOTE: forms POST to FormSubmit with a REPLACE-WITH-EMAIL placeholder until
Lisette confirms the address; first live submission requires her one-time
activation click. Swap freebie form for Flodesk snippet when platform chosen."""
from builder import page, faq_schema, faq_html, img

FORM_EMAIL = "REPLACE-WITH-LISETTES-EMAIL"

FORM_CSS = r"""
.formcard{max-width:640px;margin:0 auto;padding:40px 38px}
.formcard label{display:block;font-size:13px;font-weight:600;letter-spacing:.16em;
  text-transform:uppercase;color:var(--deep);margin:18px 0 7px}
.formcard input,.formcard textarea{width:100%;font-family:var(--sans);font-size:16.5px;
  padding:14px 18px;border:1.5px solid rgba(106,87,158,.3);border-radius:12px;
  background:#fff;color:var(--ink)}
.formcard input:focus,.formcard textarea:focus{outline:none;border-color:var(--lav);
  box-shadow:0 0 0 3px rgba(106,87,158,.15)}
.formcard .btn{width:100%;justify-content:center;margin-top:26px;border:0;cursor:pointer;font-size:16px}
.sentnote{display:none;background:var(--blush);border:1.5px solid var(--lav);border-radius:14px;
  padding:16px 22px;margin-bottom:20px;color:var(--deep);font-weight:500}
"""

SENT_JS = r"""
if(new URLSearchParams(location.search).get('sent')==='1'){
  var n=document.querySelector('.sentnote'); if(n) n.style.display='block';
}
"""


# ---------------------------------------------------------------- start here
def build_start():
    css = r"""
.paths{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;margin-top:48px}
.pcard{text-align:center;padding:38px 30px;position:relative}
.pcard .pn{font-family:var(--script);font-size:34px;color:var(--gold)}
.pcard h3{font-size:24px;margin:8px 0 10px}
.pcard p{font-size:15.5px;color:var(--muted);margin-bottom:20px}
.seg{max-width:820px;margin:0 auto;text-align:center}
.seg .big{font-family:var(--serif);font-size:clamp(28px,3.6vw,42px);line-height:1.3;margin:22px 0}
.seg .big em{color:var(--lav)}
@media(max-width:920px){.paths{grid-template-columns:1fr}}
"""
    content = f"""
<section class="phero">
  <div class="ghostword" style="top:8px;left:-20px">Commencez</div>
  <div class="wrap">
    <span class="eyebrow" style="justify-content:center">New here?</span>
    <h1>Start with a dream, not a to-do list</h1>
    <p class="lede">Welcome. You found the corner of the internet for couples who want their retirement to smell like lavender. Here is exactly where to begin.</p>
    <div><span class="hand">bienvenue, friends</span></div>
  </div>
</section>

<section class="sect">
  <div class="wrap">
    <div style="text-align:center;max-width:600px;margin:0 auto">
      <span class="eyebrow" style="justify-content:center">Three doors in</span>
      <h2 class="h2">Pick your pace</h2>
    </div>
    <div class="paths">
      <div class="card pcard"><div class="pn">curious</div><h3>Read the blog</h3><p>Real answers about retiring in France: visas, towns, money, language, all in plain English.</p><a class="btn ghost" href="blog.html">Visit the Blog</a></div>
      <div class="card pcard" style="border:2px solid var(--lav)"><div class="pn">dreaming</div><h3>Grab the checklist</h3><p>The free Retire in France Starter Checklist turns your someday into a plan you can hold.</p><a class="btn" href="freebie.html">Get It Free</a></div>
      <div class="card pcard"><div class="pn">ready</div><h3>Book a free call</h3><p>Tell us your dream. We will tell you the exact next steps for the two of you.</p><a class="btn ghost" href="book.html">Book a Call</a></div>
    </div>
  </div>
</section>

<section class="sect tint">
  <div class="wrap seg">
    <span class="eyebrow" style="justify-content:center">The idea that changes everything</span>
    <div class="big">You do not have to wait for one big retirement at 65. You can take it in <em>segments</em>, two or three years at a time, starting sooner than you think.</div>
    <p class="lede" style="margin:0 auto 30px">This is the heart of the MRA philosophy. A segment abroad in your fifties is not early retirement. It is smart retirement, practiced while you can enjoy every bit of it.</p>
    <span class="hand">why wait for the good part?</span>
  </div>
</section>

<section class="sect ink final" style="text-align:center;padding:100px 0">
  <div class="wrap">
    <h2 class="h2" style="max-width:680px;margin:0 auto 16px">Wherever you start, start today.</h2>
    <p class="lede" style="margin:0 auto 30px">The couples living their dream in France all have one thing in common: a day they finally began.</p>
    <a class="btn cream" href="freebie.html">Start With the Free Checklist</a>
  </div>
</section>
"""
    page("start-here.html", "Start Here | Marriage & Retirement Abroad",
         "New to Marriage & Retirement Abroad? Start here: the blog, the free Retire in France Starter Checklist, or a free planning call for couples.",
         content, extra_css=css)


# ------------------------------------------------------------------ contact
def build_contact():
    content = f"""
<section class="phero">
  <div class="wrap">
    <span class="eyebrow" style="justify-content:center">Say bonjour</span>
    <h1>We read every message</h1>
    <p class="lede">Questions about the trip, the plans, the French lessons, or your own someday? Write to us. We answer within two business days.</p>
  </div>
</section>
<section class="sect">
  <div class="wrap">
    <div class="card formcard">
      <div class="sentnote">Merci! Your message is on its way. We will reply within two business days.</div>
      <form action="https://formsubmit.co/{FORM_EMAIL}" method="POST">
        <input type="hidden" name="_subject" value="New message from marriageandretirementabroad.com">
        <input type="hidden" name="_captcha" value="false">
        <input type="hidden" name="_template" value="table">
        <input type="hidden" name="_next" value="https://marriageandretirementabroad.com/contact?sent=1">
        <label for="cname">Your names</label>
        <input id="cname" name="name" required placeholder="Jack and Diane">
        <label for="cemail">Email</label>
        <input id="cemail" type="email" name="email" required placeholder="you@example.com">
        <label for="cmsg">Your message</label>
        <textarea id="cmsg" name="message" rows="6" required placeholder="Tell us about your dream..."></textarea>
        <button class="btn" type="submit">Send the Message</button>
      </form>
    </div>
    <p style="text-align:center;margin-top:26px"><span class="hand">a bientot!</span></p>
  </div>
</section>
"""
    page("contact.html", "Contact | Marriage & Retirement Abroad",
         "Get in touch with Marriage & Retirement Abroad. Questions about retiring in France answered within two business days.",
         content, extra_css=FORM_CSS, extra_js=SENT_JS)


# --------------------------------------------------------------------- book
def build_book():
    faqs = [
     ("Is the call really free?",
      "Completely. It is a get-to-know-you conversation about your dream, not a sales pitch. If we can help, we will tell you how. If we cannot, we will point you somewhere useful."),
     ("Should both of us be on the call?",
      "Yes, please. This is a couples plan, so both dreams belong in the conversation from minute one."),
     ("What happens after the call?",
      "You get a written recap of what we discussed and our suggested next step. No pressure, no countdown timers. The decision stays yours."),
    ]
    css = r"""
.bsteps{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;max-width:960px;margin:44px auto 0}
.bstep{text-align:center;padding:32px 26px}
.bstep .bn{font-family:var(--script);font-size:36px;color:var(--gold)}
.bstep h3{font-size:22px;margin:6px 0 8px}
.bstep p{font-size:15.5px;color:var(--muted)}
.calbox{max-width:760px;margin:48px auto 0;border:2px dashed var(--lav);border-radius:var(--rad);
  padding:56px 34px;text-align:center;background:var(--blush)}
.calbox h3{font-size:26px;margin-bottom:10px}
@media(max-width:920px){.bsteps{grid-template-columns:1fr}}
"""
    content = f"""
<section class="phero">
  <div class="ghostword" style="top:6px;right:-30px">Rendez-vous</div>
  <div class="wrap">
    <span class="eyebrow" style="justify-content:center">Free dream call</span>
    <h1>Thirty friendly minutes about your someday</h1>
    <p class="lede">No pressure, no jargon, no obligation. Just the two of you, Lisette, and an honest conversation about retiring in France.</p>
  </div>
</section>
<section class="sect">
  <div class="wrap">
    <div style="text-align:center;max-width:600px;margin:0 auto">
      <span class="eyebrow" style="justify-content:center">What to expect</span>
      <h2 class="h2">The call, in three parts</h2>
    </div>
    <div class="bsteps">
      <div class="card bstep"><div class="bn">un</div><h3>Your dream</h3><p>You talk, we listen. Where, when, and what your ideal French life looks like.</p></div>
      <div class="card bstep"><div class="bn">deux</div><h3>Your reality</h3><p>Timeline, budget comfort, and questions. We map what is actually in the way.</p></div>
      <div class="card bstep"><div class="bn">trois</div><h3>Your next step</h3><p>We tell you honestly what we would do next, whether or not it involves us.</p></div>
    </div>
    <div class="calbox">
      <h3>Scheduling opens soon</h3>
      <p style="color:var(--muted);margin-bottom:22px">Our booking calendar is being set up. Until it is live, send us a message and we will arrange your call by email.</p>
      <a class="btn" href="contact.html">Request Your Call</a>
    </div>
    <!-- INSTALL NOTE: replace the calbox above with the Calendly embed once Lisette provides the booking link -->

  </div>
</section>
<section class="sect tint">
  <div class="wrap" style="text-align:center">
    <span class="eyebrow" style="justify-content:center">Before you book</span>
    <h2 class="h2">Fair questions</h2>
    {faq_html(faqs)}
  </div>
</section>
"""
    page("book.html", "Book a Free Call | Marriage & Retirement Abroad",
         "Book a free thirty minute call about retiring in France as a couple. No pressure, just an honest conversation and a clear next step.",
         content, extra_css=css, extra_head=faq_schema(faqs))


# ------------------------------------------------------------------ freebie
def build_freebie():
    css = FORM_CSS + r"""
.fsplit{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.fmock{position:relative;text-align:center}
.fmock .doc{background:#fff;border-radius:14px;box-shadow:var(--shadow);padding:34px 30px;
  max-width:360px;margin:0 auto;text-align:left;transform:rotate(-2deg);border-top:10px solid var(--lav)}
.fmock .doc h4{font-family:var(--serif);font-size:22px;margin-bottom:14px}
.fmock .doc .line{height:9px;border-radius:5px;background:var(--blush);margin:10px 0}
.fmock .doc .line.g{background:#EFE4CE;width:70%}
.fmock .stamp{position:absolute;top:-18px;right:8%;z-index:3;background:var(--gold);color:#fff;border-radius:60px;
  padding:9px 22px;font-size:12px;font-weight:600;letter-spacing:.2em;transform:rotate(6deg)}
@media(max-width:920px){.fsplit{grid-template-columns:1fr}}
"""
    content = f"""
<section class="phero">
  <div class="wrap">
    <span class="eyebrow" style="justify-content:center">Free download</span>
    <h1>The Retire in France Starter Checklist</h1>
    <p class="lede">Turn "someday in France" into a plan you can hold. One cozy afternoon, one checklist, total clarity on your first steps.</p>
  </div>
</section>
<section class="sect">
  <div class="wrap fsplit">
    <div class="fmock">
      <div class="stamp">GRATUIT</div>
      <div class="doc"><h4>Inside your checklist</h4>
        <div class="line" style="width:90%"></div><div class="line g"></div>
        <div class="line" style="width:82%"></div><div class="line g" style="width:60%"></div>
        <div class="line" style="width:88%"></div>
      </div>
      <p style="margin-top:24px"><span class="hand">oui, it is really free</span></p>
    </div>
    <div>
      <ul class="ticks">
        <li>The dream questions to answer as a couple first</li>
        <li>The 5 lifestyle factors that pick your region for you</li>
        <li>The visa paperwork order, in plain English</li>
        <li>A first budget worksheet you can finish tonight</li>
        <li>The one mistake that stalls most couples for years</li>
      </ul>
      <div class="card formcard" style="margin-top:10px">
        <div class="sentnote">Merci! Check your inbox for the checklist.</div>
        <form action="https://formsubmit.co/{FORM_EMAIL}" method="POST">
          <input type="hidden" name="_subject" value="Checklist request from the website">
          <input type="hidden" name="_captcha" value="false">
          <input type="hidden" name="_template" value="table">
          <input type="hidden" name="_next" value="https://marriageandretirementabroad.com/thank-you?sent=1">
          <label for="fname">First name</label>
          <input id="fname" name="name" required placeholder="Your first name">
          <label for="femail">Email</label>
          <input id="femail" type="email" name="email" required placeholder="you@example.com">
          <button class="btn" type="submit">Send Me the Checklist</button>
        </form>
        <p style="font-size:13.5px;color:var(--muted);margin-top:14px">Free forever. Unsubscribe anytime. We never share your email.</p>
      </div>
    </div>
  </div>
</section>
"""
    page("freebie.html", "Free Retire in France Starter Checklist | Marriage & Retirement Abroad",
         "Download the free Retire in France Starter Checklist: the dream questions, region factors, visa paperwork order, and first budget worksheet for couples.",
         content, extra_css=css, extra_js=SENT_JS)


# --------------------------------------------------------------- thank you
def build_thankyou():
    css = r"""
.ty{min-height:46vh;display:flex;align-items:center;text-align:center;padding:110px 0}
.ty h1{font-size:clamp(44px,6vw,72px);margin:14px 0 16px}
.tynext{display:grid;grid-template-columns:1fr 1fr;gap:26px;max-width:760px;margin:48px auto 0}
@media(max-width:920px){.tynext{grid-template-columns:1fr}}
"""
    content = """
<section class="ty">
  <div class="wrap" style="width:100%">
    <span class="hand" style="font-size:40px">merci beaucoup!</span>
    <h1>Check your inbox</h1>
    <p class="lede" style="margin:0 auto">Your checklist is on its way. If it plays hide and seek, peek in the promotions or spam folder and rescue it.</p>
    <div class="tynext">
      <div class="card" style="padding:30px"><h3 style="font-size:22px;margin-bottom:8px">While you wait</h3><p style="font-size:15.5px;color:var(--muted);margin-bottom:16px">Meet the couple behind Marriage &amp; Retirement Abroad.</p><a class="btn ghost" href="about.html">Our Story</a></div>
      <div class="card" style="padding:30px;border:2px solid var(--lav)"><h3 style="font-size:22px;margin-bottom:8px">Ready sooner?</h3><p style="font-size:15.5px;color:var(--muted);margin-bottom:16px">See how couples test drive retirement in Provence.</p><a class="btn" href="trip.html">The Practice Trip</a></div>
    </div>
  </div>
</section>
"""
    page("thank-you.html", "Merci! | Marriage & Retirement Abroad",
         "Your checklist is on its way to your inbox.",
         content, extra_css=css,
         extra_head='<meta name="robots" content="noindex">')


# ------------------------------------------------- coming soon page factory
def coming_soon(fname, title, desc, eyebrow, h1, hand, body, cards, cta_text, cta_href, ghost):
    css = r"""
.cshero{text-align:center;padding:110px 0 80px;background:var(--tint);position:relative;overflow:hidden}
.cshero h1{font-size:clamp(42px,5.8vw,68px);margin:14px 0 14px}
.csbar{max-width:420px;margin:30px auto 0;height:10px;border-radius:6px;background:#fff;overflow:hidden;
  border:1px solid rgba(106,87,158,.25)}
.csbar i{display:block;height:100%;width:62%;border-radius:6px;
  background:linear-gradient(90deg,var(--lav),var(--gold))}
.cscards{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;max-width:1000px;margin:48px auto 0}
.cscard{padding:32px 28px;text-align:center}
.cscard .hand{font-size:26px}
.cscard h3{font-size:22px;margin:6px 0 8px}
.cscard p{font-size:15.5px;color:var(--muted)}
@media(max-width:920px){.cscards{grid-template-columns:1fr}}
"""
    cards_html = "".join(
        f'<div class="card cscard"><span class="hand">{c[0]}</span><h3>{c[1]}</h3><p>{c[2]}</p></div>'
        for c in cards)
    content = f"""
<section class="cshero">
  <div class="ghostword" style="bottom:-16px;left:-20px">{ghost}</div>
  <div class="wrap">
    <span class="eyebrow" style="justify-content:center">{eyebrow}</span>
    <h1>{h1}</h1>
    <p class="lede" style="margin:0 auto">{body}</p>
    <div class="csbar"><i></i></div>
    <p style="margin-top:12px;font-size:13.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--deep)">In the works</p>
    <div style="margin-top:8px"><span class="hand">{hand}</span></div>
  </div>
</section>
<section class="sect">
  <div class="wrap">
    <div class="cscards">{cards_html}</div>
    <div style="text-align:center;margin-top:54px">
      <a class="btn" href="{cta_href}">{cta_text}</a>
    </div>
  </div>
</section>
"""
    page(fname, title, desc, content, extra_css=css)


def build_blog():
    coming_soon(
        "blog.html", "Blog | Marriage & Retirement Abroad",
        "The Marriage & Retirement Abroad blog: retiring in France for couples 45 and better. First articles arriving soon.",
        "The blog", "Good words are on the way", "worth the wait, promise",
        "The first articles are being written right now: real answers about visas, towns, budgets, and the lifestyle questions nobody else covers. Here is a taste of what is coming.",
        [("coming", "The retirement visa, translated", "The long stay visa process in plain English, in the exact order to do it."),
         ("coming", "Where in France? A couples quiz", "The 5 lifestyle factors that quietly pick your perfect region for you."),
         ("coming", "Retirement in segments", "Why 2 to 3 years abroad in your fifties might beat waiting for 65.")],
        "Get Notified First", "freebie.html", "Le Blog")


def build_podcast():
    coming_soon(
        "podcast.html", "Podcast | Marriage & Retirement Abroad",
        "The Marriage & Retirement Abroad podcast: a married couple talks retiring in France. Coming soon.",
        "The podcast", "Two voices, one dream, coming soon",
        "hosted by us two",
        "Lisette and her husband are bringing the dinner-table conversation to your ears: the real story of planning a retirement in France as a married couple, episode by episode.",
        [("soon", "The couple's view", "Both sides of every decision, from picking the town to packing the boxes."),
         ("soon", "Guests who did it", "Conversations with couples already living their French chapter."),
         ("soon", "French, gently", "A little language in every episode, so the words arrive before you do.")],
        "Be First to Listen", "freebie.html", "Le Podcast")


def build_french():
    coming_soon(
        "french.html", "French Lessons for Couples | Marriage & Retirement Abroad",
        "French language and culture training for couples retiring to France. Taught by a fluent speaker who lived there. Coming soon.",
        "French for your new life", "Learn the French your retirement needs",
        "taught with joy, et amour",
        "Not classroom French. Market French, neighbor French, paperwork French. Lessons built for couples moving to France, taught by Lisette, who lived it and speaks it fluently.",
        [("lesson one", "Real conversations", "The exact exchanges you will actually have: the market, the pharmacy, the mairie."),
         ("lesson two", "Culture included", "The customs and courtesies that turn strangers into neighbors."),
         ("lesson three", "Learn as a couple", "Practice together, laugh together, arrive in France as a team.")],
        "Join the Waitlist", "contact.html", "En Francais")


# -------------------------------------------------------------- legal shells
LEGAL_WARN = ('<div class="wrap" style="max-width:760px"><p class="notice">'
              'TEMPLATE NOTICE: This page is a placeholder shell. Replace the bracketed '
              'text below with official legal copy supplied by the client before launch. '
              'This notice must be deleted at install time.</p></div>')


def build_legal(fname, title, h1):
    content = f"""
<section class="phero"><div class="wrap">
  <span class="eyebrow" style="justify-content:center">The fine print</span>
  <h1>{h1}</h1>
</div></section>
<section class="sect">
  {LEGAL_WARN}
  <div class="wrap" style="max-width:760px">
    <p style="margin-bottom:18px">[OFFICIAL {h1.upper()} COPY GOES HERE. Lisette supplies the final text as markdown; the converter injects it, replacing this bracketed block.]</p>
    <p style="color:var(--muted)">Last updated: [DATE]</p>
  </div>
</section>
"""
    page(fname, f"{title} | Marriage & Retirement Abroad",
         f"{title} for marriageandretirementabroad.com.",
         content, extra_head='<meta name="robots" content="noindex">')


if __name__ == "__main__":
    build_start()
    build_contact()
    build_book()
    build_freebie()
    build_thankyou()
    build_blog()
    build_podcast()
    build_french()
    build_legal("privacy.html", "Privacy Policy", "Privacy Policy")
    build_legal("terms.html", "Terms & Conditions", "Terms & Conditions")
    build_legal("disclaimer.html", "Disclaimer", "Disclaimer")
