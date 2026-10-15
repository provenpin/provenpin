import express, { type Request, type Response, type NextFunction } from "express";
import Joi from "joi";

export const createUserSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().required(),
  name: Joi.string().trim().min(2).max(50).required(),
  age: Joi.number().integer().min(13).default(18),
  role: Joi.string().valid("admin", "member").default("member"),
});

export const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid("name", "-name").default("name"),
});

type Source = "body" | "query" | "params";

/**
 * Express 5 makes req.query a read-only getter, so the validated and converted
 * value is stored on res.locals[source] instead of being written back.
 */
export function validate(schema: Joi.ObjectSchema, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const { value, error } = schema.validate(req[source] ?? {}, {
      abortEarly: false,
      convert: true,
      stripUnknown: true,
    });
    if (error) {
      res.status(400).json({
        errors: error.details.map((d) => ({ path: d.path.join("."), type: d.type, message: d.message })),
      });
      return;
    }
    res.locals[source] = value;
    next();
  };
}

export function createApp() {
  const app = express();
  app.use(express.json());
  const users: Array<Record<string, unknown>> = [];

  app.post("/users", validate(createUserSchema), (_req, res) => {
    const user = { id: users.length + 1, ...res.locals.body };
    users.push(user);
    res.status(201).json(user);
  });

  app.get("/users", validate(listQuerySchema, "query"), (_req, res) => {
    const { page, limit, sort } = res.locals.query as { page: number; limit: number; sort: string };
    res.json({ page, limit, sort, total: users.length });
  });

  return app;
}
