import { Router } from "express";
import { getShopByShopNo, postShopLookup, postCreateShop, getMarketList, getNextShopNumber, listVacantShops } from "../controllers/shop.controller";
import { postSubmitAgreementChange, getPrintableAgreement } from "../controllers/shopAgreement.controller";
import {
  postGenerateRentDemand,
  getUnsettledRentDemands,
  postShopRentPaymentHandler,
  getPrintableDemandNotice,
  getShopDemandHistory,
  getShopReceiptReprint,
  getShopPaymentHistory,
} from "../controllers/shopRent.controller";
import { postIssueViolationNotice, getViolationNoticesForShopHandler, getViolationNoticePrint } from "../controllers/shopViolationNotice.controller";
import { requireOperator } from "../middleware/requireOperator";
import { requireOperatorOrAdmin } from "../middleware/requireOperatorOrAdmin";

export const shopRouter = Router();

// POST /api/v1/shops/lookup — public, two-factor citizen search. MUST
// come before POST /:shopNo/... routes below, or Express would treat
// "lookup" as a literal shop number.
shopRouter.post("/lookup", postShopLookup);

// GET /api/v1/shops/markets and /api/v1/shops/next-number and
// /api/v1/shops/vacant — MUST come before GET /:shopNo below, or
// Express would treat these as shop numbers.
shopRouter.get("/markets", requireOperator, getMarketList);
shopRouter.get("/next-number", requireOperator, getNextShopNumber);
shopRouter.get("/vacant", listVacantShops);

// POST /api/v1/shops — create a new shop record (operator only, direct — no approval chain)
shopRouter.post("/", requireOperator, postCreateShop);

// GET /api/v1/shops/:shopNo — operator/admin only
shopRouter.get("/:shopNo", requireOperator, getShopByShopNo);

// POST /api/v1/shops/:shopNo/agreement — queue a new/edited agreement for the 5-stage approval chain
shopRouter.post("/:shopNo/agreement", requireOperator, postSubmitAgreementChange);

// GET /api/v1/shops/agreements/:agreementId/print — the formal permit/agreement document
shopRouter.get("/agreements/:agreementId/print", requireOperatorOrAdmin, getPrintableAgreement);

// Rent demand + payment
shopRouter.post("/:shopNo/rent-demand", requireOperator, postGenerateRentDemand);
shopRouter.get("/:shopNo/rent-demands/unsettled", requireOperator, getUnsettledRentDemands);
shopRouter.get("/:shopNo/rent-demands/history", requireOperatorOrAdmin, getShopDemandHistory);
shopRouter.get("/rent-demands/:demandNo/print", requireOperatorOrAdmin, getPrintableDemandNotice);
shopRouter.post("/:shopNo/rent-payments", requireOperator, postShopRentPaymentHandler);
shopRouter.get("/:shopNo/rent-payments/history", requireOperatorOrAdmin, getShopPaymentHistory);
shopRouter.get("/rent-payments/:receiptNo/print", requireOperatorOrAdmin, getShopReceiptReprint);

// Violation notices
shopRouter.post("/:shopNo/violation-notices", requireOperator, postIssueViolationNotice);
shopRouter.get("/:shopNo/violation-notices", requireOperatorOrAdmin, getViolationNoticesForShopHandler);
shopRouter.get("/violation-notices/:id/print", requireOperatorOrAdmin, getViolationNoticePrint);