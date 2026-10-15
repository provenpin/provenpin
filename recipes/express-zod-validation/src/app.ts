import express, { type Request, type Response, type NextFunction } from "express";
import { z, type ZodType } from "zod";

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "invalid_body", issues: z.flattenError(result.error).fieldErrors });
    }
    req.body = result.data;
    next();
  };
}

export const CreateUser = z.object({
  email: z.email(),
  name: z.string().min(1).max(80),
  age: z.number().int().min(13).optional(),
});

export function createApp() {
  const app = express();
  app.use(express.json());
  app.post("/users", validateBody(CreateUser), (req, res) => {
    res.status(201).json({ id: 1, ...req.body });
  });
  return app;
}
