import type { Request, Response } from "express";
import { z } from "zod";
import { holdingNoSchema } from "../utils/holdingNoSchema";
import { searchPropertyByHoldingNo, searchPropertyForCitizen } from "../services/property.service";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/ApiError";

const holdingNoParamSchema = z.object({
  holdingNo: holdingNoSchema,
});

/**
 * GET /api/v1/properties/:holdingNo
 * Operator/admin only (see requireOperator on the route) — holding
 * number alone is enough for trusted staff. Port of the "Search
 * property by Holding ID" flow from Code.gs's searchProperty(). Tax
 * figures are recalculated fresh on every request.
 */
export const getPropertyByHoldingNo = asyncHandler(async (req: Request, res: Response) => {
  const parsed = holdingNoParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid holding number", parsed.error.flatten().fieldErrors);
  }

  const result = await searchPropertyByHoldingNo(parsed.data.holdingNo);

  if (!result.found) {
    throw ApiError.notFound(result.message ?? "Property not found");
  }

  res.status(200).json(result);
});

const lookupBodySchema = z.object({
  holdingNo: holdingNoSchema,
  holdingNo: holdingNoSchema,
});

/**
 * POST /api/v1/properties/lookup
 * Public — the citizen-facing search. Requires the holding number AND
 * its registered mobile number to both match before returning anything;
 * see searchPropertyForCitizen() for why. Still distinguishes "holding
 * doesn't exist" from "wrong mobile" in the error details (a masked
 * last-two-digits hint), to help a citizen self-correct a typo without
 * exposing their full registered number.
 */
export const postPropertyLookup = asyncHandler(async (req: Request, res: Response) => {
  const parsed = lookupBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);
  }

  const result = await searchPropertyForCitizen(parsed.data.holdingNo, parsed.data.mobileNo);

  if (!result.found) {
    throw ApiError.notFound(result.message ?? "No matching property found.", {
      mobileMismatch: result.mobileMismatch ?? false,
      registeredMobileLastTwoDigits: result.registeredMobileLastTwoDigits ?? null,
    });
  }

  res.status(200).json(result);
});