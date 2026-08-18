import { pool } from "../config/db";
import type { FloorRow, PropertyRow, TaxHistoryStageRow } from "../types/property.types";

export const propertyRepository = {
  /** Port of getNextHoldingNoForSeries_() — finds the highest existing number under a prefix. */
  async getMaxHoldingNoUnderPrefix(prefix: string): Promise<number> {
    const { rows } = await pool.query<{ holding_no: string }>(
      `SELECT holding_no FROM properties WHERE holding_no LIKE $1`,
      [`${prefix}%`],
    );
    let maxNum = 0;
    const pattern = new RegExp(`^${prefix.replace("-", "\\-")}(\\d+)$`);
    for (const row of rows) {
      const match = row.holding_no.trim().match(pattern);
      if (match) {
        const n = parseInt(match[1]!, 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return maxNum;
  },

  async findByHoldingNo(holdingNo: string): Promise<PropertyRow | null> {
    const { rows } = await pool.query<PropertyRow>(
      `SELECT * FROM properties WHERE holding_no = $1 LIMIT 1`,
      [holdingNo],
    );
    return rows[0] ?? null;
  },

  async findFloorsByHoldingNo(holdingNo: string): Promise<FloorRow[]> {
    const { rows } = await pool.query<FloorRow>(
      `SELECT * FROM floors WHERE holding_no = $1 ORDER BY id ASC`,
      [holdingNo],
    );
    return rows;
  },

  async findTaxHistoryByHoldingNo(holdingNo: string): Promise<TaxHistoryStageRow[]> {
    const { rows } = await pool.query<TaxHistoryStageRow>(
      `SELECT * FROM tax_history_stages WHERE holding_no = $1 ORDER BY start_year_used ASC`,
      [holdingNo],
    );
    return rows;
  },

  /** Every holding that has at least one floor on file — used by the bulk tax-history backfill. */
  async listAllHoldingNosWithFloors(): Promise<string[]> {
    const { rows } = await pool.query<{ holding_no: string }>(
      `SELECT DISTINCT p.holding_no FROM properties p JOIN floors f ON f.holding_no = p.holding_no ORDER BY p.holding_no`,
    );
    return rows.map((r) => r.holding_no);
  },

  /** Every property on file — used by the admin data export. */
  async findAll(): Promise<PropertyRow[]> {
    const { rows } = await pool.query<PropertyRow>(`SELECT * FROM properties ORDER BY holding_no ASC`);
    return rows;
  },

  /** Total holding count — a lightweight COUNT for the dashboard summary widget, not a full row fetch. */
  async countAll(): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(`SELECT COUNT(*) AS count FROM properties`);
    return parseInt(rows[0]?.count ?? "0", 10);
  },

  /** Every distinct ward value actually in use on file - there's no canonical ward list elsewhere, so this is the ward picker's data source (e.g. for tax collector ward-tagging). */
  async listDistinctWards(): Promise<string[]> {
    const { rows } = await pool.query<{ ward: string }>(
      `SELECT DISTINCT ward FROM properties WHERE ward IS NOT NULL AND ward != '' ORDER BY ward ASC`,
    );
    return rows.map((r) => r.ward);
  },

  /** Paginated holding list — for the dashboard overview widget's holdings tab. */
  async listPaginated(page: number, pageSize: number): Promise<{ rows: PropertyRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, total] = await Promise.all([
      pool.query<PropertyRow>(`SELECT * FROM properties ORDER BY holding_no ASC LIMIT $1 OFFSET $2`, [pageSize, offset]),
      this.countAll(),
    ]);
    return { rows, total };
  },
};