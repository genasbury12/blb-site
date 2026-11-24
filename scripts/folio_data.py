"""Portfolio data shared by the homepage, Portfolio page and Client Project page.
Only facts we can see are filled in (business name, what the site is about, live link,
mockups). Everything about the project itself stays a TO FILL IN slot until Genasys sends it."""

IMG = "/images/portfolio/"
# Netlify (the usual image host) stopped deploying on Nov 15, so the portfolio images are served
# from jsDelivr, pinned to the commit that added them. New portfolio images need a new pin.
CDN = "https://cdn.jsdelivr.net/gh/genasbury12/blb-site@35ad1b3d75a873b83a9402666c714d3bbcbf0564/site/images/portfolio/"

# key, business name, client name ('' = to fill in), niche (from the live site), url
PROJECTS = [
    ("oneincome", "The One Income Plan", "Brooke Watrous", "Personal finance for one income families", "https://oneincomeplan.com/"),
    ("tammy", "Fearless Business Boss", "Tammy", "Business coaching for women service providers", "https://tammy.v2.showitpreview.com/home"),
    ("abroad", "Marriage & Retirement Abroad", "", "Retiring in France for couples 45 and better", "https://marriageandretirementabroad.showit.site/"),
    ("fizzy", "Fizzy & Free", "", "Alcohol free motherhood community", "https://fizzyandfree.showit.site/"),
    ("focusflow", "H.E.R Focus & Flow", "", "Systems and OBM services for purpose driven women", "https://herfocusandflow.showitpreview.com/home"),
    ("cajungirl", "The Cajun Girl", "", "Beginner sewing education and membership", "https://thecajungirl.com/"),
    ("datenight", "The Date Night Project", "", "Date nights, games and gifts for couples", "https://datenightproject.showit.site/"),
]

# YouTube client video testimonials (titles from YouTube)
VIDEOS = [
    ("7NzvoD912yM", "Ashley"),
    ("cpOFMndycg0", "Karen"),
    ("43cFqoCAnA8", "Julie"),
    ("uVIBdvOUaQg", "Kaylin"),
    ("a6AY-uPLcAw", "Gia"),
]

PLAY = ('<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="#FFFFFF"/></svg>')

# Click to play: thumbnail first (fast, no YouTube cookies), real player on click.
VIDEO_CSS = """
.vt-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:16px}
.vt{display:flex;flex-direction:column;gap:12px;background:#FFFFFF;border-radius:22px;padding:12px 12px 16px;box-shadow:0 22px 44px -36px rgba(58,28,42,.6)}
.vt-frame{position:relative;aspect-ratio:9/12;border-radius:14px;overflow:hidden;background:#3A1C2A}
.vt-frame img{width:100%;height:100%;object-fit:cover;display:block}
.vt-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.vt-play{position:absolute;inset:0;width:100%;border:0;padding:0;margin:0;background:linear-gradient(180deg,rgba(58,28,42,0) 45%,rgba(58,28,42,.65));cursor:pointer;display:flex;align-items:flex-end;justify-content:flex-start}
.vt-play span{margin:14px;width:52px;height:52px;border-radius:999px;background:#A23E66;display:grid;place-items:center;transition:transform .2s ease}
@media (hover:hover){.vt-play:hover span{transform:scale(1.08)}}
.vt-play:focus-visible{outline:3px solid #A23E66;outline-offset:3px}
.vt-name{margin:0 4px;font:400 24px/1.1 var(--font-display);color:#3A1C2A}
.vt-cap{margin:0 4px;font:500 11px/1.4 var(--font-label);letter-spacing:.14em;text-transform:uppercase;color:#A23E66}
"""

VIDEO_JS = """<script>
(function(){
  document.querySelectorAll('[data-yt]').forEach(function(b){
    b.addEventListener('click',function(){
      var id=b.getAttribute('data-yt'),f=document.createElement('iframe');
      f.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      f.title=b.getAttribute('aria-label')||'Client testimonial';
      f.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';f.allowFullscreen=true;
      b.parentNode.appendChild(f);b.remove();
    });
  });
})();
</script>"""


def video_cards(videos=VIDEOS):
    out = []
    for vid, name in videos:
        out.append(
            f'<article class="vt"><div class="vt-frame">'
            f'<img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg" alt="" loading="lazy">'
            f'<button type="button" class="vt-play" data-yt="{vid}" aria-label="Play {name}&rsquo;s video testimonial"><span>{PLAY}</span></button>'
            f'</div><p class="vt-name">{name}</p><p class="vt-cap">Client video testimonial</p></article>')
    return '<div class="vt-grid">' + ''.join(out) + '</div>'
