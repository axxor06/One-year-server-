// Sends ONE real test email using your server/.env, to check Resend is set up. Run: npm run test:email
import "dotenv/config";
const { RESEND_API_KEY, GUESTBOOK_TO_EMAIL, GUESTBOOK_FROM_EMAIL } = process.env;
if (!RESEND_API_KEY || RESEND_API_KEY.startsWith("your_") || !GUESTBOOK_TO_EMAIL || !GUESTBOOK_FROM_EMAIL) { console.error("Fill in server/.env first (copy .env.example)."); process.exit(1); }
import { buildGuestbookEmail } from "../src/services/email.js";
// Default: the plain test email. --letter: a sample of the message email. (The love letter to Dhwani uses Gmail: see check-gmail.js / npm run test:gmail.)
const letter = process.argv.includes("--letter");
const mail = letter ? buildGuestbookEmail({ message: "Hii baby. This is only a sample message, so you can see how the real ones will look.\n\nI love you soo much bubu." })
  : { subject: "Test from One-year-with-mylove", text: "If you can read this, email sending works." };
const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: GUESTBOOK_FROM_EMAIL, to: [GUESTBOOK_TO_EMAIL], ...mail }) });
console.log(r.ok ? "Sent. Check your inbox (and spam)." : `Failed (${r.status}): ${await r.text()}`);
process.exit(r.ok ? 0 : 1);
