import { pool } from "../config/db";
import type { FieldDriverRow } from "../types/attendance.types";

export const fieldDriverRepository = {
  async findById(id: number): Promise<FieldDriverRow | null> {
    const { rows } = await pool.query<FieldDriverRow>(`SELECT * FROM field_drivers WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async listByWard(wardId: number): Promise<FieldDriverRow[]> {
    const { rows } = await pool.query<FieldDriverRow>(
      `SELECT * FROM field_drivers WHERE ward_id = $1 AND active = TRUE ORDER BY name ASC`,
      [wardId],
    );
    return rows;
  },

  async listAll(): Promise<FieldDriverRow[]> {
    const { rows } = await pool.query<FieldDriverRow>(`SELECT * FROM field_drivers WHERE active = TRUE ORDER BY name ASC`);
    return rows;
  },

  async create(input: {
    name: string;
    vehicleNumber: string | null;
    chassisNumber: string | null;
    dlNumber: string | null;
    wardNo: string | null;
    wardId: number;
    shiftId: number | null;
  }): Promise<FieldDriverRow> {
    const { rows } = await pool.query<FieldDriverRow>(
      `INSERT INTO field_drivers (name, vehicle_number, chassis_number, dl_number, ward_no, ward_id, shift_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [input.name, input.vehicleNumber, input.chassisNumber, input.dlNumber, input.wardNo, input.wardId, input.shiftId],
    );
    return rows[0]!;
  },

  async setActive(id: number, active: boolean): Promise<FieldDriverRow | null> {
    const { rows } = await pool.query<FieldDriverRow>(`UPDATE field_drivers SET active = $2 WHERE id = $1 RETURNING *`, [id, active]);
    return rows[0] ?? null;
  },
};
