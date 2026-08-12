#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Holistik Queen: about page."""
from builder import page, SQUIG

CSS = r"""
/* hero: centered, different from home's split hero */
.ahero{position:relative;padding:100px 0 80px;text-align:center;overflow:hidden}
.ahero .creds{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:28px}
/* story timeline */
.tl{max-width:820px;margin:60px auto 0;position:relative;padding-left:34px}
.tl::before{content:'';position:absolute;left:8px;top:6px;bottom:6px;width:2px;
  background:linear-gradient(var(--gold),var(--coral),var(--emerald))}
.tstep{position:relative;padding:0 0 44px 26px}
.tstep::before{content:'';position:absolute;left:-34px;top:6px;width:18px;height:18px;border-radius:50%;
  background:var(--paper);border:3px solid var(--coral);translate:8px 0}
.tstep .twhen{font-weight:700;font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--emerald)}
.tstep h3{font-size:1.6rem;margin:6px 0 8px}
.tstep p{color:var(--muted);max-width:620px}
/* believe grid */
.believe{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:22px;margin-top:50px}
.bcard{background:#fff;border-radius:22px;padding:30px 26px;border-top:5px solid var(--accent,#1E6F50);
  box-shadow:0 22px 46px -30px rgba(28,58,42,.35)}
.bcard .bn{font-family:var(--script);font-size:2rem;color:var(--accent,#1E6F50);line-height:1}
.bcard h3{font-size:1.35rem;margin:8px 0 8px}
.bcard p{font-size:.94rem;color:var(--muted)}
/* quote band */
.quoteband{position:relative;overflow:hidden;text-align:center}
.quoteband blockquote{font-family:var(--display);font-style:italic;font-size:clamp(1.7rem,3.6vw,2.7rem);
  line-height:1.35;max-width:880px;margin:0 auto}
.quoteband blockquote span{color:var(--gold)}
.quoteband cite{display:block;margin-top:22px;font-style:normal;font-size:.78rem;font-weight:700;
  letter-spacing:.24em;text-transform:uppercase;color:#cfdcc9}
/* press grid */
.pressgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px;margin-top:44px}
.pressbox{border:1.5px dashed rgba(28,58,42,.25);border-radius:16px;padding:26px 14px;text-align:center;
  font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-size:.78rem;color:var(--muted);
  transition:border-color .2s,color .2s}
.pressbox:hover{border-color:var(--coral);color:var(--ink)}
/* offkilter polaroid strip */
.polas{display:flex;flex-wrap:wrap;gap:26px;justify-content:center;margin-top:54px}
.pola{background:#fff;padding:14px 14px 44px;box-shadow:0 24px 48px -26px rgba(28,58,42,.4);width:220px;
  position:relative;transition:transform .3s}
.pola:nth-child(1){rotate:-4deg}.pola:nth-child(2){rotate:2.5deg}.pola:nth-child(3){rotate:-1.5deg}
.pola:hover{transform:translateY(-8px) rotate(0deg)}
.pola .ppic{aspect-ratio:1;border-radius:4px;display:grid;place-items:center;font-size:2.6rem;
  background:linear-gradient(150deg,var(--tint),var(--rose))}
.pola .pcap{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-family:var(--script);
  font-size:1.35rem;color:var(--muted)}
@media(max-width:700px){.tl{padding-left:26px}}
"""

