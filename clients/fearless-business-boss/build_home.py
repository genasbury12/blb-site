"""Homepage. Run: python3 build_home.py"""
import json
from builder import (page, IMG, CALL_URL, CTA, SQUIG, ARROW, spin_badge, marquee,
                     faq_schema, faq_html)

STAR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="#C2A15A" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>'
STARS = '<span class="stars" aria-label="5 stars">' + STAR * 5 + '</span>'
CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'

FAQ = [
    ("Is the Hand-Off Plan call really free?",
     "Yes. It is a free 30-minute Zoom call with Tammy, and there is no sales pitch. You leave with your top three hand-offs, a quick price check on your packages, and one clear next step for the next 30 days."),
    ("Who do you coach?",
     "Women online service providers and solopreneurs: virtual assistants, bookkeepers, online business managers, consultants, coaches, course creators and agency owners. Many are seasoned women with years of experience who are booked full and ready to grow. Men are welcome on occasion if it is a good fit for both."),
    ("Do I need to have a team already?",
     "No. Some clients have never hired help. Others have a subcontractor or two and want to grow into an agency. Tammy meets you right where you are and shows you how to find, onboard, contract and manage help when you are ready."),
    ("I am not very techy. Can I still do this?",
     "Yes. Tammy explains everything in plain language, one step at a time, and virtual hand-holding is always included. You never have to figure it out alone."),
    ("Is your coaching faith-based?",
     "Tammy is a Christ follower with over 30 years of Christian ministry experience, and her faith shapes how she does business. If you would like Christ-centered coaching, just say so on your call."),
    ("What is the difference between the Mastermind and 1:1 coaching?",
     "The Fearless Mastermind is group coaching: two live sessions a month in a small, confidential group, with time for your own questions. Business Freedom 1:1 Coaching is private: two sessions a month just for you, help building your team, and access to Tammy's client portal of contracts, agreements and templates."),
    ("Can you guarantee results?",
     "No honest coach can. Your growth depends on the actions you take and the steps you follow. Tammy gives you the steps, and she walks beside you while you take them."),
]

CHECKS = [
    "My client list is full, or nearly full",
    "I am turning clients away",
    "My revenue has flatlined",
    "I work too hard for too little pay",
    "My life gets squeezed around my business",
    "I want help, but I do not know who to hire",
    "I am not sure what to charge anymore",
    "All the new tech and AI tools overwhelm me",
]

QUOTES = [
    ("I would not be where I am today in business without her support and guidance.", "Lisa, Bloom Content Design"),
    ("Tammy helped me clear through the doubt and confusion.", "Sheryl, Urban Admin"),
    ("I now have a clear direction as to where my business is heading. 10/10 recommend!", "Laura Mae, Pixi Training VA"),
    ("Five minutes with Tammy was an eye opener, so imagine if you have 20!", "DG"),
    ("Tammy is exceptional.", "Kelly Cannings, FreelanceU.com"),
    ("She helped me identify my strengths and weaknesses and provided practical strategies.", "LindaMae, Designs By LindaMae"),
    ("Her extensive experience, depth of knowledge and patience are extraordinary.", "Becky, Virtual Administrative Services"),
]

