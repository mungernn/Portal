import { pool } from "../config/db";
import type { PropertyRow, FloorRow } from "../types/property.types";
import type { FloorInput } from "../types/propertySave.types";

export const propertySaveRepository = {
  async upsertProperty(
    holdingNo: string,
    p: Record<string, unknown>,
    operatorDisplayName: string,
    isNew: boolean,
  ): Promise<void> {
    if (isNew) {
      await pool.query(
        `INSERT INTO properties (
          holding_no, old_holding_no, old_pid, owner_name, relation_type, relation_name,
          mobile_no, area_sqft, address, ward, zone, pincode, assessment_year, road_type,
          vacant_area_sqft, rain_water_harvesting, arrear_tax,
          solid_waste_charge_type, solid_waste_months, solid_waste_charge,
          penal_charge, water_charge, boring_charge, form_fee,
          misc_cost, misc_cost_reason, misc_rebate, misc_rebate_reason,
          penalty, outstanding_demand,
          arv, tax_payable, holding_creation_year, tax_paid_till_year,
          present_holding_name, present_category,
          created_by, created_date, last_modified_by, last_modified_date
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,
          $37, now(), $37, now()
        )`,
        [
          holdingNo,
          p.oldHoldingNo,
          p.oldPid,
          p.ownerName,
          p.relationType,
          p.relationName,
          p.mobileNo,
          p.areaSqft,
          p.address,
          p.ward,
          p.zone,
          p.pincode,
          p.assessmentYear,
          p.roadType,
          p.vacantAreaSqft,
          p.rainWaterHarvesting,
          p.arrearTax,
          p.solidWasteChargeType,
          p.solidWasteMonths,
          p.solidWasteCharge,
          p.penalCharge,
          p.waterCharge,
          p.boringCharge,
          p.formFee,
          p.miscCost,
          p.miscCostReason,
          p.miscRebate,
          p.miscRebateReason,
          p.penalty,
          p.outstandingDemand,
          p.arv,
          p.taxPayable,
          p.holdingCreationYear,
          p.taxPaidTillYear,
          p.presentHoldingName,
          p.presentCategory,
          operatorDisplayName,
        ],
      );
      return;
    }

    await pool.query(
      `UPDATE properties SET
        old_holding_no = $2, old_pid = $3, owner_name = $4, relation_type = $5, relation_name = $6,
        mobile_no = $7, area_sqft = $8, address = $9, ward = $10, zone = $11, pincode = $12,
        assessment_year = $13, road_type = $14, vacant_area_sqft = $15, rain_water_harvesting = $16,
        arrear_tax = $17, solid_waste_charge_type = $18, solid_waste_months = $19, solid_waste_charge = $20,
        penal_charge = $21, water_charge = $22, boring_charge = $23, form_fee = $24,
        misc_cost = $25, misc_cost_reason = $26, misc_rebate = $27, misc_rebate_reason = $28,
        penalty = $29, outstanding_demand = $30,
        arv = $31, tax_payable = $32, holding_creation_year = $33, tax_paid_till_year = $34,
        present_holding_name = $35, present_category = $36,
        last_modified_by = $37, last_modified_date = now()
      WHERE holding_no = $1`,
      [
        holdingNo,
        p.oldHoldingNo,
        p.oldPid,
        p.ownerName,
        p.relationType,
        p.relationName,
        p.mobileNo,
        p.areaSqft,
        p.address,
        p.ward,
        p.zone,
        p.pincode,
        p.assessmentYear,
        p.roadType,
        p.vacantAreaSqft,
        p.rainWaterHarvesting,
        p.arrearTax,
        p.solidWasteChargeType,
        p.solidWasteMonths,
        p.solidWasteCharge,
        p.penalCharge,
        p.waterCharge,
        p.boringCharge,
        p.formFee,
        p.miscCost,
        p.miscCostReason,
        p.miscRebate,
        p.miscRebateReason,
        p.penalty,
        p.outstandingDemand,
        p.arv,
        p.taxPayable,
        p.holdingCreationYear,
        p.taxPaidTillYear,
        p.presentHoldingName,
        p.presentCategory,
        operatorDisplayName,
      ],
    );
  },

  async replaceFloors(
    holdingNo: string,
    floors: (FloorInput & { floorArv: number; floorTax: number })[],
  ): Promise<void> {
    await pool.query("DELETE FROM floors WHERE holding_no = $1", [holdingNo]);

    for (const f of floors) {
      await pool.query(
        `INSERT INTO floors (
          holding_no, floor_label, buildup_sqft, const_type, usage_type,
          occupancy, year_built, closing_year, floor_arv, floor_tax
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          holdingNo,
          f.floorLabel,
          f.buildupSqft,
          f.constType,
          f.usageType,
          f.occupancy,
          f.yearBuilt ?? null,
          f.closingYear ?? null,
          f.floorArv,
          f.floorTax,
        ],
      );
    }
  },

  async insertTaxHistoryStage(
    holdingNo: string,
    stage: {
      periodOfAssessment: string;
      startYearUsed: number;
      closingYear: number;
      arvInPeriod: number;
      taxRateInPeriod: number;
      annualTaxAmount: number;
      yearsCount: number;
      totalAmount: number;
    },
    addedBy: string,
    autoGenerated: boolean = false,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO tax_history_stages (
        holding_no, period_of_assessment, start_year_used, closing_year,
        arv_in_period, tax_rate_in_period, annual_tax_amount, years_count,
        total_amount, added_by, added_date, auto_generated
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now(), $11)`,
      [
        holdingNo,
        stage.periodOfAssessment,
        stage.startYearUsed,
        stage.closingYear,
        stage.arvInPeriod,
        stage.taxRateInPeriod,
        stage.annualTaxAmount,
        stage.yearsCount,
        stage.totalAmount,
        addedBy,
        autoGenerated,
      ],
    );
  },

  /** Wipes prior system-derived stages for this holding before regenerating fresh ones from current Floors — never touches manually-entered/migrated rows. */
  async deleteAutoGeneratedTaxHistoryStages(holdingNo: string): Promise<void> {
    await pool.query(`DELETE FROM tax_history_stages WHERE holding_no = $1 AND auto_generated = TRUE`, [holdingNo]);
  },

  async nextHistoryVersion(holdingNo: string): Promise<number> {
    const { rows } = await pool.query<{ max: number | null }>(
      `SELECT max(version) AS max FROM property_history WHERE holding_no = $1`,
      [holdingNo],
    );
    return (rows[0]?.max ?? 0) + 1;
  },

  async insertHistory(
    holdingNo: string,
    version: number,
    action: "Created" | "Updated",
    changeBasis: string | null,
    changeReference: string | null,
    operatorDisplayName: string,
    snapshot: unknown,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO property_history (
        holding_no, version, action, change_basis, change_reference, operator_name, ts, snapshot
      ) VALUES ($1,$2,$3,$4,$5,$6, now(), $7)`,
      [holdingNo, version, action, changeBasis, changeReference, operatorDisplayName, JSON.stringify(snapshot)],
    );
  },
};

export type { PropertyRow, FloorRow };