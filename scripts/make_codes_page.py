#!/usr/bin/env python3
"""Builds the "BLB Showit Codes" copy page: every embed in showit-embeds/ with a
one-tap Copy button and where to paste it.

Run:  python3 scripts/make_codes_page.py OUTPUT.html
"""
import html, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
E = ROOT / "showit-embeds"

GROUPS = [
    ("Full pages", "One Embed Code box per Showit page, stretched full width. Paste, publish.", [
        ("AICheckQuiz", "/ai-check, or any page you like", "NEW: The Is AI making you busier? quiz. Quiz screens in your BLB brand, results in the PBM brand, wired to your 4 Flodesk type forms. Paste it into one full width Embed Code box on any page: it grows its own canvas."),
        ("Roadmap", "/roadmap", "NEW: The Blog Business Roadmap free assessment: sign up, 15 questions, then her personal roadmap, all on one page. Mobile first. It grows its own canvas, so any starting height works. Leave it out of your menu if you like."),
        ("RoadmapTool", "/roadmap-tool", "NEW: One page for all 7 roadmap tools (each roadmap links to its tool with her own 72 hour deadline). With no deadline it shows full price, no timer. Leave it out of your menu."),
        ("MasterclassDelivery", "/masterclass-delivery", "NEW: Where masterclass sign-ups watch the video. Countdown above it, the 50% off join box and what they get right under it, your workbook link and the floating timer. Paste this one first. Leave it out of your menu."),
        ("FreeMasterclass", "/free-masterclass", "NEW: Your free masterclass opt-in page, now with a countdown to Nov 30 above the form. The form is your real Flodesk masterclass form."),
        ("MembershipOffer", "/membership-offer", "UPDATED Nov 24: Take a look inside (BOSS course and template library mockups) added, gingham taken out. Re-paste."),
        ("BlackFriday", "/black-friday", "UPDATED Nov 24: placeholders taken out, payment proof, client video testimonials and Take a look inside (BOSS course and template library mockups) added, less than $24 now light pink. Re-paste."),
        ("Apply", "/apply", "UPDATED Nov 24: new In their words section with Sadie, Tesha and Clare; placeholder FAQ line removed. Re-paste."),
        ("ApplicationConfirmation", "/application-confirmation", "NEW: shown right after someone applies on /apply. Leave it out of your menu and hide your Showit nav and footer."),
        ("FastTrackPreparation", "/fast-track-preparation", "NEW: the page you send approved applicants. Their business questionnaire emails you through FormSubmit, and the booking calendar is built in. It uses your 15 minute Calendly event for now; send me your Fast Track Call event link. Leave it out of your menu; hide nav and footer."),
        ("FastTrackConfirmation", "/fast-track-confirmation", "NEW: the page Calendly shows after someone books. In Calendly, set the event's confirmation page to redirect to bossladybloggers.com/fast-track-confirmation and turn on Pass event details, so the date, time, Add to Calendar and Reschedule buttons fill in. Leave it out of your menu; hide nav and footer."),
        ("Portfolio", "/portfolio", "UPDATED Nov 24: quotes under the videos, every placeholder taken out. Re-paste."),
        ("ClientProject", "/client-project (leave it out of your menu)", "UPDATED Nov 24: empty sections hide themselves, video testimonials and quotes added. Re-paste."),
        ("FutureproofWebinar", "/futureproof-webinar", "UPDATED Nov 24: placeholders hidden; until Flodesk is connected, sign ups are emailed to you. Re-paste."),
        ("WebinarConfirmation", "/webinar-confirmation", "UPDATED Nov 24: date, time and video placeholders hidden until set. Re-paste."),
        ("FutureproofReplay", "/futureproof-replay", "NEW: the masterclass replay page in the Futureproof brand, with your next steps (The BOSS Business Experience, the membership, The Futureproof Blogger). Leave it out of your menu and hide your Showit nav and footer. Send me the replay video link and it plays at the top."),
        ("FutureproofBlogger", "/futureproof-blogger", "UPDATED Nov 24: quotes added, placeholders hidden. Re-paste."),
        ("InteractiveCourseCreator", "/interactive-course-creator", "UPDATED Nov 24: real course screens and quotes replace the proof placeholders; price and policies hidden until you send them. Re-paste."),
        ("AllAccess", "/all-access", "UPDATED Nov 24: quotes, video testimonials and payment proof in; prices and unconfirmed terms hidden until you send them. Re-paste."),
        ("Academy", "/academy (menu title: Courses)", "UPDATED Nov 24: price boxes and unanswered FAQs hidden until confirmed. Re-paste."),
        ("Membership", "/membership", "UPDATED Nov 24: Take a look inside (BOSS course and template library mockups), your payment proof and client video testimonials, placeholders and gingham taken out. Re-paste."),
        ("Home", "/ (home page)", "REDESIGNED Nov 24: every section has its own layout now, your payment proof and quotes replace the placeholder, the webinar sign up sits beside its headline (no more empty half). Re-paste."), ("StartHere", "/start-here", "REBUILT: your new Start Here copy, all 13 sections. Which of these sounds most like you is the business finder: tap one of the six and her recommended starting point opens. Re-paste this code."), ("About", "/about", "UPDATED Nov 24: your payment proof and quotes replace the placeholder. Re-paste."),
        ("BlogCoaching", "/blog-coaching", "UPDATED Nov 24: BOSS course and template mockups, quotes and payment proof added; every placeholder taken out. Re-paste."), ("Podcast", "/podcast", ""),
        ("BlogLanding", "/blog", "Optional: only if you want the new blog landing look"),
        ("BlogCategory", "/blog-category", "One page serves every topic"),
        ("Links", "/links", "Link-in-bio page"), ("Contact", "/contact", ""),
        ("ThankYou", "/thank-you", ""), ("NotFound404", "/404", "Optional"),
    ]),
    ("Site-wide", "Paste once and it shows on every page.", [
        ("MasterclassBanner", "Top of every page: one Embed Code box on a canvas shared site-wide, full width, about 180 tall on desktop and 330 on mobile", "NEW: Free masterclass banner with a countdown to Nov 30, 11:59 PM Eastern. It hides itself when time runs out."),
        ("SitewidePopup", "Site Settings > Advanced > Custom Head HTML", "Your Flodesk masterclass popup. Delete old popups so it doesn't double up."),
    ]),
    ("Blog post template", "Paste each into its own Embed Code box on your WordPress single post template in Showit.", [
        ("PostNavBar", "Top of post template, DESKTOP view", "Desktop navigation"),
        ("PostNavMobile", "Top of post template, MOBILE view", "Logo and hamburger"),
        ("MenuPage", "A Showit page at /menu", "The full-screen menu the hamburger opens"),
        ("PostHero", "Above the post content", "Featured image, category and date"),
        ("PostAuthorCard", "Sidebar or below the post", ""), ("PostDownloadCard", "Sidebar or below the post", ""),
        ("PostNextStepBand", "Below the post content", ""), ("PostRelatedBand", "Below the post content", "Shows 3 latest posts"),
        ("PostFooter", "Bottom of post template, DESKTOP view", "UPDATED Nov 24: Stay Connected form taken out for now. Re-paste."),
        ("FooterMobileOnly", "Bottom of post template, MOBILE view", "Locked to phone width. UPDATED Nov 24: Stay Connected box taken out. Re-paste."),
        ("PostFooterMobile", "Optional mobile footer alternative", ""),
    ]),
]

