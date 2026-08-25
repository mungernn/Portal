import { Router } from "express";
import { postAttendanceLogin } from "../controllers/attendanceAuth.controller";
import { getAttendanceWards, getAttendanceShifts } from "../controllers/attendanceLookup.controller";
import {
  getMyWardWorkersToday,
  postMarkStaffIn,
  postMarkStaffAbsent,
  postMarkStaffOut,
  postMarkStaffAbsentByOfficer,
} from "../controllers/fieldStaffAttendance.controller";
import {
  getMyWardDriversToday,
  postMarkDriverIn,
  postMarkDriverAbsent,
  postMarkDriverOut,
} from "../controllers/fieldDriverAttendance.controller";
import {
  postUploadWardPhoto,
  getWardPhotoToday,
  getWardPhotoByDate,
  getAllWardsPhotoRoundup,
  getWardPhotoFile,
} from "../controllers/fieldStaffDailyPhoto.controller";
import { postStaffFeedback, getStaffFeedbackHandler } from "../controllers/fieldStaffFeedback.controller";
import { getAttendanceStaffReport, getAttendanceDriverReport } from "../controllers/attendanceReport.controller";
import { downloadStaffMonthlyReport, downloadDriverMonthlyReport } from "../controllers/attendanceMonthlyReport.controller";
import { requireAttendanceReportAccess } from "../middleware/requireAttendanceReportAccess";
import {
  listAttendanceUsersHandler,
  createAttendanceUserHandler,
  setAttendanceUserActiveHandler,
} from "../controllers/attendanceUserManagement.controller";
import { getAttendanceDashboardSummaryHandler } from "../controllers/attendanceDashboardSummary.controller";
import {
  listAllStaffHandler,
  createStaffHandler,
  setStaffActiveHandler,
  transferStaffHandler,
  uploadStaffRosterHandler,
  listAllDriversHandler,
  createDriverHandler,
  setDriverActiveHandler,
  transferDriverHandler,
  uploadDriverRosterHandler,
} from "../controllers/fieldRoster.controller";
import { requireAttendanceRole } from "../middleware/requireAttendanceRole";
import { loginRateLimiter } from "../middleware/loginRateLimiter";

export const attendanceRouter = Router();

const OFFICER_ROLES = ["sanitation_officer", "sanitation_prabhari", "attendance_admin"] as const;

// Public
attendanceRouter.post("/auth/login", loginRateLimiter, postAttendanceLogin);

// Any authenticated attendance user (dropdown data)
attendanceRouter.get("/wards", requireAttendanceRole(), getAttendanceWards);
attendanceRouter.get("/shifts", requireAttendanceRole(), getAttendanceShifts);

// --- Field staff (Jamadar, own ward - any officer role can pass a wardId in the URL to view any ward, e.g. for feedback lookup) ---
attendanceRouter.get(
  "/staff/ward/:wardId/today",
  requireAttendanceRole(["jamadar", ...OFFICER_ROLES]),
  getMyWardWorkersToday,
);
attendanceRouter.post("/staff/:staffId/mark-in", requireAttendanceRole(["jamadar", "attendance_admin"]), postMarkStaffIn);
attendanceRouter.post(
  "/staff/:staffId/mark-absent",
  requireAttendanceRole(["jamadar", "attendance_admin"]),
  postMarkStaffAbsent,
);
attendanceRouter.post("/staff/:staffId/mark-out", requireAttendanceRole(["jamadar", "attendance_admin"]), postMarkStaffOut);
attendanceRouter.post(
  "/staff/:staffId/mark-absent-officer",
  requireAttendanceRole([...OFFICER_ROLES]),
  postMarkStaffAbsentByOfficer,
);

// --- Drivers (Driver Supervisor, own ward - any officer role can pass a wardId in the URL) ---
attendanceRouter.get(
  "/drivers/ward/:wardId/today",
  requireAttendanceRole(["driver_supervisor", ...OFFICER_ROLES]),
  getMyWardDriversToday,
);
attendanceRouter.post(
  "/drivers/:driverId/mark-in",
  requireAttendanceRole(["driver_supervisor", "attendance_admin"]),
  postMarkDriverIn,
);
attendanceRouter.post(
  "/drivers/:driverId/mark-absent",
  requireAttendanceRole(["driver_supervisor", "attendance_admin"]),
  postMarkDriverAbsent,
);
attendanceRouter.post(
  "/drivers/:driverId/mark-out",
  requireAttendanceRole(["driver_supervisor", "attendance_admin"]),
  postMarkDriverOut,
);

