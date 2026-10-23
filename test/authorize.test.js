// Runs scripts/gmail-authorize.js as a real child process against a FAKE Google, in a temp folder. No real Google involved.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../scripts/gmail-authorize.js");
const freePort = () => new Promise((r) => { const s = http.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });

async function run({ googleReply, wrongStateFirst = false }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "auth-")), envFile = path.join(dir, ".env");
  fs.writeFileSync(envFile, "RESEND_API_KEY=keep-me\nGOOGLE_REFRESH_TOKEN=old-token\nHER_EMAIL=keep@me.test\n");
  let challenge = "", tokenReq = null;
  const fake = http.createServer((req, res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { tokenReq = Object.fromEntries(new URLSearchParams(b)); res.writeHead(googleReply.status, { "Content-Type": "application/json" }).end(JSON.stringify(googleReply.body)); }); });
  await new Promise((r) => fake.listen(0, "127.0.0.1", r));
  const port = await freePort(), redirect = `http://localhost:${port}/oauth2callback`;
  const child = spawn(process.execPath, [script, "--env", envFile], { env: { PATH: process.env.PATH, GOOGLE_CLIENT_ID: "test-id", GOOGLE_CLIENT_SECRET: "test-secret", GOOGLE_REDIRECT_URI: redirect, GOOGLE_OAUTH_TOKEN_URL: `http://127.0.0.1:${fake.address().port}/token` } });
  let out = "", err = ""; child.stdout.on("data", (d) => (out += d)); child.stderr.on("data", (d) => (err += d));
  const url = await new Promise((resolve, reject) => { const t = setInterval(() => { const m = out.match(/https:\/\/accounts\.google\.com\/\S+/); if (m) { clearInterval(t); resolve(new URL(m[0])); } }, 30); setTimeout(() => reject(new Error("no auth link: " + err)), 5000); });
  const q = url.searchParams, state = q.get("state"); challenge = q.get("code_challenge");
  let wrong; if (wrongStateFirst) wrong = (await fetch(`${redirect}?state=evil&code=x`)).status;
  const cb = await fetch(`${redirect}?state=${state}&code=the-code`);
  const code = await new Promise((r) => child.on("exit", r));
  fake.close(); return { url, q, wrong, cbStatus: cb.status, code, out, err, tokenReq, challenge, envFile, env: fs.readFileSync(envFile, "utf8") };
}
const ok = { status: 200, body: { access_token: "a", refresh_token: "FAKE-REFRESH-TOKEN", scope: "https://www.googleapis.com/auth/gmail.send", expires_in: 3599 } };

test("authorize: correct Google link, state check, PKCE, saves ONLY the token line, never prints the token", async () => {
  const r = await run({ googleReply: ok, wrongStateFirst: true });
  assert.equal(r.url.origin + r.url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(r.q.get("scope"), "https://www.googleapis.com/auth/gmail.send"); assert.equal(r.q.get("access_type"), "offline"); assert.equal(r.q.get("prompt"), "consent"); assert.equal(r.q.get("code_challenge_method"), "S256"); assert.equal(r.q.get("client_id"), "test-id");
  assert.match(r.q.get("redirect_uri"), /^http:\/\/localhost:\d+\/oauth2callback$/);
  assert.equal(r.wrong, 400);                        // a callback with the wrong state is rejected
  assert.equal(r.cbStatus, 200); assert.equal(r.code, 0);
  assert.equal(r.tokenReq.grant_type, "authorization_code"); assert.equal(r.tokenReq.code, "the-code"); assert.equal(r.tokenReq.client_secret, "test-secret"); assert.equal(r.tokenReq.redirect_uri, r.q.get("redirect_uri"));
  assert.equal(crypto.createHash("sha256").update(r.tokenReq.code_verifier).digest("base64url"), r.challenge); // PKCE verifier matches the challenge
  assert.equal(r.env, "RESEND_API_KEY=keep-me\nGOOGLE_REFRESH_TOKEN=FAKE-REFRESH-TOKEN\nHER_EMAIL=keep@me.test\n"); // one line replaced, nothing else touched
  assert.ok(!r.out.includes("FAKE-REFRESH-TOKEN") && !r.err.includes("FAKE-REFRESH-TOKEN"));
});
test("authorize: no refresh token from Google -> clear failure, .env untouched", async () => {
  const r = await run({ googleReply: { status: 200, body: { access_token: "a", scope: "https://www.googleapis.com/auth/gmail.send" } } });
  assert.equal(r.code, 1); assert.match(r.err, /refresh token/i); assert.ok(r.env.includes("old-token"));
});
test("authorize: gmail.send not granted -> failure, .env untouched", async () => {
  const r = await run({ googleReply: { status: 200, body: { access_token: "a", refresh_token: "FAKE-REFRESH-TOKEN", scope: "openid" } } });
  assert.equal(r.code, 1); assert.match(r.err, /gmail\.send/); assert.ok(!r.env.includes("FAKE-REFRESH-TOKEN"));
});
