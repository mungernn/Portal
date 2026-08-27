import { pool } from "../config/db";
import type { Pool, PoolClient } from "pg";

export interface CancellationRequestRow {
  id: number;
  request_type: "demand_notice" | "receipt";
  target_id: string;
  holding_no: string;
  reason: string;
  requested_by: string;
  requested_at: Date;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_notes: string | null;
}

export const cancellationRequestRepository = {
  async create(input: {
    requestType: "demand_notice" | "receipt";
    targetId: string;
    holdingNo: string;
    reason: string;
    requestedBy: string;
  }): Promise<CancellationRequestRow> {
    const { rows } = await pool.query<CancellationRequestRow>(
      `INSERT INTO cancellation_requests (request_type, target_id, holding_no, reason, requested_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [input.requestType, input.targetId, input.holdingNo, input.reason, input.requestedBy],
    );
    return rows[0]!;
  },

  async findById(id: number): Promise<CancellationRequestRow | null> {
    const { rows } = await pool.query<CancellationRequestRow>(`SELECT * FROM cancellation_requests WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  /** Blocks a duplicate request for something already pending review. */
  async findPendingForTarget(requestType: "demand_notice" | "receipt", targetId: string): Promise<CancellationRequestRow | null> {
    const { rows } = await pool.query<CancellationRequestRow>(
      `SELECT * FROM cancellation_requests WHERE request_type = $1 AND target_id = $2 AND status = 'pending' LIMIT 1`,
      [requestType, targetId],
    );
    return rows[0] ?? null;
  },

  async listPending(): Promise<CancellationRequestRow[]> {
    const { rows } = await pool.query<CancellationRequestRow>(
      `SELECT * FROM cancellation_requests WHERE status = 'pending' ORDER BY requested_at ASC`,
    );
    return rows;
  },

  async list(filters: { status?: "pending" | "approved" | "rejected" }): Promise<CancellationRequestRow[]> {
    if (filters.status) {
      const { rows } = await pool.query<CancellationRequestRow>(
        `SELECT * FROM cancellation_requests WHERE status = $1 ORDER BY requested_at DESC`,
        [filters.status],
      );
      return rows;
    }
    const { rows } = await pool.query<CancellationRequestRow>(`SELECT * FROM cancellation_requests ORDER BY requested_at DESC`);
    return rows;
  },

  /** Atomic: only succeeds if the request is still pending - guards against double-approval/rejection. */
  async finalize(
    id: number,
    status: "approved" | "rejected",
    reviewedBy: string,
    reviewNotes: string | null,
    client: Pool | PoolClient = pool,
  ): Promise<CancellationRequestRow | null> {
    const { rows } = await client.query<CancellationRequestRow>(
      `UPDATE cancellation_requests
       SET status = $2, reviewed_by = $3, reviewed_at = now(), review_notes = $4
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id, status, reviewedBy, reviewNotes],
    );
    return rows[0] ?? null;
  },
};
