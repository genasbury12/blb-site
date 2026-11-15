# New site TODO

Everything the new static site still needs. Nothing here blocks deploying the site as-is; placeholders are styled, on-brand blocks.

## Needs Genasys (links + accounts)

- **Flodesk form hookups** (forms currently show a friendly success message without saving the email):
  - Free trainings signup form (on /start-here/ and the berry signup band)
  - /group-waitlist/ form
  - /course-waitlist/ form
  - Replace each `<form data-waitlist action="#">` action with the real Flodesk form endpoint, or embed the Flodesk form code.
- **Coaching price**: /coaching/ investment panel shows `[CONFIRM PRICE]` exactly as the approved design does. Confirm the Blog Profit Intensive price (old Showit page said $897 or 3x$333; not assumed here).
- **Coaching apply link**: "Apply for private blog coaching" pill is `href="#"`. Other CTAs use the on-page #apply anchor.
- **BOSS booking link**: 4 CTAs on /boss/ ("Yes! Let's build my business", "I want results like these. Book my free call", "Book my free Fast Track call", final P.A.R.I.S. CTA) are `href="#"` until the Fast Track call booking URL exists.
- **Checkout links**: /group-coaching/ and /course/ buy CTAs route to the waitlist pages per the design; `[GEN: CHECKOUT LINK]` notes kept in place for when Stripe checkout links exist.
- **Terms links**: guarantee sections on /boss/, /group-coaching/ and /course/ link "terms and conditions" to `#`. Needs a real terms page (design note says lawyer check for the group offer).
- **YouTube**: 3 video embeds each on /start-here/ and /free-trainings/ are `[VIDEO 01-03]` placeholders; need video URLs.
- **Apple Podcasts**: /podcast/ "Listen on Apple Podcasts" is `href="#"` (Spotify links are live).
- **Instagram feed**: homepage strip shows branded tiles. Create a feed at behold.so for @blogcoach_gen, paste the JSON URL into `FEED_URL` in site/js/main.js.
- **Blog categories**: 6 category links on /blog/ and /free-trainings/ are `href="#"` until category pages exist; "Load more posts" button too.
- **Netlify forms**: after first deploy, open Netlify > Forms and turn on email notifications for the "contact" form.
- **Domain**: point bossladybloggers.com at the Netlify site when ready to switch.

## Needs Genasys (decisions + copy)

- `[GEN: ...]` notes kept verbatim from the approved design: bonus you'll deliver (group + course), group member cap, course price increase date, pin template count (BOSS Bonus #3), stack bonuses line, group size FAQ answer, course tools FAQ answer.
- **Trainings 02-10**: /free-trainings/ and /start-here/ list all 10 trainings with their Flodesk links per the design. Only Blogging Foundations (/build) and Sales Diagnostic (/sales) are finished today. Say the word and the other 8 get "coming soon" treatment.
- **Blog content**: featured post, trending pills and 6 latest cards are placeholder titles; /blog/post-template.html is the intentional template. Needs first real posts.
- **404 copyright line**: the design's 404 had "(c) BOSS LADY BLOGGERS LLC 2026". Dropped to avoid a double footer; add to the shared footer partial if you want it sitewide.

## Proof assets (never invented, slots ready)

- `[STRIPE PAYOUT SCREENSHOT]` on /boss/, /group-coaching/, /course/ (blurred sample, never totals).
- `[GEN: BLURRED RECEIPT OR A ROW OF CLIENT SITES]` on /boss/.
- `[ADD A REAL CLIENT QUOTE]` x3 on /coaching/ Real Results section.
- `[SCREENSHOT: BLOG PROFIT DIAGNOSTIC]` on /coaching/.

## Photos still on branded placeholder blocks

No fitting shot in the current library (56 photos reviewed):
- You + your son (About x2, Start Here)
- Group Zoom call (Start Here, group-coaching hero figure)
- Genasys holding a coffee (/coaching/ bio split)
- Scrapbook props on /about/: chocolate lava cake, the old 2010 MacBook, flowers/candles/chocolate
- Mockups: Foundations Builder (laptop + card), BOSS app (Start Here + course), ebook/workbook bonus card, trainings-on-laptop + tool-on-phone (/free-trainings/), blog featured photo + phone mockup (/blog/), post template featured band
- Real podcast cover art (a designed SVG version is in place and looks final)

## Filled already (FYI)

- All Genasys slots use real photos cropped into the brand shapes (no transparent cutouts, per her request): balloons and hat shots in the heroes, chair/letterboard/champagne shots in the bio splits, mic and desk shots on the podcast and offer pages.
- Photos also placed: flat lay (menu), desk/typing shots (home final CTA, contact, coaching hero + analytics + notebook), mic shots (start-here offer cards), pink desk (coaching hero).

## Dev notes

- Build: `python3 site/build.py` assembles pages from `site/_pages/*.html` + partials; fails on em dashes or `.dc.html` links; regenerates sitemap.xml.
- Netlify publish directory: `site` (netlify.toml at repo root already set).
- Page-specific CSS lives in scoped `<style>` blocks at the top of the page body files; shared rules in site/css/styles.css.
