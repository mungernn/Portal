import { pool } from "../config/db";

export interface AssetRow {
  id: number;
  asset_type: "vehicle" | "tricycle" | "hand_cart";
  label: string;
  vehicle_number: string | null;
  chassis_number: string | null;
  current_status: "working" | "under_repair" | "not_working";
  not_working_since: string | null;
  sound_system_status: string | null;
  battery_status: string | null;
  active: boolean;
  created_at: string;
}

export const assetRepository = {
  async findById(id: number): Promise<AssetRow | null> {
    const { rows } = await pool.query<AssetRow>(`SELECT * FROM assets WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  /** includeArchived=false (default) hides active=false assets - archived is the everyday view; the toggle to see archived ones is explicit. */
  async listAll(includeArchived = false): Promise<AssetRow[]> {
    const where = includeArchived ? "" : "WHERE active = TRUE";
    const { rows } = await pool.query<AssetRow>(`SELECT * FROM assets ${where} ORDER BY label ASC`);
    return rows;
  },

  async create(input: {
    assetType: "vehicle" | "tricycle" | "hand_cart";
    label: string;
    vehicleNumber: string | null;
    chassisNumber: string | null;
  }): Promise<AssetRow> {
    const { rows } = await pool.query<AssetRow>(
      `INSERT INTO assets (asset_type, label, vehicle_number, chassis_number) VALUES ($1,$2,$3,$4) RETURNING *`,
      [input.assetType, input.label, input.vehicleNumber, input.chassisNumber],
    );
    return rows[0]!;
  },

  /** Finds an asset by its vehicle_number - used to link a driver/assistant to an existing asset by a human-readable reference rather than an internal id. */
  async findByVehicleNumber(vehicleNumber: string): Promise<AssetRow | null> {
    const { rows } = await pool.query<AssetRow>(`SELECT * FROM assets WHERE vehicle_number = $1 LIMIT 1`, [vehicleNumber]);
    return rows[0] ?? null;
  },

  async updateStatus(
    id: number,
    input: { currentStatus: "working" | "under_repair" | "not_working"; notWorkingSince: string | null; soundSystemStatus: string | null; batteryStatus: string | null },
  ): Promise<AssetRow | null> {
    const { rows } = await pool.query<AssetRow>(
      `UPDATE assets SET current_status = $2, not_working_since = $3, sound_system_status = $4, battery_status = $5 WHERE id = $1 RETURNING *`,
      [id, input.currentStatus, input.notWorkingSince, input.soundSystemStatus, input.batteryStatus],
    );
    return rows[0] ?? null;
  },

  async setActive(id: number, active: boolean): Promise<AssetRow | null> {
    const { rows } = await pool.query<AssetRow>(`UPDATE assets SET active = $2 WHERE id = $1 RETURNING *`, [id, active]);
    return rows[0] ?? null;
  },

  /** Full replace of an asset's assigned wards - the fixed set it regularly serves. */
  async setWards(assetId: number, wardIds: number[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM asset_wards WHERE asset_id = $1`, [assetId]);
      for (const wardId of wardIds) {
        await client.query(`INSERT INTO asset_wards (asset_id, ward_id) VALUES ($1, $2)`, [assetId, wardId]);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async listWardIdsForAsset(assetId: number): Promise<number[]> {
    const { rows } = await pool.query<{ ward_id: number }>(`SELECT ward_id FROM asset_wards WHERE asset_id = $1`, [assetId]);
    return rows.map((r) => r.ward_id);
  },

  async listWardIdsForAssetMany(assetIds: number[]): Promise<Map<number, number[]>> {
    const map = new Map<number, number[]>();
    if (assetIds.length === 0) return map;
    const { rows } = await pool.query<{ asset_id: number; ward_id: number }>(
      `SELECT asset_id, ward_id FROM asset_wards WHERE asset_id = ANY($1::bigint[])`,
      [assetIds],
    );
    for (const row of rows) {
      const existing = map.get(row.asset_id) ?? [];
      existing.push(row.ward_id);
      map.set(row.asset_id, existing);
    }
    return map;
  },
};
