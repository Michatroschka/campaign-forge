// OpenRouter Image API probe - liest Key read-only (Secret-Store oder Env).
// Gibt NIEMALS den Key selbst aus - nur Status und Länge.
import { DatabaseSync } from "node:sqlite";
import { homedir } from "node:os";
import { join } from "node:path";

const dbPath = process.env.OPENCLAW_STATE_DB || join(homedir(), ".openclaw", "state", "openclaw.sqlite");
let key;
try {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const row = db
    .prepare("SELECT value FROM secret_store_entries WHERE name = ? AND deleted_at_ms IS NULL")
    .get("OPENROUTER_API_KEY");
  db.close();
  key = row?.value;
} catch {
  // Store nicht erreichbar/nicht vorhanden: Env-Fallback
}
if (!key) key = process.env.OPENROUTER_API_KEY;
if (!key) {
  console.log("NO_KEY: weder Secret-Store-Eintrag OPENROUTER_API_KEY noch Env-Variable gesetzt");
  process.exit(1);
}
console.log(`key-ok len=${key.length} prefix=${key.slice(0, 10)}...`);

const res = await fetch("https://openrouter.ai/api/v1/key", {
  headers: { Authorization: `Bearer ${key}` },
});
const text = await res.text();
console.log(`GET /api/v1/key status: ${res.status}`);
if (res.ok) {
  const j = JSON.parse(text);
  const d = j?.data ?? {};
  console.log(`usage=${d.usage ?? "?"} limit=${d.limit ?? "?"} limit_remaining=${d.limit_remaining ?? "?"}`);
} else {
  console.log(text.slice(0, 300));
  process.exit(1);
}