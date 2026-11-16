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
    "links/index.html":          ("Links.html", "/links"),
    "blog/category/index.html":  ("BlogCategory.html", "/blog-category"),
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
    ('href="/links/"', 'href="/links"'),
    ('href="/blog/category/?cat=', 'href="/blog-category?cat='),
    ('href="/blog/category/"', 'href="/blog-category"'),
    ("'/blog/category/?cat='", "'/blog-category?cat='"),
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


# ---------------------------------------------------------------------------
# Blog post template pieces: small embeds placed AROUND Showit's native
# WordPress widgets (post title / featured image / post content) on the blog
# post template page. The widgets render the article; these recreate the
# designed frame from the BlogPost page of the handoff.
# ---------------------------------------------------------------------------
MINI_CSS = (
    "<style>\n"
    ":root{--font-display:'Instrument Serif',serif;--font-body:'Inter',system-ui,sans-serif;"
    "--font-label:'DM Mono',monospace}\n"
    "*{box-sizing:border-box}body{margin:0;background:transparent}\n"
    ".pill{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:13px 22px;"
    "font:600 14px/1 var(--font-body);text-decoration:none;transition:background .2s ease,color .2s ease,transform .2s ease}\n"
    ".pill:hover{transform:translateY(-2px)}\n"
    ".card-hover{transition:transform .25s ease,box-shadow .25s ease}\n"
    ".card-hover:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(58,28,42,.14)}\n"
    "</style>")

PIECE_AUTHOR = """<div style="background:#FBF5EE;border-radius:22px;padding:28px;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center;max-width:340px;margin:0 auto">
<div style="position:relative;width:110px;height:110px;border-radius:999px;background:#E9B9CA;overflow:hidden"><img src="{host}/images/photos/portrait-hat.jpg" alt="Genasys smiling in a hat" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 35%"></div>
<p style="margin:0;font:400 26px/1 var(--font-display);color:#3A1C2A">Meet Genasys</p>
<p style="margin:0;font:400 14px/1.6 var(--font-body);color:#4A2F3B">Founder of Boss Lady Bloggers, blog coach, and website designer. The offer comes first.</p>
<a href="/about" class="pill" style="background:#A23E66;color:#FFFFFF">Learn more</a>
</div>"""

PIECE_DOWNLOAD = """<a href="https://bossladybloggers.myflodesk.com/build" target="_blank" rel="noopener" class="card-hover" style="text-decoration:none;background:#3A1C2A;border-radius:22px;padding:26px;display:flex;flex-direction:column;gap:10px;max-width:340px;margin:0 auto">
<span style="align-self:flex-start;background:#A23E66;border-radius:999px;padding:6px 12px;font:600 11px/1 var(--font-body);color:#FFFFFF">Free download</span>
<span style="font:400 24px/1.1 var(--font-display);color:#FBF5EE">The Foundations Builder</span>
<span style="font:600 13px/1 var(--font-body);color:#E9B9CA">Get it free &#8599;&#65038;</span>
</a>"""

PIECE_NEXTSTEP = """<div style="background:#3A1C2A;border-radius:22px;padding:30px;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between">
<span style="flex:1 1 280px;font:400 26px/1.15 var(--font-display);color:#FBF5EE">[Next step: the free training or offer this post points to]</span>
<a href="/free-trainings" class="pill" style="background:#FBF5EE;color:#3A1C2A">Get the free training</a>
</div>"""

