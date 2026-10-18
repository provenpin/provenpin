import express from "express";
import type { NextFunction, Request, Response } from "express";

export function createApp() {
  const app = express();
  app.use(express.json());

  const orders = express.Router({ mergeParams: true });
  orders.get("/:orderId", (req: Request, res: Response) => {
    const { userId, orderId } = req.params;
    res.json({ userId, orderId });
  });

  app.use("/users/:userId/orders", orders);

  app.get("/boom", async () => {
    throw new Error("kaboom");
  });

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "not_found", path: req.path });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: "internal_error", message: err.message });
  });

  return app;
}
