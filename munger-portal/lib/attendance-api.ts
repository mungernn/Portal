import { getAttendanceToken } from "./attendance-auth";
import type { AttendanceRole } from "./attendance-auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_PROPERTY_TAX_API_URL || "http://localhost:4000/api/v1";

function authHeaders(): HeadersInit {
  const token = getAttendanceToken();
  if (!token) throw new Error("Not logged in - please log in again.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ---------------------------------------------------------------------------
// Wards / Shifts (lookup data)
// ---------------------------------------------------------------------------

export interface AttendanceWard {
  id: number;
  wardName: string;
}

export async function fetchAttendanceWards(): Promise<AttendanceWard[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/wards`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load wards.");
  const data: { wards: AttendanceWard[] } = await res.json();
  return data.wards;
}

export interface AttendanceShift {
  id: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
}

export async function fetchAttendanceShifts(): Promise<AttendanceShift[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/shifts`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load shifts.");
  const data: { shifts: AttendanceShift[] } = await res.json();
  return data.shifts;
}

// ---------------------------------------------------------------------------
// Field staff attendance (Jamadar)
// ---------------------------------------------------------------------------

export interface WardWorkerToday {
  staffId: number;
  name: string;
  shiftName: string | null;
  inTime: string | null;
  outTime: string | null;
  status: string | null;
}

export async function fetchWardWorkersToday(wardId: number): Promise<WardWorkerToday[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/ward/${wardId}/today`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load today's worker list.");
  const data: { workers: WardWorkerToday[] } = await res.json();
  return data.workers;
}

export async function markStaffIn(staffId: number): Promise<{ inTime: string; status: string }> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/${staffId}/mark-in`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not mark in-time.");
  }
  return res.json();
}

export async function markStaffAbsent(staffId: number, informed: boolean): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/${staffId}/mark-absent`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ informed }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not mark absence.");
  }
  return res.json();
}

export async function markStaffOut(staffId: number): Promise<{ outTime: string }> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/${staffId}/mark-out`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not mark out-time.");
  }
  return res.json();
}

export async function markStaffAbsentByOfficer(staffId: number, date?: string, remarks?: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/${staffId}/mark-absent-officer`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ date: date ?? null, remarks: remarks ?? null }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not mark absence.");
  }
}

// ---------------------------------------------------------------------------
// Drivers (Driver Supervisor)
// ---------------------------------------------------------------------------

export interface WardDriverToday {
  driverId: number;
  name: string;
  vehicleNumber: string | null;
  shiftName: string | null;
  inTime: string | null;
  outTime: string | null;
  status: string | null;
}

export async function fetchWardDriversToday(wardId: number): Promise<WardDriverToday[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/drivers/ward/${wardId}/today`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load today's driver list.");
  const data: { drivers: WardDriverToday[] } = await res.json();
  return data.drivers;
}

export async function markDriverIn(driverId: number): Promise<{ inTime: string; status: string }> {
  const res = await fetch(`${API_BASE_URL}/attendance/drivers/${driverId}/mark-in`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not mark in-time.");
  }
  return res.json();
}

export async function markDriverAbsent(driverId: number, informed: boolean): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/attendance/drivers/${driverId}/mark-absent`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ informed }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not mark absence.");
  }
  return res.json();
}

export async function markDriverOut(driverId: number): Promise<{ outTime: string }> {
  const res = await fetch(`${API_BASE_URL}/attendance/drivers/${driverId}/mark-out`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not mark out-time.");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Assistant daily attendance - mirrors the driver attendance functions above exactly.
// ---------------------------------------------------------------------------

export interface WardAssistantToday {
  assistantId: number;
  name: string;
  driverId: number;
  shiftName: string | null;
  inTime: string | null;
  outTime: string | null;
  status: string | null;
}

export async function fetchWardAssistantsToday(wardId: number): Promise<WardAssistantToday[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/assistants/ward/${wardId}/today`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load today's assistant list.");
  const data: { assistants: WardAssistantToday[] } = await res.json();
  return data.assistants;
}

export async function markAssistantIn(assistantId: number): Promise<{ inTime: string; status: string }> {
  const res = await fetch(`${API_BASE_URL}/attendance/assistants/${assistantId}/mark-in`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not mark in-time.");
  }
  return res.json();
}