PIECE_RELATED = """<section style="background:#F6E1E8;padding:70px clamp(16px,4vw,48px);border-radius:0">
<div style="max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:28px">
<h2 style="margin:0;font:400 clamp(36px,4vw,54px)/1 var(--font-display);color:#3A1C2A">Keep reading</h2>
<div data-related style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px">
<a href="/blog" class="card-hover" style="background:#FFFFFF;border-radius:20px;overflow:hidden;text-decoration:none"><div data-img style="aspect-ratio:4/3;background:#E9B9CA"></div><div data-title style="padding:20px;font:400 22px/1.15 var(--font-display);color:#3A1C2A">More from the blog</div></a>
<a href="/blog" class="card-hover" style="background:#FFFFFF;border-radius:20px;overflow:hidden;text-decoration:none"><div data-img style="aspect-ratio:4/3;background:#3A1C2A"></div><div data-title style="padding:20px;font:400 22px/1.15 var(--font-display);color:#3A1C2A">More from the blog</div></a>
<a href="/blog" class="card-hover" style="background:#FFFFFF;border-radius:20px;overflow:hidden;text-decoration:none"><div data-img style="aspect-ratio:4/3;background:#A23E66"></div><div data-title style="padding:20px;font:400 22px/1.15 var(--font-display);color:#3A1C2A">More from the blog</div></a>
</div>
</div>
</section>
<script>
(function () {
  'use strict';
  var cards = document.querySelectorAll('[data-related] > a');
  if (!cards.length) return;
  fetch('https://bossladybloggers.com/wp-json/wp/v2/posts?per_page=6&_embed')
    .then(function (r) { return r.json(); })
    .then(function (posts) {
      var here = location.href.replace(/[?#].*$/, '').replace(/\\/$/, '');
      var picks = posts.filter(function (p) {
        return p.link.replace(/\\/$/, '') !== here;
      }).slice(0, cards.length);
      picks.forEach(function (p, i) {
        var a = cards[i];
        a.href = p.link;
        var t = a.querySelector('[data-title]');
        if (t) t.innerHTML = p.title.rendered;
        var media = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0];
        var src = media && ((media.media_details && media.media_details.sizes && media.media_details.sizes.medium_large && media.media_details.sizes.medium_large.source_url) || media.source_url);
        var box = a.querySelector('[data-img]');
        if (box && src) {
          box.innerHTML = '';
          var img = document.createElement('img');
          img.src = src;
          img.alt = '';
          img.loading = 'lazy';
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
          box.appendChild(img);
        }
      });
    })
    .catch(function () {/* keep the plain cards linking to the blog */});
})();
</script>"""

PIECE_NAV = """<div style="background:#FBF5EE;padding:16px clamp(16px,4vw,40px);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px">
<a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none">
<img src="{host}/brand/arch-monogram.svg" alt="" width="31" height="40" style="display:block">
<span style="font:400 26px/1 var(--font-display);color:#3A1C2A">Boss Lady <em style="color:#A23E66">Bloggers</em></span>
</a>
<nav aria-label="Main" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px 20px;font:500 14px/1 var(--font-body)">
<a href="/start-here" style="color:#3A1C2A;text-decoration:none;padding:8px 0">Start Here</a>
<a href="/about" style="color:#3A1C2A;text-decoration:none;padding:8px 0">About</a>
<a href="/free-trainings" style="color:#3A1C2A;text-decoration:none;padding:8px 0">Free Trainings</a>
<a href="/blog-coaching" style="color:#3A1C2A;text-decoration:none;padding:8px 0">Coaching</a>
<a href="/podcast" style="color:#3A1C2A;text-decoration:none;padding:8px 0">Podcast</a>
<a href="/blog" style="color:#3A1C2A;text-decoration:none;padding:8px 0">Blog</a>
<a href="/contact" style="color:#3A1C2A;text-decoration:none;padding:8px 0">Contact</a>
<a href="/boss" class="pill" style="background:#3A1C2A;color:#FFFFFF;padding:11px 18px">Explore BOSS</a>
</nav>
</div>"""

