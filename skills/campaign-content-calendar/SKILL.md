---
name: campaign-content-calendar
description: Produce a two-week posting plan table for an approved campaign, mapping days to channels, posts and needed assets.
---
# Campaign content calendar

Build a 2-week plan from `campaigns/<product>/posts.md` and the brief.

Format: one markdown table in `campaigns/<product>/plan.md` with columns
Day | Channel | Post (title/angle) | Asset needed. Two to three rows per
week for a lean start, never daily spam. Reuse the 5 approved posts and
schedule each at its natural time; mark remaining slots as "neu schreiben"
with an angle hint so the user sees the pipeline, not filler.

Rules:
- Anchor recurring slots to concrete weekdays (e.g. "Dienstag 10:00").
- Every row must name its asset: existing file path from the campaign folder
  or a clear TODO.
- End with one line on the single most important next action for the user
  (e.g. "erst Post 1 am Dienstag live bringen").
- Present the table in chat and end with the approval question from the
  campaign loop. On revision, rewrite plan.md and bump the version note.