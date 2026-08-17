import { pool } from "../config/db";
import type { AttendanceUserRow, AttendanceRole } from "../types/attendance.types";

export const attendanceUserRepository = {
  async findByUsername(username: string): Promise<AttendanceUserRow | null> {
    const { rows } = await pool.query<AttendanceUserRow>(
      `SELECT * FROM attendance_users WHERE username = $1 AND active = TRUE LIMIT 1`,
      [username],
    );
    return rows[0] ?? null;
  },

  async findById(id: number): Promise<AttendanceUserRow | null> {
    const { rows } = await pool.query<AttendanceUserRow>(`SELECT * FROM attendance_users WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async listAll(): Promise<AttendanceUserRow[]> {
    const { rows } = await pool.query<AttendanceUserRow>(`SELECT * FROM attendance_users ORDER BY display_name ASC`);
    return rows;
  },

  async create(input: {
    username: string;
    passwordHash: string;
    displayName: string;
    role: AttendanceRole;
    wardId: number | null;
  }): Promise<AttendanceUserRow> {
    const { rows } = await pool.query<AttendanceUserRow>(
      `INSERT INTO attendance_users (username, password_hash, display_name, role, ward_id)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [input.username, input.passwordHash, input.displayName, input.role, input.wardId],
    );
    return rows[0]!;
  },

  async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    await pool.query(`UPDATE attendance_users SET password_hash = $2, last_modified_at = now() WHERE id = $1`, [id, passwordHash]);
  },

  async setActive(id: number, active: boolean): Promise<AttendanceUserRow | null> {
    const { rows } = await pool.query<AttendanceUserRow>(
      `UPDATE attendance_users SET active = $2, last_modified_at = now() WHERE id = $1 RETURNING *`,
      [id, active],
    );
    return rows[0] ?? null;
  },
};