STEPS = [
    "Delete the Course, Course Waitlist, Group Coaching and Group Waitlist pages in Showit, and 301 redirect each one to /membership.",
    "Add /apply with the Apply code (your Fast Track Call application), plus /application-confirmation, /fast-track-preparation and /fast-track-confirmation with their codes (out of your menu, nav and footer hidden). Add six new Showit pages: /portfolio, /client-project, /all-access, /interactive-course-creator, /futureproof-blogger and /futureproof-webinar. Paste Portfolio, ClientProject, AllAccess, InteractiveCourseCreator, FutureproofBlogger and FutureproofWebinar into them. Also add /futureproof-replay with FutureproofReplay and /webinar-confirmation with WebinarConfirmation. Keep /client-project, /futureproof-replay and /webinar-confirmation out of your menu, and hide the nav and footer on the course sales pages, the webinar page and the replay page.",
    "Delete the old BOSS page (/boss) in Showit and 301 redirect /boss to /blog-coaching. Your new Work With Me page lives at /blog-coaching.",
    "Delete the Free Trainings page and 301 redirect /free-trainings to /free-masterclass.",
    "Re-paste every page and your nav, footer and menu pieces: the new menu is About, Blog Coaching & Design, Membership, Courses, Resources and a Work With Me button, and the new footer links to your Portfolio, webinar, privacy policy and terms.",
    "Create two new Showit pages, /roadmap and /roadmap-tool, each with one full width Embed Code box. Paste Roadmap and RoadmapTool. Any canvas height works: the code grows the canvas to fit.",
    "In Flodesk, open your masterclass form and change where it sends people after signup to bossladybloggers.com/membership-offer, so popup signups see the 50% off offer too.",
]


