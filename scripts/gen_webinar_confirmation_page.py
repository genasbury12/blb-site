"""Builds site/_pages/webinar-confirmation.html: the Futureproof Your Blog registration confirmation page, in
The Futureproof Blogger brand, from Genasys's copy in scripts/copy/webinar-confirmation.txt.
Run: python3 scripts/gen_webinar_confirmation_page.py"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pf_parts import *
from fp_parts import orbit, THEME

IG = "https://www.instagram.com/blogcoach_gen"
REG_URL = "https://www.bossladybloggers.com/futureproof-webinar"
WELCOME_YOUTUBE_ID = ""   # paste the welcome video's YouTube ID
ANSWERS_TO = "https://formsubmit.co/ajax/hello@bossladybloggers.com"  # same FormSubmit inbox as the contact form

L, section = load_copy(Path(__file__).parent / "copy/webinar-confirmation.txt")
CHECK = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#F6F3F8" stroke-width="1.4" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ICON = {"Date": '<path d="M4 6h16v14H4zM4 10h16M8 3v5M16 3v5"/>', "Time": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        "Location": '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/>', "Duration": '<path d="M6 3h12M6 21h12M7 3c0 6 10 6 10 9s-10 3-10 9M17 3c0 6-10 6-10 9"/>'}

EXTRA2 = r'''<style>
.fpb .confhero{text-align:center;padding:clamp(70px,9vw,120px) clamp(16px,4vw,48px)}
.fpb .confhero h1{font-size:clamp(40px,5.6vw,76px);color:var(--pearl)}
.fpb .details{background:#fff;border:1px solid rgba(33,28,44,.14);padding:clamp(24px,4vw,44px);display:flex;flex-direction:column;gap:16px}
.fpb .details h3{font:italic 400 clamp(32px,3.6vw,46px)/1.05 var(--font-display);color:var(--orchid)}
.fpb .drow{display:grid;grid-template-columns:28px 110px minmax(0,1fr);align-items:center;gap:10px;padding:12px 0;border-top:1px solid rgba(33,28,44,.12);font:400 17px/1.4 var(--font-body);color:var(--orchid)}
.fpb .drow svg{width:20px;height:20px;fill:none;stroke:#69577F;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.fpb .drow span:nth-child(2){font:600 11px/1 var(--font-label);letter-spacing:.2em;text-transform:uppercase;color:var(--amethyst)}
.fpb .islot{display:inline-block;border:1px dashed #69577F;padding:2px 10px;color:#69577F;font:600 14px/1.4 var(--font-body)}
.fpb .calbtns{display:flex;flex-wrap:wrap;gap:10px}
.fpb .calbtns a,.fpb .calbtns button{flex:1 1 200px;min-height:56px;display:inline-flex;align-items:center;justify-content:center;background:var(--orchid);color:var(--pearl);border:0;border-radius:2px;font:600 13px/1 var(--font-label);letter-spacing:.2em;text-transform:uppercase;text-decoration:none;cursor:pointer}
.fpb .calbtns a.alt{background:transparent;color:var(--orchid);border:1px solid var(--orchid)}
.fpb .steps3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.fpb .steps3 article{padding:clamp(22px,3vw,32px);background:#fff;border:1px solid rgba(33,28,44,.12);display:flex;flex-direction:column;gap:10px}
.fpb .steps3 .n{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:var(--lav);font:italic 400 22px/1 var(--font-display);color:var(--orchid)}
.fpb .steps3 .k{font:600 11px/1 var(--font-label);letter-spacing:.22em;color:var(--amethyst)}
.fpb .steps3 h3{font:400 clamp(24px,2.4vw,30px)/1.15 var(--font-display);color:var(--orchid)}
.fpb .steps3 p{margin:0;font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.fpb .steps3 p.q{font:italic 400 18px/1.4 var(--font-display);color:var(--orchid)}
.fpb .player{position:relative;aspect-ratio:16/9;background:var(--orchid);overflow:hidden;display:grid;place-items:center}
.fpb .player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.fpb .player .orbit{position:absolute;width:60%;color:var(--amethyst);opacity:.5}
.fpb .player .pf-slot{position:relative;z-index:2;max-width:420px;margin:16px;border-color:#D9CDE7;color:#F6F3F8;background:rgba(33,28,44,.75)}
.fpb .nots p{margin:0;padding:14px 0;border-top:1px solid rgba(33,28,44,.16);font:italic 400 clamp(20px,2.2vw,26px)/1.35 var(--font-display);color:var(--orchid)}
.fpb .ask{background:#fff;border:1px solid rgba(33,28,44,.14);padding:clamp(22px,4vw,40px);display:flex;flex-direction:column;gap:22px}
.fpb .ask fieldset{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.fpb .ask legend,.fpb .ask label.q{font:400 clamp(20px,2.2vw,25px)/1.3 var(--font-display);color:var(--orchid);margin-bottom:6px;padding:0}
.fpb .ask .opt{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border:1px solid rgba(33,28,44,.18);cursor:pointer;font:400 16px/1.45 var(--font-body);color:var(--orchid)}
.fpb .ask .opt input{margin-top:3px;accent-color:#69577F;width:18px;height:18px;flex:none}
.fpb .ask .opt:has(input:checked){border-color:var(--amethyst);background:rgba(217,205,231,.35)}
.fpb .ask textarea{min-height:96px;border:1px solid rgba(33,28,44,.3);border-radius:2px;padding:12px 14px;font:400 16px/1.5 var(--font-body);color:var(--orchid);background:var(--pearl);resize:vertical}
.fpb .ask textarea:focus,.fpb .ask .opt:focus-within{outline:2px solid var(--amethyst);outline-offset:1px}
.fpb .ask button{min-height:58px;border:0;border-radius:2px;background:var(--orchid);color:var(--pearl);font:600 13px/1 var(--font-label);letter-spacing:.2em;text-transform:uppercase;cursor:pointer}
.fpb .ask button:disabled{opacity:.6}
.fpb .ask .msg:not(:empty){font:600 14px/1.4 var(--font-body);color:#8a3b5a}
.fpb .ask .done{font:italic 400 26px/1.35 var(--font-display);color:var(--orchid);margin:0}
.fpb .beliefs5{list-style:none;margin:0;padding:0;counter-reset:b}
.fpb .beliefs5 li{counter-increment:b;display:grid;grid-template-columns:70px minmax(0,1fr);gap:16px;padding:22px 0;border-top:1px solid rgba(246,243,248,.18);font:400 clamp(21px,2.3vw,28px)/1.35 var(--font-display);color:var(--pearl)}
.fpb .beliefs5 li::before{content:counter(b,decimal-leading-zero);font:italic 400 34px/1 var(--font-display);color:var(--flilac)}
.fpb .sig{font:italic 400 clamp(46px,6vw,70px)/1 var(--font-display);color:#fff}
@media (max-width:900px){.fpb .steps3{grid-template-columns:minmax(0,1fr)}}
@media (max-width:520px){.fpb .drow{grid-template-columns:24px minmax(0,1fr)}.fpb .drow span:nth-child(3){grid-column:2}}
</style>'''

def islot(t): return f'<span class="islot">To fill in: {e(t)}</span>'
o = [CSS, THEME, EXTRA2, '<main id="main" class="pf fpb">']
o.append('<div class="topbar" style="display:flex;justify-content:space-between;padding:14px clamp(16px,4vw,48px);background:#16121f;font:600 11px/1 var(--font-label);letter-spacing:.2em;text-transform:uppercase;color:#D9CDE7"><span>Futureproof.</span><span>Registration confirmed</span></div>')

# 01 HERO
s = section(1)
o.append(f'''<section class="confhero orc dk"><div class="nar stack" style="gap:20px;align-items:center">{CHECK}
<p class="lbl">{e(s[0])}</p><h1>{headline(s[1])}</h1><p class="big">{e(s[2])}</p>
<div class="stack" style="gap:14px;text-align:left">{"".join(P(x) for x in s[3:5])}</div>
<p class="big" style="font-style:italic;color:#D9CDE7">{e(s[5])} {e(s[6])}</p></div></section>''')

# 02 DETAILS
s = section(2)
W = WEBINAR
rows = []
for line in s[3:7]:
    k, v = line.split(": ", 1)
    val = {"Date": W["date"], "Time": W["time"], "Duration": W["duration"]}.get(k, v)
    if not (val and not val.startswith("[")) and not SHOW_SLOTS: continue  # not set yet: row left out
    shown = e(val) if val and not val.startswith("[") else islot(v[1:-1] if v.startswith("[") else v)
    rows.append(f'<div class="drow"><svg viewBox="0 0 24 24">{ICON[k]}</svg><span>{e(k)}</span><span>{shown}</span></div>')
o.append(f'''<section id="details" style="background:#F6F3F8"><div class="in" style="max-width:820px"><div class="details">
<p class="lbl">{e(s[0])}</p><h3>{e(s[1])}</h3><p class="body" style="margin:0">{e(s[2])}</p>
<div>{"".join(rows)}</div><p class="body" style="margin:0">{e(s[7])}</p>
<div data-cal></div></div></div></section>''')
assert s[8] == "[Add to My Calendar]"

# 03 NEXT STEPS
s = section(3)
idx = [i for i, l in enumerate(s) if l.startswith("STEP ")]
cards = []
for k, a in enumerate(idx):
    b = idx[k + 1] if k + 1 < len(idx) else len(s)
    body = "".join(f'<p class="{"q" if x.endswith("?") else ""}">{e(x)}</p>' for x in s[a + 2:b])
    cards.append(f'<article><span class="n">{k + 1}</span><p class="k">{e(s[a])}</p><h3>{e(s[a + 1])}</h3>{body}</article>')
o.append(f'''<section class="lavbg"><div class="in stack" style="gap:26px"><div class="nar ctr-h"><p class="lbl" style="text-align:center">What to do next</p></div>
<div class="steps3">{"".join(cards)}</div></div></section>''')

# 04 WELCOME VIDEO
s = section(4)
video = (f'<iframe src="https://www.youtube-nocookie.com/embed/{WELCOME_YOUTUBE_ID}?rel=0&modestbranding=1" title="A personal welcome from Genasys" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
         if WELCOME_YOUTUBE_ID else orbit() + slot("Your short personal welcome video. Send me the YouTube link and it plays right here."))
o.append(f'''<section style="background:#F6F3F8"><div class="in stack" style="gap:26px;max-width:960px">
<div class="nar stack ctr-h"><p class="lbl" style="text-align:center">{e(s[0])}</p><h2 style="text-align:center">{headline(s[1])}</h2></div>
{f'<div class="player">{video}</div>' if WELCOME_YOUTUBE_ID or SHOW_SLOTS else ""}
<div class="nar stack" style="gap:6px;width:100%"><div class="nots">{"".join(f"<p>{e(x)}</p>" for x in s[3:6])}</div>{P(s[6])}<p class="big" style="font-style:italic;color:#69577F">{e(s[7])}</p></div>
</div></section>''')
assert s[2].startswith("[Embed")

# 05 QUESTIONS
s = section(5)
q1 = s[3]; opts = s[4:8]; qs = [s[8], s[10], s[12]]
optsh = "".join(f'<label class="opt"><input type="radio" name="stage" value="{e(x)}"><span>{e(x)}</span></label>' for x in opts)
texts = "".join(f'<div class="stack" style="gap:6px"><label class="q" for="ans{i}">{e(q)}</label><textarea id="ans{i}" name="q{i}" maxlength="2000"></textarea></div>' for i, q in enumerate(qs, 2))
o.append(f'''<section id="questions" class="lavbg"><div class="in stack" style="gap:24px;max-width:820px">
<div class="stack"><h2>{headline(s[0])}</h2>{P(s[1])}{P(s[2])}</div>
<form class="ask" data-ask novalidate><fieldset><legend>{e(q1)}</legend>{optsh}</fieldset>{texts}
<button type="submit">{e(s[14][1:-1])}</button><p class="msg" role="alert"></p>
<p class="body" style="margin:0;font-size:15px">{e(s[15])}</p></form></div></section>''')
assert s[9] == s[11] == s[13] == "[Open text response]" and s[14] == "[Send My Answers]"

# 06 APPROACH
s = section(6)
o.append(f'''<section class="orc dk"><div class="in twocol">
<div class="stack sticky"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{P(s[2])}</div>
<div class="stack"><ol class="beliefs5">{"".join(f"<li>{e(x)}</li>" for x in s[3:8])}</ol>{"".join(P(x) for x in s[8:])}</div></div></section>''')

# 07 CONNECT
s = section(7)
o.append(f'''<section style="background:#F6F3F8"><div class="nar stack ctr-h" style="gap:18px">
<h2 style="text-align:center">{headline(s[0])}</h2>{P(s[1])}{P(s[2])}
<div class="row">{btn(s[3][1:-1], IG, "dkb", True)}</div>{P(s[4])}
<div class="row"><button type="button" class="pf-btn ol" data-share>{e(s[5][1:-1])} <i aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"><path d="M3 11L11 3M5 3h6v6"></path></svg></i></button><span class="issue" style="color:#69577F" data-shared></span></div>
</div></section>''')

# 08 CLOSING
s = section(8)
o.append(f'''<section class="portal orc dk">{orbit()}<div class="nar stack" style="gap:20px;align-items:center">
<h2>{headline(s[0])}</h2>{"".join(f'<p class="body" style="text-align:center">{e(x)}</p>' for x in s[1:4])}
<p class="body" style="margin-top:10px">{e(s[4])}</p><span class="sig">{e(s[5])}</span><p class="issue" style="color:#A99AC6">{e(s[6])}</p></div></section>''')

o.append("<script>\n(function(){\n  var W=" + json.dumps(WEBINAR) + ", REG=" + json.dumps(REG_URL) + ", TO=" + json.dumps(ANSWERS_TO) + r""";
  /* Add to calendar: Google Calendar link + .ics download, once the date is set in scripts/pf_parts.py */
  var cal=document.querySelector('[data-cal]');
  if(cal){
    if(!W.start){cal.innerHTML='';}
    else{
      var st=new Date(W.start),en=new Date(st.getTime()+(W.minutes||60)*60000);
      var z=function(d){return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');};
      var title='Futureproof Your Blog: free masterclass with Genasys',det='Your webinar access information is in your email inbox. Registration page: '+REG;
      var g='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(title)+'&dates='+z(st)+'/'+z(en)+'&details='+encodeURIComponent(det)+'&location=Online';
      var ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Boss Lady Bloggers//Futureproof//EN','BEGIN:VEVENT','UID:futureproof-'+z(st)+'@bossladybloggers.com','DTSTAMP:'+z(new Date()),'DTSTART:'+z(st),'DTEND:'+z(en),'SUMMARY:'+title,'DESCRIPTION:'+det,'LOCATION:Online','END:VEVENT','END:VCALENDAR'].join('\r\n');
      cal.innerHTML='<div class="calbtns"><a href="'+g+'" target="_blank" rel="noopener">Add to My Calendar</a><a class="alt" download="futureproof-your-blog.ics" href="data:text/calendar;charset=utf-8,'+encodeURIComponent(ics)+'">Apple or Outlook</a></div>';
    }
  }
  /* Answers: sent to Genasys's inbox through FormSubmit (same service as the contact form) */
  var f=document.querySelector('[data-ask]');
  if(f){var msg=f.querySelector('.msg');
    f.addEventListener('submit',function(ev){ev.preventDefault();
      var st=f.querySelector('input[name=stage]:checked'),a=[].map.call(f.querySelectorAll('textarea'),function(t){return t.value.trim();});
      if(!st&&!a.join('')){msg.textContent='Answer at least one question first.';return;}
      msg.textContent='';var b=f.querySelector('button');b.disabled=true;
      var who='';try{who=sessionStorage.getItem('fpw_email')||'';}catch(x){}
      var labels=[].map.call(f.querySelectorAll('legend,label.q'),function(l){return l.textContent;});
      var data={_subject:'Futureproof Your Blog: attendee answers',_template:'table',_captcha:'false',email:who||'not given'};
      data[labels[0]]=st?st.value:'';labels.slice(1).forEach(function(l,i){data[l]=a[i];});
      fetch(TO,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
        .then(function(r){if(!r.ok)throw 0;f.innerHTML='<p class="done">Thank you. I’ll read every answer before we get together.</p>';})
        .catch(function(){b.disabled=false;msg.textContent='That didn’t send. Please try again in a moment.';});
    });
  }
  /* Share the registration page */
  var sh=document.querySelector('[data-share]'),note=document.querySelector('[data-shared]');
  if(sh)sh.addEventListener('click',function(){
    var d={title:'Futureproof Your Blog',text:'A free masterclass on building a blogging business in the age of AI.',url:REG};
    if(navigator.share){navigator.share(d).catch(function(){});return;}
    if(navigator.clipboard)navigator.clipboard.writeText(REG).then(function(){note.textContent='LINK COPIED';},function(){note.textContent=REG;});else note.textContent=REG;
  });
})();
</script>""")
o.append(LEGAL + "</main>")
out = "\n".join(o)
for bad in ["—", "–", "…"]: assert bad not in out, bad
(ROOT / "webinar-confirmation.html").write_text(out)
print("wrote webinar-confirmation.html", len(out))
