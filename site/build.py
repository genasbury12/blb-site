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
                        "Boss Lady Bloggers | Blog Coaching, Business Strategy & Showit Website Design",
                        "Your blog coach, business strategist and website designer. Private blog coaching, custom Showit website design and modern business education for ambitious women."),
    "start-here":      ("start-here/index.html", "start-here",
                        "Start Here | Boss Lady Bloggers",
                        "New here? This page walks you through exactly where to start with Boss Lady Bloggers."),
    "about":           ("about/index.html", "about",
                        "About Genasys | Boss Lady Bloggers",
                        "Meet Genasys: blog coach, business strategist and Showit website designer, and the single mom who built Boss Lady Bloggers from her aunt's basement."),
    "coaching":        ("coaching/index.html", "coaching",
                        "Blog Coaching & Showit Website Design | The BOSS Business Experience | Boss Lady Bloggers",
                        "The BOSS Business Experience: a 12 month private partnership with 1:1 blog coaching, custom Showit website design, done for you business development and ongoing strategic mentorship."),
    "portfolio":       ("portfolio/index.html", "coaching",
                        "Client Portfolio | Custom Showit Websites for Bloggers | Boss Lady Bloggers",
                        "Explore custom Showit websites and blogging businesses Genasys has helped ambitious women build through private blog coaching, business strategy and professional website design."),
    "client-project":  ("client-project/index.html", "coaching",
                        "Client Project | Boss Lady Bloggers",
                        "A Boss Lady Bloggers client project: the business strategy, brand direction and custom Showit website behind one woman's blogging business."),
    "all-access":      ("all-access/index.html", "academy",
                        "The BOSS Academy All Access | Every Course, One Investment | Boss Lady Bloggers",
                        "Unlock the complete BOSS Academy collection: The Futureproof Blogger, The Productive Blogger Method and The Interactive Course Creator, with one investment."),
    "futureproof-replay": ("futureproof-replay/index.html", "",
                        "Futureproof Your Blog Replay | Boss Lady Bloggers",
                        "Watch the complete Futureproof Your Blog masterclass replay, then take your next step with Genasys."),
    "futureproof-webinar": ("futureproof-webinar/index.html", "",
                        "Futureproof Your Blog | Free Masterclass With Genasys | Boss Lady Bloggers",
                        "A free business masterclass: how to build a profitable blogging business in a world where AI can create content, build websites and answer your readers' questions in seconds."),
    "futureproof-blogger": ("futureproof-blogger/index.html", "academy",
                        "The Futureproof Blogger | Build a Business for Where the Internet Is Going | The BOSS Academy",
                        "The Futureproof Blogger: business strategy for the future of blogging. Understand how AI and changing consumer behavior are reshaping blogging, and build a business that can adapt."),
    "interactive-course-creator": ("interactive-course-creator/index.html", "academy",
                        "The Interactive Course Creator | Build Interactive Online Courses With Claude | The BOSS Academy",
                        "Learn how to use Claude to turn your expertise into an interactive, branded and gamified online course with student dashboards, working tools, narrated lessons and a personal Playbook."),
    "academy":         ("academy/index.html", "academy",
                        "Courses | The BOSS Academy | Boss Lady Bloggers",
                        "The BOSS Academy: modern business education for bloggers. Shop specialized courses in business, branding, marketing, sales, AI and the future of blogging, or unlock All Access."),
    "membership":      ("membership/index.html", "membership",
                        "The Blogging Ladies Membership | Blogging Membership for Women",
                        "The Blogging Ladies Membership is the cozy, fun blogging community for women who still love to blog. Weekly coaching, a new lesson every week and a community that gets it. $47 a month."),
    "masterclass":     ("free-masterclass/index.html", "free-masterclass",
                        "Free Masterclass | Boss Lady Bloggers",
                        "Still blogging but not making money? Watch the free masterclass and discover the 7-step blog-to-business system that turns your blog content into cash."),
    "membership-offer":("membership-offer/index.html", "",
                        "Membership Offer | Boss Lady Bloggers",
                        "A thank-you offer for masterclass sign-ups: The Blogging Ladies Membership at 50% off for one hour."),
    "black-friday":    ("black-friday/index.html", "",
                        "Black Friday: 50% Off The Blogging Ladies | Boss Lady Bloggers",
                        "November 25 through Cyber Monday only: The Blogging Ladies Membership is 50% off, $23.50 a month locked in forever, plus a free 1:1 blog coaching call with Gen and a custom roadmap."),
    "masterclass-delivery": ("masterclass-delivery/index.html", "",
                        "Your Free Masterclass | Boss Lady Bloggers",
                        "Watch your free masterclass: the 7-step blog-to-business system that turns your blog content into cash."),
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


BARE = {"membership-offer", "all-access", "interactive-course-creator", "futureproof-blogger", "futureproof-webinar", "futureproof-replay"}  # distraction-free pages (offers and course sales pages): no menu or footer


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
                + ("" if key in BARE else h) + body + ("" if key in BARE else footer) + FOOT)
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
            if key not in ("404", "blog-post", "membership-offer", "black-friday", "masterclass-delivery") and (PAGES_DIR / f"{key}.html").exists()]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sm += [f"  <url><loc>{u}</loc></url>" for u in urls]
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n")
    print(f"{built} pages + sitemap ({len(urls)} urls)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
