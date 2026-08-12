#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Holistik Queen: the five topic pillar pages, one template, per-pillar data."""
from builder import page, SQUIG

CSS_TMPL = r"""
.phero{position:relative;overflow:hidden;padding:100px 0 90px;background:
  linear-gradient(180deg,color-mix(in srgb,ACCENT 10%,var(--paper)),var(--paper))}
.phero .kicker{display:inline-flex;align-items:center;gap:12px}
.phero .kicker .dotline{width:60px;height:2px;background:ACCENT}
.phero .eyebrow{color:ACCENT}
.phero .grid{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center}
.phero .emblem{width:100%;max-width:340px;aspect-ratio:1;margin:0 auto;border-radius:50% 50% 26px 26px;
  background:linear-gradient(160deg,color-mix(in srgb,ACCENT 30%,#fff),color-mix(in srgb,ACCENT 70%,var(--ink)));
  display:grid;place-items:center;font-size:6rem;box-shadow:0 36px 66px -36px color-mix(in srgb,ACCENT 70%,#000);
  position:relative}
.phero .emblem::after{content:'';position:absolute;inset:16px;border-radius:inherit;
  border:1.5px dashed rgba(253,249,240,.55)}
/* find grid */
.finds{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:22px;margin-top:50px}
.find{background:#fff;border-radius:22px;padding:32px 28px;border:1px solid rgba(28,58,42,.08);
  border-bottom:5px solid ACCENT;box-shadow:0 22px 46px -30px rgba(28,58,42,.35);transition:transform .3s}
.find:hover{transform:translateY(-6px)}
.find .fi{width:52px;height:52px;border-radius:16px;background:color-mix(in srgb,ACCENT 14%,#fff);
  display:grid;place-items:center;font-size:1.5rem;margin-bottom:16px}
.find h3{font-size:1.4rem;margin-bottom:8px}
.find p{font-size:.93rem;color:var(--muted)}
/* starter reads */
.reads{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-top:50px}
.read{background:#fff;border-radius:22px;overflow:hidden;border:1px solid rgba(28,58,42,.09);
  box-shadow:0 22px 46px -30px rgba(28,58,42,.35);display:flex;flex-direction:column;transition:transform .3s}
.read:hover{transform:translateY(-6px) rotate(-.4deg)}
.read .rimg{width:100%;aspect-ratio:16/9;background:linear-gradient(140deg,color-mix(in srgb,ACCENT 22%,#fff),color-mix(in srgb,ACCENT 55%,var(--tint)));
  display:grid;place-items:center;font-size:2.4rem}
.read .rbody{padding:24px 26px 28px;display:flex;flex-direction:column;gap:10px;flex:1}
.read .rtag{font-size:.66rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:ACCENT}
.read h3{font-size:1.32rem;line-height:1.25}
.read p{font-size:.9rem;color:var(--muted);flex:1}
.read .soon{align-self:flex-start;background:var(--honey);border-radius:60px;padding:6px 16px;
  font-size:.72rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
/* tip band */
.tipband{position:relative;overflow:hidden}
.tipband .tipcard{max-width:820px;margin:0 auto;text-align:center;position:relative;z-index:1}
.tipband .tiplabel{display:inline-block;background:ACCENT;color:#fff;border-radius:60px;padding:9px 24px;
  font-size:.72rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase;margin-bottom:22px}
.tipband .tiptext{font-family:var(--display);font-style:italic;font-size:clamp(1.6rem,3.2vw,2.4rem);line-height:1.4}
/* other topics chips */
.others{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:34px}
.others a{text-decoration:none;border:1.5px solid rgba(28,58,42,.25);border-radius:60px;padding:12px 24px;
  font-weight:600;font-size:.88rem;transition:border-color .2s,background .2s,color .2s}
.others a:hover{border-color:ACCENT;background:ACCENT;color:#fff}
@media(max-width:900px){.phero .grid{grid-template-columns:1fr}}
"""

