#!/usr/bin/env python3
"""Turns pbm/pages/01-quiz.html into a Showit embed (showit-embeds/AICheckQuiz.html)
and a standalone preview page (site/ai-check/index.html).

Run:  python3 scripts/make_pbm_quiz.py
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / "pbm/pages/01-quiz.html").read_text()

head = re.search(r"<head>(.*?)</head>", src, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", src, re.S).group(1)
links = "\n".join(re.findall(r"<link [^>]+>", head))
style = re.search(r"<style>.*?</style>", head, re.S).group(0)
# The embed must not restyle the rest of the Showit page.
style = style.replace("html,body{margin:0;background:#FBF5EE}\n", "")
assert "html,body" not in style
embed = links + "\n" + style + "\n" + body.strip() + "\n"
for bad in ("—", "–"):
    assert bad not in embed, "dash found"
(ROOT / "showit-embeds/AICheckQuiz.html").write_text(embed)
out = ROOT / "site/ai-check/index.html"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(src)
print(f"wrote showit-embeds/AICheckQuiz.html ({len(embed.encode())//1024} KB) and site/ai-check/index.html")
