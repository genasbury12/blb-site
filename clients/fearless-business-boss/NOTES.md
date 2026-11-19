# Fearless Business Boss (Tammy Durden) website build

Built the Boss Lady Bloggers way (see `/CLIENT-SITE-PLAYBOOK.txt`): single-file HTML pages pasted into Showit full-page Embed Code blocks.

Status: **builder + homepage done. Next step: confirm the design direction with the screenshots in `screens/`, then build the remaining pages.**

## Files

- `builder.py`: shared skeleton. Tokens, announcement banner, nav + pull-out menu, footer, loader, standard JS, `page()`. Edit shared pieces here only.
- `build_home.py`: homepage. Run `python3 build_home.py`.
- `index.html`: generated homepage. `deliverables/index.txt` is the copy to paste into Showit.
- `images/`: Tammy's photos from her current site, resized and compressed. The pages serve them from raw.githubusercontent on branch `claude/sharp-rubin-nleft3`. **When this branch merges, update `BRANCH` in builder.py and rebuild.**
- `screens/`: desktop, phone, menu open and JavaScript-off screenshots.

## Design direction

- **Blue and professional.** Navy ink `#0E1B3A`, action blue `#2456D3` (gradient buttons `#2F6BEA` to `#1E48B8`), blue tint backgrounds (`#F7F9FC`, `#EBF1FA`, `#D9E6FB`), a teal accent `#1497B4` taken from her current brand, and champagne gold `#C2A15A` for details.
- **Clean fonts.** Playfair Display for headlines with italic blue accents, and Inter for body text. Body text is 18px with high contrast, for readers 50+.
- **Menu.** A "Menu" pill button opens a menu that slides in from the right, with 11 numbered links, a photo card with the call button, and social links. It is built with CSS (the checkbox technique), so it also opens with JavaScript off. JavaScript adds closing with Esc, keyboard opening, scroll lock and aria-expanded. On desktop the nav also shows Start Here, Coaching, Mastermind and the call button.
- **Audience.** Seasoned women service providers (VAs, bookkeepers, OBMs, consultants, coaches, agency owners), written for women like Tammy. "Seasoned" is used instead of naming an age.

## Offer structure (as requested: one membership, one upsell, one high-ticket offer)

| Role | Name on site | Source | Price on site |
|---|---|---|---|
| Free call (main CTA) | **The Hand-Off Plan Call**, 30 min on Zoom | NEW angle on her existing "free no-sales-pitch session" | Free |
| Membership | **The Fearless Mastermind** | Her Mastermind Group Coaching (2 sessions/month, 10 to 12 members) | $75/month (her current price) |
| Upsell | **Pricing & Packages Intensive** | NEW, built on her most popular topic (pricing) | Placeholder: "Price: Tammy to set" |
| High ticket (the only one) | **Business Freedom Coaching** (1:1) | Her Business Freedom Package + Build Your Agency 1:1 | "Investment shared on your free call" |

The Hand-Off Plan Call: the visitor leaves with (1) her top 3 hand-offs (to a subcontractor, a VA or a simple tool), (2) a price check so the help pays for itself, and (3) her next 30 days. It ties together Tammy's real strengths: outsourcing and building teams, pricing, and hand-holding. It also speaks to a 2026 worry: a business changing fast and no more hours in the day.

## Homepage sections (no two adjacent share a layout)

1. Announcement marquee (freebie + call), dismissible
2. Hero: split, arched portrait, spinning badge, floating stickers, typewriter ("Made for virtual assistants / bookkeepers / ..."), trust row
3. Blue audience marquee strip
4. Tappable "Does this sound familiar?" checklist with a live meter and reaction note
5. Navy band: The Hand-Off Plan Call, 3 cards + Joyce's review of her free session
6. Meet Tammy: photo + polaroid collage, story, MS/lupus "disABILITY" story
7. Blue stats band (count-ups)
8. Three offers, high-ticket featured in the middle
9. Old way / fearless way toggle switch
10. Navy video band (2 YouTube interviews) + "As featured in" press marquee
11. Client love: big quote, side quotes, scrolling quote marquee (all real reviews from her site)
12. Free resources: fanned polaroids of her 3 freebies
13. Learn with Tammy: Blog / Podcast / YouTube editorial rows
14. FAQ accordion + FAQPage JSON-LD (7 questions)
15. Final navy CTA with shimmer headline, then a reverse outline marquee and the footer

## Verified (Playwright, headless Chromium)

- Desktop 1440 and phone 390: horizontal overflow 0px, no console or page errors.
- Clicked: menu opens and closes (click and Esc), checklist meter counts (4 of 8), toggle flips, FAQ opens.
- JavaScript off: the loader is hidden, all content is visible, the menu still opens, and both old/new lists show side by side.
- Every `<section>` has an h1 or h2. FAQ schema parses. No em or en dashes (the builder fails the build if one appears).

## Waiting on Tammy

- [ ] Approve the design direction (screenshots) before the other pages are built.
- [ ] Approve the free call name ("Hand-Off Plan Call"), and rename her Zoom Scheduler event to match. Her site says both 20 and 30 minutes; the new site says 30.
- [ ] Confirm the membership: name "The Fearless Mastermind", $75/month (her page says it goes to $99 "soon"). Decide what happens to the Christian Business Women's Mastermind ($49/month): fold it in, or keep it off the new site?
- [ ] Upsell: approve the Pricing & Packages Intensive and give its price, length and what's included.
- [ ] High ticket: confirm "Business Freedom Coaching" and that the investment stays off the site.
- [ ] Logo: the new direction uses a type wordmark plus an "F" monogram instead of her cartoon superhero logo. Keep it or swap it back?
- [ ] Podcast: she has guest appearances but no show of her own that we could find. Is there a show, or is the podcast page a "guest appearances" page?
- [ ] YouTube channel URL (only individual video links were found).
- [ ] Email platform form embeds for the freebies (her current forms are on WordPress).
- [ ] More photos would help (JPG, under 30 MB each, shared Google Drive folder).
- [ ] Fix on her current site: the homepage footer note says info@fearless**buis**nessboss.com (typo).

## Next pages (after approval)

start-here, about, coaching (high ticket), mastermind (membership), pricing-intensive (upsell), resources, blog (Showit blog kit, zero-JS rules), podcast, youtube, book-a-call, contact (FormSubmit, never mailto), 404.
