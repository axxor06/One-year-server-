// ONE-TIME setup on your own computer: lets you approve "send email as me" for this project and saves the refresh token.
//   npm run gmail:authorize
// What it does: prints a Google sign-in link, waits on a local address for Google to send you back, trades the code for a
// refresh token (using PKCE + a random "state" check), and writes ONLY the GOOGLE_REFRESH_TOKEN line into server/.env.
// The token is never printed. Nothing else in .env is changed. The only permission requested is gmail.send (send-only:
// it can't read your mail).
import "dotenv/config";
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const envArg = process.argv.indexOf("--env");
const ENV_FILE = envArg > -1 ? path.resolve(process.argv[envArg + 1]) : path.resolve(here, "../.env");
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = process.env.GOOGLE_OAUTH_TOKEN_URL || "https://oauth2.googleapis.com/token"; // overridable only so the tests can use a fake Google
const SCOPE = "https://www.googleapis.com/auth/gmail.send";
const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret, GMAIL_USER } = process.env;
const REDIRECT = process.env.GOOGLE_REDIRECT_URI || "http://localhost:8123/oauth2callback";
const placeholder = (v) => !v || v.startsWith("your_");
const stop = (msg) => { console.error(msg); process.exit(1); };

if (placeholder(id) || placeholder(secret)) stop("Fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env first (see .env.example).");
const redirect = new URL(REDIRECT);
if (!["localhost", "127.0.0.1"].includes(redirect.hostname) || redirect.protocol !== "http:") stop("GOOGLE_REDIRECT_URI must be an http://localhost or http://127.0.0.1 address.");

const state = crypto.randomBytes(16).toString("hex");
const verifier = crypto.randomBytes(32).toString("base64url");
const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
const authUrl = `${AUTH_URL}?${new URLSearchParams({ client_id: id, redirect_uri: REDIRECT, response_type: "code", scope: SCOPE, access_type: "offline", prompt: "consent", state, code_challenge: challenge, code_challenge_method: "S256", ...(placeholder(GMAIL_USER) ? {} : { login_hint: GMAIL_USER }) })}`;

// set or replace one KEY=value line, leaving every other line exactly as it is
function saveEnvLine(file, key, value) {
  const old = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const line = `${key}=${value}`, re = new RegExp(`^${key}=.*$`, "m");
  const next = re.test(old) ? old.replace(re, () => line) : old + (old && !old.endsWith("\n") ? "\n" : "") + line + "\n";
  fs.writeFileSync(file, next, { mode: 0o600 });
}
const page = (title, body) => `<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;max-width:32rem;margin:4rem auto;color:#44303a"><h2>${title}</h2><p>${body}</p>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== redirect.pathname) { res.writeHead(404).end(); return; }
  const fail = (code, msg) => { res.writeHead(code, { "Content-Type": "text/html" }).end(page("Not done", msg)); };
  if (url.searchParams.get("state") !== state) return fail(400, "That request didn't match this sign-in (wrong state), so I ignored it. Use the link printed in your terminal.");
  if (url.searchParams.get("error")) { fail(400, "Google reported: " + url.searchParams.get("error") + ". You can close this tab."); return finish(1, `Google did not authorize: ${url.searchParams.get("error")}`); }
  const code = url.searchParams.get("code"); if (!code) return fail(400, "No code received.");
  try {
    const r = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: id, client_secret: secret, code, code_verifier: verifier, grant_type: "authorization_code", redirect_uri: REDIRECT }) });
    const t = await r.json().catch(() => ({}));
    if (!r.ok) { fail(500, "Google refused the code. Check the terminal."); return finish(1, `Google refused the code (${t.error || r.status}). Check the Client ID/Secret and that the redirect URI in Google Cloud is exactly ${REDIRECT}`); }
    if (!t.refresh_token) { fail(500, "Google didn't return a refresh token. Check the terminal."); return finish(1, "Google didn't return a refresh token. Remove this app at https://myaccount.google.com/permissions and run this again."); }
    if (!String(t.scope || "").includes("gmail.send")) { fail(500, "The gmail.send permission wasn't granted."); return finish(1, "The gmail.send permission was not granted. Run this again and tick the permission box."); }
    saveEnvLine(ENV_FILE, "GOOGLE_REFRESH_TOKEN", t.refresh_token);
    res.writeHead(200, { "Content-Type": "text/html" }).end(page("All done ♡", "The refresh token was saved to your server/.env. You can close this tab and go back to the terminal."));
    finish(0, `Saved GOOGLE_REFRESH_TOKEN to ${ENV_FILE} (the token itself is not shown). Next: npm run test:gmail`);
  } catch (e) { fail(500, "Something went wrong."); finish(1, `Couldn't reach Google (${e.name}).`); }
});
function finish(code, msg) { (code ? console.error : console.log)(msg); setTimeout(() => server.close(() => process.exit(code)), 200); }
setTimeout(() => finish(1, "Timed out after 5 minutes. Run it again."), 5 * 60 * 1000).unref();
server.listen(Number(redirect.port) || 80, () => {
  console.log(`1) Open this link in your browser and sign in with the Gmail account that should send the letter:\n\n${authUrl}\n`);
  console.log(`2) Google will send you back to ${REDIRECT} (this window is listening for it).`);
  console.log("   If Google says the app is unverified, choose Advanced -> Go to the app. It only asks to SEND email.\n");
});
