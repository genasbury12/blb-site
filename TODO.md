# New site TODO

Everything the new static site still needs. Nothing here blocks deploying the site as-is; placeholders are styled, on-brand blocks.

## Needs Genasys (links + accounts)

- **Waitlist forms are WIRED through a Netlify function** (netlify/functions/waitlist.mjs). They save to Flodesk as soon as Genasys does these 3 steps:
  1. Flodesk > Audience > Segments: create "Waitlist - Group Coaching" and "Waitlist - Course"; copy each segment ID from its URL.
  2. Flodesk > Integrations > API keys: create a key named "Website waitlist".
  3. Netlify > Site settings > Environment variables: set FLODESK_API_KEY, FLODESK_SEGMENT_GROUP, FLODESK_SEGMENT_COURSE. Then test one signup per page and delete the test subscriber.
  - If Flodesk rejects segment_ids on create, the fallback is a second call: POST /v1/subscribers/{email}/segments with {"segment_ids":[segment]}.
  - Still TODO separately: the free-trainings signup band on /start-here/ (shows success, does not save yet; can reuse the same function with a third segment when ready).
- ~~Coaching price~~ CONFIRMED: $897 or 3 payments of $333, live on /coaching/.
- ~~Coaching apply link~~ CONFIRMED: the apply pill goes to calendly.com/bossladybloggers/15min.
- ~~BOSS booking link~~ CONFIRMED: all 4 /boss/ call CTAs go to calendly.com/bossladybloggers/15min.
- **Checkout links**: /group-coaching/ and /course/ buy CTAs route to the waitlist pages per the design; `[GEN: CHECKOUT LINK]` notes kept in place for when Stripe checkout links exist.
- **Terms links**: guarantee sections on /boss/, /group-coaching/ and /course/ link "terms and conditions" to `#`. Needs a real terms page (design note says lawyer check for the group offer).
- **YouTube**: 3 video embeds each on /start-here/ and /free-trainings/ are `[VIDEO 01-03]` placeholders; need video URLs.
- **Apple Podcasts**: /podcast/ "Listen on Apple Podcasts" is `href="#"` (Spotify links are live).
- ~~Instagram feed~~ LIVE: Behold JSON feed wired into site/js/main.js; homepage strip shows the six latest @blogcoach_gen posts.
- **Blog categories**: 6 category links on /blog/ and /free-trainings/ are `href="#"` until category pages exist; "Load more posts" button too.
- **Netlify forms**: after first deploy, open Netlify > Forms and turn on email notifications for the "contact" form.
- **Domain**: point bossladybloggers.com at the Netlify site when ready to switch.

## Needs Genasys (decisions + copy)

- `[GEN: ...]` notes kept verbatim from the approved design: bonus you'll deliver (group + course), group member cap, course price increase date, pin template count (BOSS Bonus #3), stack bonuses line, group size FAQ answer, course tools FAQ answer.
- ~~Trainings 02-10~~ CONFIRMED: Genasys supplied all 10 Flodesk training links (build, offer, presell, fix, sales, site, convert, email, plan, claude); all live on /free-trainings/ and /start-here/ with their freebie mockups.
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
- Mockups: BOSS app (Start Here + course), ebook/workbook bonus card, blog featured photo + phone mockup (/blog/), post template featured band (the 10 freebie mockups are now placed on /free-trainings/ and the featured slots)
- Real podcast cover art (a designed SVG version is in place and looks final)

## Filled already (FYI)

- All Genasys slots use real photos cropped into the brand shapes (no transparent cutouts, per her request): balloons and hat shots in the heroes, chair/letterboard/champagne shots in the bio splits, mic and desk shots on the podcast and offer pages.
- Photos also placed: flat lay (menu), desk/typing shots (home final CTA, contact, coaching hero + analytics + notebook), mic shots (start-here offer cards), pink desk (coaching hero).

## Dev notes

- Build: `python3 site/build.py` assembles pages from `site/_pages/*.html` + partials; fails on em dashes or `.dc.html` links; regenerates sitemap.xml.
- Netlify publish directory: `site` (netlify.toml at repo root already set).
- Page-specific CSS lives in scoped `<style>` blocks at the top of the page body files; shared rules in site/css/styles.css.
