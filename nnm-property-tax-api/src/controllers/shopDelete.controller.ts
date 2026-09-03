import type { Request, Response } from "express";
import { z } from "zod";
import { deleteShopCompletely } from "../services/shopDelete.service";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/ApiError";

const shopNoParamSchema = z.object({ shopNo: z.string().trim().min(1).max(32) });

/** DELETE /api/v1/admin/shops/:shopNo - commissioner only. Blocked if the shop has any real financial/legal history (see shopDelete.service.ts). */
export const deleteShopHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = shopNoParamSchema.safeParse(req.params);
  if (!parsed.success) throw ApiError.badRequest("Invalid shop number");
  await deleteShopCompletely(parsed.data.shopNo);
  res.status(200).json({ deleted: true });
});
