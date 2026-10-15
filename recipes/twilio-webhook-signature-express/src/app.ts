import express from "express";
import twilio from "twilio";

const { MessagingResponse } = twilio.twiml;

/**
 * Inbound SMS webhook. Twilio signs the full public URL plus the sorted POST params with your
 * auth token (HMAC-SHA1, X-Twilio-Signature). Behind a proxy, rebuild the public URL yourself.
 */
export function makeApp(authToken: string, publicBaseUrl: string) {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.post("/sms", (req, res) => {
    const signature = req.header("x-twilio-signature") ?? "";
    const url = publicBaseUrl + req.originalUrl;
    if (!twilio.validateRequest(authToken, signature, url, req.body)) {
      res.status(403).type("text/plain").send("invalid signature");
      return;
    }
    const twiml = new MessagingResponse();
    const text = String(req.body.Body ?? "").trim().toUpperCase();
    twiml.message(text === "STATUS" ? "Class starts Nov 1st" : `Got: ${req.body.Body}`);
    res.type("text/xml").send(twiml.toString());
  });
  return app;
}
