#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Holistik Queen: start-here (freebie funnel) + contact pages."""
from builder import page, faq_html, faq_schema, SQUIG

# ----------------------------------------------------------------- START HERE
SH_FAQS = [
    ("What exactly is the Queen's Reset?",
     "A free 7-day guide. Each day you make one royally simple swap: hydration, breakfast, movement, breath, screens, kitchen, and sleep. Small on purpose, so it works on real weeks, not just perfect ones."),
    ("Do I need to buy supplements or equipment?",
     "No. Every swap uses things you already own. If anything, the reset usually saves money, because the swaps replace pricier habits."),
    ("I have a health condition. Can I still do it?",
     "The swaps are gentle lifestyle basics, but you know your situation best. Read it through, then run anything you are unsure about past your own doctor. This guide is education, not medical advice."),
    ("What happens after the 7 days?",
     "You keep the swaps that earned their place, and the Crown Letter keeps arriving with one new idea a week. Compounding, but for your energy."),
]

SH_CSS = r"""
.shero{position:relative;overflow:hidden;padding:90px 0 100px}
.shero .grid{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
/* signup card */
.signcard{background:#fff;border:1.5px solid var(--ink);border-radius:26px;padding:44px 38px;position:relative;
  box-shadow:14px 14px 0 var(--honey)}
.signcard .ribbon{position:absolute;top:24px;right:-44px;rotate:45deg;background:var(--emerald);color:#fff;
  font-size:.66rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;padding:8px 52px}
.signcard form{display:grid;gap:14px;margin-top:22px}
.signcard .btn{width:100%;justify-content:center}
.freetag{position:absolute;top:-26px;left:30px;background:var(--coral);color:#fff;font-family:var(--script);
  font-size:1.5rem;padding:6px 24px;border-radius:60px;rotate:-3deg;box-shadow:0 14px 30px -12px rgba(228,87,46,.6)}
/* seven swaps */
.swaps{max-width:880px;margin:54px auto 0;counter-reset:sw}
.swap{display:grid;grid-template-columns:auto 1fr auto;gap:22px;align-items:center;background:#fff;
  border-radius:20px;padding:24px 28px;margin-bottom:14px;border:1px solid rgba(28,58,42,.09);
  box-shadow:0 16px 36px -26px rgba(28,58,42,.35);transition:transform .25s}
.swap:hover{transform:translateX(8px)}
.swap .day{counter-increment:sw;flex:none;width:64px;height:64px;border-radius:50%;background:var(--tint);
  display:grid;place-items:center;font-family:var(--display);font-style:italic;font-size:1.5rem;color:var(--emerald)}
.swap .day::before{content:counter(sw)}
.swap h3{font-size:1.4rem}
.swap p{color:var(--muted);font-size:.94rem}
.swap .tag{font-size:.68rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);
  writing-mode:vertical-rl;text-orientation:mixed}
/* paths */
.paths{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;margin-top:50px}
.path{display:block;text-decoration:none;color:var(--paper);border-radius:24px;padding:38px 30px;position:relative;
  overflow:hidden;min-height:280px;background:var(--bg,#1E6F50);transition:transform .3s,box-shadow .3s;
  box-shadow:0 26px 50px -30px rgba(28,58,42,.5)}
.path:hover{transform:translateY(-8px);box-shadow:0 40px 64px -30px rgba(28,58,42,.55)}
.path .pk{font-family:var(--script);font-size:1.6rem;color:rgba(253,249,240,.85)}
.path h3{font-size:1.7rem;margin:8px 0 10px}
.path p{font-size:.93rem;color:rgba(253,249,240,.85)}
.path .go{position:absolute;left:30px;bottom:26px;font-weight:700;font-size:.76rem;letter-spacing:.2em;text-transform:uppercase}
.path::after{content:'\2726';position:absolute;right:-16px;bottom:-30px;font-size:7rem;opacity:.14;font-family:var(--display)}
@media(max-width:900px){.shero .grid{grid-template-columns:1fr}
  .swap{grid-template-columns:auto 1fr}.swap .tag{display:none}}
"""