content = f'''
<!-- 1 HERO: split, arch portrait -->
<section class="hero">
  <div class="wm" style="right:-4vw;top:2vw" aria-hidden="true">Fearless</div>
  <div class="wrap hero-g">
    <div class="hero-t">
      <span class="eyebrow" data-rv>Business coach for women service providers</span>
      <h1 data-rv>Earn more.<br>Work less.<br><em class="ac">Finally hand it off.</em></h1>
      {SQUIG}
      <p class="lead" data-rv>For seasoned women who are booked full, maxed out and ready to grow. Tammy has spent 18 years building VA and digital marketing agencies, and she will walk beside you step by step. Virtual hand-holding is always included.</p>
      <p class="tw" data-rv>Made for <span class="tw-w" data-words='["virtual assistants","bookkeepers","online business managers","consultants","coaches","agency owners"]'>virtual assistants</span><span class="caret" aria-hidden="true"></span></p>
      <div class="btn-row" data-rv>
        <a class="btn" href="{CALL_URL}" target="_blank" rel="noopener">{CTA} {ARROW}</a>
        <a class="tlink" href="/start-here">New here? Start here</a>
      </div>
      <ul class="trust" data-rv>
        <li>{STARS}<span><b>5.0 on Google</b> client reviews</span></li>
        <li><span class="tbadge">2x</span><span><b>Best of Virginia</b> for coaching, UpCity</span></li>
        <li><span class="tbadge">18</span><span><b>Years</b> in online services</span></li>
      </ul>
    </div>
    <div class="hero-v" data-rv="z">
      <div class="arch hero-ph"><img src="{IMG}tammy-desk-portrait.jpg" alt="Tammy Durden, business coach, smiling at her desk with her laptop" width="1100" height="1540"></div>
      {spin_badge("Free hand-off plan call &#10022; no sales pitch &#10022; ", "F", "left:-48px;bottom:70px")}
      <div class="sticker s1">{CHECK}<span>Virtual hand-holding<br><b>always included</b></span></div>
      <div class="sticker s2"><b>Hundreds</b><span>of women coached</span></div>
    </div>
  </div>
</section>

<!-- 2 STRIP MARQUEE -->
{marquee(["Virtual assistants", "Bookkeepers", "Online business managers", "Consultants", "Course creators", "Digital marketing agencies", "Coaches", "Tech pros"])}

<!-- 3 TAPPABLE CHECKLIST -->
<section class="familiar" style="background:var(--tint)">
  <div class="wrap fam-g">
    <div class="fam-l" data-rv="l">
      <span class="eyebrow">Be honest, friend</span>
      <h2>Does any of this <em class="ac">sound familiar?</em></h2>
      <p class="note">Tap everything that feels true right now.</p>
      <div class="meter" aria-live="polite">
        <div class="meter-n"><b id="mN">0</b> of {len(CHECKS)}</div>
        <div class="meter-bar"><i id="mBar"></i></div>
        <p id="mMsg">Tap the ones that feel true.</p>
        <a class="btn" id="mBtn" href="{CALL_URL}" target="_blank" rel="noopener">Let&rsquo;s fix this together</a>
      </div>
    </div>
    <ul class="checks" data-rv="r">
      {"".join(f'<li><button type="button" class="ck" aria-pressed="false"><span class="box">{CHECK}</span><span>{c}</span></button></li>' for c in CHECKS)}
    </ul>
  </div>
</section>

<!-- 4 THE CALL: ink band, three cards -->
<section class="on-ink call">
  <div class="wm" style="left:-3vw;bottom:-2vw" aria-hidden="true">Hand it off</div>
  <div class="wrap">
    <div class="call-h">
      <div data-rv>
        <span class="eyebrow">Your free 30-minute call</span>
        <h2>Not just any call. <em class="ac">The Hand-Off Plan Call.</em></h2>
      </div>
      <p class="lead" data-rv>Service businesses are changing fast. Clients want more, new tools show up every week, and you cannot add more hours to your day. So this is not a vague chat. In 30 minutes on Zoom, Tammy helps you see exactly what to hand off first, and how to price so the help pays for itself.</p>
    </div>
    <div class="call-g">
      <div class="ccard" data-rv data-tilt><span class="num">01</span><h3>Your top 3 hand-offs</h3><p>The three tasks eating your week that a subcontractor, a virtual assistant or a simple tool could take off your plate.</p></div>
      <div class="ccard" data-rv data-tilt style="transition-delay:.1s"><span class="num">02</span><h3>Your price check</h3><p>A quick look at your packages so the help you bring on pays for itself. You are usually worth more than you realize.</p></div>
      <div class="ccard" data-rv data-tilt style="transition-delay:.2s"><span class="num">03</span><h3>Your next 30 days</h3><p>One clear next step, written down, so you leave with a real plan and not just a pep talk.</p></div>
    </div>
    <div class="call-f" data-rv>
      <blockquote><p>&ldquo;I&rsquo;m leaving our conversation feeling lighter, more encouraged, and more hopeful about my journey.&rdquo;</p><cite>Joyce Adedoja, after her free session with Tammy</cite></blockquote>
      <div class="call-cta"><span class="chip gold">No sales pitch. Promise.</span><a class="btn gold" href="{CALL_URL}" target="_blank" rel="noopener">Pick my call time {ARROW}</a></div>
    </div>
  </div>
</section>

<!-- 5 MEET TAMMY: photo collage + story -->
<section class="meet">
  <div class="wrap meet-g">
    <div class="meet-v" data-rv="l">
      <div class="m-main"><img src="{IMG}tammy-red-laptop.jpg" alt="Tammy working at her laptop with a coffee mug by a sunny window" loading="lazy"></div>
      <figure class="pola"><img src="{IMG}tammy-still-the-boss.jpg" alt="Tammy holding a sign that says Still the Boss" loading="lazy"><figcaption>Still the boss</figcaption></figure>
      <div class="m-tag">Co-author of <i>Through Our Lens</i></div>
    </div>
    <div class="meet-t" data-rv="r">
      <span class="eyebrow">Meet your coach</span>
      <h2>Hi, I&rsquo;m Tammy. <em class="ac">I&rsquo;ve been where you are.</em></h2>
      <p>In 2008 I started a lead generation business from home. Then came virtual assistant and bookkeeping services, a VA agency, and a boutique digital marketing agency. At the end of 2020 I exited my agency to coach full time, and it fit just right.</p>
      <p>I also live with multiple sclerosis and lupus. I decided my disABILITY did not mean the end of my story. Through my agencies I hired other disabled professionals and moms of disabled children so they could work from home too.</p>
      <p class="note">&ldquo;Life isn&rsquo;t fair, but God is faithful.&rdquo;</p>
      <ul class="meet-chips"><li class="chip">Award-winning coach</li><li class="chip">Christ follower</li><li class="chip">Speaker + instructor</li></ul>
      <a class="tlink" href="/about">Read my whole story</a>
    </div>
  </div>
</section>

<!-- 6 STATS BAND -->
<section class="stats">
  <h2 class="sr">Tammy by the numbers</h2>
  <div class="wrap stats-g">
    <div class="st" data-rv><b><span data-count="18">18</span></b><span>years in the online services industry</span></div>
    <div class="st" data-rv><b><span data-count="30" data-suffix="+">30+</span></b><span>years of Christian ministry experience</span></div>
    <div class="st" data-rv><b><span data-count="2" data-suffix="x">2x</span></b><span>Best of Virginia for coaching</span></div>
    <div class="st" data-rv><b>5.0</b><span>star rating on Google reviews</span></div>
  </div>
</section>

<!-- 7 WORK WITH TAMMY: three offers, one featured -->
<section class="offers">
  <div class="wm" style="right:-6vw;top:40px" aria-hidden="true">Grow</div>
  <div class="wrap">
    <div class="center" data-rv>
      <span class="eyebrow">Ways to work with Tammy</span>
      <h2>Pick the support <em class="ac">that fits your season.</em></h2>
      {SQUIG}
    </div>
    <div class="off-g">
      <article class="off" data-rv>
        <span class="tag">Membership</span>
        <h3>The Fearless Mastermind</h3>
        <p>Group coaching for women solopreneurs, capped at 10 to 12 members so everyone gets time with Tammy.</p>
        <ul class="ticks"><li>{CHECK}Two live sessions every month</li><li>{CHECK}15 to 20 minutes for your questions</li><li>{CHECK}Monthly goals and quarterly challenges</li><li>{CHECK}Confidential, never recorded</li></ul>
        <div class="price"><b>$75</b><span>per month</span></div>
        <a class="btn ghost" href="/mastermind">See the Mastermind</a>
      </article>
      <article class="off feat" data-rv style="transition-delay:.1s">
        <span class="ribbon">Most support</span>
        <span class="tag">1:1 coaching</span>
        <h3>Business Freedom Coaching</h3>
        <p>Private coaching to grow, price and build your virtual team, with Tammy beside you the whole way.</p>
        <ul class="ticks"><li>{CHECK}Two private sessions every month</li><li>{CHECK}Pricing, packages and marketing strategy</li><li>{CHECK}Find, onboard and manage subcontractors</li><li>{CHECK}Client portal: contracts, agreements, templates</li><li>{CHECK}Virtual hand-holding between sessions</li></ul>
        <div class="price"><b>3 months</b><span>minimum. Investment shared on your free call.</span></div>
        <a class="btn gold" href="/coaching">Explore 1:1 coaching</a>
      </article>
      <article class="off" data-rv style="transition-delay:.2s">
        <span class="tag">One session</span>
        <h3>Pricing &amp; Packages Intensive</h3>
        <p>One focused session to turn your services into clear packages and raise your prices with confidence. Pricing is Tammy&rsquo;s most requested topic.</p>
        <ul class="ticks"><li>{CHECK}Your services turned into packages</li><li>{CHECK}New prices you can say out loud</li><li>{CHECK}What to tell your current clients</li></ul>
        <div class="price"><span class="ph">Price: Tammy to set</span></div>
        <a class="btn ghost" href="/pricing-intensive">See the Intensive</a>
      </article>
    </div>
    <p class="center note" data-rv style="margin-top:34px">Not sure which one? That is exactly what the free call is for.</p>
  </div>
</section>

<!-- 8 OLD WAY / NEW WAY TOGGLE -->
<section class="toggle-s" style="background:var(--tint)">
  <div class="narrow center">
    <span class="eyebrow" data-rv>Two ways to run a business</span>
    <h2 data-rv>Doing it all, or <em class="ac">doing it fearless?</em></h2>
    <div class="sw-wrap" data-rv>
      <span class="sw-l" id="swL">Doing it all</span>
      <button type="button" class="sw" id="sw" role="switch" aria-checked="true" aria-labelledby="swL swR"><i></i></button>
      <span class="sw-l on" id="swR">The fearless way</span>
    </div>
    <div class="ways" id="ways" data-rv>
      <div class="way old"><h3>Doing it all</h3><ul>
        <li>Working nights and weekends to keep up</li><li>Saying no to new clients because you are full</li><li>Charging what you charged five years ago</li><li>Figuring out every new tool by yourself</li><li>Your life squeezed around your business</li></ul></div>
      <div class="way new"><h3>The fearless way</h3><ul>
        <li>Your top tasks handed to trusted help</li><li>Saying yes to more clients and more revenue</li><li>Packages priced for what you are worth today</li><li>A coach and a circle of women in your corner</li><li>A business built to fit your life</li></ul></div>
    </div>
  </div>
</section>

<!-- 9 VIDEO BAND -->
<section class="on-ink vids">
  <div class="wrap">
    <div class="vid-h" data-rv><div><span class="eyebrow">Watch Tammy teach</span><h2>Pull up a chair <em class="ac">and listen in.</em></h2></div>
      <a class="tlink" href="/youtube">More videos</a></div>
    <div class="vid-g">
      <figure data-rv><a class="vid" href="https://www.youtube.com/watch?v=Hhava8q7TQQ" data-yt="Hhava8q7TQQ" aria-label="Play: Scaling Service Businesses on Beyond Six Figures with Ziv Raviv" target="_blank" rel="noopener">
        <img src="https://i.ytimg.com/vi/Hhava8q7TQQ/hqdefault.jpg" alt="" loading="lazy"><span class="play"><svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><path d="M8 5v14l11-7z"/></svg></span></a>
        <figcaption><b>Scaling Service Businesses</b><span>Beyond Six Figures with Ziv Raviv</span></figcaption></figure>
      <figure data-rv style="transition-delay:.1s"><a class="vid" href="https://www.youtube.com/watch?v=tMUTC8ww-90" data-yt="tMUTC8ww-90" aria-label="Play: Empowering Disabled Entrepreneurs on Fempreneur International" target="_blank" rel="noopener">
        <img src="https://i.ytimg.com/vi/tMUTC8ww-90/hqdefault.jpg" alt="" loading="lazy"><span class="play"><svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><path d="M8 5v14l11-7z"/></svg></span></a>
        <figcaption><b>Empowering Disabled Entrepreneurs</b><span>Fempreneur International, hosted by Odiva Vasell</span></figcaption></figure>
    </div>
    <div class="press" data-rv><span class="press-l">As featured in</span>
      {marquee(["Female Entrepreneur Magazine", "BOLD Journey Magazine", "Canvas Rebel Magazine", "The EliteX Magazine", "Influencer Digest", "SCORE", "Freelance University", "Coach Foundation"], cls="press-mq", sep="<i>&#10022;</i>")}</div>
  </div>
</section>

<!-- 10 CLIENT LOVE -->
<section class="love">
  <div class="wrap love-g">
    <div class="love-big" data-rv="l">
      <span class="eyebrow">Client love</span>
      <h2 class="love-h">What women say <em class="ac">after working with Tammy.</em></h2>
      {STARS}
      <blockquote><p>&ldquo;Tammy&rsquo;s vast knowledge, expertise in running her own digital marketing agency, and her heart of gold makes her an amazing business coach.&rdquo;</p>
      <cite><b>Natashia</b> Tiel Virtual Solutions</cite></blockquote>
      <a class="tlink" href="https://g.page/r/CWSaD_gmSFZDEAE/review" target="_blank" rel="noopener">Read Tammy&rsquo;s Google reviews</a>
    </div>
    <div class="love-side">
      <figure class="lq" data-rv="r"><p>&ldquo;Tammy has a reassuring, trustworthy presence, and I highly recommend her coaching services!&rdquo;</p><figcaption>Jena Petrescue Kroeker, Writing Coach</figcaption></figure>
      <figure class="lq alt" data-rv="r" style="transition-delay:.1s"><p>&ldquo;You are steady, compassionate, heartfelt, knowledgeable beyond measure in business processes, and marketing online.&rdquo;</p><figcaption>LM</figcaption></figure>
      <img class="love-ph" src="{IMG}tammy-love-clients.jpg" alt="Tammy holding a heart eyes sign" loading="lazy" data-rv="z">
    </div>
  </div>
  <div class="qmq">{marquee([f'<q>{q}</q><b>{w}</b>' for q, w in QUOTES], cls="quotes", sep="")}</div>
</section>

<!-- 11 FREE RESOURCES: fanned polaroids -->
<section class="free" style="background:var(--tint)">
  <div class="wrap center">
    <span class="eyebrow" data-rv>Free resources</span>
    <h2 data-rv>Free tools to get you <em class="ac">moving this week.</em></h2>
    <p class="lead" data-rv>Start small. Download a checklist, work through it with a cup of coffee, and see how much clearer things feel.</p>
    <div class="fan">
      <a class="fp f1" href="/resources" data-rv><img src="{IMG}freebie-startup-checklist.jpg" alt="Fearlessly Start Your Business checklist cover" loading="lazy"><span>Startup Checklist</span></a>
      <a class="fp f2" href="/resources" data-rv style="transition-delay:.1s"><img src="{IMG}freebie-agency-checklist.jpg" alt="Build Your Agency Checklist cover" loading="lazy"><span>Build Your Agency Checklist</span></a>
      <a class="fp f3" href="/resources" data-rv style="transition-delay:.2s"><img src="{IMG}freebie-storyboard.jpg" alt="Fearless Storyboard worksheet preview" loading="lazy"><span>Ideal Client Storyboard</span></a>
    </div>
    <a class="btn" href="/resources" data-rv>Get the free resources {ARROW}</a>
  </div>
</section>

<!-- 12 LEARN WITH TAMMY: editorial rows -->
<section class="learn">
  <div class="wrap">
    <div class="learn-h" data-rv><span class="eyebrow">Learn with Tammy</span><h2>Read it, hear it, <em class="ac">or watch it.</em></h2></div>
    <a class="row" href="/blog" data-rv><span class="rw">Blog</span><span class="rd">Weekly articles on pricing, scaling and building your agency.<span class="rposts"><i>How to Price Your Packages</i><i>Scale By Outsourcing</i><i>5 Mindset Tips for Success</i></span></span><span class="ra">{ARROW}</span></a>
    <a class="row" href="/podcast" data-rv><span class="rw">Podcast</span><span class="rd">Tammy&rsquo;s conversations on scaling, outsourcing and building a business with a chronic illness.</span><span class="ra">{ARROW}</span></a>
    <a class="row" href="/youtube" data-rv><span class="rw">YouTube</span><span class="rd">Trainings, interviews and step by step walkthroughs you can watch anytime.</span><span class="ra">{ARROW}</span></a>
  </div>
</section>

<!-- 13 FAQ -->
<section class="faq-s" style="background:var(--tint)">
  <div class="wrap faq-g">
    <div class="faq-l" data-rv="l">
      <span class="eyebrow">Good questions</span>
      <h2>Before you <em class="ac">book your call.</em></h2>
      <img src="{IMG}tammy-cozy-cup.jpg" alt="Tammy relaxing on a sofa with a cup of coffee" loading="lazy">
      <p class="note">Still wondering? Email me. I read every one. ~ Tammy</p>
    </div>
    <div class="faq" data-rv="r">{faq_html(FAQ)}</div>
  </div>
</section>

<!-- 14 FINAL CTA -->
<section class="on-ink final">
  <div class="narrow">
    <span class="eyebrow">Your next step</span>
    <h2 class="shimmer">You don&rsquo;t have to do it alone, my friend.</h2>
    <p class="note">Thirty minutes. One plan. No sales pitch.</p>
    <div class="btn-row"><a class="btn gold" href="{CALL_URL}" target="_blank" rel="noopener">{CTA} {ARROW}</a><a class="btn ghost" href="/resources">Grab a free checklist</a></div>
    <p class="fine">Free 30-minute Zoom call. Pick the time that suits you.</p>
  </div>
</section>
'''

