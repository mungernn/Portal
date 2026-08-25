export type AttendanceRole = "jamadar" | "driver_supervisor" | "sanitation_officer" | "sanitation_prabhari" | "attendance_admin";

export const ATTENDANCE_ROLES: AttendanceRole[] = [
  "jamadar",
  "driver_supervisor",
  "sanitation_officer",
  "sanitation_prabhari",
  "attendance_admin",
];

export const ATTENDANCE_ROLE_LABELS: Record<AttendanceRole, string> = {
  jamadar: "Jamadar",
  driver_supervisor: "Driver Supervisor",
  sanitation_officer: "Sanitation Officer",
  sanitation_prabhari: "Sanitation Prabhari",
  attendance_admin: "Attendance Admin",
};

/** Ward-scoped roles must have a ward_id; cross-ward roles never do. */
export const WARD_SCOPED_ROLES: AttendanceRole[] = ["jamadar", "driver_supervisor"];
export const CROSS_WARD_ROLES: AttendanceRole[] = ["sanitation_officer", "sanitation_prabhari", "attendance_admin"];

export interface AttendanceUserRow {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  role: AttendanceRole;
  ward_id: number | null;
  active: boolean;
}

export interface AttendanceLoginResult {
  token: string;
  user: {
    id: number;
    username: string;
    displayName: string;
    role: AttendanceRole;
    wardId: number | null;
    wardName: string | null;
  };
}

/** Payload embedded in the JWT - a distinct `type` from "operator"/"admin" so tokens can never cross over between the systems. */
export interface AttendanceTokenPayload {
  type: "attendance";
  sub: number; // attendance_users id
  username: string;
  displayName: string;
  role: AttendanceRole;
  wardId: number | null;
}

export interface AttendanceWardRow {
  id: number;
  ward_name: string;
}

export interface AttendanceShiftRow {
  id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
}

export type AttendanceStatus = "present" | "half_day" | "absent_informed" | "absent_not_informed" | "absent";

export interface FieldStaffRow {
  id: number;
  name: string;
  external_id: string | null;
  ward_id: number;
  shift_id: number | null;
  active: boolean;
}

export interface FieldStaffAttendanceRow {
  id: number;
  date: string;
  staff_id: number;
  staff_name: string;
  ward_id: number;
  in_time: Date | null;
  out_time: Date | null;
  status: AttendanceStatus;
  marked_by: string;
  remarks: string | null;
}

export interface FieldStaffFeedbackRow {
  id: number;
  created_at: Date;
  staff_id: number;
  staff_name: string;
  ward_id: number;
  given_by: string;
  given_by_role: string;
  type: "positive" | "negative";
  comment: string | null;
}

export interface FieldStaffDailyPhotoRow {
  id: number;
  date: string;
  ward_id: number;
  uploaded_by: string;
  photo_path: string;
  uploaded_at: Date;
}

export interface FieldDriverRow {
  id: number;
  name: string;
  external_id: string | null;
  vehicle_number: string | null;
  chassis_number: string | null;
  dl_number: string | null;
  ward_no: string | null;
  ward_id: number;
  shift_id: number | null;
  active: boolean;
}

export interface FieldDriverAttendanceRow {
  id: number;
  date: string;
  driver_id: number;
  driver_name: string;
  ward_id: number;
  in_time: Date | null;
  out_time: Date | null;
  status: AttendanceStatus;
  marked_by: string;
  remarks: string | null;
}
