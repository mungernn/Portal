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

  /** Every active login holding a given role - used to find who currently holds a singular oversight role (e.g. city_manager, deputy_municipal_commissioner) for penalty attribution. If more than one person holds the role, all of them are returned - callers decide how to handle that. */
  async listByRole(role: AttendanceRole): Promise<AttendanceUserRow[]> {
    const { rows } = await pool.query<AttendanceUserRow>(
      `SELECT * FROM attendance_users WHERE role = $1 AND active = TRUE ORDER BY id ASC`,
      [role],
    );
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
