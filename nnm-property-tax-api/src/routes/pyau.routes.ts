import { Router } from "express";
import {
  listPyausHandler,
  createPyauHandler,
  uploadPyauCsvHandler,
  setPyauActiveHandler,
  listPyauContractorWardsHandler,
  assignPyauContractorWardHandler,
  listPyauIssuesForPyauHandler,
  listAllPyauIssuesHandler,
  reportPyauIssueHandler,
  markPyauIssueRepairedHandler,
} from "../controllers/pyau.controller";
import { requireAttendanceRole } from "../middleware/requireAttendanceRole";

export const pyauRouter = Router();

// Registry management - JE/AE and the contractor's own oversight; "purely internal for now" so no separate nodal-clerk-style role was asked for.
const REGISTRY_MANAGE_ROLES = ["pyau_je", "pyau_ae"] as const;

// --- Pyau registry ---
pyauRouter.get("/pyaus", requireAttendanceRole(), listPyausHandler);
pyauRouter.post("/pyaus", requireAttendanceRole([...REGISTRY_MANAGE_ROLES]), createPyauHandler);
pyauRouter.post("/pyaus/bulk-upload", requireAttendanceRole([...REGISTRY_MANAGE_ROLES]), uploadPyauCsvHandler);
pyauRouter.patch("/pyaus/:id/active", requireAttendanceRole([...REGISTRY_MANAGE_ROLES]), setPyauActiveHandler);

// --- Contractor-ward assignment (45 wards / 3 contractor groups) ---
pyauRouter.get("/contractor-wards", requireAttendanceRole(), listPyauContractorWardsHandler);
pyauRouter.post("/contractor-wards", requireAttendanceRole([...REGISTRY_MANAGE_ROLES]), assignPyauContractorWardHandler);

// --- Issues / maintenance log - "any issue will be marked by JE or AE" ---
pyauRouter.get("/pyaus/:id/issues", requireAttendanceRole(), listPyauIssuesForPyauHandler);
pyauRouter.get("/issues", requireAttendanceRole(), listAllPyauIssuesHandler);
pyauRouter.post("/issues", requireAttendanceRole([...REGISTRY_MANAGE_ROLES]), reportPyauIssueHandler);
pyauRouter.patch(
  "/issues/:id/repaired",
  requireAttendanceRole(["pyau_contractor", ...REGISTRY_MANAGE_ROLES]),
  markPyauIssueRepairedHandler,
);
