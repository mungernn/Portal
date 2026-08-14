import { pool } from "../config/db";
import type { ShopAgreementChangeApprovalRow, ShopAgreementChangeRequestRow, ShopAgreementSaveInput } from "../types/shop.types";
import type { AdminRole } from "../types/admin.types";
import { SHOP_APPROVAL_STAGE_ORDER } from "../types/admin.types";

export type ShopChangeRequestStatus = "pending" | "approved" | "rejected";

export const shopAgreementChangeRequestRepository = {
  async create(
    shopNo: string,
    agreementId: number | null,
    requestedBy: string,
    changeReason: string,
    proposedData: ShopAgreementSaveInput,
    approvalTier: "full" | "data_completion",
    finalStage: AdminRole,
  ): Promise<ShopAgreementChangeRequestRow> {
    const { rows } = await pool.query<ShopAgreementChangeRequestRow>(
      `INSERT INTO shop_agreement_change_requests (
        shop_no, agreement_id, requested_by, change_reason, proposed_data, current_stage,
        approval_tier, final_stage
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [shopNo, agreementId, requestedBy, changeReason, JSON.stringify(proposedData), SHOP_APPROVAL_STAGE_ORDER[0], approvalTier, finalStage],
    );
    return rows[0]!;
  },

  async findById(id: number): Promise<ShopAgreementChangeRequestRow | null> {
    const { rows } = await pool.query<ShopAgreementChangeRequestRow>(
      `SELECT * FROM shop_agreement_change_requests WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  async list(filters: { status?: ShopChangeRequestStatus; stage?: AdminRole }): Promise<ShopAgreementChangeRequestRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }
    if (filters.stage) {
      params.push(filters.stage);
      conditions.push(`current_stage = $${params.length}`);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await pool.query<ShopAgreementChangeRequestRow>(
      `SELECT * FROM shop_agreement_change_requests ${where} ORDER BY requested_at DESC`,
      params,
    );
    return rows;
  },

  async listApprovalsFor(changeRequestId: number): Promise<ShopAgreementChangeApprovalRow[]> {
    const { rows } = await pool.query<ShopAgreementChangeApprovalRow>(
      `SELECT * FROM shop_agreement_change_approvals WHERE change_request_id = $1 ORDER BY decided_at ASC`,
      [changeRequestId],
    );
    return rows;
  },

  async recordApprovalLogEntry(
    changeRequestId: number,
    stage: AdminRole,
    decision: "approved" | "rejected",
    adminUsername: string,
    adminDisplayName: string,
    notes: string | null,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO shop_agreement_change_approvals (
        change_request_id, stage, decision, admin_username, admin_display_name, notes
      ) VALUES ($1,$2,$3,$4,$5,$6)`,
      [changeRequestId, stage, decision, adminUsername, adminDisplayName, notes],
    );
    await pool.query(
      `UPDATE shop_agreement_change_requests
       SET reviewed_by = $2, reviewed_role = $3, reviewed_at = now(), review_notes = $4
       WHERE id = $1`,
      [changeRequestId, adminDisplayName, stage, notes],
    );
  },

  async advanceStage(id: number, fromStage: AdminRole, toStage: AdminRole): Promise<ShopAgreementChangeRequestRow | null> {
    const { rows } = await pool.query<ShopAgreementChangeRequestRow>(
      `UPDATE shop_agreement_change_requests
       SET current_stage = $3
       WHERE id = $1 AND status = 'pending' AND current_stage = $2
       RETURNING *`,
      [id, fromStage, toStage],
    );
    return rows[0] ?? null;
  },

  async finalize(id: number, atStage: AdminRole, status: "approved" | "rejected"): Promise<ShopAgreementChangeRequestRow | null> {
    const { rows } = await pool.query<ShopAgreementChangeRequestRow>(
      `UPDATE shop_agreement_change_requests
       SET status = $3, final_decided_at = now()
       WHERE id = $1 AND status = 'pending' AND current_stage = $2
       RETURNING *`,
      [id, atStage, status],
    );
    return rows[0] ?? null;
  },
};