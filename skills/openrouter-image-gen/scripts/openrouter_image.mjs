// OpenRouter-Bildgenerierung/-manipulation (BYOK).
// Key-Quellen (Vorrang): 1. Gateway-Secret-Store (~/.openclaw/state/openclaw.sqlite, überschreibbar per --db oder OPENCLAW_STATE_DB), 2. Env OPENROUTER_API_KEY.
// Gibt NIEMALS den Key aus.
// Usage:
//   node openrouter_image.mjs --prompt "..." [--out out.png] [--model google/gemini-3.1-flash-image] [--ref img.png ...]
import { DatabaseSync } from "node:sqlite";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
const get = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : undefined);
const prompt = get("--prompt");
const out = get("--out") || "openrouter-image.png";
const model = get("--model") || "google/gemini-3.1-flash-image";
const refs = [];
argv.forEach((a, i) => {
  if (a === "--ref" && argv[i + 1]) refs.push(argv[i + 1]);
});
if (!prompt && refs.length === 0) {
  console.error("Nichts zu tun: --prompt oder mindestens ein --ref nötig");
  process.exit(1);
}

const dbPath = get("--db") || process.env.OPENCLAW_STATE_DB || join(homedir(), ".openclaw", "state", "openclaw.sqlite");
let key;
try {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const row = db
    .prepare("SELECT value FROM secret_store_entries WHERE name = ? AND deleted_at_ms IS NULL")
    .get("OPENROUTER_API_KEY");
  db.close();
  key = row?.value;
} catch {
  // Store nicht erreichbar: Env-Fallback (BYOK ohne OpenClaw)
}
if (!key) key = process.env.OPENROUTER_API_KEY;
if (!key) {
  console.error("NO_KEY: weder Secret-Store (OPENROUTER_API_KEY) noch Env-Variable gesetzt.");
  console.error("User-Key anfordern: secrets(request, name=OPENROUTER_API_KEY, allowedHosts=[openrouter.ai]) oder export OPENROUTER_API_KEY=...");
  process.exit(1);
}
console.log(`key-ok len=${key.length}`); // niemals den Key selbst ausgeben

const body = { model };
if (prompt) body.prompt = prompt;
if (refs.length) {
  body.input_references = refs.map((p) => {
    const b64 = readFileSync(p).toString("base64");
    const mime = /\.jpe?g$/i.test(p) ? "jpeg" : "png";
    return { type: "image_url", image_url: { url: `data:image/${mime};base64,${b64}` } };
  });
}

const res = await fetch("https://openrouter.ai/api/v1/images", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
  // 401 "User not found" -> REF_SHADOWED-Fix siehe SKILL.md, Abschnitt "Key verdrahten"
  process.exit(1);
}
const json = JSON.parse(text);
const b64 = json?.data?.[0]?.b64_json;
if (!b64) {
  console.error(`NO_IMAGE: ${text.slice(0, 400)}`);
  process.exit(1);
}
if (!b64.startsWith("iVBOR")) console.warn("WARN: Base64 beginnt nicht mit iVBOR (erwartet PNG)");
writeFileSync(out, Buffer.from(b64, "base64"));
const cost = json?.usage?.cost ?? "?";
console.log(`OK ${out} cost=${cost}`);