export async function markAssistantAbsent(assistantId: number, informed: boolean): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/attendance/assistants/${assistantId}/mark-absent`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ informed }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not mark absence.");
  }
  return res.json();
}

export async function markAssistantOut(assistantId: number): Promise<{ outTime: string }> {
  const res = await fetch(`${API_BASE_URL}/attendance/assistants/${assistantId}/mark-out`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not mark out-time.");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Daily group photo
// ---------------------------------------------------------------------------

export async function uploadWardPhoto(base64Data: string, mimeType: string): Promise<{ path: string }> {
  const res = await fetch(`${API_BASE_URL}/attendance/photos/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ base64Data, mimeType }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Photo upload failed.");
  }
  return res.json();
}

export interface WardPhotoInfo {
  wardId: number;
  wardName: string;
  path: string | null;
  uploadedBy: string | null;
}

export async function fetchWardPhotoToday(wardId: number): Promise<WardPhotoInfo | null> {
  const res = await fetch(`${API_BASE_URL}/attendance/photos/ward/${wardId}/today`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not check today's photo.");
  const data: { photo: WardPhotoInfo | null } = await res.json();
  return data.photo;
}

export async function fetchAllWardPhotos(date?: string): Promise<WardPhotoInfo[]> {
  const qs = date ? `?date=${date}` : "";
  const res = await fetch(`${API_BASE_URL}/attendance/photos/all${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load ward photos.");
  const data: { wards: WardPhotoInfo[] } = await res.json();
  return data.wards;
}

function wardPhotoFileUrl(wardId: number, date?: string): string {
  const qs = date ? `?date=${date}` : "";
  return `${API_BASE_URL}/attendance/photos/file/ward/${wardId}${qs}`;
}

/** The photo-file endpoint requires an Authorization header, which a plain <img src> can't send - fetch it as a blob and hand back an object URL instead. */
export async function fetchWardPhotoBlobUrl(wardId: number, date?: string): Promise<string> {
  const token = getAttendanceToken();
  if (!token) throw new Error("Not logged in - please log in again.");
  const res = await fetch(wardPhotoFileUrl(wardId, date), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Could not load photo.");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export async function submitStaffFeedback(staffId: number, type: "positive" | "negative", comment: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/${staffId}/feedback`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ type, comment: comment || null }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not submit feedback.");
  }
}

export interface FeedbackEntry {
  timestamp: string;
  givenBy: string;
  role: string;
  type: "positive" | "negative";
  comment: string | null;
}

