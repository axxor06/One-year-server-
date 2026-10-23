// The one place that talks to Resend. Returns { ok: true } or { ok: false, reason } and never throws,
// and never logs the email's content (only which email and the HTTP status).
export async function sendEmail({ label, to, subject, html, text }) {
  const { RESEND_API_KEY, GUESTBOOK_FROM_EMAIL } = process.env;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: GUESTBOOK_FROM_EMAIL, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) { console.error(`Resend refused the "${label}" email (HTTP ${r.status})`); return { ok: false, reason: "refused" }; }
    return { ok: true }; // accepted by Resend. That is not proof it reached an inbox.
  } catch (e) { console.error(`Resend unreachable for the "${label}" email (${e.name})`); return { ok: false, reason: "unreachable" }; }
}

// A value counts as "not configured" if it is empty or still the placeholder from .env.example.
export const isSet = (v, ...placeholders) => Boolean(v) && !String(v).startsWith("your_") && !placeholders.includes(String(v).trim());


/**
 * Send Dhwani's pre-written love letter through Brevo's transactional email API.
 * Uses only server-side environment variables; never logs message content or secrets.
 */
export async function sendViaBrevo({ to, subject, html, text }) {
  const { BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME = "Arjun" } = process.env;
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) {
      console.error(`Brevo refused the love-letter email (HTTP ${r.status})`);
      return { ok: false, reason: "refused" };
    }
    return { ok: true }; // accepted by Brevo; not proof it reached the inbox
  } catch (e) {
    console.error(`Brevo unreachable for the love-letter email (${e.name})`);
    return { ok: false, reason: "unreachable" };
  }
}
