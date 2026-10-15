import express from "express";
import { body, query, validationResult, matchedData } from "express-validator";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.post(
    "/users",
    body("email").isEmail().withMessage("email invalid"),
    body("age").isInt({ min: 18 }).withMessage("age must be 18+").toInt(),
    body("name").trim().notEmpty().withMessage("name required"),
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      return res.status(201).json({ ok: true, user: matchedData(req) });
    },
  );

  app.get(
    "/search",
    query("q").trim().isLength({ min: 2 }).withMessage("q too short"),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      return res.json({ q: data.q, limit: data.limit ?? 10 });
    },
  );

  return app;
}
