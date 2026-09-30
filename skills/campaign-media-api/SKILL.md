---
name: campaign-media-api
description: Generate product images, videos and voiceovers via user-supplied API keys (OpenRouter, fal.ai, ElevenLabs) requested through the masked secrets flow; keys never appear in chat or git.
---
# Campaign media APIs (bring-your-own-key)

The runtime has no built-in image/video generation. Generate media by
calling APIs with THE USER'S OWN keys, requested through the `secrets` tool.
Never use a key you were not granted via `secrets` in this conversation.
Never put keys in campaign files, memory, or anything you send back.

## Key handling (via the `secrets` tool — masked entry, never pasted)

This agent HAS the OpenClaw `secrets` tool. All keys go through it —
never ask the user to paste key text into the chat.

1. Check what exists: `secrets(action="list")` — look for
   `OPENROUTER_API_KEY`, `FAL_API_KEY`, `ELEVENLABS_API_KEY`.
2. Missing one? Request it from the human via `secrets` with
   `action: "request"`. Names + reasons + allowedHosts per key:
   - `OPENROUTER_API_KEY` — reason "Bildgenerierung für deine Kampagne über
     OpenRouter" — allowedHosts ["openrouter.ai"]
   - `FAL_API_KEY` — reason "Produktvideos über fal.ai" — allowedHosts ["fal.run"]
   - `ELEVENLABS_API_KEY` — reason "Voiceover über ElevenLabs" —
     allowedHosts ["api.elevenlabs.io"]

   The user gets a masked input window — the key never appears in chat,
   transcript, or any file. Confirm only "Key gespeichert" when done.
3. If the request returns no_answer, repeat it once (the window may have
   timed out). If the user declines, fall back to CSS/SVG placeholder
   visuals and say so — do not block the campaign.
4. The stored value is referenced by its name (the SecretRef); the agent
   never sees the value. At script-call time, rely on runtime injection —
   do not print, echo, or store the key anywhere.
5. If a generation call returns 401/403, say the key was rejected and
   re-request via `secrets` with reason "alter Key wurde abgelehnt, bitte
   neuen Key eingeben".

## Image generation (OpenRouter — primary, text-to-image AND photo edit)

Use the `openrouter-image-gen` skill's scripts. Default model
`google/gemini-3.1-flash-image`.

1. Verify the stored key first (masked, no key output). The container's
   state DB path env is `OPENCLAW_STATE_DB=/var/lib/plow/state/openclaw.sqlite`
   (already set in the environment — no need to set it):
   `node /opt/plow/skills/openrouter-image-gen/scripts/or_probe.mjs`
   — expect `key-ok ... status: 200`.
2. Text-to-image:
   `node /opt/plow/skills/openrouter-image-gen/scripts/openrouter_image.mjs \
     --prompt "..." --out campaigns/<name>/assets/hero.png`
3. Photo manipulation (user's real product photos as reference):
   same command plus `--ref campaigns/<name>/assets/user/foto.jpg`
   (up to 16 refs, JPG/PNG).
4. Check the output file exists and is > 10 KB (valid PNG) before
   presenting; deliver `MEDIA:<path>` in the same turn and state the
   `cost=` reported by the script.

## Image generation via fal.ai (alternative)

```bash
curl -s https://fal.run/fal-ai/flux/schnell \
  -H "Authorization: Key $FAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "...", "image_size": "landscape_16_9"}'
```

Read `images[0].url`, download with curl to
`campaigns/<name>/assets/hero.png`, verify non-empty. If generation fails
twice, deliver the CSS/SVG fallback and say so — never present a broken or
empty file as a visual.

## Video (fal.ai — only on request)

```bash
curl -s https://fal.run/fal-ai/minimax/video-01 \
  -H "Authorization: Key $FAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "..."}'
```

Video endpoints are slow and costly — always confirm price expectation
with the user ("dauert 2-5 Min und kostet Credit auf deinem fal-Konto —
ok?") before the first call. Read the returned `video.url`, download to
`campaigns/<name>/assets/video.mp4`, verify non-empty.

## Voiceover (ElevenLabs)

```bash
curl -s https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM \
  -H "xi-api-key: $ELEVENLABS_API_KEY" -H "Content-Type: application/json" \
  -d '{"text": "...", "model_id": "eleven_multilingual_v2"}'
```

Output is raw mp3 — write it straight to
`campaigns/<name>/assets/voiceover.mp3`. Default voice is Rachel; ask for
a voice_id only if the user names a preference. German works with the
multilingual model.

## Rules

- One generation per approval: present the result, ask approve/revise, then
  continue. Batch generation only after explicit approval of the set.
- Verify every downloaded file (non-empty, plausible size) before presenting.
- If no key was ever provided, fall back to the storyboard/CSS approach —
  do not block the campaign on media.