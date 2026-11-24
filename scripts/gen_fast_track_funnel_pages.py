"""Builds the three Fast Track funnel pages (BLB brand, no menu or footer):
  /application-confirmation  shown right after an /apply application is sent
  /fast-track-preparation    sent to approved applicants: business questionnaire + booking calendar
  /fast-track-confirmation   Calendly's after-booking page; fills in the appointment from Calendly's details
Copy: scripts/copy/<page>.txt. Run: python3 scripts/gen_fast_track_funnel_pages.py"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pf_parts import *

TO = "https://formsubmit.co/ajax/hello@bossladybloggers.com"
COPY = Path(__file__).parent / "copy"
def lines(name): return [l.strip() for l in (COPY / f"{name}.txt").read_text().split("\n") if l.strip()]
LINKS = {"View My Client Portfolio": "/portfolio/", "Explore The BOSS Business Experience": COACH, "Meet Genasys": "/about/",
         "Complete My Business Questionnaire": "#questionnaire", "Schedule My Private Strategy Session": "#schedule",
         "Complete My Questionnaire": "/fast-track-preparation/#questionnaire"}

FX = r'''<style>
.pf .conf{text-align:center;padding:clamp(70px,9vw,120px) clamp(16px,4vw,48px)}
.pf .conf h1{font-size:clamp(40px,5.4vw,74px)}
.pf .chk{width:58px;height:58px;border-radius:50%;background:#A23E66;display:grid;place-items:center;margin:0 auto}
.pf .nsteps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.pf .nsteps article{background:#fff;border-radius:22px;padding:24px;display:flex;flex-direction:column;gap:8px}
.pf .nsteps .n{font:400 italic 40px/.9 var(--font-display);color:var(--berry)}
.pf .nsteps h3{font-size:24px;line-height:1.15}
.pf .nsteps p{margin:0;font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.pf .three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.pf .three article{background:#fff;border-radius:22px;padding:24px;display:flex;flex-direction:column;gap:10px}
.pf .three h3{font-size:24px}.pf .three p{margin:0;font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.pf .three .pf-btn{margin-top:auto;align-self:flex-start}
.pf .sig{font:700 clamp(46px,5vw,64px)/1 var(--font-script);color:var(--berry)}
.pf .stepcard{background:#fff;border-radius:28px;padding:clamp(22px,4vw,40px);display:flex;flex-direction:column;gap:14px}
.pf .stepcard .k{font:500 12px/1 var(--font-label);letter-spacing:.2em;text-transform:uppercase;color:var(--berry)}
.pf .stepcard h2{font-size:clamp(32px,3.6vw,46px)}
.pf .chips{display:flex;flex-wrap:wrap;gap:8px}
.pf .chips span{padding:10px 16px;border-radius:999px;background:var(--blush);color:var(--plum);font:500 15px/1.2 var(--font-body)}
.pf .warn{padding:14px 18px;border-radius:14px;background:#3A1C2A;color:#FBF5EE;font:500 15px/1.5 var(--font-body)}
.pf .app{display:flex;flex-direction:column;gap:16px}
.pf .app .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.pf .app .fld{display:flex;flex-direction:column;gap:6px}
.pf .app label.q{font:600 15px/1.35 var(--font-body);color:var(--plum)}
.pf .app label.q small{display:block;font-weight:400;color:#6E4B5B;margin-top:3px}
.pf .app input[type=text],.pf .app textarea{border:2px solid var(--rose);border-radius:14px;padding:12px 14px;font:400 16px/1.5 var(--font-body);color:var(--plum);background:var(--cream);-webkit-appearance:none;appearance:none}
.pf .app input[type=text]{min-height:52px}.pf .app textarea{min-height:104px;resize:vertical}
.pf .app input:focus,.pf .app textarea:focus{outline:none;border-color:var(--berry);box-shadow:0 0 0 4px rgba(162,62,102,.14)}
.pf .app button{align-self:flex-start;min-height:58px;padding:0 28px;border:0;border-radius:999px;background:var(--berry);color:#fff;font:600 16px/1 var(--font-body);cursor:pointer}
.pf .app button:disabled{opacity:.6}
.pf .app .msg:not(:empty){font:600 14.5px/1.4 var(--font-body);color:#9B2C2C}
.pf .app .done{font:400 clamp(26px,3vw,34px)/1.25 var(--font-display);color:var(--plum);margin:0}
.pf .cal{border-radius:18px;overflow:hidden;border:1.5px solid var(--rose);background:#fff;min-height:700px}
.pf .cal iframe{display:block;width:100%;height:760px;border:0}
.pf .appt{background:#fff;border-radius:28px;padding:clamp(22px,4vw,40px);display:flex;flex-direction:column;gap:14px;max-width:760px;margin:0 auto;width:100%}
.pf .appt h3{font-size:clamp(28px,3vw,36px)}
.pf .drow{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px;padding:12px 0;border-top:1px solid var(--rose);font:400 17px/1.4 var(--font-body);color:var(--plum)}
.pf .drow span:first-child{font:500 11px/1.6 var(--font-label);letter-spacing:.18em;text-transform:uppercase;color:var(--berry)}
.pf .qlist p{margin:0;padding:12px 0;border-top:1px solid rgba(58,28,42,.14);font:400 italic clamp(20px,2.2vw,25px)/1.35 var(--font-display);color:var(--plum)}
@media (max-width:860px){.pf .nsteps,.pf .three,.pf .app .two{grid-template-columns:minmax(0,1fr)}}
</style>'''
CHK = '<div class="chk"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>'
def go(label, cls=""):
    h = LINKS.get(label, "#")
    return btn(label, h, cls)
def sign(a, b, c=None):
    return (f'<div style="text-align:center;display:flex;flex-direction:column;gap:6px;align-items:center;margin-top:10px">'
            + (f'<p class="body" style="margin:0">{e(a)}</p>' if a else "") + f'<span class="sig">{e(b)}</span>'
            + (f'<p class="lbl">{e(c)}</p>' if c else "") + '</div>')
def write(name, parts):
    out = "\n".join([CSS, EXTRA, FX, '<main id="main" class="pf">'] + parts + [LEGAL, "</main>"])
    for bad in ["—", "–", "…"]: assert bad not in out, (name, bad)
    (ROOT / f"{name}.html").write_text(out); print("wrote", name, len(out))

# ---------- /application-confirmation ----------
s = lines("application-confirmation")
steps = [i for i, l in enumerate(s) if l[:2].isdigit() and l[2:4] == ". "]
wi = s.index("While you're here...")
cards = []
for k, a in enumerate(steps):
    b = steps[k + 1] if k + 1 < len(steps) else wi
    cards.append(f'<article><span class="n">{e(s[a][:2])}</span><h3>{e(s[a][4:])}</h3>{"".join(f"<p>{e(x)}</p>" for x in s[a + 1:b])}</article>')
tri = [s[i:i + 3] for i in (20, 23, 26)]
ti = s.index("You don't need to have everything figured out before we meet.")
write("application-confirmation", [
 f'''<section class="conf dk" style="background:#3A1C2A"><div class="nar stack" style="gap:20px;align-items:center">{CHK}<p class="lbl">{e(s[0])}</p><h1>{headline(s[1])}</h1>
<p class="big">{e(s[2])}</p><div class="stack" style="gap:12px;text-align:left">{P(s[3])}{P(s[4])}</div><p class="big it">{e(s[5])} {e(s[6])}</p></div></section>''',
 f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:26px"><div class="nar ctr-h"><h2 style="text-align:center">{e(s[7])}</h2></div><div class="nsteps">{"".join(cards)}</div></div></section>''',
 f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:26px"><div class="nar stack ctr-h"><p class="lbl" style="text-align:center">{e(s[wi])}</p>{P(s[wi + 1])}</div>
<div class="three">{"".join(f"<article><h3>{e(t)}</h3><p>{e(d)}</p>{go(b[1:-1], 'ol')}</article>" for t, d, b in tri)}</div></div></section>''',
 f'''<section style="background:#FFFFFF"><div class="nar stack ctr-h"><h2 style="text-align:center">{headline(s[ti])}</h2>{"".join(P(x) for x in s[ti + 1:ti + 5])}<p class="big" style="text-align:center">{e(s[ti + 5])}</p>{sign(s[ti + 6], s[ti + 7], s[ti + 8])}</div></section>'''])
assert s[22] == "[View My Client Portfolio]" and s[-1] == "Founder of Boss Lady Bloggers"

QJS = """<script>
(function(){
  var TO='""" + TO + r"""';var f=document.querySelector('[data-q]');if(!f)return;var msg=f.querySelector('.msg');
  f.addEventListener('submit',function(ev){ev.preventDefault();
    var v=function(n){var el=f.querySelector('[name="'+n+'"]');return el?el.value.trim():'';};
    if(!v('First name')){msg.textContent='Add your name.';return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('Email'))){msg.textContent='That email doesn’t look quite right yet.';return;}
    msg.textContent='';var b=f.querySelector('button');b.disabled=true;
    var data={_subject:'Fast Track questionnaire: '+v('First name'),_template:'table',_captcha:'false',_replyto:v('Email')};
    [].forEach.call(f.querySelectorAll('input[name],textarea[name]'),function(el){data[el.name]=el.value.trim();});
    fetch(TO,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
      .then(function(x){if(!x.ok)throw 0;f.innerHTML='<p class="done">Thank you. Your questionnaire is in. Now choose your session time below.</p>';var s=document.getElementById('schedule');if(s)s.scrollIntoView({behavior:'smooth'});})
      .catch(function(){b.disabled=false;msg.textContent='That didn’t send. Please try again in a moment.';});
  });
})();
</script>"""

# ---------- /fast-track-preparation ----------
s = lines("fast-track-preparation")
i1 = s.index("STEP 01: Complete your business questionnaire."); i2 = s.index("STEP 02: Share your existing business assets.")
i3 = s.index("STEP 03: Schedule your private Fast Track Call."); i4 = s.index("What I'll be doing before our session")
Q = [("Your name", "First name", "text"), ("Your email address", "Email", "text"),
     ("Your expertise", "Expertise", "area", "What do you know, do or teach that people could pay for?"),
     ("Your business ideas", "Business ideas", "area", "If you have several and can't decide, share them all."),
     ("Your existing offers", "Existing offers", "area", "What you sell today and how it's going. If you don't know what to sell, say that."),
     ("Your audience", "Audience", "area", "Who you serve or want to serve."),
     ("Your marketing", "Marketing", "area", "How people find you now. What you've tried and what happened."),
     ("Your website", "Website", "area", "What's working and what isn't."),
     ("Your financial goals", "Financial goals", "area", None),
     ("Your current challenges", "Current challenges", "area", "If you're frustrated with your business, tell me why."),
     ("Links to your business assets", "Business asset links", "area", "Website, sales pages, social media, offers, free resources, email sign up pages and anything else public you'd like me to consider.")]
fields = []
for q in Q:
    lab, nm, kind = q[0], q[1], q[2]; hint = q[3] if len(q) > 3 else None
    fid = "fq-" + nm.lower().replace(" ", "-")
    lbl = f'<label class="q" for="{fid}">{e(lab)}' + (f"<small>{e(hint)}</small>" if hint else "") + "</label>"
    ctl = (f'<input id="{fid}" type="text" name="{e(nm)}" maxlength="200"' + (' inputmode="email" autocomplete="email"' if nm == "Email" else ' autocomplete="given-name"' if nm == "First name" else "") + ">"
           if kind == "text" else f'<textarea id="{fid}" name="{e(nm)}" maxlength="5000"></textarea>')
    fields.append(f'<div class="fld">{lbl}{ctl}</div>')
form = (f'<form class="app" data-q novalidate><div class="two">{fields[0]}{fields[1]}</div>{"".join(fields[2:])}'
        f'<div class="warn">{e(s[i2 + 9])}</div><button type="submit">Send My Questionnaire</button><p class="msg" role="alert"></p></form>')
cal = f'<div class="cal"><iframe src="{FAST_TRACK_CAL}?hide_gdpr_banner=1&primary_color=a23e66" title="Schedule your Fast Track Call" loading="lazy"></iframe></div>'
write("fast-track-preparation", [
 f'''<section class="conf dk" style="background:#3A1C2A"><div class="nar stack" style="gap:20px;align-items:center">{CHK}<p class="lbl">{e(s[0])}</p><h1>{headline(s[1])}</h1>
<div class="stack" style="gap:12px;text-align:left">{"".join(P(x) for x in s[2:5])}</div><p class="big it">{e(s[5])}</p>{P(s[6])}
<div class="row" style="justify-content:center">{go(s[i1 + 10][1:-1], "cr")}{go(s[i3 + 4][1:-1], "olw")}</div></div></section>''',
 f'''<section id="questionnaire" style="background:#F6E1E8;scroll-margin-top:20px"><div class="in" style="max-width:900px"><div class="stepcard">
<p class="k">Step 01</p><h2>{e(s[i1].split(": ", 1)[1])}</h2>{P(s[i1 + 1])}<div class="qlist">{"".join(f"<p>{e(x)}</p>" for x in s[i1 + 2:i1 + 7])}</div>{P(s[i1 + 7])}{P(s[i1 + 8])}
<hr style="border:0;border-top:1px solid #E9B9CA;margin:6px 0">
<p class="k">Step 02 &middot; {e(s[i2].split(": ", 1)[1])}</p>{P(s[i2 + 1])}<div class="chips">{"".join(f"<span>{e(x.rstrip('.'))}</span>" for x in s[i2 + 2:i2 + 9])}</div>{P(s[i2 + 10])}
{form}</div></div></section>''',
 f'''<section id="schedule" style="background:#FBF5EE;scroll-margin-top:20px"><div class="in" style="max-width:900px"><div class="stepcard">
<p class="k">Step 03</p><h2>{e(s[i3].split(": ", 1)[1])}</h2>{P(s[i3 + 1])}{P(s[i3 + 2])}{cal}{P(s[i3 + 5])}</div></div></section>''',
 f'''<section class="dk" style="background:#3A1C2A"><div class="nar stack ctr-h"><h2 style="text-align:center">{e(s[i4])}</h2>{"".join(P(x) for x in s[i4 + 1:i4 + 4])}<p class="big it" style="text-align:center">{e(s[i4 + 4])}</p>
<div style="text-align:center"><span class="sig" style="color:#F6C9D8">{e(s[i4 + 5])}</span></div></div></section>''', QJS])
assert s[i1 + 9] == "[Embed Detailed Business Questionnaire]" and s[i3 + 3] == "[Embed Scheduling Calendar]" and s[i2 + 9].startswith("Please don't share")

# ---------- /fast-track-confirmation ----------
s = lines("fast-track-confirmation")
bi = s.index("Before we meet"); xi = s.index("What you can expect during our call"); oi = s.index("One final thing."); li = s.index("I'm looking forward to showing you what's possible.")
rows = []
for l in s[7:11]:
    k, v = l.split(": ", 1)
    key = {"Date": "date", "Time": "time", "Duration": "dur"}.get(k)
    val = f'<span data-appt="{key}">{e("In your confirmation email")}</span>' if key else e(v)
    rows.append(f'<div class="drow"><span>{e(k)}</span><span>{val}</span></div>')
write("fast-track-confirmation", [
 f'''<section class="conf dk" style="background:#3A1C2A"><div class="nar stack" style="gap:20px;align-items:center">{CHK}<p class="lbl">{e(s[0])}</p><h1>{headline(s[1])}</h1><p class="big">{e(s[2])}</p>{P(s[3])}</div></section>''',
 f'''<section style="background:#F6E1E8"><div class="in"><div class="appt"><p class="lbl">{e(s[4])}</p><h3>{e(s[5])}</h3><p class="body" style="margin:0">{e(s[6])}</p>
<div>{"".join(rows)}</div><p class="body" style="margin:0">{e(s[11])}</p><div class="row" data-cal></div></div></div></section>''',
 f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:24px"><div class="nar ctr-h"><h2 style="text-align:center">{e(s[bi])}</h2></div>
<div class="three"><article><h3>{e(s[bi + 1])}</h3><p>{e(s[bi + 2])}</p><p>{e(s[bi + 3])}</p>{go(s[bi + 4][1:-1], "ol")}</article>
<article><h3>{e(s[bi + 5])}</h3><p>{e(s[bi + 6])}</p><p>{e(s[bi + 7])}</p></article>
<article><h3>{e(s[bi + 8])}</h3><div class="qlist">{"".join(f"<p style='font-size:19px'>{e(x)}</p>" for x in s[bi + 9:bi + 13])}</div><p>{e(s[bi + 13])}</p></article></div></div></section>''',
 f'''<section style="background:#FFFFFF"><div class="in twocol"><div class="stack sticky"><h2>{e(s[xi])}</h2></div><div class="stack">{"".join(P(x) for x in s[xi + 1:oi])}</div></div></section>''',
 f'''<section class="dk" style="background:#3A1C2A"><div class="nar stack ctr-h"><h2 style="text-align:center">{e(s[oi])}</h2>{"".join(P(x) for x in s[oi + 1:oi + 4])}<div class="row" style="justify-content:center" data-resched></div></div></section>''',
 f'''<section style="background:#FBF5EE"><div class="nar stack ctr-h"><h2 style="text-align:center">{headline(s[li])}</h2>{"".join(f'<p class="big" style="text-align:center">{e(x)}</p>' for x in s[li + 1:li + 4])}{P(s[li + 4])}<p class="big it" style="text-align:center">{e(s[li + 5])}</p>{sign(s[li + 6], s[li + 7], s[li + 8])}</div></section>''',
 r"""<script>
