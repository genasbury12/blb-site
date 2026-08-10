#!/usr/bin/env python3
"""Export every built page as a .txt deliverable (clients can open txt and
copy-paste into Showit embed blocks). Run after builds + verification."""
import glob, pathlib, shutil

OUT = pathlib.Path("../deliverables")
OUT.mkdir(exist_ok=True)

LABELS = {
    "home": "home page",
    "about": "about page",
    "trip": "practice trip page",
    "start-here": "start here page",
    "contact": "contact page",
    "book": "book a call page",
    "freebie": "free checklist page",
    "thank-you": "thank you page",
    "blog": "blog coming soon page",
    "podcast": "podcast coming soon page",
    "french": "french lessons coming soon page",
    "privacy": "privacy policy SHELL (needs legal copy)",
    "terms": "terms SHELL (needs legal copy)",
    "disclaimer": "disclaimer SHELL (needs legal copy)",
}

for old in OUT.glob("*.txt"):
    old.unlink()
for f in sorted(glob.glob("*.html")):
    stem = pathlib.Path(f).stem
    label = LABELS.get(stem, stem)
    dest = OUT / f"{label} - paste into Showit embed.txt"
    shutil.copy(f, dest)
    print(f"exported {dest.name}")
