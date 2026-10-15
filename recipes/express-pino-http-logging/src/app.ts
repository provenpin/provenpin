import express from "express";
import pino from "pino";
import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";

export function createApp(stream?: pino.DestinationStream) {
  const logger = pino({ redact: ["req.headers.authorization", "req.headers.cookie"] }, stream);
  const app = express();
  app.use(pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = (req.headers["x-request-id"] as string) ?? randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    },
  }));
  app.get("/orders/:id", (req, res) => {
    req.log.info({ orderId: req.params.id }, "loading order");
    res.json({ id: req.params.id });
  });
  return app;
}