PIECE_POSTHERO = """<div style="position:relative;overflow:hidden;border-radius:24px;height:clamp(260px,38vw,420px);background:#E9B9CA">
<img data-hero-img alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none">
<span data-hero-cat style="position:absolute;left:20px;top:20px;background:#FFFFFF;border-radius:999px;padding:9px 14px;font:500 11px/1 var(--font-label);letter-spacing:0.12em;color:#A23E66;text-transform:uppercase">THE BLOG</span>
</div>
<script>
(function () {
  'use strict';
  var seg = location.pathname.split('/').filter(function (x) { return x; }).pop();
  if (!seg) return;
  fetch('https://bossladybloggers.com/wp-json/wp/v2/posts?slug=' + encodeURIComponent(seg) + '&_embed')
    .then(function (r) { return r.json(); })
    .then(function (posts) {
      var p = posts && posts[0];
      if (!p) return;
      var m = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0];
      var src = m && ((m.media_details && m.media_details.sizes && m.media_details.sizes.large && m.media_details.sizes.large.source_url) || m.source_url);
      var img = document.querySelector('[data-hero-img]');
      if (img && src) { img.src = src; img.style.display = 'block'; }
      try {
        var terms = [].concat.apply([], p._embedded['wp:term'] || []);
        var c = terms.filter(function (t) { return t.taxonomy === 'category'; })[0];
        var chip = document.querySelector('[data-hero-cat]');
        if (c && chip) chip.textContent = c.name.toUpperCase();
      } catch (e) {}
    })
    .catch(function () {/* rose band stays */});
})();
</script>"""

PIECE_NAV_MOBILE = """<div style="background:#FBF5EE;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px">
<a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none">
<img src="{host}/brand/arch-monogram.svg" alt="" width="26" height="34" style="display:block">
<span style="font:400 23px/1 var(--font-display);color:#3A1C2A">Boss Lady <em style="color:#A23E66">Bloggers</em></span>
</a>
<a href="/menu" aria-label="Open full menu" style="flex:0 0 auto;width:48px;height:48px;border-radius:999px;background:#A23E66;display:flex;align-items:center;justify-content:center;text-decoration:none">
<svg aria-hidden="true" width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"><path d="M1 1h16M1 7h16M1 13h16"></path></svg>
</a>
</div>"""

PIECE_MENUPAGE = """<div style="min-height:100vh;background:#A23E66;padding:22px clamp(16px,4vw,48px) 60px;display:flex;flex-direction:column;gap:34px">
<div style="display:flex;align-items:center;justify-content:space-between">
<span style="font:400 26px/1 var(--font-display);color:#FBF5EE">Boss Lady Bloggers</span>
<a href="/" data-menu-back aria-label="Close menu" style="width:48px;height:48px;border-radius:999px;background:#FBF5EE;color:#3A1C2A;display:flex;align-items:center;justify-content:center;text-decoration:none;font:400 26px/1 var(--font-body)">&times;</a>
</div>
<div style="display:flex;flex-wrap:wrap;gap:40px;align-items:flex-start">
<div style="flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:18px">
<p style="margin:0;font:400 clamp(40px,5vw,72px)/1 var(--font-display);color:#FBF5EE">Helping women build blogs that <em>sell.</em></p>
<p style="margin:0;font:400 16px/1.6 var(--font-body);color:#F6E1E8">If you&rsquo;re new here, welcome. Start with the page made for you.</p>
<div><a href="/start-here" class="pill" style="background:#FBF5EE;color:#3A1C2A">Start here</a></div>
</div>
<nav aria-label="Full menu" style="flex:1 1 300px;min-width:0;display:flex;flex-direction:column;font:400 clamp(26px,3vw,36px)/1.9 var(--font-display)">
<a href="/" style="color:#FBF5EE;text-decoration:none">Home</a>
<a href="/about" style="color:#FBF5EE;text-decoration:none">About</a>
<a href="/start-here" style="color:#FBF5EE;text-decoration:none">Start Here</a>
<a href="/boss" style="color:#FBF5EE;text-decoration:none">BOSS Business Blueprint</a>
<a href="/blog-coaching" style="color:#FBF5EE;text-decoration:none">Blog Coaching</a>
<a href="/group-coaching" style="color:#FBF5EE;text-decoration:none">Group Coaching</a>
<a href="/course" style="color:#FBF5EE;text-decoration:none">The Course</a>
<a href="/free-trainings" style="color:#FBF5EE;text-decoration:none">Free Trainings</a>
<a href="/podcast" style="color:#FBF5EE;text-decoration:none">Podcast</a>
<a href="/blog" style="color:#FBF5EE;text-decoration:none">Blog</a>
<a href="/contact" style="color:#FBF5EE;text-decoration:none">Contact</a>
</nav>
</div>
<div style="display:flex;gap:20px">
<a href="https://www.instagram.com/blogcoach_gen" target="_blank" rel="noopener" style="font:500 12px/1 var(--font-label);letter-spacing:0.14em;color:#F6E1E8;text-decoration:none">INSTAGRAM</a>
<a href="https://www.youtube.com/@GenasysLynn" target="_blank" rel="noopener" style="font:500 12px/1 var(--font-label);letter-spacing:0.14em;color:#F6E1E8;text-decoration:none">YOUTUBE</a>
<a href="https://www.pinterest.com/BossLadyBloggers/" target="_blank" rel="noopener" style="font:500 12px/1 var(--font-label);letter-spacing:0.14em;color:#F6E1E8;text-decoration:none">PINTEREST</a>
</div>
</div>
<script>
(function () {
  'use strict';
  var back = document.querySelector('[data-menu-back]');
  if (back) back.addEventListener('click', function (e) {
    if (window.history.length > 1) { e.preventDefault(); window.history.back(); }
  });
})();
</script>"""

