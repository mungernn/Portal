import { pool } from "../config/db";
import type { PyauRow } from "../types/pyau.types";

export const pyauRepository = {
  async findById(id: number): Promise<PyauRow | null> {
    const { rows } = await pool.query<PyauRow>(`SELECT * FROM pyaus WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async listAll(): Promise<PyauRow[]> {
    const { rows } = await pool.query<PyauRow>(`SELECT * FROM pyaus ORDER BY id DESC`);
    return rows;
  },

  async listByWard(wardId: number): Promise<PyauRow[]> {
    const { rows } = await pool.query<PyauRow>(`SELECT * FROM pyaus WHERE ward_id = $1 ORDER BY id DESC`, [wardId]);
    return rows;
  },

  async findBySerialNumber(serialNumber: string): Promise<PyauRow | null> {
    const { rows } = await pool.query<PyauRow>(`SELECT * FROM pyaus WHERE serial_number = $1`, [serialNumber]);
    return rows[0] ?? null;
  },

  /** Highest existing ward-sequential number for a ward's serials (e.g. "W3-07" -> 7) - used to generate the next one, both for one-by-one creation and CSV bulk import. */
  async maxSerialSequenceForWard(wardId: number): Promise<number> {
    const { rows } = await pool.query<{ serial_number: string }>(
      `SELECT serial_number FROM pyaus WHERE ward_id = $1 AND serial_number IS NOT NULL`,
      [wardId],
    );
    let max = 0;
    for (const row of rows) {
      const match = row.serial_number.match(/-(\d+)$/);
      if (match) max = Math.max(max, parseInt(match[1]!, 10));
    }
    return max;
  },

  async create(input: {
    wardId: number;
    serialNumber: string;
    locationAddress: string | null;
    schemeName: string | null;
    overheadTankCount: number;
    housesServed: number | null;
    structureType: "pcc_structure" | "iron_stand" | "nothing" | null;
    tankStandType: string | null;
    pumpDetails: string | null;
    boringDepthFeet: number | null;
    casingDetails: string | null;
    installedDate: string | null;
    builderName: string | null;
    builderContact: string | null;
    remarks: string | null;
    initialFunctionalStatus?: "functional" | "non_functional";
  }): Promise<PyauRow> {
    const { rows } = await pool.query<PyauRow>(
      `INSERT INTO pyaus
         (ward_id, serial_number, location_address, scheme_name, overhead_tank_count, houses_served, structure_type,
          tank_stand_type, pump_details, boring_depth_feet, casing_details, installed_date, builder_name, builder_contact, remarks, functional_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,COALESCE($16,'functional')) RETURNING *`,
      [
        input.wardId,
        input.serialNumber,
        input.locationAddress,
        input.schemeName,
        input.overheadTankCount,
        input.housesServed,
        input.structureType,
        input.tankStandType,
        input.pumpDetails,
        input.boringDepthFeet,
        input.casingDetails,
        input.installedDate,
        input.builderName,
        input.builderContact,
        input.remarks,
        input.initialFunctionalStatus ?? null,
      ],
    );
    return rows[0]!;
  },

  async setFunctionalStatus(id: number, status: "functional" | "non_functional"): Promise<PyauRow | null> {
    const { rows } = await pool.query<PyauRow>(`UPDATE pyaus SET functional_status = $2 WHERE id = $1 RETURNING *`, [id, status]);
    return rows[0] ?? null;
  },

  async setActive(id: number, active: boolean): Promise<PyauRow | null> {
    const { rows } = await pool.query<PyauRow>(`UPDATE pyaus SET active = $2 WHERE id = $1 RETURNING *`, [id, active]);
    return rows[0] ?? null;
  },
};
