import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGuestbookEmail } from "../src/services/email.js";
const at = new Date("2026-10-20T13:00:00Z");

test("subject is personal", () => assert.equal(buildGuestbookEmail({ message: "hi", sentAt: at }).subject, "A little message from Dhwani ♡"));
test("html: heading, 'Dhwani wrote:', her exact message, exact signature, dark-mode styles, table layout, no scripts", () => {
  const { html } = buildGuestbookEmail({ message: "line one\nline two", sentAt: at });
  for (const s of ["One-year-with-mylove", "28.10.2025", "A little message for you ♡", "Dhwani wrote:", "line one<br>line two", "Sent with love, Dhwani ♡", "prefers-color-scheme: dark", "role=\"presentation\"", "6:30 pm IST"]) assert.ok(html.includes(s), s);
  assert.ok(!/<script|display:\s*(flex|grid)|<link |<img /i.test(html));
  assert.ok(!html.includes("Arjun"));
});
test("plain-text fallback has the same content and the exact signature", () => {
  const { text } = buildGuestbookEmail({ message: "hello bubu", sentAt: at });
  for (const s of ["A little message for you ♡", "Dhwani wrote:", "hello bubu", "Sent with love, Dhwani ♡"]) assert.ok(text.includes(s), s);
  assert.ok(!text.includes("<") && !text.includes("Arjun"));
});
test("her wording is kept exactly (only the ends are trimmed)", () => {
  const msg = "  Hii   baby,  i  miss you\n\n  soo much  ";
  const { text, html } = buildGuestbookEmail({ message: msg, sentAt: at });
  assert.ok(text.includes("Hii   baby,  i  miss you\n\n  soo much")); assert.ok(html.includes("Hii   baby,  i  miss you<br><br>  soo much"));
});
test("untrusted input is escaped", () => {
  const evil = `<img src=x onerror=alert(1)> "quoted" & <script>alert(2)</script>`;
  const { html } = buildGuestbookEmail({ message: evil, sentAt: at });
  assert.ok(!html.includes("<img") && !html.includes("<script>alert") && html.includes("&lt;img") && html.includes("&amp;") && html.includes("&quot;quoted&quot;"));
});

import { buildLoveLetter, LETTER_SENTENCES } from "../src/services/email.js";
test("love letter: exact subject, 2 to 5 sentences, signed, HTML + plain text carry the same words", () => {
  assert.ok(LETTER_SENTENCES.length >= 2 && LETTER_SENTENCES.length <= 5);
  const { subject, html, text } = buildLoveLetter();
  assert.equal(subject, "A little letter for you, bubu ♡");
  for (const s of LETTER_SENTENCES) { assert.ok(text.includes(s), s); assert.ok(html.includes(s.replace(/'/g, "&#39;")), s); }
  assert.ok(html.includes("With love, Arjun ♡") && text.includes("With love, Arjun ♡") && /sent with love/i.test(text));
  assert.ok(html.includes("#ffffff") && html.includes("#fde4ea")); // white card on baby pink
  assert.ok(html.includes("role=\"presentation\"") && html.includes("prefers-color-scheme: dark") && html.includes("max-width:520px") && !/<script|<img |display:\s*(flex|grid)/i.test(html));
  assert.ok(!text.includes("<"));
});
test("the letter and the message email are clearly different", () => {
  const a = buildGuestbookEmail({ message: "x" }), b = buildLoveLetter();
  assert.notEqual(a.subject, b.subject); assert.notEqual(a.html, b.html); assert.ok(!b.text.includes("Dhwani wrote:"));
});
