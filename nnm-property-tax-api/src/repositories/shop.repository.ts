import { pool } from "../config/db";
import type { ShopRow, ShopAgreementRow } from "../types/shop.types";

export const shopRepository = {
  async findByShopNo(shopNo: string): Promise<ShopRow | null> {
    const { rows } = await pool.query<ShopRow>(`SELECT * FROM shops WHERE shop_no = $1`, [shopNo]);
    return rows[0] ?? null;
  },

  async listAll(): Promise<ShopRow[]> {
    const { rows } = await pool.query<ShopRow>(`SELECT * FROM shops ORDER BY shop_no ASC`);
    return rows;
  },

  /** Total shop count — a lightweight COUNT for the dashboard summary widget, not a full row fetch. */
  async countAll(): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(`SELECT COUNT(*) AS count FROM shops`);
    return parseInt(rows[0]?.count ?? "0", 10);
  },

  /** Paginated shop list — for the dashboard overview widget's shops tab. */
  async listPaginated(page: number, pageSize: number): Promise<{ rows: ShopRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, total] = await Promise.all([
      pool.query<ShopRow>(`SELECT * FROM shops ORDER BY shop_no ASC LIMIT $1 OFFSET $2`, [pageSize, offset]),
      this.countAll(),
    ]);
    return { rows, total };
  },

  /** Distinct market names on file — feeds the operator's market dropdown. */
  async listDistinctMarketNames(): Promise<string[]> {
    const { rows } = await pool.query<{ market_name: string }>(
      `SELECT DISTINCT market_name FROM shops WHERE market_name IS NOT NULL ORDER BY market_name ASC`,
    );
    return rows.map((r) => r.market_name);
  },

  /** Shop physical-details CRUD is direct — no approval chain. Only agreement changes go through the 5-stage queue. */
  async upsert(shopNo: string, s: Record<string, unknown>, actorDisplayName: string, isNew: boolean): Promise<void> {
    if (isNew) {
      await pool.query(
        `INSERT INTO shops (
          shop_no, market_name, location, ward, area_sqft, total_area_sqft, built_up_area_sqft, status, created_by, created_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())`,
        [
          shopNo,
          s.marketName,
          s.location,
          s.ward,
          s.areaSqft,
          s.totalAreaSqft ?? null,
          s.builtUpAreaSqft ?? null,
          s.status ?? "vacant",
          actorDisplayName,
        ],
      );
      return;
    }
    await pool.query(
      `UPDATE shops SET
        market_name = $2, location = $3, ward = $4, area_sqft = $5, total_area_sqft = $6, built_up_area_sqft = $7, status = $8,
        last_modified_by = $9, last_modified_date = now()
       WHERE shop_no = $1`,
      [shopNo, s.marketName, s.location, s.ward, s.areaSqft, s.totalAreaSqft ?? null, s.builtUpAreaSqft ?? null, s.status, actorDisplayName],
    );
  },
};

