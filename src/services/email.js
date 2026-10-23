// Builds the private email Dhwani's message arrives in. Pure functions, so they are easy to test.
// HTML is table-based with inline CSS (works in Gmail and other mail apps). All user text is escaped.
// The message is always written by Dhwani, so the signature is fixed: "Sent with love, Dhwani ♡".
// (The technical sender in the inbox is whatever GUESTBOOK_FROM_EMAIL is set to; this signature is only text inside the email.)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const SUBJECT = "A little message from Dhwani ♡";
export const SIGNATURE = "Sent with love, Dhwani ♡";

export function buildGuestbookEmail({ message = "", sentAt = new Date() }) {
  const body = String(message).trim(); // trims the ends only; the wording itself is untouched
  const when = `${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(sentAt)} IST`;

  const text = ["One-year-with-mylove · 28.10.2025", "", "A little message for you ♡", "", "Dhwani wrote:", "", body, "", SIGNATURE, "", `Sent privately from your anniversary website · ${when}`].join("\n");

  const serif = "Georgia,'Times New Roman',serif", sans = "Arial,Helvetica,sans-serif";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${esc(SUBJECT)}</title>
<style>
@media (prefers-color-scheme: dark){
 .em-bg{background-color:#2b1d23 !important}.em-card{background-color:#3a2830 !important;border-color:#5f4250 !important}
 .em-msg{background-color:#4b323c !important;border-left-color:#e6a9b6 !important}
 .em-title{color:#f3b9c7 !important}.em-ink{color:#f8e9ed !important}.em-muted{color:#d2b5be !important}
}
@media only screen and (max-width:520px){.em-pad{padding:24px 18px !important}}
</style></head>
<body class="em-bg" style="margin:0;padding:0;background-color:#fdecf0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">A new private message from Dhwani.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-bg" style="background-color:#fdecf0;"><tr><td align="center" style="padding:28px 12px;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-card" style="max-width:560px;background-color:#fffdf8;border:1px solid #ecc9d0;border-radius:6px;">
  <tr><td class="em-pad" style="padding:34px 36px 8px 36px;text-align:center;">
   <div class="em-muted" style="font-family:${sans};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7d5a68;">One-year-with-mylove &nbsp;·&nbsp; 28.10.2025</div>
   <div style="font-family:${serif};font-size:20px;color:#e6a9b6;padding-top:10px;">♡</div>
   <h1 class="em-title" style="margin:6px 0 0 0;font-family:${serif};font-weight:normal;font-size:30px;line-height:1.2;color:#7a2e45;">A little message for you ♡</h1>
  </td></tr>
  <tr><td class="em-pad" style="padding:20px 36px 4px 36px;">
   <p class="em-ink" style="margin:0 0 12px 0;font-family:${serif};font-style:italic;font-size:17px;color:#3a2530;">Dhwani wrote:</p>
   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="em-msg" style="background-color:#fbf0e6;border-left:4px solid #e6a9b6;padding:18px 20px;">
    <div class="em-ink" style="font-family:${serif};font-size:18px;line-height:1.65;color:#3a2530;word-break:break-word;">${esc(body).replace(/\r?\n/g, "<br>")}</div>
   </td></tr></table>
  </td></tr>
  <tr><td class="em-pad" style="padding:22px 36px 8px 36px;">
   <p class="em-title" style="margin:0;font-family:${serif};font-style:italic;font-size:19px;color:#7a2e45;">${esc(SIGNATURE)}</p>
  </td></tr>
  <tr><td class="em-pad" style="padding:20px 36px 30px 36px;text-align:center;">
   <div class="em-muted" style="border-top:1px dashed #e6a9b6;padding-top:14px;font-family:${sans};font-size:12px;line-height:1.5;color:#7d5a68;">Sent privately from your anniversary website<br>${esc(when)}</div>
  </td></tr>
 </table>
</td></tr></table>
</body></html>`;
  return { subject: SUBJECT, html, text };
}

// ---------------------------------------------------------------------------------------------------------------
// The pre-written love letter that goes to Dhwani (HER_EMAIL) through the Gmail API (OAuth 2.0).
// Written in my voice. EDITABLE: keep it to 2 to 5 sentences. It never contains anything she typed in the form.
export const LETTER_SUBJECT = "A little letter for you, bubu ♡";
export const LETTER_SENTENCES = [
  "Hii bubu, this is just a little letter, sent with love.",
  "Happy anniversary, kanna.",
  "Thank you for loving me, for forgiving me, and for putting your own effort into making things for me.",
  "I'm still learning how to be better for you, and I'm grateful you're with me while I do.",
  "I love you soo much bubu.",
];
export const LETTER_SIGNATURE = "With love, Arjun ♡";

export function buildLoveLetter() {
  const text = ["One-year-with-mylove · 28.10.2025", "", "A little letter for you ♡", "", LETTER_SENTENCES.join(" "), "", LETTER_SIGNATURE].join("\n");
  const serif = "Georgia,'Times New Roman',serif", sans = "Arial,Helvetica,sans-serif";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${esc(LETTER_SUBJECT)}</title>
<style>
@media (prefers-color-scheme: dark){
 .em-bg{background-color:#2b1d23 !important}.em-card{background-color:#3a2830 !important;border-color:#5f4250 !important}
 .em-title{color:#f3b9c7 !important}.em-ink{color:#f8e9ed !important}.em-muted{color:#d2b5be !important}
}
@media only screen and (max-width:520px){.em-pad{padding:24px 18px !important}}
</style></head>
<body class="em-bg" style="margin:0;padding:0;background-color:#fde4ea;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">A little letter, sent with love.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-bg" style="background-color:#fde4ea;"><tr><td align="center" style="padding:28px 12px;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-card" style="max-width:560px;background-color:#ffffff;border:1px solid #f4b9c8;border-radius:8px;">
  <tr><td class="em-pad" style="padding:36px 36px 6px 36px;text-align:center;">
   <div class="em-muted" style="font-family:${sans};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7d5a68;">One-year-with-mylove &nbsp;·&nbsp; 28.10.2025</div>
   <div style="font-family:${serif};font-size:22px;color:#e07a98;padding-top:12px;">♡</div>
   <h1 class="em-title" style="margin:6px 0 0 0;font-family:${serif};font-weight:normal;font-size:30px;line-height:1.2;color:#7a2e45;">A little letter for you ♡</h1>
  </td></tr>
  <tr><td class="em-pad" style="padding:22px 36px 6px 36px;">
   <p class="em-ink" style="margin:0;font-family:${serif};font-size:18px;line-height:1.7;color:#3a2530;">${LETTER_SENTENCES.map(esc).join(" ")}</p>
  </td></tr>
  <tr><td class="em-pad" style="padding:18px 36px 8px 36px;">
   <p class="em-title" style="margin:0;font-family:${serif};font-style:italic;font-size:19px;color:#7a2e45;">${esc(LETTER_SIGNATURE)}</p>
  </td></tr>
  <tr><td class="em-pad" style="padding:20px 36px 30px 36px;text-align:center;">
   <div class="em-muted" style="border-top:1px dashed #f0a9bc;padding-top:14px;font-family:${sans};font-size:12px;line-height:1.5;color:#7d5a68;">Sent from your anniversary website</div>
  </td></tr>
 </table>
</td></tr></table>
</body></html>`;
  return { subject: LETTER_SUBJECT, html, text };
}
