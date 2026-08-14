import { Router } from "express";
import { propertyRouter } from "./property.routes";
import { shopRouter } from "./shop.routes";
import { shopRentalApplicationRouter } from "./shopRentalApplication.routes";
import { tradeLicenseApplicationRouter } from "./tradeLicenseApplication.routes";
import { verifyRouter } from "./verify.routes";
import { authRouter } from "./auth.routes";
import { paymentsRouter } from "./payments.routes";
import { adminAuthRouter } from "./adminAuth.routes";
import { adminRouter } from "./admin.routes";
import { getFormOptions } from "../controllers/formOptions.controller";
import { dashboardSummaryRouter } from "./dashboardSummary.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

apiRouter.get("/form-options", getFormOptions);
apiRouter.use("/auth", authRouter);
apiRouter.use("/properties", propertyRouter);
apiRouter.use("/shops", shopRouter);
apiRouter.use("/shop-rental-applications", shopRentalApplicationRouter);
apiRouter.use("/trade-license-applications", tradeLicenseApplicationRouter);
apiRouter.use("/verify", verifyRouter);
apiRouter.use("/payments", paymentsRouter);

apiRouter.use("/dashboard-summary", dashboardSummaryRouter);

// /admin/auth (public login) MUST be mounted before /admin (which
// requires an admin session for everything under it) — Express tries
// mounts in registration order, so the more specific path needs to win.
apiRouter.use("/admin/auth", adminAuthRouter);
apiRouter.use("/admin", adminRouter);