sh_content = """
<section class="shero">
  <div class="ghost" style="top:26px">start here</div>
  <div class="wrap grid" style="position:relative;z-index:1">
    <div>
      <span class="eyebrow rise">Start here, new friend</span>
      <h1 class="h-xl rise" style="margin:14px 0 10px">Seven days to feeling like <span class="it hl">royalty again.</span></h1>
      <span class="hand rise">the free guide that starts everything</span>
      <p class="lede rise" style="margin-top:18px;max-width:520px">The Queen&rsquo;s Reset is a free 7-day guide: one royally
      simple swap each day for more energy, calmer stress, and better sleep. No supplements, no shopping list,
      no guilt. Built on the prevention science I learned the hard way, at the bedside.</p>
      <div class="proof rise" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:26px">
        <span class="chip">&#9200; 10 minutes a day</span>
        <span class="chip">&#128176; $0, forever</span>
        <span class="chip">&#127807; zero fads</span>
      </div>
    </div>
    <div class="rise" style="position:relative">
      <div class="signcard">
        <span class="freetag">it&rsquo;s free, babe</span>
        <span class="ribbon">Instant access</span>
        <span class="eyebrow">The Queen&rsquo;s Reset</span>
        <h2 class="h-md" style="margin:10px 0 8px">Claim your crown&rsquo;s first polish.</h2>
        <p class="muted" style="font-size:.95rem">Pop your details below and the guide lands in your inbox,
        along with the weekly Crown Letter.</p>
        <!-- WAITING ON CLIENT: replace with real Flodesk embed; FormSubmit needs one-time activation click -->
        <form action="https://formsubmit.co/hello@holistikqueen.com" method="POST">
          <input type="hidden" name="_subject" value="Queen's Reset signup">
          <input type="hidden" name="_captcha" value="false">
          <input type="hidden" name="_template" value="table">
          <input type="hidden" name="_next" value="https://www.holistikqueen.com/start-here.html?sent=1">
          <div><label class="flabel" for="shname">First name</label>
            <input class="field" id="shname" name="name" required placeholder="Your name"></div>
          <div><label class="flabel" for="shemail">Email</label>
            <input class="field" id="shemail" type="email" name="email" required placeholder="you@example.com"></div>
          <button class="btn btn-coral" type="submit">Send me the reset &#10022;</button>
        </form>
        <p class="muted" style="font-size:.78rem;margin-top:12px;text-align:center">Unsubscribe anytime. Your inbox, your queendom.</p>
      </div>
    </div>
  </div>
</section>

<section class="sec-tint">
  <div class="wrap">
    <div class="center">
      <span class="eyebrow rise">A peek inside</span>
      <h2 class="h-lg rise">Seven swaps, <span class="it hl hl-coral">one per day</span></h2>
      %(squig)s
      <p class="lede rise narrow" style="margin:16px auto 0">Here is the whole plan, no gatekeeping. The guide adds the
      why, the exact how, and the little tweaks that make each swap stick.</p>
    </div>
    <div class="swaps">
      <div class="swap rise"><span class="day"></span><div><h3>The dawn drink</h3><p>Water before caffeine. One glass, before anything else, and your afternoon self stops crashing so hard.</p></div><span class="tag">hydrate</span></div>
      <div class="swap rise"><span class="day"></span><div><h3>The protein-first breakfast</h3><p>Front-load protein and watch the 3pm cookie negotiation quietly cancel itself.</p></div><span class="tag">fuel</span></div>
      <div class="swap rise"><span class="day"></span><div><h3>The ten-minute reign walk</h3><p>A short daily walk, ideally after a meal. The single most underrated blood sugar tool in existence.</p></div><span class="tag">move</span></div>
      <div class="swap rise"><span class="day"></span><div><h3>The 4-6 breath</h3><p>In for four, out for six, five times. Borrowed straight from respiratory therapy, and it works in traffic.</p></div><span class="tag">breathe</span></div>
      <div class="swap rise"><span class="day"></span><div><h3>The sundown screen rule</h3><p>Screens down before the crown comes off. Your sleep architecture will send a thank-you note.</p></div><span class="tag">unplug</span></div>
      <div class="swap rise"><span class="day"></span><div><h3>The one-label kitchen swap</h3><p>Replace one ultra-processed staple with a real-food version. One. That is how kitchens actually change.</p></div><span class="tag">nourish</span></div>
      <div class="swap rise"><span class="day"></span><div><h3>The royal bedtime</h3><p>A consistent lights-out, even on weekends. Sleep is when your body does its repairs. Let the crew work.</p></div><span class="tag">rest</span></div>
    </div>
    <div class="center" style="margin-top:34px">
      <span class="hand rise">the guide makes each one effortless</span>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="center">
      <span class="eyebrow rise">After the reset</span>
      <h2 class="h-lg rise">Choose your <span class="it hl">next path</span></h2>
    </div>
    <div class="paths">
      <a class="path rise" href="holistic-health.html" style="--bg:#1E6F50"><span class="pk">for the body</span>
        <h3>Holistic Health</h3><p>Prevention deep-dives: blood sugar, blood pressure, lungs, hormones, and the habits that guard them.</p>
        <span class="go">Walk this way &rarr;</span></a>
      <a class="path rise" href="clean-eating.html" style="--bg:#6B8F3C"><span class="pk">for the kitchen</span>
        <h3>Clean Eating</h3><p>Label literacy, easy real-food swaps, and meals that love your future self back.</p>
        <span class="go">Walk this way &rarr;</span></a>
      <a class="path rise" href="mindful-wellness.html" style="--bg:#7C6AA6"><span class="pk">for the mind</span>
        <h3>Mindful Wellness</h3><p>Stress chemistry, sleep, and breathwork from an actual breathing professional.</p>
        <span class="go">Walk this way &rarr;</span></a>
    </div>
  </div>
</section>

<section class="sec-tint">
  <div class="wrap">
    <div class="center" style="margin-bottom:40px">
      <span class="eyebrow rise">Reset questions</span>
      <h2 class="h-lg rise">Asked and <span class="it hl hl-coral">answered</span></h2>
    </div>
    %(faq)s
  </div>
</section>

<section class="sec-ink" style="text-align:center;position:relative;overflow:hidden">
  <div class="ghost" style="top:20px">day one</div>
  <div class="wrap" style="position:relative;z-index:1">
    <span class="hand rise" style="font-size:2.2rem">your future self is watching, babe</span>
    <h2 class="h-xl rise" style="margin:10px 0 18px">Day one is<br><span class="shimmer it">one scroll up.</span></h2>
    <div class="rise" style="margin-top:26px"><a class="btn btn-coral" href="#top" onclick="scrollTo({top:0,behavior:'smooth'});return false">Take me to the form <span class="arr">&uarr;</span></a></div>
  </div>
</section>
""" % {"squig": SQUIG % "#C9973E", "faq": faq_html(SH_FAQS)}