PIECES = {
    "PostNavBar.html":      ("site navigation bar",  PIECE_NAV),
    "PostNavMobile.html":   ("mobile navigation bar", PIECE_NAV_MOBILE),
    "MenuPage.html":        ("fullscreen menu page (/menu)", PIECE_MENUPAGE),
    "PostHero.html":        ("featured image hero",  PIECE_POSTHERO),
    "PostAuthorCard.html":  ("author sidebar card",  PIECE_AUTHOR),
    "PostDownloadCard.html":("free download card",   PIECE_DOWNLOAD),
    "PostNextStepBand.html":("next-step CTA band",   PIECE_NEXTSTEP),
    "PostRelatedBand.html": ("keep-reading band",    PIECE_RELATED),
}


def build_footer_piece(css: str, js: str) -> None:
    """PostFooter.html: the full site footer (bio, Get around, Instagram
    feed, berry footer with marquee) as one embed for the post template."""
    body = (ROOT / "partials/footer.html").read_text()
    for a, b in LINKMAP:
        body = body.replace(a, b)
    body = re.sub(r'(src|href)="/(images|brand|favicon)', r'\1="%s/\2' % ASSET_HOST, body)
    out = (FONTS + "\n<style>\n" + css + "\n</style>\n" + body
           + "\n<script>\n" + js + "\n</script>\n")
    if "—" in out or "–" in out:
        raise SystemExit("em/en dash in PostFooter.html")
    (OUT / "PostFooter.html").write_text(out)
    print("built PostFooter.html  ->  blog post template piece (full site footer)")


def build_pieces() -> None:
    for name, (label, html) in PIECES.items():
        out = FONTS + "\n" + MINI_CSS + "\n" + html.replace("{host}", ASSET_HOST) + "\n"
        if "—" in out or "–" in out:
            raise SystemExit(f"em/en dash in {name}")
        (OUT / name).write_text(out)
        print(f"built {name}  ->  blog post template piece ({label})")


def main() -> None:
    OUT.mkdir(exist_ok=True)
    build_pieces()
    css = (ROOT / "css/tokens.css").read_text() + "\n" + (ROOT / "css/styles.css").read_text()
    js = embed_js()
    build_footer_piece(css, js)
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