CSS = r"""
/* hero */
.hero{padding:clamp(40px,6vw,84px) 0 clamp(70px,8vw,110px)}
.hero-g{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(36px,5vw,80px);align-items:center}
.hero h1{margin-bottom:0;font-size:clamp(40px,5.2vw,68px)}
.tw{font:500 19px var(--sans);color:var(--ink);margin:0 0 30px}
.tw-w{color:var(--blue);font-weight:700}
.caret{display:inline-block;width:2px;height:1.1em;background:var(--blue);vertical-align:-3px;margin-left:3px;animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.trust{list-style:none;padding:0;margin:38px 0 0;display:flex;flex-wrap:wrap;gap:16px 30px}
.trust li{display:flex;align-items:center;gap:12px;font-size:15px;color:var(--muted);line-height:1.35}
.trust b{color:var(--ink);display:block}
.stars{display:inline-flex;gap:1px;flex:none}
.tbadge{flex:none;width:46px;height:46px;border-radius:50%;background:var(--sky);color:var(--blue2);display:grid;place-items:center;font:italic 600 19px var(--serif)}
.hero-v{position:relative;max-width:520px;justify-self:center;width:100%}
.hero-ph{aspect-ratio:4/5.2;width:100%;border:10px solid #fff;outline:1px solid var(--line)}
.sticker{position:absolute;background:#fff;border-radius:18px;box-shadow:var(--shadow);padding:14px 18px;display:flex;align-items:center;gap:12px;font-size:15px;line-height:1.3;color:var(--muted);z-index:3}
.sticker b{color:var(--ink)}
.sticker svg{width:34px;height:34px;padding:7px;border-radius:50%;background:var(--blue);color:#fff;flex:none}
.s1{right:-26px;top:60px;animation:bob 6s ease-in-out infinite}
.s2{right:20px;bottom:-24px;flex-direction:column;align-items:flex-start;gap:0;background:var(--ink);color:#B9C6E0;animation:bob 7s ease-in-out -2s infinite}
.s2 b{font:italic 600 26px var(--serif);color:#fff}
@keyframes bob{50%{transform:translateY(-10px)}}

/* checklist */
.fam-g{display:grid;grid-template-columns:.85fr 1.15fr;gap:clamp(30px,5vw,70px);align-items:start}
.meter{background:#fff;border-radius:var(--r);padding:26px;box-shadow:var(--shadow);margin-top:26px}
.meter-n{font:500 16px var(--sans);color:var(--muted)}
.meter-n b{font:italic 600 48px/1 var(--serif);color:var(--blue);margin-right:4px}
.meter-bar{height:10px;border-radius:10px;background:var(--sky);margin:14px 0;overflow:hidden}
.meter-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--teal),var(--blue));border-radius:10px;transition:width .5s cubic-bezier(.2,.7,.2,1)}
#mMsg{font:italic 500 21px/1.35 var(--serif);color:var(--ink);min-height:2.7em}
.meter .btn{width:100%;white-space:normal}
.js .meter .btn{display:none}
.js .meter.hot .btn{display:inline-flex}
.checks{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ck{width:100%;height:100%;min-height:86px;display:flex;align-items:center;gap:14px;text-align:left;background:#fff;border:2px solid transparent;border-radius:18px;padding:16px 18px;cursor:pointer;font:500 17px/1.35 var(--sans);color:var(--ink);box-shadow:0 12px 30px -22px rgba(14,27,58,.5);transition:border-color .25s,transform .25s,background .25s}
.ck:hover{transform:translateY(-3px);border-color:var(--sky)}
.ck .box{flex:none;width:30px;height:30px;border-radius:9px;border:2px solid var(--line);display:grid;place-items:center;color:transparent;transition:.25s}
.ck .box svg{width:18px;height:18px}
.ck[aria-pressed=true]{border-color:var(--blue);background:#F2F6FE}
.ck[aria-pressed=true] .box{background:var(--blue);border-color:var(--blue);color:#fff}

/* call band */
.call-h{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:end;margin-bottom:50px}
.call-h .lead{margin:0}
.call-g{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.ccard{background:linear-gradient(160deg,#1A2F66,#13244F);border:1px solid rgba(157,187,255,.18);border-radius:var(--r);padding:34px 30px;transition:transform .3s}
.ccard .num{font:italic 600 58px/1 var(--serif);color:var(--gold);display:block;margin-bottom:18px}
.ccard p{color:#B9C6E0;margin:0}
.call-f{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:30px;margin-top:50px;padding-top:40px;border-top:1px solid rgba(255,255,255,.12)}
.call-f blockquote{margin:0;max-width:620px}
.call-f blockquote p{font:italic 500 clamp(20px,2vw,25px)/1.4 var(--serif);color:#fff;margin:0 0 10px}
.call-f cite{font-style:normal;font-size:15px;color:var(--gold2)}
.call-cta{display:flex;flex-direction:column;align-items:flex-start;gap:14px}

/* meet */
.meet-g{display:grid;grid-template-columns:1fr 1fr;gap:clamp(40px,6vw,90px);align-items:center}
.meet-v{position:relative;padding:0 40px 70px 0}
.m-main{border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow);aspect-ratio:4/3.4}
.m-main img{width:100%;height:100%;object-fit:cover}
.pola{position:absolute;right:0;bottom:0;width:44%;background:#fff;padding:10px 10px 0;margin:0;box-shadow:var(--shadow);transform:rotate(5deg);transition:transform .4s;z-index:2}
.pola:hover{transform:rotate(0) scale(1.04)}
.pola img{width:100%;aspect-ratio:1;object-fit:cover}
.pola figcaption{font:italic 500 19px var(--serif);text-align:center;padding:10px 0 12px;color:var(--ink)}
.m-tag{position:absolute;left:-14px;bottom:24px;background:var(--gold);color:var(--ink);font:600 14px var(--sans);padding:10px 16px;border-radius:40px;transform:rotate(-4deg);box-shadow:var(--shadow);z-index:3}
.meet-chips{list-style:none;padding:0;margin:8px 0 26px;display:flex;flex-wrap:wrap;gap:10px}

/* stats */
.stats{background:linear-gradient(120deg,var(--blue2),var(--blue) 55%,#2F6BEA);color:#fff;padding:70px 0}
.stats-g{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.st{text-align:center;padding:10px 14px;border-left:1px solid rgba(255,255,255,.22)}
.st:first-child{border-left:0}
.st b{display:block;font:italic 600 clamp(48px,5.5vw,72px)/1 var(--serif);color:#fff;margin-bottom:10px}
.st>span{font-size:16px;color:#DCE6FF}

/* offers */
.off-g{display:grid;grid-template-columns:1fr 1.12fr 1fr;gap:24px;align-items:center;margin-top:46px}
.off{background:#fff;border-radius:var(--r);padding:34px 30px;box-shadow:var(--shadow);border:1px solid var(--line);display:flex;flex-direction:column;position:relative}
.off .tag{font:700 12px var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--blue2);margin-bottom:12px}
.off p{color:var(--muted);font-size:17px}
.ticks{list-style:none;padding:0;margin:4px 0 24px;display:grid;gap:10px}
.ticks li{display:flex;gap:10px;align-items:flex-start;font-size:16px;line-height:1.4}
.ticks svg{width:20px;height:20px;flex:none;color:var(--blue);margin-top:1px}
.price{margin:auto 0 20px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.price b{font:italic 600 42px/1 var(--serif);color:var(--ink)}
.price span{font-size:15px;color:var(--muted)}
.off .btn{width:100%}
.off.feat{background:var(--ink);color:#DCE4F3;padding:46px 34px;border:0;box-shadow:0 40px 80px -30px rgba(14,27,58,.6)}
.off.feat h3{color:#fff;font-size:clamp(26px,2.6vw,32px)}
.off.feat p,.off.feat .price span{color:#B9C6E0}
.off.feat .tag{color:var(--gold2)}
.off.feat .ticks svg{color:var(--gold)}
.off.feat .price b{color:#fff;font-size:34px}
.ribbon{position:absolute;top:-16px;left:50%;transform:translateX(-50%);background:var(--gold);color:var(--ink);font:700 12px var(--sans);letter-spacing:.18em;text-transform:uppercase;padding:9px 18px;border-radius:30px;white-space:nowrap}

/* toggle */
.sw-wrap{display:inline-flex;align-items:center;gap:16px;margin:16px 0 40px;font:600 17px var(--sans)}
.sw-l{color:var(--muted);transition:color .3s}
.sw-l.on{color:var(--ink)}
.sw{width:76px;height:40px;border-radius:40px;border:0;background:var(--blue);position:relative;cursor:pointer;transition:background .3s}
.sw i{position:absolute;top:5px;left:5px;width:30px;height:30px;border-radius:50%;background:#fff;transition:transform .35s cubic-bezier(.2,.7,.2,1);box-shadow:0 4px 10px rgba(0,0,0,.2)}
.sw[aria-checked=true] i{transform:translateX(36px)}
.sw[aria-checked=false]{background:#8D97AD}
.ways{display:grid;grid-template-columns:1fr 1fr;gap:22px;text-align:left}
.way{border-radius:var(--r);padding:32px;background:#fff;box-shadow:var(--shadow)}
.way ul{list-style:none;padding:0;margin:0;display:grid;gap:12px}
.way li{padding-left:34px;position:relative;font-size:17px}
.old li{color:var(--muted);text-decoration:line-through;text-decoration-color:rgba(86,99,127,.5)}
.old li:before{content:"\00d7";position:absolute;left:4px;top:-3px;font:600 24px var(--sans);color:#A4AEC2}
.new{background:var(--ink)}
.new h3{color:#fff}
.new li{color:#fff}
.new li:before{content:"";position:absolute;left:2px;top:5px;width:18px;height:18px;border-radius:50%;background:var(--gold) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230E1B3A' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center/12px no-repeat}
.js .ways{grid-template-columns:1fr;max-width:620px;margin:0 auto}
.js .ways .way{display:none;animation:wayin .45s ease}
.js .ways[data-on=new] .new,.js .ways[data-on=old] .old{display:block}
@keyframes wayin{from{opacity:0;transform:translateY(12px)}}
.sw-wrap{display:none}
.js .sw-wrap{display:inline-flex}

/* videos */
.vid-h{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:40px;flex-wrap:wrap}
.vid-h h2{margin:0}
.vid-g{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.vid-g figure{margin:0}
.vid,.vid-g iframe{display:block;position:relative;aspect-ratio:16/9;border-radius:var(--r);overflow:hidden;width:100%;border:0;box-shadow:0 30px 60px -30px rgba(0,0,0,.7)}
.vid img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
.vid:hover img{transform:scale(1.04)}
.vid:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(14,27,58,.5))}
.play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,var(--btn1),var(--btn2));display:grid;place-items:center;z-index:2;box-shadow:0 0 0 10px rgba(255,255,255,.15);transition:transform .3s}
.vid:hover .play{transform:translate(-50%,-50%) scale(1.08)}
.vid-g figcaption{margin-top:16px}
.vid-g figcaption b{display:block;font:600 22px var(--serif);color:#fff}
.vid-g figcaption span{font-size:15px;color:#8FA0C4}
.press{display:flex;align-items:center;gap:24px;margin-top:60px;padding-top:30px;border-top:1px solid rgba(255,255,255,.12)}
.press-l{flex:none;font:700 12px var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--gold2)}
.press-mq{flex:1;min-width:0;font:italic 500 21px var(--serif);color:#DCE4F3;-webkit-mask:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.press-mq i{font-style:normal;color:var(--gold);font-size:13px}

/* love */
.love{padding-bottom:70px}
.love-g{display:grid;grid-template-columns:1.2fr 1fr;gap:clamp(30px,5vw,70px);align-items:center}
.love-h{font-size:clamp(26px,2.6vw,34px);margin-bottom:22px}
.love-big blockquote{margin:18px 0 26px}
.love-big p{font:italic 500 clamp(28px,3.2vw,42px)/1.3 var(--serif);color:var(--ink);margin:0 0 20px}
.love-big cite{font-style:normal;font-size:16px;color:var(--muted)}
.love-big cite b{color:var(--ink);margin-right:8px}
.love-side{position:relative;display:grid;gap:18px;padding-right:110px}
.lq{margin:0;background:#fff;border-radius:20px;padding:24px 26px;box-shadow:var(--shadow);border-left:4px solid var(--blue)}
.lq.alt{border-left-color:var(--gold);margin-left:40px}
.lq p{margin:0 0 10px;font-size:17px;color:var(--ink)}
.lq figcaption{font-size:14px;color:var(--muted);font-weight:600}
.love-ph{position:absolute;right:-10px;top:50%;width:150px;height:150px;object-fit:cover;border-radius:50%;border:6px solid #fff;box-shadow:var(--shadow);margin-top:-75px}
.qmq{margin-top:70px}
.quotes .mq-track{animation-duration:60s}
.quotes span{display:inline-flex;flex-direction:column;justify-content:center;align-items:flex-start;text-align:left;white-space:normal;width:360px;min-height:150px;background:var(--tint);border-radius:20px;padding:22px 26px;margin-right:18px;gap:10px!important}
.quotes q{font:italic 500 19px/1.4 var(--serif);color:var(--ink);quotes:"\201C" "\201D"}
.quotes b{font-size:14px;color:var(--blue2)}

/* free */
.fan{display:flex;justify-content:center;align-items:flex-end;margin:50px 0 50px;min-height:330px}
.fp{display:block;width:250px;background:#fff;padding:12px 12px 0;box-shadow:var(--shadow);text-decoration:none;color:var(--ink);transition:transform .4s;position:relative}
.fp img{width:100%;height:280px;object-fit:cover;object-position:top}
.fp span{display:block;font:italic 500 18px var(--serif);padding:12px 0 14px}
/* individual transform props so the reveal's transform:none cannot flatten the fan */
.fp{transition:rotate .4s,translate .4s,scale .4s,opacity .8s,transform .8s}
.f1{rotate:-7deg;translate:0 10px;margin-right:-24px}
.f2{z-index:2;translate:0 -14px}
.f3{rotate:7deg;translate:0 10px;margin-left:-24px}
.fan .fp:hover{rotate:0deg;translate:0 -22px;scale:1.05;z-index:3}

/* learn rows */
.learn-h{margin-bottom:30px}
.row{display:grid;grid-template-columns:minmax(160px,300px) 1fr auto;gap:30px;align-items:center;padding:30px 10px;border-top:1px solid var(--line);text-decoration:none;color:var(--text);transition:background .3s,padding .3s}
.row:last-child{border-bottom:1px solid var(--line)}
.rw{font:italic 600 clamp(40px,5vw,66px)/1 var(--serif);color:transparent;-webkit-text-stroke:1.4px var(--ink);transition:color .3s}
.rd{font-size:18px;color:var(--muted)}
.rposts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.rposts i{font-style:normal;font-size:14px;font-weight:600;background:var(--sky);color:var(--blue2);padding:6px 12px;border-radius:20px}
.ra{width:58px;height:58px;border-radius:50%;border:1.5px solid var(--ink);display:grid;place-items:center;transition:.3s}
.ra svg{width:22px;height:22px}
.row:hover{background:#fff;padding-left:26px;padding-right:26px}
.row:hover .rw{color:var(--blue);-webkit-text-stroke-color:var(--blue)}
.row:hover .ra{background:var(--blue);border-color:var(--blue);color:#fff;transform:rotate(-45deg)}

/* faq */
.faq-g{display:grid;grid-template-columns:.8fr 1.2fr;gap:clamp(30px,5vw,70px);align-items:start}
.faq-l{position:sticky;top:110px}
.faq-l img{width:100%;max-width:380px;aspect-ratio:1;object-fit:cover;border-radius:50%;border:8px solid #fff;box-shadow:var(--shadow);margin:10px 0 22px}

@media(max-width:980px){
  .hero-g,.fam-g,.meet-g,.love-g,.faq-g,.call-h{grid-template-columns:1fr}
  .hero-v{max-width:440px;margin-top:20px}
  .call-g{grid-template-columns:1fr}
  .off-g{grid-template-columns:1fr;max-width:560px;margin-left:auto;margin-right:auto}
  .off-g .feat{order:-1}
  .stats-g{grid-template-columns:1fr 1fr}
  .st:nth-child(3){border-left:0}
  .faq-l{position:static}
  .vid-g{grid-template-columns:1fr}
  .meet-v{max-width:560px}
}
@media(max-width:640px){
  body{font-size:17px}
  .checks{grid-template-columns:1fr}
  .ck{min-height:66px}
  .s1{right:-6px;top:24px}
  .hero-v .spin{left:-6px!important;bottom:40px!important;width:118px;height:118px}
  .hero-v .spin b{width:48px;height:48px;font-size:22px}
  .ways,.js .ways{grid-template-columns:1fr}
  .way{padding:26px 22px}
  .fan{flex-direction:column;align-items:center;gap:22px;min-height:0}
  .f1,.f2,.f3{rotate:0deg;translate:none;margin:0}
  .f1{rotate:-3deg}.f3{rotate:3deg}
  .fp{width:min(280px,80vw)}
  .row{grid-template-columns:1fr auto;gap:14px 18px;padding:24px 4px}
  .rw{grid-column:1/-1}
  .ra{width:48px;height:48px;grid-row:2;grid-column:2}
  .love-side{padding-right:0}
  .love-ph{display:none}
  .lq.alt{margin-left:0}
  .quotes span{width:290px}
  .press{flex-direction:column;align-items:flex-start;gap:14px}
  .press-mq{width:100%}
  .sw-wrap{gap:10px;font-size:15px}
  .meet-v{padding:0 20px 60px 0}
  .m-tag{left:0}
  .stats-g{gap:30px 10px}
  .st{border-left:0}
}
"""

