import { STATUS_CODES } from "node:http";
import { isHttpError } from "http-errors";
import type { ErrorRequestHandler, Request } from "express";

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  [key: string]: unknown;
};

const RESERVED = new Set([
  "type",
  "title",
  "status",
  "detail",
  "instance",
  "statusCode",
  "expose",
  "name",
  "message",
  "stack",
  "headers",
]);

export function toProblemDetails(err: unknown, req: Request): ProblemDetails {
  const httpError = isHttpError(err) ? err : undefined;
  const status = httpError ? httpError.status : 500;
  const title = STATUS_CODES[status] ?? "Internal Server Error";
  const expose = httpError ? httpError.expose : false;
  const detail = expose && httpError ? httpError.message : title;

  const problem: ProblemDetails = {
    type: `https://example.com/problems/${status}`,
    title,
    status,
    detail,
    instance: req.originalUrl,
  };

  if (expose) {
    for (const [key, value] of Object.entries(err as Record<string, unknown>)) {
      if (RESERVED.has(key)) continue;
      problem[key] = value;
    }
  }

  return problem;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const problem = toProblemDetails(err, req);
  res.status(problem.status).type("application/problem+json").json(problem);
};
