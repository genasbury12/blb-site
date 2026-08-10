#!/usr/bin/env python3
"""The Practice Retirement Trip: signature offer page (money page, FAQ schema).
Pricing intentionally 'custom quoted' until Lisette sets it. Run: python3 build_trip.py"""
from builder import page, faq_schema, faq_html, img

FAQS = [
 ("How long is the Practice Retirement Trip?",
  "Under a month. Long enough to live like locals and feel the real rhythm of Provence, short enough to fit around your current life. Exact dates are set with each cohort, with departures in late spring and early summer."),
 ("How much does it cost?",
  "Every trip is custom built for the couple taking it, so pricing is quoted after your planning call. Payment plans are available. You will always know the full number before you commit to anything."),
 ("We do not speak French. Is that a problem?",
  "Not at all. Lisette is fluent and with you throughout, and the trip doubles as a gentle French immersion. You will come home with your first real conversations already behind you."),
 ("What if we realize France is not for us?",
  "Then the trip did its job. Finding out with a few weeks of real experience beats finding out after you have sold the house. Either way, you decide from knowledge instead of guesses."),
 ("Is the trip physically demanding?",
  "No. It is built around retirement living, not sightseeing sprints. Slow mornings, village walks, long lunches. We tailor the pace to the two of you."),
]

CSS = r"""
.thero{position:relative;background:var(--ink);color:#F4EFE7;padding:0;overflow:hidden}
.thero .tph{position:absolute;inset:0}
.thero .tph .ph{position:absolute;inset:0;min-height:100%;opacity:.5}
.thero .tin{position:relative;z-index:2;max-width:1140px;margin:0 auto;padding:130px 24px 110px;text-align:center;
  background:radial-gradient(ellipse at center,rgba(47,40,56,.55) 0%,transparent 75%)}
.thero h1{font-size:clamp(44px,6vw,78px);margin:16px 0 14px;color:#fff}
.thero h1 em{font-family:var(--script);font-style:normal;color:var(--gold)}
.thero .lede{color:#E4DEEE;margin:0 auto 32px}
.thero .eyebrow{color:#CBBFE4}
.itin{max-width:860px;margin:52px auto 0}
.iday{display:grid;grid-template-columns:130px 1fr;gap:26px;padding:26px 0;border-bottom:1px dashed rgba(106,87,158,.25)}
.iday .idn{font-family:var(--script);font-size:34px;color:var(--lav);line-height:1.1}
.iday h3{font-size:23px;margin-bottom:6px}
.iday p{font-size:16.5px;color:var(--muted)}
.incgrid{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:44px}
.inc{padding:30px 32px}
.inc h3{font-size:24px;margin-bottom:14px}
.inc h3 em{font-family:var(--script);font-style:normal;color:var(--gold)}
.forgrid{display:grid;grid-template-columns:1fr 1fr;gap:26px;max-width:900px;margin:44px auto 0}
.forcard{border-radius:var(--rad);padding:30px 32px}
.forcard.yes{background:#fff;border:2px solid var(--lav);box-shadow:var(--shadow)}
.forcard.no{background:#F3EDE4;border:1px dashed #C9BBA6;color:#6E6357}
.forcard h3{font-size:23px;margin-bottom:12px}
.forcard ul{list-style:none}
.forcard li{padding:8px 0 8px 30px;position:relative;font-size:16px}
.forcard.yes li::before{content:"\2713";position:absolute;left:2px;color:var(--lav);font-weight:700}
.forcard.no li::before{content:"\2715";position:absolute;left:2px;color:#B08D62;font-weight:700}
.steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;margin-top:48px}
.stepc{text-align:center;padding:34px 28px;position:relative}
.stepc .snum{width:64px;height:64px;border-radius:50%;background:var(--blush);border:2px solid var(--lav);
  display:flex;align-items:center;justify-content:center;font-family:var(--script);font-size:30px;
  color:var(--deep);margin:0 auto 16px}
.stepc h3{font-size:22px;margin-bottom:8px}
.stepc p{font-size:15.5px;color:var(--muted)}
.gal{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-top:48px}
.gal .ph{min-height:240px;border-radius:16px}
.gal .g1{grid-row:span 2;min-height:498px}
.gal .g1 .ph{height:100%;min-height:498px}
@media(max-width:920px){
  .iday{grid-template-columns:1fr;gap:6px}
  .incgrid,.forgrid,.steps3{grid-template-columns:1fr}
  .gal{grid-template-columns:1fr 1fr}
  .gal .g1{grid-row:auto;min-height:240px}
}
"""

