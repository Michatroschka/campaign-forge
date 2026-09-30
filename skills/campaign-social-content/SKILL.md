---
name: campaign-social-content
description: Write five social media posts for an approved campaign product, with varied angles, after the landing page and visual are approved.
---
# Campaign social content

Write exactly 5 posts from `campaigns/<product>/brief.md` — never more, never
fewer:

- 2 for LinkedIn: one benefit-driven, one story/behind-the-scenes. Plain
  text, no hashtags-for-hashtags; max 2 relevant hashtags each.
- 2 for X/Twitter: one objection-killer ("you think you need X, you actually
  need Y"), one punchy one-liner. Both under 270 characters.
- 1 Instagram caption: emotional, with a concrete CTA and 3-5 hashtags.

Rules:
- Every claim must be backed by the brief. Never invent numbers, customers,
  or results. If the brief lacks proof, use the audience's pain point instead
  of fake stats.
- Each post references the landing page or hero asset where natural
  (placeholder `[Link zur Landing Page]` if no URL exists).
- Write the file to `campaigns/<product>/posts.md`, one section per platform,
  with the post text ready to copy-paste.
- Present the full posts in the chat (people approve what they read), then
  end with the approval question from the campaign loop. On revision,
  rewrite posts.md and bump the version note.