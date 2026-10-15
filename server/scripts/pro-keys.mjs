#!/usr/bin/env node
// ProvenPin Pro key admin. Stores only SHA-256 hashes in the PRO_KEYS KV namespace.
// Needs: the PRO_KEYS namespace created + bound in wrangler.toml, and CLOUDFLARE_API_TOKEN
// with "Workers KV Storage: Edit" rights (we do not have that token yet).
//
//   node scripts/pro-keys.mjs mint <label>     mint a key, print it ONCE, store its hash
//   node scripts/pro-keys.mjs revoke <key>     mark a key revoked (by the key itself)
//   node scripts/pro-keys.mjs revoke-hash <h>  mark revoked by hash (if the key is lost)
//   node scripts/pro-keys.mjs hash <key>       print the hash only (no KV call)
// Add --dry-run to print the wrangler command instead of running it.
import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const [cmd, arg, ...rest] = process.argv.slice(2);
const dry = rest.includes("--dry-run") || process.argv.includes("--dry-run");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const die = (m) => { console.error(m); process.exit(1); };

function kvPut(hash, value) {
  const args = ["wrangler", "kv", "key", "put", "--binding=PRO_KEYS", "--remote", `key:${hash}`, value];
  if (dry) { console.error("[dry-run] npx " + args.join(" ")); return; }
  const r = spawnSync("npx", args, { stdio: ["ignore", "ignore", "inherit"] });
  if (r.status !== 0) die("wrangler kv put failed (is PRO_KEYS bound and the token allowed to edit KV?)");
}
const label = (s) => String(s ?? "").replace(/[^\w.@-]/g, "_").slice(0, 64);

if (cmd === "mint") {
  if (!arg) die("usage: mint <label>");
  const key = "pp_live_" + randomBytes(24).toString("base64url");
  const hash = sha(key);
  kvPut(hash, `active label=${label(arg)} created=${new Date().toISOString()}`);
  console.log(key);
  console.error(`hash ${hash}. Key shown once; it is not stored anywhere.`);
} else if (cmd === "revoke" || cmd === "revoke-hash") {
  if (!arg) die(`usage: ${cmd} <${cmd === "revoke" ? "key" : "hash"}>`);
  const hash = cmd === "revoke" ? sha(arg.trim()) : arg.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) die("bad hash");
  kvPut(hash, `revoked at=${new Date().toISOString()}`);
  console.error(`revoked ${hash}`);
} else if (cmd === "hash") {
  if (!arg) die("usage: hash <key>");
  console.log(sha(arg.trim()));
} else die("commands: mint <label> | revoke <key> | revoke-hash <hash> | hash <key>  [--dry-run]");
