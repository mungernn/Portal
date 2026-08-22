import { Router } from "express";
import { propertyRouter } from "./property.routes";
import { operatorRouter } from "./operator.routes";
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
import { attendanceRouter } from "./attendance.routes";
import { taxCollectorRouter } from "./taxCollector.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

apiRouter.get("/form-options", getFormOptions);
apiRouter.use("/auth", authRouter);
apiRouter.use("/properties", propertyRouter);
apiRouter.use("/operator", operatorRouter);
apiRouter.use("/shops", shopRouter);
apiRouter.use("/shop-rental-applications", shopRentalApplicationRouter);
apiRouter.use("/trade-license-applications", tradeLicenseApplicationRouter);
apiRouter.use("/verify", verifyRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/tax-collectors", taxCollectorRouter);

apiRouter.use("/dashboard-summary", dashboardSummaryRouter);
// Fully separate module - its own auth, its own tables, nothing shared with the property tax / shop / trade license system above.
apiRouter.use("/attendance", attendanceRouter);

// /admin/auth (public login) MUST be mounted before /admin (which
// requires an admin session for everything under it) - Express tries
// mounts in registration order, so the more specific path needs to win.
apiRouter.use("/admin/auth", adminAuthRouter);
apiRouter.use("/admin", adminRouter);