export async function fetchStaffFeedback(staffId: number): Promise<FeedbackEntry[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/${staffId}/feedback`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load feedback.");
  const data: { feedback: FeedbackEntry[] } = await res.json();
  return data.feedback;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface ReportFilters {
  fromDate?: string;
  toDate?: string;
  wardId?: number;
}

export interface StaffReportRow {
  staffId: number;
  name: string;
  wardId: number;
  present: number;
  halfDay: number;
  absentInformed: number;
  absentNotInformed: number;
  positive: number;
  negative: number;
}

export interface DailyLogEntry {
  date: string;
  staffId: number;
  name: string;
  wardId: number;
  inTime: string | null;
  outTime: string | null;
  status: string;
}

export interface StaffReportResult {
  wardName: string;
  rows: StaffReportRow[];
  dailyLog: DailyLogEntry[];
}

function buildQuery(filters: ReportFilters): string {
  const params = new URLSearchParams();
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.wardId) params.set("wardId", String(filters.wardId));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchStaffReport(filters: ReportFilters): Promise<StaffReportResult> {
  const res = await fetch(`${API_BASE_URL}/attendance/reports/staff${buildQuery(filters)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load the staff report.");
  return res.json();
}

export interface DriverReportRow {
  staffId: number;
  name: string;
  wardId: number;
  vehicleNumber: string;
  present: number;
  halfDay: number;
  absentInformed: number;
  absentNotInformed: number;
}

export interface DriverDailyLogEntry {
  date: string;
  staffId: number;
  name: string;
  wardId: number;
  vehicleNumber: string;
  inTime: string | null;
  outTime: string | null;
  status: string;
}

export interface DriverReportResult {
  wardName: string;
  rows: DriverReportRow[];
  dailyLog: DriverDailyLogEntry[];
}

export async function fetchDriverReport(filters: ReportFilters): Promise<DriverReportResult> {
  const res = await fetch(`${API_BASE_URL}/attendance/reports/drivers${buildQuery(filters)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load the driver report.");
  return res.json();
}

// ---------------------------------------------------------------------------
// Monthly report downloads
// ---------------------------------------------------------------------------

async function downloadFile(path: string, filenameFallback: string): Promise<void> {
  const token = getAttendanceToken();
  if (!token) throw new Error("Not logged in - please log in again.");
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Download failed.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const disposition = res.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="(.+)"/);
  a.download = match ? match[1]! : filenameFallback;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadMonthlyStaffReport(year: number, month: number): Promise<void> {
  await downloadFile(
    `/attendance/reports/monthly/staff.csv?year=${year}&month=${month}`,
    `staff-attendance-${year}-${String(month).padStart(2, "0")}.csv`,
  );
}

export async function downloadMonthlyDriverReport(year: number, month: number): Promise<void> {
  await downloadFile(
    `/attendance/reports/monthly/drivers.csv?year=${year}&month=${month}`,
    `driver-attendance-${year}-${String(month).padStart(2, "0")}.csv`,
  );
}

// ---------------------------------------------------------------------------
// User management (Attendance Admin)
// ---------------------------------------------------------------------------

export interface AttendanceUserSummary {
  id: number;
  username: string;
  displayName: string;
  role: AttendanceRole;
  wardId: number | null;
  wardName: string | null;
  active: boolean;
}

export async function fetchAttendanceUsers(): Promise<AttendanceUserSummary[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load users.");
  const data: { users: AttendanceUserSummary[] } = await res.json();
  return data.users;
}

export interface CreateAttendanceUserInput {
  username: string;
  password: string;
  displayName: string;
  role: AttendanceRole;
  wardId: number | null;
}

export async function createAttendanceUserApi(input: CreateAttendanceUserInput): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not create user.");
  }
}

export async function setAttendanceUserActive(id: number, active: boolean): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/users/${id}/active`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error("Could not update user status.");
}

// ---------------------------------------------------------------------------
// Officer dashboard summary
// ---------------------------------------------------------------------------

export interface StatusBreakdown {
  present: number;
  halfDay: number;
  absentInformed: number;
  absentNotInformed: number;
  notYetMarked: number;
}

export interface AttendanceDashboardSummary {
  wards: { total: number };
  staff: { total: number; today: StatusBreakdown };
  drivers: { total: number; today: StatusBreakdown };
  photos: { uploadedToday: number; totalWards: number };
}

export async function fetchAttendanceDashboardSummary(): Promise<AttendanceDashboardSummary> {
  const res = await fetch(`${API_BASE_URL}/attendance/dashboard-summary`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load the dashboard summary.");
  return res.json();
}

// ---------------------------------------------------------------------------
// Field staff roster management (attendance_admin only)
// ---------------------------------------------------------------------------

export interface FieldStaffSummary {
  id: number;
  name: string;
  externalId: string | null;
  wardId: number;
  shiftId: number | null;
  active: boolean;
  roleIds: number[];
}

export async function fetchAllFieldStaff(): Promise<FieldStaffSummary[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load staff list.");
  const data: { staff: FieldStaffSummary[] } = await res.json();
  return data.staff;
}

export async function createFieldStaff(input: {
  name: string;
  externalId?: string | null;
  wardId: number;
  shiftId: number | null;
  roleIds?: number[];
}): Promise<FieldStaffSummary> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not add staff member.");
  }
  const data: { staff: FieldStaffSummary } = await res.json();
  return data.staff;
}

export async function setFieldStaffActive(id: number, active: boolean): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/${id}/active`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error("Could not update staff status.");
}

/** attendance_admin OR sanitation_officer - moves a worker to a different ward (and optionally shift). */
export async function transferFieldStaff(id: number, wardId: number, shiftId: number | null): Promise<FieldStaffSummary> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/${id}/transfer`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ wardId, shiftId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not transfer staff member.");
  }
  const data: { staff: FieldStaffSummary } = await res.json();
  return data.staff;
}

export interface RosterSyncResult {
  created: number;
  updated: number;
  deactivated: number;
  errors: { row: number; message: string }[];
}

