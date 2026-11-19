"""Fearless Business Boss site builder.

Shared skeleton for every page (Boss Lady Bloggers playbook, Phase 2):
tokens, announcement banner, nav + pull-out menu, footer, loader and the
standard JS. Every page script imports page() from here, so a fix made
here reaches every page on the next rebuild. Never patch the generated
.html files by hand: port the patch back into this file.

Output: <page>.html in this folder plus a .txt copy in deliverables/
(the .txt is what gets pasted into the Showit embed block).
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
BRANCH = "claude/sharp-rubin-nleft3"
IMG = ("https://raw.githubusercontent.com/genasbury12/blb-site/"
       + BRANCH + "/clients/fearless-business-boss/images/")

# ---- business facts (one place, edited once) -------------------------
SITE = "https://fearlessbusinessboss.com"
CALL_URL = "https://scheduler.zoom.us/fearlessboss/1-on-1-mini-coaching-session-"
CALL_NAME = "Hand-Off Plan Call"
CTA = "Book my free Hand-Off Plan call"
EMAIL = "info@fearlessbusinessboss.com"
SOCIAL = {
    "Facebook": "https://www.facebook.com/FearlessBusinessBoss/",
    "Instagram": "https://www.instagram.com/fearlessbusinessboss",
    "LinkedIn": "https://www.linkedin.com/in/tammydurden/",
}
PRIVACY = "https://www.iubenda.com/privacy-policy/31543086"
TERMS = "https://www.iubenda.com/terms-and-conditions/31543086"

# drawer menu: (label, url, small note)
MENU = [
    ("Home", "/", "Start at the beginning"),
    ("Start Here", "/start-here", "New? Read this first"),
    ("About Tammy", "/about", "18 years, one big why"),
    ("1:1 Coaching", "/coaching", "Business Freedom Coaching"),
    ("The Mastermind", "/mastermind", "Monthly membership"),
    ("Pricing Intensive", "/pricing-intensive", "One session, new prices"),
    ("Resources", "/resources", "Free checklists + tools"),
    ("Blog", "/blog", "Weekly articles"),
    ("Podcast", "/podcast", "Listen in"),
    ("YouTube", "/youtube", "Watch Tammy teach"),
    ("Contact", "/contact", "Say hello"),
]

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700'
         '&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap" rel="stylesheet">')

# ---- base CSS --------------------------------------------------------
BASE_CSS = r"""
:root{
  --paper:#F7F9FC; --tint:#EBF1FA; --sky:#D9E6FB;
  --ink:#0E1B3A; --ink2:#16295A; --text:#1B2846; --muted:#56637F; --line:#D5DEEC;
  --blue:#2456D3; --blue2:#1A3D96; --btn1:#2F6BEA; --btn2:#1E48B8;
  --teal:#1497B4; --gold:#C2A15A; --gold2:#E7D6A8;
  --serif:'Playfair Display',Georgia,'Times New Roman',serif;
  --sans:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
  --r:22px; --shadow:0 30px 60px -30px rgba(14,27,58,.35),0 10px 24px -12px rgba(14,27,58,.18);
}
*,*:before,*:after{box-sizing:border-box}
html,body{margin:0;padding:0;overflow-x:hidden;overflow-x:clip}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{background:var(--paper);color:var(--text);font-family:var(--sans);font-variant-numeric:lining-nums;font-size:18px;line-height:1.65;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:var(--blue)}
h1,h2,h3,h4{font-family:var(--serif);font-weight:600;color:var(--ink);line-height:1.12;margin:0 0 .5em;letter-spacing:-.01em}
h1{font-size:clamp(40px,5.6vw,74px)}
h2{font-size:clamp(32px,4vw,52px)}
h3{font-size:clamp(22px,2.2vw,28px)}
p{margin:0 0 1em}
em.ac,.ac{font-style:italic;color:var(--blue)}
.wrap{width:min(1200px,92vw);margin:0 auto;position:relative}
.narrow{width:min(820px,92vw);margin:0 auto;position:relative}
section{position:relative;overflow:hidden;padding:clamp(72px,9vw,128px) 0}
.sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.skip{position:absolute;left:-999px;top:8px;z-index:999;background:var(--ink);color:#fff;padding:10px 16px;border-radius:10px}
.skip:focus{left:8px}
:focus-visible{outline:3px solid var(--teal);outline-offset:3px;border-radius:6px}

/* eyebrow + hand note */
.eyebrow{display:inline-flex;align-items:center;gap:10px;font:700 13px/1.45 var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--blue2);margin-bottom:18px}
.eyebrow:before{content:"";width:26px;height:2px;background:var(--gold)}
.on-ink .eyebrow{color:var(--gold2)}
.note{font-family:var(--serif);font-style:italic;color:var(--muted);font-size:clamp(19px,1.8vw,23px)}
.lead{font-size:clamp(19px,1.6vw,21px);color:var(--muted);max-width:640px}
.on-ink{background:var(--ink);color:#DCE4F3}
.on-ink h1,.on-ink h2,.on-ink h3{color:#fff}
.on-ink .ac{color:#9DBBFF}
.on-ink .lead,.on-ink .note{color:#B9C6E0}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:56px;padding:16px 30px;border-radius:60px;border:0;cursor:pointer;
  background:linear-gradient(135deg,var(--btn1),var(--btn2));color:#fff;font:700 15px/1.2 var(--sans);letter-spacing:.06em;text-transform:uppercase;text-decoration:none;
  box-shadow:0 14px 30px -12px rgba(36,86,211,.65);transition:transform .25s,box-shadow .25s,background .25s;position:relative;overflow:hidden;white-space:nowrap}
.btn:hover{transform:translateY(-2px);box-shadow:0 20px 36px -14px rgba(36,86,211,.75)}
.btn svg{width:18px;height:18px;flex:none}
.btn.ghost{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 2px var(--ink)}
.btn.ghost:hover{background:var(--ink);color:#fff}
.on-ink .btn.ghost{color:#fff;box-shadow:inset 0 0 0 2px rgba(255,255,255,.7)}
.on-ink .btn.ghost:hover{background:#fff;color:var(--ink)}
.btn.gold{background:linear-gradient(135deg,#D9BE7C,#B48E40);color:var(--ink);box-shadow:0 14px 30px -12px rgba(180,142,64,.7)}
.btn .rip{position:absolute;border-radius:50%;background:rgba(255,255,255,.45);transform:scale(0);animation:rip .6s ease-out forwards;pointer-events:none}
@keyframes rip{to{transform:scale(4);opacity:0}}
.btn-row{display:flex;flex-wrap:wrap;gap:14px;align-items:center}
@media(max-width:640px){.btn{white-space:normal;text-align:center;padding:16px 24px}.btn-row .btn{width:100%}}
[class$="-g"]>*{min-width:0}
.tlink{font-weight:700;color:var(--ink);text-decoration:none;border-bottom:2px solid var(--gold);padding-bottom:2px}
.tlink:hover{color:var(--blue)}
.on-ink .tlink{color:#fff}

/* cards, chips, frames */
.card{background:#fff;border-radius:var(--r);box-shadow:var(--shadow);padding:clamp(26px,3vw,38px);position:relative}
.chip{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:40px;background:var(--sky);color:var(--blue2);font:600 14px/1.2 var(--sans)}
.chip.gold{background:#F4ECD6;color:#7A5C1E}
.ph{display:inline-block;border:2px dashed var(--gold);color:#7A5C1E;background:#FBF6E8;border-radius:10px;padding:2px 10px;font:600 14px/1.5 var(--sans)}
.arch{border-radius:46vw 46vw 24px 24px;overflow:hidden;box-shadow:var(--shadow)}
.arch img{width:100%;height:100%;object-fit:cover}
.wm{position:absolute;font-family:var(--serif);font-style:italic;font-weight:600;font-size:clamp(120px,19vw,300px);line-height:.8;color:transparent;
  -webkit-text-stroke:1.5px rgba(36,86,211,.13);white-space:nowrap;pointer-events:none;user-select:none;z-index:0}
.on-ink .wm{-webkit-text-stroke-color:rgba(157,187,255,.14)}
section>.wrap,section>.narrow{z-index:1}
.squig{display:block;width:180px;height:14px;margin:6px 0 22px}
.center{text-align:center}
.center .squig{margin-left:auto;margin-right:auto}
.center .lead{margin-left:auto;margin-right:auto}

/* spinning badge */
.spin{position:absolute;width:150px;height:150px;border-radius:50%;background:var(--ink);display:grid;place-items:center;box-shadow:var(--shadow);z-index:3}
.spin svg{position:absolute;inset:0;width:100%;height:100%;animation:spin 18s linear infinite}
.spin text{font:700 11px var(--sans);letter-spacing:.12em;fill:#fff;text-transform:uppercase}
.spin b{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--btn1),var(--btn2));display:grid;place-items:center;color:#fff;font:italic 600 28px var(--serif)}
@keyframes spin{to{transform:rotate(360deg)}}

/* marquees */
.mq{overflow:hidden;white-space:nowrap;position:relative}
.mq-track{display:inline-flex;animation:mq 38s linear infinite}
.mq-track>span{display:inline-flex;align-items:center;gap:26px;padding-right:26px}
.mq.rev .mq-track{animation-direction:reverse}
@keyframes mq{to{transform:translateX(-50%)}}
.mq:hover .mq-track{animation-play-state:paused}
.strip{background:var(--blue);color:#fff;padding:20px 0;font:600 17px var(--sans);letter-spacing:.04em}
.strip i{font-style:normal;color:var(--gold2)}
.outline-mq{padding:26px 0;background:var(--paper);border-top:1px solid var(--line)}
.outline-mq span{font:italic 600 clamp(44px,7vw,92px)/1.1 var(--serif);color:transparent;-webkit-text-stroke:1.4px var(--blue)}
.outline-mq span i{font-style:normal;-webkit-text-stroke:0;color:var(--gold);font-size:.5em}

/* announcement banner */
.ann{background:var(--ink);color:#fff;position:relative;z-index:60;font:600 14.5px/1 var(--sans);letter-spacing:.04em}
.ann a{color:#fff;text-decoration:none;display:block;padding:13px 54px 13px 0}
.ann .mq-track{animation-duration:30s}
.ann b{color:var(--gold2);font-weight:700}
.ann .dot{width:6px;height:6px;border-radius:50%;background:var(--gold);display:inline-block}
.ann-x{position:absolute;right:0;top:0;bottom:0;width:48px;border:0;background:var(--ink);color:#fff;font-size:22px;cursor:pointer}
.ann.hide{display:none}

/* nav */
.navt{position:absolute;opacity:0;pointer-events:none}
.nav{position:sticky;top:0;z-index:50;background:rgba(247,249,252,.92);backdrop-filter:saturate(1.4) blur(12px);-webkit-backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid transparent;transition:border-color .3s,box-shadow .3s}
.nav.stuck{border-color:var(--line);box-shadow:0 10px 30px -20px rgba(14,27,58,.4)}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:82px}
.logo{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--ink);white-space:nowrap}
.logo .mono{width:46px;height:46px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font:italic 600 25px/1 var(--serif);position:relative;flex:none}
.logo .mono:after{content:"";position:absolute;inset:3px;border-radius:50%;border:1px solid rgba(231,214,168,.7)}
.logo .wt{display:flex;flex-direction:column;line-height:1}
.logo .wt b{font:italic 600 25px/1 var(--serif)}
.logo .wt small{font:700 10.5px/1 var(--sans);letter-spacing:.32em;text-transform:uppercase;color:var(--blue2);margin-top:6px}
.nav-r{display:flex;align-items:center;gap:14px}
.nav-links{display:flex;gap:26px;margin-right:8px}
.nav-links a{color:var(--ink);text-decoration:none;font:600 14px var(--sans);letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}
.nav-links a:hover{color:var(--blue)}
.nav .btn{min-height:48px;padding:12px 22px;font-size:13px}
.burger{display:inline-flex;align-items:center;gap:12px;cursor:pointer;background:var(--ink);color:#fff;border-radius:60px;padding:0 20px 0 18px;height:48px;font:700 13px var(--sans);letter-spacing:.16em;text-transform:uppercase;user-select:none}
.burger .bars{width:20px;display:grid;gap:5px}
.burger .bars i{height:2px;background:#fff;border-radius:2px;display:block;transition:transform .3s,opacity .3s}
.burger .bars i:nth-child(2){width:70%;justify-self:end}
.burger:hover .bars i:nth-child(2){width:100%}
@media(max-width:1120px){.nav-links{display:none}}
@media(max-width:720px){.nav .btn{display:none}.logo .wt b{font-size:21px}.logo .wt small{font-size:9px;letter-spacing:.26em}.logo .mono{width:40px;height:40px;font-size:21px}.burger{padding:0 16px}.nav .wrap{min-height:72px}}
@media(max-width:380px){.burger .lbl{display:none}}

/* pull-out drawer */
.scrim{position:fixed;inset:0;background:rgba(9,17,38,.55);opacity:0;pointer-events:none;transition:opacity .35s;z-index:80}
.drawer{position:fixed;top:0;right:0;bottom:0;width:min(480px,100vw);background:var(--ink);color:#fff;z-index:90;transform:translateX(102%);transition:transform .5s cubic-bezier(.7,0,.2,1);
  display:flex;flex-direction:column;overflow-y:auto;overscroll-behavior:contain;visibility:hidden}
.navt:checked~.drawer{transform:none;visibility:visible}
.navt:checked~.scrim{opacity:1;pointer-events:auto}
.dr-top{display:flex;justify-content:space-between;align-items:center;padding:22px 26px;border-bottom:1px solid rgba(255,255,255,.1)}
.dr-top .eyebrow{margin:0;color:var(--gold2)}
.dr-x{width:46px;height:46px;border-radius:50%;border:1.5px solid rgba(255,255,255,.4);display:grid;place-items:center;cursor:pointer;color:#fff;font-size:24px;line-height:1;transition:transform .3s,background .3s}
.dr-x:hover{transform:rotate(90deg);background:rgba(255,255,255,.1)}
.dr-links{list-style:none;margin:0;padding:12px 26px 8px;counter-reset:m}
.dr-links li{counter-increment:m;border-bottom:1px solid rgba(255,255,255,.08);opacity:0;transform:translateX(30px);transition:opacity .4s,transform .4s}
.navt:checked~.drawer .dr-links li{opacity:1;transform:none}
.dr-links a{display:flex;align-items:baseline;gap:16px;padding:13px 0;text-decoration:none;color:#fff}
.dr-links a:before{content:counter(m,decimal-leading-zero);font:600 12px var(--sans);color:var(--gold);letter-spacing:.1em;width:22px}
.dr-links b{font:500 25px/1.15 var(--serif);transition:color .2s,transform .3s}
.dr-links small{margin-left:auto;font:500 12.5px var(--sans);color:#8FA0C4;text-align:right}
.dr-links a:hover b{color:#9DBBFF;transform:translateX(6px)}
.dr-links a[aria-current] b{color:#9DBBFF;font-style:italic}
.dr-card{margin:18px 26px 26px;border-radius:20px;background:linear-gradient(140deg,#1B3478,#122555);padding:22px;display:grid;grid-template-columns:96px 1fr;gap:18px;align-items:center;position:relative;overflow:hidden}
.dr-card img{width:96px;height:118px;object-fit:cover;border-radius:60px 60px 14px 14px}
.dr-card p{margin:0 0 12px;font:italic 500 19px/1.3 var(--serif);color:#fff}
.dr-card .btn{min-height:46px;padding:11px 18px;font-size:12px;white-space:normal;text-align:center}
.dr-foot{margin-top:auto;padding:18px 26px 26px;display:flex;flex-wrap:wrap;gap:10px;font-size:14px;color:#8FA0C4}
.dr-foot a{color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.25);padding:7px 14px;border-radius:30px;font-weight:600;font-size:13px}
.dr-foot a:hover{background:#fff;color:var(--ink)}
@media(max-width:480px){.dr-links small{display:none}.dr-links b{font-size:23px}}
.navt:checked~.drawer .dr-links li:nth-child(1){transition-delay:.12s}
.navt:checked~.drawer .dr-links li:nth-child(2){transition-delay:.15s}
.navt:checked~.drawer .dr-links li:nth-child(3){transition-delay:.18s}
.navt:checked~.drawer .dr-links li:nth-child(4){transition-delay:.21s}
.navt:checked~.drawer .dr-links li:nth-child(5){transition-delay:.24s}
.navt:checked~.drawer .dr-links li:nth-child(6){transition-delay:.27s}
.navt:checked~.drawer .dr-links li:nth-child(7){transition-delay:.30s}
.navt:checked~.drawer .dr-links li:nth-child(8){transition-delay:.33s}
.navt:checked~.drawer .dr-links li:nth-child(9){transition-delay:.36s}
.navt:checked~.drawer .dr-links li:nth-child(10){transition-delay:.39s}
.navt:checked~.drawer .dr-links li:nth-child(11){transition-delay:.42s}
html.lock,html.lock body{overflow:hidden}

/* FAQ (details: works with no JS) */
.faq details{background:#fff;border-radius:18px;margin-bottom:14px;box-shadow:0 12px 30px -22px rgba(14,27,58,.45);border:1px solid var(--line)}
.faq summary{list-style:none;cursor:pointer;padding:22px 64px 22px 26px;font:600 clamp(18px,1.6vw,21px)/1.35 var(--serif);color:var(--ink);position:relative}
.faq summary::-webkit-details-marker{display:none}
.faq summary:after{content:"+";position:absolute;right:22px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:var(--sky);color:var(--blue2);display:grid;place-items:center;font:600 22px/1 var(--sans);transition:transform .3s,background .3s}
.faq details[open] summary:after{transform:translateY(-50%) rotate(45deg);background:var(--blue);color:#fff}
.faq .a{padding:0 26px 24px;color:var(--muted)}

/* final CTA */
.final{text-align:center;background:radial-gradient(1200px 500px at 50% 120%,#21419A 0%,var(--ink) 60%)}
.final h2{font-size:clamp(38px,5.4vw,72px);max-width:960px;margin:0 auto .3em}
.shimmer{background:linear-gradient(100deg,#fff 20%,#9DBBFF 40%,#fff 60%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shim 6s linear infinite}
@keyframes shim{to{background-position:-250% 0}}
.final .btn-row{justify-content:center;margin-top:34px}
.final .fine{margin-top:22px;font-size:15px;color:#8FA0C4}

/* footer */
.foot{background:#0A1430;color:#AFBCD8;padding:80px 0 34px;position:relative;overflow:hidden}
.foot .big{font:italic 600 clamp(64px,13vw,200px)/.9 var(--serif);color:transparent;-webkit-text-stroke:1.2px rgba(157,187,255,.28);white-space:nowrap;text-align:center;margin-bottom:56px}
.fgrid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1.2fr;gap:44px}
.foot h4{font:700 13px var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--gold2);margin-bottom:18px}
.foot ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.foot a{color:#DCE4F3;text-decoration:none}
.foot a:hover{color:#fff;text-decoration:underline}
.foot .pills{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.foot .pills a{border:1px solid rgba(255,255,255,.25);border-radius:30px;padding:8px 16px;font-size:14px;font-weight:600}
.foot .sign{font:italic 500 28px var(--serif);color:#fff;margin-top:14px}
.foot .bottom{border-top:1px solid rgba(255,255,255,.1);margin-top:56px;padding-top:24px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;font-size:14px}
.foot .btn{margin-top:6px;white-space:normal;text-align:center}
@media(max-width:900px){.fgrid{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.fgrid{grid-template-columns:1fr}}

/* back to top */
.totop{position:fixed;right:18px;bottom:18px;width:52px;height:52px;border-radius:50%;background:var(--ink);color:#fff;border:0;display:grid;place-items:center;cursor:pointer;z-index:40;opacity:0;transform:translateY(16px);transition:.3s;box-shadow:var(--shadow)}
.totop.on{opacity:1;transform:none}

/* loader: only exists when JS runs; CSS kills it at 3s regardless */
.loader{display:none}
.js .loader{position:fixed;inset:0;z-index:200;background:var(--ink);display:grid;place-items:center;animation:ldkill .01s 3s forwards;transition:opacity .5s,visibility .5s}
.loader .ld{display:grid;justify-items:center;gap:18px}
.loader .m{width:84px;height:84px;border-radius:50%;border:1.5px solid var(--gold);display:grid;place-items:center;color:#fff;font:italic 600 44px/1 var(--serif);animation:ldp 1.6s ease-in-out infinite}
.loader small{font:700 11px var(--sans);letter-spacing:.34em;text-transform:uppercase;color:var(--gold2)}
.loader.done{opacity:0;visibility:hidden}
@keyframes ldkill{to{opacity:0;visibility:hidden}}
@keyframes ldp{50%{transform:scale(1.07);box-shadow:0 0 0 14px rgba(194,161,90,.12)}}

/* reveal on scroll. Hide rule (.js [data-rv]) is WEAKER than show rule
   (.js [data-rv].in). Final state resets opacity/transform only: no
   clip-path on resting content (playbook v3.7). */
.js [data-rv]{opacity:0;transform:translateY(26px);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1)}
.js [data-rv="l"]{transform:translateX(-34px)}
.js [data-rv="r"]{transform:translateX(34px)}
.js [data-rv="z"]{transform:scale(.94)}
.js [data-rv].in{opacity:1;transform:none}
@media(max-width:760px){.js [data-rv="l"],.js [data-rv="r"]{transform:translateY(26px)}}

@media(prefers-reduced-motion:reduce){
  *,*:before,*:after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
  .js [data-rv]{opacity:1;transform:none}
  .mq-track{animation:none!important}
  .js .loader{display:none}
}
"""

SQUIG = ('<svg class="squig" viewBox="0 0 180 14" aria-hidden="true"><path d="M2 9 C 22 1, 38 1, 58 8 S 98 14, 118 7 S 158 1, 178 8" '
         'fill="none" stroke="#C2A15A" stroke-width="2.6" stroke-linecap="round"/></svg>')
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'


def spin_badge(text, letter="F", style=""):
    return (f'<div class="spin" style="{style}" aria-hidden="true"><svg viewBox="0 0 150 150">'
            '<defs><path id="sp" d="M75,75 m-56,0 a56,56 0 1,1 112,0 a56,56 0 1,1 -112,0"/></defs>'
            f'<text><textPath href="#sp" textLength="348" lengthAdjust="spacing">{text}</textPath></text></svg><b>{letter}</b></div>')


def marquee(items, cls="strip", sep='<i>&#10022;</i>', rev=False):
    one = "".join(f"<span>{t}{sep}</span>" for t in items)
    return (f'<div class="mq {cls}{" rev" if rev else ""}" aria-hidden="true">'
            f'<div class="mq-track">{one}{one}</div></div>')


def annbar():
    items = ["<b>FREE:</b> The Build Your Agency Checklist",
             "Ready to stop doing it all yourself? Grab it free",
             "<b>FREE:</b> Your Hand-Off Plan call with Tammy",
             "No sales pitch. Just a real plan."]
    one = "".join(f'<span>{t}<i class="dot"></i></span>' for t in items)
    return ('<div class="ann" id="ann"><a href="/resources" class="mq">'
            f'<div class="mq-track">{one}{one}</div></a>'
            '<button class="ann-x" type="button" aria-label="Close announcement">&times;</button></div>')


def nav(current="/"):
    lis = "".join(
        f'<li><a href="{u}"{" aria-current=page" if u == current else ""}><b>{l}</b><small>{n}</small></a></li>'
        for l, u, n in MENU)
    social = "".join(f'<a href="{u}" target="_blank" rel="noopener">{k}</a>' for k, u in SOCIAL.items())
    return f'''<input type="checkbox" id="navt" class="navt" aria-hidden="true" tabindex="-1">
<header class="nav" id="nav"><div class="wrap">
  <a href="/" class="logo" aria-label="Fearless Business Boss home"><span class="mono">F</span><span class="wt"><b>Fearless</b><small>Business Boss</small></span></a>
  <div class="nav-r">
    <nav class="nav-links" aria-label="Quick links"><a href="/start-here">Start Here</a><a href="/coaching">Coaching</a><a href="/mastermind">Mastermind</a></nav>
    <a class="btn" href="{CALL_URL}" target="_blank" rel="noopener">Free Hand-Off Plan call</a>
    <label for="navt" class="burger" role="button" tabindex="0" aria-controls="drawer" aria-expanded="false"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="lbl">Menu</span></label>
  </div>
</div></header>
<aside class="drawer" id="drawer" aria-label="Site menu">
  <div class="dr-top"><span class="eyebrow">Menu</span><label for="navt" class="dr-x" role="button" tabindex="0" aria-label="Close menu">&times;</label></div>
  <ul class="dr-links">{lis}</ul>
  <div class="dr-card"><img src="{IMG}tammy-window.jpg" alt="Tammy Durden smiling by a window with a coffee mug" loading="lazy">
    <div><p>Not sure where to start? Let&rsquo;s map it out together.</p><a class="btn" href="{CALL_URL}" target="_blank" rel="noopener">{CTA}</a></div></div>
  <div class="dr-foot">{social}<a href="mailto:{EMAIL}">Email Tammy</a></div>
</aside>
<label for="navt" class="scrim" aria-hidden="true"></label>'''


def footer():
    def col(title, links):
        return f'<div><h4>{title}</h4><ul>' + "".join(f'<li><a href="{u}">{l}</a></li>' for l, u in links) + '</ul></div>'
    social = "".join(f'<a href="{u}" target="_blank" rel="noopener">{k}</a>' for k, u in SOCIAL.items())
    return f'''<footer class="foot"><div class="wrap">
  <div class="big" aria-hidden="true">Fearless</div>
  <div class="fgrid">
    <div><a href="/" class="logo" style="color:#fff"><span class="mono" style="background:#16295A">F</span><span class="wt"><b>Fearless</b><small style="color:#9DBBFF">Business Boss</small></span></a>
      <p style="margin:20px 0 6px">Business coaching for seasoned women service providers who are ready to earn more and work less.</p>
      <div class="sign">~ Tammy</div></div>
    {col("Work with Tammy", [("1:1 Business Freedom Coaching", "/coaching"), ("The Fearless Mastermind", "/mastermind"), ("Pricing &amp; Packages Intensive", "/pricing-intensive"), ("Free Hand-Off Plan call", CALL_URL)])}
    {col("Explore", [("Start Here", "/start-here"), ("About Tammy", "/about"), ("Free Resources", "/resources"), ("Blog", "/blog"), ("Podcast", "/podcast"), ("YouTube", "/youtube"), ("Contact", "/contact")])}
    <div><h4>Stay close</h4><p style="margin:0 0 10px">Questions? Email <a href="mailto:{EMAIL}">{EMAIL}</a></p>
      <a class="btn" href="{CALL_URL}" target="_blank" rel="noopener">{CTA}</a>
      <div class="pills">{social}</div></div>
  </div>
  <div class="bottom"><span>&copy; <span data-year>2026</span> Fearless Business Boss LLC. Mechanicsville, Virginia.</span>
    <span><a href="{PRIVACY}" target="_blank" rel="noopener">Privacy Policy</a> &nbsp;&middot;&nbsp; <a href="{TERMS}" target="_blank" rel="noopener">Terms</a></span></div>
</div></footer>'''


LOADER = '<div class="loader" id="loader" aria-hidden="true"><div class="ld"><div class="m">F</div><small>Fearless Business Boss</small></div></div>'

STD_JS = r"""
(function(){
  var d=document, h=d.documentElement, rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))}
  // loader
  function done(){var l=d.getElementById('loader'); if(l) l.classList.add('done')}
  window.addEventListener('load',function(){setTimeout(done,350)}); setTimeout(done,1600);
  // announcement
  var ann=d.getElementById('ann');
  try{ if(ann && sessionStorage.getItem('fbb_ann')==='x') ann.classList.add('hide') }catch(e){}
  $$('.ann-x').forEach(function(b){b.addEventListener('click',function(){ann.classList.add('hide');try{sessionStorage.setItem('fbb_ann','x')}catch(e){}})});
  // drawer menu
  var t=d.getElementById('navt'), burger=d.querySelector('.burger');
  function sync(){ h.classList.toggle('lock',t.checked); if(burger) burger.setAttribute('aria-expanded',t.checked?'true':'false');
    if(t.checked){var f=d.querySelector('.dr-x'); f&&setTimeout(function(){f.focus()},350)} }
  if(t){ t.addEventListener('change',sync);
    $$('label[for=navt][role=button]').forEach(function(l){l.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();t.checked=!t.checked;sync(); if(!t.checked&&burger) burger.focus()}})});
    $$('.drawer a').forEach(function(a){a.addEventListener('click',function(){t.checked=false;sync()})});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&t.checked){t.checked=false;sync();burger&&burger.focus()}});
  }
  // sticky nav + back to top
  var nav=d.getElementById('nav'), top=d.createElement('button');
  top.className='totop'; top.type='button'; top.setAttribute('aria-label','Back to top'); top.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  d.body.appendChild(top); top.addEventListener('click',function(){window.scrollTo({top:0,behavior:rm?'auto':'smooth'})});
  function onS(){var y=window.scrollY; nav&&nav.classList.toggle('stuck',y>20); top.classList.toggle('on',y>900)}
  window.addEventListener('scroll',onS,{passive:true}); onS();
  // reveal on scroll
  var rv=$$('[data-rv]');
  if('IntersectionObserver' in window && !rm){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    rv.forEach(function(el){io.observe(el)});
  } else rv.forEach(function(el){el.classList.add('in')});
  // count-ups
  function count(el){var n=parseFloat(el.getAttribute('data-count')),s=el.getAttribute('data-suffix')||'',t0=null;
    if(rm){el.textContent=n+s;return}
    function f(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/1600,1),v=Math.round(n*(1-Math.pow(1-p,3)));el.textContent=v+s;if(p<1)requestAnimationFrame(f)}
    requestAnimationFrame(f)}
  var cs=$$('[data-count]');
  if('IntersectionObserver' in window){var ci=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){count(e.target);ci.unobserve(e.target)}})},{threshold:.4});cs.forEach(function(c){ci.observe(c)})}
  // typewriter
  $$('[data-words]').forEach(function(el){
    var w; try{w=JSON.parse(el.getAttribute('data-words'))}catch(e){return}
    if(rm||!w.length) return; var i=0,j=w[0].length,del=true;
    function tick(){var cur=w[i]; if(del){j--; if(j<=0){del=false;i=(i+1)%w.length}} else {j++; if(j>=w[i].length){del=true; el.textContent=w[i].slice(0,j); return setTimeout(tick,2200)}}
      el.textContent=w[i].slice(0,Math.max(j,0)); setTimeout(tick,del?45:85)}
    setTimeout(tick,2600)});
  // ripples + magnetic buttons
  $$('.btn').forEach(function(b){
    b.addEventListener('click',function(e){var r=b.getBoundingClientRect(),s=d.createElement('span'),z=Math.max(r.width,r.height);s.className='rip';s.style.width=s.style.height=z+'px';s.style.left=(e.clientX-r.left-z/2)+'px';s.style.top=(e.clientY-r.top-z/2)+'px';b.appendChild(s);setTimeout(function(){s.remove()},700)});
    if(rm||!window.matchMedia('(hover:hover)').matches) return;
    b.addEventListener('mousemove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.12)+'px,'+((e.clientY-r.top-r.height/2)*.2-2)+'px)'});
    b.addEventListener('mouseleave',function(){b.style.transform=''});
  });
  // tilt cards
  if(!rm && window.matchMedia('(hover:hover)').matches) $$('[data-tilt]').forEach(function(c){
    c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform='perspective(900px) rotateY('+(x*6)+'deg) rotateX('+(-y*6)+'deg) translateY(-4px)'});
    c.addEventListener('mouseleave',function(){c.style.transform=''})});
  // YouTube facades
  $$('[data-yt]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var f=d.createElement('iframe');
    f.src='https://www.youtube-nocookie.com/embed/'+a.getAttribute('data-yt')+'?rel=0&autoplay=1';f.title=a.getAttribute('aria-label')||'Video';f.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';f.allowFullscreen=true;
    a.parentNode.replaceChild(f,a)})});
  // year
  $$('[data-year]').forEach(function(y){y.textContent=new Date().getFullYear()});
})();
"""


def faq_schema(pairs):
    return json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in pairs]},
        ensure_ascii=False)


def faq_html(pairs):
    return "".join(f'<details><summary>{q}</summary><div class="a"><p>{a}</p></div></details>' for q, a in pairs)


def page(fname, title, desc, content, extra_css="", extra_js="", current="/", schema=None):
    ld = f'<script type="application/ld+json">{schema}</script>' if schema else ""
    doc = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<script>document.documentElement.classList.add('js')</script>
{FONTS}
<style>{BASE_CSS}{extra_css}</style>
{ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
{LOADER}
{annbar()}
{nav(current)}
<main id="main">
{content}
</main>
{marquee(["Earn more", "Work less", "Hand it off", "Grow with a team", "You are not alone"], cls="outline-mq", sep="<i>&#10022;</i>", rev=True)}
{footer()}
<script>{STD_JS}{extra_js}</script>
</body>
</html>
'''
    for ch in (chr(0x2014), chr(0x2013), "&mdash;", "&ndash;"):
        assert ch not in doc, f"{fname}: em/en dash found (voice rule)"
    out = os.path.join(HERE, fname)
    with open(out, "w", encoding="utf-8") as f:
        f.write(doc)
    os.makedirs(os.path.join(HERE, "deliverables"), exist_ok=True)
    with open(os.path.join(HERE, "deliverables", fname.replace(".html", ".txt")), "w", encoding="utf-8") as f:
        f.write(doc)
    print("built", fname, len(doc) // 1024, "KB")
    return out
