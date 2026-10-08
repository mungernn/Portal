import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { adminRepository } from "../repositories/admin.repository";
import type { AdminTokenPayload } from "../types/admin.types";

/**
 * A Tax Collector may only see and collect tax for holdings in the wards
 * assigned to them (Tax Collector Assignments page, table
 * tax_collector_login_wards). A collector with no wards assigned can
 * access no holdings at all. Every other role is unaffected.
 */

/** The collector's assigned wards, or null when the admin is not a Tax Collector (no restriction). */
export async function collectorWardScope(admin: { role: string; username: string } | undefined): Promise<string[] | null> {
  if (!admin || admin.role !== "tax_collector") return null;
  return (await adminRepository.listTaxCollectorWards(admin.username)).map((w) => w.trim());
}

export function wardAllowed(scope: string[], ward: string | null | undefined): boolean {
  const w = (ward ?? "").trim();
  return w !== "" && scope.includes(w);
}

const NOT_YOUR_WARD = "This holding is not in a ward assigned to you.";

/** Throws 403 when the caller is a Tax Collector and the holding is outside their wards. A holding that does not exist is left to the route to report. */
export async function assertCollectorMayAccessHolding(admin: { role: string; username: string } | undefined, holdingNo: string): Promise<void> {
  const scope = await collectorWardScope(admin);
  if (scope === null) return;
  const { rows } = await pool.query<{ ward: string | null }>(`SELECT ward FROM properties WHERE holding_no = $1`, [holdingNo]);
  if (rows.length === 0) return;
  if (!wardAllowed(scope, rows[0]?.ward)) throw new ApiError(403, NOT_YOUR_WARD);
}

/** Reads the caller from the bearer token without failing - the route's own auth middleware still decides whether the request is allowed at all. */
function adminFromRequest(req: Request): AdminTokenPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(header.slice("Bearer ".length), env.JWT_SECRET) as unknown as { type?: string };
    return payload.type === "admin" ? (payload as AdminTokenPayload) : null;
  } catch {
    return null;
  }
}

/**
 * Router param handlers: mount with router.param("holdingNo", ...),
 * router.param("demandNo", ...), router.param("receiptNo", ...) so that
 * every route addressing a holding, a demand notice or a receipt is
 * checked, including ones added later.
 */
export function collectorHoldingParam(req: Request, _res: Response, next: NextFunction, value: string): void {
  const admin = adminFromRequest(req);
  if (!admin || admin.role !== "tax_collector") return next();
  assertCollectorMayAccessHolding(admin, value).then(() => next(), next);
}

export function collectorDemandNoticeParam(req: Request, _res: Response, next: NextFunction, value: string): void {
  const admin = adminFromRequest(req);
  if (!admin || admin.role !== "tax_collector") return next();
  pool
    .query<{ holding_no: string }>(`SELECT holding_no FROM demand_notices WHERE demand_no = $1`, [value])
    .then(({ rows }) => (rows[0] ? assertCollectorMayAccessHolding(admin, rows[0].holding_no) : undefined))
    .then(() => next(), next);
}

export function collectorReceiptParam(req: Request, _res: Response, next: NextFunction, value: string): void {
  const admin = adminFromRequest(req);
  if (!admin || admin.role !== "tax_collector") return next();
  pool
    .query<{ holding_no: string }>(`SELECT holding_no FROM transactions WHERE receipt_no = $1`, [value])
    .then(({ rows }) => (rows[0] ? assertCollectorMayAccessHolding(admin, rows[0].holding_no) : undefined))
    .then(() => next(), next);
}
