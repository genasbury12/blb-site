#!/usr/bin/env python3
"""Builds the Blog Business Roadmap embeds from roadmap/*.src.html + roadmap/config.json.

Writes:
  showit-embeds/Roadmap.html       paste into the Showit page /roadmap
  showit-embeds/RoadmapTool.html   paste into the Showit page /roadmap-tool
  site/roadmap/index.html, site/roadmap-tool/index.html   standalone previews

Run:  python3 scripts/make_roadmap.py
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "roadmap"
cfg = json.loads((SRC / "config.json").read_text())
cfg.pop("_read_me", None)
blob = json.dumps(cfg, ensure_ascii=True).replace("<", "\\u003c")

BANNED = ["—", "–", "…", "..."]

def build(src, embed, page, title):
    code = (SRC / src).read_text().replace("__CONFIG__", blob)
    for b in BANNED:
        if b in code:
            sys.exit(f"{src}: banned character {b!r} found")
    (ROOT / "showit-embeds" / embed).write_text(code)
    out = ROOT / "site" / page / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text('<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
                   '<meta name="viewport" content="width=device-width, initial-scale=1">'
                   f'<meta name="robots" content="noindex"><title>{title}</title>'
                   '<style>html,body{margin:0;background:#FBF6EE}</style></head><body>\n'
                   + code + "\n</body></html>\n")
    print(f"wrote showit-embeds/{embed} ({len(code.encode())//1024} KB) and site/{page}/index.html")

build("Roadmap.src.html", "Roadmap.html", "roadmap", "Blog Business Roadmap | Boss Lady Bloggers")
build("RoadmapTool.src.html", "RoadmapTool.html", "roadmap-tool", "Roadmap Tool | Boss Lady Bloggers")
