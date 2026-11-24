"""Builds site/_pages/futureproof-webinar.html: the free "Futureproof Your Blog" masterclass registration page,
in The Futureproof Blogger brand, from Genasys's copy in scripts/copy/futureproof-webinar.txt.
Run: python3 scripts/gen_futureproof_webinar_page.py"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pf_parts import *
from fp_parts import orbit, THEME

SRC = Path(__file__).parent / "copy/futureproof-webinar.txt"
L, section = load_copy(SRC, [("I built a multi six figure brand", "I built a money making brand")])
def go(label, cls=""): return btn(label, "#register", cls)
_flow = flow
def flow(lines, cta_cls=""): return _flow(lines, cta_cls, go)

EXTRA2 = r'''<style>
.fpb .stack > .orbit{width:100%;max-width:340px;color:var(--amethyst);opacity:.8}
.fpb .topbar{display:flex;justify-content:space-between;align-items:center;padding:14px clamp(16px,4vw,48px);background:#16121f;font:600 11px/1 var(--font-label);letter-spacing:.2em;text-transform:uppercase;color:#D9CDE7}
.fpb .lock{text-align:center;color:var(--pearl);margin:0}
.fpb .lock .a{display:block;font:italic 400 clamp(40px,5.4vw,72px)/1 var(--font-display);color:var(--lav)}
.fpb .lock .b{display:block;font:500 clamp(64px,10vw,150px)/.95 var(--font-display);letter-spacing:-.02em;color:#fff}
.fpb .era{font:500 clamp(12px,1.4vw,16px)/1.4 var(--font-label);letter-spacing:.42em;text-transform:uppercase;color:var(--pearl);text-align:center}
.fpb .qlist p{margin:0;padding:14px 0;border-top:1px solid rgba(246,243,248,.18);font:italic 400 clamp(21px,2.3vw,28px)/1.3 var(--font-display);color:var(--pearl)}
.fpb .reg{background:#fff;border:1px solid rgba(33,28,44,.16);padding:clamp(22px,3.6vw,36px);display:flex;flex-direction:column;gap:14px;color:var(--orchid)}
.fpb .reg h3{font:400 clamp(28px,3vw,38px)/1.1 var(--font-display);color:var(--orchid)}
.fpb .reg .field{display:flex;flex-direction:column;gap:6px}
.fpb .reg label{font:600 11px/1 var(--font-label);letter-spacing:.2em;text-transform:uppercase;color:var(--amethyst)}
.fpb .reg input[type=text]{min-height:54px;border:1px solid rgba(33,28,44,.3);border-radius:2px;padding:0 16px;font:400 16px/1 var(--font-body);color:var(--orchid);background:var(--pearl);-webkit-appearance:none;appearance:none}
.fpb .reg input[type=text]:focus{outline:2px solid var(--amethyst);outline-offset:1px}
.fpb .reg button{min-height:58px;border:0;border-radius:2px;background:var(--orchid);color:var(--pearl);font:600 13px/1 var(--font-label);letter-spacing:.2em;text-transform:uppercase;cursor:pointer}
.fpb .reg button:focus-visible{outline:3px solid var(--flilac);outline-offset:3px}
.fpb .reg button:disabled{opacity:.6}
.fpb .reg .note{font:400 13.5px/1.5 var(--font-body);color:#5a5266}
.fpb .reg .err:not(:empty){font:600 14px/1.4 var(--font-body);color:#8a3b5a}
.fpb .reg .done{font:italic 400 26px/1.3 var(--font-display);color:var(--orchid);margin:0}
.fpb .quotes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.fpb .quotes p{margin:0;padding:22px;background:#fff;border:1px solid rgba(33,28,44,.12);font:italic 400 clamp(19px,2vw,23px)/1.4 var(--font-display);color:var(--orchid)}
.fpb .buys p{margin:0;padding:12px 0;border-top:1px solid rgba(33,28,44,.16);font:400 clamp(20px,2.2vw,26px)/1.3 var(--font-display);color:var(--orchid)}
.fpb .buys p em{color:var(--amethyst)}
.fpb .models{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.fpb .models > div{padding:clamp(22px,3vw,34px);display:flex;flex-direction:column;gap:6px}
.fpb .models .old{background:#fff;border:1px solid rgba(33,28,44,.14)}
.fpb .models .new{background:var(--orchid);color:var(--pearl)}
.fpb .models h3{font:italic 400 clamp(24px,2.4vw,30px)/1.2 var(--font-display);margin-bottom:10px}
.fpb .models ol{margin:0;padding:0;list-style:none;counter-reset:m}
.fpb .models li{counter-increment:m;display:flex;gap:14px;padding:10px 0;border-top:1px solid currentColor;border-color:rgba(127,117,145,.3);font:400 17px/1.4 var(--font-body)}
.fpb .models li::before{content:counter(m,decimal-leading-zero);font:italic 400 18px/1.3 var(--font-display);color:var(--flilac)}
.fpb .models .old li{color:#5a5266}
.fpb .nots p{margin:0;padding:16px 0;border-top:1px solid rgba(246,243,248,.18);font:italic 400 clamp(21px,2.4vw,28px)/1.35 var(--font-display);color:var(--pearl)}
.fpb .who{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px}
.fpb .who article{padding:24px;background:#fff;border:1px solid rgba(33,28,44,.12);display:flex;flex-direction:column;gap:8px}
.fpb .who h3{font:400 23px/1.2 var(--font-display);color:var(--orchid)}
.fpb .who p{margin:0;font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.fpb .learn li{grid-template-columns:90px minmax(0,1fr)}
.fpb .learn li div{display:flex;flex-direction:column;gap:8px}
.fpb .learn li b{font:400 clamp(22px,2.4vw,30px)/1.25 var(--font-display);font-weight:400;color:var(--orchid)}
.fpb .learn li p{margin:0;font:400 16.5px/1.6 var(--font-body);color:var(--cocoa)}
.fpb .outc{list-style:none;margin:0;padding:0;display:grid;gap:0}
.fpb .outc li{padding:16px 0 16px 34px;border-top:1px solid rgba(246,243,248,.18);position:relative;font:400 17px/1.5 var(--font-body);color:var(--pearl)}
.fpb .outc li::before{content:"";position:absolute;left:4px;top:24px;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#C8CCD8 50%,#8E92A4)}
.fpb .faq details{border-radius:2px;border:1px solid rgba(33,28,44,.25)}
.fpb .faq summary{font-family:var(--font-body);font-weight:500}
@media (max-width:700px){.fpb .quotes,.fpb .models{grid-template-columns:minmax(0,1fr)}.fpb .topbar span:last-child{display:none}}
</style>'''

def regform(n):
    return f'<div class="reg" data-reg="{n}"></div>'

o = [CSS, THEME, EXTRA2, '<main id="main" class="pf fpb">']
o.append('<div class="topbar"><span>Futureproof.</span><span>Free masterclass</span></div>')

# 01 HERO
s = section(1)
o.append(f'''<section class="hero orc dk"><div class="in stack" style="gap:30px">
<p class="lbl" style="text-align:center">{e(s[0])}</p>
<p class="lock" aria-label="{e(s[1])}"><span class="a">Futureproof</span><span class="b">Your Blog.</span></p>
<hr class="rule" style="color:#F6F3F8;max-width:420px;margin:0 auto;width:100%"><p class="era">The next era of online business</p>
<div class="hero-grid" style="margin-top:10px">
<div class="stack" style="gap:20px"><p class="big">{e(s[2])}</p><div class="qlist">{"".join(f"<p>{e(x)}</p>" for x in s[3:7])}</div>
{flow(s[7:11])}<div class="row">{go(s[11][1:-1])}</div>
<div class="stack" style="gap:6px"><p class="issue" style="color:#D9CDE7">{e(s[12])}</p><p class="issue" style="color:#A99AC6">{e(s[13])}</p></div>{slot(s[14][8:-1])}</div>
<figure class="portrait" style="margin:0">{orbit()}<img src="/images/photos/portrait-hat.jpg" alt="Genasys, founder of Boss Lady Bloggers"><figcaption class="issue">Your host / Genasys</figcaption></figure>
</div></div></section>''')
assert s[1] == "Futureproof Your Blog" and s[11] == "[Save My Free Seat]"

# 02 REGISTRATION
s = section(2)
REG = {"title": s[0], "sub": s[1], "first": s[2], "email": s[3], "button": s[4][1:-1], "note": s[5], "consent": s[6][8:-1]}
o.append(f'''<section id="register" class="orc dk" style="padding-top:0;scroll-margin-top:20px"><div class="in" style="max-width:720px">{regform(1)}</div></section>''')

def split(n, bg, dark=False):
    lb, h, rest = head(section(n))
    lbx = f'<p class="lbl">{e(lb)}</p>' if lb else ""
    dk = ' class="dk"' if dark else ""
    return (f'<section{dk} style="background:{bg}"><div class="in twocol"><div class="stack sticky">{lbx}<h2>{headline(h)}</h2></div>'
            f'<div class="stack">{flow(rest)}</div></div></section>')

# 03 PROBLEM: the traditional advice as an editorial index
s = section(3)
ai = s.index("Pick a profitable niche."); bi = s.index("Eventually, start making money.")
o.append(f'''<section style="background:#F6F3F8"><div class="in twocol">
<div class="stack sticky"><p class="lbl">The problem</p><h2>{headline(s[0])}</h2></div>
<div class="stack">{flow(s[1:ai])}<ol class="index">{"".join(f"<li><span>{e(x)}</span></li>" for x in s[ai:bi + 1])}</ol>{flow(s[bi + 1:])}</div></div></section>''')

# 04 INTERNAL CONVERSATION
s = section(4)
qi = [i for i, l in enumerate(s) if l.startswith('"')]
o.append(f'''<section class="lavbg"><div class="in stack" style="gap:28px">
<div class="nar stack ctr-h"><p class="lbl" style="text-align:center">{e(s[0])}</p><h2 style="text-align:center">{headline(s[1])}</h2></div>
<div class="quotes">{"".join(f"<p>{e(s[i])}</p>" for i in qi)}</div>
<div class="nar stack">{flow(s[qi[-1] + 1:])}</div></div></section>''')

# 05 BELIEF SHIFT
s = section(5)
bi = [i for i, l in enumerate(s) if l.startswith(("People also purchase", "They purchase"))]
o.append(f'''<section class="state orc dk"><p class="lbl" style="margin-bottom:22px">The belief shift</p><h2>Information is everywhere. <em>Value is not.</em></h2></section>
<section style="background:#F6F3F8"><div class="in twocol"><div class="stack sticky">{flow(s[1:bi[0]])}</div>
<div class="stack"><div class="buys">{"".join(f"<p>{e(s[i])}</p>" for i in bi)}</div>{flow(s[bi[-1] + 1:])}</div></div></section>''')
assert s[0] == "Information is everywhere. Value is not."

# 06 WHAT YOU'LL LEARN
s = section(6)
ii = [i for i, l in enumerate(s) if l[:2].isdigit() and l[2:4] == ". "]
items = []
for k, a in enumerate(ii):
    b = ii[k + 1] if k + 1 < len(ii) else len(s) - 1
    items.append(f'<li><div><b>{e(s[a][4:])}</b>{"".join(f"<p>{e(x)}</p>" for x in s[a + 1:b])}</div></li>')
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:28px">
<div class="nar stack ctr-h"><p class="lbl" style="text-align:center">{e(s[0])}</p><h2 style="text-align:center">{headline(s[1])}</h2></div>
<ol class="index learn nar" style="width:100%">{"".join(items)}</ol>
<div class="row" style="justify-content:center">{go(s[-1][1:-1], "dkb")}</div></div></section>''')

# 07 BUSINESS MODEL
s = section(7)
ti = s.index("The traditional starting point"); bi = s.index("The business first starting point")
be = s.index("Your blog still has a purpose.")
o.append(f'''<section class="lavbg"><div class="in stack" style="gap:28px">
<div class="nar stack ctr-h"><h2 style="text-align:center">{headline(s[0])}</h2>{flow(s[1:ti])}</div>
<div class="models"><div class="old"><h3>{e(s[ti])}</h3><ol>{"".join(f"<li>{e(x)}</li>" for x in s[ti + 1:bi])}</ol></div>
<div class="new"><h3>{e(s[bi])}</h3><ol>{"".join(f"<li>{e(x)}</li>" for x in s[bi + 1:be])}</ol></div></div>
<div class="nar stack">{flow(s[be:])}</div></div></section>''')

# 08 WHAT IT IS NOT
s = section(8)
ne = next(i for i, l in enumerate(s) if l.startswith("This is a strategic"))
o.append(f'''<section class="orc dk"><div class="in twocol">
<div class="stack sticky"><p class="lbl">What this masterclass is not</p>{orbit("orbit")}</div>
<div class="stack"><div class="nots">{"".join(f"<p>{e(x)}</p>" for x in s[:ne])}</div>{flow(s[ne:])}</div></div></section>''')

# 09 WHO SHOULD ATTEND
s = section(9)
we = next(i for i, l in enumerate(s) if l.startswith("You don't need an established"))
pairs_ = s[1:we]
o.append(f'''<section style="background:#F6F3F8"><div class="in stack" style="gap:28px">
<div class="nar stack ctr-h"><p class="lbl" style="text-align:center">Who should attend?</p><h2 style="text-align:center">{headline(s[0])}</h2></div>
<div class="who">{"".join(f"<article><h3>{e(t)}</h3><p>{e(d)}</p></article>" for t, d in zip(pairs_[::2], pairs_[1::2]))}</div>
<div class="nar stack" style="text-align:center">{"".join(f'<p class="big">{e(x)}</p>' for x in s[we:])}</div></div></section>''')

# 10 HOST
s = section(10)
o.append(f'''<section style="background:#FFFFFF"><div class="in twocol">
<div class="stack sticky"><figure class="portrait" style="margin:0"><img src="/images/photos/desk-writing.jpg" alt="Genasys writing at her desk" loading="lazy"></figure></div>
<div class="stack"><p class="lbl">{e(s[0])}</p><h2>{headline(s[1])}</h2>{flow(s[2:])}</div></div></section>''')

# 11 OUTCOME
s = section(11)
oi = [i for i, l in enumerate(s) if l.startswith("* ")]
o.append(f'''<section class="orc dk"><div class="in twocol">
<div class="stack sticky"><p class="lbl">The outcome</p><h2>{headline(s[0])}</h2>{flow(s[1:oi[0]])}</div>
<div class="stack"><ul class="outc">{"".join(f"<li>{e(s[i][2:])}</li>" for i in oi)}</ul>{flow(s[oi[-1] + 1:])}</div></div></section>''')

# 12 FAQ
s = section(12)
qs, cur = [], None
for l in s:
    if l.endswith("?") and len(l) < 110: cur = [l, []]; qs.append(cur)
    elif cur: cur[1].append(l)
def ans(lines):
    return [f'<span style="display:inline-block;border:1px dashed #69577F;padding:3px 10px;color:#69577F;font-weight:600">To fill in: {e(l[8:-1])}</span>' if l.startswith("[Insert") else e(l) for l in lines]
o.append(f'''<section style="background:#F6F3F8"><div class="nar stack" style="gap:26px">
<div class="stack" style="text-align:center;gap:14px"><p class="lbl">Frequently asked questions</p><h2>Before you <em>reserve your seat.</em></h2></div>
<div class="faq">{"".join(faq(q, ans(a)) for q, a in qs)}</div></div></section>''')

# 13 FINAL REGISTRATION
s = section(13)
fi = s.index("Futureproof Your Blog")
o.append(f'''<section class="portal orc dk">{orbit()}<div class="in stack" style="gap:30px;max-width:760px">
<p class="lbl">{e(s[0])}</p>{flow(s[1:fi])}
<p class="lock"><span class="a">Futureproof</span><span class="b" style="font-size:clamp(52px,7vw,96px)">Your Blog.</span></p>
<p class="body" style="text-align:center">{e(s[fi + 1])}</p><p class="issue" style="color:#A99AC6;text-align:center">{e(s[fi + 2])} {e(s[fi + 3])}</p>
<div style="text-align:left">{regform(2)}</div>
<div class="lines"><p>{e(s[-2])}</p><p>{e(s[-1])}</p></div></div></section>''')
assert s[fi + 4] == "[Registration Form]"

# registration form (Flodesk custom markup, same pattern as the homepage webinar form)
o.append("<script>\n(function(){\n  var FORM_ID=" + json.dumps(WEBINAR_FORM_ID) + ", T=" + json.dumps(REG) + r""";
  var cfg=btoa(JSON.stringify({trigger:{mode:"immediately",value:0},onSuccess:{mode:"message",message:"",redirectUrl:""},coi:false,showForReturnVisitors:true,notification:true,gdpr:{acceptsMarketing:false,privacyPolicy:{enabled:false,mandatory:false}},trackingConfig:{metaPixelId:"",cookieBannerEnabled:false,googleAnalyticsId:""}}));
  function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML;}
  var ARR='<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="margin-left:10px;vertical-align:-2px"><path d="M3 11L11 3M5 3h6v6"></path></svg>';
  document.querySelectorAll('[data-reg]').forEach(function(host){
    var n=host.getAttribute('data-reg'),id='fpw-'+n,f=FORM_ID;
    host.innerHTML='<h3>'+esc(T.title)+'</h3><p class="note" style="font-size:15.5px;color:#3B3446">'+esc(T.sub)+'</p>'+
      '<div id="'+id+'"'+(f?' data-ff-el="root" data-ff-version="3" data-ff-type="inline" data-ff-name="futureproof-webinar" data-ff-stage="default"':'')+'>'+(f?'<div data-ff-el="config" data-ff-config="'+cfg+'" style="display:none"></div>':'')+
      '<form novalidate'+(f?' action="https://form.flodesk.com/forms/'+f+'/submit" method="post" data-ff-el="form"':'')+' style="display:flex;flex-direction:column;gap:12px"><div data-ff-el="content" style="display:flex;flex-direction:column;gap:12px"><div data-ff-el="fields" style="display:flex;flex-direction:column;gap:12px">'+
      '<div class="field"><label for="'+id+'-f">'+esc(T.first)+'</label><input id="'+id+'-f" type="text" name="firstName" maxlength="255" autocomplete="given-name"></div>'+
      '<div class="field"><label for="'+id+'-e">'+esc(T.email)+'</label><input id="'+id+'-e" type="text" name="email" maxlength="255" inputmode="email" autocomplete="email"></div>'+
      '<input type="text" name="confirm_email_address" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true"></div>'+
      '<div data-ff-el="footer"><button type="submit" data-ff-el="submit" style="width:100%">'+esc(T.button)+ARR+'</button></div></div>'+
      '<div data-ff-el="success"></div><p class="err" data-ff-el="error" role="alert"></p></form></div>'+
      '<p class="note">'+esc(T.note)+'</p>'+
      '<div class="pf-slot sm"><b>To fill in</b>'+esc(T.consent)+'</div>'+
      (f?'':'<div class="pf-slot sm"><b>To fill in</b>The Flodesk form for this webinar is not connected yet, so sign ups are not saved.</div>');
    var wrap=document.getElementById(id),form=wrap.querySelector('form'),err=wrap.querySelector('.err'),done=false;
    function finish(){if(done)return;done=true;try{sessionStorage.setItem('fpw_email',form.querySelector('[name=email]').value.trim());}catch(x){}location.href='/webinar-confirmation/';wrap.innerHTML='<p class="done">You’re in. Your webinar details are on their way to your inbox.</p>';}
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var nm=form.querySelector('[name=firstName]').value.trim(),em=form.querySelector('[name=email]').value.trim();
      if(!nm){err.textContent='Add your first name.';return;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){err.textContent='That email doesn’t look quite right yet.';return;}
      err.textContent='';
      if(!f){err.textContent='This form is not connected to Flodesk yet.';return;}
      form.querySelector('button').disabled=true;
      if(window.fd&&window.fd.q){try{fetch('https://form.flodesk.com/forms/'+f+'/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:nm,email:em,confirm_email_address:''}),keepalive:true}).catch(function(){});}catch(x){}setTimeout(finish,400);return;}
      setTimeout(function(){if(wrap.getAttribute('data-ff-stage')!=='error')finish();},9000);
    },true);
    if(f){
      (function(w,d,t,h,s,nm){if(w.fd)return;w.FlodeskObject=nm;var fn=function(){(w[nm].q=w[nm].q||[]).push(arguments);};w[nm]=w[nm]||fn;var g=d.getElementsByTagName(t)[0];var v='?v='+Math.floor(new Date().getTime()/(120*1000))*60;var sm=d.createElement(t);sm.async=true;sm.type='module';sm.src=h+s+'.mjs'+v;g.parentNode.insertBefore(sm,g);var sn=d.createElement(t);sn.async=true;sn.noModule=true;sn.src=h+s+'.js'+v;g.parentNode.insertBefore(sn,g);})(window,document,'script','https://assets.flodesk.com','/universal','fd');
      window.fd('form:handle',{formId:f,rootEl:'#'+id});
      if(window.MutationObserver)new MutationObserver(function(){var st=wrap.getAttribute('data-ff-stage');if(st==='success')finish();if(st==='error')form.querySelector('button').disabled=false;}).observe(wrap,{attributes:true,attributeFilter:['data-ff-stage']});
    }
  });
})();
</script>""")

o.append(LEGAL + "</main>")
out = "\n".join(o)
for bad in ["—", "–", "…"]: assert bad not in out, bad
assert "six figure" not in out.lower()
(ROOT / "futureproof-webinar.html").write_text(out)
print("wrote futureproof-webinar.html", len(out))