export async function uploadFieldStaffRosterCsv(csvContent: string): Promise<RosterSyncResult> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/bulk-upload`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ csvContent }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Upload failed.");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Field driver roster management (attendance_admin only)
// ---------------------------------------------------------------------------

export interface FieldDriverSummary {
  id: number;
  name: string;
  externalId: string | null;
  dlNumber: string | null;
  wardId: number;
  shiftId: number | null;
  active: boolean;
  assetId: number | null;
  supervisorId: number | null;
}

export async function fetchAllFieldDrivers(): Promise<FieldDriverSummary[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/drivers/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load driver list.");
  const data: { drivers: FieldDriverSummary[] } = await res.json();
  return data.drivers;
}

export async function createFieldDriver(input: {
  name: string;
  externalId?: string | null;
  dlNumber: string | null;
  wardId: number;
  shiftId: number | null;
  assetId: number | null;
}): Promise<FieldDriverSummary> {
  const res = await fetch(`${API_BASE_URL}/attendance/drivers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not add driver.");
  }
  const data: { driver: FieldDriverSummary } = await res.json();
  return data.driver;
}

export async function setFieldDriverActive(id: number, active: boolean): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/drivers/${id}/active`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error("Could not update driver status.");
}

/** attendance_admin only - which asset this driver operates and/or which driver_supervisor oversees them. Cascades automatically to any assistants already tied to this driver. */
export async function assignFieldDriver(id: number, assetId: number | null, supervisorId: number | null): Promise<FieldDriverSummary> {
  const res = await fetch(`${API_BASE_URL}/attendance/drivers/${id}/assign`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ assetId, supervisorId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not assign driver.");
  }
  const data: { driver: FieldDriverSummary } = await res.json();
  return data.driver;
}

/** attendance_admin OR sanitation_officer - moves a driver to a different ward (and optionally shift). */
export async function transferFieldDriver(id: number, wardId: number, shiftId: number | null): Promise<FieldDriverSummary> {
  const res = await fetch(`${API_BASE_URL}/attendance/drivers/${id}/transfer`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ wardId, shiftId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not transfer driver.");
  }
  const data: { driver: FieldDriverSummary } = await res.json();
  return data.driver;
}

export async function uploadFieldDriverRosterCsv(csvContent: string): Promise<RosterSyncResult> {
  const res = await fetch(`${API_BASE_URL}/attendance/drivers/bulk-upload`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ csvContent }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Upload failed.");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Assets (vehicles, tricycles, hand carts) - view: any attendance login; edit: attendance_admin + 3 fleet roles
// ---------------------------------------------------------------------------

export interface AssetSummary {
  id: number;
  assetType: "vehicle" | "tricycle" | "hand_cart";
  label: string;
  vehicleNumber: string | null;
  chassisNumber: string | null;
  currentStatus: "working" | "under_repair" | "not_working";
  notWorkingSince: string | null;
  soundSystemStatus: string | null;
  batteryStatus: string | null;
  active: boolean;
  wardIds: number[];
  lastServicedOn: string | null;
  lastRepairedOn: string | null;
  trackingType: "km" | "hours" | null;
  latestLogbookReading: { logDate: string; reading: string } | null;
}

export async function fetchAllAssets(): Promise<AssetSummary[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/assets`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load the asset list.");
  const data: { assets: AssetSummary[] } = await res.json();
  return data.assets;
}

export async function createAsset(input: {
  assetType: "vehicle" | "tricycle" | "hand_cart";
  label: string;
  vehicleNumber: string | null;
  chassisNumber: string | null;
  trackingType?: "km" | "hours" | null;
  wardIds?: number[];
}): Promise<AssetSummary> {
  const res = await fetch(`${API_BASE_URL}/attendance/assets`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not add asset.");
  }
  const data: { asset: AssetSummary } = await res.json();
  return data.asset;
}

export async function setAssetWards(id: number, wardIds: number[]): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/assets/${id}/wards`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ wardIds }),
  });
  if (!res.ok) throw new Error("Could not update assigned wards.");
}

export async function setAssetActive(id: number, active: boolean): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/assets/${id}/active`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error("Could not update asset status.");
}

export interface AssetMaintenanceLogEntry {
  id: number;
  logType: "service" | "repair" | "status_update" | "note";
  logDate: string;
  notes: string | null;
  loggedBy: string;
  createdAt: string;
}

