# Future project: Boss Lady Bloggers marketing page cleanup (I-16)

Owner instruction (2026-11-02): do not modify the existing public website. The root `index.html`, `blb site images/`, and `website inspo/` stay untouched. This file records what a later cleanup should consider. Nothing here has been changed.

## What the current page contains
- Offers that predate The BOSS Business System: "Blog Launch Lab" (1:1 with a custom Showit site) and "The Blogging Ladies" membership at $100/month with "monthly live group coaching", "a free 1:1 kickstarter call", and "cancel anytime".
- A testimonials section with five star ratings and the note "Placeholder testimonials, swap in your real client words".
- Income related imagery (`blb site images/proof/`) and the line "Same girl. Completely different bank account."
- Fonts and colors (Bricolage Grotesque, Inter, hot pink, purple, blue) that differ from the BOSS brand system (Cormorant Garamond, DM Sans, dusty rose, mauve, ivory, plum).

## Why it matters later
- The blueprint and voice guide forbid invented testimonials and unsupported income claims, and about.md says old offers are not current unless reconfirmed.
- Images on that page load from `raw.githubusercontent.com/.../claude/blb-site-images-folder-5nm2vd/...`. Renaming the branch or moving the folder breaks the live page, so any cleanup must update those URLs first or host the images elsewhere.

## Suggested scope when the owner is ready
1. Decide which offers stay on the Showit site and link the BOSS program pages there.
2. Replace placeholder testimonials with authorized, accurate ones or remove the section.
3. Review income imagery against the blueprint's proof rules.
4. Move images to stable hosting before any repository reorganization.
