
import { Router } from "express";
import crypto from "node:crypto";
import {
  buildGuestbookEmail,
  buildLoveLetter,
} from "../services/email.js";
import { sendEmail, isSet, sendViaBrevo } from "../services/mailer.js";

const router = Router();

const PLACEHOLDER_HER = [
  "dhwanis_email_address@example.com",
  "her_email_address@example.com",
];

const missing = (names) =>
  names.filter((n) =>
    !isSet(
      process.env[n],
      ...(n === "HER_EMAIL"
        ? PLACEHOLDER_HER
        : n === "GUESTBOOK_TO_EMAIL"
          ? ["you@example.com"]
          : [])
    )
  );

const inFlight = new Set();

// Send the submitted message to your inbox through Resend.
async function deliverMessage(message) {
  const gone = missing([
    "RESEND_API_KEY",
    "GUESTBOOK_TO_EMAIL",
    "GUESTBOOK_FROM_EMAIL",
  ]);

  if (gone.length) {
    console.error(`Message email not sent: missing ${gone.join(", ")}`);
    return "not_configured";
  }

  console.log("Attempting to send guestbook message through Resend.");

  const result = await sendEmail({
    label: "message",
    to: process.env.GUESTBOOK_TO_EMAIL,
    ...buildGuestbookEmail({ message }),
  });

  return result.ok ? "accepted" : "failed";
}

// Send the pre-written love letter to Dhwani through Brevo.
async function deliverLetter() {
  const gone = missing([
    "BREVO_API_KEY",
    "BREVO_FROM_EMAIL",
    "HER_EMAIL",
  ]);

  if (gone.length) {
    console.error(`Letter not sent: missing ${gone.join(", ")}`);
    return "not_configured";
  }

  console.log("Attempting to send love letter through Brevo.");

  const result = await sendViaBrevo({
    to: process.env.HER_EMAIL,
    ...buildLoveLetter(),
  });

  return result.ok ? "accepted" : "failed";
}

router.post("/", async (req, res, next) => {
  let key;

  try {
    const { message = "", website = "", skip } = req.body || {};

    // Hidden honeypot field for bot submissions.
    if (website) {
      return res.status(201).json({
        ok: true,
        message: "skipped",
        letter: "skipped",
      });
    }

    if (typeof message !== "string") {
      return res.status(400).json({ error: "Invalid input." });
    }

    const cleanedMessage = message.trim();

    if (cleanedMessage.length < 2 || cleanedMessage.length > 2000) {
      return res.status(400).json({
        error: "Message must be 2 to 2000 characters.",
      });
    }

    key = `${req.ip}|${crypto
      .createHash("sha256")
      .update(cleanedMessage)
      .digest("hex")}`;

    if (inFlight.has(key)) {
      return res.status(409).json({
        error: "That's already being sent. One moment…",
      });
    }

    inFlight.add(key);

    // Each email is handled independently.
    const [messageStatus, letterStatus] = await Promise.all([
      skip?.message === true
        ? "skipped"
        : deliverMessage(cleanedMessage),

      skip?.letter === true
        ? "skipped"
        : deliverLetter(),
    ]);

    const successful = (status) =>
      status === "accepted" || status === "skipped";

    const failures = [messageStatus, letterStatus].filter(
      (status) => !successful(status)
    );

    const successes = [messageStatus, letterStatus].filter(
      successful
    );

    const statusCode =
      failures.length === 0
        ? 201
        : successes.length > 0
          ? 207
          : [messageStatus, letterStatus].includes("not_configured")
            ? 503
            : 502;

    return res.status(statusCode).json({
      ok: failures.length === 0,
      message: messageStatus,
      letter: letterStatus,
      ...(statusCode >= 500 && {
        error:
          statusCode === 503
            ? "Email isn't set up yet, so nothing was sent."
            : "One or more emails could not be accepted. Please try again.",
      }),
    });
  } catch (error) {
    return next(error);
  } finally {
    if (key) inFlight.delete(key);
  }
});

export default router;
