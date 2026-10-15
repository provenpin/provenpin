import { AsyncLocalStorage } from "node:async_hooks";
import pino, { type DestinationStream } from "pino";
import build from "pino-abstract-transport";

export const requestContext = new AsyncLocalStorage<{ requestId: string; userId?: string }>();

/**
 * App logger: redacts secrets, serialises errors, and stamps every line with the current
 * request id from AsyncLocalStorage through a mixin.
 */
export function createLogger(destination: DestinationStream, level = "info") {
  return pino({
    level,
    base: { service: "billing" },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) }, // "level":"info" instead of 30
    redact: {
      paths: ["password", "*.password", "headers.authorization", "card.number", "users[*].email"],
      censor: "[REDACTED]",
    },
    serializers: { err: pino.stdSerializers.err },
    mixin: () => requestContext.getStore() ?? {},
  }, destination);
}

/**
 * A custom transport built with pino-abstract-transport. It receives parsed log objects and
 * forwards only warn and above to a sink (a stand-in for Slack, Sentry, a queue...).
 * Used here in-process as a destination; the same module can run in a worker via pino.transport.
 */
export async function alertTransport(opts: { sink: (line: { level: string; msg: string; requestId?: string }) => void; minLevel?: number }) {
  const min = opts.minLevel ?? 40;
  const levelNum: Record<string, number> = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 };
  return build(async (source) => {
    for await (const obj of source) {
      if ((levelNum[obj.level] ?? obj.level) >= min) opts.sink({ level: obj.level, msg: obj.msg, requestId: obj.requestId });
    }
  });
}
