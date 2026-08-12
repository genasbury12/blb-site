=====================================================================
HOLISTIK QUEEN - SITE REDESIGN
Built the Boss Lady Bloggers way (see CLIENT-SITE-PLAYBOOK).
Single-file HTML pages for Showit full-page Embed Code blocks.
=====================================================================

THE BRAND SYSTEM
COLORS
  --paper   #FDF9F0  warm cream page background, never pure white
  --tint    #ECF3E4  sage alternate section background
  --ink     #1C3A2A  deep forest: dark sections + text, never black
  --coral   #E4572E  the action color: buttons, links, accents
  --clay    #B8431F  hover states
  --emerald #1E6F50  depth accent, eyebrows
  --gold    #C9973E  script accents, dividers, flourishes
  --honey   #F7E8CD  soft highlight backgrounds, pills
  --rose    #F3DDD0  soft alt highlight
  --muted   #5C6B5D  secondary text
PILLAR ACCENTS
  Holistic Health #1E6F50 | Clean Eating #6B8F3C
  Mindful Wellness #7C6AA6 | Eco Beauty #C96F5E
  Conscious Lifestyle #C9973E
FONTS (3 roles)
  Display serif: Cormorant Garamond 500/600/700 + italic
  Workhorse sans: Outfit 300/400/600/700
  Script: Sacramento
VOICE
  Warm, regal, science-informed, "babe" sparingly, NO EM DASHES.
  Education, not medical advice: the disclaimer rides in every footer.

THE PAGES (each .html has a matching .txt copy for delivery)
  index.html                homepage: hero, press marquee, 5 pillar
                            cards, meet-Victoria ink band + count-ups,
                            old-way/new-way toggle, tappable body-flags
                            checklist with meter, Crown Letter card,
                            FAQ + JSON-LD schema, final CTA
  about.html                centered hero, polaroid photo slots, story
                            timeline, quote band, manifesto cards, press
  start-here.html           the funnel page: Queen's Reset signup card,
                            the 7 swaps, 3 path cards, FAQ + schema
  contact.html              FormSubmit contact form + side cards,
                            ?sent=1 success note
  holistic-health.html      pillar page (template x5 with per-pillar
  clean-eating.html         accent color, icon emblem, what-you'll-find
  mindful-wellness.html     cards, 3 starter-read teasers, Victoria's
  eco-beauty.html           rule-of-thumb ink band, cross links)
  conscious-lifestyle.html

THE BUILDER (rerun any script to regenerate its pages)
  builder.py               tokens, BASE_CSS, banner, nav, mobile menu,
                           footer, loader, STD_JS, page(), faq helpers
  pages_home.py            python3 pages_home.py
  pages_about.py           python3 pages_about.py
  pages_start_contact.py   python3 pages_start_contact.py
  pages_pillars.py         python3 pages_pillars.py
RULE: patch the builder, not the generated files, or the patch
vanishes on the next rebuild.

VERIFIED (Playwright, headless Chromium, every page)
  [x] zero console/page errors
  [x] mobile 390px horizontal overflow = 0px
  [x] mobile menu opens/closes, FAQ toggles, homepage way-toggle
      switches, checklist meter counts, count-ups animate
  [x] JS disabled: full page readable, loader hidden, nothing stuck
      at opacity 0 (FAQ uses details/summary so it works without JS)
  [x] full-page desktop + mobile screenshots reviewed at full size

SHOWIT INSTALL (per page)
  Showit page -> full-page Embed Code block -> paste the whole
  document from the .txt -> publish. Draw the frame full width on
  BOTH the desktop AND mobile canvases. The editor shows a gray box:
  normal. Judge only the PUBLISHED site, then hard refresh.

WAITING ON CLIENT
  [ ] Brand photos of Victoria (JPG, under 30MB each, Google Drive).
      Swap targets are marked with "CLIENT PHOTO SLOT" comments:
      homepage .artpanel, about .pola picture areas.
  [ ] Confirm the forms inbox address. All three forms currently
      point at FormSubmit for hello@holistikqueen.com. The FIRST
      submission emails an activation link that MUST be clicked.
  [ ] Flodesk (or preferred ESP) embed snippet for the Crown Letter
      + Queen's Reset signups, and the reset PDF/delivery email.
  [ ] Real article links for the 15 "starter read" teaser cards
      (3 per pillar page, currently labeled "Article coming soon").
  [ ] Booking/payment links if coaching or offers launch later.
  [ ] Legal pages copy (privacy, disclaimer, terms).
=====================================================================
