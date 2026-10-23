// MANUAL TEST for the Gmail API letter. This sends a REAL email, so run it only after filling in server/.env
// and running "npm run gmail:authorize".
//   npm run test:gmail                    -> sends the letter to YOUR OWN address (GMAIL_USER)
//   npm run test:gmail -- --send-to-her   -> sends the real letter to HER_EMAIL (she will receive it!)
import "dotenv/config";
import { sendViaGmail } from "../src/services/gmail.js";
import { buildLoveLetter } from "../src/services/email.js";
const e = process.env, bad = (v, ...ph) => !v || v.startsWith("your_") || ph.includes(v);
const toHer = process.argv.includes("--send-to-her");
const need = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "GMAIL_USER"].filter((k) => bad(e[k]));
if (toHer && bad(e.HER_EMAIL, "dhwanis_email_address@example.com")) need.push("HER_EMAIL");
if (need.length) { console.error(`Fill in these in server/.env first: ${need.join(", ")}  (run "npm run gmail:authorize" to get GOOGLE_REFRESH_TOKEN)`); process.exit(1); }
const r = await sendViaGmail({ to: toHer ? e.HER_EMAIL : e.GMAIL_USER, ...buildLoveLetter() });
console.log(r.ok ? (toHer ? "Letter accepted by Gmail for HER_EMAIL. Ask her to check her inbox and spam." : "Letter accepted by Gmail and sent to your own address. Check your inbox and spam.")
  : r.reason === "auth" ? "Google refused the credentials. Run \"npm run gmail:authorize\" again and check the Client ID/Secret."
  : `Failed (${r.reason}). See the message above, and check your internet connection and server/.env.`);
process.exit(r.ok ? 0 : 1);