(function(){
  /* Calendly passes the booking details when "Pass event details to your redirected page" is on */
  var q=new URLSearchParams(location.search),st=q.get('event_start_time'),en=q.get('event_end_time'),inv=q.get('invitee_uuid');
  var set=function(k,v){var el=document.querySelector('[data-appt="'+k+'"]');if(el)el.textContent=v;};
  var cal=document.querySelector('[data-cal]');
  if(st){var a=new Date(st),b=en?new Date(en):new Date(a.getTime()+3600000);
    if(!isNaN(a)){
      set('date',a.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}));
      var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g,' ');}catch(x){}
      set('time',a.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})+(tz?' ('+tz+')':''));
      set('dur',Math.round((b-a)/60000)+' minutes');
      var z=function(d){return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');};
      var t='Blog Monetization Fast Track Call with Genasys',d='Your private Zoom link is in your appointment confirmation email.';
      var g='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(t)+'&dates='+z(a)+'/'+z(b)+'&details='+encodeURIComponent(d)+'&location=Zoom';
      var ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Boss Lady Bloggers//Fast Track//EN','BEGIN:VEVENT','UID:fasttrack-'+z(a)+'@bossladybloggers.com','DTSTAMP:'+z(new Date()),'DTSTART:'+z(a),'DTEND:'+z(b),'SUMMARY:'+t,'DESCRIPTION:'+d,'LOCATION:Zoom','END:VEVENT','END:VCALENDAR'].join('\r\n');
      cal.innerHTML='<a class="pf-btn" href="'+g+'" target="_blank" rel="noopener">Add to My Calendar</a><a class="pf-btn ol" download="fast-track-call.ics" href="data:text/calendar;charset=utf-8,'+encodeURIComponent(ics)+'">Apple or Outlook</a>';
    }
  } else if(cal){cal.innerHTML='<p class="body" style="margin:0">Your calendar invitation is attached to your confirmation email.</p>';}
  var r=document.querySelector('[data-resched]');
  if(r)r.innerHTML=inv?'<a class="pf-btn cr" href="https://calendly.com/reschedulings/'+encodeURIComponent(inv)+'">Reschedule My Appointment</a>':'<p class="body" style="margin:0;text-align:center">Use the Reschedule link in your confirmation email.</p>';
})();
</script>"""])
assert s[12] == "[Add to My Calendar]" and s[oi + 4] == "[Reschedule My Appointment]"