// --- Daily group photo ---
attendanceRouter.post("/photos/upload", requireAttendanceRole(["jamadar"]), postUploadWardPhoto);
attendanceRouter.get(
  "/photos/ward/:wardId/today",
  requireAttendanceRole(["jamadar", ...OFFICER_ROLES]),
  getWardPhotoToday,
);
attendanceRouter.get("/photos/ward/:wardId", requireAttendanceRole([...OFFICER_ROLES]), getWardPhotoByDate);
attendanceRouter.get("/photos/all", requireAttendanceRole([...OFFICER_ROLES]), getAllWardsPhotoRoundup);
attendanceRouter.get(
  "/photos/file/ward/:wardId",
  requireAttendanceRole(["jamadar", ...OFFICER_ROLES]),
  getWardPhotoFile,
);

// --- Feedback ---
attendanceRouter.post("/staff/:staffId/feedback", requireAttendanceRole([...OFFICER_ROLES]), postStaffFeedback);
attendanceRouter.get("/staff/:staffId/feedback", requireAttendanceRole([...OFFICER_ROLES]), getStaffFeedbackHandler);

// --- Reports ---
attendanceRouter.get("/reports/staff", requireAttendanceRole([...OFFICER_ROLES]), getAttendanceStaffReport);
attendanceRouter.get("/reports/drivers", requireAttendanceRole([...OFFICER_ROLES]), getAttendanceDriverReport);

// --- Monthly report downloads (Sanitation Officer, Attendance Admin, or the property-tax Commissioner login) ---
attendanceRouter.get("/reports/monthly/staff.csv", requireAttendanceReportAccess, downloadStaffMonthlyReport);
attendanceRouter.get("/reports/monthly/drivers.csv", requireAttendanceReportAccess, downloadDriverMonthlyReport);

// --- User management (attendance_admin only) ---
attendanceRouter.get("/users", requireAttendanceRole(["attendance_admin"]), listAttendanceUsersHandler);
attendanceRouter.post("/users", requireAttendanceRole(["attendance_admin"]), createAttendanceUserHandler);
attendanceRouter.patch("/users/:id/active", requireAttendanceRole(["attendance_admin"]), setAttendanceUserActiveHandler);

// --- Field staff roster management ---
// GET/transfer: attendance_admin OR sanitation_officer (an officer
// needs to see the roster to transfer anyone, and can move workers
// between wards, but cannot create/rename/deactivate). Everything
// else here stays attendance_admin-only.
attendanceRouter.get("/staff/all", requireAttendanceRole(["attendance_admin", "sanitation_officer"]), listAllStaffHandler);
attendanceRouter.post("/staff", requireAttendanceRole(["attendance_admin"]), createStaffHandler);
attendanceRouter.patch("/staff/:id/active", requireAttendanceRole(["attendance_admin"]), setStaffActiveHandler);
attendanceRouter.patch("/staff/:id/transfer", requireAttendanceRole(["attendance_admin", "sanitation_officer"]), transferStaffHandler);
attendanceRouter.post("/staff/bulk-upload", requireAttendanceRole(["attendance_admin"]), uploadStaffRosterHandler);

// --- Field driver roster management (same admin/officer split as staff above) ---
attendanceRouter.get("/drivers/all", requireAttendanceRole(["attendance_admin", "sanitation_officer"]), listAllDriversHandler);
attendanceRouter.post("/drivers", requireAttendanceRole(["attendance_admin"]), createDriverHandler);
attendanceRouter.patch("/drivers/:id/active", requireAttendanceRole(["attendance_admin"]), setDriverActiveHandler);
attendanceRouter.patch("/drivers/:id/transfer", requireAttendanceRole(["attendance_admin", "sanitation_officer"]), transferDriverHandler);
attendanceRouter.post("/drivers/bulk-upload", requireAttendanceRole(["attendance_admin"]), uploadDriverRosterHandler);

// --- Officer dashboard ---
attendanceRouter.get(
  "/dashboard-summary",
  requireAttendanceRole([...OFFICER_ROLES]),
  getAttendanceDashboardSummaryHandler,
);
