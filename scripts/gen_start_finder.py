"""Injects "What's your next move?" (the Boss Lady Bloggers business finder) and the offer comparison table into
site/_pages/start-here.html, between the FINDER markers (added right after the opening section the first time).
Run: python3 scripts/gen_start_finder.py"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pf_parts import *

P = ROOT / "start-here.html"
A, B = "<!-- FINDER START -->", "<!-- FINDER END -->"
Q1 = ["I haven't started yet.", "I've started but haven't made meaningful money.", "I'm making some money but not consistently.", "I have an established business."]
Q2 = ["I don't know how to build a profitable business.", "My existing business isn't generating enough sales.", "I struggle with organization and implementation.",
      "I'm worried about the future of blogging and AI.", "I want to create innovative digital products.", "I need help with my brand and website."]
Q3 = ["Private coaching and professional help. I'm prepared to consider a premium investment.", "Paid education that I can implement independently.", "Free education while I explore my options."]
# Results: wording from Genasys's approved offer copy
R = {
 "boss": ["The BOSS Business Experience", "Private blog coaching, custom Showit website design and done for you business development: your 12 month private partnership.", "Apply for a Fast Track Call", "/apply/", "Explore The BOSS Business Experience", "/coaching/"],
 "ladies": ["The Blogging Ladies Membership", "Learn the complete strategic process behind building a profitable blogging business, with practical projects, roadmaps and action plans. $47/month.", "Explore the Membership", "/membership/", "", ""],
 "fpb": ["The Futureproof Blogger", "Build a business for where the internet is going, not just where it's been.", "Explore The Futureproof Blogger", "/futureproof-blogger/", "", ""],
 "pbm": ["The Productive Blogger Method", "Use Claude to turn your business strategies, ideas and goals into organized projects and practical implementation plans.", "Explore the Course", "/academy/#course-pbm", "", ""],
 "icc": ["The Interactive Course Creator", "Learn how to use Claude to turn your expertise into an interactive, branded online course.", "Explore the Course", "/interactive-course-creator/", "", ""],
 "web": ["Futureproof Your Blog", "My free masterclass: how to build a profitable blogging business in the age of AI.", "Save My Free Seat", "/futureproof-webinar/", "", ""],
 "map": ["The Blog Business Roadmap", "A free assessment that shows you exactly where your blogging business is and what to work on next.", "Get My Free Roadmap", "/roadmap/", "", ""],
}
# support (q3) first, then challenge (q2)
LOGIC = {"0": {"*": "boss"},
         "1": {"0": "ladies", "1": "ladies", "2": "pbm", "3": "fpb", "4": "icc", "5": "ladies"},
         "2": {"3": "web", "*": "map"}}

ROWS = [("Private coaching", "Included", "Not included", "Not included"), ("Personalized business strategy", "Included", "Independent implementation", "Course specific"),
        ("Custom website design", "Included", "Not included", "Not included"), ("Complete business education", "Guided", "BOSS Business System", "Specialized topics"),
        ("AI education", "Personalized to your business", "According to curriculum", "Specialized courses"), ("Professional implementation", "Agreed project scope", "Independent", "Independent"),
        ("Ongoing private mentorship", "12 months", "Not included", "Not included"), ("Investment", "Premium partnership", "$47/month", "Individual or bundled"),
        ("Starting point", '<a href="/apply/">Fast Track Call</a>', '<a href="/membership/">Join the membership</a>', '<a href="/academy/">Shop courses</a>')]

def radios(name, opts):
    return "".join(f'<label class="opt"><input type="radio" name="{name}" value="{i}"><span>{e(t)}</span></label>' for i, t in enumerate(opts))

html = f'''{A}
<style>
.bf{{--plum:#3A1C2A;--berry:#A23E66;--rose:#E9B9CA;--blush:#F6E1E8;--cream:#FBF5EE}}
.bf section{{padding:clamp(72px,9vw,120px) clamp(16px,4vw,48px)}}
.bf .in{{max-width:980px;margin:0 auto;display:flex;flex-direction:column;gap:26px}}
.bf .lbl{{margin:0;font:500 12px/1.5 var(--font-label);letter-spacing:.2em;text-transform:uppercase;color:var(--berry);text-align:center}}
.bf h2{{margin:0;font:400 clamp(40px,5vw,64px)/1.02 var(--font-display);color:var(--plum);text-align:center;letter-spacing:-.015em}}
.bf h2 em{{color:var(--berry)}}
.bf .sub{{margin:0;font:400 18px/1.65 var(--font-body);color:#4A2F3B;text-align:center;max-width:640px;align-self:center}}
.bf .finder{{background:#fff;border-radius:30px;padding:clamp(22px,4vw,40px);display:flex;flex-direction:column;gap:26px;box-shadow:0 30px 60px -40px rgba(58,28,42,.6)}}
.bf fieldset{{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}}
.bf legend{{font:400 clamp(22px,2.4vw,28px)/1.25 var(--font-display);color:var(--plum);margin-bottom:8px;padding:0}}
.bf legend b{{font:700 24px/1 var(--font-script);color:var(--berry);margin-right:8px;font-weight:700}}
.bf .opts{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}}
.bf .opt{{display:flex;gap:10px;align-items:flex-start;padding:13px 15px;border:1.5px solid var(--rose);border-radius:14px;cursor:pointer;font:400 15.5px/1.45 var(--font-body);color:var(--plum)}}
.bf .opt input{{margin-top:3px;accent-color:#A23E66;width:18px;height:18px;flex:none}}
.bf .opt:has(input:checked){{border-color:var(--berry);background:var(--blush)}}
.bf .opt:focus-within{{outline:3px solid var(--berry);outline-offset:2px}}
.bf .go{{align-self:flex-start;min-height:58px;padding:0 30px;border:0;border-radius:999px;background:var(--berry);color:#fff;font:600 16px/1 var(--font-body);cursor:pointer}}
.bf .go:focus-visible{{outline:3px solid var(--plum);outline-offset:3px}}
.bf .msg:not(:empty){{margin:0;font:600 14.5px/1.4 var(--font-body);color:#9B2C2C}}
.bf .result{{background:var(--plum);color:var(--cream);border-radius:24px;padding:clamp(22px,3vw,34px);display:flex;flex-direction:column;gap:12px}}
.bf .result[hidden]{{display:none}}
.bf .result .k{{font:500 11.5px/1 var(--font-label);letter-spacing:.2em;text-transform:uppercase;color:var(--rose)}}
.bf .result h3{{margin:0;font:400 clamp(32px,3.6vw,46px)/1.05 var(--font-display);color:#fff}}
.bf .result p{{margin:0;font:400 17px/1.6 var(--font-body);color:#F6E1E8}}
.bf .result .row{{display:flex;flex-wrap:wrap;gap:10px}}
.bf .result a{{display:inline-flex;align-items:center;min-height:54px;padding:0 24px;border-radius:999px;background:var(--cream);color:var(--plum);font:600 15.5px/1 var(--font-body);text-decoration:none}}
.bf .result a.alt{{background:transparent;color:var(--cream);border:1.5px solid rgba(233,185,202,.6)}}
.bf .tblwrap{{overflow-x:auto;background:#fff;border-radius:24px;padding:8px clamp(8px,2vw,18px)}}
.bf table{{width:100%;min-width:640px;border-collapse:collapse;font:400 15px/1.45 var(--font-body);color:var(--plum)}}
.bf th,.bf td{{text-align:left;padding:14px 12px;border-bottom:1px solid var(--blush);vertical-align:top}}
.bf thead th{{font:400 22px/1.15 var(--font-display);color:var(--plum)}}
.bf thead th:nth-child(2){{color:var(--berry)}}
.bf tbody th{{font-weight:600}}
.bf td a{{color:var(--berry);font-weight:600}}
.bf tr:last-child th,.bf tr:last-child td{{border-bottom:0}}
@media (max-width:700px){{.bf .opts{{grid-template-columns:minmax(0,1fr)}}}}
</style>
<div class="bf">
<section id="finder" style="background:#F6E1E8;scroll-margin-top:80px"><div class="in">
<p class="lbl">The Boss Lady Bloggers business finder</p><h2>What&rsquo;s your <em>next move?</em></h2>
<p class="sub">Answer three questions to find the educational experience or professional support that makes sense for you.</p>
<form class="finder" data-finder novalidate>
<fieldset><legend><b>1.</b>Where are you in your blogging business?</legend><div class="opts">{radios("q1", Q1)}</div></fieldset>
<fieldset><legend><b>2.</b>What&rsquo;s your biggest challenge right now?</legend><div class="opts">{radios("q2", Q2)}</div></fieldset>
<fieldset><legend><b>3.</b>What type of support are you looking for?</legend><div class="opts">{radios("q3", Q3)}</div></fieldset>
<button type="submit" class="go">Find My Starting Point</button><p class="msg" role="alert"></p>
<div class="result" data-result hidden aria-live="polite"></div>
</form></div></section>
<section style="background:#FBF5EE"><div class="in">
<p class="lbl">Compare your options</p><h2>Three ways <em>to work with me.</em></h2>
<div class="tblwrap"><table><thead><tr><th scope="col"><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Compare</span></th><th scope="col">The BOSS Business Experience</th><th scope="col">Blogging Ladies</th><th scope="col">The BOSS Academy</th></tr></thead>
<tbody>{"".join(f'<tr><th scope="row">{e(r[0])}</th>' + "".join(f"<td>{c if c.startswith('<a') else e(c)}</td>" for c in r[1:]) + "</tr>" for r in ROWS)}</tbody></table></div>
</div></section>
</div>
<script>
(function(){{
  var R={json.dumps(R)},L={json.dumps(LOGIC)};
  var f=document.querySelector('[data-finder]');if(!f)return;var out=f.querySelector('[data-result]'),msg=f.querySelector('.msg');
  function esc(t){{var d=document.createElement('div');d.textContent=t;return d.innerHTML;}}
  f.addEventListener('submit',function(ev){{ev.preventDefault();
    var v=function(n){{var el=f.querySelector('input[name='+n+']:checked');return el?el.value:null;}};
    var a=v('q1'),b=v('q2'),c=v('q3');
    if(a===null||b===null||c===null){{msg.textContent='Answer all three questions to see your starting point.';return;}}
    msg.textContent='';var m=L[c],k=m[b]||m['*'],r=R[k];
    out.innerHTML='<p class="k">Your starting point</p><h3>'+esc(r[0])+'</h3><p>'+esc(r[1])+'</p><div class="row"><a href="'+r[3]+'">'+esc(r[2])+'</a>'+(r[4]?'<a class="alt" href="'+r[5]+'">'+esc(r[4])+'</a>':'')+'</div>';
    out.hidden=false;out.scrollIntoView({{behavior:'smooth',block:'nearest'}});
  }});
}})();
</script>
{B}'''
s = P.read_text()
if A in s:
    s = s[:s.index(A)] + html + s[s.index(B) + len(B):]
else:
    i = s.index("</section>") + len("</section>")
    s = s[:i] + "\n\n" + html + "\n" + s[i:]
for bad in ["—", "–", "…"]: assert bad not in html, bad
P.write_text(s); print("finder injected into start-here.html")
