---
name: openrouter-image-gen
description: Bild generieren/manipulieren über OpenRouter Image API mit BYOK-Key-Eingabe; nutzen bei Bildaufträgen via openrouter-Modellen, 401 "User not found", BYOK-Setup, Docker-Bildpipeline.
---

# OpenRouter-Bildgenerierung & -manipulation (BYOK)

Bild generieren oder manipulieren direkt über die OpenRouter Image API (`POST https://openrouter.ai/api/v1/images`) mit dem Bearer-Key des Endnutzers (BYOK). Kein eigener Bild-Provider nötig. Der Key wird niemals im Klartext angezeigt, geloggt oder in Dateien geschrieben.

## BYOK-Key-Eingabe

1. **Prüfen:** In OpenClaw-Sessions `secrets` (action=list) — existiert `OPENROUTER_API_KEY`? Außerhalb von OpenClaw: prüfen, ob die Env-Variable gesetzt ist (`printenv OPENROUTER_API_KEY | wc -c` → Länge ohne Wert-Ausgabe).
2. **Anfordern, wenn beides fehlt:** User auffordern, unter openrouter.ai/keys einen Key zu erstellen, dann in OpenClaw `secrets` mit action=request, name=`OPENROUTER_API_KEY`, reason="Bildgenerierung über OpenRouter", allowedHosts=["openrouter.ai"]. Der User tippt den Key maskiert; der Wert landet ausschließlich im Secret-Store, nie im Chatverlauf. Abschlusskriterium: `secrets(list)` zeigt den Eintrag.
3. **Docker/Fallback:** `OPENROUTER_API_KEY` als Env-Variable setzen (`docker run -e` / compose `environment`). Die Skripte nutzen den Store vorrangig, Env als Fallback — portables BYOK ohne OpenClaw-Abhängigkeit.

## Key verdrahten (nur bei 401 oder leerer Provider-Config)

4. Beweis zuerst, nie raten: `node <skilldir>/scripts/or_probe.mjs` — prüft `GET https://openrouter.ai/api/v1/key` und gibt nur `status` + Key-Länge/Präfix aus, niemals den Key. Erwartung: `status: 200`.
5. **401 "User not found" trotz gültigem Key** = `REF_SHADOWED` (Auth-Profile überschatten den Config-SecretRef). Fix in dieser Reihenfolge, kein Gateway-Neustart nötig:
   ```bash
   openclaw config set models.providers.openrouter.auth api-key
   openclaw secrets reload
   openclaw secrets audit   # für openrouter: kein REF_SHADOWED mehr
   ```
   Bleibt der Befund: schattende Profile entfernen mit `openclaw models auth logout openrouter:<id> --agent <agent> --yes`. Scheitert das an "auth store lock may be busy" (Gateway hält die Agent-DB): nur per `openclaw gateway stop` → logout → `openclaw gateway start` in einem separaten Terminal; niemals die DB direkt editieren. Ohne Gateway/CLI (reines BYOK-Skript) entfällt dieses Problem komplett — die Skripte in `scripts/` gehen direkt an die API.

## Generierung / Manipulation

6. **Modell wählen:** Discovery über `GET /api/v1/images/models` (Capabilities, Preise, Parameter pro Endpoint unter `.../models/<id>/endpoints`). Standard: `google/gemini-3.1-flash-image`.
7. **Aufruf** mit dem Support-Skript:
   ```bash
   node <skilldir>/scripts/openrouter_image.mjs --prompt "…" --out lampe.png
   node <skilldir>/scripts/openrouter_image.mjs --prompt "…" --ref foto.png --out edit.png
   ```
   - Text-zu-Bild: nur `--prompt`. Manipulation/Bild-zu-Bild: zusätzlich `--ref` (bis 16 Referenzbilder, JPG/PNG). Die Antwort liefert `data[0].b64_json` → wird als Datei nach `--out` geschrieben.
   - Das Skript liest den Key read-only aus dem Gateway-Secret-Store (Pfad per `--db` oder `OPENCLAW_STATE_DB` überschreibbar; Fallback: Env `OPENROUTER_API_KEY`) und gibt nur `len=` aus — niemals den Key.
   - Abschlusskriterium: `--out`-Datei existiert, Größe > 10 KB, Base64 beginnt mit `iVBOR` (PNG).
8. **Ausliefern:** eigene Zeile `MEDIA:<pfad>` im Chat; Kosten aus der Skript-Ausgabe (`cost=`) nennen, bei teuren Modellen vorab warnen.

## Fehlerbilder

- **400 bei Referenzbildern:** exaktes Feld pro Endpoint über `GET /api/v1/images/models/<id>/endpoints` verifizieren (Feldname variiert; Standardversuch `input_references` als `data:image/<mime>;base64,…`-URL).
- **403 "Only management keys can fetch activity":** normal — der normale Key darf seine Activity-Liste nicht selbst abrufen; User auf openrouter.ai/keys → Activity verweisen, nicht raten.
- **404 auf Activity-/Analytics-Endpoints:** existiert für normale Keys nicht; Key-Status via `GET /api/v1/key` statt Statistik prüfen.
- **`node:sqlite` Fehler:** braucht Node ≥ 22.5 (empfohlen 24 LTS). Altes Node: Env-Key setzen — das Skript fällt automatisch auf Env zurück.