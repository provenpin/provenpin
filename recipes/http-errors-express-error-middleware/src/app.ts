import createError from "http-errors";
import express from "express";
import { errorHandler } from "./problem.ts";

type User = { id: string; email: string };

export function createApp() {
  const app = express();
  app.use(express.json());

  const users = new Map<string, User>([
    ["1", { id: "1", email: "a@example.com" }],
  ]);

  app.get("/users/:id", (req, res) => {
    const user = users.get(req.params.id);
    if (!user) {
      throw createError(404, "User not found");
    }
    res.json(user);
  });

  app.post("/users", (req, res) => {
    const email: unknown = (req.body ?? {}).email;
    if (typeof email !== "string" || !email.includes("@")) {
      throw createError(422, "Validation failed", {
        errors: [{ field: "email", message: "must be a valid email" }],
      });
    }
    const id = String(users.size + 1);
    const user: User = { id, email };
    users.set(id, user);
    res.status(201).json(user);
  });

  app.get("/reports/:id", async (req, res) => {
    await Promise.resolve();
    if (req.params.id !== "42") {
      throw createError(404, `Report ${req.params.id} not found`);
    }
    res.json({ id: req.params.id });
  });

  app.get("/maintenance", () => {
    throw createError(503, "Down for maintenance", { expose: true });
  });

  app.get("/boom", () => {
    throw new Error("secret database credentials");
  });

  app.use((_req, _res, next) => {
    next(createError(404, "Route not found"));
  });

  app.use(errorHandler);

  return app;
}
