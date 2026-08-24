import { pool } from "../config/db";
import type { FieldStaffRow } from "../types/attendance.types";

export const fieldStaffRepository = {
  async findById(id: number): Promise<FieldStaffRow | null> {
    const { rows } = await pool.query<FieldStaffRow>(`SELECT * FROM field_staff WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async listByWard(wardId: number): Promise<FieldStaffRow[]> {
    const { rows } = await pool.query<FieldStaffRow>(
      `SELECT * FROM field_staff WHERE ward_id = $1 AND active = TRUE ORDER BY name ASC`,
      [wardId],
    );
    return rows;
  },

  async listAll(): Promise<FieldStaffRow[]> {
    const { rows } = await pool.query<FieldStaffRow>(`SELECT * FROM field_staff WHERE active = TRUE ORDER BY name ASC`);
    return rows;
  },

  async create(input: { name: string; wardId: number; shiftId: number | null }): Promise<FieldStaffRow> {
    const { rows } = await pool.query<FieldStaffRow>(
      `INSERT INTO field_staff (name, ward_id, shift_id) VALUES ($1,$2,$3) RETURNING *`,
      [input.name, input.wardId, input.shiftId],
    );
    return rows[0]!;
  },

  async findByNameAndWard(name: string, wardId: number): Promise<FieldStaffRow | null> {
    const { rows } = await pool.query<FieldStaffRow>(
      `SELECT * FROM field_staff WHERE lower(name) = lower($1) AND ward_id = $2 LIMIT 1`,
      [name, wardId],
    );
    return rows[0] ?? null;
  },

  async setActive(id: number, active: boolean): Promise<FieldStaffRow | null> {
    const { rows } = await pool.query<FieldStaffRow>(
      `UPDATE field_staff SET active = $2 WHERE id = $1 RETURNING *`,
      [id, active],
    );
    return rows[0] ?? null;
  },

  async update(id: number, input: { shiftId: number | null; active: boolean }): Promise<FieldStaffRow | null> {
    const { rows } = await pool.query<FieldStaffRow>(
      `UPDATE field_staff SET shift_id = $2, active = $3 WHERE id = $1 RETURNING *`,
      [id, input.shiftId, input.active],
    );
    return rows[0] ?? null;
  },

  /** Every staff id currently active, for the bulk-upload sync to know who to deactivate. */
  async listActiveIds(): Promise<number[]> {
    const { rows } = await pool.query<{ id: number }>(`SELECT id FROM field_staff WHERE active = TRUE`);
    return rows.map((r) => r.id);
  },

  async setActiveMany(ids: number[], active: boolean): Promise<void> {
    if (ids.length === 0) return;
    await pool.query(`UPDATE field_staff SET active = $2 WHERE id = ANY($1::bigint[])`, [ids, active]);
  },
};
