import express from "express";
import session from "express-session";

declare module "express-session" { interface SessionData { user?: string } }

export function createApp(secret: string) {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(session({
    secret, resave: false, saveUninitialized: false, name: "sid",
    cookie: { httpOnly: true, sameSite: "lax", secure: false /* true behind HTTPS */, maxAge: 3600_000 },
  }));
  app.post("/login", (req, res, next) => {
    if (req.body.password !== "secret") return res.status(401).send("bad credentials");
    req.session.regenerate((err) => { // new session id on login prevents fixation
      if (err) return next(err);
      req.session.user = req.body.username;
      res.redirect(303, "/dashboard");
    });
  });
  app.get("/dashboard", (req, res) => {
    if (!req.session.user) return res.redirect(303, "/login");
    res.send(`Welcome ${req.session.user}`);
  });
  app.post("/logout", (req, res) => { req.session.destroy(() => res.clearCookie("sid").redirect(303, "/login")); });
  app.get("/login", (_req, res) => { res.send("login page"); });
  return app;
}