def main(out: str) -> None:
    data, cards = {}, []
    listed = set()
    for g, gd, items in GROUPS:
        cards.append(f'<section class="grp"><h2>{html.escape(g)}</h2><p class="gd">{html.escape(gd)}</p><div class="list">')
        for name, where, note in items:
            f = E / f"{name}.html"
            if not f.exists():
                continue
            code = f.read_text()
            data[name] = code
            listed.add(name)
            kb = round(len(code.encode()) / 1024)
            new = note.startswith("NEW: ")
            nt = note[5:] if new else note
            badge = ' <span class="new">New</span>' if new else ""
            cards.append(
                f'<article class="card"><div class="meta"><h3>{name}{badge}</h3>'
                f'<p class="where"><span>Paste at</span> {html.escape(where)}</p>'
                + (f'<p class="note">{html.escape(nt)}</p>' if nt else "")
                + f'</div><div class="act"><button type="button" class="copy" data-name="{name}" id="copy-{name}">Copy code</button><span class="kb">{kb} KB</span></div>'
                f'<p class="hint" id="hint-{name}" hidden>Backup: if pasting comes up empty, tap inside this box, choose Select All, then Copy.</p>'
                f'<textarea class="fallback" id="ta-{name}" hidden readonly aria-label="{name} code"></textarea></article>')
        cards.append("</div></section>")
    missing = sorted(p.stem for p in E.glob("*.html") if p.stem not in listed)
    if missing:
        sys.exit("embeds not on the copy page: " + ", ".join(missing))
    blob = json.dumps(data).replace("<", "\\u003c")
    steps = "".join(f"<li>{html.escape(s)}</li>" for s in STEPS)
    page = f'''<title>BLB Showit Codes</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=DM+Mono:wght@500&display=swap">
<style>
/* Layout: one column of code cards grouped by where they go; brand colors, single light look */
:root{{--plum:#3A1C2A;--berry:#A23E66;--rose:#E9B9CA;--blush:#F6E1E8;--cream:#FBF5EE;--cocoa:#4A2F3B;--white:#FFFFFF;
--display:'Instrument Serif',Georgia,serif;--body:'Inter',Arial,sans-serif;--mono:'DM Mono','Courier New',monospace;color-scheme:light}}
body{{background:var(--cream);color:var(--plum);font-family:var(--body)}}
.wrap{{max-width:860px;margin:0 auto;padding-block:40px 80px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:flex;flex-direction:column;gap:36px}}
header h1{{margin:0;font:400 clamp(42px,7vw,64px)/1 var(--display);text-wrap:balance}}
header h1 em{{color:var(--berry)}}
header p{{margin:12px 0 0;font:400 16px/1.6 var(--body);color:var(--cocoa);max-width:62ch}}
.grp h2{{margin:0;font:400 32px/1.1 var(--display)}}
.gd{{margin:6px 0 16px;font:400 15px/1.5 var(--body);color:var(--cocoa)}}
.list{{display:flex;flex-direction:column;gap:10px}}
.card{{background:var(--white);border-radius:18px;padding:16px 18px;display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center;justify-content:space-between}}
.meta{{flex:1 1 260px;min-width:0}}
.meta h3{{margin:0;font:600 17px/1.3 var(--body);display:flex;align-items:center;gap:8px}}
.new{{background:var(--berry);color:var(--white);border-radius:999px;padding:4px 9px;font:500 11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase}}
.where{{margin:4px 0 0;font:400 14px/1.4 var(--body);color:var(--cocoa)}}
.where span{{font:500 11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--berry);margin-right:4px}}
.note{{margin:4px 0 0;font:400 13px/1.4 var(--body);color:var(--cocoa)}}
.act{{display:flex;align-items:center;gap:12px}}
.kb{{font:500 12px/1 var(--mono);color:var(--cocoa)}}
.copy{{min-height:46px;padding:0 22px;border:0;border-radius:999px;background:var(--plum);color:var(--white);font:600 15px/1 var(--body);cursor:pointer}}
.copy:hover{{background:var(--berry)}}
.copy:focus-visible{{outline:3px solid var(--rose);outline-offset:2px}}
.copy.done{{background:var(--berry)}}
.hint{{flex:1 1 100%;margin:0;font:400 13px/1.4 var(--body);color:var(--berry)}}
.fallback{{flex:1 1 100%;width:100%;min-height:140px;border:1.5px solid var(--rose);border-radius:12px;padding:10px;font:400 12px/1.4 var(--mono);color:var(--plum);background:var(--cream)}}
.steps{{background:var(--blush);border-radius:18px;padding:18px 20px;font:400 15px/1.6 var(--body);color:var(--plum)}}
.steps ol{{margin:6px 0 0;padding-left:20px}}
@media (prefers-reduced-motion:reduce){{*{{transition:none!important}}}}
</style>
<div class="wrap">
<header><h1>Your Showit <em>codes</em></h1><p>Tap <strong>Copy code</strong>, then paste into the Showit spot listed on that card. Every code is the latest version.</p></header>
<div class="steps"><strong>Do these once in Showit</strong><ol>{steps}</ol></div>
{"".join(cards)}
</div>
<script type="application/json" id="codes">{blob}</script>
<script>
(function(){{
  var codes={{}};
  try{{codes=JSON.parse(document.getElementById('codes').textContent);}}catch(e){{}}
  document.querySelectorAll('.copy').forEach(function(btn){{
    btn.addEventListener('click',function(){{
      var name=btn.getAttribute('data-name');var text=codes[name]||'';
      var ta=document.getElementById('ta-'+name);ta.value=text;ta.hidden=false;
      var hint=document.getElementById('hint-'+name);if(hint)hint.hidden=false;
      function done(){{btn.textContent='Copied! Now paste in Showit';btn.classList.add('done');setTimeout(function(){{btn.textContent='Copy code';btn.classList.remove('done');}},3500);}}
      function fallback(){{ta.focus();ta.select();try{{ta.setSelectionRange(0,text.length);}}catch(e){{}}
        var ok=false;try{{ok=document.execCommand('copy');}}catch(e){{}}
        if(ok){{done();}}else{{btn.textContent='Code selected below: tap Copy';}}}}
      if(!text){{btn.textContent='Code missing, tell Claude';return;}}
      if(navigator.clipboard&&navigator.clipboard.writeText){{navigator.clipboard.writeText(text).then(done,fallback);}}else{{fallback();}}
    }});
  }});
}})();
</script>
'''
    pathlib.Path(out).write_text(page)
    print(f"wrote {out}: {len(data)} codes")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "codes-page.html")
