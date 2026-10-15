import winston from "winston";
import Transport from "winston-transport";

const { combine, timestamp, errors, json, printf } = winston.format;

/** Custom format: masks secret-looking fields and adds a service tag. */
export const redact = winston.format((info, opts: { keys: string[] }) => {
  for (const k of opts.keys) if (k in info) (info as Record<string, unknown>)[k] = "[REDACTED]";
  return info;
});

/** Drops debug noise from a named module. */
export const dropModule = winston.format((info, opts: { module: string }) => (info.module === opts.module && info.level === "debug" ? false : info));

/** Custom transport that keeps entries in memory (for tests, or to forward to a queue). */
export class MemoryTransport extends Transport {
  entries: Record<string, unknown>[] = [];
  log(info: Record<string | symbol, unknown>, next: () => void) {
    setImmediate(() => this.emit("logged", info));
    this.entries.push(JSON.parse(info[Symbol.for("message")] as string));
    next();
  }
}

export function createLogger(mem: MemoryTransport, fixedTime = "2026-10-15T20:00:00.000Z") {
  return winston.createLogger({
    level: "debug",
    defaultMeta: { service: "provenpin" },
    format: combine(
      errors({ stack: true }),
      redact({ keys: ["password", "token"] }),
      dropModule({ module: "noisy" }),
      timestamp({ format: () => fixedTime }),
      json(),
    ),
    transports: [mem],
  });
}

export const lineFormat = printf((i) => `${i.timestamp} ${i.level.toUpperCase()} ${i.message}`);
