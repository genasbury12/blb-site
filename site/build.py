#!/usr/bin/env python3
"""Boss Lady Bloggers static site assembler.

Each page body lives in site/_pages/<key>.html (just the <main> content,
plus any page-specific <style>/<script>). This script wraps every body with
the shared head, header/popout partials and footer, then writes the final
file at its folder URL (site/about/index.html style).

Run:  python3 site/build.py
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent
PAGES_DIR = ROOT / "_pages"
PARTIALS = ROOT / "partials"
DOMAIN = "https://www.bossladybloggers.com"

FONTS = ("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1"
         "&family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500"
         "&family=Caveat:wght@600;700&display=swap")

# key -> (output path, nav key, title, meta description)
PAGES = {
    "index":           ("index.html", "home",
                        "Boss Lady Bloggers | Blog Coaching for Women",
                        "Blog coaching that helps women turn their blogs into money making businesses. Start with a free call with Genasys."),
    "start-here":      ("start-here/index.html", "start-here",
                        "Start Here | Boss Lady Bloggers",
                        "New here? This page walks you through exactly where to start with Boss Lady Bloggers."),
    "about":           ("about/index.html", "about",
                        "About Genasys | Boss Lady Bloggers",
                        "Meet Genasys, the blog coach behind Boss Lady Bloggers, and the story behind the brand."),
    "boss":            ("boss/index.html", "boss",
                        "BOSS Business Blueprint | Boss Lady Bloggers",
                        "The BOSS Business Blueprint: build your blog into a money making business with Genasys."),
    "coaching":        ("coaching/index.html", "coaching",
                        "1:1 Blog Coaching | Boss Lady Bloggers",
                        "Private 1:1 blog coaching with Genasys for women who want their blogs to sell."),
    "membership":      ("membership/index.html", "membership",
                        "The Blogging Ladies Membership | Boss Lady Bloggers",
                        "The Blogging Ladies Membership is the cozy, fun blogging community for women who still love to blog. Weekly coaching, a new lesson every week and a community that gets it. $47 a month."),
    "free-trainings":  ("free-trainings/index.html", "free-trainings",
                        "Free Trainings | Boss Lady Bloggers",
                        "Free blog trainings from Genasys: learn how to make your blog sell."),
    "podcast":         ("podcast/index.html", "podcast",
                        "Podcast | Boss Lady Bloggers",
                        "The Boss Lady Bloggers podcast: blogging and business talk for women building money making blogs."),
    "blog":            ("blog/index.html", "blog",
                        "Blog | Boss Lady Bloggers",
                        "The Boss Lady Bloggers blog: strategy, stories and how-tos for bloggers who sell."),
    "blog-post":       ("blog/post-template.html", "blog",
                        "Post Title | Boss Lady Bloggers",
                        "A Boss Lady Bloggers blog post."),
    "links":           ("links/index.html", "home",
                        "Links | Boss Lady Bloggers",
                        "Every Boss Lady Bloggers link in one place."),
    "blog-category":   ("blog/category/index.html", "blog",
                        "Blog Categories | Boss Lady Bloggers",
                        "Browse the Boss Lady Bloggers blog by topic."),
    "contact":         ("contact/index.html", "contact",
                        "Contact Genasys | Boss Lady Bloggers",
                        "Get in touch with Genasys at Boss Lady Bloggers."),
    "thank-you":       ("thank-you/index.html", "",
                        "Thank You | Boss Lady Bloggers",
                        "Your message is in. Here is what happens next."),
    "404":             ("404.html", "",
                        "Page Not Found | Boss Lady Bloggers",
                        "That page does not exist, but these do."),
}

HEAD = """<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Boss Lady Bloggers">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{domain}/brand/og-default.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{fonts}">
<link rel="stylesheet" href="/css/tokens.css">
<link rel="stylesheet" href="/css/styles.css">
<script>document.documentElement.classList.remove('no-js');</script>
<script src="/js/main.js" defer></script>
</head>
<body>
"""

FOOT = """
</body>
</html>
"""


def canonical_for(out: str) -> str:
    if out == "index.html":
        return DOMAIN + "/"
    if out.endswith("/index.html"):
        return DOMAIN + "/" + out[: -len("index.html")]
    return DOMAIN + "/" + out


def main() -> int:
    header = (PARTIALS / "header.html").read_text()
    footer = (PARTIALS / "footer.html").read_text()
    built = 0
    for key, (out, nav, title, desc) in PAGES.items():
        src = PAGES_DIR / f"{key}.html"
        if not src.exists():
            continue
        body = src.read_text()
        h = header
        if nav:
            h = h.replace(f'class="navl" data-nav="{nav}"',
                          f'class="navl" data-nav="{nav}" aria-current="page"')
        page = (HEAD.format(title=title, desc=desc, fonts=FONTS,
                            canonical=canonical_for(out), domain=DOMAIN)
                + h + body + footer + FOOT)
        if ".dc.html" in page:
            print(f"ERROR {key}: unconverted .dc.html link", file=sys.stderr)
            return 1
        for ch in ("—", "–"):
            if ch in page:
                print(f"ERROR {key}: em/en dash found", file=sys.stderr)
                return 1
        dest = ROOT / out
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(page)
        built += 1
        print(f"built {out}")

    # sitemap.xml (every page except 404 and the blog post template)
    urls = [canonical_for(out) for key, (out, *_rest) in PAGES.items()
            if key not in ("404", "blog-post") and (PAGES_DIR / f"{key}.html").exists()]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sm += [f"  <url><loc>{u}</loc></url>" for u in urls]
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n")
    print(f"{built} pages + sitemap ({len(urls)} urls)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
