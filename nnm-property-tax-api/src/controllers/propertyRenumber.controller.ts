import type { Request, Response } from "express";
import { z } from "zod";
import { renumberHolding, removeSpacesFromHoldingNumbers } from "../services/propertyRenumber.service";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/ApiError";

const paramsSchema = z.object({ holdingNo: z.string().trim().min(1) });

/**
 * POST /api/v1/admin/properties/:holdingNo/renumber - commissioner
 * only. For correcting a holding accidentally created under a number
 * that turned out to already belong to a different, not-yet-migrated
 * holding. Auto-assigns the next available number in the same series.
 */
export const postRenumberHolding = asyncHandler(async (req: Request, res: Response) => {
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) throw ApiError.badRequest("Invalid holding number");
  const result = await renumberHolding(parsed.data.holdingNo, req.admin!.displayName);
  res.status(200).json(result);
});

/**
 * POST /api/v1/admin/properties/fix-holding-no-spaces - commissioner
 * only. One-time bulk fix for holdings imported with a stray space in
 * holding_no - see removeSpacesFromHoldingNumbers's comment.
 */
export const postFixHoldingNoSpaces = asyncHandler(async (req: Request, res: Response) => {
  const result = await removeSpacesFromHoldingNumbers(req.admin!.displayName);
  res.status(200).json(result);
});
