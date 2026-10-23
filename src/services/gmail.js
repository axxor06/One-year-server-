// Sends the pre-written love letter to Dhwani through the GMAIL API (OAuth 2.0, over HTTPS). No SMTP is used.
//   1) trade the long-lived GOOGLE_REFRESH_TOKEN for a short-lived access token (cached until shortly before it expires)
//   2) POST the finished email to Gmail's users.messages.send
// nodemailer is used ONLY to build the email text (headers, HTML + plain-text parts); it connects to nothing.
// Secrets live in the server's environment only. Logs contain only error codes / HTTP statuses, never tokens or content.
import nodemailer from "nodemailer";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

let cache = null, pending = null;
export const __resetTokenCache = () => { cache = null; pending = null; }; // for tests

async function getAccessToken(force = false) {
  if (!force && cache && Date.now() < cache.expires - 60_000) return cache.token;
  if (!force && pending) return pending; // several sends at once share one token request
  pending = (async () => {
    const r = await fetch(TOKEN_URL, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: "refresh_token" }),
      signal: AbortSignal.timeout(10000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) { const e = new Error("token"); e.code = j.error || `http_${r.status}`; throw e; }
    cache = { token: j.access_token, expires: Date.now() + (j.expires_in || 3600) * 1000 };
    return cache.token;
  })().finally(() => { pending = null; });
  return pending;
}

async function buildRaw({ from, to, subject, html, text }) {
  const builder = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" }); // builds the message, sends nothing
  const info = await builder.sendMail({ from, to, subject, html, text });
  return info.message.toString("base64url"); // Gmail wants the whole message base64url-encoded
}

export async function sendViaGmail({ to, subject, html, text }) {
  try {
    const raw = await buildRaw({ from: process.env.GMAIL_USER, to, subject, html, text });
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await getAccessToken(attempt === 1);
      const r = await fetch(SEND_URL, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ raw }), signal: AbortSignal.timeout(15000) });
      if (r.status === 401 && attempt === 0) continue; // expired access token: nothing was sent, so one fresh try is safe
      if (!r.ok) { console.error(`Gmail API refused the letter (HTTP ${r.status})`); return { ok: false, reason: "refused" }; }
      return { ok: true }; // Gmail accepted it. That is not proof it reached her inbox.
    }
  } catch (e) {
    if (e.message === "token") { console.error(`Google would not issue an access token (${e.code}). If it says invalid_grant, run "npm run gmail:authorize" again.`); return { ok: false, reason: "auth" }; }
    console.error(`Gmail API unreachable (${e.name})`); return { ok: false, reason: "unreachable" };
  }
}
