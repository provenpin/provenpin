import express from "express";
import session from "express-session";
import passport from "passport";
import { configurePassport, toPublicUser, type User } from "./auth.ts";

export function createApp(): express.Express {
  configurePassport();

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(
    session({
      secret: "recipe-session-secret",
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.post("/login", (req, res, next) => {
    passport.authenticate(
      "local",
      (err: unknown, user: User | false, info?: { message?: string }) => {
        if (err) {
          next(err);
          return;
        }
        if (!user) {
          res.status(401).json({ error: info?.message ?? "unauthorized" });
          return;
        }
        req.logIn(user, (loginError) => {
          if (loginError) {
            next(loginError);
            return;
          }
          res.json({ user: toPublicUser(user) });
        });
      },
    )(req, res, next);
  });

  app.get("/me", (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || !user) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    res.json({ user: toPublicUser(user) });
  });

  app.post("/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        next(err);
        return;
      }
      res.json({ ok: true });
    });
  });

  return app;
}