PILLARS = [
    dict(slug="holistic-health", accent="#1E6F50", icon="&#127811;", name="Holistic Health",
         kicker="Crown jewel no. 1", script="the body you'll live in for decades",
         head='Health that <span class="it hl">holds the throne</span>',
         lede="Chronic disease takes decades to build, which means you have decades to interrupt it. This is the prevention playbook: what actually protects your heart, lungs, blood sugar, and hormones after 40, from someone who treated what happens when nobody tells you.",
         finds=[
             ("&#129728;", "Prevention deep-dives", "What the research really says about preventing and reversing the big ones: type 2 diabetes, hypertension, COPD, and more."),
             ("&#129657;", "Clinician-level clarity", "Victoria translates hospital-grade knowledge into plain English, so you understand your body and your labs."),
             ("&#128202;", "Know your numbers", "Blood pressure, A1C, waist-to-height. Which numbers matter, what they mean, and how lifestyle moves them."),
         ],
         reads=[
             ("Prevention", "&#10084;", "The five numbers every woman over 40 should know by heart", "Your health dashboard in five values, and the lifestyle levers behind each one."),
             ("Breath", "&#127788;", "A respiratory therapist's guide to breathing like you mean it", "The 4-6 breath, why mouth breathing sabotages sleep, and lung care nobody teaches."),
             ("Reversal", "&#127793;", "What 'reversing' a diagnosis really means (and what it doesn't)", "The honest version of lifestyle reversal: where it shines, and where medicine matters."),
         ],
         tip="Your body is not betraying you at 40. It is finally speaking loudly enough for you to hear it. Listen early, act small, and the big interventions may never be needed."),
    dict(slug="clean-eating", accent="#6B8F3C", icon="&#129361;", name="Clean Eating",
         kicker="Crown jewel no. 2", script="real food, zero drama",
         head='Eat like a queen,<br><span class="it hl">not a chemist</span>',
         lede="If a snack needs a decoder ring, it is not a snack, it is a science project. Clean eating here means fewer ultra-processed foods, more real ones, and swaps so painless your taste buds barely file a complaint. No guilt, no 30-ingredient recipes, no $18 powders.",
         finds=[
             ("&#128269;", "Label literacy", "How to read an ingredient list in ten seconds and spot the sugar hiding under six aliases."),
             ("&#128260;", "One-for-one swaps", "The exact real-food upgrade for your pantry staples, ranked by how much they matter."),
             ("&#9201;", "Fast, real meals", "Blood-sugar-friendly meals for women with full calendars and zero interest in meal-prep Sundays."),
         ],
         reads=[
             ("Pantry", "&#129365;", "The one-label kitchen: seven swaps that upgrade every meal", "Change what is in the cupboard once, and every future meal improves automatically."),
             ("Sugar", "&#127852;", "Sugar's six favorite disguises (and how to spot them in the wild)", "Evaporated cane juice is still sugar wearing a linen suit. Here is the full costume list."),
             ("Protein", "&#127859;", "Protein after 40: why your breakfast is the whole ballgame", "Muscle, metabolism, and the 3pm crash all trace back to your first plate of the day."),
         ],
         tip="You do not need a perfect diet. You need a kitchen where the easy choice and the healthy choice are the same choice. Build that once and coast on it forever."),
    dict(slug="mindful-wellness", accent="#7C6AA6", icon="&#129496;", name="Mindful Wellness",
         kicker="Crown jewel no. 3", script="calm is a skill, not a personality",
         head='A nervous system that<br><span class="it hl">finally exhales</span>',
         lede="Stress chemistry is not a mood, it is physiology, and after 40 it stops being subtle. This pillar covers sleep, stress, and breathwork from an actual breathing professional, so you can trade wired-and-tired for genuinely rested.",
         finds=[
             ("&#128564;", "Sleep architecture", "Why seven hours can still leave you exhausted, and the levers that make sleep actually restorative."),
             ("&#127744;", "Stress chemistry", "What cortisol is really doing to your blood sugar, belly, and brain, and the daily off-switches."),
             ("&#127788;", "Breathwork that works", "RT-approved breathing patterns for panic moments, bedtime, and that one coworker."),
         ],
         reads=[
             ("Breath", "&#128168;", "The 4-6 breath: the reset button you carry everywhere", "Five rounds, sixty seconds, parasympathetic system engaged. Learn it once, use it forever."),
             ("Sleep", "&#127769;", "The royal bedtime: why consistency beats duration", "Same lights-out every night trains your circadian rhythm better than any supplement."),
             ("Stress", "&#9749;", "Cortisol and the 3pm crash: the loop nobody explains", "Stress, sugar, slump, repeat. Here is the loop, and the three places you can cut it."),
         ],
         tip="You cannot think your way out of a stress response, but you can breathe your way out. The exhale is the only part of your nervous system with a manual override. Use it."),
    dict(slug="eco-beauty", accent="#C96F5E", icon="&#127802;", name="Eco Beauty",
         kicker="Crown jewel no. 4", script="glow without the fine print",
         head='Beauty without the<br><span class="it hl">toxic fine print</span>',
         lede="Your skin is an organ, not a billboard, and it absorbs more than compliments. Eco beauty here means cleaner products, simpler routines, and swaps that are kinder to your body, your budget, and the planet. Radiance included, greenwashing not.",
         finds=[
             ("&#129514;", "Ingredient intel", "The shortlist of ingredients worth avoiding, minus the fear-mongering, plus the science."),
             ("&#128459;", "Greenwash radar", "'Natural' means nothing on a label. Learn the claims that matter and the ones that are marketing."),
             ("&#128142;", "Fewer, better products", "The skin barrier loves a short routine. Build a five-product shelf that outperforms the fifteen."),
         ],
         reads=[
             ("Skin", "&#129344;", "The five-product shelf: a minimalist routine for skin over 40", "Cleanser, moisturizer, SPF, and two extras that earn their spot. That is the routine."),
             ("Swaps", "&#127807;", "Ten bathroom swaps, ranked by impact (start with number one)", "Not all clean swaps matter equally. Here is the honest priority order."),
             ("Labels", "&#128269;", "What 'fragrance' is legally allowed to hide", "One word on the label, dozens of compounds behind it. What to look for instead."),
         ],
         tip="Simple is the most underrated beauty ingredient. A five-product routine you love beats a fifteen-step ritual you abandon, and your skin barrier agrees."),
    dict(slug="conscious-lifestyle", accent="#C9973E", icon="&#127793;", name="Conscious Lifestyle",
         kicker="Crown jewel no. 5", script="a home that works for your health",
         head='A life designed<br><span class="it hl">on purpose</span>',
         lede="Wellness does not stop at your plate. The air in your home, the products under your sink, the stuff in your schedule: it all counts. Conscious lifestyle is about small intentional choices that pay you back in health, money, and time.",
         finds=[
             ("&#127968;", "Healthier home", "Indoor air, cookware, cleaning products. The home upgrades that matter most, in order."),
             ("&#128184;", "Wellness that saves money", "Most of what protects your health costs less than what it replaces. The receipts are here."),
             ("&#9200;", "Time-back systems", "Routines and defaults that quietly remove decisions, so healthy runs on autopilot."),
         ],
         reads=[
             ("Home", "&#127788;", "The air in your house: a respiratory therapist's home audit", "Ventilation, candles, cooking fumes. What actually affects your lungs indoors."),
             ("Money", "&#128176;", "The wellness swaps that pay for themselves in 30 days", "Health advice that saves money is rare. Here are the swaps with receipts."),
             ("Habits", "&#128257;", "Default settings: the lazy person's guide to a healthy life", "Design your environment once, and discipline becomes optional."),
         ],
         tip="Motivation is a guest, environment is family. Set up your home so the healthy option is the default option, and you will never need willpower at 9pm again."),
]

