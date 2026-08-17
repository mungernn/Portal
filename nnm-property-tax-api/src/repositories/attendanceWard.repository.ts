import { pool } from "../config/db";
import type { AttendanceWardRow, AttendanceShiftRow } from "../types/attendance.types";

export const attendanceWardRepository = {
  async findById(id: number): Promise<AttendanceWardRow | null> {
    const { rows } = await pool.query<AttendanceWardRow>(`SELECT * FROM attendance_wards WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async listAll(): Promise<AttendanceWardRow[]> {
    const { rows } = await pool.query<AttendanceWardRow>(`SELECT * FROM attendance_wards ORDER BY ward_name ASC`);
    return rows;
  },

  async create(wardName: string): Promise<AttendanceWardRow> {
    const { rows } = await pool.query<AttendanceWardRow>(
      `INSERT INTO attendance_wards (ward_name) VALUES ($1) RETURNING *`,
      [wardName],
    );
    return rows[0]!;
  },
};

export const attendanceShiftRepository = {
  async findById(id: number): Promise<AttendanceShiftRow | null> {
    const { rows } = await pool.query<AttendanceShiftRow>(`SELECT * FROM attendance_shifts WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async listAll(): Promise<AttendanceShiftRow[]> {
    const { rows } = await pool.query<AttendanceShiftRow>(`SELECT * FROM attendance_shifts ORDER BY start_time ASC`);
    return rows;
  },

  async create(input: { shiftName: string; startTime: string; endTime: string; graceMinutes: number }): Promise<AttendanceShiftRow> {
    const { rows } = await pool.query<AttendanceShiftRow>(
      `INSERT INTO attendance_shifts (shift_name, start_time, end_time, grace_minutes) VALUES ($1,$2,$3,$4) RETURNING *`,
      [input.shiftName, input.startTime, input.endTime, input.graceMinutes],
    );
    return rows[0]!;
  },
};
