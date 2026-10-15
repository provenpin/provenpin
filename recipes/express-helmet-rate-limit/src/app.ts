import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

export function createApp({ limit = 100, windowMs = 60_000 } = {}) {
  const app = express();
  app.use(helmet());
  app.use("/api", rateLimit({ windowMs, limit, standardHeaders: "draft-8", legacyHeaders: false }));
  app.get("/api/ping", (_req, res) => { res.json({ ok: true }); });
  return app;
}