JS = r"""
(function(){
  var d=document;
  // checklist meter
  var cks=[].slice.call(d.querySelectorAll('.ck')), n=d.getElementById('mN'), bar=d.getElementById('mBar'), msg=d.getElementById('mMsg'), meter=d.querySelector('.meter');
  var notes=['Tap the ones that feel true.','You are feeling the squeeze. Better to fix it early.','You are feeling the squeeze. Better to fix it early.','Friend, it is time to hand some of this off.','Friend, it is time to hand some of this off.','Friend, it is time to hand some of this off.','You are carrying too much alone. Let us make a plan.','You are carrying too much alone. Let us make a plan.','You are carrying too much alone. Let us make a plan.'];
  function upd(){var c=cks.filter(function(b){return b.getAttribute('aria-pressed')==='true'}).length;
    n.textContent=c; bar.style.width=(c/cks.length*100)+'%'; msg.textContent=notes[c]; meter.classList.toggle('hot',c>=1)}
  cks.forEach(function(b){b.addEventListener('click',function(){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true');upd()})});
  // old way / new way switch
  var sw=d.getElementById('sw'), ways=d.getElementById('ways'), L=d.getElementById('swL'), R=d.getElementById('swR');
  function setW(on){sw.setAttribute('aria-checked',on?'true':'false');ways.setAttribute('data-on',on?'new':'old');R.classList.toggle('on',on);L.classList.toggle('on',!on)}
  if(sw){setW(false); sw.addEventListener('click',function(){setW(sw.getAttribute('aria-checked')!=='true')});
    // flip to the fearless way once, the first time it scrolls into view
    if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){var o=new IntersectionObserver(function(es){if(es[0].isIntersecting){setTimeout(function(){setW(true)},1300);o.disconnect()}},{threshold:.6});o.observe(ways)} else setW(true)}
})();
"""

page("index.html",
     "Fearless Business Boss | Business Coach for Women Service Providers",
     "Tammy Durden helps seasoned women service providers earn more and work less by handing off the right work and building a virtual team. Book a free Hand-Off Plan call.",
     content, CSS, JS, current="/", schema=faq_schema(FAQ))
