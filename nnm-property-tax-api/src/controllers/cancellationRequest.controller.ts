import type { Request, Response } from "express";
import { z } from "zod";
import {
  requestCancellation,
  listPendingCancellationRequests,
  listCancellationRequests,
  approveCancellation,
  rejectCancellation,
} from "../services/cancellationRequest.service";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/ApiError";

const requestSchema = z.object({
  requestType: z.enum(["demand_notice", "receipt"]),
  targetId: z.string().trim().min(1).max(32),
  reason: z.string().trim().min(1, "A reason is required.").max(2000),
});

/** POST /api/v1/properties/cancellation-requests - operator only. Any operator may request cancellation of any demand notice or receipt. */
export const postRequestCancellation = asyncHandler(async (req: Request, res: Response) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const request = await requestCancellation(parsed.data.requestType, parsed.data.targetId, parsed.data.reason, req.operator!.displayName);
  res.status(200).json({ request });
});

const listQuerySchema = z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() });

/** GET /api/v1/admin/cancellation-requests?status=pending - tax_daroga (or any admin, for visibility). */
export const getCancellationRequests = asyncHandler(async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw ApiError.badRequest("Invalid query");
  const requests = parsed.data.status
    ? await listCancellationRequests(parsed.data.status)
    : await listPendingCancellationRequests();
  res.status(200).json({ requests });
});

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const notesBodySchema = z.object({ notes: z.string().max(2000).optional() });

/** POST /api/v1/admin/cancellation-requests/:id/approve - tax_daroga only. */
export const postApproveCancellation = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid cancellation request id");
  const bodyParsed = notesBodySchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid request body");

  const result = await approveCancellation(paramsParsed.data.id, req.admin!.displayName, bodyParsed.data.notes ?? null);
  res.status(200).json({ request: result });
});

const rejectBodySchema = z.object({ notes: z.string().min(1, "A reason is required to reject a cancellation request.").max(2000) });

/** POST /api/v1/admin/cancellation-requests/:id/reject - tax_daroga only. */
export const postRejectCancellation = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid cancellation request id");
  const bodyParsed = rejectBodySchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid request body", bodyParsed.error.flatten().fieldErrors);

  const result = await rejectCancellation(paramsParsed.data.id, req.admin!.displayName, bodyParsed.data.notes);
  res.status(200).json({ request: result });
});
