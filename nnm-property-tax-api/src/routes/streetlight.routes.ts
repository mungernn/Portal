import { Router } from "express";
import {
  listInstallationAgenciesHandler,
  createInstallationAgencyHandler,
  setInstallationAgencyActiveHandler,
  listLightsHandler,
  createLightHandler,
  setLightActiveHandler,
  listContractorWardsHandler,
  assignContractorWardHandler,
  listFaultsHandler,
  reportFaultHandler,
  markFaultRepairedHandler,
  linkFaultToLightHandler,
  listFaultPenaltiesHandler,
  listAllPenaltiesHandler,
  myPenaltyTotalHandler,
} from "../controllers/streetlight.controller";
import { requireAttendanceRole } from "../middleware/requireAttendanceRole";

export const streetlightRouter = Router();

const REGISTRY_MANAGE_ROLES = [
  "streetlight_nodal_clerk",
  "streetlight_ae",
  "streetlight_je",
  "city_manager",
  "municipal_commissioner",
  "deputy_municipal_commissioner",
] as const;

const OVERSIGHT_ROLES = ["city_manager", "municipal_commissioner", "deputy_municipal_commissioner"] as const;

// --- Installation agencies - municipal_commissioner manages this list, per what was explicitly asked for ---
streetlightRouter.get("/agencies", requireAttendanceRole(), listInstallationAgenciesHandler);
streetlightRouter.post("/agencies", requireAttendanceRole(["municipal_commissioner"]), createInstallationAgencyHandler);
streetlightRouter.patch("/agencies/:id/active", requireAttendanceRole(["municipal_commissioner"]), setInstallationAgencyActiveHandler);

// --- Lights registry (streetlights and high-mast, filtered by ?lightType=) ---
streetlightRouter.get("/lights", requireAttendanceRole(), listLightsHandler);
streetlightRouter.post("/lights", requireAttendanceRole([...REGISTRY_MANAGE_ROLES]), createLightHandler);
streetlightRouter.patch("/lights/:id/active", requireAttendanceRole([...REGISTRY_MANAGE_ROLES]), setLightActiveHandler);

// --- Contractor-ward assignment ---
streetlightRouter.get("/contractor-wards", requireAttendanceRole(), listContractorWardsHandler);
streetlightRouter.post("/contractor-wards", requireAttendanceRole([...REGISTRY_MANAGE_ROLES]), assignContractorWardHandler);

// --- Faults - any logged-in attendance role can report ("all staff"), per what was explicitly asked for ---
streetlightRouter.get("/faults", requireAttendanceRole(), listFaultsHandler);
streetlightRouter.post("/faults", requireAttendanceRole(), reportFaultHandler);
streetlightRouter.patch(
  "/faults/:id/repaired",
  requireAttendanceRole(["streetlight_contractor", ...REGISTRY_MANAGE_ROLES]),
  markFaultRepairedHandler,
);
streetlightRouter.patch("/faults/:id/link-light", requireAttendanceRole([...REGISTRY_MANAGE_ROLES]), linkFaultToLightHandler);

// --- Penalties ---
streetlightRouter.get("/faults/:id/penalties", requireAttendanceRole(), listFaultPenaltiesHandler);
streetlightRouter.get("/penalties", requireAttendanceRole([...OVERSIGHT_ROLES]), listAllPenaltiesHandler);
streetlightRouter.get("/penalties/mine", requireAttendanceRole(), myPenaltyTotalHandler);