def build(p, all_pillars):
    css = CSS_TMPL.replace("ACCENT", p["accent"])
    finds = "".join('<div class="find rise"><div class="fi">%s</div><h3>%s</h3><p>%s</p></div>' % f
                    for f in p["finds"])
    reads = "".join(
        '<article class="read rise"><div class="rimg">%s</div><div class="rbody">'
        '<span class="rtag">%s</span><h3>%s</h3><p>%s</p>'
        '<span class="soon">Article coming soon</span></div></article>' % (ic, tag, t, d)
        for tag, ic, t, d in p["reads"])
    others = "".join('<a href="%s.html">%s %s</a>' % (o["slug"], o["icon"], o["name"])
                     for o in all_pillars if o["slug"] != p["slug"])
    content = """
<section class="phero">
  <div class="ghost" style="top:26px">%(name)s</div>
  <div class="wrap grid" style="position:relative;z-index:1">
    <div>
      <span class="kicker rise"><span class="eyebrow">%(kicker)s</span><span class="dotline"></span></span>
      <h1 class="h-xl rise" style="margin:16px 0 10px">%(head)s</h1>
      <span class="hand rise">%(script)s</span>
      <p class="lede rise" style="margin-top:18px;max-width:560px">%(lede)s</p>
      <div class="rise" style="display:flex;flex-wrap:wrap;gap:16px;margin-top:30px">
        <a class="btn btn-coral" href="start-here.html">Get the free Queen&rsquo;s Reset <span class="arr">&rarr;</span></a>
        <a class="btn btn-ghost" href="index.html">All topics</a>
      </div>
    </div>
    <div class="rise"><div class="emblem">%(icon)s</div></div>
  </div>
</section>

<section style="padding-top:80px">
  <div class="wrap">
    <div class="center">
      <span class="eyebrow rise" style="color:%(accent)s">Inside this pillar</span>
      <h2 class="h-lg rise">What you&rsquo;ll find here</h2>
      %(squig)s
    </div>
    <div class="finds">%(finds)s</div>
  </div>
</section>

<section class="sec-tint">
  <div class="wrap">
    <div class="center">
      <span class="eyebrow rise" style="color:%(accent)s">Starter reads</span>
      <h2 class="h-lg rise">Begin with <span class="it hl">these three</span></h2>
      <p class="lede rise narrow" style="margin:16px auto 0">The library is being polished for the new site.
      Join the Crown Letter and these land in your inbox the moment they go live.</p>
    </div>
    <div class="reads">%(reads)s</div>
  </div>
</section>

<section class="sec-ink tipband">
  <div class="ghost" style="bottom:12px">wisdom</div>
  <div class="wrap tipcard">
    <span class="tiplabel rise">Victoria&rsquo;s rule of thumb</span>
    <p class="tiptext rise">&ldquo;%(tip)s&rdquo;</p>
  </div>
</section>

<section>
  <div class="wrap center">
    <span class="eyebrow rise" style="color:%(accent)s">Keep exploring</span>
    <h2 class="h-md rise">The other crown jewels</h2>
    <div class="others rise">%(others)s</div>
    <div class="rise" style="margin-top:44px">
      <span class="hand" style="display:block;margin-bottom:14px">or start with the freebie, babe</span>
      <a class="btn btn-coral" href="start-here.html">Claim the Queen&rsquo;s Reset <span class="arr">&rarr;</span></a>
    </div>
  </div>
</section>
""" % dict(p, finds=finds, reads=reads, others=others, squig=SQUIG % p["accent"])

    page(p["slug"] + ".html",
         "%s | Holistik Queen" % p["name"],
         ("%s for women 40+: " % p["name"]) + p["lede"][:120].rsplit(" ", 1)[0] + "...",
         content, extra_css=css)

for p in PILLARS:
    build(p, PILLARS)
