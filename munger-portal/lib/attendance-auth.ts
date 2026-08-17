const TOKEN_KEY = "nnm_attendance_token";
const USER_KEY = "nnm_attendance_user";

export type AttendanceRole = "jamadar" | "driver_supervisor" | "sanitation_officer" | "sanitation_prabhari" | "attendance_admin";

export const ATTENDANCE_ROLE_LABELS: Record<AttendanceRole, string> = {
  jamadar: "Jamadar",
  driver_supervisor: "Driver Supervisor",
  sanitation_officer: "Sanitation Officer",
  sanitation_prabhari: "Sanitation Prabhari",
  attendance_admin: "Attendance Admin",
};

export const WARD_SCOPED_ROLES: AttendanceRole[] = ["jamadar", "driver_supervisor"];
export const OFFICER_ROLES: AttendanceRole[] = ["sanitation_officer", "sanitation_prabhari", "attendance_admin"];

export interface AttendanceUserInfo {
  id: number;
  username: string;
  displayName: string;
  role: AttendanceRole;
  wardId: number | null;
  wardName: string | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_PROPERTY_TAX_API_URL || "http://localhost:4000/api/v1";

export async function attendanceLogin(username: string, password: string): Promise<AttendanceUserInfo> {
  const res = await fetch(`${API_BASE_URL}/attendance/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Incorrect username or password.");
    throw new Error("Login failed. Please try again.");
  }

  const data: { token: string; user: AttendanceUserInfo } = await res.json();

  // Session storage - cleared automatically when the browser tab closes,
  // same reasoning as the operator/admin logins: this is a shared
  // ward-office terminal, not a personal device.
  sessionStorage.setItem(TOKEN_KEY, data.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));

  return data.user;
}

export function getAttendanceToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getAttendanceUserInfo(): AttendanceUserInfo | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AttendanceUserInfo) : null;
}

export function attendanceLogout(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
