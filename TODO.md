# New site TODO

Everything the new static site still needs. Nothing here blocks deploying the site as-is; placeholders are styled, on-brand blocks.

## Needs Genasys (links + accounts)

- ~~Waitlist forms~~ CONNECTED: both waitlist pages embed Genasys's real Flodesk inline forms (Group 6afa22f25913b3dc6c8636c5, Course 6afa24334f23c9fbc4696591), which save subscribers and start the workflows directly. No API key or Netlify environment variables needed. The netlify/functions/waitlist.mjs function remains unused as a fallback.
- **Checkout links**: /group-coaching/ and /course/ buy CTAs route to the waitlist pages per the design; `[GEN: CHECKOUT LINK]` notes kept in place for when Stripe checkout links exist.
- **Terms links**: guarantee sections on /boss/, /group-coaching/ and /course/ link "terms and conditions" to `#`. Needs a real terms page (design note says lawyer check for the group offer).
- ~~YouTube~~ DONE: the 3 videos are live as thumbnail cards on /start-here/ and /free-trainings/, linking out to YouTube.
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
