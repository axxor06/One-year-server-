
 // The one place that talks to Resend.
// Returns { ok: true } or { ok: false, reason } and never throws.
// Never logs email content or API keys.

export async function sendEmail({ label, to, subject, html, text }) {
  const { RESEND_API_KEY, GUESTBOOK_FROM_EMAIL } = process.env;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: GUESTBOOK_FROM_EMAIL,
        to: [to],
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) {
      const error = await r.text();
      console.error(`Resend error (${r.status}): ${error}`);
      return { ok: false, reason: "refused" };
    }

    const data = await r.json();
    console.log(`Resend accepted the "${label}" email:`, data.id);

    return { ok: true };
  } catch (e) {
    console.error(
      `Resend unreachable for the "${label}" email (${e.name})`
    );
    return { ok: false, reason: "unreachable" };
  }
}

// A value counts as not configured if empty or still a placeholder.
export const isSet = (v, ...placeholders) =>
  Boolean(v) &&
  !String(v).startsWith("your_") &&
  !placeholders.includes(String(v).trim());

/**
 * Sends Dhwani's pre-written love letter through Brevo.
 * All credentials remain on the server.
 * Never logs the letter's content or API key.
 */
export async function sendViaBrevo({ to, subject, html, text }) {
  const {
    BREVO_API_KEY,
    BREVO_FROM_EMAIL,
    BREVO_FROM_NAME = "Arjun",
  } = process.env;

  try {
    console.log("Attempting love-letter request to Brevo.");

    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_FROM_NAME,
          email: BREVO_FROM_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const responseText = await r.text();

    if (!r.ok) {
      console.error(
        `Brevo error (${r.status}): ${responseText}`
      );

      return { ok: false, reason: "refused" };
    }

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      // Brevo accepted the request, even if its response wasn't JSON.
    }

    console.log(
      "Brevo accepted the love letter.",
      data.messageId ? `Message ID: ${data.messageId}` : ""
    );

    return {
      ok: true,
      messageId: data.messageId || null,
    };
  } catch (e) {
    console.error(
      `Brevo request failed (${e.name}): ${e.message}`
    );

    return { ok: false, reason: "unreachable" };
  }
}
