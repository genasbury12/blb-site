"""Builds codes.html: one copy-ready block per Showit page code.

Run after any page rebuild: python3 make_codes_page.py
Each entry: (deliverable .txt, page label, Showit page + where it goes).
"""
import html
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PAGES = [
    ("index.txt", "Homepage", "Showit page: Home (URL /). One full-page Embed Code block, drawn full width on desktop AND on the mobile canvas."),
]

blocks = []
for i, (txt, label, where) in enumerate(PAGES, 1):
    path = os.path.join(HERE, "deliverables", txt)
    code = open(path, encoding="utf-8").read()
    kb = len(code.encode("utf-8")) // 1024
    blocks.append(f'''<section class="blk" id="code-{i}">
  <div class="bh"><div><span class="n">{i:02d}</span><h2>{label}</h2><p>{html.escape(where)}</p></div>
  <button class="cp" type="button" data-t="t{i}">Copy code</button></div>
  <textarea id="t{i}" readonly spellcheck="false" aria-label="{label} code">{html.escape(code)}</textarea>
  <p class="meta">{txt} &middot; {kb} KB &middot; {code.count(chr(10)) + 1} lines</p>
</section>''')

page = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fearless Business Boss: Showit page codes</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
<style>
:root{{--ink:#0E1B3A;--blue:#2456D3;--tint:#EBF1FA;--paper:#F7F9FC;--muted:#56637F;--gold:#C2A15A;--line:#D5DEEC}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Inter,system-ui,sans-serif}}
header{{background:var(--ink);color:#fff;padding:44px 6vw 38px}}
header small{{font:700 12px Inter;letter-spacing:.2em;text-transform:uppercase;color:#E7D6A8}}
h1{{font:600 clamp(30px,4vw,44px)/1.15 'Playfair Display',serif;margin:10px 0 12px}}
h1 em{{color:#9DBBFF}}
header ol{{margin:16px 0 0;padding-left:20px;color:#C6D2EA;max-width:820px}}
header li{{margin:4px 0}}
main{{padding:34px 6vw 70px;display:grid;gap:28px}}
.blk{{background:#fff;border:1px solid var(--line);border-radius:20px;padding:24px;box-shadow:0 20px 40px -30px rgba(14,27,58,.35)}}
.bh{{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;flex-wrap:wrap;margin-bottom:16px}}
.n{{font:italic 600 22px 'Playfair Display',serif;color:var(--gold)}}
h2{{display:inline;font:600 26px 'Playfair Display',serif;margin:0 0 0 10px}}
.bh p{{margin:6px 0 0;color:var(--muted);max-width:760px}}
.cp{{background:linear-gradient(135deg,#2F6BEA,#1E48B8);color:#fff;border:0;border-radius:40px;padding:15px 28px;font:700 14px Inter;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;min-width:190px}}
.cp.ok{{background:#1F8A5B}}
textarea{{width:100%;height:340px;border:1px solid var(--line);border-radius:14px;background:var(--tint);color:#1B2846;font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;padding:16px;resize:vertical;white-space:pre;overflow:auto}}
.meta{{margin:10px 0 0;font-size:13px;color:var(--muted)}}
.msg{{display:block;margin-top:8px;font-size:13px;color:var(--muted)}}
</style></head><body>
<header><small>Fearless Business Boss &middot; Showit install</small>
<h1>Page codes, <em>ready to copy.</em></h1>
<ol><li>Press <b>Copy code</b> on a page below.</li>
<li>In Showit, open that page, add one <b>Embed Code</b> block, and paste the whole thing in.</li>
<li>Stretch the block full width on the desktop canvas, then switch to the mobile canvas and stretch it there too.</li>
<li>The editor shows a gray box. That is normal. Save, <b>Publish</b>, then hard refresh the live page (Cmd+Shift+R).</li></ol>
</header>
<main>
{"".join(blocks)}
</main>
<script>
document.querySelectorAll('.cp').forEach(function(b){{
  b.addEventListener('click',function(){{
    var t=document.getElementById(b.dataset.t), done=function(){{b.textContent='Copied';b.classList.add('ok');setTimeout(function(){{b.textContent='Copy code';b.classList.remove('ok')}},2200)}};
    function fallback(){{t.focus();t.select();var ok=false;try{{ok=document.execCommand('copy')}}catch(e){{}}
      if(ok)done();else{{b.textContent='Press Ctrl+C / Cmd+C';}}}}
    if(navigator.clipboard&&navigator.clipboard.writeText){{navigator.clipboard.writeText(t.value).then(done,fallback)}}else fallback();
  }});
}});
</script>
</body></html>
'''
out = os.path.join(HERE, "codes.html")
open(out, "w", encoding="utf-8").write(page)
print("wrote", out, len(page) // 1024, "KB")