content = f"""
<section class="thero">
  <div class="tph">{img('field_wide', 'Lavender fields in Provence under a violet sunset sky', tone='field')}</div>
  <div class="tin">
    <span class="eyebrow" style="justify-content:center">The signature experience</span>
    <h1>Practice your retirement <em>in Provence</em></h1>
    <p class="lede">A short, fully organized stay in the South of France where you live like retirees, not tourists. Come home knowing exactly what your dream feels like, and whether you want it forever.</p>
    <a class="btn cream" href="book.html">Start With a Free Call</a>
    <p style="margin-top:16px;font-size:14px;color:#CBBFE4">Custom quoted per couple. Payment plans available. Late spring and early summer departures.</p>
  </div>
</section>

<section class="sect">
  <div class="wrap split">
    <div>
      <span class="eyebrow">Why practice?</span>
      <h2 class="h2">You would never buy a house you have not walked through</h2>
      <p style="margin-bottom:16px">Yet couples commit their entire retirement to a country they have only visited on vacation. Vacation France and everyday France are different places. The Practice Retirement Trip closes that gap.</p>
      <p style="margin-bottom:16px">For a few weeks you live the actual life: shopping the markets, greeting the neighbors, handling the small logistics, settling into the slow rhythm. With Lisette beside you, in French when needed.</p>
      <p><span class="hand">then you decide, with your eyes open</span></p>
    </div>
    <div class="arch">{img('village', 'Hilltop stone village in Provence at dusk', tone='sunset')}</div>
  </div>
</section>

<section class="sect tint">
  <div class="wrap">
    <div style="text-align:center;max-width:640px;margin:0 auto">
      <span class="eyebrow" style="justify-content:center">A taste of the rhythm</span>
      <h2 class="h2">What a practice week feels like</h2>
      <p style="margin-top:-2px"><span class="hand">a sample, every trip is custom</span></p>
    </div>
    <div class="itin">
      <div class="iday"><div class="idn">lundi</div><div><h3>Market morning</h3><p>Shop the village market like a local. Cheese, flowers, and your first full French exchange with a vendor who now knows your name.</p></div></div>
      <div class="iday"><div class="idn">mardi</div><div><h3>Town tryouts</h3><p>Spend the day in one of your shortlist towns. Walk it at coffee hour and at dinner hour. Feel which one fits.</p></div></div>
      <div class="iday"><div class="idn">mercredi</div><div><h3>Logistics, gently</h3><p>A relaxed session on the real stuff: healthcare, banking, housing. In plain English, with pastries.</p></div></div>
      <div class="iday"><div class="idn">jeudi</div><div><h3>French over coffee</h3><p>A tailored lesson built on conversations you actually had this week. Small wins, big confidence.</p></div></div>
      <div class="iday"><div class="idn">vendredi</div><div><h3>The long lunch</h3><p>Three hours at a table under the plane trees. This is not a break from the plan. This is the plan.</p></div></div>
    </div>
  </div>
</section>

<section class="sect">
  <div class="wrap">
    <div style="text-align:center;max-width:620px;margin:0 auto">
      <span class="eyebrow" style="justify-content:center">La galerie</span>
      <h2 class="h2">Where you will be practicing</h2>
    </div>
    <div class="gal">
      <div class="g1">{img('door', 'Lavender painted door in a stone wall in a Provence village', tone='field')}</div>
      <div>{img('market', 'Provencal market stall with lavender and linens', tone='sunset')}</div>
      <div>{img('coast', 'Mediterranean cove at sunset in the South of France')}</div>
      <div>{img('cafe', 'French cafe terrace with coffee and lavender', tone='sunset')}</div>
      <div>{img('table', 'Long lunch table in an olive grove', tone='field')}</div>
    </div>
  </div>
</section>

<section class="sect ink">
  <div class="ghostword" style="bottom:-20px;right:-30px;-webkit-text-stroke-color:rgba(255,255,255,.08)">Inclus</div>
  <div class="wrap">
    <div style="text-align:center;max-width:620px;margin:0 auto">
      <span class="eyebrow">What is included</span>
      <h2 class="h2">Organized down to the last croissant</h2>
    </div>
    <div class="incgrid">
      <div class="card inc" style="background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.14);box-shadow:none">
        <h3><em>before</em> you fly</h3>
        <ul class="ticks" style="--tick:#fff">
          <li style="color:#E4DEEE">Planning calls to design your custom itinerary</li>
          <li style="color:#E4DEEE">Region and town shortlist built around your dream</li>
          <li style="color:#E4DEEE">Pre-trip French starter sessions for couples</li>
          <li style="color:#E4DEEE">Packing, travel, and paperwork checklists</li>
        </ul>
      </div>
      <div class="card inc" style="background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.14);box-shadow:none">
        <h3><em>while</em> you are there</h3>
        <ul class="ticks">
          <li style="color:#E4DEEE">Handpicked home base arranged for you</li>
          <li style="color:#E4DEEE">Guided market days, town tryouts, and local introductions</li>
          <li style="color:#E4DEEE">On-trip French lessons built from your real conversations</li>
          <li style="color:#E4DEEE">A couples debrief to capture what you learned</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="sect">
  <div class="wrap">
    <div style="text-align:center;max-width:620px;margin:0 auto">
      <span class="eyebrow" style="justify-content:center">Honesty hour</span>
      <h2 class="h2">This trip is not for everyone</h2>
    </div>
    <div class="forgrid">
      <div class="forcard yes"><h3>Perfect for you if...</h3><ul>
        <li>You are a couple 45 or better, seriously dreaming about France</li>
        <li>You want to test the life before you commit to it</li>
        <li>You would rather go guided than figure it out alone</li>
        <li>You love slow mornings and long lunches</li>
      </ul></div>
      <div class="forcard no"><h3>Skip it if...</h3><ul>
        <li>You want a packed tourist itinerary with ten cities</li>
        <li>France is a maybe on a long list of maybes</li>
        <li>You prefer to DIY every detail yourself</li>
        <li>You are not ready to picture retirement yet</li>
      </ul></div>
    </div>
  </div>
</section>

<section class="sect tint">
  <div class="wrap">
    <div style="text-align:center;max-width:620px;margin:0 auto">
      <span class="eyebrow" style="justify-content:center">Simple to start</span>
      <h2 class="h2">How to join a trip</h2>
    </div>
    <div class="steps3">
      <div class="card stepc"><div class="snum">1</div><h3>Book a free call</h3><p>We meet, we talk dreams, we see if the trip fits the two of you.</p></div>
      <div class="card stepc"><div class="snum">2</div><h3>Design your trip</h3><p>We build your custom itinerary and quote it clearly. Payment plans available.</p></div>
      <div class="card stepc"><div class="snum">3</div><h3>Pack for Provence</h3><p>We handle the organizing. You handle the daydreaming until departure day.</p></div>
    </div>
  </div>
</section>

<section class="sect">
  <div class="wrap" style="text-align:center">
    <span class="eyebrow" style="justify-content:center">Trip questions</span>
    <h2 class="h2">Asked before every departure</h2>
    {faq_html(FAQS)}
  </div>
</section>

<section class="sect ink final" style="text-align:center;padding:110px 0">
  <div class="wrap">
    <span class="hand" style="font-size:32px">the lavender is already blooming...</span>
    <h2 class="h2" style="max-width:720px;margin:12px auto 16px">Spots are couple-by-couple, and few.</h2>
    <p class="lede" style="margin:0 auto 32px">Each departure takes a small number of couples so every trip stays personal. Start with a free call and let's talk about yours.</p>
    <a class="btn cream" href="book.html">Book Your Free Call</a>
  </div>
</section>
"""

page(
    "trip.html",
    "The Practice Retirement Trip in Provence | Marriage & Retirement Abroad",
    "Test drive your French retirement. A short, fully organized stay in Provence where couples 45 and better live like retirees before committing to the move.",
    content,
    extra_css=CSS,
    extra_head=faq_schema(FAQS),
)