export const shopAgreementRepository = {
  async findById(id: number): Promise<ShopAgreementRow | null> {
    const { rows } = await pool.query<ShopAgreementRow>(`SELECT * FROM shop_agreements WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  /** The one agreement currently in force for a shop, if any. A shop can have many agreements over time (history), but only one active. */
  async findActiveByShopNo(shopNo: string): Promise<ShopAgreementRow | null> {
    const { rows } = await pool.query<ShopAgreementRow>(
      `SELECT * FROM shop_agreements WHERE shop_no = $1 AND status = 'active' ORDER BY id DESC LIMIT 1`,
      [shopNo],
    );
    return rows[0] ?? null;
  },

  async listByShopNo(shopNo: string): Promise<ShopAgreementRow[]> {
    const { rows } = await pool.query<ShopAgreementRow>(
      `SELECT * FROM shop_agreements WHERE shop_no = $1 ORDER BY id DESC`,
      [shopNo],
    );
    return rows;
  },

  async listAll(): Promise<ShopAgreementRow[]> {
    const { rows } = await pool.query<ShopAgreementRow>(`SELECT * FROM shop_agreements ORDER BY id DESC`);
    return rows;
  },

  /** Called only after the full approval chain finalizes — never directly from an operator submission. Always inserted as data_status='complete' — a brand new agreement is never "partial" by definition. */
  async insert(shopNo: string, a: Record<string, unknown>, actorDisplayName: string): Promise<ShopAgreementRow> {
    const { rows } = await pool.query<ShopAgreementRow>(
      `INSERT INTO shop_agreements (
        shop_no, agreement_number, agreement_holder_name, demand_register_holder_name, holder_name,
        holder_relation_type, holder_relation_name, holder_mobile, holder_address, id_proof_number, business_name,
        agreement_rent, demand_register_rent, base_monthly_rent,
        rent_pre_2019, rent_2019_20, rent_2020_21_onwards,
        agreement_start_date, agreement_end_date, security_deposit,
        misc_cost, misc_cost_reason, misc_rebate, misc_rebate_reason,
        joint_holder_name, joint_holder_relation, joint_holder_id_proof_number, notes, data_status,
        status, created_by, created_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,'complete','active',$29, now())
      RETURNING *`,
      [
        shopNo,
        a.agreementNumber ?? null,
        a.agreementHolderName ?? null,
        a.demandRegisterHolderName ?? null,
        a.holderName,
        a.holderRelationType ?? null,
        a.holderRelationName ?? null,
        a.holderMobile ?? null,
        a.holderAddress ?? null,
        a.idProofNumber ?? null,
        a.businessName ?? null,
        a.agreementRent ?? null,
        a.demandRegisterRent ?? null,
        a.baseMonthlyRent,
        a.rentPre2019 ?? null,
        a.rent201920 ?? null,
        a.rent202021Onwards ?? null,
        a.agreementStartDate ?? null,
        a.agreementEndDate ?? null,
        a.securityDeposit ?? 0,
        a.miscCost ?? 0,
        a.miscCostReason ?? null,
        a.miscRebate ?? 0,
        a.miscRebateReason ?? null,
        a.jointHolderName ?? null,
        a.jointHolderRelation ?? null,
        a.jointHolderIdProofNumber ?? null,
        a.notes ?? null,
        actorDisplayName,
      ],
    );
    return rows[0]!;
  },

  /**
   * Applying an edit to an EXISTING agreement — also only called
   * post-approval. dataStatus is passed explicitly by the caller
   * (shopAgreement.service.ts): a 'data_completion' tier approval flips
   * a partial record to 'complete'; a 'full' tier approval on an
   * already-complete record leaves it complete.
   */
  async update(
    id: number,
    a: Record<string, unknown>,
    actorDisplayName: string,
    dataStatus: "complete" | "partial",
  ): Promise<ShopAgreementRow> {
    const { rows } = await pool.query<ShopAgreementRow>(
      `UPDATE shop_agreements SET
        agreement_number = $2, agreement_holder_name = $3, demand_register_holder_name = $4, holder_name = $5,
        holder_relation_type = $6, holder_relation_name = $7, holder_mobile = $8, holder_address = $9, id_proof_number = $10,
        business_name = $11, agreement_rent = $12, demand_register_rent = $13, base_monthly_rent = $14,
        rent_pre_2019 = $15, rent_2019_20 = $16, rent_2020_21_onwards = $17,
        agreement_start_date = $18, agreement_end_date = $19, security_deposit = $20,
        misc_cost = $21, misc_cost_reason = $22, misc_rebate = $23, misc_rebate_reason = $24,
        joint_holder_name = $25, joint_holder_relation = $26, joint_holder_id_proof_number = $27,
        notes = $28, data_status = $29, last_modified_by = $30, last_modified_date = now()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        a.agreementNumber ?? null,
        a.agreementHolderName ?? null,
        a.demandRegisterHolderName ?? null,
        a.holderName,
        a.holderRelationType ?? null,
        a.holderRelationName ?? null,
        a.holderMobile ?? null,
        a.holderAddress ?? null,
        a.idProofNumber ?? null,
        a.businessName ?? null,
        a.agreementRent ?? null,
        a.demandRegisterRent ?? null,
        a.baseMonthlyRent,
        a.rentPre2019 ?? null,
        a.rent201920 ?? null,
        a.rent202021Onwards ?? null,
        a.agreementStartDate ?? null,
        a.agreementEndDate ?? null,
        a.securityDeposit ?? 0,
        a.miscCost ?? 0,
        a.miscCostReason ?? null,
        a.miscRebate ?? 0,
        a.miscRebateReason ?? null,
        a.jointHolderName ?? null,
        a.jointHolderRelation ?? null,
        a.jointHolderIdProofNumber ?? null,
        a.notes ?? null,
        dataStatus,
        actorDisplayName,
      ],
    );
    return rows[0]!;
  },

  /** One-off: creates a partial/migrated agreement row directly, bypassing the approval queue — used only by the data-import script, never by operator-facing endpoints. */
  async insertPartial(shopNo: string, a: Record<string, unknown>, actorDisplayName: string): Promise<ShopAgreementRow> {
    const { rows } = await pool.query<ShopAgreementRow>(
      `INSERT INTO shop_agreements (
        shop_no, agreement_number, agreement_holder_name, demand_register_holder_name, holder_name,
        holder_relation_type, holder_relation_name, holder_mobile, holder_address, id_proof_number, business_name,
        agreement_rent, demand_register_rent, base_monthly_rent,
        rent_pre_2019, rent_2019_20, rent_2020_21_onwards,
        agreement_start_date, agreement_end_date, security_deposit,
        misc_cost, misc_cost_reason, misc_rebate, misc_rebate_reason,
        joint_holder_name, joint_holder_relation, joint_holder_id_proof_number, notes, data_status,
        rent_paid_till_month, status, created_by, created_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,'partial',$29,'active',$30, now())
      RETURNING *`,
      [
        shopNo,
        a.agreementNumber ?? null,
        a.agreementHolderName ?? null,
        a.demandRegisterHolderName ?? null,
        a.holderName,
        a.holderRelationType ?? null,
        a.holderRelationName ?? null,
        a.holderMobile ?? null,
        a.holderAddress ?? null,
        a.idProofNumber ?? null,
        a.businessName ?? null,
        a.agreementRent ?? null,
        a.demandRegisterRent ?? null,
        a.baseMonthlyRent,
        a.rentPre2019 ?? null,
        a.rent201920 ?? null,
        a.rent202021Onwards ?? null,
        a.agreementStartDate ?? null,
        a.agreementEndDate ?? null,
        a.securityDeposit ?? 0,
        a.miscCost ?? 0,
        a.miscCostReason ?? null,
        a.miscRebate ?? 0,
        a.miscRebateReason ?? null,
        a.jointHolderName ?? null,
        a.jointHolderRelation ?? null,
        a.jointHolderIdProofNumber ?? null,
        a.notes ?? null,
        a.rentPaidTillMonth ?? null,
        actorDisplayName,
      ],
    );
    return rows[0]!;
  },

  async updateRentPaidTillMonth(id: number, yearMonth: string): Promise<void> {
    await pool.query(`UPDATE shop_agreements SET rent_paid_till_month = $2 WHERE id = $1`, [id, yearMonth]);
  },
};