#!/usr/bin/env python3
"""Convert the built static site into paste-ready Showit embed files.

Each output file in showit-embeds/ is one self-contained HTML block to paste
into a full-page Showit embed canvas: fonts link + all CSS inline + the page
content + the site JS adapted for Showit (no Netlify function calls, safety
reveal for the Showit editor).

Run after site/build.py:  python3 site/build_showit_embeds.py
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT.parent / "showit-embeds"
ASSET_HOST = "https://charming-caramel-d2453c.netlify.app"

# built page -> (embed file name, showit page slug)
PAGES = {
    "index.html":                ("Home.html", "/"),
    "start-here/index.html":     ("StartHere.html", "/start-here"),
    "about/index.html":          ("About.html", "/about"),
    "boss/index.html":           ("Boss.html", "/boss"),
    "coaching/index.html":       ("BlogCoaching.html", "/blog-coaching"),
    "group-coaching/index.html": ("GroupCoaching.html", "/group-coaching"),
    "course/index.html":         ("Course.html", "/course"),
    "group-waitlist/index.html": ("GroupWaitlist.html", "/group-waitlist"),
    "course-waitlist/index.html":("CourseWaitlist.html", "/course-waitlist"),
    "free-trainings/index.html": ("FreeTrainings.html", "/free-trainings"),
    "podcast/index.html":        ("Podcast.html", "/podcast"),
    "blog/index.html":           ("BlogLanding.html", "/blog"),
    "contact/index.html":        ("Contact.html", "/contact"),
    "thank-you/index.html":      ("ThankYou.html", "/thank-you"),
    "404.html":                  ("NotFound404.html", "/404"),
}

# internal link rewrites (folder URLs -> Showit slugs)
LINKMAP = [
    ('href="/start-here/"', 'href="/start-here"'),
    ('href="/about/"', 'href="/about"'),
    ('href="/boss/"', 'href="/boss"'),
    ('href="/coaching/"', 'href="/blog-coaching"'),
    ('href="/group-coaching/"', 'href="/group-coaching"'),
    ('href="/course/"', 'href="/course"'),
    ('href="/group-waitlist/"', 'href="/group-waitlist"'),
    ('href="/course-waitlist/"', 'href="/course-waitlist"'),
    ('href="/free-trainings/"', 'href="/free-trainings"'),
    ('href="/podcast/"', 'href="/podcast"'),
    ('href="/blog/post-template.html"', 'href="/blog"'),
    ('href="/blog/"', 'href="/blog"'),
    ('href="/contact/"', 'href="/contact"'),
    ('href="/thank-you/"', 'href="/thank-you"'),
    ('href="/404.html"', 'href="/404"'),
]

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1'
         '&family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500'
         '&family=Caveat:wght@600;700&display=swap">')


def embed_js() -> str:
    js = (ROOT / "js/main.js").read_text()
    # Showit: no Netlify function. All waitlist forms just show the success
    # state until a Flodesk inline embed replaces them (see the paste guide).
    start = js.find("      // Forms with data-list save through the Netlify function into Flodesk.")
    end = js.find("      // Forms without data-list just show the success state (no backend yet).")
    assert start != -1 and end != -1, "waitlist block not found"
    js = js[:start] + js[end:]
    # Safety net for the Showit editor and any iframe where IO never fires:
    js = js.replace(
        "})();",
        "  /* Showit safety: reveal anything still hidden after 2.5s */\n"
        "  setTimeout(function () {\n"
        "    document.querySelectorAll('.rv:not(.in)').forEach(function (el) { el.classList.add('in'); });\n"
        "  }, 2500);\n"
        "})();", 1)
    return js


def main() -> None:
    OUT.mkdir(exist_ok=True)
    css = (ROOT / "css/tokens.css").read_text() + "\n" + (ROOT / "css/styles.css").read_text()
    js = embed_js()
    for src, (name, slug) in PAGES.items():
        html = (ROOT / src).read_text()
        body = html.split("<body>", 1)[1].rsplit("</body>", 1)[0]
        # strip the page's own <script src> (we inline it) -- none in body, ok
        # contact form -> FormSubmit (Showit has no Netlify Forms)
        body = body.replace(
            '<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thank-you/"',
            '<form action="https://formsubmit.co/hello@bossladybloggers.com" method="POST"')
        body = body.replace('<input type="hidden" name="form-name" value="contact">',
                            '<input type="hidden" name="_next" value="https://www.bossladybloggers.com/thank-you">'
                            '<input type="hidden" name="_captcha" value="false">')
        body = body.replace('name="bot-field"', 'name="_honey"')
        # internal links
        for a, b in LINKMAP:
            body = body.replace(a, b)
        # assets served from the Netlify project (acting as the image host)
        body = re.sub(r'(src|href)="/(images|brand|favicon)', r'\1="%s/\2' % ASSET_HOST, body)
        out = (FONTS + "\n<style>\n" + css + "\n</style>\n" + body
               + "\n<script>\n" + js + "\n</script>\n")
        if "—" in out or "–" in out:
            raise SystemExit(f"em/en dash in {name}")
        (OUT / name).write_text(out)
        print(f"built {name}  ->  Showit page {slug}  ({len(out)//1024} KB)")
    print(f"{len(PAGES)} embeds in {OUT}")


if __name__ == "__main__":
    main()