content = """
<!-- HERO -->
<section class="ahero">
  <div class="ghost" style="top:30px">Victoria</div>
  <div class="wrap" style="position:relative;z-index:1">
    <span class="eyebrow rise">The woman behind the crown</span>
    <h1 class="h-xl rise" style="margin:14px 0 8px">Hi, I&rsquo;m <span class="it hl">Victoria.</span></h1>
    <span class="hand rise">respiratory therapist turned wellness queen</span>
    <p class="lede rise narrow" style="margin:22px auto 0">I spent my career inside renowned San Francisco Bay Area hospitals,
    at the bedside of patients living with complex cardiopulmonary and chronic disease. This site exists because of
    what those years taught me: most of what I treated did not have to happen.</p>
    <div class="creds rise">
      <span class="chip">&#127891; B.S., Bachelor of Science</span>
      <span class="chip">&#129657; RCP, Respiratory Care Practitioner</span>
      <span class="chip">&#128137; RRT, Registered Respiratory Therapist</span>
    </div>
  </div>
</section>

<!-- POLAROIDS (photo slots) -->
<section style="padding-top:0">
  <div class="wrap">
    <!-- CLIENT PHOTO SLOTS: swap .ppic art for real photos of Victoria -->
    <div class="polas">
      <div class="pola rise"><div class="ppic">&#127807;</div><span class="pcap">morning matcha ritual</span></div>
      <div class="pola rise"><div class="ppic">&#129729;</div><span class="pcap">hospital years</span></div>
      <div class="pola rise"><div class="ppic">&#128081;</div><span class="pcap">holistik queen era</span></div>
    </div>
  </div>
</section>

<!-- STORY TIMELINE (TINT) -->
<section class="sec-tint">
  <div class="wrap">
    <div class="center">
      <span class="eyebrow rise">The story</span>
      <h2 class="h-lg rise">From hospital floors<br>to <span class="it hl hl-coral">holistic living</span></h2>
      %(squig)s
    </div>
    <div class="tl">
      <div class="tstep rise"><span class="twhen">The bedside years</span>
        <h3>I cared for lungs and hearts in crisis.</h3>
        <p>As a respiratory therapist across acute and home care settings, I worked with every patient population
        you can imagine. COPD, heart failure, diabetes complications. Real people, most of them women who had
        spent decades putting everyone else first.</p></div>
      <div class="tstep rise"><span class="twhen">The pattern</span>
        <h3>I kept seeing the same preventable story.</h3>
        <p>Chronic disease rarely arrives overnight. It builds quietly through years of stress, sleep debt,
        processed food, and 'I'll deal with it later.' By the time it reached my ventilators, later had run out.
        That truth changed how I saw my own health.</p></div>
      <div class="tstep rise"><span class="twhen">The turn</span>
        <h3>I went upstream.</h3>
        <p>I started applying prevention science to my own life. Simple swaps, not overhauls. Whole food,
        real sleep, calmer stress chemistry, cleaner products. The results convinced me that the best medicine
        happens twenty years before the hospital.</p></div>
      <div class="tstep rise"><span class="twhen">Today</span>
        <h3>Holistik Queen was born.</h3>
        <p>Now I teach women over 40 how to prevent and reverse disease with lifestyle changes that also save
        time and money. Because you deserve to rule your second act with energy to spare.</p></div>
    </div>
  </div>
</section>

<!-- QUOTE BAND (INK) -->
<section class="sec-ink quoteband">
  <div class="ghost" style="bottom:14px">believe</div>
  <div class="wrap" style="position:relative;z-index:1">
    <span class="hand rise" style="font-size:2rem">the whole philosophy in one line</span>
    <blockquote class="rise" style="margin-top:18px">&ldquo;The best time to protect your health was twenty years ago.
    The second best time is <span>before breakfast tomorrow.</span>&rdquo;</blockquote>
    <cite class="rise">Victoria &middot; Holistik Queen</cite>
  </div>
</section>

<!-- WHAT I BELIEVE -->
<section>
  <div class="wrap">
    <div class="center">
      <span class="eyebrow rise">The royal rules</span>
      <h2 class="h-lg rise">What I believe about <span class="it hl">your body</span></h2>
    </div>
    <div class="believe">
      <div class="bcard rise" style="--accent:#1E6F50"><span class="bn">one</span>
        <h3>Prevention beats prescription.</h3><p>Most chronic disease is a slow yes to small habits. Which means a
        slow no works too. Start earlier than feels necessary.</p></div>
      <div class="bcard rise" style="--accent:#E4572E"><span class="bn">two</span>
        <h3>Simple is what survives.</h3><p>The perfect protocol you quit by Thursday loses to the tiny swap you keep
        for a decade. I will always hand you the tiny swap first.</p></div>
      <div class="bcard rise" style="--accent:#C9973E"><span class="bn">three</span>
        <h3>Your wallet is part of your wellness.</h3><p>Health advice that requires a luxury budget is not advice.
        Nearly everything I teach costs less than what it replaces.</p></div>
      <div class="bcard rise" style="--accent:#7C6AA6"><span class="bn">four</span>
        <h3>40+ is a beginning.</h3><p>Midlife is not a decline to manage. It is the moment you finally have the
        self-knowledge to build health that lasts. Crown on.</p></div>
    </div>
  </div>
</section>

<!-- PRESS (TINT) -->
<section class="sec-tint">
  <div class="wrap center">
    <span class="eyebrow rise">Kind of a big deal</span>
    <h2 class="h-lg rise">Featured <span class="it hl hl-coral">around the web</span></h2>
    <div class="pressgrid rise">
      <div class="pressbox">Authority Magazine</div>
      <div class="pressbox">SheFinds</div>
      <div class="pressbox">Carewell</div>
      <div class="pressbox">Mude</div>
      <div class="pressbox">Dreambound</div>
    </div>
  </div>
</section>

<!-- FINAL CTA -->
<section class="sec-ink" style="text-align:center;position:relative;overflow:hidden">
  <div class="ghost" style="top:20px">begin</div>
  <div class="wrap" style="position:relative;z-index:1">
    <span class="hand rise" style="font-size:2.2rem">now that we&rsquo;re besties</span>
    <h2 class="h-xl rise" style="margin:10px 0 18px">Let me hand you<br><span class="shimmer it">the head start.</span></h2>
    <p class="lede rise narrow" style="margin:0 auto 34px">The free Queen&rsquo;s Reset is everything I wish I could have
    handed every patient, years before we met. Seven swaps. Seven days. Zero dollars.</p>
    <div class="rise"><a class="btn btn-coral" href="start-here.html">Start the free reset <span class="arr">&rarr;</span></a></div>
  </div>
</section>
""" % {"squig": SQUIG % "#C9973E"}

page("about.html",
     "About Victoria | Holistik Queen",
     "Meet Victoria, B.S., RCP, RRT: the respiratory therapist behind Holistik Queen, teaching women 40+ to prevent and reverse chronic disease with simple lifestyle changes.",
     content, extra_css=CSS)
