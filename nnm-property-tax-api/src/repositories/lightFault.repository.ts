import { pool } from "../config/db";
import type { LightFaultRow } from "../types/streetlight.types";

export const lightFaultRepository = {
  async findById(id: number): Promise<LightFaultRow | null> {
    const { rows } = await pool.query<LightFaultRow>(`SELECT * FROM light_faults WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async listAll(status?: "open" | "repaired"): Promise<LightFaultRow[]> {
    if (status) {
      const { rows } = await pool.query<LightFaultRow>(`SELECT * FROM light_faults WHERE status = $1 ORDER BY reported_at DESC`, [status]);
      return rows;
    }
    const { rows } = await pool.query<LightFaultRow>(`SELECT * FROM light_faults ORDER BY reported_at DESC`);
    return rows;
  },

  /** Every open fault whose 72-hour deadline has already passed - the working set for penalty accrual and for contractor/oversight dashboards. */
  async listOpenPastDeadline(): Promise<LightFaultRow[]> {
    const { rows } = await pool.query<LightFaultRow>(
      `SELECT * FROM light_faults WHERE status = 'open' AND deadline_at < now() ORDER BY deadline_at ASC`,
    );
    return rows;
  },

  async listByContractor(contractorId: number, status?: "open" | "repaired"): Promise<LightFaultRow[]> {
    if (status) {
      const { rows } = await pool.query<LightFaultRow>(
        `SELECT * FROM light_faults WHERE assigned_contractor_id = $1 AND status = $2 ORDER BY reported_at DESC`,
        [contractorId, status],
      );
      return rows;
    }
    const { rows } = await pool.query<LightFaultRow>(
      `SELECT * FROM light_faults WHERE assigned_contractor_id = $1 ORDER BY reported_at DESC`,
      [contractorId],
    );
    return rows;
  },

  async create(input: {
    lightId: number | null;
    reportedGpsLat: number | null;
    reportedGpsLng: number | null;
    deadlineAt: Date;
    reportedByType: "staff" | "public";
    reportedByUserId: number | null;
    reporterPhone: string | null;
    reporterNotes: string | null;
    assignedContractorId: number | null;
  }): Promise<LightFaultRow> {
    const { rows } = await pool.query<LightFaultRow>(
      `INSERT INTO light_faults
         (light_id, reported_gps_lat, reported_gps_lng, deadline_at, reported_by_type, reported_by_user_id, reporter_phone, reporter_notes, assigned_contractor_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        input.lightId,
        input.reportedGpsLat,
        input.reportedGpsLng,
        input.deadlineAt,
        input.reportedByType,
        input.reportedByUserId,
        input.reporterPhone,
        input.reporterNotes,
        input.assignedContractorId,
      ],
    );
    return rows[0]!;
  },

  async markRepaired(id: number, repairedByUserId: number, repairNotes: string | null): Promise<LightFaultRow | null> {
    // Atomic WHERE status='open' guard - prevents a fault being marked repaired twice (and generating a second, incorrect "repaired" state change) if two requests race.
    const { rows } = await pool.query<LightFaultRow>(
      `UPDATE light_faults SET status = 'repaired', repaired_at = now(), repaired_by_user_id = $2, repair_notes = $3
       WHERE id = $1 AND status = 'open' RETURNING *`,
      [id, repairedByUserId, repairNotes],
    );
    return rows[0] ?? null;
  },

  /** Links a fault reported without a matched light (public report, unreadable serial) to a registry entry once staff identify it - COALESCE keeps any contractor already assigned rather than overwriting it. */
  async linkToLight(id: number, lightId: number, contractorId: number | null): Promise<LightFaultRow | null> {
    const { rows } = await pool.query<LightFaultRow>(
      `UPDATE light_faults SET light_id = $2, assigned_contractor_id = COALESCE(assigned_contractor_id, $3) WHERE id = $1 RETURNING *`,
      [id, lightId, contractorId],
    );
    return rows[0] ?? null;
  },
};
