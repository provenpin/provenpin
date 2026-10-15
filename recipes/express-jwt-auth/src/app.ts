import express, { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-only-secret-change-me";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing token" });
  try {
    res.locals.user = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
    next();
  } catch {
    res.status(401).json({ error: "invalid token" });
  }
}

export function createApp() {
  const app = express();
  app.use(express.json());
  app.post("/login", (req, res) => {
    if (req.body?.password !== "correct-horse") return res.status(401).json({ error: "bad credentials" });
    res.json({ token: jwt.sign({ sub: req.body.username }, SECRET, { algorithm: "HS256", expiresIn: "15m" }) });
  });
  app.get("/me", requireAuth, (_req, res) => res.json({ sub: res.locals.user.sub }));
  return app;
}
