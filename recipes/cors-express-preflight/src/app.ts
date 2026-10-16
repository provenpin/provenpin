import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";

export const defaultAllowedOrigins = [
  "https://app.example.com",
  "https://admin.example.com",
];

export function createApp(allowedOrigins: string[] = defaultAllowedOrigins): Express {
  const app = express();

  const corsOptions: CorsOptions = {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/echo", (req, res) => {
    res.json({ received: req.body ?? null });
  });

  return app;
}
