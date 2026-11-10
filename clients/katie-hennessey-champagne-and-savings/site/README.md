# Champagne & Savings site (Showit embed pages)

Built the Boss Lady Bloggers way: every page is one self-contained HTML document pasted into a full-page Embed Code block in Showit.

- `builder.py` holds everything shared (brand tokens, fonts, announcement bar, nav, mobile menu, loader, footer, standard JS). Edit shared pieces there, never in the generated pages.
- `page_*.py` builds one page each: `python3 page_home.py`
- `pages/*.html` are the generated pages; `txt/*.txt` are identical copies to send to the client.
- `node verify.js home.html` renders desktop and 390px screenshots into `qa/`, checks horizontal overflow, headings per section, console errors, clicks the interactive pieces, and checks the page with JavaScript off.
- `WAITING_ON_KATIE.md` lists every placeholder still to swap.

Brand: colors and fonts come from `../brand/README.md`.
