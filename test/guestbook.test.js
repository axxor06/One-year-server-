// Run with: npm test (in server/). Resend and the Gmail API (token + send) are both FAKED over fetch: nothing real is sent.
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
process.env.GUESTBOOK_RATE_LIMIT = "1000";
const realFetch = globalThis.fetch;
let resendPlan = [], gmailPlan = [], resendCalls = [], gmailCalls = [], tokenCalls = [], delay = 0, server, base;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (u.includes("api.resend.com")) { resendCalls.push(JSON.parse(opts.body)); if (delay) await wait(delay); const w = resendPlan.shift() || "ok"; if (w === "throw") throw new Error("network"); return new Response("{}", { status: w === "ok" ? 200 : 422 }); }
  if (u === "https://oauth2.googleapis.com/token") {            // fake Google token endpoint
    tokenCalls.push(Object.fromEntries(new URLSearchParams(opts.body)));
    if (gmailPlan[0] === "authfail") { gmailPlan.shift(); return json({ error: "invalid_grant", error_description: "secret-detail" }, 400); }
    return json({ access_token: "fake-access-token", expires_in: 3599, token_type: "Bearer" });
  }
  if (u === "https://gmail.googleapis.com/gmail/v1/users/me/messages/send") {   // fake Gmail API
    gmailCalls.push({ auth: opts.headers.Authorization, raw: JSON.parse(opts.body).raw }); if (delay) await wait(delay);
    const w = gmailPlan.shift() || "ok"; if (w === "throw") throw new Error("network");
    return w === "ok" ? json({ id: "abc", threadId: "t" }) : json({ error: { message: "secret-detail" } }, 500);
  }
  return realFetch(url, opts);
};
const { __resetTokenCache } = await import("../src/services/gmail.js");
const { default: app } = await import("../src/app.js");
before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; r(); }); }));
after(() => server.close());
const post = (body) => realFetch(`${base}/api/guestbook`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const ENV = { RESEND_API_KEY: "re_test", GUESTBOOK_TO_EMAIL: "arjun@inbox.test", GUESTBOOK_FROM_EMAIL: "onboarding@resend.dev", GOOGLE_CLIENT_ID: "cid.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "csecret-xyz", GOOGLE_REFRESH_TOKEN: "rtoken-abc", GMAIL_USER: "arjun.sender@gmail.test", HER_EMAIL: "dhwani@inbox.test" };
const KEYS = Object.keys(ENV);
const configure = (over = {}) => { for (const k of KEYS) delete process.env[k]; Object.assign(process.env, ENV, over); for (const k of KEYS) if (process.env[k] === "undefined") delete process.env[k]; };
beforeEach(() => { resendPlan = []; gmailPlan = []; resendCalls = []; gmailCalls = []; tokenCalls = []; delay = 0; __resetTokenCache(); configure(); });
const res = async (r) => ({ status: r.status, ...(await r.json()) });

// decode what was actually handed to Gmail: headers + both body parts
function decode(rawB64) {
  const raw = Buffer.from(rawB64, "base64url").toString("utf8"), [head, ...rest] = raw.split("\n\n"), body = rest.join("\n\n");
  const hdr = (n) => (head.replace(/\n[ \t]+/g, " ").match(new RegExp(`^${n}: (.*)$`, "mi")) || [])[1] || "";
  const word = (s) => s.replace(/=\?UTF-8\?([BQ])\?([^?]*)\?=\s*/gi, (_, e, d) => e.toUpperCase() === "B" ? Buffer.from(d, "base64").toString("utf8") : Buffer.from(d.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (_m, h) => String.fromCharCode(parseInt(h, 16))), "latin1").toString("utf8"));
  const boundary = (head.match(/boundary="?([^"\n;]+)"?/) || [])[1], parts = {};
  for (const p of body.split("--" + boundary)) { const [ph, ...pb] = p.trim().split("\n\n"); const ct = (ph.match(/Content-Type: ([^;\n]+)/i) || [])[1], enc = (ph.match(/Content-Transfer-Encoding: (\S+)/i) || [])[1] || "7bit"; if (!ct) continue;
    let b = pb.join("\n\n"); b = enc === "base64" ? Buffer.from(b, "base64").toString("utf8") : enc === "quoted-printable" ? Buffer.from(b.replace(/=\n/g, "").replace(/=([0-9A-F]{2})/gi, (_m, h) => String.fromCharCode(parseInt(h, 16))), "latin1").toString("utf8") : b; parts[ct.toLowerCase()] = b; }
  return { from: hdr("From"), to: hdr("To"), subject: word(hdr("Subject")), text: parts["text/plain"] || "", html: parts["text/html"] || "" };
}

test("ONE click: message to me via Resend, letter to her via the Gmail API (OAuth, no SMTP)", async () => {
  const r = await res(await post({ message: "ZZ-marker <b>baby</b> & stuff" }));
  assert.equal(r.status, 201); assert.equal(r.ok, true); assert.equal(r.message, "accepted"); assert.equal(r.letter, "accepted");
  assert.equal(resendCalls.length, 1); assert.equal(gmailCalls.length, 1);
  assert.deepEqual(resendCalls[0].to, ["arjun@inbox.test"]); assert.equal(resendCalls[0].from, "onboarding@resend.dev");
  assert.ok(resendCalls[0].text.includes("ZZ-marker <b>baby</b> & stuff") && resendCalls[0].html.includes("ZZ-marker &lt;b&gt;baby&lt;/b&gt; &amp; stuff") && !resendCalls[0].html.includes("<b>baby"));
  assert.equal(gmailCalls[0].auth, "Bearer fake-access-token");
  const m = decode(gmailCalls[0].raw);
  assert.ok(m.to.includes("dhwani@inbox.test")); assert.ok(m.from.includes("arjun.sender@gmail.test")); assert.equal(m.subject, "A little letter for you, bubu ♡");
  assert.ok(m.html.includes("A little letter for you") && m.text.includes("sent with love") && m.text.includes("With love, Arjun ♡"));
  assert.ok(!m.text.includes("ZZ-marker") && !m.html.includes("ZZ-marker") && !m.html.includes("stuff")); // her message never goes into the letter
});
test("the token exchange uses the refresh token and the client credentials from the server environment", async () => {
  await post({ message: "hi" }); assert.equal(tokenCalls.length, 1);
  assert.deepEqual(tokenCalls[0], { client_id: "cid.apps.googleusercontent.com", client_secret: "csecret-xyz", refresh_token: "rtoken-abc", grant_type: "refresh_token" });
});
test("the access token is cached: two letters, one token request", async () => { await post({ message: "one" }); await post({ message: "two" }); assert.equal(gmailCalls.length, 2); assert.equal(tokenCalls.length, 1); });
test("validation: empty, whitespace, too long, wrong type -> 400 and NOTHING is sent", async () => {
  for (const b of [{ message: "" }, { message: "   " }, { message: "a".repeat(2001) }, { message: { x: 1 } }, {}]) assert.equal((await post(b)).status, 400);
  assert.equal(resendCalls.length + gmailCalls.length + tokenCalls.length, 0);
});
test("exactly 2000 characters is accepted", async () => assert.equal((await post({ message: "a".repeat(2000) })).status, 201));
test("message fails, letter works -> 207, reported accurately, nothing retried", async () => {
  resendPlan = ["reject"]; const r = await res(await post({ message: "hi" }));
  assert.equal(r.status, 207); assert.equal(r.ok, false); assert.equal(r.message, "failed"); assert.equal(r.letter, "accepted"); assert.equal(resendCalls.length, 1); assert.equal(gmailCalls.length, 1);
});
test("letter fails (Gmail API error), message works -> 207, reported accurately, nothing retried", async () => {
  gmailPlan = ["fail"]; const r = await res(await post({ message: "hi" }));
  assert.equal(r.status, 207); assert.equal(r.message, "accepted"); assert.equal(r.letter, "failed"); assert.equal(resendCalls.length, 1); assert.equal(gmailCalls.length, 1);
});
test("Google refuses the refresh token (invalid_grant) -> letter 'failed', no send attempted", async () => {
  gmailPlan = ["authfail"]; const r = await res(await post({ message: "hi" })); assert.equal(r.status, 207); assert.equal(r.message, "accepted"); assert.equal(r.letter, "failed"); assert.equal(gmailCalls.length, 0);
});
test("Resend unreachable and Gmail unreachable -> 502, both reported failed", async () => {
  resendPlan = ["throw"]; gmailPlan = ["throw"]; const r = await res(await post({ message: "hi" }));
  assert.equal(r.status, 502); assert.equal(r.message, "failed"); assert.equal(r.letter, "failed"); assert.match(r.error, /Neither email/);
});
test("a retry only sends what failed: skip.message / skip.letter prevent duplicates", async () => {
  let r = await res(await post({ message: "hi", skip: { message: true } })); assert.equal(r.status, 201); assert.equal(r.message, "skipped"); assert.equal(resendCalls.length, 0); assert.equal(gmailCalls.length, 1);
  resendCalls = []; gmailCalls = [];
  r = await res(await post({ message: "hi", skip: { letter: true } })); assert.equal(r.status, 201); assert.equal(r.letter, "skipped"); assert.equal(resendCalls.length, 1); assert.equal(gmailCalls.length, 0);
});
test("full retry story: letter fails first, second Send retries only the letter", async () => {
  gmailPlan = ["fail", "ok"]; const a = await res(await post({ message: "hi" })); assert.equal(a.letter, "failed");
  const b = await res(await post({ message: "hi", skip: { message: a.message === "accepted" } })); assert.equal(b.status, 201); assert.equal(resendCalls.length, 1); assert.equal(gmailCalls.length, 2);
});
test("any missing Google setting -> letter 'not_configured', message still sent, no secrets in the response", async () => {
  for (const key of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "GMAIL_USER", "HER_EMAIL"]) {
    resendCalls = []; gmailCalls = []; tokenCalls = []; configure({ [key]: "undefined" });
    const t = await (await post({ message: "hi" })).text(), r = JSON.parse(t);
    assert.equal(r.letter, "not_configured", key); assert.equal(r.message, "accepted"); assert.equal(gmailCalls.length + tokenCalls.length, 0); assert.equal(resendCalls.length, 1);
    for (const s of ["csecret", "rtoken", "cid.apps", "arjun.sender", "dhwani@", key]) assert.ok(!t.includes(s), s);
  }
});
test("placeholder values from .env.example count as not configured", async () => {
  for (const o of [{ GOOGLE_REFRESH_TOKEN: "your_refresh_token_from_gmail_authorize" }, { GOOGLE_CLIENT_ID: "your_google_client_id.apps.googleusercontent.com" }, { HER_EMAIL: "dhwanis_email_address@example.com" }, { GMAIL_USER: "your_gmail_address@gmail.com" }]) {
    gmailCalls = []; configure(o); assert.equal((await res(await post({ message: "hi" }))).letter, "not_configured"); assert.equal(gmailCalls.length, 0);
  }
});
test("Resend not configured -> message 'not_configured', letter still sent", async () => {
  configure({ RESEND_API_KEY: "your_resend_api_key_here" }); const r = await res(await post({ message: "hi" }));
  assert.equal(r.status, 207); assert.equal(r.message, "not_configured"); assert.equal(r.letter, "accepted"); assert.equal(resendCalls.length, 0);
});
test("nothing configured at all -> 503 with a clear message, nothing sent", async () => {
  for (const k of KEYS) delete process.env[k]; const r = await res(await post({ message: "hi" }));
  assert.equal(r.status, 503); assert.match(r.error, /isn't set up/); assert.equal(resendCalls.length + gmailCalls.length + tokenCalls.length, 0);
});
test("duplicate submission at the same moment is stopped: 2 emails total, not 4", async () => {
  delay = 120; const [a, b] = await Promise.all([post({ message: "same words" }), post({ message: "same words" })]);
  assert.deepEqual([a.status, b.status].sort(), [201, 409]); assert.equal(resendCalls.length, 1); assert.equal(gmailCalls.length, 1);
});
test("no addresses, keys, tokens or Google error details ever appear in any response", async () => {
  const plans = [[[], []], [["reject"], ["fail"]], [["throw"], ["authfail"]], [[], ["throw"]]];
  for (const [rp, gp] of plans) { __resetTokenCache(); resendPlan = [...rp]; gmailPlan = [...gp]; const t = await (await post({ message: "hi" })).text();
    for (const s of ["arjun@inbox.test", "dhwani@inbox.test", "arjun.sender", "re_test", "csecret", "rtoken", "fake-access-token", "secret-detail", "invalid_grant"]) assert.ok(!t.includes(s), s); }
});
test("honeypot is silently dropped, nothing sent", async () => { const r = await post({ message: "buy now", website: "spam.com" }); assert.equal(r.status, 201); assert.equal(resendCalls.length + gmailCalls.length, 0); });
test("no way to read messages", async () => { for (const p of ["/api/guestbook", "/api/messages", "/api/admin"]) assert.equal((await realFetch(base + p)).status, 404); });
