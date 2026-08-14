import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import type { AdminTokenPayload } from "../types/admin.types";
import type { OperatorTokenPayload } from "../types/auth.types";

/**
 * For endpoints that are legitimately reachable by EITHER an operator
 * or an admin session — currently only the read-only historical
 * document reprint/history endpoints (past demand notices, receipts,
 * rent receipts, violation notices). Everything else keeps using the
 * single-role requireOperator/requireAdmin as before; this is
 * deliberately not a general-purpose replacement for those.
 */
export function requireOperatorOrAdmin(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as unknown as AdminTokenPayload | OperatorTokenPayload;
    if (payload.type === "admin") {
      req.admin = payload;
    } else if (payload.type === "operator") {
      req.operator = payload;
    } else {
      throw new Error("unrecognized token type");
    }
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired session — please log in again");
  }
}