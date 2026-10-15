import express, { type NextFunction, type Request, type Response } from "express";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";

type User = { id: string; role: "admin" | "user" };

export function createApp(secret: string) {
  passport.use(new JwtStrategy(
    { jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: secret, algorithms: ["HS256"] },
    (payload: { sub: string; role: User["role"] }, done) => done(null, { id: payload.sub, role: payload.role }),
  ));
  const app = express();
  app.use(express.json());
  app.use(passport.initialize());
  const auth = passport.authenticate("jwt", { session: false });
  const requireRole = (role: User["role"]) => (req: Request, res: Response, next: NextFunction) =>
    (req.user as User).role === role ? next() : res.status(403).json({ error: "forbidden" });

  app.post("/login", (req, res) => {
    if (req.body?.password !== "secret") return res.status(401).json({ error: "invalid_credentials" });
    const role = req.body.username === "root" ? "admin" : "user";
    res.json({ token: jwt.sign({ role }, secret, { subject: req.body.username, expiresIn: "1h", algorithm: "HS256" }) });
  });
  app.get("/me", auth, (req, res) => { res.json(req.user); });
  app.get("/admin", auth, requireRole("admin"), (_req, res) => { res.json({ ok: true }); });
  return app;
}
