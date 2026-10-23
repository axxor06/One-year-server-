import { Router } from "express";
import crypto from "node:crypto";
import { buildGuestbookEmail, buildLoveLetter } from "../services/email.js";
import { sendEmail, isSet } from "../services/mailer.js";
import { sendViaGmail } from "../services/gmail.js";
const router = Router();

// One Send click triggers TWO separate emails, started together and handled independently:
//   message -> GUESTBOOK_TO_EMAIL (me), through Resend            (Dhwani's exact words)
//   letter  -> HER_EMAIL (her), through the Gmail API (OAuth 2.0)   (pre-written, never contains her message)
// Each one ends as: "accepted" (the provider accepted it, which is not proof of inbox delivery), "failed",
// "not_configured" (an env variable is missing), or "skipped" (the browser says it already succeeded earlier).
// Nothing is stored. There is deliberately no GET, so messages can never be read back through the site.
const PLACEHOLDER_HER = ["dhwanis_email_address@example.com", "her_email_address@example.com"];
const missing = (names) => names.filter((n) => !isSet(process.env[n], ...(n === "HER_EMAIL" ? PLACEHOLDER_HER : n === "GUESTBOOK_TO_EMAIL" ? ["you@example.com"] : [])));
const inFlight = new Set(); // stops the same message from the same visitor being processed twice at once

async function deliverMessage(m) {
  const gone = missing(["RESEND_API_KEY", "GUESTBOOK_TO_EMAIL", "GUESTBOOK_FROM_EMAIL"]);
  if (gone.length) { console.error(`Message email not sent: missing ${gone.join(", ")}`); return "not_configured"; } // names only, never values
  const r = await sendEmail({ label: "message", to: process.env.GUESTBOOK_TO_EMAIL, ...buildGuestbookEmail({ message: m }) });
  return r.ok ? "accepted" : "failed";
}
async function deliverLetter() {
  const gone = missing(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "GMAIL_USER", "HER_EMAIL"]);
  if (gone.length) { console.error(`Letter not sent: missing ${gone.join(", ")}`); return "not_configured"; }
  const r = await sendViaGmail({ to: process.env.HER_EMAIL, ...buildLoveLetter() });
  return r.ok ? "accepted" : "failed";
}

router.post("/", async (req, res, next) => {
  let key;
  try {
    const { message = "", website = "", skip } = req.body || {}; // no name or email field: the sender is always Dhwani
    if (website) return res.status(201).json({ ok: true, message: "skipped", letter: "skipped" }); // honeypot: bots fill this hidden field
    if (typeof message !== "string") return res.status(400).json({ error: "Invalid input." });
    const m = message.trim();
    if (m.length < 2 || m.length > 2000) return res.status(400).json({ error: "Message must be 2 to 2000 characters." });

    key = `${req.ip}|${crypto.createHash("sha256").update(m).digest("hex")}`;
    if (inFlight.has(key)) return res.status(409).json({ error: "That's already being sent. One moment…" });
    inFlight.add(key);

    // `skip` only ever SUPPRESSES a send that already succeeded on an earlier attempt, so a retry can't duplicate it.
    // The browser never supplies addresses or credentials; those come from the server's environment.
    const [msg, letter] = await Promise.all([
      skip?.message === true ? "skipped" : deliverMessage(m),
      skip?.letter === true ? "skipped" : deliverLetter(),
    ]);
    const good = (s) => s === "accepted" || s === "skipped";
    const fails = [msg, letter].filter((s) => !good(s)), wins = [msg, letter].filter(good);
    const code = !fails.length ? 201 : wins.length ? 207 : [msg, letter].includes("not_configured") ? 503 : 502;
    res.status(code).json({ ok: !fails.length, message: msg, letter,
      ...(code >= 500 && { error: code === 503 ? "Email isn't set up yet, so nothing was sent." : "Neither email could be sent just now. Please try again." }) });
  } catch (e) { next(e); }
  finally { if (key) inFlight.delete(key); }
});
export default router;
