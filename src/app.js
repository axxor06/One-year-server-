import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import guestbook from "./routes/guestbook.js";

const app = express();
app.set("trust proxy", 1); // needed behind Render's proxy so rate limiting sees real IPs
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", methods: ["GET", "POST"] }));
app.use(express.json({ limit: "10kb" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/guestbook", rateLimit({ windowMs: 15 * 60 * 1000, limit: Number(process.env.GUESTBOOK_RATE_LIMIT) || 5, standardHeaders: true, legacyHeaders: false,
  message: { error: "Too many messages for now. Please try again in a bit." } }), guestbook);
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => { console.error(err.message); res.status(500).json({ error: "Something went wrong." }); });
export default app;
