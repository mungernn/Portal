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
    externalId: string | null;
    vehicleNumber: string | null;
    chassisNumber: string | null;
    dlNumber: string | null;
    wardNo: string | null;
    wardId: number;
    shiftId: number | null;
  }): Promise<FieldDriverRow> {
    const { rows } = await pool.query<FieldDriverRow>(
      `INSERT INTO field_drivers (name, external_id, vehicle_number, chassis_number, dl_number, ward_no, ward_id, shift_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [input.name, input.externalId, input.vehicleNumber, input.chassisNumber, input.dlNumber, input.wardNo, input.wardId, input.shiftId],
    );
    return rows[0]!;
  },

  /** Preferred match for the bulk-upload sync when a source system id is available - see migration 020. */
  async findByExternalId(externalId: string): Promise<FieldDriverRow | null> {
    const { rows } = await pool.query<FieldDriverRow>(`SELECT * FROM field_drivers WHERE external_id = $1 LIMIT 1`, [externalId]);
    return rows[0] ?? null;
  },

  async findByNameAndWard(name: string, wardId: number): Promise<FieldDriverRow | null> {
    const { rows } = await pool.query<FieldDriverRow>(
      `SELECT * FROM field_drivers WHERE lower(name) = lower($1) AND ward_id = $2 LIMIT 1`,
      [name, wardId],
    );
    return rows[0] ?? null;
  },

  async setActive(id: number, active: boolean): Promise<FieldDriverRow | null> {
    const { rows } = await pool.query<FieldDriverRow>(`UPDATE field_drivers SET active = $2 WHERE id = $1 RETURNING *`, [id, active]);
    return rows[0] ?? null;
  },

  async update(
    id: number,
    input: {
      name?: string;
      vehicleNumber: string | null;
      chassisNumber: string | null;
      dlNumber: string | null;
      wardNo: string | null;
      wardId?: number;
      shiftId: number | null;
      active: boolean;
    },
  ): Promise<FieldDriverRow | null> {
    const { rows } = await pool.query<FieldDriverRow>(
      `UPDATE field_drivers
       SET name = COALESCE($2, name), vehicle_number = $3, chassis_number = $4, dl_number = $5,
           ward_no = $6, ward_id = COALESCE($7, ward_id), shift_id = $8, active = $9
       WHERE id = $1 RETURNING *`,
      [id, input.name ?? null, input.vehicleNumber, input.chassisNumber, input.dlNumber, input.wardNo, input.wardId ?? null, input.shiftId, input.active],
    );
    return rows[0] ?? null;
  },

  async listActiveIds(): Promise<number[]> {
    const { rows } = await pool.query<{ id: number }>(`SELECT id FROM field_drivers WHERE active = TRUE`);
    return rows.map((r) => r.id);
  },

  async setActiveMany(ids: number[], active: boolean): Promise<void> {
    if (ids.length === 0) return;
    await pool.query(`UPDATE field_drivers SET active = $2 WHERE id = ANY($1::bigint[])`, [ids, active]);
  },
};