export async function fetchAssetMaintenanceLog(assetId: number): Promise<AssetMaintenanceLogEntry[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/assets/${assetId}/maintenance-log`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load maintenance history.");
  const data: { log: AssetMaintenanceLogEntry[] } = await res.json();
  return data.log;
}

export async function logAssetMaintenance(
  assetId: number,
  input: {
    logType: "service" | "repair" | "status_update" | "note";
    logDate: string;
    notes: string | null;
    updateStatus?: {
      currentStatus: "working" | "under_repair" | "not_working";
      notWorkingSince: string | null;
      soundSystemStatus: string | null;
      batteryStatus: string | null;
    } | null;
  },
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/assets/${assetId}/maintenance-log`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not log maintenance entry.");
  }
}

// ---------------------------------------------------------------------------
// Asset tracking type + daily logbook
// ---------------------------------------------------------------------------

export async function setAssetTrackingType(assetId: number, trackingType: "km" | "hours" | null): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/assets/${assetId}/tracking-type`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ trackingType }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not update tracking type.");
  }
}

export interface AssetLogbookEntry {
  id: number;
  logDate: string;
  reading: string;
  delta: string | null;
  recordedBy: string;
  notes: string | null;
}

export async function fetchAssetLogbook(assetId: number): Promise<{ trackingType: "km" | "hours" | null; entries: AssetLogbookEntry[] }> {
  const res = await fetch(`${API_BASE_URL}/attendance/assets/${assetId}/logbook`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load the logbook.");
  return res.json();
}

/** driver_supervisor + attendance_admin - one entry per asset per day, the absolute odometer/hour-meter reading (not a delta). */
export async function logAssetReading(assetId: number, input: { logDate: string; reading: number; notes: string | null }): Promise<AssetLogbookEntry> {
  const res = await fetch(`${API_BASE_URL}/attendance/assets/${assetId}/logbook`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not log the reading.");
  }
  const data: { entry: AssetLogbookEntry } = await res.json();
  return data.entry;
}

// ---------------------------------------------------------------------------
// Field assistants
// ---------------------------------------------------------------------------

export interface FieldAssistantSummary {
  id: number;
  name: string;
  externalId: string | null;
  driverId: number;
  wardId: number;
  shiftId: number | null;
  active: boolean;
  supervisorId: number | null;
}

export async function fetchAllFieldAssistants(): Promise<FieldAssistantSummary[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/assistants/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load assistant list.");
  const data: { assistants: FieldAssistantSummary[] } = await res.json();
  return data.assistants;
}

export async function createFieldAssistant(input: {
  name: string;
  externalId?: string | null;
  driverId: number;
  wardId: number;
  shiftId: number | null;
}): Promise<FieldAssistantSummary> {
  const res = await fetch(`${API_BASE_URL}/attendance/assistants`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not add assistant.");
  }
  const data: { assistant: FieldAssistantSummary } = await res.json();
  return data.assistant;
}

export async function setFieldAssistantActive(id: number, active: boolean): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/assistants/${id}/active`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error("Could not update assistant status.");
}

/** attendance_admin OR sanitation_officer - moves an assistant to a different ward (and optionally shift). */
export async function transferFieldAssistant(id: number, wardId: number, shiftId: number | null): Promise<FieldAssistantSummary> {
  const res = await fetch(`${API_BASE_URL}/attendance/assistants/${id}/transfer`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ wardId, shiftId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not transfer assistant.");
  }
  const data: { assistant: FieldAssistantSummary } = await res.json();
  return data.assistant;
}

/** attendance_admin only - changes which driver this assistant works under; supervisor is re-inherited from that driver automatically. */
export async function reassignFieldAssistantDriver(id: number, driverId: number): Promise<FieldAssistantSummary> {
  const res = await fetch(`${API_BASE_URL}/attendance/assistants/${id}/reassign-driver`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ driverId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not reassign assistant.");
  }
  const data: { assistant: FieldAssistantSummary } = await res.json();
  return data.assistant;
}

export async function uploadFieldAssistantRosterCsv(csvContent: string): Promise<RosterSyncResult> {
  const res = await fetch(`${API_BASE_URL}/attendance/assistants/bulk-upload`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ csvContent }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Upload failed.");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Staff job roles
// ---------------------------------------------------------------------------

export interface StaffJobRoleSummary {
  id: number;
  roleName: string;
}

export async function fetchStaffJobRoles(): Promise<StaffJobRoleSummary[]> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff-job-roles`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load job roles.");
  const data: { roles: StaffJobRoleSummary[] } = await res.json();
  return data.roles;
}

export async function setStaffJobRoles(staffId: number, roleIds: number[]): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attendance/staff/${staffId}/roles`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ roleIds }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not update roles.");
  }
}
