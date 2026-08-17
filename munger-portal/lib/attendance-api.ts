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
