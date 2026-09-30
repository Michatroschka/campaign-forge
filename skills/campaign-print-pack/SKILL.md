---
name: campaign-print-pack
description: Generate flyer, poster and business card PDFs for an approved campaign from styled HTML, stating exact file paths.
---
# Campaign print pack

Generate print pieces from `campaigns/<product>/brief.md` as PDFs. Use styled
HTML rendered to PDF (wkhtmltopdf or headless chromium if available in the
container; else write the HTML files and say PDF rendering was unavailable —
never claim a PDF exists that does not).

Pieces (generate only what the user asked for, default all three):
1. **Flyer A4 portrait**: headline, 3 benefits, hero image or CSS gradient,
   contact block, CTA. Print-safe margins (12mm), font min 10pt.
2. **Poster A3 landscape**: one huge headline, one image, one CTA line,
   contact. Readable from 3 meters — headline min 60pt.
3. **Business card 85×55mm**: name/logo placeholder, tagline, contact lines.
   3mm bleed marks noted in the file.

Workflow:
1. Read the brief and the approved landing page for consistent wording and
   the same accent color.
2. Write HTML sources to `campaigns/<product>/print/` (flyer.html,
   poster.html, card.html), then render each to a same-named PDF.
3. Verify each output file exists and is non-empty before presenting.
4. Present with exact file paths and the approval question. On revision,
   regenerate only the changed piece and bump the version note.