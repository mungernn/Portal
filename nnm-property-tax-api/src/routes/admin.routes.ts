import { Router } from "express";
import { listOperators, setOperatorActive } from "../controllers/adminOperators.controller";
import {
  listTaxCollectors,
  createTaxCollector,
  setTaxCollectorActive,
  getAvailableWards,
  getTaxCollectorWards,
  setTaxCollectorWards,
} from "../controllers/taxCollector.controller";
import {
  getChangeRequests,
  getChangeRequestById,
  postApproveChangeRequest,
  postRejectChangeRequest,
} from "../controllers/changeRequest.controller";
import {
  getCancellationRequests,
  postApproveCancellation,
  postRejectCancellation,
} from "../controllers/cancellationRequest.controller";
import { postBulkGenerateDemandNotices } from "../controllers/demandNotice.controller";
import { postBulkRegenerateTaxHistory } from "../controllers/adminTaxHistory.controller";
import { getDataExport } from "../controllers/export.controller";
import {
  getShopAgreementRequests,
  getShopAgreementRequestById,
  postApproveShopAgreementRequest,
  postRejectShopAgreementRequest,
} from "../controllers/shopAgreement.controller";
import { listAllShops, getPerSqftReport } from "../controllers/shop.controller";
import { postResolveViolationNotice } from "../controllers/shopViolationNotice.controller";
import {
  getRentalApplications,
  getRentalApplicationById,
  postApproveRentalApplication,
  postRejectRentalApplication,
} from "../controllers/shopRentalApplication.controller";
import {
  getTradeLicenseApplications,
  getTradeLicenseApplicationById,
  postApproveTradeLicenseApplication,
  postRejectTradeLicenseApplication,
  getTradeLicenseStats,
} from "../controllers/tradeLicenseApplication.controller";
import { requireAdmin, requireAdminRole } from "../middleware/requireAdmin";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

// Senior-role gate reused across the routes below — operator account
// management, full data export, and system-wide bulk mutations are
// powerful enough that every admin role shouldn't equally reach them,
// even though every admin role legitimately needs the day-to-day
// approval-queue endpoints. Commissioner and Deputy Commissioner sit at
// or near the top of all three approval chains (property, shop, trade
// license), so they're the natural senior-oversight roles here.
const requireSeniorAdmin = requireAdminRole("commissioner", "deputy_commissioner");

// Operator management
adminRouter.get("/operators", requireSeniorAdmin, listOperators);
adminRouter.patch("/operators/:id/active", requireSeniorAdmin, setOperatorActive);

// Property mutation approval queue
adminRouter.get("/change-requests", getChangeRequests);
adminRouter.get("/change-requests/:id", getChangeRequestById);
adminRouter.post("/change-requests/:id/approve", postApproveChangeRequest);
adminRouter.post("/change-requests/:id/reject", postRejectChangeRequest);

// Demand notice / receipt cancellation approval queue - viewable by
// any admin role, but approve/reject is tax_daroga-only (unlike the
// property mutation chain above, this doesn't escalate through
// multiple roles).
const requireTaxDaroga = requireAdminRole("tax_daroga");
adminRouter.get("/cancellation-requests", getCancellationRequests);
adminRouter.post("/cancellation-requests/:id/approve", requireTaxDaroga, postApproveCancellation);
adminRouter.post("/cancellation-requests/:id/reject", requireTaxDaroga, postRejectCancellation);

// Shop agreement approval queue (5-stage: Stall Prabhari -> Tax Daroga NOC -> City Manager -> Deputy Commissioner -> Commissioner)
adminRouter.get("/shop-agreement-requests", getShopAgreementRequests);
adminRouter.get("/shop-agreement-requests/:id", getShopAgreementRequestById);
adminRouter.post("/shop-agreement-requests/:id/approve", postApproveShopAgreementRequest);
adminRouter.post("/shop-agreement-requests/:id/reject", postRejectShopAgreementRequest);
adminRouter.get("/shops", listAllShops);
adminRouter.get("/shops/per-sqft-report", getPerSqftReport);
adminRouter.post("/violation-notices/:id/resolve", postResolveViolationNotice);

// Shop rental applications (new tenant applications for vacant shops)
adminRouter.get("/shop-rental-applications", getRentalApplications);
adminRouter.get("/shop-rental-applications/:id", getRentalApplicationById);
adminRouter.post("/shop-rental-applications/:id/approve", postApproveRentalApplication);
adminRouter.post("/shop-rental-applications/:id/reject", postRejectRentalApplication);

// Trade license applications (new + renewal) — /stats MUST come before
// /:id below, or Express would try to parse "stats" as an id.
adminRouter.get("/trade-license-applications/stats", getTradeLicenseStats);
adminRouter.get("/trade-license-applications", getTradeLicenseApplications);
adminRouter.get("/trade-license-applications/:id", getTradeLicenseApplicationById);
adminRouter.post("/trade-license-applications/:id/approve", postApproveTradeLicenseApplication);
adminRouter.post("/trade-license-applications/:id/reject", postRejectTradeLicenseApplication);

// Bulk demand notice generation
adminRouter.post("/demand-notices/bulk-generate", requireSeniorAdmin, postBulkGenerateDemandNotices);

// Bulk tax-history-stage regeneration (backfill from current Floors)
adminRouter.post("/tax-history/bulk-regenerate", requireSeniorAdmin, postBulkRegenerateTaxHistory);

// Data export - GET /api/v1/admin/export?dataset=properties|payments|notices|changes|all
adminRouter.get("/export", requireSeniorAdmin, getDataExport);

// Tax collector management - any admin can view/create/toggle.
adminRouter.get("/tax-collectors", listTaxCollectors);
adminRouter.post("/tax-collectors", createTaxCollector);
adminRouter.patch("/tax-collectors/:id/active", setTaxCollectorActive);

// Ward tagging - viewing is open to any admin, but only Tax Daroga can
// change which wards a collector is allowed to operate in.
adminRouter.get("/tax-collectors/available-wards", getAvailableWards);
adminRouter.get("/tax-collectors/:id/wards", getTaxCollectorWards);
adminRouter.put("/tax-collectors/:id/wards", requireAdminRole("tax_daroga"), setTaxCollectorWards);