import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }

  req.log?.error(err);
  console.error(err);
  res.status(500).json({
    error: "Internal server error",
    // Never leak stack traces / DB errors to the client in production.
    ...(env.isProduction ? {} : { debug: String(err) }),
  });
}