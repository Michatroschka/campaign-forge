# openrouter-image-gen — Installation & Hackathon-Setup

Portables Skill: Bildgenerierung/-manipulation direkt über die OpenRouter Image API mit BYOK-Key des Endnutzers. Funktioniert **standalone** (nur Node + Key) und in **OpenClaw-Sessions** (mit Secrets-Flow).

## Was drin ist

- `SKILL.md` — das Verfahren (BYOK-Eingabe, Key-Verdrahtung, Generierung, Fehlerbilder)
- `scripts/or_probe.mjs` — Key-Validierung ohne Key-Ausgabe (`GET /api/v1/key`)
- `scripts/openrouter_image.mjs` — Generierung/Manipulation (Text-zu-Bild, Bild-zu-Bild mit bis zu 16 Referenzbildern)

## Installation auf beliebigem Agenten

**Option A — OpenClaw-Skills-Ordner (empfohlen):**
1. Kompletten Skill-Ordner kopieren in das Skills-Verzeichnis des Ziel-Agenten:
   - Workspace-weit: `~/.openclaw/workspace/skills/openrouter-image-gen/`
   - Agent-spezifisch: `~/.openclaw/agents/<agent-id>/agent/workshop-skills/openrouter-image-gen/`
2. Wichtig: `SKILL.md` liegt direkt im Ordner (nicht in einem Unterordner).
3. Datei-Eigentümer prüfen (`chown -R <user>: <zielordner>`, falls als root kopiert).
4. Neuer Skill ist ab der nächsten Session des Agenten nutzbar. Verifikation: Agent fragen „Welche Skills hast du?" — `openrouter-image-gen` muss gelistet sein; alternativ direkt eine Test-Bildgenerierung fahren.

**Option B — nur die Skripte (ohne OpenClaw):**
- `scripts/`-Ordner beliebig hin kopieren; Node ≥ 22.5 (empfohlen 24 LTS).
- Key als Env: `export OPENROUTER_API_KEY=sk-or-v1-...`
- Lauf: `node openrouter_image.mjs --prompt "..." --out test.png`

## Key-Einrichtung (BYOK)

1. Endnutzer erstellt Key auf openrouter.ai/keys (Name beliebig, z. B. „hackathon-bot").
2. **OpenClaw-Umgebung:** Agent fordert per `secrets`-Flow an (name=`OPENROUTER_API_KEY`, allowedHosts=`openrouter.ai`) — Eingabe maskiert, nie im Chatverlauf. Direktes Chat-Eintippen des Keys vermeiden.
3. **Docker-Umgebung:** `docker run -e OPENROUTER_API_KEY=sk-or-v1-...` bzw. compose `environment: [OPENROUTER_API_KEY=sk-or-v1-...]`. Das Skript liest Env als Fallback — kein Secret-Store nötig.
4. Probe: `node scripts/or_probe.mjs` — muss `GET /api/v1/key status: 200` liefern.

## In OpenClaw-Docker backen

1. Base-Image mit Node ≥ 22.5 (Node-24-Images passen).
2. Skill-Ordner ins Image bzw. Volume: `/home/<user>/.openclaw/workspace/skills/openrouter-image-gen/` (oder Agents-Pfad, siehe oben).
3. Key via `-e OPENROUTER_API_KEY=...` reinreichen; alternativ Secret-Store-Datei `~/.openclaw/state/openclaw.sqlite` als read-only Volume mounten (`-v ...:/home/<user>/.openclaw/state/openclaw.sqlite:ro` — Skript liest nur).
4. **Nur falls** der Agent im Container selbst `openrouter/...`-Modelle ruft (Gateway-Betrieb): `models.providers.openrouter.auth: "api-key"` setzen und `openclaw secrets reload` — verhindert den 401-Shadowing-Fall (siehe SKILL.md). Ohne Gateway-Betrieb entfällt dieser Schritt.
5. Verifikation im Container:
   ```bash
   node .../scripts/or_probe.mjs                      # status 200
   node .../scripts/openrouter_image.mjs --prompt "a red cube on white background" --out /tmp/cube.png
   ls -l /tmp/cube.png   # > 10 KB
   ```

## Für die übernehmende Session (Kochrezept)

1. Skill-Ordner am Zielort einrichten (Installations-Option A oder B oben).
2. Key des Hackathon-Users beschaffen (secrets-Flow oder Env) — Probe mit `or_probe.mjs` muss `status: 200` liefern.
3. Generierung testen (roter Würfel, Prompt steht in Or_probe-Verifikation oben), dann den eigentlichen Bot-Use-Case (Prompt/Referenzen) fahren.
4. Bei **401 „User not found"** trotz gültigem Key: SKILL.md-Abschnitt „Key verdrahten" (Schritte 4–5) — das ist der REF_SHADOWED-Fix, am 2026-09-29 live verifiziert.
5. Bei **400 mit Referenzbildern:** Endpoint-Discovery (`GET /api/v1/images/models/<id>/endpoints`) für das exakte Feld.
6. Output: `MEDIA:<pfad>`-Zeile im Chat, Kosten aus `cost=` nennen.

## Referenz-Doku

- OpenRouter Image-API-Guide: openrouter.ai/docs/guides/overview/multimodal/image-generation
- API-Referenz: openrouter.ai/docs/api/reference (Images)
- OpenClaw-Secrets-Semantik: docs.openclaw.ai → Gateway → Secrets (REF_SHADOWED)