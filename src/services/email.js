
 // Builds the private email Dhwani's message arrives in.
// HTML is table-based with inline CSS for email compatibility.
// All user-provided text is escaped.

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

export const SUBJECT = "A little message from Dhwani ♡";
export const SIGNATURE = "Sent with love, Dhwani ♡";

export function buildGuestbookEmail({ message = "", sentAt = new Date() }) {
  const body = String(message).trim();

  const when = `${new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(sentAt)} IST`;

  const text = [
    "One-year-with-mylove · 28.10.2025",
    "",
    "A little message for you ♡",
    "",
    "Dhwani wrote:",
    "",
    body,
    "",
    SIGNATURE,
    "",
    `Sent privately from your anniversary website · ${when}`,
  ].join("\n");

  const serif = "Georgia,'Times New Roman',serif";
  const sans = "Arial,Helvetica,sans-serif";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(SUBJECT)}</title>
<style>
@media (prefers-color-scheme: dark) {
  .em-bg { background-color:#2b1d23 !important; }
  .em-card { background-color:#3a2830 !important; border-color:#5f4250 !important; }
  .em-msg { background-color:#4b323c !important; border-left-color:#e6a9b6 !important; }
  .em-title { color:#f3b9c7 !important; }
  .em-ink { color:#f8e9ed !important; }
  .em-muted { color:#d2b5be !important; }
}
@media only screen and (max-width:520px) {
  .em-pad { padding:24px 18px !important; }
}
</style>
</head>
<body class="em-bg" style="margin:0;padding:0;background-color:#fdecf0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
A new private message from Dhwani.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
 class="em-bg" style="background-color:#fdecf0;">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
 class="em-card" style="max-width:560px;background-color:#fffdf8;border:1px solid #ecc9d0;border-radius:6px;">
<tr><td class="em-pad" style="padding:34px 36px 8px;text-align:center;">
<div class="em-muted" style="font-family:${sans};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7d5a68;">
One-year-with-mylove &nbsp;·&nbsp; 28.10.2025
</div>
<div style="font-family:${serif};font-size:20px;color:#e6a9b6;padding-top:10px;">♡</div>
<h1 class="em-title" style="margin:6px 0 0;font-family:${serif};font-weight:normal;font-size:30px;line-height:1.2;color:#7a2e45;">
A little message for you ♡
</h1>
</td></tr>
<tr><td class="em-pad" style="padding:20px 36px 4px;">
<p class="em-ink" style="margin:0 0 12px;font-family:${serif};font-style:italic;font-size:17px;color:#3a2530;">
Dhwani wrote:
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td class="em-msg" style="background-color:#fbf0e6;border-left:4px solid #e6a9b6;padding:18px 20px;">
<div class="em-ink" style="font-family:${serif};font-size:18px;line-height:1.65;color:#3a2530;word-break:break-word;">
${esc(body).replace(/\r?\n/g, "<br>")}
</div>
</td></tr>
</table>
</td></tr>
<tr><td class="em-pad" style="padding:22px 36px 8px;">
<p class="em-title" style="margin:0;font-family:${serif};font-style:italic;font-size:19px;color:#7a2e45;">
${esc(SIGNATURE)}
</p>
</td></tr>
<tr><td class="em-pad" style="padding:20px 36px 30px;text-align:center;">
<div class="em-muted" style="border-top:1px dashed #e6a9b6;padding-top:14px;font-family:${sans};font-size:12px;line-height:1.5;color:#7d5a68;">
Sent privately from your anniversary website<br>${esc(when)}
</div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject: SUBJECT, html, text };
}

// ------------------------------------------------------------
// The pre-written love letter sent to Dhwani through Brevo.
// Edit the subject, sentences and signature here.
// ------------------------------------------------------------

export const LETTER_SUBJECT = "A little letter for you, bubu ♡";

export const LETTER_SENTENCES = [
  "Hii bubu, I just wanted to remind you how incredibly special you are to me and how much you mean to my life. Sometimes I wish I could put everything I feel for you into words, but even the longest letter wouldn't be enough to explain how much I love you.",

  "You have become such a beautiful part of my everyday life, and even the smallest things remind me of you. I love talking to you, laughing with you, sharing my thoughts with you, and knowing that somewhere in this big world, I have you. Even with all the distance between us, you still feel so close to my heart.",

  "Thank you for loving me, for being patient with me, for forgiving me when I make mistakes, and for putting your own effort into us. I know I'm not perfect, and I know there are things I still need to learn, but I genuinely want to keep growing and becoming someone who makes you feel loved, valued, safe, and appreciated.",

  "I want us to keep making memories together, having our little moments, going on more dates, holding hands, hugging for a little longer, and collecting all those simple memories that become special just because they're with you. I want to be there for your happy days and your difficult ones too, to listen to you, support you, and remind you that you don't have to face everything alone.",

  "No matter how difficult a day gets, I want us to remember why we chose each other and to keep trying, understanding, and growing together. I can't promise that every day will be perfect, but I can promise that my love for you is real, that I'll keep putting effort into us, and that I'll keep choosing you with my whole heart. I love you soo much, bubu, more than I can properly explain, and I will never ever leave you."
];

export const LETTER_SIGNATURE = "With love, Arjun ♡";

export function buildLoveLetter() {
  const text = [
    "One-year-with-mylove · 28.10.2025",
    "",
    "A little letter for you ♡",
    "",
    ...LETTER_SENTENCES,
    "",
    LETTER_SIGNATURE,
  ].join("\n\n");

  const serif = "Georgia,'Times New Roman',serif";
  const sans = "Arial,Helvetica,sans-serif";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(LETTER_SUBJECT)}</title>
<style>
@media (prefers-color-scheme: dark) {
  .em-bg { background-color:#2b1d23 !important; }
  .em-card { background-color:#3a2830 !important; border-color:#5f4250 !important; }
  .em-title { color:#f3b9c7 !important; }
  .em-ink { color:#f8e9ed !important; }
  .em-muted { color:#d2b5be !important; }
}
@media only screen and (max-width:520px) {
  .em-pad { padding:24px 18px !important; }
}
</style>
</head>
<body class="em-bg" style="margin:0;padding:0;background-color:#fde4ea;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
A little love letter, written just for you. ♡
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
 class="em-bg" style="background-color:#fde4ea;">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
 class="em-card" style="max-width:560px;background-color:#ffffff;border:1px solid #f4b9c8;border-radius:8px;">

<tr><td class="em-pad" style="padding:36px 36px 10px;text-align:center;">
<div class="em-muted" style="font-family:${sans};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7d5a68;">
One-year-with-mylove &nbsp;·&nbsp; 28.10.2025
</div>
<div style="font-family:${serif};font-size:22px;color:#e07a98;padding-top:12px;">♡</div>
<h1 class="em-title" style="margin:6px 0 0;font-family:${serif};font-weight:normal;font-size:30px;line-height:1.3;color:#7a2e45;">
A little letter for you ♡
</h1>
<p class="em-muted" style="margin:12px 0 0;font-family:${sans};font-size:13px;line-height:1.6;color:#9a7180;">
A few words from my heart to yours
</p>
</td></tr>

<tr><td class="em-pad" style="padding:20px 36px 10px;">
<div style="height:1px;background-color:#f3d5dd;font-size:1px;line-height:1px;">&nbsp;</div>
</td></tr>

<tr><td class="em-pad" style="padding:10px 36px 12px;">
<p class="em-ink" style="margin:0 0 18px;font-family:${serif};font-size:17px;line-height:1.8;color:#49303a;">
${LETTER_SENTENCES.map((sentence) =>
  `<span style="display:block;margin:0 0 17px;">${esc(sentence)}</span>`
).join("")}
</p>
</td></tr>

<tr><td class="em-pad" style="padding:4px 36px 12px;">
<div style="text-align:center;font-family:${serif};font-size:20px;color:#e07a98;letter-spacing:7px;">
♡ &nbsp; ♡ &nbsp; ♡
</div>
</td></tr>

<tr><td class="em-pad" style="padding:12px 36px 12px;">
<p class="em-title" style="margin:0;font-family:${serif};font-style:italic;font-size:22px;line-height:1.6;color:#7a2e45;">
${esc(LETTER_SIGNATURE)}
</p>
</td></tr>

<tr><td class="em-pad" style="padding:20px 36px 30px;text-align:center;">
<div class="em-muted" style="border-top:1px dashed #f0a9bc;padding-top:16px;font-family:${sans};font-size:12px;line-height:1.7;color:#9a7180;">
Made with love, just for you ♡<br>
One-year-with-mylove · 28.10.2025
</div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return {
    subject: LETTER_SUBJECT,
    html,
    text,
  };
}
