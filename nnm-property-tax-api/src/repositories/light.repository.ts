import { pool } from "../config/db";
import type { LightRow } from "../types/streetlight.types";

export const lightRepository = {
  async findById(id: number): Promise<LightRow | null> {
    const { rows } = await pool.query<LightRow>(`SELECT * FROM lights WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async findBySerialNumber(serialNumber: string): Promise<LightRow | null> {
    const { rows } = await pool.query<LightRow>(`SELECT * FROM lights WHERE serial_number = $1`, [serialNumber]);
    return rows[0] ?? null;
  },

  /** lightType filters to just 'streetlight' or just 'high_mast' - the two lists are presented separately in the UI even though they share this one table. */
  async listAll(lightType?: "streetlight" | "high_mast"): Promise<LightRow[]> {
    if (lightType) {
      const { rows } = await pool.query<LightRow>(`SELECT * FROM lights WHERE light_type = $1 ORDER BY id DESC`, [lightType]);
      return rows;
    }
    const { rows } = await pool.query<LightRow>(`SELECT * FROM lights ORDER BY id DESC`);
    return rows;
  },

  async listByWard(wardId: number): Promise<LightRow[]> {
    const { rows } = await pool.query<LightRow>(`SELECT * FROM lights WHERE ward_id = $1 ORDER BY id DESC`, [wardId]);
    return rows;
  },

  async create(input: {
    lightType: "streetlight" | "high_mast";
    wardId: number;
    localityName: string;
    serialNumber: string;
    latitude: number;
    longitude: number;
    installationAgencyId: number | null;
    switchStatus?: "working" | "not_working" | "automatic" | "joint" | null;
  }): Promise<LightRow> {
    const { rows } = await pool.query<LightRow>(
      `INSERT INTO lights (light_type, ward_id, locality_name, serial_number, latitude, longitude, installation_agency_id, switch_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        input.lightType,
        input.wardId,
        input.localityName,
        input.serialNumber,
        input.latitude,
        input.longitude,
        input.installationAgencyId,
        input.switchStatus ?? null,
      ],
    );
    return rows[0]!;
  },

  async setActive(id: number, active: boolean): Promise<LightRow | null> {
    const { rows } = await pool.query<LightRow>(`UPDATE lights SET active = $2 WHERE id = $1 RETURNING *`, [id, active]);
    return rows[0] ?? null;
  },
};
