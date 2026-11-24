"""Builds site/_pages/futureproof-replay.html: the Futureproof Your Blog masterclass replay page, in The Futureproof
Blogger brand, from Genasys's replay page art direction. Wording comes from that mockup and from copy she already
approved (the three ways to work together, The BOSS Business Experience). The replay video is a TO FILL IN slot.
Run: python3 scripts/gen_futureproof_replay_page.py"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pf_parts import *
from fp_parts import orbit, THEME

# Paste the replay's YouTube video ID (or leave empty to show the TO FILL IN box)
REPLAY_YOUTUBE_ID = ""

EXTRA2 = r'''<style>
.fpb .topbar{display:flex;justify-content:space-between;align-items:center;padding:14px clamp(16px,4vw,48px);background:#16121f;font:600 11px/1 var(--font-label);letter-spacing:.2em;text-transform:uppercase;color:#D9CDE7}
.fpb .lock{text-align:center;margin:0;font:italic 400 clamp(40px,5.4vw,72px)/1 var(--font-display);color:#fff}
.fpb .player{position:relative;aspect-ratio:16/9;background:#16121f;border:1px solid rgba(217,205,231,.25);overflow:hidden;display:grid;place-items:center}
.fpb .player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.fpb .player .orbit{position:absolute;width:70%;color:var(--amethyst);opacity:.45}
.fpb .player .pf-slot{position:relative;z-index:2;max-width:460px;margin:16px}
.fpb .ways3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.fpb .w3{padding:clamp(22px,3vw,32px);display:flex;flex-direction:column;gap:12px;background:#fff;border:1px solid rgba(33,28,44,.12)}
.fpb .w3.lead{background:var(--orchid);color:var(--pearl);border-color:var(--orchid)}
.fpb .w3 .k{font:italic 400 clamp(26px,2.6vw,34px)/1.1 var(--font-display);color:var(--orchid)}
.fpb .w3.lead .k{color:#fff}
.fpb .w3 .nm{font:600 11px/1.4 var(--font-label);letter-spacing:.2em;text-transform:uppercase;color:var(--amethyst)}
.fpb .w3.lead .nm{color:var(--flilac)}
.fpb .w3 p.d{margin:0;font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.fpb .w3.lead p.d{color:#D8D2E2}
.fpb .w3 .pf-btn{margin-top:auto;align-self:flex-start}
@media (max-width:980px){.fpb .ways3{grid-template-columns:minmax(0,1fr)}}
</style>'''

video = (f'<iframe src="https://www.youtube-nocookie.com/embed/{REPLAY_YOUTUBE_ID}?rel=0&modestbranding=1" title="Futureproof Your Blog masterclass replay" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
         if REPLAY_YOUTUBE_ID else orbit() + slot("Your Futureproof Your Blog replay video. Send me the YouTube link and it plays right here."))

o = [CSS, THEME, EXTRA2, '<main id="main" class="pf fpb">']
o.append('<div class="topbar"><span>Futureproof.</span><span>Masterclass replay</span></div>')
o.append(f'''<section class="orc dk" style="padding-top:clamp(48px,6vw,80px)"><div class="in stack" style="gap:24px;max-width:1040px">
<p class="lbl" style="text-align:center">Your free masterclass replay</p>
<p class="lock">Futureproof Your Blog.</p>
<div class="player">{video}</div>
<p class="issue" style="text-align:center;color:#D9CDE7">Watch the complete masterclass.</p>
</div></section>''')
o.append('''<section class="lavbg"><div class="nar stack" style="gap:16px">
<p class="lbl">Your next step</p>
<h2>Understanding the strategy is one thing. <em>Building the business is another.</em></h2>
<p class="big">Let&rsquo;s apply what you&rsquo;ve learned to your actual business.</p></div></section>''')
# Three ways to work together: Genasys's approved homepage copy
o.append(f'''<section style="background:#F6F3F8"><div class="in stack" style="gap:28px">
<div class="ways3">
<article class="w3 lead"><p class="nm">Private coaching &amp; custom website design</p><p class="k">The BOSS Business Experience.</p><p class="d">Your 12 month private business development and growth partnership.</p><p class="d">Work with me privately to develop your business strategy, offers, brand, website and sales foundations.</p>{btn("Apply for a Fast Track Call", APPLY_PAGE, "")}{btn("Explore The BOSS Business Experience", COACH, "olw")}</article>
<article class="w3"><p class="nm">Follow my system</p><p class="k">The Blogging Ladies Membership.</p><p class="d">Learn the complete strategic process behind building a profitable blogging business, with practical projects, roadmaps and action plans to help you implement it independently.</p><p class="d" style="font:400 30px/1 var(--font-display);color:#211C2C">$47<span style="font-size:.5em;color:#69577F">/month</span></p>{btn("Explore the Membership", "/membership/", "ol")}</article>
<article class="w3"><p class="nm">Learn from me</p><p class="k">The Futureproof Blogger.</p><p class="d">Build a business for where the internet is going, not just where it&rsquo;s been.</p><p class="d">Or unlock the complete BOSS Academy collection with All Access.</p>{btn("Enter the Next Era", "/futureproof-blogger/", "ol")}</article>
</div></div></section>''')
o.append(f'''<section class="portal orc dk">{orbit()}<div class="nar stack" style="gap:22px;align-items:center">
<div class="lines"><p>The future is female.</p><p>And she&rsquo;s building it.</p></div></div></section>''')
o.append(LEGAL + "</main>")
out = "\n".join(o)
for bad in ["—", "–", "…"]: assert bad not in out, bad
(ROOT / "futureproof-replay.html").write_text(out)
print("wrote futureproof-replay.html", len(out))
