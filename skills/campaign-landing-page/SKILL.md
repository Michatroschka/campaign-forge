---
name: campaign-landing-page
description: Generate a complete, self-contained marketing landing page as one HTML file for a product, following the campaign loop's approval rules.
---
# Campaign landing page generator

Produce ONE single-file HTML landing page per approved brief. Never multiple
pages or frameworks. Plain, hand-written HTML with inline CSS only — no build
step, no external assets except fonts from system stacks.

Structure (in this order):
1. Sticky top bar: product name + one-line tagline + anchor link to contact.
2. Hero: headline (the single sharpest benefit from brief.md), subline,
   primary CTA button. If a generated hero image exists in
   `campaigns/<product>/assets/`, reference it by relative path
   (`assets/hero.png`); else use a pure-CSS gradient placeholder.
3. Three benefit cards: short title + two sentences each, drawn from the brief.
4. "How it works": three numbered steps.
5. Social proof: three placeholder quotes clearly marked as placeholders
   ("Beispiel-Zitat — durch echtes Kundenfeedback ersetzen") unless the user
   supplied real ones.
6. Contact section: working `mailto:` or a simple form stub with a note that
   form submission needs the user's endpoint.
7. Footer: product name, tagline, copyright with current year.

Style rules:
- Mobile-first, max-width 1100px container, fluid type via clamp().
- One accent color chosen from the product's domain (ask in the brief turn if
  the user has brand colors; default to a confident single hue, no gradients
  on text).
- System font stack. Buttons min-height 44px. Contrast AA or better.
- No JavaScript except a smooth-scroll anchor if needed. The page must work
  fully with JS disabled.

Workflow:
1. Read `campaigns/<product>/brief.md` first; never invent product facts
   beyond it.
2. Write the file to `campaigns/<product>/landing/index.html`.
3. Verify the file exists and is valid HTML (balanced tags) before presenting.
4. Present with the file path and the approval question from the campaign
   loop. On revision, overwrite the same file and bump the version note.