page("start-here.html",
     "Start Here: The Free Queen's Reset | Holistik Queen",
     "Get the free Queen's Reset: 7 royally simple swaps in 7 days for more energy, calmer stress, and better sleep after 40. No supplements, no fads, no cost.",
     sh_content, extra_css=SH_CSS, schema=faq_schema(SH_FAQS))

# ------------------------------------------------------------------- CONTACT
CT_CSS = r"""
.chero{padding:90px 0 60px;text-align:center;position:relative;overflow:hidden}
.cgrid{display:grid;grid-template-columns:1.1fr .9fr;gap:50px;align-items:start;margin-top:20px}
.cform{background:#fff;border:1.5px solid var(--ink);border-radius:26px;padding:44px 38px;
  box-shadow:14px 14px 0 var(--rose)}
.cform form{display:grid;gap:16px;margin-top:10px}
.cform textarea{min-height:150px;resize:vertical}
.cside .card{margin-bottom:20px}
.cside h3{font-size:1.35rem;margin-bottom:6px}
.cside p{font-size:.94rem;color:var(--muted)}
.sentnote{display:none;background:var(--tint);border:1.5px solid var(--emerald);border-radius:16px;
  padding:16px 20px;margin-bottom:18px;font-weight:600;color:var(--emerald)}
.sentnote.show{display:block}
@media(max-width:900px){.cgrid{grid-template-columns:1fr}}
"""

CT_JS = r"""
(function(){
  if(location.search.indexOf('sent=1')>-1){
    var n=document.getElementById('sentnote');if(n)n.classList.add('show');
    n.scrollIntoView({block:'center'});}
})();
"""

ct_content = """
<section class="chero">
  <div class="ghost" style="top:26px">hello</div>
  <div class="wrap" style="position:relative;z-index:1">
    <span class="eyebrow rise">The royal mailbox</span>
    <h1 class="h-xl rise" style="margin:14px 0 8px">Say <span class="it hl">hello.</span></h1>
    <span class="hand rise">I read every single note, babe</span>
    <p class="lede rise narrow" style="margin:18px auto 0">Questions about an article, a topic you want covered,
    press and partnership inquiries, or just a hello from one queen to another. The form goes straight to me.</p>
  </div>
</section>

<section style="padding-top:20px">
  <div class="wrap cgrid">
    <div class="rise">
      <div class="cform">
        <div class="sentnote" id="sentnote">&#10003; Sent! Your note is on its way to Victoria. Expect a reply within a few days.</div>
        <span class="eyebrow">Drop a note</span>
        <!-- WAITING ON CLIENT: confirm inbox address; FormSubmit needs its one-time activation click -->
        <form action="https://formsubmit.co/hello@holistikqueen.com" method="POST">
          <input type="hidden" name="_subject" value="New note from holistikqueen.com">
          <input type="hidden" name="_captcha" value="false">
          <input type="hidden" name="_template" value="table">
          <input type="hidden" name="_next" value="https://www.holistikqueen.com/contact.html?sent=1">
          <div><label class="flabel" for="cname">Name</label>
            <input class="field" id="cname" name="name" required placeholder="Your name"></div>
          <div><label class="flabel" for="cemail">Email</label>
            <input class="field" id="cemail" type="email" name="email" required placeholder="you@example.com"></div>
          <div><label class="flabel" for="ctopic">What is this about?</label>
            <select class="field" id="ctopic" name="topic">
              <option>A question about an article</option>
              <option>A topic I would love you to cover</option>
              <option>Press or partnership</option>
              <option>Just saying hi</option>
            </select></div>
          <div><label class="flabel" for="cmsg">Your note</label>
            <textarea class="field" id="cmsg" name="message" required placeholder="Tell me everything..."></textarea></div>
          <button class="btn btn-coral" type="submit">Send it to the palace <span class="arr">&rarr;</span></button>
        </form>
      </div>
    </div>
    <div class="cside">
      <div class="card rise"><h3>&#128231; Prefer the DMs?</h3>
        <p>I hang out on Instagram and Threads as <strong>@holistikqueen</strong>. Come say hi, the door is always open.</p>
        <p style="margin-top:12px"><a class="btn btn-ghost" href="https://www.instagram.com/holistikqueen/" target="_blank" rel="noopener" style="padding:12px 24px;font-size:.85rem">Instagram &rarr;</a></p></div>
      <div class="card rise"><h3>&#128240; Press &amp; features</h3>
        <p>Holistik Queen has been featured in Authority Magazine, SheFinds, Carewell, Mude, and Dreambound.
        For interviews and expert quotes on holistic health for women 40+, use the form and pick 'Press or partnership.'</p></div>
      <div class="card rise"><h3>&#9813; New around here?</h3>
        <p>The best first step is the free Queen&rsquo;s Reset. Seven simple swaps, seven days, and a very good week.</p>
        <p style="margin-top:12px"><a class="btn btn-coral" href="start-here.html" style="padding:12px 24px;font-size:.85rem">Get the free reset &rarr;</a></p></div>
    </div>
  </div>
</section>

<section class="sec-ink" style="text-align:center;position:relative;overflow:hidden">
  <div class="ghost" style="top:20px">stay close</div>
  <div class="wrap" style="position:relative;z-index:1">
    <span class="hand rise" style="font-size:2.2rem">while you&rsquo;re here</span>
    <h2 class="h-lg rise" style="margin:10px 0 18px">Join <span class="shimmer it">the Crown Letter.</span></h2>
    <p class="lede rise narrow" style="margin:0 auto 30px">One short weekly letter with the swap of the week.
    There are some things I only share with my subscribers. Don&rsquo;t miss out.</p>
    <div class="rise"><a class="btn btn-coral" href="start-here.html">Subscribe free <span class="arr">&rarr;</span></a></div>
  </div>
</section>
"""

page("contact.html",
     "Contact | Holistik Queen",
     "Get in touch with Victoria at Holistik Queen: article questions, topic requests, press and partnership inquiries, or just a royal hello.",
     ct_content, extra_css=CT_CSS, extra_js=CT_JS)
